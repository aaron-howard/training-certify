import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { count, eq } from 'drizzle-orm'
import { getDbOrThrow } from '../db/db.server'
import {
  auditLogs,
  notifications,
  teams,
  userCertifications,
  userTeams,
  users,
} from '../db/schema'
import { getVerifiedAuth } from '../lib/auth.server'
import { RateLimitPresets, requireRateLimit } from '../lib/rateLimit.server'
import { getCSRFTokenFromRequest, requireCSRFToken } from '../lib/csrf.server'
import * as Errors from '../lib/errors'
import { NotFoundError, ValidationError } from '../lib/errors'
import { UpdateUserSchema } from '../lib/validation'
import { logInfo } from '../lib/logging.server'
import {
  handleApiError,
  setupMutationHandler,
  setupReadHandler,
} from '../lib/api-helpers.server'
import { invalidateCache } from '../lib/cache.server'
import {
  createPaginatedResponse,
  parsePaginationParams,
} from '../lib/pagination.server'

export const Route = createFileRoute('/api/users')({
  server: {
    handlers: {
      /**
       * GET /api/users
       *
       * Retrieves a list of all users in the system.
       *
       * **Authentication:** Required
       * **Authorization:** Admin, Auditor, or Executive roles only
       * **Rate Limiting:** None (read operation)
       *
       * @returns JSON response with array of user objects
       * @throws {ForbiddenError} If user doesn't have required role
       * @throws {UnauthorizedError} If user is not authenticated
       *
       * @example Response:
       * ```json
       * [
       *   { "id": "user_123", "name": "John Doe", "email": "john@example.com", "role": "User" },
       *   { "id": "user_456", "name": "Jane Smith", "email": "jane@example.com", "role": "Admin" }
       * ]
       * ```
       */
      GET: async ({ request }) => {
        try {
          await setupReadHandler(request, {
            allowedRoles: ['Admin', 'Auditor', 'Executive'],
          })
          const db = await getDbOrThrow()
          const url = new URL(request.url)

          // Parse pagination parameters
          const { page, limit } = parsePaginationParams(url, 20, 100)
          const offset = (page - 1) * limit

          // Get total count and paginated data
          const [totalResult] = await db.select({ count: count() }).from(users)
          const total = totalResult.count

          const data = await db.select().from(users).limit(limit).offset(offset)

          const paginatedResponse = createPaginatedResponse(
            data,
            total,
            page,
            limit,
          )

          return json(paginatedResponse, {
            headers: {
              'Cache-Control': 'private, max-age=180', // 3 minutes browser cache (private - user data)
            },
          })
        } catch (error) {
          return handleApiError(error, 'GET /api/users')
        }
      },
      /**
       * POST /api/users
       *
       * Creates or ensures a user record exists in the database.
       * This endpoint is typically called during user signup to sync Clerk user data
       * with the application database.
       *
       * **Authentication:** Required (via Clerk)
       * **Authorization:** User can create their own record, or Admin can create any record
       * **Rate Limiting:** MUTATION preset (30 requests per minute)
       * **CSRF Protection:** Required
       *
       * @param request - HTTP request containing JSON body with user data:
       *   - id: string (required) - User ID from Clerk
       *   - name: string (required) - User's full name
       *   - email: string (required) - User's email address
       *   - avatarUrl?: string (optional) - URL to user's avatar image
       *   - role?: string (optional) - User role (defaults to 'User', only Admin can set other roles)
       *
       * @returns JSON response with created/updated user object (status 201 for new, 200 for existing)
       * @throws {ForbiddenError} If non-admin tries to create another user's record
       * @throws {UnauthorizedError} If user is not authenticated
       * @throws {ValidationError} If input data is invalid
       *
       * @example Request:
       * ```json
       * {
       *   "id": "user_123",
       *   "name": "John Doe",
       *   "email": "john@example.com",
       *   "avatarUrl": "https://example.com/avatar.jpg"
       * }
       * ```
       */
      POST: async ({ request }) => {
        try {
          // 1. Authenticate the requester via Clerk
          const authenticatedId = await getVerifiedAuth()

          // 2. Rate Limit based on the authenticated user
          // Use MUTATION preset (30/min) instead of AUTH (5/min) because
          // POST /api/users is an idempotent "ensure user exists" operation
          // called by multiple pages on load, not a login attempt
          await requireRateLimit(authenticatedId, RateLimitPresets.MUTATION)

          requireCSRFToken(getCSRFTokenFromRequest(request))

          const data = await request.json()
          logInfo(`Requester ${authenticatedId} ensuring user: ${data.id}`, {
            route: 'POST /api/users',
            requester: authenticatedId,
            targetUserId: data.id,
          })

          const db = await getDbOrThrow()

          // 3. Security Check: Is the requester allowed to ensure this ID?
          // They must be ensuring themselves, OR they must be an Admin.
          if (authenticatedId !== data.id) {
            const requester = await db
              .select({ role: users.role })
              .from(users)
              .where(eq(users.id, authenticatedId))
              .limit(1)

            if (!requester.length || requester[0].role !== 'Admin') {
              throw new Errors.ForbiddenError(
                'You can only ensure your own user record unless you are an Admin',
              )
            }
          }

          // 4. Role Protection: Non-admins cannot set a role other than 'User'
          // We'll fetch the requester's role again (or use the one we just fetched if applicable)
          const requesterRecord = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, authenticatedId))
            .limit(1)

          const isRequesterAdmin =
            requesterRecord.length > 0 && requesterRecord[0].role === 'Admin'

          if (!isRequesterAdmin && data.role && data.role !== 'User') {
            data.role = 'User'
          }

          // Check if user already exists
          const existing = await db
            .select()
            .from(users)
            .where(eq(users.id, data.id))
            .limit(1)

          if (existing.length > 0) return json(existing[0])

          // Create user with a transaction to handle potential email conflicts safely
          try {
            const defaultRole = data.role || 'User'
            const result = await db
              .insert(users)
              .values({
                id: data.id,
                name: data.name,
                email: data.email,
                avatarUrl: data.avatarUrl,
                role: defaultRole,
              })
              .returning()

            // Invalidate users cache
            invalidateCache('users:')

            return json(result[0], { status: 201 })
          } catch (error) {
            const insertError = error as { code?: string; detail?: string }
            // Handle duplicate email (migration case)
            if (
              insertError.code === '23505' &&
              insertError.detail?.includes('email')
            ) {
              logInfo(
                'Detected duplicate email with new ID. Starting migration',
                {
                  route: 'POST /api/users',
                  email: data.email,
                  newUserId: data.id,
                },
              )

              const existingUser = await db
                .select()
                .from(users)
                .where(eq(users.email, data.email))
                .limit(1)

              if (!existingUser.length) throw error

              const oldUserId = existingUser[0].id

              await db.transaction(async (tx) => {
                // Rename old user to avoid conflict during migration
                await tx
                  .update(users)
                  .set({ email: `${data.email}_migrated_${Date.now()}` })
                  .where(eq(users.id, oldUserId))

                // Insert new user record
                await tx.insert(users).values({
                  id: data.id,
                  name: data.name,
                  email: data.email,
                  avatarUrl: data.avatarUrl,
                  role: existingUser[0].role,
                })

                // Move all related data
                await tx
                  .update(userCertifications)
                  .set({ userId: data.id })
                  .where(eq(userCertifications.userId, oldUserId))
                await tx
                  .update(notifications)
                  .set({ userId: data.id })
                  .where(eq(notifications.userId, oldUserId))
                await tx
                  .update(auditLogs)
                  .set({ userId: data.id })
                  .where(eq(auditLogs.userId, oldUserId))
                await tx
                  .update(userTeams)
                  .set({ userId: data.id })
                  .where(eq(userTeams.userId, oldUserId))
                await tx
                  .update(teams)
                  .set({ managerId: data.id })
                  .where(eq(teams.managerId, oldUserId))

                // Cleanup old user record
                await tx.delete(users).where(eq(users.id, oldUserId))
              })

              // Invalidate users cache after migration
              invalidateCache('users:')

              const newUser = await db
                .select()
                .from(users)
                .where(eq(users.id, data.id))
                .limit(1)
              return json(newUser[0], { status: 201 })
            }
            throw error
          }
        } catch (error) {
          // POST /api/users uses getVerifiedAuth() instead of requireRole() for custom auth logic
          // Still use handleApiError for consistent error responses
          return handleApiError(error, 'POST /api/users')
        }
      },
      PATCH: async ({ request }) => {
        try {
          await setupMutationHandler(request, {
            allowedRoles: ['Admin'],
          })

          const rawData = await request.json()
          const validation = UpdateUserSchema.safeParse(rawData)

          if (!validation.success) {
            throw new ValidationError(
              'Invalid update data',
              validation.error.errors,
            )
          }

          const data = validation.data
          const db = await getDbOrThrow()

          const updates: Partial<typeof users.$inferInsert> & {
            updatedAt: Date
          } = {
            ...data,
            updatedAt: new Date(),
          }
          // Remove ID from updates
          delete (updates as { id?: string }).id

          const result = await db
            .update(users)
            .set(updates)
            .where(eq(users.id, data.id))
            .returning()

          if (result.length === 0) throw new NotFoundError('User not found')

          // Invalidate users cache
          invalidateCache('users:')

          return json(result[0])
        } catch (error) {
          return handleApiError(error, 'PATCH /api/users')
        }
      },
      DELETE: async ({ request }) => {
        try {
          await setupMutationHandler(request, {
            allowedRoles: ['Admin'],
          })

          const url = new URL(request.url)
          const id = url.searchParams.get('id')
          if (!id) throw new ValidationError('Missing user ID')

          const db = await getDbOrThrow()

          await db.transaction(async (tx) => {
            await tx
              .delete(userCertifications)
              .where(eq(userCertifications.userId, id))
            await tx.delete(notifications).where(eq(notifications.userId, id))
            await tx.delete(userTeams).where(eq(userTeams.userId, id))
            await tx.delete(auditLogs).where(eq(auditLogs.userId, id))
            await tx
              .update(teams)
              .set({ managerId: null })
              .where(eq(teams.managerId, id))
            await tx.delete(users).where(eq(users.id, id))
          })

          // Invalidate users cache
          invalidateCache('users:')

          return json({ success: true })
        } catch (error) {
          return handleApiError(error, 'DELETE /api/users')
        }
      },
    },
  },
})

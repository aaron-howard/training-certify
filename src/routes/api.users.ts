import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDbOrThrow } from '../db/db.server'
import {
  auditLogs,
  notifications,
  teams,
  userCertifications,
  userTeams,
  users,
} from '../db/schema'
import { getVerifiedAuth, requireRole } from '../lib/auth.server'
import { RateLimitPresets, requireRateLimit } from '../lib/rateLimit.server'
import { getCSRFTokenFromRequest, requireCSRFToken } from '../lib/csrf.server'
import { AppError, ForbiddenError, UnauthorizedError, ValidationError } from '../lib/errors'
import { UpdateUserSchema } from '../lib/validation'

export const Route = createFileRoute('/api/users')({
  server: {
    handlers: {
      GET: async () => {
        try {
          await requireRole(['Admin', 'Auditor', 'Executive'])
          const db = await getDbOrThrow()
          const allUsers = await db.select().from(users)
          return json(allUsers)
        } catch (error) {
          if (error instanceof AppError) {
            return json({ error: error.message, code: error.code }, { status: error.statusCode })
          }
          console.error('❌ [API Users GET] Unexpected Error:', error)
          return json({ error: 'Internal server error' }, { status: 500 })
        }
      },
      POST: async ({ request }) => {
        try {
          // 1. Authenticate the requester via Clerk
          const authenticatedId = await getVerifiedAuth()

          // 2. Rate Limit based on the authenticated user
          await requireRateLimit(authenticatedId, RateLimitPresets.AUTH)
          requireCSRFToken(getCSRFTokenFromRequest(request))

          const data = await request.json()
          console.log(`🔍 [API Users POST] Requester ${authenticatedId} ensuring user:`, data.id)

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
              throw new ForbiddenError('You can only ensure your own user record unless you are an Admin')
            }
          }

          // 4. Role Protection: Non-admins cannot set a role other than 'User'
          // We'll fetch the requester's role again (or use the one we just fetched if applicable)
          const requesterRecord = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, authenticatedId))
            .limit(1)

          const isRequesterAdmin = requesterRecord.length > 0 && requesterRecord[0].role === 'Admin'

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

            return json(result[0], { status: 201 })
          } catch (error) {
            const insertError = error as { code?: string; detail?: string }
            // Handle duplicate email (migration case)
            if (insertError.code === '23505' && insertError.detail?.includes('email')) {
              console.log('🔄 [API] Detected duplicate email with new ID. Starting migration...')

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
                  role: existingUser[0].role || data.role || 'User',
                })

                // Move all related data
                await tx.update(userCertifications).set({ userId: data.id }).where(eq(userCertifications.userId, oldUserId))
                await tx.update(notifications).set({ userId: data.id }).where(eq(notifications.userId, oldUserId))
                await tx.update(auditLogs).set({ userId: data.id }).where(eq(auditLogs.userId, oldUserId))
                await tx.update(userTeams).set({ userId: data.id }).where(eq(userTeams.userId, oldUserId))
                await tx.update(teams).set({ managerId: data.id }).where(eq(teams.managerId, oldUserId))

                // Cleanup old user record
                await tx.delete(users).where(eq(users.id, oldUserId))
              })

              const newUser = await db.select().from(users).where(eq(users.id, data.id)).limit(1)
              return json(newUser[0], { status: 201 })
            }
            throw error
          }
        } catch (error) {
          if (error instanceof AppError) {
            return json({ error: error.message, code: error.code }, { status: error.statusCode })
          }
          const message = error instanceof Error ? error.message : String(error)
          if (message === 'Unauthorized') {
            return json({ error: 'Unauthorized' }, { status: 401 })
          }
          console.error('❌ [API Users POST] Failed to ensure user:', error)
          return json({ error: 'Internal server error', details: message }, { status: 500 })
        }
      },
      PATCH: async ({ request }) => {
        try {
          const session = await requireRole(['Admin'])
          requireCSRFToken(getCSRFTokenFromRequest(request))

          const rawData = await request.json()
          const validation = UpdateUserSchema.safeParse(rawData)

          if (!validation.success) {
            throw new ValidationError('Invalid update data', validation.error.errors)
          }

          const data = validation.data
          const db = await getDbOrThrow()

          const updates: Partial<typeof users.$inferInsert> & { updatedAt: Date } = {
            ...data,
            updatedAt: new Date()
          }
          // Remove ID from updates
          delete (updates as { id?: string }).id

          const result = await db
            .update(users)
            .set(updates)
            .where(eq(users.id, data.id))
            .returning()

          if (result.length === 0) throw new NotFoundError('User not found')

          return json(result[0])
        } catch (error) {
          if (error instanceof AppError) {
            return json({
              error: error.message,
              code: error.code,
              details: error instanceof ValidationError ? error.errors : undefined
            }, { status: error.statusCode })
          }
          console.error('❌ [API Users PATCH] Unexpected Error:', error)
          return json({ error: 'Internal server error' }, { status: 500 })
        }
      },
      DELETE: async ({ request }) => {
        try {
          const session = await requireRole(['Admin'])
          requireCSRFToken(getCSRFTokenFromRequest(request))

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

          return json({ success: true })
        } catch (error) {
          if (error instanceof AppError) {
            return json({ error: error.message, code: error.code }, { status: error.statusCode })
          }
          console.error('❌ [API Users DELETE] Unexpected Error:', error)
          return json({ error: 'Internal server error' }, { status: 500 })
        }
      },
    },
  },
})

import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema'
import { getVerifiedAuth, requireRole } from '../lib/auth.server'
import { logError, logInfo } from '../lib/logging.server'

/**
 * Ensures a user exists in the local database.
 *
 * Creates a user record if it doesn't exist, or returns the existing user.
 * This is typically called during user signup to sync Clerk user data with
 * the application database.
 *
 * **Security:** User can only ensure their own record (authenticated ID must match data.id)
 * **CSRF Protection:** Automatically handled by TanStack Start for server functions
 *
 * @param data - User data object:
 *   - id: string (required) - User ID from Clerk (must match authenticated user)
 *   - name: string (required) - User's full name
 *   - email: string (required) - User's email address
 *   - avatarUrl?: string (optional) - URL to user's avatar image
 *
 * @returns Promise that resolves to the user object (existing or newly created)
 * @throws {Error} If authenticated user ID doesn't match data.id
 * @throws {Error} If database is unavailable
 *
 * @example
 * ```typescript
 * const user = await ensureUser({
 *   id: 'user_123',
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   avatarUrl: 'https://example.com/avatar.jpg'
 * })
 * ```
 */
export const ensureUser = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { id: string; name: string; email: string; avatarUrl?: string }) =>
      data,
  )
  .handler(async ({ data }) => {
    // Security: Verify the caller matches the ID they are trying to ensure
    const authenticatedId = await getVerifiedAuth()
    if (authenticatedId !== data.id) {
      throw new Error('Unauthorized: Cannot ensure a different user')
    }

    const { getDb, instanceId } = await import('../db/db.server')
    const { upsertUserFromClerkProfile } =
      await import('../lib/clerkUserSync.server')
    const db = await getDb()
    if (!db)
      throw new Error(`Database not available (Server Instance: ${instanceId})`)

    try {
      return await upsertUserFromClerkProfile(db, data, {
        allowEmailMigration: true,
      })
    } catch (error) {
      logError(
        error,
        { function: 'ensureUser', userId: data.id },
        'Failed to ensure user',
      )
      throw error
    }
  })

/**
 * Updates a user's role in the system.
 *
 * Changes a user's role to one of the valid role values. This is an
 * administrative operation that should be used carefully.
 *
 * **Authorization:** Admin role required
 * **CSRF Protection:** Automatically handled by TanStack Start for server functions
 *
 * @param data - Role update data:
 *   - userId: string (required) - ID of the user whose role should be updated
 *   - role: 'Admin' | 'User' | 'Manager' | 'Executive' | 'Auditor' (required) - New role
 *
 * @returns Promise that resolves to the updated user object
 * @throws {ForbiddenError} If caller is not an Admin
 * @throws {Error} If user is not found
 * @throws {Error} If database is unavailable
 *
 * @example
 * ```typescript
 * const updated = await updateUserRole({
 *   userId: 'user_123',
 *   role: 'Manager'
 * })
 * ```
 */
export const updateUserRole = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      userId: string
      role: 'Admin' | 'User' | 'Manager' | 'Executive' | 'Auditor'
    }) => data,
  )
  .handler(async ({ data }) => {
    // Security: Require Admin role
    await requireRole(['Admin'])

    const { getDb } = await import('../db/db.server')
    const db = await getDb()
    if (!db) throw new Error('Database not available')

    try {
      const result = await db
        .update(users)
        .set({ role: data.role, updatedAt: new Date() })
        .where(eq(users.id, data.userId))
        .returning()

      if (result.length === 0) {
        throw new Error('User not found')
      }

      return result[0]
    } catch (error) {
      logError(
        error,
        { function: 'updateUserRole', userId: data.userId, newRole: data.role },
        'Failed to update user role',
      )
      throw error
    }
  })

/**
 * Development utility to promote the authenticated user to Admin role.
 *
 * **Security:** Users can only promote themselves (authenticated ID must match userId).
 * This is a development utility and should be removed or restricted in production.
 *
 * **CSRF Protection:** Automatically handled by TanStack Start for server functions
 *
 * @param data - User data:
 *   - userId: string (required) - Must match the authenticated user's ID
 *
 * @returns Promise that resolves to the updated user object with Admin role
 * @throws {Error} If authenticated user ID doesn't match data.userId
 * @throws {Error} If database is unavailable
 *
 * @example
 * ```typescript
 * const admin = await makeMeAdmin({ userId: 'user_123' })
 * // User is now an Admin
 * ```
 */
export const makeMeAdmin = createServerFn({ method: 'POST' })
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    // Security: Get verified ID from session
    const authenticatedId = await getVerifiedAuth()

    // Safety check: Ensure they are promoting themselves
    if (authenticatedId !== data.userId) {
      throw new Error('Unauthorized: You can only promote yourself')
    }

    const { getDb } = await import('../db/db.server')
    const db = await getDb()
    if (!db) throw new Error('Database not available')

    try {
      const result = await db
        .update(users)
        .set({ role: 'Admin', updatedAt: new Date() })
        .where(eq(users.id, authenticatedId))
        .returning()

      logInfo(`User ${authenticatedId} promoted to Admin`, {
        function: 'makeMeAdmin',
        userId: authenticatedId,
      })
      return result[0]
    } catch (error) {
      logError(
        error,
        { function: 'makeMeAdmin', userId: authenticatedId },
        'Failed to promote user to Admin',
      )
      throw error
    }
  })

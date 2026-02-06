import { auth } from '@clerk/tanstack-react-start/server'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema'
import { getDb } from '../db/db.server'
import { ForbiddenError, UnauthorizedError } from './errors'

export interface AuthSession {
  userId: string
  role: string
  email?: string
}

/**
 * Verifies the Clerk session and returns the verified userId.
 *
 * This function checks the Clerk authentication session and extracts the user ID.
 * It should be called at the start of any authenticated route handler.
 *
 * @returns Promise that resolves to the authenticated user ID string
 * @throws {UnauthorizedError} If the session is invalid or user is not authenticated
 *
 * @example
 * ```typescript
 * const userId = await getVerifiedAuth()
 * // Use userId for database queries or authorization checks
 * ```
 */
export async function getVerifiedAuth(): Promise<string> {
  const authObj = await auth()
  const { userId } = authObj
  if (!userId) {
    throw new UnauthorizedError('Unauthorized')
  }
  return userId
}

/**
 * Fetches the authenticated user from the database based on the verified Clerk userId.
 *
 * This function retrieves the full user record from the database, including role and email.
 * It should be used when you need user information beyond just the ID.
 *
 * @returns Promise that resolves to an AuthSession object containing userId, role, and email
 * @throws {UnauthorizedError} If the user is not found in the database
 * @throws {Error} If the database is not available
 *
 * @example
 * ```typescript
 * const session = await getAuthenticatedUser()
 * console.log(`User ${session.userId} has role ${session.role}`)
 * ```
 */
export async function getAuthenticatedUser(): Promise<AuthSession> {
  const userId = await getVerifiedAuth()
  const db = await getDb()
  if (!db) throw new Error('Database not available')

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user.length) {
    throw new UnauthorizedError('User record not found')
  }

  return {
    userId: user[0].id,
    role: user[0].role,
    email: user[0].email || undefined,
  }
}

/**
 * Guard that ensures the user has one of the required roles.
 *
 * This function combines authentication and authorization checks. It verifies the user
 * is authenticated and checks that their role is in the allowed list.
 *
 * @param allowedRoles - Array of role strings that are permitted to access the resource
 * @returns Promise that resolves to the authenticated AuthSession
 * @throws {UnauthorizedError} If the user is not authenticated
 * @throws {ForbiddenError} If the user's role is not in the allowedRoles list
 *
 * @example
 * ```typescript
 * // Only allow Admin and Manager roles
 * const session = await requireRole(['Admin', 'Manager'])
 * // Proceed with authorized operation
 * ```
 */
export async function requireRole(
  allowedRoles: Array<string>,
): Promise<AuthSession> {
  const session = await getAuthenticatedUser()

  if (!allowedRoles.includes(session.role)) {
    throw new ForbiddenError(
      `Required one of [${allowedRoles.join(', ')}] but user has [${session.role}]`,
    )
  }

  return session
}

import { auth } from '@clerk/tanstack-react-start/server'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema'
import { getDb } from '../db/db.server'

export interface AuthSession {
  userId: string
  role: string
  email?: string
}

/**
 * Verifies the Clerk session and returns the verified userId.
 * Throws a 401 if the session is invalid.
 */
export async function getVerifiedAuth() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }
  return userId
}

/**
 * Fetches the user from the database based on the verified Clerk userId.
 * Throws a 401 if the user is not found in our DB.
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
    throw new Error('User record not found')
  }

  return {
    userId: user[0].id,
    role: user[0].role || 'User',
    email: user[0].email || undefined,
  }
}

/**
 * Guard that ensures the user has one of the required roles.
 * Throws a 403 if the role is insufficient.
 */
export async function requireRole(
  allowedRoles: Array<string>,
): Promise<AuthSession> {
  const session = await getAuthenticatedUser()

  if (!allowedRoles.includes(session.role)) {
    throw new Error(
      `Forbidden: Required one of [${allowedRoles.join(', ')}] but user has [${session.role}]`,
    )
  }

  return session
}

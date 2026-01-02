import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema'
import { getVerifiedAuth, requireRole } from '../lib/auth.server'

/**
 * Ensures a user exists in the local database.
 * Uses the verified userId from the Clerk session.
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
    const db = await getDb()
    if (!db)
      throw new Error(`Database not available (Server Instance: ${instanceId})`)

    try {
      // Check if user exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.id, data.id))
        .limit(1)

      if (existing.length > 0) {
        return existing[0]
      }

      // Create user
      const result = await db
        .insert(users)
        .values({
          id: data.id,
          name: data.name,
          email: data.email,
          avatarUrl: data.avatarUrl,
          role: 'User', // Default role
        })
        .returning()

      return result[0]
    } catch (error) {
      console.error('❌ [Server] Failed to ensure user:', error)
      throw error
    }
  })

/**
 * Updates a user's role.
 * Only accessible by Admins.
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
      console.error('❌ [Server] Failed to update role:', error)
      throw error
    }
  })

/**
 * Development utility to promote a user to Admin.
 * Hardened to only allow the authenticated user to promote themselves.
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

      console.log(`🪄 [Server] User ${authenticatedId} promoted to Admin`)
      return result[0]
    } catch (error) {
      console.error('❌ [Server] Failed to promote:', error)
      throw error
    }
  })

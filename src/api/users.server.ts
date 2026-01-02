import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema'

export const ensureUser = createServerFn({ method: 'POST' })
    .inputValidator((data: { id: string; name: string; email: string; avatarUrl?: string }) => data)
    .handler(async ({ data }) => {
        const { getDb, instanceId } = await import('../db/db.server');
        const db = await getDb();
        if (!db) throw new Error(`Database not available (Server Instance: ${instanceId})`);

        try {
            // Check if user exists
            const existing = await db.select().from(users).where(eq(users.id, data.id)).limit(1)

            if (existing.length > 0) {
                console.log(`✅ [Server] User found: ${data.id} (${existing[0].role})`)
                return existing[0]
            }

            // Create user
            console.log(`🚀 [Server] Creating new user: ${data.id}`)
            const result = await db.insert(users).values({
                id: data.id,
                name: data.name,
                email: data.email,
                avatarUrl: data.avatarUrl,
                role: 'User' // Default role
            }).returning()

            return result[0]
        } catch (error) {
            console.error('❌ [Server] Failed to ensure user:', error)
            throw error
        }
    })

export const updateUserRole = createServerFn({ method: 'POST' })
    .inputValidator((data: { userId: string; role: 'Admin' | 'User' | 'Manager' | 'Executive' | 'Auditor'; adminId: string }) => data)
    .handler(async ({ data }) => {
        const { getDb } = await import('../db/db.server');
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        try {
            // Check if requester is Admin
            const requester = await db.select().from(users).where(eq(users.id, data.adminId)).limit(1)
            if (!requester.length || requester[0].role !== 'Admin') {
                throw new Error('Unauthorized: Only admins can change roles')
            }

            const result = await db.update(users)
                .set({ role: data.role, updatedAt: new Date() })
                .where(eq(users.id, data.userId))
                .returning()

            return result[0]
        } catch (error) {
            console.error('❌ [Server] Failed to update role:', error)
            throw error
        }
    })

export const makeMeAdmin = createServerFn({ method: 'POST' })
    .inputValidator((data: { userId: string }) => data)
    .handler(async ({ data }) => {
        const { getDb } = await import('../db/db.server');
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        try {
            const result = await db.update(users)
                .set({ role: 'Admin', updatedAt: new Date() })
                .where(eq(users.id, data.userId))
                .returning()
            console.log(`🪄 [Server] User ${data.userId} promoted to Admin`)
            return result[0]
        } catch (error) {
            console.error('❌ [Server] Failed to promote:', error)
            throw error
        }
    })

import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDb } from '../db/db.server'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

export const Route = createFileRoute('/api/users')({
  server: {
    handlers: {
      // GET all users
      GET: async () => {
        try {
          const db = await getDb()
          if (!db) {
            return json({ error: 'Database not available' }, { status: 500 })
          }
          const allUsers = await db.select().from(users)
          return json(allUsers)
        } catch (error) {
          console.error('❌ [API] Failed to fetch users:', error)
          return json([])
        }
      },
      POST: async ({ request }) => {
        try {
          const data = await request.json()
          const db = await getDb()
          if (!db) {
            return json({ error: 'Database not available' }, { status: 500 })
          }

          // Check if user exists
          const existing = await db.select().from(users).where(eq(users.id, data.id)).limit(1)

          if (existing.length > 0) {
            console.log(`✅ [API] User found: ${data.id} (${existing[0].role})`)
            return json(existing[0])
          }

          // Create user
          console.log(`🚀 [API] Creating new user: ${data.id}`)
          const result = await db.insert(users).values({
            id: data.id,
            name: data.name,
            email: data.email,
            avatarUrl: data.avatarUrl,
            role: data.role || 'User'
          }).returning()

          return json(result[0], { status: 201 })
        } catch (error) {
          console.error('❌ [API] Failed to ensure user:', error)
          return json({ error: 'Failed to process user' }, { status: 500 })
        }
      },
      PATCH: async ({ request }) => {
        try {
          const data = await request.json()
          const db = await getDb()
          if (!db) {
            return json({ error: 'Database not available' }, { status: 500 })
          }

          if (!data.id || !data.role) {
            return json({ error: 'Missing id or role' }, { status: 400 })
          }

          console.log(`🔧 [API] Updating user ${data.id} role to: ${data.role}`)
          const result = await db.update(users)
            .set({ role: data.role })
            .where(eq(users.id, data.id))
            .returning()

          if (result.length === 0) {
            return json({ error: 'User not found' }, { status: 404 })
          }

          return json(result[0])
        } catch (error) {
          console.error('❌ [API] Failed to update user:', error)
          return json({ error: 'Failed to update user' }, { status: 500 })
        }
      }
    }
  }
})


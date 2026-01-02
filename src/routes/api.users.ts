import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDb } from '../db/db.server'
import {
  auditLogs,
  notifications,
  teams,
  userCertifications,
  userTeams,
  users,
} from '../db/schema'
import { requireRole } from '../lib/auth.server'

export const Route = createFileRoute('/api/users')({
  server: {
    handlers: {
      GET: async () => {
        try {
          await requireRole(['Admin', 'Auditor', 'Executive'])
          const db = await getDb()
          if (!db) {
            return json(
              {
                error: 'Database not available',
                code: 'DB_UNAVAILABLE',
              },
              { status: 500 },
            )
          }
          const allUsers = await db.select().from(users)
          return json(allUsers)
        } catch (error: any) {
          console.error(
            '❌ [API Users GET] Authorization failure or error:',
            error,
          )
          return json(
            {
              error: 'Forbidden or internal error',
              details: error.message,
            },
            { status: error.message.includes('Forbidden') ? 403 : 500 },
          )
        }
      },
      POST: async ({ request }) => {
        let data: any
        let db: any

        try {
          data = await request.json()
          console.log('🔍 [API Users POST] Received user data:', data)
          db = await getDb()

          if (!db) {
            console.error('❌ [API Users POST] Database not available')
            return json(
              {
                error: 'Database not available',
                code: 'DB_UNAVAILABLE',
              },
              { status: 500 },
            )
          }

          // Check if user exists
          const existing = await db
            .select()
            .from(users)
            .where(eq(users.id, data.id))
            .limit(1)
          if (existing.length > 0) {
            console.log(
              `✅ [API Users POST] User found: ${data.id} (${existing[0].role})`,
            )
            return json(existing[0])
          }

          // Create user
          const defaultRole = data.role || 'User'
          console.log(
            `🚀 [API Users POST] Creating new user: ${data.id} with role: ${defaultRole}`,
          )
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
          console.error('❌ [API Users POST] Failed to ensure user:', error)
          const err: any = error

          const code = err.code || err.cause?.code
          const detail = err.detail || err.cause?.detail || ''

          if (code === '23505' && detail.includes('email')) {
            if (!data || !db) {
              return json(
                { error: 'System error during migration prep' },
                { status: 500 },
              )
            }

            try {
              console.log(
                '🔄 [API] Detected duplicate email with new ID. Starting migration...',
              )

              const existingUser = await db
                .select()
                .from(users)
                .where(eq(users.email, data.email))
                .limit(1)

              if (!existingUser.length) {
                return json(
                  { error: 'Conflict detected but existing user not found' },
                  { status: 409 },
                )
              }

              const oldUserId = existingUser[0].id
              console.log(
                `🔄 [API] Migrating data from ${oldUserId} to ${data.id}`,
              )

              await db.transaction(async (tx: any) => {
                await tx
                  .update(users)
                  .set({ email: `${data.email}_migrated_${Date.now()}` })
                  .where(eq(users.id, oldUserId))

                await tx.insert(users).values({
                  id: data.id,
                  name: data.name,
                  email: data.email,
                  avatarUrl: data.avatarUrl,
                  role: existingUser[0].role || data.role || 'User',
                })

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

                await tx.delete(users).where(eq(users.id, oldUserId))
              })

              console.log('✅ [API] Migration successful')
              const newUser = await db
                .select()
                .from(users)
                .where(eq(users.id, data.id))
                .limit(1)
              return json(newUser[0], { status: 201 })
            } catch (migrationError) {
              console.error('❌ [API] Migration failed:', migrationError)
              return json(
                {
                  error: 'Failed to migrate user data',
                  details: (migrationError as any).message,
                },
                { status: 500 },
              )
            }
          }

          if (err.code === '23505') {
            return json(
              { error: 'User with this ID or email already exists' },
              { status: 409 },
            )
          }
          return json(
            { error: err.message || 'Failed to process user' },
            { status: 500 },
          )
        }
      },
      PATCH: async ({ request }) => {
        try {
          const session = await requireRole(['Admin'])
          const data = await request.json()
          console.log(
            `🔧 [API Users PATCH] Admin ${session.userId} updating user ${data.id}`,
          )
          const db = await getDb()
          if (!db) {
            return json(
              {
                error: 'Database not available',
                code: 'DB_UNAVAILABLE',
              },
              { status: 500 },
            )
          }

          if (!data.id) {
            return json({ error: 'Missing user id' }, { status: 400 })
          }

          const updates: any = {}
          if (data.role) updates.role = data.role
          if (data.name) updates.name = data.name
          if (data.email) updates.email = data.email
          updates.updatedAt = new Date()

          const result = await db
            .update(users)
            .set(updates)
            .where(eq(users.id, data.id))
            .returning()

          if (result.length === 0) {
            console.error(`❌ [API Users PATCH] User not found: ${data.id}`)
            return json({ error: 'User not found' }, { status: 404 })
          }

          console.log(
            `✅ [API Users PATCH] Successfully updated user ${data.id}`,
          )
          return json(result[0])
        } catch (error: any) {
          console.error(
            '❌ [API Users PATCH] Authorization failure or error:',
            error,
          )
          return json(
            {
              error: 'Unauthorized/Forbidden or internal error',
              details: error.message,
            },
            {
              status: error.message.includes('Forbidden')
                ? 403
                : error.message === 'Unauthorized'
                  ? 401
                  : 500,
            },
          )
        }
      },
      DELETE: async ({ request }) => {
        try {
          const session = await requireRole(['Admin'])
          const url = new URL(request.url)
          const id = url.searchParams.get('id')
          if (!id) {
            return json({ error: 'Missing user id' }, { status: 400 })
          }

          console.log(
            `🗑️ [API Users DELETE] Admin ${session.userId} deleting user ${id}`,
          )

          const db = await getDb()
          if (!db) {
            return json(
              {
                error: 'Database not available',
                code: 'DB_UNAVAILABLE',
              },
              { status: 500 },
            )
          }

          await db.transaction(async (tx: any) => {
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

          console.log(`✅ [API Users DELETE] Successfully deleted user ${id}`)
          return json({ success: true })
        } catch (error: any) {
          console.error(
            '❌ [API Users DELETE] Authorization failure or error:',
            error,
          )
          return json(
            {
              error: 'Forbidden or internal error',
              details: error.message,
            },
            { status: error.message.includes('Forbidden') ? 403 : 500 },
          )
        }
      },
    },
  },
})

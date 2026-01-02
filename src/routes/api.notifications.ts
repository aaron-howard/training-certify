import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { and, desc, eq } from 'drizzle-orm'
import { getDb } from '../db/db.server'
import { notifications } from '../db/schema'
import { requireRole } from '../lib/auth.server'

export const Route = createFileRoute('/api/notifications')({
  server: {
    handlers: {
      GET: async () => {
        try {
          // Security: Authenticate and get current user ID
          const session = await requireRole([
            'Admin',
            'Manager',
            'Auditor',
            'Executive',
            'User',
          ])

          const db = await getDb()
          if (!db) {
            return json({ error: 'Database not available' }, { status: 500 })
          }

          // Security: Filter by the authenticated user's ID
          const result = await db
            .select()
            .from(notifications)
            .where(
              and(
                eq(notifications.userId, session.userId),
                eq(notifications.isDismissed, false),
              ),
            )
            .orderBy(desc(notifications.timestamp))
            .limit(50)

          return json(
            result.map((n) => ({
              id: n.id,
              title: n.title,
              message: n.description || '',
              date: n.timestamp,
              type: n.type,
              read: n.isRead,
            })),
          )
        } catch (error: any) {
          console.error('[API Notifications] Error:', error)
          return json(
            { error: 'Forbidden or internal error', details: error.message },
            { status: error.message.includes('Forbidden') ? 403 : 500 },
          )
        }
      },
    },
  },
})

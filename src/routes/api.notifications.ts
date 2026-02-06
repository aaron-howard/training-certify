import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { and, desc, eq } from 'drizzle-orm'
import { getDbOrThrow } from '../db/db.server'
import { notifications } from '../db/schema'
import { handleApiError, setupReadHandler } from '../lib/api-helpers.server'

export const Route = createFileRoute('/api/notifications')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const session = await setupReadHandler(request)

          const db = await getDbOrThrow()

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
        } catch (error) {
          return handleApiError(error, 'GET /api/notifications')
        }
      },
    },
  },
})

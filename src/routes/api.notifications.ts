import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { and, desc, eq } from 'drizzle-orm'
import { getDbOrThrow } from '../db/db.server'
import { notifications } from '../db/schema'
import {
  handleApiError,
  setupReadHandler,
  withApiMetrics,
} from '../lib/api-helpers.server'
import { CacheTTL, getOrCompute } from '../lib/cache.server'

export const Route = createFileRoute('/api/notifications')({
  server: {
    handlers: {
      GET: async ({ request }) =>
        withApiMetrics('GET', '/api/notifications', async () => {
          try {
            const session = await setupReadHandler(request)

            const db = await getDbOrThrow()

            const body = await getOrCompute(
              `notifications:${session.userId}`,
              CacheTTL.SHORT,
              async () => {
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

                return result.map((n) => ({
                  id: n.id,
                  title: n.title,
                  message: n.description || '',
                  date: n.timestamp,
                  type: n.type,
                  read: n.isRead,
                }))
              },
            )

            return json(body, {
              headers: {
                'Cache-Control': 'private, max-age=30',
              },
            })
          } catch (error) {
            return handleApiError(error, 'GET /api/notifications')
          }
        }),
    },
  },
})

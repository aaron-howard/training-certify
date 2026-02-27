import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { getDbOrThrow } from '../db/db.server'
import { notifications } from '../db/schema'
import { ForbiddenError, ValidationError } from '../lib/errors'
import {
  NotificationActionSchema,
  NotificationPreferenceSchema,
} from '../lib/validation'
import { logInfo } from '../lib/logging.server'
import {
  handleApiError,
  setupMutationHandler,
  setupReadHandler,
  withApiMetrics,
} from '../lib/api-helpers.server'

// Default notification categories
const defaultCategories = [
  {
    id: 'expiration-alert',
    name: 'Expiration Alerts',
    description: 'Alerts when certifications are about to expire',
  },
  {
    id: 'renewal-reminder',
    name: 'Renewal Reminders',
    description: 'Reminders to renew certifications',
  },
  {
    id: 'team-member-alert',
    name: 'Team Updates',
    description: 'Notifications about team member certifications',
  },
  {
    id: 'compliance-warning',
    name: 'Compliance Warnings',
    description: 'Warnings about compliance issues',
  },
]

export const Route = createFileRoute('/api/notification-settings')({
  server: {
    handlers: {
      // GET notification settings/categories
      GET: async ({ request }) =>
        withApiMetrics('GET', '/api/notification-settings', async () => {
          try {
            await setupReadHandler(request)

            return json({
              categories: defaultCategories,
              userPreferences: {
                'expiration-alert': true,
                'renewal-reminder': true,
                'team-member-alert': true,
                'compliance-warning': true,
                emailEnabled: true,
                pushEnabled: false,
              },
            })
          } catch (error) {
            return handleApiError(error, 'GET /api/notification-settings')
          }
        }),
      // PATCH - Update user notification preferences
      PATCH: async ({ request }) =>
        withApiMetrics('PATCH', '/api/notification-settings', async () => {
          try {
            const session = await setupMutationHandler(request)

            const rawData = await request.json()
            const validation = NotificationPreferenceSchema.safeParse(rawData)

            if (!validation.success) {
              throw new ValidationError(
                'Invalid preference data',
                validation.error.errors,
              )
            }

            const { userId, preferences } = validation.data

            if (userId && userId !== session.userId) {
              throw new ForbiddenError('Cannot update other user settings')
            }

            logInfo(`Updated preferences for ${session.userId}`, {
              route: 'PATCH /api/notification-settings',
              userId: session.userId,
            })
            return json({ success: true, preferences })
          } catch (error) {
            return handleApiError(error, 'PATCH /api/notification-settings')
          }
        }),
      // POST - Mark notifications as read/dismissed
      POST: async ({ request }) =>
        withApiMetrics('POST', '/api/notification-settings', async () => {
          try {
            const session = await setupMutationHandler(request)

            const rawData = await request.json()
            const validation = NotificationActionSchema.safeParse(rawData)

            if (!validation.success) {
              throw new ValidationError(
                'Invalid notification action',
                validation.error.errors,
              )
            }

            const { action, notificationId, userId } = validation.data
            const db = await getDbOrThrow()

            if (action === 'markRead' && notificationId) {
              await db
                .update(notifications)
                .set({ isRead: true })
                .where(
                  and(
                    eq(notifications.id, notificationId),
                    eq(notifications.userId, session.userId),
                  ),
                )
              return json({ success: true })
            } else if (action === 'markAllRead') {
              const targetId = userId || session.userId
              if (targetId !== session.userId) {
                throw new ForbiddenError(
                  'Cannot mark notifications as read for another user',
                )
              }
              await db
                .update(notifications)
                .set({ isRead: true })
                .where(eq(notifications.userId, targetId))
              return json({ success: true })
            } else if (action === 'dismiss' && notificationId) {
              await db
                .update(notifications)
                .set({ isDismissed: true })
                .where(
                  and(
                    eq(notifications.id, notificationId),
                    eq(notifications.userId, session.userId),
                  ),
                )
              return json({ success: true })
            }

            throw new ValidationError(
              'Invalid action or missing notificationId',
            )
          } catch (error) {
            return handleApiError(error, 'POST /api/notification-settings')
          }
        }),
    },
  },
})

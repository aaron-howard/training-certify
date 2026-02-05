import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { getDbOrThrow } from '../db/db.server'
import { notifications } from '../db/schema'
import { requireRole } from '../lib/auth.server'
import { getCSRFTokenFromRequest, requireCSRFToken } from '../lib/csrf.server'
import { AppError, ForbiddenError, ValidationError } from '../lib/errors'
import { NotificationActionSchema, NotificationPreferenceSchema } from '../lib/validation'

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
      GET: async () => {
        try {
          await requireRole([
            'Admin',
            'Manager',
            'Auditor',
            'Executive',
            'User',
          ])

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
          if (error instanceof AppError) {
            return json({ error: error.message, code: error.code }, { status: error.statusCode })
          }
          console.error('❌ [API Notification Settings GET] Unexpected Error:', error)
          return json({ error: 'Internal server error' }, { status: 500 })
        }
      },
      // PATCH - Update user notification preferences
      PATCH: async ({ request }) => {
        try {
          const session = await requireRole([
            'Admin',
            'Manager',
            'Auditor',
            'Executive',
            'User',
          ])
          requireCSRFToken(getCSRFTokenFromRequest(request))

          const rawData = await request.json()
          const validation = NotificationPreferenceSchema.safeParse(rawData)

          if (!validation.success) {
            throw new ValidationError('Invalid preference data', validation.error.errors)
          }

          const { userId, preferences } = validation.data

          if (userId && userId !== session.userId) {
            throw new ForbiddenError('Cannot update other user settings')
          }

          console.log(`✅ [API Settings PATCH] Updated preferences for ${session.userId}`)
          return json({ success: true, preferences })
        } catch (error) {
          if (error instanceof AppError) {
            return json({ error: error.message, code: error.code }, { status: error.statusCode })
          }
          console.error('❌ [API Notification Settings PATCH] Unexpected Error:', error)
          return json({ error: 'Internal server error' }, { status: 500 })
        }
      },
      // POST - Mark notifications as read/dismissed
      POST: async ({ request }) => {
        try {
          const session = await requireRole([
            'Admin',
            'Manager',
            'Auditor',
            'Executive',
            'User',
          ])
          requireCSRFToken(getCSRFTokenFromRequest(request))

          const rawData = await request.json()
          const validation = NotificationActionSchema.safeParse(rawData)

          if (!validation.success) {
            throw new ValidationError('Invalid notification action', validation.error.errors)
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
              throw new ForbiddenError('Cannot mark notifications as read for another user')
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

          throw new ValidationError('Invalid action or missing notificationId')
        } catch (error) {
          if (error instanceof AppError) {
            return json({ error: error.message, code: error.code }, { status: error.statusCode })
          }
          console.error('❌ [API Notification Settings POST] Unexpected Error:', error)
          return json({ error: 'Internal server error' }, { status: 500 })
        }
      },
    },
  },
})

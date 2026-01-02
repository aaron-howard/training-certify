import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../db/db.server'
import { notifications } from '../db/schema'
import { requireRole } from '../lib/auth.server'

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
        } catch (error: any) {
          console.error('[API Notification Settings GET] Error:', error)
          return json(
            { error: 'Forbidden or internal error', details: error.message },
            { status: error.message.includes('Forbidden') ? 403 : 500 },
          )
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
          const data = await request.json()
          const { userId, preferences } = data

          if (userId && userId !== session.userId) {
            return json(
              { error: 'Forbidden: Cannot update other user settings' },
              { status: 403 },
            )
          }

          console.log(`✅ [API] Updated preferences for ${session.userId}`)
          return json({ success: true, preferences })
        } catch (error: any) {
          console.error('[API Notification Settings PATCH] Error:', error)
          return json(
            { error: 'Forbidden or internal error', details: error.message },
            { status: error.message.includes('Forbidden') ? 403 : 500 },
          )
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
          const data = await request.json()
          const { action, notificationId, userId } = data

          const db = await getDb()
          if (!db) return json({ error: 'DB not available' }, { status: 500 })

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
              return json({ error: 'Forbidden' }, { status: 403 })
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

          return json({ error: 'Invalid action' }, { status: 400 })
        } catch (error: any) {
          console.error('[API Notification Settings POST] Error:', error)
          return json(
            { error: 'Forbidden or internal error', details: error.message },
            { status: error.message.includes('Forbidden') ? 403 : 500 },
          )
        }
      },
    },
  },
})

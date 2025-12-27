import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDb } from '../db/db.server'
import { notifications } from '../db/schema'
import { eq, and } from 'drizzle-orm'

// Default notification categories
const defaultCategories = [
    { id: 'expiration-alert', name: 'Expiration Alerts', description: 'Alerts when certifications are about to expire' },
    { id: 'renewal-reminder', name: 'Renewal Reminders', description: 'Reminders to renew certifications' },
    { id: 'team-member-alert', name: 'Team Updates', description: 'Notifications about team member certifications' },
    { id: 'compliance-warning', name: 'Compliance Warnings', description: 'Warnings about compliance issues' },
]

export const Route = createFileRoute('/api/notification-settings')({
    server: {
        handlers: {
            // GET notification settings/categories
            GET: async ({ request }) => {
                try {
                    const url = new URL(request.url)
                    const userId = url.searchParams.get('userId')

                    // Return default categories (in production, would fetch from DB)
                    return json({
                        categories: defaultCategories,
                        userPreferences: {
                            // Default all enabled
                            'expiration-alert': true,
                            'renewal-reminder': true,
                            'team-member-alert': true,
                            'compliance-warning': true,
                            emailEnabled: true,
                            pushEnabled: false
                        }
                    })
                } catch (error) {
                    console.error('[API Notification Settings GET] Error:', error)
                    return json({ categories: defaultCategories, userPreferences: {} })
                }
            },
            // PATCH - Update user notification preferences
            PATCH: async ({ request }) => {
                try {
                    const data = await request.json()
                    const { userId, preferences } = data

                    if (!userId) {
                        return json({ error: 'userId is required' }, { status: 400 })
                    }

                    // In production, save to DB
                    console.log(`✅ [API] Updated notification preferences for ${userId}:`, preferences)
                    return json({ success: true, preferences })
                } catch (error) {
                    console.error('[API Notification Settings PATCH] Error:', error)
                    return json({ error: 'Failed to update preferences' }, { status: 500 })
                }
            },
            // POST - Mark notifications as read
            POST: async ({ request }) => {
                try {
                    const data = await request.json()
                    const { action, notificationId, userId } = data

                    const db = await getDb()
                    if (!db) {
                        return json({ error: 'Database not available' }, { status: 500 })
                    }

                    if (action === 'markRead' && notificationId) {
                        await db.update(notifications)
                            .set({ isRead: true })
                            .where(eq(notifications.id, notificationId))
                        return json({ success: true })
                    } else if (action === 'markAllRead' && userId) {
                        await db.update(notifications)
                            .set({ isRead: true })
                            .where(eq(notifications.userId, userId))
                        return json({ success: true })
                    } else if (action === 'dismiss' && notificationId) {
                        await db.update(notifications)
                            .set({ isDismissed: true })
                            .where(eq(notifications.id, notificationId))
                        return json({ success: true })
                    }

                    return json({ error: 'Invalid action' }, { status: 400 })
                } catch (error) {
                    console.error('[API Notification Settings POST] Error:', error)
                    return json({ error: 'Failed to update notification' }, { status: 500 })
                }
            }
        }
    }
})

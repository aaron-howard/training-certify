import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { getDb } from '../db/db.server'
import { notifications } from '../db/schema'

export const Route = createFileRoute('/api/notifications')({
    server: {
        handlers: {
            GET: async () => {
                try {
                    const db = await getDb()
                    if (!db) {
                        return json({ error: 'Database not available' }, { status: 500 })
                    }

                    // Filter out dismissed notifications and order by newest first
                    const result = await db.select()
                        .from(notifications)
                        .where(eq(notifications.isDismissed, false))
                        .orderBy(desc(notifications.timestamp))
                        .limit(50)
                    return json(result.map(n => ({
                        id: n.id,
                        title: n.title,
                        message: n.description || '',
                        date: n.timestamp,
                        type: n.type,
                        read: n.isRead
                    })))
                } catch (error) {
                    console.error('[API Notifications] Error:', error)
                    return json([])
                }
            }
        }
    }
})

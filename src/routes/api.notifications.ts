import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
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

                    const result = await db.select().from(notifications).limit(50)
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

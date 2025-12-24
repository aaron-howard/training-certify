import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { certifications, auditLogs, notifications } from '../db/schema'
import { desc } from 'drizzle-orm'

export const getCatalog = createServerFn({ method: 'GET' })
    .handler(async () => {
        const result = await db.select().from(certifications)
        return {
            certifications: result.map(c => ({
                id: c.id,
                name: c.name,
                vendor: c.vendorName,
                level: c.difficulty
            }))
        }
    })

export const getComplianceData = createServerFn({ method: 'GET' })
    .handler(async () => {
        console.log('Fetching compliance data...')
        const logs = await db.select()
            .from(auditLogs)
            .orderBy(desc(auditLogs.timestamp))
            .limit(10)

        console.log(`Found ${logs.length} audit logs`)
        return {
            auditLogs: logs.map(l => ({
                id: l.id,
                user: 'System', // Need to join with users for name
                action: l.action,
                date: l.timestamp.toISOString().split('T')[0],
                status: 'verified' // Default for now
            })),
            stats: { complianceRate: 88, totalAudits: 156, issuesFound: 3 }
        }
    })

export const getNotifications = createServerFn({ method: 'GET' })
    .handler(async () => {
        console.log('Fetching notifications...')
        const result = await db.select().from(notifications).orderBy(desc(notifications.timestamp)).limit(20)

        console.log(`Found ${result.length} notifications`)
        return result.map(n => ({
            id: n.id,
            title: n.title,
            message: n.description || '',
            type: n.severity === 'critical' ? 'alert' : 'info',
            date: n.timestamp.toISOString().split('T')[0],
            read: n.isRead
        }))
    })

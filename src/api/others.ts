import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { certifications, auditLogs, notifications } from '../db/schema'
import { desc } from 'drizzle-orm'

export const getCatalog = createServerFn({ method: 'GET' })
    .handler(async () => {
        try {
            if (!db) return { certifications: [] }
            const result = await db.select().from(certifications)
            return {
                certifications: result.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    vendor: c.vendorName,
                    level: c.difficulty
                }))
            }
        } catch (error) {
            console.error('Failed to fetch catalog:', error)
            return { certifications: [] }
        }
    })

export const getComplianceData = createServerFn({ method: 'GET' })
    .handler(async () => {
        try {
            console.log('Fetching compliance data...')
            if (!db) return { auditLogs: [], stats: { complianceRate: 0, totalAudits: 0, issuesFound: 0 } }

            const logs = await db.select()
                .from(auditLogs)
                .orderBy(desc(auditLogs.timestamp))
                .limit(10)

            console.log(`Found ${logs.length} audit logs`)
            return {
                auditLogs: logs.map((l: any) => ({
                    id: l.id,
                    user: 'System', // Need to join with users for name
                    action: l.action,
                    date: l.timestamp.toISOString().split('T')[0],
                    status: 'verified' // Default for now
                })),
                stats: { complianceRate: 88, totalAudits: 156, issuesFound: 3 }
            }
        } catch (error) {
            console.error('Failed to fetch compliance data:', error)
            return { auditLogs: [], stats: { complianceRate: 0, totalAudits: 0, issuesFound: 0 } }
        }
    })

export const getNotifications = createServerFn({ method: 'GET' })
    .handler(async () => {
        try {
            console.log('Fetching notifications...')
            if (!db) return []

            const result = await db.select().from(notifications).orderBy(desc(notifications.timestamp)).limit(20)

            console.log(`Found ${result.length} notifications`)
            return result.map((n: any) => ({
                id: n.id,
                title: n.title,
                message: n.description || '',
                type: n.severity === 'critical' ? 'alert' : 'info',
                date: n.timestamp.toISOString().split('T')[0],
                read: n.isRead
            }))
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
            return [] // Return empty array on error instead of crashing
        }
    })

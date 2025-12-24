import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { certifications, auditLogs, notifications, userCertifications, users } from '../db/schema'
import { desc, count, sql, eq } from 'drizzle-orm'

export const getCatalog = createServerFn({ method: 'GET' })
    .handler(async () => {
        try {
            if (!db) {
                console.log('⚠️ [Server] getCatalog: DB is null')
                return { certifications: [] }
            }
            const result = await db.select().from(certifications)
            const mapped = {
                certifications: result.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    vendor: c.vendorName,
                    level: c.difficulty
                }))
            }
            console.log(`✅ [Server] getCatalog returning ${mapped.certifications.length} items`)
            return mapped
        } catch (error) {
            console.error('Failed to fetch catalog:', error)
            return { certifications: [] }
        }
    })

export const getComplianceData = createServerFn({ method: 'GET' })
    .handler(async () => {
        try {
            console.log('🚀 [Server] getComplianceData called')
            if (!db) {
                console.log('⚠️ [Server] getComplianceData: DB is null')
                return { auditLogs: [], stats: { complianceRate: 0, totalAudits: 0, issuesFound: 0 } }
            }

            const logs = await db.select()
                .from(auditLogs)
                .orderBy(desc(auditLogs.timestamp))
                .limit(10)

            console.log(`✅ [Server] Found ${logs.length} audit logs`)
            return {
                auditLogs: logs.map((l: any) => ({
                    id: l.id,
                    user: 'System',
                    action: l.action,
                    date: l.timestamp.toISOString().split('T')[0],
                    status: 'verified'
                })),
                stats: { complianceRate: 88, totalAudits: logs.length, issuesFound: 1 }
            }
        } catch (error) {
            console.error('Failed to fetch compliance data:', error)
            return { auditLogs: [], stats: { complianceRate: 0, totalAudits: 0, issuesFound: 0 } }
        }
    })

export const getNotifications = createServerFn({ method: 'GET' })
    .handler(async () => {
        try {
            console.log('🚀 [Server] getNotifications called')
            if (!db) {
                console.log('⚠️ [Server] DB is null')
                return []
            }

            const result = await db.select().from(notifications).orderBy(desc(notifications.timestamp)).limit(20)

            console.log(`✅ [Server] Found ${result.length} notifications`)
            return result.map((n: any) => ({
                id: n.id,
                title: n.title,
                message: n.description || '',
                type: n.severity === 'critical' ? 'alert' : 'info',
                date: n.timestamp.toISOString().split('T')[0],
                read: n.isRead
            }))
        } catch (error) {
            console.error('❌ [Server] Failed:', error)
            return []
        }
    })

export const getDashboardStats = createServerFn({ method: 'GET' })
    .handler(async () => {
        try {
            console.log('🚀 [Server] getDashboardStats called')
            if (!db) {
                console.log('⚠️ [Server] getDashboardStats: DB is null')
                return { activeCerts: 0, expiringSoon: 0, complianceRate: 0 }
            }

            const activeResult = await db.select({ value: count() }).from(userCertifications).where(sql`status IN ('active', 'expiring', 'expiring-soon')`)
            const expiringResult = await db.select({ value: count() }).from(userCertifications).where(sql`status IN ('expiring', 'expiring-soon')`)

            const activeCerts = Number(activeResult[0].value)
            const expiringSoon = Number(expiringResult[0].value)

            console.log(`✅ [Server] Dashboard metrics calculated: Active=${activeCerts}, Expiring=${expiringSoon}`)
            return {
                activeCerts,
                expiringSoon,
                complianceRate: 88 // Mocked for now
            }
        } catch (error) {
            console.error('❌ [Server] Failed to fetch dashboard stats:', error)
            return { activeCerts: 0, expiringSoon: 0, complianceRate: 0 }
        }
    })

export const createCatalogCertification = createServerFn({ method: 'POST' })
    .inputValidator((data: { cert: any; adminId: string }) => data)
    .handler(async ({ data }) => {
        try {
            if (!db) throw new Error('Database not available')

            // Role Check
            const requester = await db.select().from(users).where(eq(users.id, data.adminId)).limit(1)
            if (!requester.length || requester[0].role !== 'Admin') {
                throw new Error('Unauthorized')
            }

            const result = await db.insert(certifications).values({
                id: data.cert.id,
                name: data.cert.name,
                vendorId: data.cert.vendorId,
                vendorName: data.cert.vendorName,
                category: data.cert.category,
                difficulty: data.cert.difficulty,
                description: data.cert.description,
            }).returning()

            return result[0]
        } catch (error) {
            console.error('❌ [Server] Failed to create catalog cert:', error)
            throw error
        }
    })

export const updateCatalogCertification = createServerFn({ method: 'POST' })
    .inputValidator((data: { id: string; updates: any; adminId: string }) => data)
    .handler(async ({ data }) => {
        try {
            if (!db) throw new Error('Database not available')

            // Role Check
            const requester = await db.select().from(users).where(eq(users.id, data.adminId)).limit(1)
            if (!requester.length || requester[0].role !== 'Admin') {
                throw new Error('Unauthorized')
            }

            const result = await db.update(certifications)
                .set(data.updates)
                .where(eq(certifications.id, data.id))
                .returning()

            return result[0]
        } catch (error) {
            console.error('❌ [Server] Failed to update catalog cert:', error)
            throw error
        }
    })

export const deleteCatalogCertification = createServerFn({ method: 'POST' })
    .inputValidator((data: { id: string; adminId: string }) => data)
    .handler(async ({ data }) => {
        try {
            if (!db) throw new Error('Database not available')

            // Role Check
            const requester = await db.select().from(users).where(eq(users.id, data.adminId)).limit(1)
            if (!requester.length || requester[0].role !== 'Admin') {
                throw new Error('Unauthorized')
            }

            await db.delete(certifications).where(eq(certifications.id, data.id))
            return { success: true }
        } catch (error) {
            console.error('❌ [Server] Failed to delete catalog cert:', error)
            throw error
        }
    })

export const seedCatalog = createServerFn({ method: 'POST' })
    .handler(async () => {
        try {
            if (!db) throw new Error('Database not available')

            const certsToSeed = [
                { id: 'ms-az-104', name: 'Microsoft Azure Administrator', vendorId: 'msft', vendorName: 'Microsoft', category: 'Cloud', difficulty: 'Intermediate', description: 'Exam AZ-104: Microsoft Azure Administrator' },
                { id: 'ms-az-305', name: 'Azure Solutions Architect Expert', vendorId: 'msft', vendorName: 'Microsoft', category: 'Cloud', difficulty: 'Expert', description: 'Exam AZ-305: Designing Microsoft Azure Infrastructure Solutions' },
                { id: 'sn-csa', name: 'Certified System Administrator', vendorId: 'snow', vendorName: 'ServiceNow', category: 'ITSM', difficulty: 'Beginner', description: 'ServiceNow Certified System Administrator' },
                { id: 'sn-cad', name: 'Certified Application Developer', vendorId: 'snow', vendorName: 'ServiceNow', category: 'Development', difficulty: 'Intermediate', description: 'ServiceNow Certified Application Developer' },
            ]

            console.log('🌱 [Server] Seeding catalog...')
            for (const cert of certsToSeed) {
                await db.insert(certifications).values(cert).onConflictDoUpdate({
                    target: certifications.id,
                    set: cert
                })
            }

            return { success: true, count: certsToSeed.length }
        } catch (error) {
            console.error('❌ [Server] Seeding failed:', error)
            throw error
        }
    })

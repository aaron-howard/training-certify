import { createServerFn } from '@tanstack/react-start'
import { count, desc, eq, sql } from 'drizzle-orm'
import {
  auditLogs,
  certifications,
  notifications,
  userCertifications,
  users,
} from '../db/schema'
import { syncCatalogFromITExams } from '../lib/ingestion.server'

export const getCatalog = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getDb, instanceId } = await import('../db/db.server')
    const db = await getDb()
    if (!db)
      throw new Error(`Database not available (Server Instance: ${instanceId})`)

    try {
      const result = await db.select().from(certifications)
      return {
        certifications: result.map((c) => ({
          id: c.id,
          name: c.name,
          vendor: c.vendorName,
          level: c.difficulty,
        })),
      }
    } catch (error) {
      console.error('Failed to fetch catalog:', error)
      return { certifications: [] }
    }
  },
)

export const getComplianceData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getDb } = await import('../db/db.server')
    const db = await getDb()
    if (!db) throw new Error('Database not available')

    try {
      const logs = await db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.timestamp))
        .limit(10)

      return {
        auditLogs: logs.map((l) => ({
          id: l.id,
          user: 'System',
          action: l.action,
          date: l.timestamp.toISOString().split('T')[0],
          status: 'verified' as const,
        })),
        stats: { complianceRate: 88, totalAudits: logs.length, issuesFound: 1 },
      }
    } catch (error) {
      console.error('Failed to fetch compliance data:', error)
      return {
        auditLogs: [],
        stats: { complianceRate: 0, totalAudits: 0, issuesFound: 0 },
      }
    }
  },
)

export const getNotifications = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getDb } = await import('../db/db.server')
    const db = await getDb()
    if (!db) throw new Error('Database not available')

    try {
      const result = await db
        .select()
        .from(notifications)
        .orderBy(desc(notifications.timestamp))
        .limit(20)
      return result.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.description || '',
        type:
          n.severity === 'critical' ? ('alert' as const) : ('info' as const),
        date: n.timestamp.toISOString().split('T')[0],
        read: n.isRead,
      }))
    } catch (error) {
      console.error('❌ [Server] Failed:', error)
      return []
    }
  },
)

export const getDashboardStats = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getDb } = await import('../db/db.server')
    const db = await getDb()
    if (!db) throw new Error('Database not available')

    try {
      const activeResult = await db
        .select({ value: count() })
        .from(userCertifications)
        .where(sql`status IN ('active', 'expiring', 'expiring-soon')`)
      const expiringResult = await db
        .select({ value: count() })
        .from(userCertifications)
        .where(sql`status IN ('expiring', 'expiring-soon')`)

      const activeCerts = Number(activeResult[0].value)
      const expiringSoon = Number(expiringResult[0].value)

      return {
        activeCerts,
        expiringSoon,
        complianceRate: 88, // Mocked for now
      }
    } catch (error) {
      console.error('❌ [Server] Failed to fetch dashboard stats:', error)
      return { activeCerts: 0, expiringSoon: 0, complianceRate: 0 }
    }
  },
)

export const createCatalogCertification = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { cert: Record<string, unknown>; adminId: string }) => data,
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('../db/db.server')
    const db = await getDb()
    if (!db) throw new Error('Database not available')

    try {
      // Role Check
      const requester = await db
        .select()
        .from(users)
        .where(eq(users.id, data.adminId))
        .limit(1)
      if (!requester.length || requester[0].role !== 'Admin') {
        throw new Error('Unauthorized')
      }

      const certData = {
        id: String(data.cert.id),
        name: String(data.cert.name),
        vendorId: String(data.cert.vendorId),
        vendorName: String(data.cert.vendorName),
        category: data.cert.category ? String(data.cert.category) : undefined,
        difficulty: data.cert.difficulty
          ? String(data.cert.difficulty)
          : undefined,
        description: data.cert.description
          ? String(data.cert.description)
          : undefined,
      }

      const result = await db
        .insert(certifications)
        .values(certData)
        .returning()
      return result[0]
    } catch (error) {
      console.error('❌ [Server] Failed to create catalog cert:', error)
      throw error
    }
  })

export const updateCatalogCertification = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { id: string; updates: Record<string, unknown>; adminId: string }) =>
      data,
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('../db/db.server')
    const db = await getDb()
    if (!db) throw new Error('Database not available')

    try {
      // Role Check
      const requester = await db
        .select()
        .from(users)
        .where(eq(users.id, data.adminId))
        .limit(1)
      if (!requester.length || requester[0].role !== 'Admin') {
        throw new Error('Unauthorized')
      }

      const result = await db
        .update(certifications)
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
    const { getDb } = await import('../db/db.server')
    const db = await getDb()
    if (!db) throw new Error('Database not available')

    try {
      // Role Check
      const requester = await db
        .select()
        .from(users)
        .where(eq(users.id, data.adminId))
        .limit(1)
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

export const seedCatalog = createServerFn({ method: 'POST' }).handler(
  async () => {
    const { getDb } = await import('../db/db.server')
    const db = await getDb()
    if (!db) throw new Error('Database not available')

    try {
      const certsToSeed = [
        {
          id: 'ms-az-104',
          name: 'Microsoft Azure Administrator',
          vendorId: 'msft',
          vendorName: 'Microsoft',
          category: 'Cloud',
          difficulty: 'Intermediate',
          description: 'Exam AZ-104: Microsoft Azure Administrator',
        },
        {
          id: 'ms-az-305',
          name: 'Azure Solutions Architect Expert',
          vendorId: 'msft',
          vendorName: 'Microsoft',
          category: 'Cloud',
          difficulty: 'Expert',
          description:
            'Exam AZ-305: Designing Microsoft Azure Infrastructure Solutions',
        },
        {
          id: 'sn-csa',
          name: 'Certified System Administrator',
          vendorId: 'snow',
          vendorName: 'ServiceNow',
          category: 'ITSM',
          difficulty: 'Beginner',
          description: 'ServiceNow Certified System Administrator',
        },
        {
          id: 'sn-cad',
          name: 'Certified Application Developer',
          vendorId: 'snow',
          vendorName: 'ServiceNow',
          category: 'Development',
          difficulty: 'Intermediate',
          description: 'ServiceNow Certified Application Developer',
        },
      ]

      console.log('🌱 [Server] Seeding catalog...')
      for (const cert of certsToSeed) {
        await db.insert(certifications).values(cert).onConflictDoUpdate({
          target: certifications.id,
          set: cert,
        })
      }

      return { success: true, count: certsToSeed.length }
    } catch (error) {
      console.error('❌ [Server] Seeding failed:', error)
      throw error
    }
  },
)

export const syncCatalog = createServerFn({ method: 'POST' })
  .inputValidator((data: { adminId: string; limit?: number }) => data)
  .handler(async ({ data }) => {
    const { getDb } = await import('../db/db.server')
    const db = await getDb()
    if (!db) throw new Error('Database not available')

    try {
      // Role Check
      const requester = await db
        .select()
        .from(users)
        .where(eq(users.id, data.adminId))
        .limit(1)
      if (!requester.length || requester[0].role !== 'Admin') {
        throw new Error('Unauthorized')
      }

      console.log('🔄 [Server] Triggering ITExams Sync...')
      const result = await syncCatalogFromITExams(data.limit)

      // Log the action
      await db.insert(auditLogs).values({
        userId: data.adminId,
        action: 'Sync Catalog',
        resourceType: 'Certification',
        resourceId: 'ITExams',
        details: `Synced ${result.totalProcessed} certifications from ITExams`,
      })

      return { success: true, count: result.totalProcessed }
    } catch (error) {
      console.error('❌ [Server] Sync failed:', error)
      throw error
    }
  })
export const clearCatalog = createServerFn({ method: 'POST' })
  .inputValidator((data: { adminId: string }) => data)
  .handler(async ({ data }) => {
    const { getDb } = await import('../db/db.server')
    const db = await getDb()
    if (!db) throw new Error('Database not available')

    try {
      // Role Check
      const requester = await db
        .select()
        .from(users)
        .where(eq(users.id, data.adminId))
        .limit(1)
      if (!requester.length || requester[0].role !== 'Admin') {
        throw new Error('Unauthorized')
      }

      console.log('⚠️ [Server] Clearing catalog...')
      await db.delete(userCertifications)
      await db.delete(certifications)

      return { success: true }
    } catch (error) {
      console.error('❌ [Server] Clearing failed:', error)
      throw error
    }
  })

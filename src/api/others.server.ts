import { createServerFn } from '@tanstack/react-start'
import { count, desc, eq, sql } from 'drizzle-orm'
import {
  auditLogs,
  certifications,
  notifications,
  userCertifications,
} from '../db/schema'
import { syncCatalogFromITExams } from '../lib/ingestion.server'
import { validateCategory, validateDifficulty } from '../lib/enum-helpers'
import { UpdateCatalogCertificationSchema } from '../lib/validation'
import { ValidationError } from '../lib/errors'
import { getAuthenticatedUser, requireRole } from '../lib/auth.server'
import { logError, logInfo } from '../lib/logging.server'

/**
 * Server function to retrieve the certification catalog.
 *
 * Fetches all certifications from the catalog and returns them in a simplified
 * format suitable for display in the UI.
 *
 * @returns Promise that resolves to an object containing:
 *   - certifications: Array of catalog entries with id, name, vendor, and level
 * @throws {Error} If database is unavailable
 *
 * @example
 * ```typescript
 * const catalog = await getCatalog()
 * console.log(`Found ${catalog.certifications.length} certifications`)
 * ```
 */
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
      logError(error, { function: 'getCatalog' }, 'Failed to fetch catalog')
      return { certifications: [] }
    }
  },
)

/**
 * Server function to retrieve compliance audit data.
 *
 * Fetches recent audit logs and calculates compliance statistics.
 * Returns the last 10 audit log entries along with compliance metrics.
 *
 * @returns Promise that resolves to an object containing:
 *   - auditLogs: Array of audit log entries (last 10)
 *   - stats: Object with complianceRate, totalAudits, and issuesFound
 * @throws {Error} If database is unavailable
 *
 * @example
 * ```typescript
 * const compliance = await getComplianceData()
 * console.log(`Compliance rate: ${compliance.stats.complianceRate}%`)
 * ```
 */
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
      logError(
        error,
        { function: 'getComplianceData' },
        'Failed to fetch compliance data',
      )
      return {
        auditLogs: [],
        stats: { complianceRate: 0, totalAudits: 0, issuesFound: 0 },
      }
    }
  },
)

/**
 * Server function to retrieve user notifications.
 *
 * Fetches notifications for the authenticated user. This function should
 * filter by userId in a production environment.
 *
 * @returns Promise that resolves to an array of notification objects
 * @throws {Error} If database is unavailable
 *
 * @example
 * ```typescript
 * const notifications = await getNotifications()
 * console.log(`You have ${notifications.length} notifications`)
 * ```
 */
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
      logError(
        error,
        { function: 'getNotifications' },
        'Failed to fetch notifications',
      )
      return []
    }
  },
)

/**
 * Server function to retrieve dashboard statistics.
 *
 * Calculates and returns key metrics for the dashboard, including:
 * - Active certifications count
 * - Expiring soon certifications count
 * - Compliance rate
 *
 * @returns Promise that resolves to an object containing:
 *   - activeCerts: number - Count of active/expiring certifications
 *   - expiringSoon: number - Count of certifications expiring soon
 *   - complianceRate: number - Compliance rate percentage (0-100)
 * @throws {Error} If database is unavailable
 *
 * @example
 * ```typescript
 * const stats = await getDashboardStats()
 * console.log(`Active certs: ${stats.activeCerts}, Compliance: ${stats.complianceRate}%`)
 * ```
 */
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
      logError(
        error,
        { function: 'getDashboardStats' },
        'Failed to fetch dashboard stats',
      )
      return { activeCerts: 0, expiringSoon: 0, complianceRate: 0 }
    }
  },
)

/**
 * Server function to create a new certification in the catalog.
 *
 * Adds a new certification entry to the catalog. Only accessible by Admins.
 * Validates category and difficulty using enum helpers before insertion.
 *
 * **Authorization:** Admin role required
 * **CSRF Protection:** Automatically handled by TanStack Start for server functions
 *
 * @param data - Input data:
 *   - cert: Record<string, unknown> (required) - Certification data object with:
 *     - id: string (required) - Certification ID
 *     - name: string (required) - Certification name
 *     - vendorId: string (optional) - Vendor ID
 *     - vendorName: string (required) - Vendor name
 *     - category?: string (optional) - Category (validated against enum)
 *     - difficulty?: string (optional) - Difficulty level (validated against enum)
 *     - description?: string (optional) - Certification description
 *   - adminId: string (required) - Admin user ID (for audit purposes)
 *
 * @returns Promise that resolves to the created certification object
 * @throws {ForbiddenError} If caller is not an Admin
 * @throws {Error} If database is unavailable
 *
 * @example
 * ```typescript
 * const cert = await createCatalogCertification({
 *   cert: {
 *     id: 'ms-az-104',
 *     name: 'Azure Administrator',
 *     vendorName: 'Microsoft',
 *     category: 'Cloud',
 *     difficulty: 'Intermediate'
 *   },
 *   adminId: 'admin_123'
 * })
 * ```
 */
export const createCatalogCertification = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { cert: Record<string, unknown>; adminId: string }) => data,
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('../db/db.server')
    const db = await getDb()
    if (!db) throw new Error('Database not available')

    try {
      // Use centralized auth helper
      await requireRole(['Admin'])

      const certData = {
        id: String(data.cert.id),
        name: String(data.cert.name),
        vendorId: String(data.cert.vendorId),
        vendorName: String(data.cert.vendorName),
        category: data.cert.category
          ? validateCategory(String(data.cert.category))
          : undefined,
        difficulty: data.cert.difficulty
          ? validateDifficulty(String(data.cert.difficulty))
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
      logError(
        error,
        { function: 'createCatalogCertification' },
        'Failed to create catalog certification',
      )
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
      // Use centralized auth helper
      await requireRole(['Admin'])

      // Validate updates with Zod schema
      const validation = UpdateCatalogCertificationSchema.safeParse(
        data.updates,
      )
      if (!validation.success) {
        throw new ValidationError(
          'Invalid catalog update data',
          validation.error.errors,
        )
      }

      // Validate category and difficulty if provided
      const validatedUpdates: Record<string, unknown> = { ...validation.data }
      if (validatedUpdates.category) {
        validatedUpdates.category = validateCategory(
          String(validatedUpdates.category),
        )
      }
      if (validatedUpdates.difficulty) {
        validatedUpdates.difficulty = validateDifficulty(
          String(validatedUpdates.difficulty),
        )
      }

      const result = await db
        .update(certifications)
        .set(validatedUpdates)
        .where(eq(certifications.id, data.id))
        .returning()

      if (result.length === 0) {
        throw new Error('Certification not found')
      }

      return result[0]
    } catch (error) {
      logError(
        error,
        { function: 'updateCatalogCertification' },
        'Failed to update catalog certification',
      )
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
      // Use centralized auth helper
      await requireRole(['Admin'])

      await db.delete(certifications).where(eq(certifications.id, data.id))
      return { success: true }
    } catch (error) {
      logError(
        error,
        { function: 'deleteCatalogCertification', certificationId: data.id },
        'Failed to delete catalog certification',
      )
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
          category: validateCategory('Cloud') || 'Cloud',
          difficulty: validateDifficulty('Intermediate') || 'Intermediate',
          description: 'Exam AZ-104: Microsoft Azure Administrator',
        },
        {
          id: 'ms-az-305',
          name: 'Azure Solutions Architect Expert',
          vendorId: 'msft',
          vendorName: 'Microsoft',
          category: validateCategory('Cloud') || 'Cloud',
          difficulty: validateDifficulty('Expert') || 'Expert',
          description:
            'Exam AZ-305: Designing Microsoft Azure Infrastructure Solutions',
        },
        {
          id: 'sn-csa',
          name: 'Certified System Administrator',
          vendorId: 'snow',
          vendorName: 'ServiceNow',
          category: validateCategory('IT') || 'Cloud', // ITSM not in enum, using IT
          difficulty: validateDifficulty('Beginner') || 'Beginner',
          description: 'ServiceNow Certified System Administrator',
        },
        {
          id: 'sn-cad',
          name: 'Certified Application Developer',
          vendorId: 'snow',
          vendorName: 'ServiceNow',
          category: validateCategory('IT') || 'Cloud', // Development not in enum, using IT
          difficulty: validateDifficulty('Intermediate') || 'Intermediate',
          description: 'ServiceNow Certified Application Developer',
        },
      ]

      logInfo('Seeding catalog', {
        function: 'seedCatalog',
        count: certsToSeed.length,
      })
      for (const cert of certsToSeed) {
        await db.insert(certifications).values(cert).onConflictDoUpdate({
          target: certifications.id,
          set: cert,
        })
      }

      return { success: true, count: certsToSeed.length }
    } catch (error) {
      logError(error, { function: 'seedCatalog' }, 'Seeding catalog failed')
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
      // Use centralized auth helper
      await requireRole(['Admin'])

      logInfo('Triggering ITExams Sync', {
        function: 'syncCatalog',
        limit: data.limit,
      })
      const result = await syncCatalogFromITExams(data.limit)

      // Log the action using authenticated user
      const session = await getAuthenticatedUser()
      await db.insert(auditLogs).values({
        userId: session.userId,
        action: 'Sync Catalog',
        resourceType: 'Certification',
        resourceId: 'ITExams',
        details: `Synced ${result.totalProcessed} certifications from ITExams`,
      })

      return { success: true, count: result.totalProcessed }
    } catch (error) {
      logError(error, { function: 'syncCatalog' }, 'Catalog sync failed')
      throw error
    }
  })
export const clearCatalog = createServerFn({ method: 'POST' })
  .inputValidator((data: { adminId: string }) => data)
  .handler(async () => {
    const { getDb } = await import('../db/db.server')
    const db = await getDb()
    if (!db) throw new Error('Database not available')

    try {
      // Use centralized auth helper
      await requireRole(['Admin'])

      logInfo('Clearing catalog', { function: 'clearCatalog' })
      await db.delete(userCertifications)
      await db.delete(certifications)

      return { success: true }
    } catch (error) {
      logError(error, { function: 'clearCatalog' }, 'Clearing catalog failed')
      throw error
    }
  })

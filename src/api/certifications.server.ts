import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { userCertifications } from '../db/schema'
import type { UserCertification } from '../types'
import { getVerifiedAuth, getAuthenticatedUser } from '../lib/auth.server'
import { auditCertificationAction } from '../lib/audit.server'

// Zod schemas for input validation
const certificationStatusSchema = z.enum([
  'active',
  'expiring',
  'expiring-soon',
  'expired',
  'assigned',
])

const createCertificationSchema = z.object({
  userId: z.string().min(1).max(255).optional(),
  certificationId: z.string().min(1).max(255).optional(),
  certificationName: z.string().min(1, 'Certification name is required').max(255),
  vendorName: z.string().min(1, 'Vendor name is required').max(255),
  certificationNumber: z.string().max(255).optional(),
  issueDate: z.string().optional(),
  expirationDate: z.string().optional(),
  status: certificationStatusSchema.optional().default('active'),
  daysUntilExpiration: z.number().int().optional(),
  documentUrl: z.string().url().optional().or(z.literal('')),
  verifiedAt: z.union([z.string(), z.date()]).optional(),
})

const updateCertificationSchema = z.object({
  id: z.string().min(1, 'Certification ID is required'),
  updates: z.object({
    userId: z.string().min(1).max(255).optional(),
    certificationId: z.string().min(1).max(255).optional(),
    certificationName: z.string().min(1).max(255).optional(),
    vendorName: z.string().min(1).max(255).optional(),
    certificationNumber: z.string().max(255).optional(),
    issueDate: z.string().optional(),
    expirationDate: z.string().optional(),
    status: certificationStatusSchema.optional(),
    daysUntilExpiration: z.number().int().optional(),
    documentUrl: z.string().url().optional().or(z.literal('')),
    verifiedAt: z.union([z.string(), z.date()]).optional(),
  }),
})

const deleteCertificationSchema = z.string().min(1, 'Certification ID is required')

export const getUserCertifications = createServerFn({ method: 'GET' }).handler(
  async () => {
    // SECURITY: Require authentication
    const userId = await getVerifiedAuth()
    const session = await getAuthenticatedUser()
    
    const { getDb, instanceId } = await import('../db/db.server')
    const db = await getDb()
    if (!db)
      throw new Error(`Database not available (Server Instance: ${instanceId})`)

    try {
      // SECURITY: Role-based data access
      // Admins, Auditors, and Executives can see all certifications
      // Regular users can only see their own
      const privilegedRoles = ['Admin', 'Auditor', 'Executive', 'Manager']
      
      let result
      if (privilegedRoles.includes(session.role)) {
        result = await db.select().from(userCertifications)
      } else {
        result = await db
          .select()
          .from(userCertifications)
          .where(eq(userCertifications.userId, userId))
      }
      
      const mapped = result.map((cert) => ({
        ...cert,
        verifiedAt: cert.verifiedAt?.toISOString() || '',
        status: (cert.status || 'active') as UserCertification['status'],
      })) as Array<UserCertification>
      console.log(`[Server] Returning ${mapped.length} user certifications for ${session.role}`)
      return mapped
    } catch (error) {
      console.error('[Server] Failed to fetch user certifications:', error)
      throw new Error('Failed to fetch certifications')
    }
  },
)

// Type inferred from Zod schema
type CreateCertificationInput = z.infer<typeof createCertificationSchema>

export const createCertification = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): CreateCertificationInput => {
    // Zod validation with detailed error messages
    const result = createCertificationSchema.safeParse(data)
    if (!result.success) {
      const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      throw new Error(`Validation failed: ${errors}`)
    }
    return result.data
  })
  .handler(async ({ data }) => {
    // SECURITY: Require authentication
    const authenticatedUserId = await getVerifiedAuth()
    const session = await getAuthenticatedUser()
    
    const { getDb } = await import('../db/db.server')
    const db = await getDb()
    if (!db) throw new Error('Database not available')

    // SECURITY: Only admins/managers can create certs for other users
    // Regular users can only create certs for themselves
    let targetUserId = data.userId || authenticatedUserId
    
    if (targetUserId !== authenticatedUserId) {
      const canCreateForOthers = ['Admin', 'Manager'].includes(session.role)
      if (!canCreateForOthers) {
        throw new Error('Forbidden: You can only create certifications for yourself')
      }
    }

    try {
      const verifiedAtValue = data.verifiedAt
        ? typeof data.verifiedAt === 'string'
          ? new Date(data.verifiedAt)
          : data.verifiedAt
        : new Date()

      const result = await db
        .insert(userCertifications)
        .values({
          userId: targetUserId,
          certificationId: data.certificationId || 'manual',
          certificationName: data.certificationName || 'Unknown Certification',
          vendorName: data.vendorName || 'Unknown Vendor',
          certificationNumber: data.certificationNumber,
          issueDate: data.issueDate,
          expirationDate: data.expirationDate,
          status: data.status || 'active',
          daysUntilExpiration: data.daysUntilExpiration,
          documentUrl: data.documentUrl || '',
          verifiedAt: verifiedAtValue,
        })
        .returning()

      const newCert = result[0]
      
      // Audit log the creation
      await auditCertificationAction(
        authenticatedUserId,
        'CREATE',
        newCert.id,
        newCert.certificationName,
        targetUserId !== authenticatedUserId ? `Created for user ${targetUserId}` : undefined
      )
      
      return {
        ...newCert,
        verifiedAt: newCert.verifiedAt?.toISOString() || '',
        status: newCert.status as UserCertification['status'],
      } as UserCertification
    } catch (error) {
      console.error('[Server] Failed to create certification:', error)
      throw error
    }
  })

// Type inferred from Zod schema
type UpdateCertificationInput = z.infer<typeof updateCertificationSchema>

export const updateCertification = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): UpdateCertificationInput => {
    // Zod validation with detailed error messages
    const result = updateCertificationSchema.safeParse(data)
    if (!result.success) {
      const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      throw new Error(`Validation failed: ${errors}`)
    }
    return result.data
  })
  .handler(async ({ data }) => {
    // SECURITY: Require authentication
    const authenticatedUserId = await getVerifiedAuth()
    const session = await getAuthenticatedUser()
    
    const { getDb } = await import('../db/db.server')
    const db = await getDb()
    if (!db) throw new Error('Database not available')

    try {
      const { id, updates } = data
      
      // SECURITY: Check if user owns this certification or has elevated privileges
      const existingCert = await db
        .select()
        .from(userCertifications)
        .where(eq(userCertifications.id, id))
        .limit(1)
      
      if (existingCert.length === 0) {
        throw new Error('Certification not found')
      }
      
      const isOwner = existingCert[0].userId === authenticatedUserId
      const canEditOthers = ['Admin', 'Manager'].includes(session.role)
      
      if (!isOwner && !canEditOthers) {
        throw new Error('Forbidden: You can only update your own certifications')
      }
      
      const { verifiedAt, ...rest } = updates
      const updateData: Record<string, unknown> = { ...rest }
      if (verifiedAt) {
        updateData.verifiedAt =
          typeof verifiedAt === 'string' ? new Date(verifiedAt) : verifiedAt
      }
      if ('updatedAt' in updateData) {
        delete updateData.updatedAt
      }
      const result = await db
        .update(userCertifications)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(userCertifications.id, id))
        .returning()
      const updatedCert = result[0]
      
      // Audit log the update
      await auditCertificationAction(
        authenticatedUserId,
        'UPDATE',
        updatedCert.id,
        updatedCert.certificationName,
        `Updated fields: ${Object.keys(updates).join(', ')}`
      )
      
      return {
        ...updatedCert,
        verifiedAt: updatedCert.verifiedAt?.toISOString() || '',
        status: updatedCert.status as UserCertification['status'],
      } as UserCertification
    } catch (error) {
      console.error('[Server] Failed to update certification:', error)
      throw error
    }
  })

export const deleteCertification = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): string => {
    // Zod validation for delete
    const result = deleteCertificationSchema.safeParse(data)
    if (!result.success) {
      throw new Error('Invalid certification ID')
    }
    return result.data
  })
  .handler(async ({ data: id }) => {
    // SECURITY: Require authentication
    const authenticatedUserId = await getVerifiedAuth()
    const session = await getAuthenticatedUser()
    
    const { getDb } = await import('../db/db.server')
    const db = await getDb()
    if (!db) throw new Error('Database not available')

    try {
      // SECURITY: Check if user owns this certification or has elevated privileges
      const existingCert = await db
        .select()
        .from(userCertifications)
        .where(eq(userCertifications.id, id))
        .limit(1)
      
      if (existingCert.length === 0) {
        throw new Error('Certification not found')
      }
      
      const isOwner = existingCert[0].userId === authenticatedUserId
      const canDeleteOthers = ['Admin'].includes(session.role)
      
      if (!isOwner && !canDeleteOthers) {
        throw new Error('Forbidden: You can only delete your own certifications')
      }
      
      // Capture name before deletion for audit
      const certName = existingCert[0].certificationName
      
      await db.delete(userCertifications).where(eq(userCertifications.id, id))
      
      // Audit log the deletion
      await auditCertificationAction(
        authenticatedUserId,
        'DELETE',
        id,
        certName
      )
      
      return { success: true }
    } catch (error) {
      console.error('[Server] Failed to delete certification:', error)
      throw error
    }
  })

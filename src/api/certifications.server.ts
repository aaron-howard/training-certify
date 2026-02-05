import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { userCertifications } from '../db/schema'
import { CreateCertificationInputSchema, UpdateCertificationInputSchema } from '../lib/validation'
import { DatabaseError } from '../lib/errors'
import type { UserCertification } from '../types'

export const getUserCertifications = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getDbOrThrow } = await import('../db/db.server')
    const db = await getDbOrThrow()

    try {
      const result = await db.select().from(userCertifications)
      const mapped = result.map((cert) => ({
        ...cert,
        verifiedAt: cert.verifiedAt?.toISOString() || '',
        status: cert.status as UserCertification['status'],
      })) as Array<UserCertification>
      console.log(`✅ [Server] Returning ${mapped.length} user certifications`)
      return mapped
    } catch (error) {
      console.error('❌ [Server] Failed to fetch user certifications:', error)
      throw new DatabaseError(
        `Failed to fetch user certifications: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  },
)

export const createCertification = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return CreateCertificationInputSchema.parse(data)
  })
  .handler(async ({ data }) => {
    const { getDbOrThrow } = await import('../db/db.server')
    const db = await getDbOrThrow()

    try {
      const verifiedAtValue = data.verifiedAt
        ? typeof data.verifiedAt === 'string'
          ? new Date(data.verifiedAt)
          : data.verifiedAt
        : new Date()

      const result = await db
        .insert(userCertifications)
        .values({
          userId: data.userId || 'user-001',
          certificationId: data.certificationId || 'manual',
          certificationName: data.certificationName || 'Unknown Certification',
          vendorName: data.vendorName || 'Unknown Vendor',
          certificationNumber: data.certificationNumber,
          issueDate: data.issueDate,
          expirationDate: data.expirationDate,
          status: data.status,
          daysUntilExpiration: data.daysUntilExpiration,
          documentUrl: data.documentUrl || '',
          verifiedAt: verifiedAtValue,
        })
        .returning()

      const newCert = result[0]
      return {
        ...newCert,
        verifiedAt: newCert.verifiedAt?.toISOString() || '',
        status: newCert.status as UserCertification['status'],
      } as UserCertification
    } catch (error) {
      console.error('❌ [Server] Failed to create certification:', error)
      if (error instanceof Error && error.message.includes('validation')) {
        throw error
      }
      throw new DatabaseError(
        `Failed to create certification: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })

export const updateCertification = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return UpdateCertificationInputSchema.parse(data)
  })
  .handler(async ({ data }) => {
    const { getDbOrThrow } = await import('../db/db.server')
    const db = await getDbOrThrow()

    try {
      const { id, updates } = data
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
      return {
        ...updatedCert,
        verifiedAt: updatedCert.verifiedAt?.toISOString() || '',
        status: updatedCert.status as UserCertification['status'],
      } as UserCertification
    } catch (error) {
      console.error('❌ [Server] Failed to update certification:', error)
      if (error instanceof Error && error.message.includes('validation')) {
        throw error
      }
      throw new DatabaseError(
        `Failed to update certification: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })

export const deleteCertification = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    if (typeof data === 'string' && data.length > 0) {
      return data
    }
    throw new Error('Invalid certification ID')
  })
  .handler(async ({ data: id }) => {
    const { getDbOrThrow } = await import('../db/db.server')
    const db = await getDbOrThrow()

    try {
      await db.delete(userCertifications).where(eq(userCertifications.id, id))
      return { success: true }
    } catch (error) {
      console.error('❌ [Server] Failed to delete certification:', error)
      throw new DatabaseError(
        `Failed to delete certification: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })

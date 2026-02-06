import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { userCertifications } from '../db/schema'
import {
  CreateCertificationInputSchema,
  UpdateCertificationInputSchema,
} from '../lib/validation'
import { DatabaseError } from '../lib/errors'
import { logError, logInfo } from '../lib/logging.server'
import type { UserCertification } from '../types'

/**
 * Server function to retrieve all user certifications.
 *
 * Fetches all user certification records from the database and maps them
 * to the UserCertification type format. This is a server function that
 * can be called from the client using TanStack Start's createServerFn.
 *
 * **Note:** This function does not filter by user - it returns all certifications.
 * Consider adding user filtering if this is a security concern.
 *
 * @returns Promise that resolves to an array of UserCertification objects
 * @throws {DatabaseError} If the database query fails
 *
 * @example
 * ```typescript
 * const certifications = await getUserCertifications()
 * console.log(`Found ${certifications.length} certifications`)
 * ```
 */
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
      logInfo(`Returning ${mapped.length} user certifications`, {
        function: 'getUserCertifications',
        count: mapped.length,
      })
      return mapped
    } catch (error) {
      logError(
        error,
        { function: 'getUserCertifications' },
        'Failed to fetch user certifications',
      )
      throw new DatabaseError(
        `Failed to fetch user certifications: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  },
)

/**
 * Server function to create a new user certification record.
 *
 * Validates input data using CreateCertificationInputSchema and inserts
 * a new certification record into the database. This is a server function
 * that can be called from the client using TanStack Start's createServerFn.
 *
 * **CSRF Protection:** Automatically handled by TanStack Start for server functions
 *
 * @param data - Certification data validated against CreateCertificationInputSchema:
 *   - userId: string (required) - ID of the user who has the certification
 *   - certificationId: string (required) - ID of the certification from catalog
 *   - certificationName?: string (optional) - Name of the certification
 *   - vendorName?: string (optional) - Name of the vendor
 *   - status?: CertificationStatus (optional) - Status, defaults to 'active'
 *   - issueDate?: string (optional) - ISO date string
 *   - expirationDate?: string (optional) - ISO date string
 *   - certificationNumber?: string (optional) - Certification number/license
 *   - daysUntilExpiration?: number (optional) - Days until expiration
 *   - documentUrl?: string (optional) - URL to proof document
 *   - verifiedAt?: string | Date (optional) - When certification was verified
 *
 * @returns Promise that resolves to the created UserCertification object
 * @throws {ValidationError} If input data doesn't match schema
 * @throws {DatabaseError} If database insertion fails
 *
 * @example
 * ```typescript
 * const cert = await createCertification({
 *   userId: 'user_123',
 *   certificationId: 'ms-az-104',
 *   status: 'active',
 *   issueDate: '2024-01-01',
 *   expirationDate: '2027-01-01'
 * })
 * ```
 */
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
      logError(
        error,
        { function: 'createCertification' },
        'Failed to create certification',
      )
      if (error instanceof Error && error.message.includes('validation')) {
        throw error
      }
      throw new DatabaseError(
        `Failed to create certification: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  })

/**
 * Server function to update an existing user certification record.
 *
 * Validates input data using UpdateCertificationInputSchema and updates
 * the certification record in the database. Only updates fields that are
 * provided in the updates object.
 *
 * **CSRF Protection:** Automatically handled by TanStack Start for server functions
 *
 * @param data - Update data validated against UpdateCertificationInputSchema:
 *   - id: string (required) - UUID of the certification to update
 *   - updates: object (required) - Partial certification data to update:
 *     - userId?: string (optional) - User ID
 *     - certificationId?: string (optional) - Certification ID
 *     - certificationName?: string (optional) - Certification name
 *     - vendorName?: string (optional) - Vendor name
 *     - status?: CertificationStatus (optional) - Status
 *     - issueDate?: string (optional) - ISO date string
 *     - expirationDate?: string (optional) - ISO date string
 *     - certificationNumber?: string (optional) - Certification number
 *     - daysUntilExpiration?: number (optional) - Days until expiration
 *     - documentUrl?: string (optional) - URL to proof document
 *     - verifiedAt?: string | Date (optional) - Verification timestamp
 *
 * @returns Promise that resolves to the updated UserCertification object
 * @throws {ValidationError} If input data doesn't match schema
 * @throws {DatabaseError} If database update fails
 *
 * @example
 * ```typescript
 * const updated = await updateCertification({
 *   id: 'cert-uuid-123',
 *   updates: {
 *     status: 'expired',
 *     expirationDate: '2024-12-31'
 *   }
 * })
 * ```
 */
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
      logError(
        error,
        { function: 'updateCertification' },
        'Failed to update certification',
      )
      if (error instanceof Error && error.message.includes('validation')) {
        throw error
      }
      throw new DatabaseError(
        `Failed to update certification: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  })

/**
 * Server function to delete a user certification record.
 *
 * Deletes a certification from the database by ID. This is a permanent operation.
 *
 * **CSRF Protection:** Automatically handled by TanStack Start for server functions
 *
 * @param id - Certification ID (UUID string) to delete
 * @returns Promise that resolves to void (success) or throws on error
 * @throws {Error} If certification ID is invalid (not a non-empty string)
 * @throws {DatabaseError} If database deletion fails
 *
 * @example
 * ```typescript
 * await deleteCertification('cert-uuid-123')
 * ```
 */
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
      logError(
        error,
        { function: 'deleteCertification' },
        'Failed to delete certification',
      )
      throw new DatabaseError(
        `Failed to delete certification: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  })

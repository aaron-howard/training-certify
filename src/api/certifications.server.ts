import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { differenceInDays } from 'date-fns'
import { certifications, userCertifications, vendors } from '../db/schema'
import {
  CreateCertificationInputSchema,
  UpdateCertificationInputSchema,
} from '../lib/validation'
import { DatabaseError } from '../lib/errors'
import { logError, logInfo } from '../lib/logging.server'

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
 * @returns Promise that resolves to an array of UserCertificationWithDetails objects
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
      const rows = await db
        .select({
          id: userCertifications.id,
          userId: userCertifications.userId,
          certificationId: userCertifications.certificationId,
          certificationNumber: userCertifications.certificationNumber,
          issueDate: userCertifications.issueDate,
          expirationDate: userCertifications.expirationDate,
          status: userCertifications.status,
          documentUrl: userCertifications.documentUrl,
          verifiedAt: userCertifications.verifiedAt,
          assignedById: userCertifications.assignedById,
          createdAt: userCertifications.createdAt,
          updatedAt: userCertifications.updatedAt,
          certificationName: certifications.name,
          vendorName: vendors.name,
        })
        .from(userCertifications)
        .innerJoin(
          certifications,
          eq(userCertifications.certificationId, certifications.id),
        )
        .innerJoin(vendors, eq(certifications.vendorId, vendors.id))

      const mapped = rows.map((r) => {
        const exp = r.expirationDate
        const daysUntilExpiration =
          exp != null
            ? differenceInDays(
                typeof exp === 'string' ? new Date(exp) : exp,
                new Date(),
              )
            : null
        return {
          ...r,
          verifiedAt: r.verifiedAt?.toISOString() ?? null,
          status: r.status,
          daysUntilExpiration,
        }
      })
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
 *   - status?: CertificationStatus (optional) - Status, defaults to 'active'
 *   - issueDate?: string (optional) - ISO date string
 *   - expirationDate?: string (optional) - ISO date string
 *   - certificationNumber?: string (optional) - Certification number/license
 *   - documentUrl?: string (optional) - URL to proof document
 *   - verifiedAt?: string | Date (optional) - When certification was verified
 *
 * @returns Promise that resolves to the created UserCertificationWithDetails object
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
        : undefined

      const insertValues: typeof userCertifications.$inferInsert = {
        userId: data.userId || 'user-001',
        certificationId: data.certificationId || 'manual',
        certificationNumber: data.certificationNumber,
        issueDate: data.issueDate
          ? new Date(data.issueDate).toISOString().split('T')[0]
          : undefined,
        expirationDate: data.expirationDate
          ? new Date(data.expirationDate).toISOString().split('T')[0]
          : undefined,
        status: data.status,
        documentUrl: data.documentUrl ?? null,
        verifiedAt: verifiedAtValue,
      }
      const result = await db
        .insert(userCertifications)
        .values(insertValues)
        .returning()

      const newCert = result[0]
      const [joined] = await db
        .select({
          certificationName: certifications.name,
          vendorName: vendors.name,
        })
        .from(userCertifications)
        .innerJoin(
          certifications,
          eq(userCertifications.certificationId, certifications.id),
        )
        .innerJoin(vendors, eq(certifications.vendorId, vendors.id))
        .where(eq(userCertifications.id, newCert.id))

      const exp = newCert.expirationDate
      const daysUntilExpiration =
        exp != null
          ? differenceInDays(
              typeof exp === 'string' ? new Date(exp) : exp,
              new Date(),
            )
          : null

      return {
        ...newCert,
        certificationName: joined.certificationName,
        vendorName: joined.vendorName,
        daysUntilExpiration,
        verifiedAt: newCert.verifiedAt?.toISOString() ?? null,
        status: newCert.status,
      }
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
 *     - status?: CertificationStatus (optional) - Status
 *     - issueDate?: string (optional) - ISO date string
 *     - expirationDate?: string (optional) - ISO date string
 *     - certificationNumber?: string (optional) - Certification number
 *     - documentUrl?: string (optional) - URL to proof document
 *     - verifiedAt?: string | Date (optional) - Verification timestamp
 *
 * @returns Promise that resolves to the updated UserCertificationWithDetails object
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
      const {
        verifiedAt,
        certificationName,
        vendorName,
        daysUntilExpiration,
        ...rest
      } = updates as Record<string, unknown>
      const updateData: Record<string, unknown> = {
        ...rest,
        updatedAt: new Date(),
      }
      if (verifiedAt !== undefined) {
        updateData.verifiedAt =
          typeof verifiedAt === 'string' ? new Date(verifiedAt) : verifiedAt
      }
      if (updates.issueDate !== undefined) {
        updateData.issueDate = updates.issueDate
          ? new Date(updates.issueDate)
          : null
      }
      if (updates.expirationDate !== undefined) {
        updateData.expirationDate = updates.expirationDate
          ? new Date(updates.expirationDate)
          : null
      }
      const result = await db
        .update(userCertifications)
        .set(updateData as Partial<typeof userCertifications.$inferInsert>)
        .where(eq(userCertifications.id, id))
        .returning()
      const updatedCert = result[0]
      const [joined] = await db
        .select({
          certificationName: certifications.name,
          vendorName: vendors.name,
        })
        .from(userCertifications)
        .innerJoin(
          certifications,
          eq(userCertifications.certificationId, certifications.id),
        )
        .innerJoin(vendors, eq(certifications.vendorId, vendors.id))
        .where(eq(userCertifications.id, id))
      const exp = updatedCert.expirationDate
      const days =
        exp != null
          ? differenceInDays(
              typeof exp === 'string' ? new Date(exp) : exp,
              new Date(),
            )
          : null
      return {
        ...updatedCert,
        certificationName: joined.certificationName,
        vendorName: joined.vendorName,
        daysUntilExpiration: days,
        verifiedAt: updatedCert.verifiedAt?.toISOString() ?? null,
        status: updatedCert.status,
      }
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

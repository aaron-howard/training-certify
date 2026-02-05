import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { getDbOrThrow } from '../db/db.server'
import {
  auditLogs,
  certifications,
  teams,
  userCertificationProofs,
  userCertifications,
  userTeams,
} from '../db/schema'
import { requireRole } from '../lib/auth.server'
import { RateLimitPresets, requireRateLimit } from '../lib/rateLimit.server'
import { getCSRFTokenFromRequest, requireCSRFToken } from '../lib/csrf.server'
import { AppError, ForbiddenError, NotFoundError, ValidationError } from '../lib/errors'
import {
  CreateUserCertificationSchema,
  CertificationPatchSchema
} from '../lib/validation'
import type { AuthSession } from '../lib/auth.server'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type * as schema from '../db/schema'

/**
 * Helper to check if a requester has authority over a specific user.
 * Authority exists if:
 * 1. Requester is the user themselves.
 * 2. Requester is an Admin or Auditor.
 * 3. Requester is a Manager of a team the user belongs to.
 */
async function checkAuthority(
  db: NodePgDatabase<typeof schema>,
  requester: AuthSession,
  targetUserId: string,
) {
  if (requester.userId === targetUserId) return true
  if (
    requester.role === 'Admin' ||
    requester.role === 'Auditor' ||
    requester.role === 'Executive'
  )
    return true

  if (requester.role === 'Manager') {
    // Check if requester manages a team that targetUserId is in
    const managedTeams = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.managerId, requester.userId))

    if (managedTeams.length > 0) {
      const teamIds = managedTeams.map((t) => t.id)
      const membership = await db
        .select()
        .from(userTeams)
        .where(eq(userTeams.userId, targetUserId))

      const isMember = membership.some((m) => teamIds.includes(m.teamId))
      if (isMember) return true
    }
  }

  return false
}

export const Route = createFileRoute('/api/certifications')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const session = await requireRole([
            'Admin',
            'Manager',
            'Auditor',
            'Executive',
            'User',
          ])
          const url = new URL(request.url)
          const userIdParam = url.searchParams.get('userId')
          const certId = url.searchParams.get('id')

          const db = await getDbOrThrow()

          // If requesting a specific certification
          if (certId) {
            const certResult = await db
              .select()
              .from(userCertifications)
              .where(eq(userCertifications.id, certId))
              .limit(1)

            if (certResult.length === 0) throw new NotFoundError('Certification not found')

            const cert = certResult[0]
            if (!(await checkAuthority(db, session, cert.userId))) {
              throw new ForbiddenError('You do not have permission to view this certification')
            }

            const proofs = await db
              .select()
              .from(userCertificationProofs)
              .where(eq(userCertificationProofs.userCertificationId, certId))
              .orderBy(desc(userCertificationProofs.uploadedAt))

            return json({ ...cert, proofs })
          }

          // If requesting by user
          if (userIdParam) {
            if (!(await checkAuthority(db, session, userIdParam))) {
              throw new ForbiddenError('You do not have permission to view this user\'s certifications')
            }

            const result = await db
              .select()
              .from(userCertifications)
              .where(eq(userCertifications.userId, userIdParam))

            return json(result)
          }

          // Global list (Admin/Auditor/Executive only)
          if (
            session.role !== 'Admin' &&
            session.role !== 'Auditor' &&
            session.role !== 'Executive'
          ) {
            throw new ForbiddenError('Full certification list is only available to Admin, Auditor, or Executive roles')
          }

          const result = await db.select().from(userCertifications)
          return json(result)
        } catch (error) {
          if (error instanceof AppError) {
            return json({ error: error.message, code: error.code }, { status: error.statusCode })
          }
          console.error('❌ [API Certifications GET] Unexpected Error:', error)
          return json({ error: 'Internal server error' }, { status: 500 })
        }
      },
      POST: async ({ request }) => {
        try {
          const session = await requireRole(['Admin', 'Manager', 'User'])
          await requireRateLimit(session.userId, RateLimitPresets.MUTATION)
          requireCSRFToken(getCSRFTokenFromRequest(request))

          const rawData = await request.json()
          const validation = CreateUserCertificationSchema.safeParse(rawData)

          if (!validation.success) {
            throw new ValidationError('Invalid certification data', validation.error.errors)
          }

          const data = validation.data
          const db = await getDbOrThrow()

          // Authority check
          if (!(await checkAuthority(db, session, data.userId))) {
            throw new ForbiddenError('You do not have permission to add certifications for this user')
          }

          const certExists = await db
            .select({
              id: certifications.id,
              name: certifications.name,
              vendorName: certifications.vendorName,
            })
            .from(certifications)
            .where(eq(certifications.id, data.certificationId))
            .limit(1)

          if (certExists.length === 0) {
            throw new NotFoundError('Certification not found in catalog')
          }

          const certCatalog = certExists[0]

          const insertResult = await db
            .insert(userCertifications)
            .values({
              userId: data.userId,
              certificationId: data.certificationId,
              certificationName: data.certificationName || certCatalog.name,
              vendorName: data.vendorName || certCatalog.vendorName,
              status: data.status,
              issueDate: data.issueDate,
              expirationDate: data.expirationDate,
              certificationNumber: data.certificationNumber,
              assignedById:
                session.userId !== data.userId ? session.userId : null,
            })
            .returning()

          const result = insertResult[0]

          await db.insert(auditLogs).values({
            userId: session.userId,
            action:
              data.status === 'assigned'
                ? 'Assign Certification'
                : 'Add Certification',
            resourceType: 'Certification',
            resourceId: result.id,
            details:
              data.status === 'assigned'
                ? `Assigned ${result.certificationName} to ${data.userId}`
                : `Added ${result.certificationName}`,
          })

          return json(result, { status: 201 })
        } catch (error) {
          if (error instanceof AppError) {
            return json({ error: error.message, code: error.code, details: (error as any).errors }, { status: error.statusCode })
          }
          console.error('❌ [API Certifications POST] Unexpected Error:', error)
          return json({ error: 'Internal server error' }, { status: 500 })
        }
      },
      PATCH: async ({ request }) => {
        try {
          const session = await requireRole(['Admin', 'Manager', 'User'])
          await requireRateLimit(session.userId, RateLimitPresets.MUTATION)
          requireCSRFToken(getCSRFTokenFromRequest(request))

          const rawData = await request.json()
          const validation = CertificationPatchSchema.safeParse(rawData)

          if (!validation.success) {
            throw new ValidationError('Invalid update data', validation.error.errors)
          }

          const data = validation.data
          const db = await getDbOrThrow()

          const certResult = await db
            .select()
            .from(userCertifications)
            .where(eq(userCertifications.id, data.id))
            .limit(1)

          if (certResult.length === 0) throw new NotFoundError('Certification not found')
          const existingCert = certResult[0]

          // Authority check
          if (!(await checkAuthority(db, session, existingCert.userId))) {
            throw new ForbiddenError('You do not have permission to modify this certification')
          }

          if (data.action === 'addProof') {
            const { proof } = data
            const newProof = await db
              .insert(userCertificationProofs)
              .values({
                userCertificationId: data.id,
                fileName: proof.fileName,
                fileUrl: proof.fileUrl || `https://storage.training-certify.com/proofs/${proof.fileName}`, // Fixed hardcoded example URL
              })
              .returning()

            const updates: Partial<typeof userCertifications.$inferSelect> = { updatedAt: new Date() }
            if (existingCert.status === 'assigned') {
              updates.status = 'active'
            }

            await db
              .update(userCertifications)
              .set(updates)
              .where(eq(userCertifications.id, data.id))

            return json({ success: true, proof: newProof[0] })
          }

          if (data.action === 'updateDetails') {
            const updates = {
              ...data.updates,
              updatedAt: new Date()
            }

            const result = await db
              .update(userCertifications)
              .set(updates)
              .where(eq(userCertifications.id, data.id))
              .returning()

            return json({ success: true, certification: result[0] })
          }

          throw new ValidationError('Invalid action')
        } catch (error) {
          if (error instanceof AppError) {
            return json({ error: error.message, code: error.code, details: (error as any).errors }, { status: error.statusCode })
          }
          console.error('❌ [API Certifications PATCH] Unexpected Error:', error)
          return json({ error: 'Internal server error' }, { status: 500 })
        }
      },
      DELETE: async ({ request }) => {
        try {
          const session = await requireRole(['Admin', 'Manager', 'User'])
          await requireRateLimit(session.userId, RateLimitPresets.MUTATION)
          requireCSRFToken(getCSRFTokenFromRequest(request))

          const url = new URL(request.url)
          const id = url.searchParams.get('id')
          if (!id) throw new ValidationError('Missing certification ID')

          const db = await getDbOrThrow()

          const certResult = await db
            .select()
            .from(userCertifications)
            .where(eq(userCertifications.id, id))
            .limit(1)

          if (certResult.length === 0) throw new NotFoundError('Certification not found')
          const existingCert = certResult[0]

          // Authority check
          if (!(await checkAuthority(db, session, existingCert.userId))) {
            throw new ForbiddenError('You do not have permission to delete this certification')
          }

          await db
            .delete(userCertifications)
            .where(eq(userCertifications.id, id))
          return json({ success: true })
        } catch (error) {
          if (error instanceof AppError) {
            return json({ error: error.message, code: error.code }, { status: error.statusCode })
          }
          console.error('❌ [API Certifications DELETE] Unexpected Error:', error)
          return json({ error: 'Internal server error' }, { status: 500 })
        }
      },
    },
  },
})

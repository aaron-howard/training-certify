import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDbOrThrow } from '../db/db.server'
import {
  auditLogs,
  userCertificationProofs,
  userCertifications,
} from '../db/schema'
import { ForbiddenError, NotFoundError, ValidationError } from '../lib/errors'
import {
  handleApiError,
  setupMutationHandler,
  withApiMetrics,
} from '../lib/api-helpers.server'
import { API_ROLE_SETS } from '../lib/roles'
import { RateLimitPresets } from '../lib/rateLimit.server'
import { uploadCertificationProof } from '../lib/certificationProofStorage.server'
import { checkCertificationAuthority } from '../lib/certificationAuthority.server'
import { invalidateCache } from '../lib/cache.server'

export const Route = createFileRoute('/api/certifications/proof')({
  server: {
    handlers: {
      POST: async ({ request }) =>
        withApiMetrics('POST', '/api/certifications/proof', async () => {
          try {
            const session = await setupMutationHandler(request, {
              allowedRoles: API_ROLE_SETS.certificationWrite,
              rateLimit: RateLimitPresets.MUTATION,
            })

            const contentType = request.headers.get('content-type') ?? ''
            if (!contentType.includes('multipart/form-data')) {
              throw new ValidationError(
                'Content-Type must be multipart/form-data',
              )
            }

            const form = await request.formData()
            const certificationId = form.get('certificationId')
            const file = form.get('file')

            if (typeof certificationId !== 'string' || !certificationId) {
              throw new ValidationError('certificationId is required')
            }
            if (!(file instanceof File)) {
              throw new ValidationError('file is required')
            }

            const db = await getDbOrThrow()
            const certResult = await db
              .select()
              .from(userCertifications)
              .where(eq(userCertifications.id, certificationId))
              .limit(1)

            if (certResult.length === 0) {
              throw new NotFoundError('Certification not found')
            }
            const existingCert = certResult[0]

            if (
              !(await checkCertificationAuthority(
                db,
                session,
                existingCert.userId,
              ))
            ) {
              throw new ForbiddenError(
                'You do not have permission to upload proof for this certification',
              )
            }

            const buffer = new Uint8Array(await file.arrayBuffer())
            const uploaded = await uploadCertificationProof({
              data: buffer,
              contentType: file.type || 'application/octet-stream',
              fileName: file.name,
              userId: existingCert.userId,
              certificationId,
            })

            const newProof = await db
              .insert(userCertificationProofs)
              .values({
                userCertificationId: certificationId,
                fileName: uploaded.fileName,
                fileUrl: uploaded.fileUrl,
              })
              .returning()

            const updates: Partial<typeof userCertifications.$inferSelect> = {
              updatedAt: new Date(),
            }
            if (existingCert.status === 'assigned') {
              updates.status = 'active'
            }

            await db
              .update(userCertifications)
              .set(updates)
              .where(eq(userCertifications.id, certificationId))

            await db.insert(auditLogs).values({
              userId: session.userId,
              action: 'Upload Certification Proof',
              resourceType: 'Certification',
              resourceId: certificationId,
              details: uploaded.fileName,
            })

            invalidateCache('dashboard:')
            invalidateCache('compliance:')

            return json({ success: true, proof: newProof[0] })
          } catch (error) {
            return handleApiError(error, 'POST /api/certifications/proof')
          }
        }),
    },
  },
})

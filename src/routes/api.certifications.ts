import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { getDb } from '../db/db.server'
import {
  auditLogs,
  certifications,
  teams,
  userCertificationProofs,
  userCertifications,
  userTeams,
} from '../db/schema'
import { requireRole } from '../lib/auth.server'
import type { AuthSession } from '../lib/auth.server'

/**
 * Helper to check if a requester has authority over a specific user.
 * Authority exists if:
 * 1. Requester is the user themselves.
 * 2. Requester is an Admin or Auditor.
 * 3. Requester is a Manager of a team the user belongs to.
 */
async function checkAuthority(
  db: any,
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
      const teamIds = managedTeams.map((t: any) => t.id)
      const membership = await db
        .select()
        .from(userTeams)
        .where(eq(userTeams.userId, targetUserId))

      const isMember = membership.some((m: any) => teamIds.includes(m.teamId))
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

          const db = await getDb()
          if (!db) {
            return json(
              {
                error: 'Database not available',
                code: 'DB_UNAVAILABLE',
              },
              { status: 500 },
            )
          }

          // If requesting a specific certification
          if (certId) {
            const certResult = await db
              .select()
              .from(userCertifications)
              .where(eq(userCertifications.id, certId))
              .limit(1)

            if (certResult.length === 0)
              return json({ error: 'Not found' }, { status: 404 })

            const cert = certResult[0]
            if (!(await checkAuthority(db, session, cert.userId))) {
              return json({ error: 'Forbidden' }, { status: 403 })
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
              return json({ error: 'Forbidden' }, { status: 403 })
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
            return json({ error: 'Forbidden' }, { status: 403 })
          }

          const result = await db.select().from(userCertifications)
          return json(result)
        } catch (error: any) {
          console.error('❌ [API Certifications GET] Error:', error)
          return json(
            {
              error: 'Forbidden or internal error',
              details: error.message,
            },
            { status: error.message.includes('Forbidden') ? 403 : 500 },
          )
        }
      },
      POST: async ({ request }) => {
        try {
          const session = await requireRole(['Admin', 'Manager', 'User'])
          const data = await request.json()

          const db = await getDb()
          if (!db) {
            return json(
              {
                error: 'Database not available',
                code: 'DB_UNAVAILABLE',
              },
              { status: 500 },
            )
          }

          if (!data.userId || !data.certificationId) {
            return json({ error: 'Missing required fields' }, { status: 400 })
          }

          // Authority check
          if (!(await checkAuthority(db, session, data.userId))) {
            return json({ error: 'Forbidden' }, { status: 403 })
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
            return json(
              { error: 'Certification not found in catalog' },
              { status: 404 },
            )
          }

          const certCatalog = certExists[0]

          const insertResult = await db
            .insert(userCertifications)
            .values({
              userId: data.userId,
              certificationId: data.certificationId,
              certificationName: data.certificationName || certCatalog.name,
              vendorName: data.vendorName || certCatalog.vendorName,
              status: data.status || 'active',
              issueDate: data.issueDate || null,
              expirationDate: data.expirationDate || null,
              certificationNumber: data.certificationNumber || null,
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
        } catch (error: any) {
          console.error('❌ [API Certifications POST] Error:', error)
          return json(
            {
              error: 'Forbidden or internal error',
              details: error.message,
            },
            { status: error.message.includes('Forbidden') ? 403 : 500 },
          )
        }
      },
      PATCH: async ({ request }) => {
        try {
          const session = await requireRole(['Admin', 'Manager', 'User'])
          const data = await request.json()
          const db = await getDb()
          if (!db) {
            return json({ error: 'Database not available' }, { status: 500 })
          }

          const { id, action, proof } = data
          if (!id) return json({ error: 'Missing ID' }, { status: 400 })

          const certResult = await db
            .select()
            .from(userCertifications)
            .where(eq(userCertifications.id, id))
            .limit(1)

          if (certResult.length === 0)
            return json({ error: 'Not found' }, { status: 404 })
          const existingCert = certResult[0]

          // Authority check
          if (!(await checkAuthority(db, session, existingCert.userId))) {
            return json({ error: 'Forbidden' }, { status: 403 })
          }

          if (action === 'addProof' && proof) {
            const newProof = await db
              .insert(userCertificationProofs)
              .values({
                userCertificationId: id,
                fileName: proof.fileName,
                fileUrl:
                  proof.fileUrl ||
                  `https://storage.example.com/${proof.fileName}`,
              })
              .returning()

            const updates: any = { updatedAt: new Date() }
            if (existingCert.status === 'assigned') {
              updates.status = 'active'
            }

            await db
              .update(userCertifications)
              .set(updates)
              .where(eq(userCertifications.id, id))

            return json({ success: true, proof: newProof[0] })
          }

          if (action === 'updateDetails' && data.updates) {
            const updates: any = {}
            if (data.updates.status) updates.status = data.updates.status
            if (data.updates.issueDate)
              updates.issueDate = data.updates.issueDate
            if (data.updates.expirationDate)
              updates.expirationDate = data.updates.expirationDate
            if (data.updates.certificationNumber)
              updates.certificationNumber = data.updates.certificationNumber
            updates.updatedAt = new Date()

            const result = await db
              .update(userCertifications)
              .set(updates)
              .where(eq(userCertifications.id, id))
              .returning()

            return json({ success: true, certification: result[0] })
          }

          return json({ error: 'Invalid action' }, { status: 400 })
        } catch (error: any) {
          console.error('❌ [API Certifications PATCH] Error:', error)
          return json(
            {
              error: 'Forbidden or internal error',
              details: error.message,
            },
            { status: error.message.includes('Forbidden') ? 403 : 500 },
          )
        }
      },
      DELETE: async ({ request }) => {
        try {
          const session = await requireRole(['Admin', 'Manager', 'User'])
          const url = new URL(request.url)
          const id = url.searchParams.get('id')
          if (!id) return json({ error: 'Missing id' }, { status: 400 })

          const db = await getDb()
          if (!db)
            return json({ error: 'Database not available' }, { status: 500 })

          const certResult = await db
            .select()
            .from(userCertifications)
            .where(eq(userCertifications.id, id))
            .limit(1)

          if (certResult.length === 0)
            return json({ error: 'Not found' }, { status: 404 })
          const existingCert = certResult[0]

          // Authority check
          if (!(await checkAuthority(db, session, existingCert.userId))) {
            return json({ error: 'Forbidden' }, { status: 403 })
          }

          await db
            .delete(userCertifications)
            .where(eq(userCertifications.id, id))
          return json({ success: true })
        } catch (error: any) {
          console.error('❌ [API Certifications DELETE] Error:', error)
          return json(
            {
              error: 'Forbidden or internal error',
              details: error.message,
            },
            { status: error.message.includes('Forbidden') ? 403 : 500 },
          )
        }
      },
    },
  },
})

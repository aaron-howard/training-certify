import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDbOrThrow } from '../db/db.server'
import { certifications } from '../db/schema'
import { requireRole } from '../lib/auth.server'
import { RateLimitPresets, requireRateLimit } from '../lib/rateLimit.server'
import { getCSRFTokenFromRequest, requireCSRFToken } from '../lib/csrf.server'
import { AppError, ForbiddenError, NotFoundError, ValidationError } from '../lib/errors'
import { CatalogCertificationSchema } from '../lib/validation'

export const Route = createFileRoute('/api/catalog')({
  server: {
    handlers: {
      GET: async () => {
        try {
          await requireRole([
            'Admin',
            'Manager',
            'Auditor',
            'Executive',
            'User',
          ])

          const db = await getDbOrThrow()
          const result = await db.select().from(certifications)

          return json({
            certifications: result.map((c) => ({
              id: c.id,
              name: c.name,
              vendor: c.vendorName,
              level: c.difficulty,
              price: c.price,
              category: c.category,
              description: c.description,
            })),
          })
        } catch (error) {
          if (error instanceof AppError) {
            return json({ error: error.message, code: error.code }, { status: error.statusCode })
          }
          console.error('❌ [API Catalog GET] Unexpected Error:', error)
          return json({ error: 'Internal server error' }, { status: 500 })
        }
      },
      DELETE: async ({ request }) => {
        try {
          const session = await requireRole(['Admin'])
          await requireRateLimit(session.userId, RateLimitPresets.ADMIN)
          requireCSRFToken(getCSRFTokenFromRequest(request))

          const url = new URL(request.url)
          const id = url.searchParams.get('id')
          if (!id) throw new ValidationError('Missing id parameter')

          const db = await getDbOrThrow()

          await db.delete(certifications).where(eq(certifications.id, id))
          return json({ success: true, deletedId: id })
        } catch (error) {
          if (error instanceof AppError) {
            return json({ error: error.message, code: error.code }, { status: error.statusCode })
          }
          console.error('❌ [API Catalog DELETE] Unexpected Error:', error)
          return json({ error: 'Internal server error' }, { status: 500 })
        }
      },
      POST: async ({ request }) => {
        try {
          const session = await requireRole(['Admin'])
          await requireRateLimit(session.userId, RateLimitPresets.ADMIN)
          requireCSRFToken(getCSRFTokenFromRequest(request))

          const rawData = await request.json()
          const validation = CatalogCertificationSchema.safeParse(rawData)

          if (!validation.success) {
            throw new ValidationError('Invalid certification data', validation.error.errors)
          }

          const data = validation.data
          const db = await getDbOrThrow()

          const result = await db
            .insert(certifications)
            .values({
              id: data.id,
              name: data.name,
              vendorId:
                data.vendorId ||
                data.vendorName.toLowerCase().replace(/\s/g, '-'),
              vendorName: data.vendorName,
              category: data.category || 'Cloud',
              difficulty: data.difficulty || 'Intermediate',
              price: data.price ? String(data.price) : null, // Schema uses text for price unfortunately, or does it? checking schema...
              description: data.description || null,
            })
            .returning()

          return json(result[0], { status: 201 })
        } catch (error) {
          if (error instanceof AppError) {
            return json({
              error: error.message,
              code: error.code,
              details: error instanceof ValidationError ? error.errors : undefined
            }, { status: error.statusCode })
          }
          const insertError = error as { code?: string }
          if (insertError.code === '23505') {
            return json({ error: 'Certification with this ID already exists' }, { status: 409 })
          }
          console.error('❌ [API Catalog POST] Unexpected Error:', error)
          return json({ error: 'Internal server error' }, { status: 500 })
        }
      },
    },
  },
})

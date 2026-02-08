import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { count, eq } from 'drizzle-orm'
import { getDbOrThrow } from '../db/db.server'
import { certifications } from '../db/schema'
import { RateLimitPresets } from '../lib/rateLimit.server'
import { ValidationError } from '../lib/errors'
import { CatalogCertificationSchema } from '../lib/validation'
import { validateCategory, validateDifficulty } from '../lib/enum-helpers'
import {
  handleApiError,
  setupMutationHandler,
  setupReadHandler,
} from '../lib/api-helpers.server'
import { invalidateCache } from '../lib/cache.server'
import {
  createPaginatedResponse,
  parsePaginationParams,
} from '../lib/pagination.server'

export const Route = createFileRoute('/api/catalog')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await setupReadHandler(request)

          const db = await getDbOrThrow()
          const url = new URL(request.url)

          // Parse pagination parameters
          const { page, limit } = parsePaginationParams(url, 50, 200) // Default 50, max 200 for catalog
          const offset = (page - 1) * limit

          // Get total count and paginated data
          const [totalResult] = await db
            .select({ count: count() })
            .from(certifications)
          const total = totalResult.count

          const result = await db
            .select()
            .from(certifications)
            .limit(limit)
            .offset(offset)

          const mappedData = result.map((c) => ({
            id: c.id,
            name: c.name,
            vendor: c.vendorName,
            level: c.difficulty,
            price: c.price,
            category: c.category,
            description: c.description,
          }))

          const paginatedResponse = createPaginatedResponse(
            mappedData,
            total,
            page,
            limit,
          )

          return json(paginatedResponse, {
            headers: {
              'Cache-Control': 'public, max-age=300', // 5 minutes browser cache
            },
          })
        } catch (error) {
          return handleApiError(error, 'GET /api/catalog')
        }
      },
      DELETE: async ({ request }) => {
        try {
          await setupMutationHandler(request, {
            allowedRoles: ['Admin'],
            rateLimit: RateLimitPresets.ADMIN,
          })

          const url = new URL(request.url)
          const id = url.searchParams.get('id')
          if (!id) throw new ValidationError('Missing id parameter')

          const db = await getDbOrThrow()

          await db.delete(certifications).where(eq(certifications.id, id))

          // Invalidate catalog cache
          invalidateCache('catalog:')

          return json({ success: true, deletedId: id })
        } catch (error) {
          return handleApiError(error, 'DELETE /api/catalog')
        }
      },
      POST: async ({ request }) => {
        try {
          await setupMutationHandler(request, {
            allowedRoles: ['Admin'],
            rateLimit: RateLimitPresets.ADMIN,
          })

          const rawData = await request.json()
          const validation = CatalogCertificationSchema.safeParse(rawData)

          if (!validation.success) {
            throw new ValidationError(
              'Invalid certification data',
              validation.error.errors,
            )
          }

          const data = validation.data
          const db = await getDbOrThrow()

          try {
            const result = await db
              .insert(certifications)
              .values({
                id: data.id,
                name: data.name,
                vendorId:
                  data.vendorId ||
                  data.vendorName.toLowerCase().replace(/\s/g, '-'),
                vendorName: data.vendorName,
                category: validateCategory(data.category || 'Cloud') ?? 'Cloud',
                difficulty:
                  validateDifficulty(data.difficulty || 'Associate') ??
                  'Associate',
                price: data.price ? String(data.price) : null, // Schema uses text for price unfortunately, or does it? checking schema...
                description: data.description || null,
              })
              .returning()

            // Invalidate catalog cache
            invalidateCache('catalog:')

            return json(result[0], { status: 201 })
          } catch (dbError) {
            const insertError = dbError as { code?: string }
            if (insertError.code === '23505') {
              throw new ValidationError(
                'Certification with this ID already exists',
              )
            }
            throw dbError
          }
        } catch (error) {
          return handleApiError(error, 'POST /api/catalog')
        }
      },
    },
  },
})

import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { count, eq } from 'drizzle-orm'
import { getDbOrThrow } from '../db/db.server'
import { certifications, vendors } from '../db/schema'
import { RateLimitPresets } from '../lib/rateLimit.server'
import { ValidationError } from '../lib/errors'
import {
  CatalogCertificationSchema,
  UpdateCatalogCertificationSchema,
} from '../lib/validation'
import { validateCategory, validateDifficulty } from '../lib/enum-helpers'
import {
  handleApiError,
  setupMutationHandler,
  setupReadHandler,
  withApiMetrics,
} from '../lib/api-helpers.server'
import { invalidateCache } from '../lib/cache.server'
import {
  createPaginatedResponse,
  parsePaginationParams,
} from '../lib/pagination.server'

export const Route = createFileRoute('/api/catalog')({
  server: {
    handlers: {
      GET: async ({ request }) =>
        withApiMetrics('GET', '/api/catalog', async () => {
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

            const selectWithOfficialUrl = {
              id: certifications.id,
              name: certifications.name,
              vendorName: vendors.name,
              level: certifications.difficulty,
              price: certifications.price,
              category: certifications.category,
              description: certifications.description,
              officialSiteUrl: certifications.officialSiteUrl,
            }
            const selectWithoutOfficialUrl = {
              id: certifications.id,
              name: certifications.name,
              vendorName: vendors.name,
              level: certifications.difficulty,
              price: certifications.price,
              category: certifications.category,
              description: certifications.description,
            }

            type CatalogRow = {
              id: string
              name: string
              vendorName: string
              level: string | null
              price: string | null
              category: string | null
              description: string | null
              officialSiteUrl?: string | null
            }
            let result: Array<CatalogRow>
            try {
              result = await db
                .select(selectWithOfficialUrl)
                .from(certifications)
                .innerJoin(vendors, eq(certifications.vendorId, vendors.id))
                .limit(limit)
                .offset(offset)
            } catch (selectError) {
              const err = selectError as { code?: string; message?: string }
              if (
                err.code === '42703' &&
                err.message?.includes('official_site_url')
              ) {
                const fallback = await db
                  .select(selectWithoutOfficialUrl)
                  .from(certifications)
                  .innerJoin(vendors, eq(certifications.vendorId, vendors.id))
                  .limit(limit)
                  .offset(offset)
                result = fallback.map((row) => ({
                  ...row,
                  officialSiteUrl: null,
                }))
              } else {
                throw selectError
              }
            }

            const mappedData = result.map((c) => ({
              id: c.id,
              name: c.name,
              vendor: c.vendorName,
              level: c.level,
              price: c.price,
              category: c.category,
              description: c.description,
              officialSiteUrl: c.officialSiteUrl ?? undefined,
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
        }),
      DELETE: async ({ request }) =>
        withApiMetrics('DELETE', '/api/catalog', async () => {
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
        }),
      POST: async ({ request }) =>
        withApiMetrics('POST', '/api/catalog', async () => {
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
            const vendorId = data.vendorId
            const vendorName = data.vendorName ?? data.vendorId
            const vendorLogo = data.vendorLogo ?? null

            try {
              await db
                .insert(vendors)
                .values({
                  id: vendorId,
                  name: vendorName,
                  logo: vendorLogo,
                })
                .onConflictDoUpdate({
                  target: vendors.id,
                  set: { name: vendorName, logo: vendorLogo },
                })

              const result = await db
                .insert(certifications)
                .values({
                  id: data.id,
                  name: data.name,
                  vendorId,
                  category:
                    validateCategory(data.category || 'Cloud') ?? 'Cloud',
                  difficulty:
                    validateDifficulty(data.difficulty || 'Associate') ??
                    'Associate',
                  price: data.price != null ? String(data.price) : null,
                  description: data.description || null,
                  officialSiteUrl: data.officialSiteUrl ?? null,
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
        }),
      PATCH: async ({ request }) =>
        withApiMetrics('PATCH', '/api/catalog', async () => {
          try {
            await setupMutationHandler(request, {
              allowedRoles: ['Admin'],
              rateLimit: RateLimitPresets.ADMIN,
            })

            const rawData = await request.json()
            const validation =
              UpdateCatalogCertificationSchema.safeParse(rawData)

            if (!validation.success) {
              throw new ValidationError(
                'Invalid certification update data',
                validation.error.errors,
              )
            }

            const data = validation.data
            const id =
              (rawData as { id?: string }).id ??
              new URL(request.url).searchParams.get('id')
            if (!id || typeof id !== 'string') {
              throw new ValidationError('Missing id (in body or query)')
            }

            const db = await getDbOrThrow()

            const updates: Record<string, unknown> = {}
            if (data.name !== undefined) updates.name = data.name
            if (data.category !== undefined)
              updates.category = validateCategory(data.category) ?? undefined
            if (data.difficulty !== undefined)
              updates.difficulty =
                validateDifficulty(data.difficulty) ?? undefined
            if (data.price !== undefined)
              updates.price = data.price != null ? String(data.price) : null
            if (data.description !== undefined)
              updates.description = data.description ?? null
            if (data.validityPeriod !== undefined)
              updates.validityPeriod = data.validityPeriod
            if (data.renewalCycle !== undefined)
              updates.renewalCycle = data.renewalCycle
            if (data.officialSiteUrl !== undefined)
              updates.officialSiteUrl = data.officialSiteUrl ?? null

            if (data.vendorId !== undefined && data.vendorId) {
              await db
                .insert(vendors)
                .values({
                  id: data.vendorId,
                  name: data.vendorName ?? data.vendorId,
                  logo: data.vendorLogo ?? null,
                })
                .onConflictDoUpdate({
                  target: vendors.id,
                  set: {
                    name: data.vendorName ?? data.vendorId,
                    logo: data.vendorLogo ?? null,
                  },
                })
              updates.vendorId = data.vendorId
            }

            if (Object.keys(updates).length === 0) {
              throw new ValidationError('No valid fields to update')
            }

            const result = await db
              .update(certifications)
              .set(updates)
              .where(eq(certifications.id, id))
              .returning()

            if (result.length === 0) {
              throw new ValidationError('Certification not found')
            }

            invalidateCache('catalog:')
            return json(result[0])
          } catch (error) {
            return handleApiError(error, 'PATCH /api/catalog')
          }
        }),
    },
  },
})

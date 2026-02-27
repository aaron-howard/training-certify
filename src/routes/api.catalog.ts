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
import { parseCsv, rowToObject } from '../lib/csv-parse'

const CSV_MAX_BODY_BYTES = 2 * 1024 * 1024 // 2 MB
const CSV_MAX_ROWS = 1000

const LEVEL_TO_SCHEMA: Record<
  string,
  'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
> = {
  foundational: 'Beginner',
  associate: 'Intermediate',
  professional: 'Advanced',
  expert: 'Expert',
}

function mapLevelToSchema(
  level: string,
): 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | undefined {
  return LEVEL_TO_SCHEMA[level.trim().toLowerCase()]
}

export const Route = createFileRoute('/api/catalog')({
  server: {
    handlers: {
      GET: async ({ request }) =>
        withApiMetrics('GET', '/api/catalog', async () => {
          try {
            const url = new URL(request.url)
            const formatCsv = url.searchParams.get('format') === 'csv'

            if (formatCsv) {
              await setupMutationHandler(request, {
                allowedRoles: ['Admin'],
                rateLimit: RateLimitPresets.ADMIN,
              })
            } else {
              await setupReadHandler(request)
            }

            const db = await getDbOrThrow()

            // For CSV export: full catalog, cap 10_000. For JSON: paginated.
            const csvLimit = 10_000
            const { page, limit } = formatCsv
              ? { page: 1, limit: csvLimit }
              : parsePaginationParams(url, 50, 200)
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

            if (formatCsv) {
              const escapeCsv = (
                v: string | number | null | undefined,
              ): string => {
                const s = v === null || v === undefined ? '' : String(v)
                if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
                return s
              }
              const header =
                'id,name,vendor,level,category,price,description,officialSiteUrl'
              const rows = mappedData.map((r) =>
                [
                  escapeCsv(r.id),
                  escapeCsv(r.name),
                  escapeCsv(r.vendor),
                  escapeCsv(r.level),
                  escapeCsv(r.category),
                  escapeCsv(r.price),
                  escapeCsv(r.description),
                  escapeCsv(r.officialSiteUrl),
                ].join(','),
              )
              const csv = [header, ...rows].join('\r\n')
              const filename = `catalog-${new Date().toISOString().split('T')[0]}.csv`
              return new Response(csv, {
                status: 200,
                headers: {
                  'Content-Type': 'text/csv; charset=utf-8',
                  'Content-Disposition': `attachment; filename="${filename}"`,
                },
              })
            }

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

            const url = new URL(request.url)
            if (url.searchParams.get('action') === 'import') {
              const contentType = request.headers.get('content-type') ?? ''
              let csvText: string
              if (contentType.includes('multipart/form-data')) {
                const formData = await request.formData()
                const file = formData.get('file') as File | null
                if (!file || file.size === 0) {
                  return json(
                    { error: 'No file uploaded or file is empty' },
                    { status: 400 },
                  )
                }
                if (file.size > CSV_MAX_BODY_BYTES) {
                  return json(
                    {
                      error: `File too large. Max ${CSV_MAX_BODY_BYTES / 1024 / 1024} MB`,
                    },
                    { status: 400 },
                  )
                }
                csvText = await file.text()
              } else {
                const raw = await request.text()
                if (raw.length > CSV_MAX_BODY_BYTES) {
                  return json(
                    {
                      error: `Body too large. Max ${CSV_MAX_BODY_BYTES / 1024 / 1024} MB`,
                    },
                    { status: 400 },
                  )
                }
                csvText = raw
              }
              const { header, rows } = parseCsv(csvText)
              if (
                header.length === 0 ||
                !header.map((h) => h.toLowerCase()).includes('id')
              ) {
                return json(
                  {
                    error: 'CSV must have a header row with an "id" column',
                  },
                  { status: 400 },
                )
              }
              if (rows.length > CSV_MAX_ROWS) {
                return json(
                  {
                    error: `Too many rows. Max ${CSV_MAX_ROWS} per import`,
                  },
                  { status: 400 },
                )
              }
              const db = await getDbOrThrow()
              let updated = 0
              let skipped = 0
              const errors: Array<{ row: number; message: string }> = []
              for (let r = 0; r < rows.length; r++) {
                const rowIndex = r + 2
                const obj = rowToObject(header, rows[r])
                const id = obj.id?.trim()
                if (!id) {
                  skipped++
                  continue
                }
                const updates: Record<string, unknown> = {}
                if (obj.name !== undefined && obj.name !== '')
                  updates.name = obj.name
                if (obj.vendor !== undefined && obj.vendor !== '') {
                  updates.vendorId =
                    obj.vendor
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9-]/g, '') || undefined
                  updates.vendorName = obj.vendor
                }
                if (obj.level !== undefined && obj.level !== '') {
                  const schemaLevel = mapLevelToSchema(obj.level)
                  if (schemaLevel) updates.difficulty = schemaLevel
                }
                if (obj.category !== undefined && obj.category !== '')
                  updates.category = obj.category
                if (obj.price !== undefined)
                  updates.price = obj.price === '' ? null : obj.price
                if (obj.description !== undefined)
                  updates.description =
                    obj.description === '' ? null : obj.description
                if (obj.officialsiteurl !== undefined)
                  updates.officialSiteUrl =
                    obj.officialsiteurl === '' ? null : obj.officialsiteurl
                if (Object.keys(updates).length === 0) {
                  skipped++
                  continue
                }
                const validation =
                  UpdateCatalogCertificationSchema.safeParse(updates)
                if (!validation.success) {
                  errors.push({
                    row: rowIndex,
                    message: validation.error.errors
                      .map((e) => e.message)
                      .join('; '),
                  })
                  skipped++
                  continue
                }
                const data = validation.data
                const setPayload: Record<string, unknown> = {}
                if (data.name !== undefined) setPayload.name = data.name
                if (data.category !== undefined)
                  setPayload.category =
                    validateCategory(data.category) ?? undefined
                if (data.difficulty !== undefined)
                  setPayload.difficulty =
                    validateDifficulty(data.difficulty) ?? undefined
                if (data.price !== undefined)
                  setPayload.price =
                    data.price != null ? String(data.price) : null
                if (data.description !== undefined)
                  setPayload.description = data.description ?? null
                if (data.officialSiteUrl !== undefined)
                  setPayload.officialSiteUrl = data.officialSiteUrl ?? null
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
                  setPayload.vendorId = data.vendorId
                }
                try {
                  const result = await db
                    .update(certifications)
                    .set(setPayload)
                    .where(eq(certifications.id, id))
                    .returning()
                  if (result.length > 0) updated++
                  else {
                    errors.push({
                      row: rowIndex,
                      message: 'Certification not found',
                    })
                    skipped++
                  }
                } catch (err) {
                  errors.push({
                    row: rowIndex,
                    message: err instanceof Error ? err.message : String(err),
                  })
                  skipped++
                }
              }
              invalidateCache('catalog:')
              return json({
                success: true,
                updated,
                skipped,
                errors: errors.length > 0 ? errors : undefined,
              })
            }

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

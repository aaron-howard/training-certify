import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDbOrThrow } from '../db/db.server'
import {
  certifications,
  teamRequirements,
  teams,
  userCertifications,
  users,
  vendors,
} from '../db/schema'
import { ForbiddenError } from '../lib/errors'
import {
  handleApiError,
  setupReadHandler,
  withApiMetrics,
} from '../lib/api-helpers.server'
import { CacheTTL, getOrCompute } from '../lib/cache.server'

export const Route = createFileRoute('/api/dashboard')({
  server: {
    handlers: {
      GET: async ({ request }) =>
        withApiMetrics('GET', '/api/dashboard', async () => {
          try {
            const session = await setupReadHandler(request)

            const db = await getDbOrThrow()

            const url = new URL(request.url)
            const userIdParam = url.searchParams.get('userId')
            const roleParam = url.searchParams.get('role')

            // Executive view security: Only Admin or Executive
            if (roleParam === 'Executive') {
              if (session.role !== 'Executive' && session.role !== 'Admin') {
                throw new ForbiddenError('Executive view required')
              }

              // Cache executive dashboard stats - expensive computation
              const cacheKey = 'dashboard:executive'
              const data = await getOrCompute(
                cacheKey,
                CacheTTL.SHORT, // Cache for 1 minute - stats change frequently
                async () => {
                  const allUsers = await db.select().from(users)
                  const totalUsers = allUsers.length

                  const allUserCerts = await db
                    .select({
                      id: userCertifications.id,
                      userId: userCertifications.userId,
                      certificationId: userCertifications.certificationId,
                      status: userCertifications.status,
                      vendorName: vendors.name,
                    })
                    .from(userCertifications)
                    .innerJoin(
                      certifications,
                      eq(userCertifications.certificationId, certifications.id),
                    )
                    .innerJoin(vendors, eq(certifications.vendorId, vendors.id))
                  const totalCerts = allUserCerts.length

                  const activeCertsExec = allUserCerts.filter(
                    (c) => c.status === 'active',
                  ).length
                  const complianceRateExec =
                    totalCerts > 0
                      ? Math.round((activeCertsExec / totalCerts) * 100)
                      : 0

                  const allTeams = await db.select().from(teams)
                  const allRequirements = await db
                    .select()
                    .from(teamRequirements)
                  let criticalGaps = 0

                  for (const team of allTeams) {
                    const teamReqs = allRequirements.filter(
                      (r) => r.teamId === team.id,
                    )
                    if (teamReqs.length === 0) continue
                    criticalGaps++
                  }

                  const vendorMap = new Map<
                    string,
                    { total: number; active: number }
                  >()
                  for (const cert of allUserCerts) {
                    const vendor = cert.vendorName || 'Other'
                    if (!vendorMap.has(vendor))
                      vendorMap.set(vendor, { total: 0, active: 0 })
                    const v = vendorMap.get(vendor)!
                    v.total++
                    if (cert.status === 'active') v.active++
                  }

                  const vendorBreakdown = Array.from(vendorMap.entries()).map(
                    ([name, stats]) => ({
                      name,
                      compliance: Math.round(
                        (stats.active / stats.total) * 100,
                      ),
                    }),
                  )

                  const expiringSoonExec = allUserCerts.filter(
                    (c) =>
                      c.status === 'expiring' || c.status === 'expiring-soon',
                  ).length

                  return {
                    totalUsers,
                    totalCerts,
                    complianceRate: complianceRateExec,
                    criticalGaps,
                    vendorBreakdown,
                    expiringSoon: expiringSoonExec,
                    budgetImpact: '$12,450',
                  }
                },
              )

              return json(data, {
                headers: {
                  'Cache-Control': 'private, max-age=60', // 1 minute browser cache (private - user data)
                },
              })
            }

            // Individual/Standard View security
            const effectiveUserId = userIdParam || session.userId

            // Authority check: can you see this user's stats?
            if (effectiveUserId !== session.userId && session.role === 'User') {
              throw new ForbiddenError(
                'You do not have permission to view stats for another user',
              )
            }

            // TODO: If Manager, check if user is in their team (optional refinement)

            // Cache individual dashboard stats per user
            const cacheKey = `dashboard:user:${effectiveUserId}`
            const data = await getOrCompute(
              cacheKey,
              CacheTTL.SHORT, // Cache for 1 minute - user stats change frequently
              async () => {
                const filteredCerts = await db
                  .select()
                  .from(userCertifications)
                  .where(eq(userCertifications.userId, effectiveUserId))

                const activeCerts = filteredCerts.filter(
                  (c) => c.status === 'active',
                ).length
                const expiringSoon = filteredCerts.filter((c) => {
                  return c.status === 'expiring' || c.status === 'expiring-soon'
                }).length

                const complianceRate =
                  filteredCerts.length > 0
                    ? Math.round((activeCerts / filteredCerts.length) * 100)
                    : 0

                return {
                  activeCerts,
                  expiringSoon,
                  complianceRate,
                }
              },
            )

            return json(data, {
              headers: {
                'Cache-Control': 'private, max-age=60', // 1 minute browser cache (private - user data)
              },
            })
          } catch (error) {
            return handleApiError(error, 'GET /api/dashboard')
          }
        }),
    },
  },
})

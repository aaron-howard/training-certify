import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '../db/db.server'
import {
  teamRequirements,
  teams,
  userCertifications,
  userTeams,
} from '../db/schema'
import { requireRole } from '../lib/auth.server'
import { RateLimitPresets, requireRateLimit } from '../lib/rateLimit.server'

export const Route = createFileRoute('/api/teams')({
  server: {
    handlers: {
      // GET teams with member counts and metrics
      GET: async () => {
        try {
          const session = await requireRole([
            'Admin',
            'Manager',
            'Auditor',
            'Executive',
            'User',
          ])

          // Rate limiting
          await requireRateLimit(session.userId, RateLimitPresets.READ)

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

          // Use cache for expensive team metrics calculation
          const { getOrCompute, CacheTTL } = await import('../lib/cache.server')
          const cacheKey = `teams:all:${session.userId}`
          const data = await getOrCompute(
            cacheKey,
            CacheTTL.MEDIUM,
            async () => {
              // Fetch all teams
              const teamsResult = await db
                .select({
                  id: teams.id,
                  name: teams.name,
                  description: teams.description,
                  managerId: teams.managerId,
                })
                .from(teams)

              if (teamsResult.length === 0) {
                return { teams: [], metrics: [] }
              }

              const teamIds = teamsResult.map((t) => t.id)

              // OPTIMIZATION: Batch fetch all team members in one query
              const allTeamMembers = await db
                .select({
                  teamId: userTeams.teamId,
                  userId: userTeams.userId,
                })
                .from(userTeams)
                .where(inArray(userTeams.teamId, teamIds))

              // OPTIMIZATION: Batch fetch all team requirements in one query
              const allRequirements = await db
                .select({
                  id: teamRequirements.id,
                  teamId: teamRequirements.teamId,
                  certificationId: teamRequirements.certificationId,
                  targetCount: teamRequirements.targetCount,
                })
                .from(teamRequirements)
                .where(inArray(teamRequirements.teamId, teamIds))

              // Group members and requirements by team ID
              const membersByTeam = new Map<string, Array<string>>()
              const requirementsByTeam = new Map<
                string,
                Array<{
                  id: string
                  certificationId: string
                  targetCount: number
                }>
              >()

              for (const member of allTeamMembers) {
                const teamMembers = membersByTeam.get(member.teamId) || []
                teamMembers.push(member.userId)
                membersByTeam.set(member.teamId, teamMembers)
              }

              for (const req of allRequirements) {
                const teamReqs = requirementsByTeam.get(req.teamId) || []
                teamReqs.push({
                  id: req.id,
                  certificationId: req.certificationId,
                  targetCount: req.targetCount,
                })
                requirementsByTeam.set(req.teamId, teamReqs)
              }

              // Collect all unique member IDs across all teams
              const allMemberIds = Array.from(
                new Set(allTeamMembers.map((m) => m.userId)),
              )

              // OPTIMIZATION: Batch fetch all certifications for all members in one query
              const allMemberCerts =
                allMemberIds.length > 0
                  ? await db
                      .select({
                        userId: userCertifications.userId,
                        certificationId: userCertifications.certificationId,
                        status: userCertifications.status,
                        expirationDate: userCertifications.expirationDate,
                      })
                      .from(userCertifications)
                      .where(inArray(userCertifications.userId, allMemberIds))
                  : []

              // Group certifications by user ID
              const certsByUser = new Map<
                string,
                Array<{
                  certificationId: string
                  status: string
                  expirationDate: string | null
                }>
              >()
              for (const cert of allMemberCerts) {
                const userCerts = certsByUser.get(cert.userId) || []
                userCerts.push({
                  certificationId: cert.certificationId,
                  status: cert.status,
                  expirationDate: cert.expirationDate,
                })
                certsByUser.set(cert.userId, userCerts)
              }

              // Calculate metrics for each team
              const result = []
              let totalCoverageSum = 0
              let totalCriticalGaps = 0

              for (const team of teamsResult) {
                try {
                  const memberIds = membersByTeam.get(team.id) || []
                  const requirements = requirementsByTeam.get(team.id) || []
                  const memberCount = memberIds.length

                  let coverage = 0
                  if (requirements.length > 0) {
                    let totalCompliance = 0
                    for (const req of requirements) {
                      if (memberIds.length === 0) {
                        totalCriticalGaps++
                        continue
                      }

                      // Count members with this certification
                      let count = 0
                      for (const memberId of memberIds) {
                        const memberCerts = certsByUser.get(memberId) || []
                        if (
                          memberCerts.some(
                            (c) => c.certificationId === req.certificationId,
                          )
                        ) {
                          count++
                        }
                      }

                      totalCompliance += Math.min(count / req.targetCount, 1)
                      if (count < req.targetCount) {
                        totalCriticalGaps++
                      }
                    }
                    coverage = Math.round(
                      (totalCompliance / requirements.length) * 100,
                    )
                  } else if (memberCount > 0) {
                    // Fallback: count members with any certification
                    let membersWithCerts = 0
                    for (const memberId of memberIds) {
                      if (certsByUser.has(memberId)) {
                        membersWithCerts++
                      }
                    }
                    coverage = Math.round(
                      (membersWithCerts / memberCount) * 100,
                    )
                  }

                  totalCoverageSum += coverage
                  result.push({
                    ...team,
                    memberCount,
                    coverage,
                    requirementCount: requirements.length,
                  })
                } catch (teamError) {
                  console.error(
                    `❌ [API Teams GET] Error processing team ${team.name} (${team.id}):`,
                    teamError,
                  )
                  result.push({
                    ...team,
                    memberCount: 0,
                    coverage: 0,
                    requirementCount: 0,
                    error: true,
                  })
                }
              }

              // Calculate overall metrics
              const overallCoverage =
                result.length > 0
                  ? Math.round(totalCoverageSum / result.length)
                  : 0

              const totalCerts = allMemberCerts.length
              const expiringSoonCerts = allMemberCerts.filter(
                (c) =>
                  c.status === 'expiring' ||
                  c.status === 'expiring-soon' ||
                  (c.status === 'active' &&
                    c.expirationDate &&
                    new Date(c.expirationDate).getTime() <
                      Date.now() + 30 * 24 * 60 * 60 * 1000),
              ).length

              const metrics = [
                {
                  label: 'Total Certifications',
                  value: totalCerts,
                  change: 0,
                  trend: 'up',
                },
                {
                  label: 'Coverage Rate',
                  value: `${overallCoverage}%`,
                  change: 0,
                  trend: 'up',
                },
                {
                  label: 'Expiring Soon',
                  value: expiringSoonCerts,
                  change: 0,
                  trend: 'down',
                },
                {
                  label: 'Critical Gaps',
                  value: totalCriticalGaps,
                  change: 0,
                  trend: 'up',
                },
              ]

              return {
                teams: result,
                metrics,
              }
            },
          )

          return json(data)
        } catch (error: any) {
          console.error('❌ [API Teams GET] Error:', error)
          return json(
            {
              error: 'Unauthorized or internal error',
              details: error.message,
            },
            {
              status: error.message.includes('Forbidden')
                ? 403
                : error.message.includes('Rate limit')
                  ? 429
                  : 500,
            },
          )
        }
      },
      // POST - Create new team (Admin only)
      POST: async ({ request }) => {
        try {
          const session = await requireRole(['Admin'])
          await requireRateLimit(session.userId, RateLimitPresets.MUTATION)

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

          if (!data.name) {
            return json({ error: 'Team name is required' }, { status: 400 })
          }

          const result = await db
            .insert(teams)
            .values({
              name: data.name,
              description: data.description || null,
              managerId: data.managerId || null,
            })
            .returning()

          // Invalidate cache
          const { cache } = await import('../lib/cache.server')
          cache.invalidate('teams:')

          return json(result[0], { status: 201 })
        } catch (error: any) {
          console.error('❌ [API Teams POST] Error:', error)
          return json(
            {
              error: 'Forbidden or internal error',
              details: error.message,
            },
            {
              status: error.message.includes('Forbidden')
                ? 403
                : error.message.includes('Rate limit')
                  ? 429
                  : 500,
            },
          )
        }
      },
      // DELETE - Delete team (Admin only)
      DELETE: async ({ request }) => {
        try {
          const session = await requireRole(['Admin'])
          await requireRateLimit(session.userId, RateLimitPresets.MUTATION)

          const url = new URL(request.url)
          const id = url.searchParams.get('id')
          if (!id) {
            return json({ error: 'Missing team id' }, { status: 400 })
          }

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

          await db.transaction(async (tx) => {
            await tx.delete(userTeams).where(eq(userTeams.teamId, id))
            await tx.delete(teams).where(eq(teams.id, id))
          })

          // Invalidate cache
          const { cache } = await import('../lib/cache.server')
          cache.invalidate('teams:')

          return json({ success: true })
        } catch (error: any) {
          console.error('❌ [API Teams DELETE] Error:', error)
          return json(
            {
              error: 'Forbidden or internal error',
              details: error.message,
            },
            {
              status: error.message.includes('Forbidden')
                ? 403
                : error.message.includes('Rate limit')
                  ? 429
                  : 500,
            },
          )
        }
      },
      // PATCH - Add/remove team members (Manager+)
      PATCH: async ({ request }) => {
        try {
          const session = await requireRole(['Admin', 'Manager'])
          await requireRateLimit(session.userId, RateLimitPresets.MUTATION)

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

          const { action, teamId, userId } = data

          if (!teamId || !userId) {
            return json(
              { error: 'teamId and userId are required' },
              { status: 400 },
            )
          }

          // Security: If session user is a Manager (not Admin), check if they manage this team
          if (session.role === 'Manager') {
            const team = await db
              .select({ managerId: teams.managerId })
              .from(teams)
              .where(eq(teams.id, teamId))
              .limit(1)

            if (!team.length || team[0].managerId !== session.userId) {
              return json(
                { error: 'Forbidden: You are not the manager of this team' },
                { status: 403 },
              )
            }
          }

          if (action === 'add') {
            await db
              .insert(userTeams)
              .values({ teamId, userId })
              .onConflictDoNothing()

            // Invalidate cache
            const { cache } = await import('../lib/cache.server')
            cache.invalidate('teams:')

            return json({ success: true, action: 'added' })
          } else if (action === 'remove') {
            await db
              .delete(userTeams)
              .where(
                and(eq(userTeams.teamId, teamId), eq(userTeams.userId, userId)),
              )

            // Invalidate cache
            const { cache } = await import('../lib/cache.server')
            cache.invalidate('teams:')

            return json({ success: true, action: 'removed' })
          } else {
            return json(
              { error: 'Invalid action. Use "add" or "remove"' },
              { status: 400 },
            )
          }
        } catch (error: any) {
          console.error('❌ [API Teams PATCH] Error:', error)
          return json(
            {
              error: 'Forbidden or internal error',
              details: error.message,
            },
            {
              status: error.message.includes('Forbidden')
                ? 403
                : error.message.includes('Rate limit')
                  ? 429
                  : 500,
            },
          )
        }
      },
    },
  },
})

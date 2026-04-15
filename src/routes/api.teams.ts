import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { and, eq, inArray } from 'drizzle-orm'
import { getDbOrThrow } from '../db/db.server'
import {
  teamRequirements,
  teams,
  userCertifications,
  userTeams,
} from '../db/schema'
import { ForbiddenError, ValidationError } from '../lib/errors'
import { TeamSchema } from '../lib/validation'
import { logError } from '../lib/logging.server'
import {
  handleApiError,
  setupMutationHandler,
  setupReadHandler,
  withApiMetrics,
} from '../lib/api-helpers.server'
import { API_ROLE_SETS } from '../lib/roles'
import {
  createPaginatedResponse,
  parsePaginationParams,
} from '../lib/pagination.server'

export const Route = createFileRoute('/api/teams')({
  server: {
    handlers: {
      // GET teams with member counts and metrics
      GET: async ({ request }) =>
        withApiMetrics('GET', '/api/teams', async () => {
          try {
            const session = await setupReadHandler(request)

            const db = await getDbOrThrow()
            const url = new URL(request.url)

            // Parse pagination parameters
            const { page, limit } = parsePaginationParams(url, 20, 100)
            const offset = (page - 1) * limit

            // Use cache for expensive team metrics calculation
            const { getOrCompute, CacheTTL } =
              await import('../lib/cache.server')
            const cacheKey = `teams:all:${session.userId}`
            const cachedData = await getOrCompute(
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
                    const teamMemberCount = memberIds.length

                    let coverage = 0
                    if (requirements.length > 0) {
                      let totalCompliance = 0
                      for (const req of requirements) {
                        if (memberIds.length === 0) {
                          totalCriticalGaps++
                          continue
                        }

                        // Count members with this certification
                        let certMemberCount = 0
                        for (const memberId of memberIds) {
                          const memberCerts = certsByUser.get(memberId) || []
                          if (
                            memberCerts.some(
                              (c) => c.certificationId === req.certificationId,
                            )
                          ) {
                            certMemberCount++
                          }
                        }

                        totalCompliance += Math.min(
                          certMemberCount / req.targetCount,
                          1,
                        )
                        if (certMemberCount < req.targetCount) {
                          totalCriticalGaps++
                        }
                      }
                      coverage = Math.round(
                        (totalCompliance / requirements.length) * 100,
                      )
                    } else if (teamMemberCount > 0) {
                      // Fallback: count members with any certification
                      let membersWithCerts = 0
                      for (const memberId of memberIds) {
                        if (certsByUser.has(memberId)) {
                          membersWithCerts++
                        }
                      }
                      coverage = Math.round(
                        (membersWithCerts / teamMemberCount) * 100,
                      )
                    }

                    totalCoverageSum += coverage
                    result.push({
                      ...team,
                      memberCount: teamMemberCount,
                      coverage,
                      requirementCount: requirements.length,
                    })
                  } catch (teamError) {
                    logError(
                      teamError instanceof Error
                        ? teamError
                        : new Error(String(teamError)),
                      {
                        route: 'GET /api/teams',
                        teamId: team.id,
                        teamName: team.name,
                      },
                      `Error processing team ${team.name} (${team.id})`,
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

            // Paginate the teams array
            const total = cachedData.teams.length
            const paginatedTeams = cachedData.teams.slice(
              offset,
              offset + limit,
            )

            const paginatedResponse = createPaginatedResponse(
              paginatedTeams,
              total,
              page,
              limit,
            )

            // Return paginated teams with metrics
            return json({
              ...paginatedResponse,
              metrics: cachedData.metrics,
            })
          } catch (error) {
            return handleApiError(error, 'GET /api/teams')
          }
        }),
      // POST - Create new team (Admin only)
      POST: async ({ request }) =>
        withApiMetrics('POST', '/api/teams', async () => {
          try {
            await setupMutationHandler(request, {
              allowedRoles: API_ROLE_SETS.adminOnly,
            })

            const rawData = await request.json()
            const validation = TeamSchema.safeParse(rawData)

            if (!validation.success) {
              throw new ValidationError(
                'Invalid team data',
                validation.error.errors,
              )
            }

            const data = validation.data
            const db = await getDbOrThrow()

            const result = await db
              .insert(teams)
              .values({
                name: data.name,
                description: data.description || null,
                managerId: data.managerId || null,
              })
              .returning()

            const { invalidateCache } = await import('../lib/cache.server')
            invalidateCache('teams:')
            invalidateCache('dashboard:')
            invalidateCache('team-requirements:')

            return json(result[0], { status: 201 })
          } catch (error) {
            return handleApiError(error, 'POST /api/teams')
          }
        }),
      // DELETE - Delete team (Admin only)
      DELETE: async ({ request }) =>
        withApiMetrics('DELETE', '/api/teams', async () => {
          try {
            await setupMutationHandler(request, {
              allowedRoles: API_ROLE_SETS.adminOnly,
            })

            const url = new URL(request.url)
            const id = url.searchParams.get('id')
            if (!id) throw new ValidationError('Missing team ID')

            const db = await getDbOrThrow()

            await db.transaction(async (tx) => {
              await tx.delete(userTeams).where(eq(userTeams.teamId, id))
              await tx.delete(teams).where(eq(teams.id, id))
            })

            const { invalidateCache } = await import('../lib/cache.server')
            invalidateCache('teams:')
            invalidateCache('dashboard:')
            invalidateCache('team-requirements:')

            return json({ success: true })
          } catch (error) {
            return handleApiError(error, 'DELETE /api/teams')
          }
        }),
      // PATCH - Add/remove team members (Manager+)
      PATCH: async ({ request }) =>
        withApiMetrics('PATCH', '/api/teams', async () => {
          try {
            const session = await setupMutationHandler(request, {
              allowedRoles: API_ROLE_SETS.adminManager,
            })

            const data = await request.json()
            const db = await getDbOrThrow()

            const { action, teamId, userId } = data

            if (!teamId || !userId) {
              throw new ValidationError('teamId and userId are required')
            }

            // Security: If session user is a Manager (not Admin), check if they manage this team
            if (session.role === 'Manager') {
              const team = await db
                .select({ managerId: teams.managerId })
                .from(teams)
                .where(eq(teams.id, teamId))
                .limit(1)

              if (!team.length || team[0].managerId !== session.userId) {
                throw new ForbiddenError('You are not the manager of this team')
              }
            }

            if (action === 'add') {
              await db
                .insert(userTeams)
                .values({ teamId, userId })
                .onConflictDoNothing()

              const { invalidateCache } = await import('../lib/cache.server')
              invalidateCache('teams:')
              invalidateCache('dashboard:')
              invalidateCache('team-requirements:')

              return json({ success: true, action: 'added' })
            } else if (action === 'remove') {
              await db
                .delete(userTeams)
                .where(
                  and(
                    eq(userTeams.teamId, teamId),
                    eq(userTeams.userId, userId),
                  ),
                )

              const { invalidateCache } = await import('../lib/cache.server')
              invalidateCache('teams:')
              invalidateCache('dashboard:')
              invalidateCache('team-requirements:')

              return json({ success: true, action: 'removed' })
            } else {
              throw new ValidationError('Invalid action. Use "add" or "remove"')
            }
          } catch (error) {
            return handleApiError(error, 'PATCH /api/teams')
          }
        }),
    },
  },
})

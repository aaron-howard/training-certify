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
import { requireRole } from '../lib/auth.server'
import { RateLimitPresets, requireRateLimit } from '../lib/rateLimit.server'
import { getCSRFTokenFromRequest, requireCSRFToken } from '../lib/csrf.server'
import * as Errors from '../lib/errors'
import { TeamSchema } from '../lib/validation'
import type { Role } from '../hooks/usePermissions'

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
          ] as Role[])

          // Rate limiting
          await requireRateLimit(session.userId, RateLimitPresets.READ)

          const db = await getDbOrThrow()

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
        } catch (error) {
          if (error instanceof Errors.AppError) {
            return json({ error: error.message, code: error.code }, { status: error.statusCode })
          }
          console.error('❌ [API Teams GET] Unexpected Error:', error)
          return json({ error: 'Internal server error' }, { status: 500 })
        }
      },
      // POST - Create new team (Admin only)
      POST: async ({ request }) => {
        try {
          const session = await requireRole(['Admin'] as Role[])
          await requireRateLimit(session.userId, RateLimitPresets.MUTATION)
          requireCSRFToken(getCSRFTokenFromRequest(request))

          const rawData = await request.json()
          const validation = TeamSchema.safeParse(rawData)

          if (!validation.success) {
            throw new Errors.ValidationError('Invalid team data', validation.error.errors)
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

          // Invalidate cache
          const { cache } = await import('../lib/cache.server')
          cache.invalidate('teams:')

          return json(result[0], { status: 201 })
        } catch (error) {
          if (error instanceof Errors.ValidationError) {
            return json(
              { error: error.message, code: error.code, details: error.errors },
              { status: error.statusCode },
            )
          }
          if (error instanceof Errors.AppError) {
            return json({ error: error.message, code: error.code }, { status: error.statusCode })
          }
          console.error('❌ [API Teams POST] Unexpected Error:', error)
          return json({ error: 'Internal server error' }, { status: 500 })
        }
      },
      // DELETE - Delete team (Admin only)
      DELETE: async ({ request }) => {
        try {
          const session = await requireRole(['Admin'] as Role[])
          await requireRateLimit(session.userId, RateLimitPresets.MUTATION)
          requireCSRFToken(getCSRFTokenFromRequest(request))

          const url = new URL(request.url)
          const id = url.searchParams.get('id')
          if (!id) throw new Errors.ValidationError('Missing team ID')

          const db = await getDbOrThrow()

          await db.transaction(async (tx) => {
            await tx.delete(userTeams).where(eq(userTeams.teamId, id))
            await tx.delete(teams).where(eq(teams.id, id))
          })

          // Invalidate cache
          const { cache } = await import('../lib/cache.server')
          cache.invalidate('teams:')

          return json({ success: true })
        } catch (error) {
          if (error instanceof Errors.AppError) {
            return json({ error: error.message, code: error.code }, { status: error.statusCode })
          }
          console.error('❌ [API Teams DELETE] Unexpected Error:', error)
          return json({ error: 'Internal server error' }, { status: 500 })
        }
      },
      // PATCH - Add/remove team members (Manager+)
      PATCH: async ({ request }) => {
        try {
          const session = await requireRole(['Admin', 'Manager'] as Role[])
          await requireRateLimit(session.userId, RateLimitPresets.MUTATION)
          requireCSRFToken(getCSRFTokenFromRequest(request))

          const data = await request.json()
          const db = await getDbOrThrow()

          const { action, teamId, userId } = data

          if (!teamId || !userId) {
            throw new Errors.ValidationError('teamId and userId are required')
          }

          // Security: If session user is a Manager (not Admin), check if they manage this team
          if (session.role === 'Manager') {
            const team = await db
              .select({ managerId: teams.managerId })
              .from(teams)
              .where(eq(teams.id, teamId))
              .limit(1)

            if (!team.length || team[0].managerId !== session.userId) {
              throw new Errors.ForbiddenError('You are not the manager of this team')
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
            throw new Errors.ValidationError('Invalid action. Use "add" or "remove"')
          }
        } catch (error) {
          if (error instanceof Errors.AppError) {
            return json({ error: error.message, code: error.code }, { status: error.statusCode })
          }
          console.error('❌ [API Teams PATCH] Unexpected Error:', error)
          return json({ error: 'Internal server error' }, { status: 500 })
        }
      },
    },
  },
})

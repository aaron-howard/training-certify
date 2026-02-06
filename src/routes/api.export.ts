import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { eq, inArray, sql } from 'drizzle-orm'
import { getDbOrThrow } from '../db/db.server'
import {
  teamRequirements,
  teams,
  userCertifications,
  userTeams,
  users,
} from '../db/schema'
import { AppError } from '../lib/errors'
import { RateLimitPresets } from '../lib/rateLimit.server'
import { setupReadHandler } from '../lib/api-helpers.server'
import { logError } from '../lib/logging.server'

export const Route = createFileRoute('/api/export')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          // Apply rate limiting and authentication
          await setupReadHandler(request, {
            allowedRoles: ['Admin', 'Manager', 'Auditor', 'Executive'],
            rateLimit: RateLimitPresets.EXPORT, // Strict rate limit for exports
          })

          const url = new URL(request.url)
          const type = url.searchParams.get('type') || 'teams'

          const db = await getDbOrThrow()

          let data: unknown = {}

          if (type === 'teams') {
            const allTeams = await db.select().from(teams)

            // Batch query: Get all team members for all teams at once
            const teamIds = allTeams.map((t) => t.id)
            const allMembers =
              teamIds.length > 0
                ? await db
                    .select({
                      teamId: userTeams.teamId,
                      id: users.id,
                      name: users.name,
                      email: users.email,
                      role: users.role,
                    })
                    .from(userTeams)
                    .innerJoin(users, eq(userTeams.userId, users.id))
                    .where(inArray(userTeams.teamId, teamIds))
                : []

            // Batch query: Get all requirements for all teams at once
            const allRequirements =
              teamIds.length > 0
                ? await db
                    .select({
                      teamId: teamRequirements.teamId,
                      id: teamRequirements.id,
                      certificationId: teamRequirements.certificationId,
                      targetCount: teamRequirements.targetCount,
                    })
                    .from(teamRequirements)
                    .where(inArray(teamRequirements.teamId, teamIds))
                : []

            // Group members and requirements by teamId
            const membersByTeam = new Map<string, typeof allMembers>()
            const requirementsByTeam = new Map<string, typeof allRequirements>()

            for (const member of allMembers) {
              const teamId = member.teamId
              if (!membersByTeam.has(teamId)) {
                membersByTeam.set(teamId, [])
              }
              membersByTeam.get(teamId)!.push(member)
            }

            for (const req of allRequirements) {
              const teamId = req.teamId
              if (!requirementsByTeam.has(teamId)) {
                requirementsByTeam.set(teamId, [])
              }
              requirementsByTeam.get(teamId)!.push(req)
            }

            // Build result with batched data
            const teamsWithDetails = allTeams.map((team) => {
              const members = membersByTeam.get(team.id) || []
              const requirements = requirementsByTeam.get(team.id) || []

              return {
                ...team,
                memberCount: members.length,
                members: members.map(({ teamId, ...member }) => member), // Remove teamId from member objects
                requirements: requirements.map(({ teamId, ...req }) => req), // Remove teamId from requirement objects
              }
            })

            data = {
              reportType: 'Detailed Team Compliance Report',
              generatedAt: new Date().toISOString(),
              teams: teamsWithDetails,
            }
          } else if (type === 'certifications') {
            const certsData = await db
              .select({
                id: userCertifications.id,
                userId: userCertifications.userId,
                certificationName: userCertifications.certificationName,
                vendorName: userCertifications.vendorName,
                status: userCertifications.status,
                expirationDate: userCertifications.expirationDate,
              })
              .from(userCertifications)

            data = {
              reportType: 'Certification Status Report',
              generatedAt: new Date().toISOString(),
              certifications: certsData,
            }
          } else if (type === 'compliance') {
            const usersData = await db
              .select({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
              })
              .from(users)

            const certsCount = await db
              .select({
                userId: userCertifications.userId,
                count: sql<number>`count(*)`.mapWith(Number),
              })
              .from(userCertifications)
              .groupBy(userCertifications.userId)

            data = {
              reportType: 'Compliance Overview Report',
              generatedAt: new Date().toISOString(),
              users: usersData.map((u) => ({
                ...u,
                certCount:
                  certsCount.find((c) => c.userId === u.id)?.count || 0,
              })),
            }
          }

          return new Response(JSON.stringify(data, null, 2), {
            headers: {
              'Content-Type': 'application/json',
              'Content-Disposition': `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.json"`,
            },
          })
        } catch (error) {
          if (error instanceof AppError) {
            return json(
              { error: error.message, code: error.code },
              { status: error.statusCode },
            )
          }
          logError(
            error,
            { route: 'GET /api/export' },
            'Unexpected error in GET /api/export',
          )
          return json({ error: 'Internal server error' }, { status: 500 })
        }
      },
    },
  },
})

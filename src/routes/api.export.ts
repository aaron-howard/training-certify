import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '../db/db.server'
import {
  teamRequirements,
  teams,
  userCertifications,
  userTeams,
  users,
} from '../db/schema'
import { requireRole } from '../lib/auth.server'

export const Route = createFileRoute('/api/export')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireRole(['Admin', 'Manager', 'Auditor', 'Executive'])

          const url = new URL(request.url)
          const type = url.searchParams.get('type') || 'teams'

          const db = await getDb()
          if (!db) {
            return json({ error: 'Database not available' }, { status: 500 })
          }

          let data: any = {}

          if (type === 'teams') {
            const allTeams = await db.select().from(teams)
            const teamsWithDetails = []

            for (const team of allTeams) {
              const members = await db
                .select({
                  id: users.id,
                  name: users.name,
                  email: users.email,
                  role: users.role,
                })
                .from(userTeams)
                .innerJoin(users, eq(userTeams.userId, users.id))
                .where(eq(userTeams.teamId, team.id))

              const requirements = await db
                .select({
                  id: teamRequirements.id,
                  certificationId: teamRequirements.certificationId,
                  targetCount: teamRequirements.targetCount,
                })
                .from(teamRequirements)
                .where(eq(teamRequirements.teamId, team.id))

              teamsWithDetails.push({
                ...team,
                memberCount: members.length,
                members,
                requirements,
              })
            }

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
        } catch (error: any) {
          console.error('[API Export] Error:', error)
          return json(
            { error: 'Forbidden or internal error', details: error.message },
            { status: error.message.includes('Forbidden') ? 403 : 500 },
          )
        }
      },
    },
  },
})

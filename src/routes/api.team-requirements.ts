import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDb } from '../db/db.server'
import { certifications, teamRequirements, teams } from '../db/schema'
import { requireRole } from '../lib/auth.server'
import type { AuthSession } from '../lib/auth.server'

async function checkTeamManagement(
  db: any,
  session: AuthSession,
  teamId: string,
) {
  if (session.role === 'Admin') return true
  if (session.role === 'Manager') {
    const team = await db
      .select({ managerId: teams.managerId })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1)

    return team.length > 0 && team[0].managerId === session.userId
  }
  return false
}

export const Route = createFileRoute('/api/team-requirements')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireRole([
            'Admin',
            'Manager',
            'Auditor',
            'Executive',
            'User',
          ])

          const url = new URL(request.url)
          const teamId = url.searchParams.get('teamId')
          if (!teamId) return json({ error: 'Missing teamId' }, { status: 400 })

          const db = await getDb()
          if (!db) return json({ error: 'DB not available' }, { status: 500 })

          const requirements = await db
            .select({
              id: teamRequirements.id,
              teamId: teamRequirements.teamId,
              certificationId: teamRequirements.certificationId,
              targetCount: teamRequirements.targetCount,
              certificationName: certifications.name,
            })
            .from(teamRequirements)
            .leftJoin(
              certifications,
              eq(teamRequirements.certificationId, certifications.id),
            )
            .where(eq(teamRequirements.teamId, teamId))

          return json(requirements)
        } catch (error: any) {
          console.error('[API Team Requirements GET] Error:', error)
          return json(
            { error: 'Forbidden or internal error', details: error.message },
            { status: error.message.includes('Forbidden') ? 403 : 500 },
          )
        }
      },
      POST: async ({ request }) => {
        try {
          const session = await requireRole(['Admin', 'Manager'])
          const data = await request.json()

          const db = await getDb()
          if (!db) return json({ error: 'DB not available' }, { status: 500 })

          if (!data.teamId || !data.certificationId) {
            return json({ error: 'Missing fields' }, { status: 400 })
          }

          if (!(await checkTeamManagement(db, session, data.teamId))) {
            return json(
              { error: 'Forbidden: You do not manage this team' },
              { status: 403 },
            )
          }

          const result = await db
            .insert(teamRequirements)
            .values({
              teamId: data.teamId,
              certificationId: data.certificationId,
              targetCount: data.targetCount || 1,
            })
            .onConflictDoUpdate({
              target: [
                teamRequirements.teamId,
                teamRequirements.certificationId,
              ],
              set: { targetCount: data.targetCount || 1 },
            })
            .returning()

          return json(result[0], { status: 201 })
        } catch (error: any) {
          console.error('[API Team Requirements POST] Error:', error)
          return json(
            { error: 'Forbidden or internal error', details: error.message },
            { status: error.message.includes('Forbidden') ? 403 : 500 },
          )
        }
      },
      DELETE: async ({ request }) => {
        try {
          const session = await requireRole(['Admin', 'Manager'])
          const url = new URL(request.url)
          const id = url.searchParams.get('id')
          if (!id) return json({ error: 'Missing id' }, { status: 400 })

          const db = await getDb()
          if (!db) return json({ error: 'DB not available' }, { status: 500 })

          // Find the requirement to check team management
          const reqResult = await db
            .select({ teamId: teamRequirements.teamId })
            .from(teamRequirements)
            .where(eq(teamRequirements.id, id))
            .limit(1)

          if (reqResult.length === 0)
            return json({ error: 'Not found' }, { status: 404 })

          if (!(await checkTeamManagement(db, session, reqResult[0].teamId))) {
            return json(
              { error: 'Forbidden: You do not manage this team' },
              { status: 403 },
            )
          }

          await db.delete(teamRequirements).where(eq(teamRequirements.id, id))
          return json({ success: true })
        } catch (error: any) {
          console.error('[API Team Requirements DELETE] Error:', error)
          return json(
            { error: 'Forbidden or internal error', details: error.message },
            { status: error.message.includes('Forbidden') ? 403 : 500 },
          )
        }
      },
    },
  },
})

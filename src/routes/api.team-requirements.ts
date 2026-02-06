import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDbOrThrow } from '../db/db.server'
import { certifications, teamRequirements, teams } from '../db/schema'
import { ForbiddenError, ValidationError } from '../lib/errors'
import { TeamRequirementSchema } from '../lib/validation'
import {
  handleApiError,
  setupMutationHandler,
  setupReadHandler,
} from '../lib/api-helpers.server'
import type { AuthSession } from '../lib/auth.server'

async function checkTeamManagementOrThrow(
  db: Awaited<ReturnType<typeof getDbOrThrow>>,
  session: AuthSession,
  teamId: string,
) {
  if (session.role === 'Admin') return
  if (session.role === 'Manager') {
    const team = await db
      .select({ managerId: teams.managerId })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1)

    if (team.length > 0 && team[0].managerId === session.userId) return
  }

  throw new ForbiddenError('You do not have permission to manage this team')
}

export const Route = createFileRoute('/api/team-requirements')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await setupReadHandler(request)

          const url = new URL(request.url)
          const teamId = url.searchParams.get('teamId')
          if (!teamId) throw new ValidationError('Missing teamId')

          const db = await getDbOrThrow()

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
        } catch (error) {
          return handleApiError(error, 'GET /api/team-requirements')
        }
      },
      POST: async ({ request }) => {
        try {
          const session = await setupMutationHandler(request, {
            allowedRoles: ['Admin', 'Manager'],
          })

          const rawData = await request.json()
          const validation = TeamRequirementSchema.safeParse(rawData)

          if (!validation.success) {
            throw new ValidationError(
              'Invalid team requirement data',
              validation.error.errors,
            )
          }

          const data = validation.data
          const db = await getDbOrThrow()

          await checkTeamManagementOrThrow(db, session, data.teamId)

          const result = await db
            .insert(teamRequirements)
            .values({
              teamId: data.teamId,
              certificationId: data.certificationId,
              targetCount: data.targetCount,
            })
            .onConflictDoUpdate({
              target: [
                teamRequirements.teamId,
                teamRequirements.certificationId,
              ],
              set: { targetCount: data.targetCount },
            })
            .returning()

          return json(result[0], { status: 201 })
        } catch (error) {
          return handleApiError(error, 'POST /api/team-requirements')
        }
      },
      DELETE: async ({ request }) => {
        try {
          const session = await setupMutationHandler(request, {
            allowedRoles: ['Admin', 'Manager'],
          })

          const url = new URL(request.url)
          const id = url.searchParams.get('id')
          if (!id) throw new ValidationError('Missing id')

          const db = await getDbOrThrow()

          // Find the requirement to check team management
          const reqResult = await db
            .select({ teamId: teamRequirements.teamId })
            .from(teamRequirements)
            .where(eq(teamRequirements.id, id))
            .limit(1)

          if (reqResult.length === 0)
            throw new ValidationError('Team requirement not found')

          await checkTeamManagementOrThrow(db, session, reqResult[0].teamId)

          await db.delete(teamRequirements).where(eq(teamRequirements.id, id))
          return json({ success: true })
        } catch (error) {
          return handleApiError(error, 'DELETE /api/team-requirements')
        }
      },
    },
  },
})

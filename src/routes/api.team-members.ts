import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDbOrThrow } from '../db/db.server'
import { userTeams, users } from '../db/schema'
import { ValidationError } from '../lib/errors'
import { handleApiError, setupReadHandler } from '../lib/api-helpers.server'

export const Route = createFileRoute('/api/team-members')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await setupReadHandler(request)

          const url = new URL(request.url)
          const teamId = url.searchParams.get('teamId')

          if (!teamId) {
            throw new ValidationError('teamId is required')
          }

          const db = await getDbOrThrow()

          const members = await db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              role: users.role,
              avatarUrl: users.avatarUrl,
            })
            .from(userTeams)
            .innerJoin(users, eq(userTeams.userId, users.id))
            .where(eq(userTeams.teamId, teamId))

          return json(members)
        } catch (error) {
          return handleApiError(error, 'GET /api/team-members')
        }
      },
    },
  },
})

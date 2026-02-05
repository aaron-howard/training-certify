import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDbOrThrow } from '../db/db.server'
import { userTeams, users } from '../db/schema'
import { requireRole } from '../lib/auth.server'
import { AppError, ValidationError } from '../lib/errors'

export const Route = createFileRoute('/api/team-members')({
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
          if (error instanceof AppError) {
            return json({ error: error.message, code: error.code }, { status: error.statusCode })
          }
          console.error('❌ [API Team Members GET] Unexpected Error:', error)
          return json({ error: 'Internal server error' }, { status: 500 })
        }
      },
    },
  },
})

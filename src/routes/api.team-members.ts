import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDb } from '../db/db.server'
import { userTeams, users } from '../db/schema'
import { requireRole } from '../lib/auth.server'

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
            return json({ error: 'teamId is required' }, { status: 400 })
          }

          const db = await getDb()
          if (!db) {
            return json({ error: 'Database not available' }, { status: 500 })
          }

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
        } catch (error: any) {
          console.error('[API Team Members GET] Error:', error)
          return json(
            { error: 'Forbidden or internal error', details: error.message },
            { status: error.message.includes('Forbidden') ? 403 : 500 },
          )
        }
      },
    },
  },
})

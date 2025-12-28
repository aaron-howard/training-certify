import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDb } from '../db/db.server'
import { userTeams, users } from '../db/schema'
import { eq } from 'drizzle-orm'

export const Route = createFileRoute('/api/team-members')({
  server: {
    handlers: {
      // GET team members by teamId
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const teamId = url.searchParams.get('teamId')

          if (!teamId) {
            return json({ error: 'teamId is required' }, { status: 400 })
          }

          const db = await getDb()
          if (!db) {
            return json({ error: 'Database not available' }, { status: 500 })
          }

          // Get all users in this team
          const members = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            avatarUrl: users.avatarUrl
          })
            .from(userTeams)
            .innerJoin(users, eq(userTeams.userId, users.id))
            .where(eq(userTeams.teamId, teamId))

          return json(members)
        } catch (error) {
          console.error('[API Team Members GET] Error:', error)
          return json([])
        }
      }
    }
  }
})

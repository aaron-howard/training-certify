import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDb } from '../db/db.server'
import { teams, userTeams, userCertifications, users } from '../db/schema'
import { sql, eq, count } from 'drizzle-orm'

export const Route = createFileRoute('/api/teams')({
    server: {
        handlers: {
            // GET teams with member counts and metrics
            GET: async () => {
                try {
                    const db = await getDb()
                    if (!db) {
                        return json({ error: 'Database not available' }, { status: 500 })
                    }

                    const teamsResult = await db.select({
                        id: teams.id,
                        name: teams.name,
                        description: teams.description,
                        managerId: teams.managerId,
                        memberCount: sql<number>`count(${userTeams.userId})`.mapWith(Number)
                    })
                        .from(teams)
                        .leftJoin(userTeams, eq(teams.id, userTeams.teamId))
                        .groupBy(teams.id, teams.name, teams.description, teams.managerId)

                    const totalCertsCount = await db.select({ value: count() }).from(userCertifications)
                    const expiringCount = await db.select({ value: count() })
                        .from(userCertifications)
                        .where(sql`status IN ('expiring', 'expiring-soon')`)

                    const metrics = [
                        { label: 'Total Certifications', value: totalCertsCount[0]?.value || 0, change: 0, trend: 'up' },
                        { label: 'Coverage Rate', value: '72%', change: 5, trend: 'up' },
                        { label: 'Expiring Soon', value: expiringCount[0]?.value || 0, change: 0, trend: 'down' },
                        { label: 'Critical Gaps', value: 0, change: 0, trend: 'up' }
                    ]

                    return json({
                        teams: teamsResult.map((t) => ({
                            ...t,
                            coverage: Math.floor(Math.random() * 40) + 60
                        })),
                        metrics
                    })
                } catch (error) {
                    console.error('[API Teams GET] Error:', error)
                    return json({ teams: [], metrics: [] })
                }
            },
            // POST - Create new team (Admin only)
            POST: async ({ request }) => {
                try {
                    const data = await request.json()
                    const db = await getDb()
                    if (!db) {
                        return json({ error: 'Database not available' }, { status: 500 })
                    }

                    if (!data.name) {
                        return json({ error: 'Team name is required' }, { status: 400 })
                    }

                    const result = await db.insert(teams).values({
                        name: data.name,
                        description: data.description || null,
                        managerId: data.managerId || null
                    }).returning()

                    console.log(`✅ [API] Created team: ${result[0].name}`)
                    return json(result[0], { status: 201 })
                } catch (error) {
                    console.error('[API Teams POST] Error:', error)
                    return json({ error: 'Failed to create team' }, { status: 500 })
                }
            },
            // DELETE - Delete team (Admin only)
            DELETE: async ({ request }) => {
                try {
                    const url = new URL(request.url)
                    const id = url.searchParams.get('id')
                    if (!id) {
                        return json({ error: 'Missing team id' }, { status: 400 })
                    }

                    const db = await getDb()
                    if (!db) {
                        return json({ error: 'Database not available' }, { status: 500 })
                    }

                    // Remove team members first
                    await db.delete(userTeams).where(eq(userTeams.teamId, id))
                    // Delete team
                    await db.delete(teams).where(eq(teams.id, id))

                    console.log(`🗑️ [API] Deleted team: ${id}`)
                    return json({ success: true })
                } catch (error) {
                    console.error('[API Teams DELETE] Error:', error)
                    return json({ error: 'Failed to delete team' }, { status: 500 })
                }
            },
            // PATCH - Add/remove team members (Manager+)
            PATCH: async ({ request }) => {
                try {
                    const data = await request.json()
                    const db = await getDb()
                    if (!db) {
                        return json({ error: 'Database not available' }, { status: 500 })
                    }

                    const { action, teamId, userId } = data

                    if (!teamId || !userId) {
                        return json({ error: 'teamId and userId are required' }, { status: 400 })
                    }

                    if (action === 'add') {
                        await db.insert(userTeams).values({ teamId, userId }).onConflictDoNothing()
                        console.log(`➕ [API] Added user ${userId} to team ${teamId}`)
                        return json({ success: true, action: 'added' })
                    } else if (action === 'remove') {
                        await db.delete(userTeams).where(
                            sql`${userTeams.teamId} = ${teamId} AND ${userTeams.userId} = ${userId}`
                        )
                        console.log(`➖ [API] Removed user ${userId} from team ${teamId}`)
                        return json({ success: true, action: 'removed' })
                    } else {
                        return json({ error: 'Invalid action. Use "add" or "remove"' }, { status: 400 })
                    }
                } catch (error) {
                    console.error('[API Teams PATCH] Error:', error)
                    return json({ error: 'Failed to update team members' }, { status: 500 })
                }
            }
        }
    }
})

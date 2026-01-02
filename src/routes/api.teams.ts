import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '../db/db.server'
import { teams, userCertifications, userTeams } from '../db/schema'

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
                    })
                        .from(teams)

                    const result = []
                    let totalCoverageSum = 0
                    const allMemberIds = new Set<string>()
                    let totalCriticalGaps = 0

                    for (const team of teamsResult) {
                        const members = await db.select({ userId: userTeams.userId })
                            .from(userTeams)
                            .where(eq(userTeams.teamId, team.id))

                        const memberCount = members.length
                        members.forEach(m => allMemberIds.add(m.userId))

                        // Fetch requirements for this team
                        const requirements = await db.select({
                            id: sql`team_requirements.id`,
                            certificationId: sql`team_requirements.certification_id`,
                            targetCount: sql`team_requirements.target_count`
                        })
                            .from(sql`team_requirements`)
                            .where(sql`team_requirements.team_id = ${team.id}`)

                        let coverage = 0
                        if (requirements.length > 0) {
                            let totalCompliance = 0
                            for (const req of (requirements as any[])) {
                                const memberIds = members.map(m => m.userId)
                                if (memberIds.length === 0) {
                                    totalCriticalGaps++
                                    continue
                                }

                                const actualMembersWithCert = await db.select({ userId: userCertifications.userId })
                                    .from(userCertifications)
                                    .where(sql`${userCertifications.userId} IN (${sql.join(memberIds)}) AND ${userCertifications.certificationId} = ${req.certificationId}`)
                                    .groupBy(userCertifications.userId)

                                const count = actualMembersWithCert.length
                                totalCompliance += Math.min(count / req.targetCount, 1)
                                if (count < req.targetCount) {
                                    totalCriticalGaps++
                                }
                            }
                            coverage = Math.round((totalCompliance / requirements.length) * 100)
                        } else if (memberCount > 0) {
                            // Fallback to "any certification" coverage if no specific requirements defined
                            const memberIds = members.map(m => m.userId)
                            const membersWithCerts = await db.select({ userId: userCertifications.userId })
                                .from(userCertifications)
                                .where(sql`${userCertifications.userId} IN ${memberIds}`)
                                .groupBy(userCertifications.userId)

                            coverage = Math.round((membersWithCerts.length / memberCount) * 100)
                        }

                        totalCoverageSum += coverage
                        result.push({
                            ...team,
                            memberCount,
                            coverage,
                            requirementCount: requirements.length
                        })
                    }

                    const overallCoverage = result.length > 0 ? Math.round(totalCoverageSum / result.length) : 0
                    const memberIdsArray = Array.from(allMemberIds)

                    let totalCerts = 0
                    let expiringSoonCerts = 0

                    if (memberIdsArray.length > 0) {
                        const scopedCerts = await db.select()
                            .from(userCertifications)
                            .where(sql`${userCertifications.userId} IN ${memberIdsArray}`)

                        totalCerts = scopedCerts.length
                        expiringSoonCerts = scopedCerts.filter(c =>
                            c.status === 'expiring' || c.status === 'expiring-soon' || c.status === 'active' && c.expirationDate && new Date(c.expirationDate as string).getTime() < Date.now() + 30 * 24 * 60 * 60 * 1000
                        ).length
                    }

                    const metrics = [
                        { label: 'Total Certifications', value: totalCerts, change: 0, trend: 'up' },
                        { label: 'Coverage Rate', value: `${overallCoverage}%`, change: 0, trend: 'up' },
                        { label: 'Expiring Soon', value: expiringSoonCerts, change: 0, trend: 'down' },
                        { label: 'Critical Gaps', value: totalCriticalGaps, change: 0, trend: 'up' }
                    ]

                    return json({
                        teams: result,
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

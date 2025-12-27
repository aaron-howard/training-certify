import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDb } from '../db/db.server'
import { teams, userTeams, userCertifications, users, certifications } from '../db/schema'
import { sql, eq } from 'drizzle-orm'

export const Route = createFileRoute('/api/export')({
    server: {
        handlers: {
            GET: async ({ request }) => {
                try {
                    const url = new URL(request.url)
                    const type = url.searchParams.get('type') || 'teams'

                    const db = await getDb()
                    if (!db) {
                        return json({ error: 'Database not available' }, { status: 500 })
                    }

                    let data: any = {}

                    if (type === 'teams') {
                        const teamsData = await db.select({
                            id: teams.id,
                            name: teams.name,
                            description: teams.description,
                            memberCount: sql<number>`count(${userTeams.userId})`.mapWith(Number)
                        })
                            .from(teams)
                            .leftJoin(userTeams, eq(teams.id, userTeams.teamId))
                            .groupBy(teams.id, teams.name, teams.description)

                        data = {
                            reportType: 'Team Coverage Report',
                            generatedAt: new Date().toISOString(),
                            teams: teamsData
                        }
                    } else if (type === 'certifications') {
                        const certsData = await db.select({
                            id: userCertifications.id,
                            userId: userCertifications.userId,
                            certificationName: userCertifications.certificationName,
                            vendorName: userCertifications.vendorName,
                            status: userCertifications.status,
                            expirationDate: userCertifications.expirationDate
                        }).from(userCertifications)

                        data = {
                            reportType: 'Certification Status Report',
                            generatedAt: new Date().toISOString(),
                            certifications: certsData
                        }
                    } else if (type === 'compliance') {
                        const usersData = await db.select({
                            id: users.id,
                            name: users.name,
                            email: users.email,
                            role: users.role
                        }).from(users)

                        const certsCount = await db.select({
                            userId: userCertifications.userId,
                            count: sql<number>`count(*)`.mapWith(Number)
                        })
                            .from(userCertifications)
                            .groupBy(userCertifications.userId)

                        data = {
                            reportType: 'Compliance Overview Report',
                            generatedAt: new Date().toISOString(),
                            users: usersData.map(u => ({
                                ...u,
                                certCount: certsCount.find(c => c.userId === u.id)?.count || 0
                            }))
                        }
                    }

                    // Return as downloadable JSON
                    return new Response(JSON.stringify(data, null, 2), {
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Disposition': `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.json"`
                        }
                    })
                } catch (error) {
                    console.error('[API Export] Error:', error)
                    return json({ error: 'Failed to generate report' }, { status: 500 })
                }
            }
        }
    }
})

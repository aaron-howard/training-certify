import { createServerFn } from '@tanstack/react-start'
import { getDb } from '../db'
import { teams, userTeams, userCertifications } from '../db/schema'
import { sql, eq, count } from 'drizzle-orm'

export const getTeamData = createServerFn({ method: 'GET' })
    .handler(async () => {
        const db = await getDb()
        try {
            if (!db) {
                console.log('⚠️ [Server] getTeamData: DB is null')
                return { teams: [], metrics: [] }
            }
            const teamsResult = await db.select({
                id: teams.id,
                name: teams.name,
                memberCount: sql<number>`count(${userTeams.userId})`.mapWith(Number)
            })
                .from(teams)
                .leftJoin(userTeams, eq(teams.id, userTeams.teamId))
                .groupBy(teams.id, teams.name)

            const totalCertsCount = await db.select({ value: count() }).from(userCertifications)
            const expiringCount = await db.select({ value: count() })
                .from(userCertifications)
                .where(sql`status IN ('expiring', 'expiring-soon')`)

            // Metrics using real counts
            const metrics = [
                { label: 'Total Certifications', value: totalCertsCount[0].value || 0, change: 0, trend: 'up' },
                { label: 'Coverage Rate', value: '72%', change: 5, trend: 'up' }, // Still mock
                { label: 'Expiring Soon', value: expiringCount[0].value || 0, change: 0, trend: 'down' },
                { label: 'Critical Gaps', value: 0, change: 0, trend: 'up' }
            ]

            console.log(`✅ [Server] getTeamData returning ${teamsResult.length} teams. Real Total Certs: ${totalCertsCount[0].value}`)
            return {
                teams: teamsResult.map((t) => ({
                    ...t,
                    coverage: Math.floor(Math.random() * 40) + 60 // Mock coverage for now
                })),
                metrics
            }
        } catch (error) {
            console.error('❌ [Server] Failed to fetch team data:', error)
            return { teams: [], metrics: [] }
        }
    })

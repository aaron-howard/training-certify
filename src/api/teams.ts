import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { teams, userTeams } from '../db/schema'
import { sql, eq } from 'drizzle-orm'

export const getTeamData = createServerFn({ method: 'GET' })
    .handler(async () => {
        const teamsResult = await db.select({
            id: teams.id,
            name: teams.name,
            memberCount: sql<number>`count(${userTeams.userId})`.mapWith(Number)
        })
            .from(teams)
            .leftJoin(userTeams, eq(teams.id, userTeams.teamId))
            .groupBy(teams.id, teams.name)

        // Mock metrics for now as they aren't in DB yet
        const metrics = [
            { label: 'Total Certifications', value: 35, change: 12, trend: 'up' },
            { label: 'Coverage Rate', value: '72%', change: 5, trend: 'up' },
            { label: 'Expiring Soon', value: 4, change: -2, trend: 'down' },
            { label: 'Critical Gaps', value: 8, change: 1, trend: 'up' }
        ]

        return {
            teams: teamsResult.map(t => ({
                ...t,
                coverage: Math.floor(Math.random() * 40) + 60 // Mock coverage for now
            })),
            metrics
        }
    })

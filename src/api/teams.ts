import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { teams } from '../db/schema'

export const getTeamData = createServerFn({ method: 'GET' })
    .handler(async () => {
        const teamsResult = await db.select().from(teams)

        // Mock metrics for now as they aren't in DB yet
        const metrics = [
            { label: 'Total Certifications', value: 35, change: 12, trend: 'up' },
            { label: 'Coverage Rate', value: '72%', change: 5, trend: 'up' },
            { label: 'Expiring Soon', value: 4, change: -2, trend: 'down' },
            { label: 'Critical Gaps', value: 8, change: 1, trend: 'up' }
        ]

        return {
            teams: teamsResult.map(t => ({
                id: t.id,
                name: t.name,
                memberCount: 0,
                coverage: 0
            })),
            metrics
        }
    })

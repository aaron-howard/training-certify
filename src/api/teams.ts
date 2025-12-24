import { createServerFn } from '@tanstack/react-start'

const teamsData = {
    teams: [
        { id: 'team-001', name: 'Engineering', memberCount: 8, coverage: 62.5 },
        { id: 'team-002', name: 'DevOps', memberCount: 5, coverage: 80 },
        { id: 'team-003', name: 'Security', memberCount: 4, coverage: 75 },
        { id: 'team-004', name: 'Product', memberCount: 3, coverage: 100 },
        { id: 'team-005', name: 'Cloud Platform', memberCount: 6, coverage: 66.7 }
    ],
    metrics: [
        { label: 'Total Certifications', value: 35, change: 12, trend: 'up' },
        { label: 'Coverage Rate', value: '72%', change: 5, trend: 'up' },
        { label: 'Expiring Soon', value: 4, change: -2, trend: 'down' },
        { label: 'Critical Gaps', value: 8, change: 1, trend: 'up' }
    ]
}

export const getTeamData = createServerFn({ method: 'GET' })
    .handler(async () => {
        await new Promise(resolve => setTimeout(resolve, 500))
        return teamsData
    })

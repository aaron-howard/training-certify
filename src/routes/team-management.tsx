import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getTeamData } from '../api/teams'
// No unused icons

export const Route = createFileRoute('/team-management')({
    component: TeamManagementPage,
    loader: async ({ context }) => {
        try {
            const { queryClient } = context as any
            await queryClient.ensureQueryData({
                queryKey: ['teamData'],
                queryFn: async () => {
                    const data = await getTeamData()
                    return data ?? { teams: [], metrics: [] }
                },
            })
        } catch (error) {
            console.error('Error loading team data:', error)
        }
    },
})

function TeamManagementPage() {
    const { data: teamData, isLoading } = useQuery({
        queryKey: ['teamData'],
        queryFn: async () => {
            const res = await getTeamData()
            return res ?? { teams: [], metrics: [] }
        },
    })

    if (isLoading) return <div className="p-8">Loading team data...</div>
    if (!teamData) return <div className="p-8">Team data unavailable.</div>

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Team & Workforce</h1>
                    <p className="text-slate-600 dark:text-slate-400">Monitor competency and manage certification compliance across teams.</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Export Report
                </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {teamData.metrics.map((metric) => (
                    <div key={metric.label} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{metric.label}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${metric.trend === 'up' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30' : 'bg-red-50 text-red-700 dark:bg-red-950/30'}`}>
                                {metric.trend === 'up' ? '+' : ''}{metric.change}%
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{metric.value}</div>
                    </div>
                ))}
            </div>

            {/* Teams Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Team Coverage</h3>
                    <button className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">View all</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Team</th>
                                <th className="px-6 py-3">Members</th>
                                <th className="px-6 py-3">Coverage</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {teamData.teams.map((team) => (
                                <tr key={team.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-50">{team.name}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{team.memberCount}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${team.coverage}%` }} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{team.coverage}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 text-sm font-medium">Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

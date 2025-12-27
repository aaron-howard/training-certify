import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/tanstack-react-start'
import { useState } from 'react'
import { Plus, Trash2, UserPlus, UserMinus, Download, X } from 'lucide-react'
import { usePermissions } from '../hooks/usePermissions'

const fetchTeams = async () => {
    const res = await fetch('/api/teams')
    if (!res.ok) throw new Error('Failed to fetch teams')
    return res.json()
}

const fetchUsers = async () => {
    const res = await fetch('/api/users')
    if (!res.ok) return []
    return res.json()
}

export const Route = createFileRoute('/team-management')({
    component: TeamManagementPage,
})

function TeamManagementPage() {
    const { user } = useUser()
    const queryClient = useQueryClient()
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showMemberModal, setShowMemberModal] = useState<string | null>(null)
    const [newTeamName, setNewTeamName] = useState('')
    const [newTeamDesc, setNewTeamDesc] = useState('')

    // Get user role for permissions
    const { data: dbUser } = useQuery({
        queryKey: ['dbUser', user?.id],
        queryFn: async () => {
            if (!user) return null
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    name: user.fullName || 'User',
                    email: user.emailAddresses[0]?.emailAddress || '',
                    avatarUrl: user.imageUrl
                })
            })
            return res.json()
        },
        enabled: !!user
    })

    const permissions = usePermissions(dbUser?.role)
    const isAdmin = dbUser?.role === 'Admin'
    const isManager = dbUser?.role === 'Manager' || isAdmin

    const { data: teamData, isLoading } = useQuery({
        queryKey: ['teamData'],
        queryFn: fetchTeams,
    })

    // Mutations
    const createTeamMutation = useMutation({
        mutationFn: async (data: { name: string; description: string }) => {
            const res = await fetch('/api/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            if (!res.ok) throw new Error('Failed to create team')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teamData'] })
            setShowCreateModal(false)
            setNewTeamName('')
            setNewTeamDesc('')
        }
    })

    const deleteTeamMutation = useMutation({
        mutationFn: async (teamId: string) => {
            const res = await fetch(`/api/teams?id=${teamId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete team')
            return res.json()
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teamData'] })
    })

    const handleExport = () => {
        window.open('/api/export?type=teams', '_blank')
    }

    if (isLoading) return <div className="p-8">Loading team data...</div>
    if (!teamData) return <div className="p-8">Team data unavailable.</div>

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Team & Workforce</h1>
                    <p className="text-slate-600 dark:text-slate-400">Monitor competency and manage certification compliance across teams.</p>
                </div>
                <div className="flex gap-2">
                    {isAdmin && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> New Team
                        </button>
                    )}
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" /> Export Report
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {teamData.metrics?.map((metric: any) => (
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
                            {teamData.teams?.map((team: any) => (
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
                                        <div className="flex gap-2 justify-end">
                                            {isManager && (
                                                <button
                                                    onClick={() => setShowMemberModal(team.id)}
                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                                >
                                                    <UserPlus className="w-4 h-4" /> Manage
                                                </button>
                                            )}
                                            {isAdmin && (
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Delete team "${team.name}"?`)) {
                                                            deleteTeamMutation.mutate(team.id)
                                                        }
                                                    }}
                                                    className="text-red-600 dark:text-red-400 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!teamData.teams || teamData.teams.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                        No teams found. {isAdmin && "Click 'New Team' to create one."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Team Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Create New Team</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            createTeamMutation.mutate({ name: newTeamName, description: newTeamDesc })
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Team Name</label>
                                <input
                                    type="text"
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    placeholder="e.g., Cloud Engineering"
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                <textarea
                                    value={newTeamDesc}
                                    onChange={(e) => setNewTeamDesc(e.target.value)}
                                    placeholder="Team description (optional)"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createTeamMutation.isPending}
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

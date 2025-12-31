import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/tanstack-react-start'
import { useState } from 'react'
import { Download, Plus, Trash2, UserMinus, UserPlus, X } from 'lucide-react'
import { usePermissions } from '../hooks/usePermissions'

const fetchTeams = async () => {
    const res = await fetch('/api/teams')
    if (!res.ok) throw new Error('Failed to fetch teams')
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

    // Check permissions
    usePermissions(dbUser?.role) // Hook call for future RBAC integration
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
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                <textarea
                                    value={newTeamDesc}
                                    onChange={(e) => setNewTeamDesc(e.target.value)}
                                    placeholder="Team description (optional)"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-700 dark:text-slate-300"
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

            {/* Member Management Modal */}
            {showMemberModal && (
                <MemberManagementModal
                    teamId={showMemberModal}
                    teamName={teamData.teams?.find((t: any) => t.id === showMemberModal)?.name || 'Team'}
                    isAdmin={isAdmin}
                    onClose={() => setShowMemberModal(null)}
                />
            )}
        </div>
    )
}

// Member Management Modal Component
function MemberManagementModal({ teamId, teamName, isAdmin, onClose }: { teamId: string; teamName: string; isAdmin: boolean; onClose: () => void }) {
    const queryClient = useQueryClient()
    const [selectedUserId, setSelectedUserId] = useState('')
    const [showInviteForm, setShowInviteForm] = useState(false)
    const [newUserName, setNewUserName] = useState('')
    const [newUserEmail, setNewUserEmail] = useState('')
    const [newUserRole, setNewUserRole] = useState('User')

    // Fetch all users to add them to teams
    const { data: allUsers = [] } = useQuery({
        queryKey: ['allUsers'],
        queryFn: async () => {
            const res = await fetch('/api/users')
            if (!res.ok) return []
            return res.json()
        }
    })

    // Fetch team members
    const { data: teamMembers = [], isLoading } = useQuery({
        queryKey: ['teamMembers', teamId],
        queryFn: async () => {
            const res = await fetch(`/api/team-members?teamId=${teamId}`)
            if (!res.ok) return []
            return res.json()
        }
    })

    // Create a new user and add to team
    const createUserMutation = useMutation({
        mutationFn: async (userData: { name: string; email: string; role: string }) => {
            // Generate a unique ID for the new user
            const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            // Create the user
            const createRes = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: newUserId,
                    name: userData.name,
                    email: userData.email,
                    role: userData.role
                })
            })
            if (!createRes.ok) throw new Error('Failed to create user')
            const newUser = await createRes.json()

            // Add to team
            const addRes = await fetch('/api/teams', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', teamId, userId: newUser.id })
            })
            if (!addRes.ok) throw new Error('Failed to add user to team')

            return newUser
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allUsers'] })
            queryClient.invalidateQueries({ queryKey: ['teamMembers', teamId] })
            queryClient.invalidateQueries({ queryKey: ['teamData'] })
            setNewUserName('')
            setNewUserEmail('')
            setShowInviteForm(false)
        },
        onError: (err: any) => alert(`Failed to create user: ${err.message}`)
    })

    const addMemberMutation = useMutation({
        mutationFn: async (userId: string) => {
            const res = await fetch('/api/teams', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', teamId, userId })
            })
            if (!res.ok) throw new Error('Failed to add member')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teamMembers', teamId] })
            queryClient.invalidateQueries({ queryKey: ['teamData'] })
            setSelectedUserId('')
        }
    })

    const removeMemberMutation = useMutation({
        mutationFn: async (userId: string) => {
            const res = await fetch('/api/teams', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'remove', teamId, userId })
            })
            if (!res.ok) throw new Error('Failed to remove member')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teamMembers', teamId] })
            queryClient.invalidateQueries({ queryKey: ['teamData'] })
        }
    })

    const updateUserRoleMutation = useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId, role })
            })
            if (!res.ok) throw new Error('Failed to update user role')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teamMembers', teamId] })
            queryClient.invalidateQueries({ queryKey: ['allUsers'] })
        }
    })

    // Filter out users who are already members
    const memberIds = new Set(teamMembers.map((m: any) => m.id))
    const availableUsers = allUsers.filter((u: any) => !memberIds.has(u.id))

    const handleInviteSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (newUserName.trim() && newUserEmail.trim()) {
            createUserMutation.mutate({
                name: newUserName.trim(),
                email: newUserEmail.trim(),
                role: newUserRole
            })
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-lg shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Manage Team: {teamName}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Add Member Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Add Member</label>
                        <button
                            onClick={() => setShowInviteForm(!showInviteForm)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                            {showInviteForm ? 'Select Existing' : '+ Invite New User'}
                        </button>
                    </div>

                    {showInviteForm ? (
                        <form onSubmit={handleInviteSubmit} className="space-y-3">
                            <div>
                                <input
                                    type="text"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    placeholder="Full Name"
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm"
                                />
                            </div>
                            <div>
                                <input
                                    type="email"
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    placeholder="Email Address"
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm"
                                />
                            </div>
                            <div>
                                <select
                                    value={newUserRole}
                                    onChange={(e) => setNewUserRole(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm"
                                >
                                    <option value="User">User Role</option>
                                    <option value="Manager">Manager Role</option>
                                    <option value="Executive">Executive Role</option>
                                    <option value="Auditor">Auditor Role</option>
                                    <option value="Admin">Admin Role</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={createUserMutation.isPending}
                                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                            >
                                <UserPlus className="w-4 h-4" />
                                {createUserMutation.isPending ? 'Creating...' : 'Create & Add to Team'}
                            </button>
                        </form>
                    ) : (
                        <div className="flex gap-2">
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                            >
                                <option value="">
                                    {availableUsers.length === 0 ? 'No users available - Invite new users' : 'Select a user...'}
                                </option>
                                {availableUsers.map((user: any) => (
                                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                                ))}
                            </select>
                            <button
                                onClick={() => selectedUserId && addMemberMutation.mutate(selectedUserId)}
                                disabled={!selectedUserId || addMemberMutation.isPending}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
                            >
                                <UserPlus className="w-4 h-4" /> Add
                            </button>
                        </div>
                    )}

                    {availableUsers.length === 0 && !showInviteForm && (
                        <p className="mt-2 text-xs text-slate-500">
                            No users in the system yet. Click "Invite New User" to add someone.
                        </p>
                    )}
                </div>

                {/* Current Members List */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Members</label>
                    {isLoading ? (
                        <div className="text-slate-500 text-sm">Loading members...</div>
                    ) : teamMembers.length === 0 ? (
                        <div className="text-slate-500 text-sm py-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">No members yet. Add someone above.</div>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {teamMembers.map((member: any) => (
                                <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {member.avatarUrl ? (
                                            <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium text-sm">
                                                {member.name?.charAt(0) || '?'}
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-medium text-slate-900 dark:text-slate-100">{member.name}</div>
                                            <div className="text-xs text-slate-500 mb-1">{member.email}</div>
                                            {isAdmin ? (
                                                <select
                                                    value={member.role || 'User'}
                                                    onChange={(e) => updateUserRoleMutation.mutate({ userId: member.id, role: e.target.value })}
                                                    className="text-xs border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 p-0.5"
                                                >
                                                    <option value="User">User</option>
                                                    <option value="Manager">Manager</option>
                                                    <option value="Executive">Executive</option>
                                                    <option value="Auditor">Auditor</option>
                                                    <option value="Admin">Admin</option>
                                                </select>
                                            ) : (
                                                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                                    {member.role || 'User'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeMemberMutation.mutate(member.id)}
                                        disabled={removeMemberMutation.isPending}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                    >
                                        <UserMinus className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-700 dark:text-slate-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

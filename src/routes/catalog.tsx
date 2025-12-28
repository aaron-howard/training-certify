import { createFileRoute } from '@tanstack/react-router'
import { Search, ExternalLink, Plus, Edit, Trash2, Database, ShieldCheck, RefreshCw, X } from 'lucide-react'
import { useUser } from '@clerk/tanstack-react-start'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { usePermissions } from '../hooks/usePermissions'

// API fetch functions (using traditional fetch instead of broken createServerFn)
const fetchCatalog = async () => {
    const res = await fetch('/api/catalog')
    if (!res.ok) throw new Error('Failed to fetch catalog')
    return res.json()
}

const fetchEnsureUser = async (data: { id: string; name: string; email: string; avatarUrl?: string }) => {
    const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to sync user')
    return res.json()
}

export const Route = createFileRoute('/catalog')({
    component: CatalogPage,
    // Note: No SSR loader - fetch with relative URLs doesn't work server-side
})


function CatalogPage() {
    const { user } = useUser()
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [newCert, setNewCert] = useState({ id: '', name: '', vendorName: '', difficulty: 'Intermediate' })

    // Sync/Get User Role
    const { data: dbUser } = useQuery({
        queryKey: ['dbUser', user?.id],
        queryFn: async () => {
            if (!user) return null
            return fetchEnsureUser({
                id: user.id,
                name: user.fullName || 'User',
                email: user.emailAddresses[0]?.emailAddress || '',
                avatarUrl: user.imageUrl
            })
        },
        enabled: !!user
    })

    const { data: catalog, isLoading, error } = useQuery({
        queryKey: ['catalog'],
        queryFn: fetchCatalog,
    })

    if (error) {
        console.error('DEBUG: useQuery Error:', error);
    }

    // Get permissions based on role
    const permissions = usePermissions(dbUser?.role)
    const isAdmin = dbUser?.role === 'Admin'

    // Filter certifications based on search
    const filteredCertifications = useMemo(() => {
        if (!catalog?.certifications) return []
        if (!searchQuery.trim()) return catalog.certifications
        const query = searchQuery.toLowerCase()
        return catalog.certifications.filter((cert: any) =>
            cert.name?.toLowerCase().includes(query) ||
            cert.vendor?.toLowerCase().includes(query) ||
            cert.level?.toLowerCase().includes(query)
        )
    }, [catalog?.certifications, searchQuery])

    // Mutations
    const seedMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/seed', { method: 'POST' })
            if (!res.ok) throw new Error('Failed to seed catalog')
            return res.json()
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['catalog'] })
            alert(`Seeded ${data.added} certifications (${data.skipped} already existed)`)
        },
        onError: (err: any) => alert(`Seed failed: ${err.message}`)
    })

    const deleteMutation = useMutation({
        mutationFn: async (vars: { id: string }) => {
            const res = await fetch(`/api/catalog?action=delete&id=${vars.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete')
            return res.json()
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog'] })
    })

    const promoteMutation = useMutation({
        mutationFn: async (vars: { userId: string }) => {
            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: vars.userId, role: 'Admin' })
            })
            if (!res.ok) throw new Error('Failed to promote user')
            return res.json()
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['dbUser'] })
            alert(`You are now an ${data.role}!`)
        },
        onError: (err: any) => {
            alert(`Promotion failed: ${err.message}`)
        }
    })

    const syncMutation = useMutation({
        mutationFn: async (vars: { limit?: number }) => {
            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ limit: vars.limit || 10 })
            })
            if (!res.ok) throw new Error('Failed to sync')
            return res.json()
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['catalog'] })
            alert(`Synced ${data.synced} certifications! ${data.message}`)
        },
        onError: (err: any) => alert(`Sync failed: ${err.message}`)
    })

    const addCertMutation = useMutation({
        mutationFn: async (certData: { id: string; name: string; vendorName: string; difficulty: string }) => {
            const res = await fetch('/api/catalog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(certData)
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to add certification')
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalog'] })
            setShowAddModal(false)
            setNewCert({ id: '', name: '', vendorName: '', difficulty: 'Intermediate' })
            alert('Certification added successfully!')
        },
        onError: (err: any) => alert(`Add failed: ${err.message}`)
    })

    const handleSeed = () => {
        if (confirm('Seed Microsoft and ServiceNow certifications?')) {
            seedMutation.mutate()
        }
    }

    const handleDelete = (id: string) => {
        if (confirm('Delete this certification from the catalog?')) {
            deleteMutation.mutate({ id })
        }
    }

    const handleSync = () => {
        if (confirm('Sync catalog with ITExams? This might take a while.')) {
            syncMutation.mutate({ limit: 10 })
        }
    }

    const handlePromote = () => {
        promoteMutation.mutate({ userId: user?.id || '' })
    }

    if (isLoading) return <div className="p-8">Loading catalog...</div>
    if (!catalog) return <div className="p-8 text-slate-600">Catalog unavailable at the moment.</div>

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Certification Catalog</h1>
                    <p className="text-slate-600 dark:text-slate-400">Browse official certifications from top vendors.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            id="catalog-search"
                            name="catalog-search"
                            type="text"
                            placeholder="Search certifications..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                    </div>

                    {/* Admin Tools */}
                    <div className="flex gap-2">
                        {!isAdmin && (
                            <button
                                onClick={handlePromote}
                                className="px-4 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
                                title="Dev Only: Make me Admin"
                            >
                                <ShieldCheck className="w-4 h-4" /> Become Admin
                            </button>
                        )}
                        {isAdmin && (
                            <>
                                <button
                                    onClick={handleSeed}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm"
                                >
                                    <Database className="w-4 h-4" /> Seed
                                </button>
                                <button
                                    onClick={handleSync}
                                    disabled={syncMutation.isPending}
                                    className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                                >
                                    <RefreshCw className={Boolean(syncMutation.isPending) ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
                                    {syncMutation.isPending ? 'Syncing...' : 'Sync ITExams'}
                                </button>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                                >
                                    <Plus className="w-4 h-4" /> Add New
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCertifications.map((cert: any) => (
                    <div key={cert.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative">
                        {/* Admin Actions */}
                        {isAdmin && (
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => alert('Edit Form To Be Implemented')}
                                    className="p-1.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-blue-600"
                                >
                                    <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(cert.id)}
                                    className="p-1.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-red-600"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                                {cert.vendor.charAt(0)}
                            </div>
                            <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                                {cert.level}
                            </span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50 mb-1 group-hover:text-blue-600 transition-colors">{cert.name}</h3>
                        <p className="text-sm text-slate-500 mb-6">{cert.vendor}</p>
                        <button className="w-full py-2 bg-slate-50 dark:bg-slate-950 hover:bg-blue-600 hover:text-white border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2">
                            View Requirements <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Add New Certification Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Add New Certification</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            addCertMutation.mutate(newCert)
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Certification ID</label>
                                <input
                                    type="text"
                                    value={newCert.id}
                                    onChange={(e) => setNewCert({ ...newCert, id: e.target.value })}
                                    placeholder="e.g., az-500"
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newCert.name}
                                    onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                                    placeholder="e.g., Azure Security Engineer Associate"
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vendor</label>
                                <input
                                    type="text"
                                    value={newCert.vendorName}
                                    onChange={(e) => setNewCert({ ...newCert, vendorName: e.target.value })}
                                    placeholder="e.g., Microsoft"
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
                                <select
                                    value={newCert.difficulty}
                                    onChange={(e) => setNewCert({ ...newCert, difficulty: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                    <option value="Expert">Expert</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addCertMutation.isPending}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {addCertMutation.isPending ? 'Adding...' : 'Add Certification'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

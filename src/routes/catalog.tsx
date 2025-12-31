import { createFileRoute } from '@tanstack/react-router'
import { Search, ExternalLink, Plus, Edit, Trash2, Database, X } from 'lucide-react'
import { useUser } from '@clerk/tanstack-react-start'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'

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
    const [sortBy, setSortBy] = useState('name') // name, vendor, level
    const [vendorFilter, setVendorFilter] = useState('All')
    const [difficultyFilter, setDifficultyFilter] = useState('All')
    const [categoryFilter, setCategoryFilter] = useState('All')
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedCert, setSelectedCert] = useState<any>(null)
    const [newCert, setNewCert] = useState({ id: '', name: '', vendorName: '', difficulty: 'Intermediate', price: '', category: 'Cloud', description: '' })

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
    const isAdmin = dbUser?.role === 'Admin'

    // List of unique vendors for filtering
    const vendors = useMemo(() => {
        if (!catalog?.certifications) return ['All']
        const uniqueVendors = Array.from(new Set(catalog.certifications.map((c: any) => c.vendor))) as string[]
        return ['All', ...uniqueVendors.filter(Boolean).sort()]
    }, [catalog?.certifications])

    // List of unique categories for filtering
    const categories = useMemo(() => {
        if (!catalog?.certifications) return ['All']
        const uniqueCategories = Array.from(new Set(catalog.certifications.map((c: any) => c.category))) as string[]
        return ['All', ...uniqueCategories.filter(Boolean).sort()]
    }, [catalog?.certifications])

    // Filter and Sort certifications
    const filteredCertifications = useMemo(() => {
        if (!catalog?.certifications) return []

        let processed = [...catalog.certifications]

        // 1. Text Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            processed = processed.filter((cert: any) =>
                cert.name?.toLowerCase().includes(query) ||
                cert.vendor?.toLowerCase().includes(query) ||
                cert.level?.toLowerCase().includes(query)
            )
        }

        // 2. Vendor Filter
        if (vendorFilter !== 'All') {
            processed = processed.filter((cert: any) => cert.vendor === vendorFilter)
        }

        // 3. Difficulty Filter
        if (difficultyFilter !== 'All') {
            processed = processed.filter((cert: any) => cert.level === difficultyFilter)
        }

        // 4. Category Filter
        if (categoryFilter !== 'All') {
            processed = processed.filter((cert: any) => cert.category === categoryFilter)
        }

        // 4. Sorting
        processed.sort((a: any, b: any) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name)
            if (sortBy === 'vendor') return a.vendor.localeCompare(b.vendor)
            if (sortBy === 'level') {
                const ranks: Record<string, number> = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3, 'Expert': 4 }
                return (ranks[a.level] || 0) - (ranks[b.level] || 0)
            }
            return 0
        })

        return processed
    }, [catalog?.certifications, searchQuery, sortBy, vendorFilter, difficultyFilter, categoryFilter])

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



    const addCertMutation = useMutation({
        mutationFn: async (certData: { id: string; name: string; vendorName: string; difficulty: string; price: string; category: string; description: string }) => {
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
            setNewCert({ id: '', name: '', vendorName: '', difficulty: 'Intermediate', price: '', category: 'Cloud', description: '' })
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



    if (isLoading) return <div className="p-8">Loading catalog...</div>
    if (!catalog) return <div className="p-8 text-slate-600">Catalog unavailable at the moment.</div>

    return (
        <div className="space-y-8">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Certification Catalog</h1>
                    <p className="text-slate-600 dark:text-slate-400">Browse official certifications from top vendors.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative min-w-[240px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                id="catalog-search"
                                type="text"
                                placeholder="Search certifications..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <select
                            value={vendorFilter}
                            onChange={(e) => setVendorFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {vendors.map(v => <option key={v} value={v} className="dark:bg-slate-900">{v === 'All' ? 'All Vendors' : v}</option>)}
                        </select>

                        <select
                            value={difficultyFilter}
                            onChange={(e) => setDifficultyFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="All" className="dark:bg-slate-900">All Levels</option>
                            <option value="Beginner" className="dark:bg-slate-900">Beginner</option>
                            <option value="Intermediate" className="dark:bg-slate-900">Intermediate</option>
                            <option value="Advanced" className="dark:bg-slate-900">Advanced</option>
                            <option value="Expert" className="dark:bg-slate-900">Expert</option>
                        </select>

                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {categories.map(c => <option key={c} value={c} className="dark:bg-slate-900">{c === 'All' ? 'All Categories' : c}</option>)}
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="name" className="dark:bg-slate-900">Sort by Name</option>
                            <option value="vendor" className="dark:bg-slate-900">Sort by Vendor</option>
                            <option value="level" className="dark:bg-slate-900">Sort by Difficulty</option>
                        </select>
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

                    <div className="flex items-center gap-2">
                        {isAdmin && (
                            <>
                                <button
                                    onClick={handleSeed}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                                >
                                    <Database className="w-4 h-4" /> Seed
                                </button>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
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
                        {isAdmin && (
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => alert('Edit Form To Be Implemented')} className="p-1.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-blue-600">
                                    <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDelete(cert.id)} className="p-1.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-red-600">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                                {cert.vendor?.charAt(0)}
                            </div>
                            <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                                {cert.category || 'Cloud'}
                            </span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">{cert.name}</h3>
                        <p className="text-sm text-slate-500 mb-6">{cert.vendor}</p>
                        <button
                            onClick={() => setSelectedCert(cert)}
                            className="w-full py-2 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                        >
                            View Requirements <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
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
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
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
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
                                <select
                                    value={newCert.difficulty}
                                    onChange={(e) => setNewCert({ ...newCert, difficulty: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                    <option value="Expert">Expert</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                <select
                                    value={newCert.category}
                                    onChange={(e) => setNewCert({ ...newCert, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="Cloud">Cloud</option>
                                    <option value="Security">Security</option>
                                    <option value="Networking">Networking</option>
                                    <option value="Data">Data</option>
                                    <option value="Project Management">Project Management</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description / Requirements</label>
                                <textarea
                                    value={newCert.description}
                                    onChange={(e) => setNewCert({ ...newCert, description: e.target.value })}
                                    placeholder="Enter exam requirements or description..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price</label>
                                <input
                                    type="text"
                                    value={newCert.price}
                                    onChange={(e) => setNewCert({ ...newCert, price: e.target.value })}
                                    placeholder="e.g., $165"
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addCertMutation.isPending}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 text-sm font-medium transition-colors"
                                >
                                    {addCertMutation.isPending ? 'Adding...' : 'Add Certification'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedCert && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 font-bold shrink-0">
                                        {selectedCert.vendor?.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 leading-tight">{selectedCert.name}</h2>
                                        <p className="text-sm text-slate-500">{selectedCert.vendor}</p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedCert(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Difficulty</p>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{selectedCert.level}</p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Category</p>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{selectedCert.category || 'N/A'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Exam Price</p>
                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{selectedCert.price || 'Contact Vendor'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Code</p>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase">{selectedCert.id}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                                    Details & Requirements
                                </h3>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                                    {selectedCert.description ? (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                                            {selectedCert.description}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">No specific requirements listed for this certification yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                            <button
                                onClick={() => setSelectedCert(null)}
                                className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                            >
                                Close
                            </button>
                            <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                                Official Site <ExternalLink className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

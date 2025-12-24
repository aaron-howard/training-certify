import { createFileRoute } from '@tanstack/react-router'
import { Search, ExternalLink, Plus, Edit, Trash2, Database, ShieldCheck } from 'lucide-react'
import { useUser } from '@clerk/tanstack-react-start'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCatalog, deleteCatalogCertification, seedCatalog } from '../api/others'
import { ensureUser, makeMeAdmin } from '../api/users'

export const Route = createFileRoute('/catalog')({
    component: CatalogPage,
    loader: async ({ context }) => {
        try {
            const { queryClient } = context as any
            await queryClient.ensureQueryData({
                queryKey: ['catalog'],
                queryFn: async () => {
                    const data = await getCatalog()
                    return data ?? { certifications: [] }
                },
            })
        } catch (error) {
            console.error('Error loading catalog data:', error)
        }
    },
})

function CatalogPage() {
    const { user } = useUser()
    const queryClient = useQueryClient()

    // Sync/Get User Role
    const { data: dbUser } = useQuery({
        queryKey: ['dbUser', user?.id],
        queryFn: async () => {
            if (!user) return null
            const res = await ensureUser({
                data: {
                    id: user.id,
                    name: user.fullName || 'User',
                    email: user.emailAddresses[0]?.emailAddress || '',
                    avatarUrl: user.imageUrl
                }
            })
            return res
        },
        enabled: !!user
    })

    const { data: catalog, isLoading } = useQuery({
        queryKey: ['catalog'],
        queryFn: async () => {
            const res = await getCatalog()
            return res ?? { certifications: [] }
        },
    })

    const isAdmin = dbUser?.role === 'Admin'

    // Mutations
    const seedMutation = useMutation({
        mutationFn: () => seedCatalog({ data: undefined }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog'] })
    })

    const deleteMutation = useMutation({
        mutationFn: (vars: { id: string; adminId: string }) => deleteCatalogCertification({ data: vars }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog'] })
    })

    const promoteMutation = useMutation({
        mutationFn: (vars: { userId: string }) => makeMeAdmin({ data: vars }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dbUser'] })
    })

    const handleSeed = () => {
        if (confirm('Seed Microsoft and ServiceNow certifications?')) {
            seedMutation.mutate()
        }
    }

    const handleDelete = (id: string) => {
        if (confirm('Delete this certification from the catalog?')) {
            deleteMutation.mutate({ id, adminId: user?.id || '' })
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
                                    onClick={() => alert('Add Form Modal To Be Implemented')}
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
                {catalog?.certifications.map((cert: any) => (
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
        </div>
    )
}

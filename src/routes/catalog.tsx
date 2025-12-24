import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCatalog } from '../api/others'
import { Search, ExternalLink } from 'lucide-react'

export const Route = createFileRoute('/catalog')({
    component: CatalogPage,
    loader: async ({ context }) => {
        const { queryClient } = context as any
        await queryClient.ensureQueryData({
            queryKey: ['catalog'],
            queryFn: () => getCatalog(),
        })
    },
})

function CatalogPage() {
    const { data: catalog } = useQuery({
        queryKey: ['catalog'],
        queryFn: () => getCatalog(),
    })

    if (!catalog) return <div className="p-8">Loading catalog...</div>

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Certification Catalog</h1>
                    <p className="text-slate-600 dark:text-slate-400">Browse official certifications from top vendors.</p>
                </div>
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search certifications..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {catalog.certifications.map((cert) => (
                    <div key={cert.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
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

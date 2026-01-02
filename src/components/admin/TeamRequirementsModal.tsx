import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, X, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Requirement {
    id: string
    certificationId: string
    targetCount: number
    certificationName?: string
}

export function TeamRequirementsModal({ teamId, teamName, onClose }: { teamId: string; teamName: string; onClose: () => void }) {
    const queryClient = useQueryClient()
    const [selectedCertId, setSelectedCertId] = useState('')
    const [targetCount, setTargetCount] = useState(1)

    const { data: requirements = [], isLoading: loadingReqs } = useQuery<Requirement[]>({
        queryKey: ['teamRequirements', teamId],
        queryFn: async () => {
            const res = await fetch(`/api/team-requirements?teamId=${teamId}`)
            if (!res.ok) throw new Error('Failed to fetch requirements')
            return res.json()
        }
    })

    const { data: certList = [] } = useQuery({
        queryKey: ['allCertifications'],
        queryFn: async () => {
            const res = await fetch('/api/catalog')
            let certs = []
            if (!res.ok) {
                const res2 = await fetch('/api/certifications')
                certs = await res2.json()
            } else {
                const data = await res.json()
                certs = data.certifications || []
            }

            return certs.sort((a: any, b: any) => {
                const nameA = (a.name || a.certificationName || '').toLowerCase()
                const nameB = (b.name || b.certificationName || '').toLowerCase()
                return nameA.localeCompare(nameB)
            })
        }
    })

    const addReqMutation = useMutation({
        mutationFn: async (req: { certificationId: string, targetCount: number }) => {
            const res = await fetch('/api/team-requirements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId, ...req })
            })
            if (!res.ok) throw new Error('Failed to add requirement')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teamRequirements', teamId] })
            queryClient.invalidateQueries({ queryKey: ['teamData'] })
            setSelectedCertId('')
            setTargetCount(1)
        }
    })

    const deleteReqMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/team-requirements?id=${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete requirement')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teamRequirements', teamId] })
            queryClient.invalidateQueries({ queryKey: ['teamData'] })
        }
    })

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Coverage Requirements</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Define how many team members must hold specific certifications.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Certification</label>
                        <select
                            value={selectedCertId}
                            onChange={(e) => setSelectedCertId(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                        >
                            <option value="">Select a certification...</option>
                            {certList.map((cert: any) => (
                                <option key={cert.id} value={cert.id}>{cert.name || cert.certificationName} ({cert.vendor || cert.vendorName})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Target Count</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                min="1"
                                value={targetCount}
                                onChange={(e) => setTargetCount(parseInt(e.target.value))}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                            <button
                                onClick={() => selectedCertId && addReqMutation.mutate({ certificationId: selectedCertId, targetCount })}
                                disabled={!selectedCertId || addReqMutation.isPending}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">Active Requirements for {teamName}</h3>
                    {loadingReqs ? (
                        <div className="text-slate-500 text-sm">Loading requirements...</div>
                    ) : requirements.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">No coverage requirements defined yet.</p>
                        </div>
                    ) : (
                        requirements.map((req) => (
                            <div key={req.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{req.certificationName || 'Loading...'}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Required: {req.targetCount} team members</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteReqMutation.mutate(req.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    )
}

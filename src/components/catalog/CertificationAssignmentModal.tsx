import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPlus, X } from 'lucide-react'

export function CertificationAssignmentModal({
  cert,
  onClose,
  managerId,
}: {
  cert: any
  onClose: () => void
  managerId: string
}) {
  const queryClient = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState('')

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    },
  })

  const assignMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch('/api/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          certificationId: cert.id,
          certificationName: cert.name,
          vendorName: cert.vendor,
          status: 'assigned',
          assignedById: managerId,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to assign certification')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCertifications'] })
      alert(`Assigned ${cert.name} successfully.`)
      onClose()
    },
    onError: (err: any) => alert(`Assignment failed: ${err.message}`),
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Assign Certification
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Select a team member to assign this cert to.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 flex items-start gap-3">
            <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center text-blue-600 font-bold shrink-0 shadow-sm border border-blue-100 dark:border-blue-800">
              {cert.vendor?.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-50">
                {cert.name}
              </div>
              <div className="text-xs text-slate-500">{cert.vendor}</div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Target User
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none font-inter text-sm cursor-pointer"
            >
              <option value="">Select a user...</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                selectedUserId && assignMutation.mutate(selectedUserId)
              }
              disabled={!selectedUserId || assignMutation.isPending}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {assignMutation.isPending ? (
                'Assigning...'
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Assign
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

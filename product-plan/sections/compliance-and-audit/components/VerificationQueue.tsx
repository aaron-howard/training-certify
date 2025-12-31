import { CheckCircle, Clock, FileText, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { PendingVerification } from '@/../product/sections/compliance-and-audit/types'

interface VerificationQueueProps {
  pendingVerifications: Array<PendingVerification>
  onVerify?: (certificationId: string, approved: boolean) => void
  onViewDocument?: (documentUrl: string) => void
}

export function VerificationQueue({ pendingVerifications, onVerify, onViewDocument }: VerificationQueueProps) {
  const pending = pendingVerifications.filter(v => v.status === 'pending-verification')

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Verification Queue</h3>
        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-full">
          {pending.length} pending
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {pending.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-emerald-700 dark:text-emerald-300 font-medium">All caught up!</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">No certifications pending verification</p>
          </div>
        ) : (
          pending.map(verification => (
            <div
              key={verification.id}
              className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-900 dark:text-slate-100 mb-1">
                    {verification.userName}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    {verification.certificationName}
                  </div>
                </div>
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 ml-2" />
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-500 mb-3">
                Uploaded {formatDistanceToNow(new Date(verification.uploadedDate), { addSuffix: true })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onViewDocument?.(verification.documentUrl)}
                  className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View Doc
                </button>
                <button
                  onClick={() => onVerify?.(verification.id, true)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approve
                </button>
                <button
                  onClick={() => onVerify?.(verification.id, false)}
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

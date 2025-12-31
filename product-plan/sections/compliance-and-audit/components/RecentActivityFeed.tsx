import { CheckCircle, Clock, RefreshCw, Trash2, TrendingUp, Upload, UserPlus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { AuditLog } from '@/../product/sections/compliance-and-audit/types'

interface RecentActivityFeedProps {
  auditLogs: Array<AuditLog>
  recentActivity: {
    last7Days: number
    last30Days: number
    last90Days: number
  }
  onViewDetails?: (auditLogId: string) => void
}

export function RecentActivityFeed({ auditLogs, recentActivity, onViewDetails }: RecentActivityFeedProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'upload': return <Upload className="w-4 h-4" />
      case 'renewal': return <RefreshCw className="w-4 h-4" />
      case 'deletion': return <Trash2 className="w-4 h-4" />
      case 'verification': return <CheckCircle className="w-4 h-4" />
      case 'assignment': return <UserPlus className="w-4 h-4" />
      case 'expiration': return <Clock className="w-4 h-4" />
      case 'update': return <TrendingUp className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'upload': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
      case 'renewal': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
      case 'deletion': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
      case 'verification': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
      case 'assignment': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
      case 'expiration': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
      case 'update': return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recent Activity</h3>
        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div>
            <span className="font-semibold">{recentActivity.last7Days}</span> this week
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {auditLogs.map(log => (
          <button
            key={log.id}
            onClick={() => onViewDetails?.(log.id)}
            className="w-full text-left p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <div className="flex items-start gap-3">
              <div className={`${getActionColor(log.action)} p-2 rounded-lg flex-shrink-0`}>
                {getActionIcon(log.action)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="font-medium text-sm text-slate-900 dark:text-slate-100 capitalize">
                    {log.action}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                  </div>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 truncate">
                  {log.affectedResource.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  by {log.performedBy.name}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="font-bold text-lg text-slate-900 dark:text-slate-100">{recentActivity.last7Days}</div>
            <div className="text-slate-600 dark:text-slate-400">7 days</div>
          </div>
          <div>
            <div className="font-bold text-lg text-slate-900 dark:text-slate-100">{recentActivity.last30Days}</div>
            <div className="text-slate-600 dark:text-slate-400">30 days</div>
          </div>
          <div>
            <div className="font-bold text-lg text-slate-900 dark:text-slate-100">{recentActivity.last90Days}</div>
            <div className="text-slate-600 dark:text-slate-400">90 days</div>
          </div>
        </div>
      </div>
    </div>
  )
}

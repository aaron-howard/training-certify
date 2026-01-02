import { Download, Eye, Filter, Search } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'
import type { AuditLog } from '@/../product/sections/compliance-and-audit/types'

interface AuditTrailTableProps {
  auditLogs: Array<AuditLog>
  onViewDetails?: (auditLogId: string) => void
  onFilter?: (filters: {
    userId?: string
    dateRange?: { start: string; end: string }
    actionType?: string
    certificationId?: string
  }) => void
  onSearch?: (searchTerm: string) => void
}

export function AuditTrailTable({
  auditLogs,
  onViewDetails,
  onFilter,
  onSearch,
}: AuditTrailTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAction, setSelectedAction] = useState<string>('all')

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    onSearch?.(value)
  }

  const handleActionFilter = (action: string) => {
    setSelectedAction(action)
    if (action === 'all') {
      onFilter?.({})
    } else {
      onFilter?.({ actionType: action })
    }
  }

  const getActionBadge = (action: string) => {
    const badges = {
      upload:
        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      renewal:
        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      deletion:
        'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
      verification:
        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      assignment:
        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      expiration:
        'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
      update:
        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    }
    return badges[action as keyof typeof badges] || badges.update
  }

  const actions = [
    'all',
    'upload',
    'verification',
    'renewal',
    'assignment',
    'deletion',
    'expiration',
    'update',
  ]

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Complete Audit Trail
        </h2>
        <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit logs by user, action, or certification..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400 mr-2">
            Filter by action:
          </span>
          {actions.map((action) => (
            <button
              key={action}
              onClick={() => handleActionFilter(action)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                selectedAction === action
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Timestamp
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Action
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Performed By
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Affected Resource
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Details
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.slice(0, 20).map((log) => (
              <tr
                key={log.id}
                className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  <div>{format(new Date(log.timestamp), 'MMM d, yyyy')}</div>
                  <div className="text-xs text-slate-500">
                    {format(new Date(log.timestamp), 'HH:mm:ss')}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded capitalize ${getActionBadge(log.action)}`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm">
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {log.performedBy.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {log.performedBy.role}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm">
                  <div className="text-slate-900 dark:text-slate-100 line-clamp-1">
                    {log.affectedResource.name}
                  </div>
                  <div className="text-xs text-slate-500 capitalize">
                    {log.affectedResource.type
                      .replace(/([A-Z])/g, ' $1')
                      .trim()}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 max-w-xs">
                  <div className="line-clamp-2">{log.details}</div>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onViewDetails?.(log.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {auditLogs.length > 20 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Showing 20 of {auditLogs.length} audit log entries
          </p>
        </div>
      )}
    </div>
  )
}

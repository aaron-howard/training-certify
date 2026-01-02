import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, FileCheck, History, Shield } from 'lucide-react'

// Use fetch API instead of server imports
const fetchComplianceData = async () => {
  const res = await fetch('/api/compliance')
  if (!res.ok)
    return {
      auditLogs: [],
      stats: { complianceRate: 0, totalAudits: 0, issuesFound: 0 },
    }
  return res.json()
}

export const Route = createFileRoute('/compliance-audit')({
  component: ComplianceAuditPage,
})

function ComplianceAuditPage() {
  const { data: compliance, isLoading } = useQuery({
    queryKey: ['complianceData'],
    queryFn: fetchComplianceData,
  })

  if (isLoading) return <div className="p-8">Loading compliance data...</div>
  if (!compliance)
    return <div className="p-8">Compliance data unavailable.</div>

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Compliance & Audit
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track audit trails and ensure regulatory compliance.
          </p>
        </div>
        <button
          onClick={() => window.open('/api/export?type=compliance', '_blank')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Shield className="w-4 h-4" /> Export Audit Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center text-emerald-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">
              Compliance Rate
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {compliance.stats.complianceRate}%
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-full flex items-center justify-center text-blue-600">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">
              Total Audits
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {compliance.stats.totalAudits}
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center text-red-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">
              Open Issues
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {compliance.stats.issuesFound}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <History className="w-5 h-5 text-slate-400" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Audit Trail
          </h3>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {compliance?.auditLogs?.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500">
              No audit logs yet.
            </div>
          ) : (
            compliance?.auditLogs.map((log: any) => (
              <div
                key={log.id}
                className="px-6 py-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors"
              >
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 font-bold">
                    {log.user.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-50">
                      {log.action}
                    </div>
                    <div className="text-sm text-slate-500">
                      {log.user} • {log.date}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider ${log.status === 'verified' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30'}`}
                >
                  {log.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

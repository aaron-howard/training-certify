import { Clock, FileText, Shield, TrendingUp } from 'lucide-react'
import { ComplianceMetricsOverview } from './ComplianceMetricsOverview'
import { RecentActivityFeed } from './RecentActivityFeed'
import { UpcomingDeadlines } from './UpcomingDeadlines'
import { AuditTrailTable } from './AuditTrailTable'
import { ReportsSection } from './ReportsSection'
import { VerificationQueue } from './VerificationQueue'
import type { ComplianceAuditProps } from '@/../product/sections/compliance-and-audit/types'

/**
 * Compliance Dashboard - Primary view for Compliance & Audit section
 *
 * Provides auditors, compliance officers, executives, and legal teams with
 * comprehensive visibility into certification activities, compliance status, and audit trails.
 *
 * Design tokens: blue (primary), emerald (secondary), slate (neutral)
 * Typography: Inter (heading & body), JetBrains Mono (mono)
 */
export function ComplianceDashboard({
  auditLogs,
  complianceMetrics,
  complianceReports,
  pendingVerifications,
  onViewAuditDetails,
  onFilterAuditLogs,
  onSearchAuditLogs,
  onGenerateReport,
  onDownloadReport,
  onVerifyCertification,
  onViewDocument,
  onExportAuditTrail,
  onViewTeamCompliance,
}: ComplianceAuditProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
                Compliance & Audit
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg mt-1">
                Comprehensive visibility into certification activities and
                regulatory compliance
              </p>
            </div>
          </div>
        </div>

        {/* Compliance Metrics Overview */}
        <ComplianceMetricsOverview
          metrics={complianceMetrics}
          onViewTeamCompliance={onViewTeamCompliance}
        />

        {/* Three-column layout for activity, deadlines, and verification */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecentActivityFeed
            auditLogs={auditLogs.slice(0, 10)}
            recentActivity={complianceMetrics.recentActivity}
            onViewDetails={onViewAuditDetails}
          />

          <UpcomingDeadlines expiringSoon={complianceMetrics.expiringSoon} />

          <VerificationQueue
            pendingVerifications={pendingVerifications}
            onVerify={onVerifyCertification}
            onViewDocument={onViewDocument}
          />
        </div>

        {/* Reports Section */}
        <ReportsSection
          reports={complianceReports}
          onGenerateReport={onGenerateReport}
          onDownloadReport={onDownloadReport}
          onExportAuditTrail={onExportAuditTrail}
        />

        {/* Audit Trail Table */}
        <AuditTrailTable
          auditLogs={auditLogs}
          onViewDetails={onViewAuditDetails}
          onFilter={onFilterAuditLogs}
          onSearch={onSearchAuditLogs}
        />
      </div>
    </div>
  )
}

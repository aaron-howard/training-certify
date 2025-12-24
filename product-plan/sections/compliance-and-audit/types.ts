// =============================================================================
// Data Types
// =============================================================================

export interface AuditLogPerformedBy {
  userId: string
  name: string
  email: string
  role: string
}

export interface AuditLogAffectedResource {
  type: 'userCertification' | 'certificationRequirement' | 'user' | 'team'
  id: string
  name: string
  userId?: string
  teamId?: string
}

export interface AuditLog {
  id: string
  timestamp: string
  action: 'upload' | 'renewal' | 'deletion' | 'verification' | 'assignment' | 'expiration' | 'update'
  performedBy: AuditLogPerformedBy
  affectedResource: AuditLogAffectedResource
  details: string
}

export interface ComplianceByTeam {
  teamId: string
  teamName: string
  compliancePercentage: number
}

export interface ComplianceMetrics {
  overallCompliancePercentage: number
  trend: 'up' | 'down' | 'stable'
  totalCertifications: number
  verifiedCertifications: number
  pendingVerifications: number
  expiringSoon: {
    next30Days: number
    next60Days: number
    next90Days: number
  }
  recentActivity: {
    last7Days: number
    last30Days: number
    last90Days: number
  }
  complianceByTeam: ComplianceByTeam[]
}

export interface ComplianceReportGeneratedBy {
  userId: string
  name: string
  email: string
}

export interface ComplianceReportDateRange {
  start: string
  end: string
}

export interface ComplianceReport {
  id: string
  title: string
  type: 'audit-trail-export' | 'certification-status' | 'compliance-summary'
  generatedDate: string | null
  generatedBy: ComplianceReportGeneratedBy
  dateRange: ComplianceReportDateRange | null
  status: 'pending' | 'generating' | 'completed' | 'failed'
  downloadUrl: string | null
  fileSize: string | null
}

export interface PendingVerification {
  id: string
  userId: string
  userName: string
  certificationName: string
  uploadedDate: string
  documentUrl: string
  status: 'pending-verification' | 'verified' | 'rejected'
}

// =============================================================================
// Component Props
// =============================================================================

export interface ComplianceAuditProps {
  /** Complete audit log of all certification-related activities */
  auditLogs: AuditLog[]
  /** Organization-wide compliance metrics and status */
  complianceMetrics: ComplianceMetrics
  /** Generated and pending compliance reports */
  complianceReports: ComplianceReport[]
  /** Certifications pending verification */
  pendingVerifications: PendingVerification[]

  /** Called when user wants to view details of an audit log entry */
  onViewAuditDetails?: (auditLogId: string) => void
  /** Called when user wants to filter audit logs by criteria */
  onFilterAuditLogs?: (filters: {
    userId?: string
    dateRange?: { start: string; end: string }
    actionType?: string
    certificationId?: string
  }) => void
  /** Called when user wants to search audit logs */
  onSearchAuditLogs?: (searchTerm: string) => void
  /** Called when user wants to generate a new compliance report */
  onGenerateReport?: (reportType: 'audit-trail-export' | 'certification-status' | 'compliance-summary', dateRange?: ComplianceReportDateRange) => void
  /** Called when user wants to download a completed report */
  onDownloadReport?: (reportId: string) => void
  /** Called when user wants to verify a certification */
  onVerifyCertification?: (certificationId: string, approved: boolean) => void
  /** Called when user wants to view certification document */
  onViewDocument?: (documentUrl: string) => void
  /** Called when user wants to export audit trail for a specific date range */
  onExportAuditTrail?: (dateRange: ComplianceReportDateRange, format: 'pdf' | 'csv') => void
  /** Called when user wants to view compliance details for a specific team */
  onViewTeamCompliance?: (teamId: string) => void
}

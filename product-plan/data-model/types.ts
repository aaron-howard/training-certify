/**
 * Training-Certify Global Data Model
 *
 * This file contains TypeScript interfaces for all core entities in the
 * Training-Certify platform. These types are shared across all sections.
 */

// =============================================================================
// Core Entities
// =============================================================================

/**
 * User - Individual employees who need certifications tracked
 * Can have roles like User, Manager, Executive, or Auditor
 */
export interface User {
  id: string
  name: string
  email: string
  role:
    | 'Developer'
    | 'Manager'
    | 'Architect'
    | 'SRE'
    | 'Security Engineer'
    | 'PM'
    | 'Executive'
    | 'Auditor'
  teamIds: Array<string>
  avatarUrl: string | null
}

/**
 * Certification - A specific certification from the catalog
 * Includes metadata like vendor, renewal cycle, difficulty, etc.
 */
export interface Certification {
  id: string
  name: string
  vendorId: string
  vendorName: string
  vendorLogo: string
  category: 'Cloud' | 'Security' | 'Networking' | 'Data' | 'Project Management'
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  validityPeriod: string
  renewalCycle: number // in months
  intendedAudience: Array<string>
  description: string
  prerequisites: {
    required: Array<string>
    recommended: Array<string>
  }
  examInfo: {
    format: string
    duration: string
    numberOfQuestions: string
    passingScore: string
    cost: string
  }
  renewalRequirements: {
    cycle: string
    options: Array<string>
  }
  holderCount: number
}

/**
 * UserCertification - A user's acquired certification
 * Tracks expiration, status, and verification
 */
export interface UserCertification {
  id: string
  userId: string
  certificationId: string
  certificationName: string
  vendorName: string
  certificationNumber: string
  issueDate: string
  expirationDate: string | null
  status: 'active' | 'expiring' | 'expiring-soon' | 'expired'
  daysUntilExpiration: number | null
  documentUrl: string
  verifiedAt: string
}

/**
 * Team - Groups of users for competency tracking and workforce management
 * Users can belong to multiple teams
 */
export interface Team {
  id: string
  name: string
  description: string
  memberCount: number
  managerId: string
}

/**
 * Vendor - Certification issuing bodies
 * E.g., AWS, Microsoft, (ISC)², ITIL, CompTIA, PMI, etc.
 */
export interface Vendor {
  id: string
  name: string
  logo: string
  certificationCount: number
}

/**
 * AuditLog - Timestamped record of all actions
 * For compliance tracking and regulatory requirements
 */
export interface AuditLog {
  id: string
  timestamp: string
  action:
    | 'upload'
    | 'renewal'
    | 'deletion'
    | 'verification'
    | 'assignment'
    | 'expiration'
    | 'update'
  performedBy: {
    userId: string
    name: string
    email: string
    role: string
  }
  affectedResource: {
    type: 'userCertification' | 'certificationRequirement' | 'user' | 'team'
    id: string
    name: string
    userId?: string
    teamId?: string
  }
  details: string
}

/**
 * Notification - Renewal reminders and expiration alerts
 * Sent at configurable intervals based on expiration dates
 */
export interface Notification {
  id: string
  userId: string
  userName: string
  type:
    | 'expiration-alert'
    | 'renewal-reminder'
    | 'team-member-alert'
    | 'compliance-warning'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  timestamp: string
  isRead: boolean
  isDismissed: boolean
  // Optional fields for certification-related notifications
  certificationName?: string
  certificationId?: string
  userCertificationId?: string
  expirationDate?: string
  daysUntilExpiration?: number
  // Optional fields for team-related notifications
  teamMemberName?: string
  teamName?: string
  expiringCount?: number
  complianceRate?: number
}

// =============================================================================
// Supporting Types
// =============================================================================

/**
 * Team-level metrics for dashboard and analytics
 */
export interface TeamMetrics {
  teamId: string
  coveragePercentage: number
  totalRequired: number
  totalAcquired: number
  expiringIn30Days: number
  expiringIn60Days: number
  expiringIn90Days: number
  expired: number
  gapCount: number
  topGaps: Array<string>
}

/**
 * Certification requirements for specific roles or teams
 */
export interface CertificationRequirement {
  id: string
  teamId: string
  role: string
  certificationId: string
  priority: 'required' | 'recommended'
  dueDate: string | null
}

/**
 * Compliance metrics for organization-wide status
 */
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
  complianceByTeam: Array<{
    teamId: string
    teamName: string
    compliancePercentage: number
  }>
}

/**
 * Notification settings and preferences per user
 */
export interface NotificationSettings {
  userId: string
  frequency: {
    firstAlert: number
    secondAlert: number
    thirdAlert: number
    finalAlert: number
  }
  channels: {
    inApp: boolean
    email: boolean
    sms: boolean
  }
  preferences: {
    teamAlerts: boolean
    complianceWarnings: boolean
    digestEnabled: boolean
    digestFrequency: 'daily' | 'weekly' | 'monthly'
  }
}

/**
 * Workforce planning insights and recommendations
 */
export interface WorkforcePlanningInsight {
  teamId: string
  projectedGaps: Array<{
    certificationId: string
    reason: string
    impactLevel: 'low' | 'medium' | 'high'
    projectedDate: string
  }>
  hiringRecommendations: Array<{
    role: string
    certifications: Array<string>
    rationale: string
    priority: 'low' | 'medium' | 'high'
  }>
  trainingPriorities: Array<{
    certificationId: string
    targetEmployees: Array<string>
    estimatedCost: number
    estimatedDuration: number
    priority: 'low' | 'medium' | 'high'
  }>
}

/**
 * Compliance reports for audit and regulatory purposes
 */
export interface ComplianceReport {
  id: string
  title: string
  type: 'audit-trail-export' | 'certification-status' | 'compliance-summary'
  generatedDate: string | null
  generatedBy: {
    userId: string
    name: string
    email: string
  }
  dateRange: {
    start: string
    end: string
  } | null
  status: 'pending' | 'generating' | 'completed' | 'failed'
  downloadUrl: string | null
  fileSize: string | null
}

/**
 * Certifications pending verification by managers or admins
 */
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
// Type Aliases
// =============================================================================

export type CertificationStatus =
  | 'active'
  | 'expiring'
  | 'expiring-soon'
  | 'expired'
export type NotificationType =
  | 'expiration-alert'
  | 'renewal-reminder'
  | 'team-member-alert'
  | 'compliance-warning'
export type NotificationSeverity = 'critical' | 'warning' | 'info'
export type AuditAction =
  | 'upload'
  | 'renewal'
  | 'deletion'
  | 'verification'
  | 'assignment'
  | 'expiration'
  | 'update'
export type UserRole =
  | 'Developer'
  | 'Manager'
  | 'Architect'
  | 'SRE'
  | 'Security Engineer'
  | 'PM'
  | 'Executive'
  | 'Auditor'
export type CertificationCategory =
  | 'Cloud'
  | 'Security'
  | 'Networking'
  | 'Data'
  | 'Project Management'
export type CertificationDifficulty =
  | 'Beginner'
  | 'Intermediate'
  | 'Advanced'
  | 'Expert'
export type Priority = 'low' | 'medium' | 'high'
export type RequirementPriority = 'required' | 'recommended'
export type Trend = 'up' | 'down' | 'stable'

// =============================================================================
// Data Types
// =============================================================================

export interface Team {
  id: string
  name: string
  description: string
  memberCount: number
  managerId: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'Developer' | 'Manager' | 'Architect' | 'SRE' | 'Security Engineer' | 'PM' | 'Executive' | 'Auditor'
  teamIds: Array<string>
  avatarUrl: string | null
}

export interface Certification {
  id: string
  name: string
  vendor: string
  renewalCycle: number
  audience: Array<string>
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
}

export interface UserCertification {
  id: string
  userId: string
  certificationId: string
  issueDate: string
  expirationDate: string | null
  status: 'active' | 'expiring-soon' | 'expired'
  daysUntilExpiration: number | null
}

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

export interface CertificationRequirement {
  id: string
  teamId: string
  role: string
  certificationId: string
  priority: 'required' | 'recommended'
  dueDate: string | null
}

export interface ProjectedGap {
  certificationId: string
  reason: string
  impactLevel: 'low' | 'medium' | 'high'
  projectedDate: string
}

export interface HiringRecommendation {
  role: string
  certifications: Array<string>
  rationale: string
  priority: 'low' | 'medium' | 'high'
}

export interface TrainingPriority {
  certificationId: string
  targetEmployees: Array<string>
  estimatedCost: number
  estimatedDuration: number
  priority: 'low' | 'medium' | 'high'
}

export interface WorkforcePlanningInsight {
  teamId: string
  projectedGaps: Array<ProjectedGap>
  hiringRecommendations: Array<HiringRecommendation>
  trainingPriorities: Array<TrainingPriority>
}

// =============================================================================
// Component Props
// =============================================================================

export interface TeamWorkforceManagementProps {
  /** List of teams in the organization */
  teams: Array<Team>
  /** All users in the organization */
  users: Array<User>
  /** All user certifications */
  userCertifications: Array<UserCertification>
  /** Certification catalog */
  certifications: Array<Certification>
  /** Team-level metrics for dashboard */
  teamMetrics: Array<TeamMetrics>
  /** Certification requirements by team and role */
  certificationRequirements: Array<CertificationRequirement>
  /** Workforce planning insights and recommendations */
  workforcePlanningInsights: Array<WorkforcePlanningInsight>

  /** Called when user wants to view detailed team information */
  onViewTeamDetails?: (teamId: string) => void
  /** Called when user wants to compare multiple teams */
  onCompareTeams?: (teamIds: Array<string>) => void
  /** Called when user wants to view workforce planning for a team */
  onViewWorkforcePlanning?: (teamId: string) => void
  /** Called when user wants to set certification requirements for a role/team */
  onSetRequirement?: (requirement: Partial<CertificationRequirement>) => void
  /** Called when user wants to edit an existing requirement */
  onEditRequirement?: (requirementId: string) => void
  /** Called when user wants to delete a requirement */
  onDeleteRequirement?: (requirementId: string) => void
  /** Called when user wants to view an individual user's certification details */
  onViewUserCertifications?: (userId: string) => void
  /** Called when user wants to export team competency report */
  onExportReport?: (teamId: string) => void
  /** Called when user wants to run scenario modeling */
  onRunScenarioModel?: (teamId: string, scenario: string) => void
}

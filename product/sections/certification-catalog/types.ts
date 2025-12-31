// =============================================================================
// Data Types
// =============================================================================

export interface ExamInfo {
  format: string
  duration: string
  numberOfQuestions: string
  passingScore: string
  cost: string
}

export interface Prerequisites {
  required: Array<string>
  recommended: Array<string>
}

export interface RenewalRequirements {
  cycle: string
  options: Array<string>
}

export interface Certification {
  id: string
  name: string
  vendorId: string
  vendorName: string
  vendorLogo: string
  category: 'Cloud' | 'Security' | 'Networking' | 'Data' | 'Project Management'
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  validityPeriod: string
  intendedAudience: Array<string>
  description: string
  prerequisites: Prerequisites
  examInfo: ExamInfo
  renewalRequirements: RenewalRequirements
  holderCount: number
}

export interface Vendor {
  id: string
  name: string
  logo: string
  certificationCount: number
}

// =============================================================================
// Component Props
// =============================================================================

export interface CertificationCatalogProps {
  /** The list of certifications to display in the catalog */
  certifications: Array<Certification>
  /** Optional list of vendors for filtering */
  vendors?: Array<Vendor>
  /** Called when user clicks to view full certification details */
  onViewDetails?: (certificationId: string) => void
  /** Called when user wants to add a certification to their profile */
  onAddToProfile?: (certificationId: string) => void
  /** Called when user marks a certification as a goal/interested */
  onMarkAsGoal?: (certificationId: string) => void
  /** Called when user wants to see which team members hold this certification */
  onViewHolders?: (certificationId: string) => void
  /** Called when user searches for certifications by keyword */
  onSearch?: (searchTerm: string) => void
  /** Called when user applies filters (vendor, category, difficulty) */
  onFilter?: (filters: {
    vendor?: string
    category?: 'Cloud' | 'Security' | 'Networking' | 'Data' | 'Project Management'
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  }) => void
}

export interface CertificationDetailProps {
  /** The certification to display in detail */
  certification: Certification
  /** Called when user wants to go back to the catalog */
  onBack?: () => void
  /** Called when user wants to add this certification to their profile */
  onAddToProfile?: (certificationId: string) => void
  /** Called when user marks this certification as a goal/interested */
  onMarkAsGoal?: (certificationId: string) => void
  /** Called when user wants to see which team members hold this certification */
  onViewHolders?: (certificationId: string) => void
}

// =============================================================================
// Data Types
// =============================================================================

/**
 * Status of a user's certification based on expiration date
 */
export type CertificationStatus = 'active' | 'expiring' | 'expired'

/**
 * A certification that a user has obtained and is tracking
 */
export interface UserCertification {
  /** Unique identifier for this user certification record */
  id: string
  /** Reference to the certification in the catalog */
  certificationId: string
  /** Display name of the certification */
  certificationName: string
  /** Name of the vendor/issuing organization */
  vendorName: string
  /** The user's unique certification number from the vendor */
  certificationNumber: string
  /** Date the certification was issued (ISO 8601 format) */
  issueDate: string
  /** Date the certification expires (ISO 8601 format) */
  expirationDate: string
  /** Current status based on expiration date */
  status: CertificationStatus
  /** URL or path to the uploaded certification document */
  documentUrl: string
  /** Timestamp when the certification was verified (ISO 8601 format) */
  verifiedAt: string
}

/**
 * Data structure for creating or updating a certification
 */
export interface CertificationFormData {
  certificationName: string
  vendorName: string
  certificationNumber: string
  issueDate: string
  expirationDate: string
  document?: File
}

// =============================================================================
// Component Props
// =============================================================================

/**
 * Props for the Certification Management component
 */
export interface CertificationManagementProps {
  /** The list of user certifications to display */
  userCertifications: UserCertification[]
  /** Called when user wants to add a new certification */
  onCreate?: (data: CertificationFormData) => void
  /** Called when user wants to edit a certification */
  onEdit?: (id: string, data: CertificationFormData) => void
  /** Called when user wants to delete a certification */
  onDelete?: (id: string) => void
  /** Called when user wants to view certification details */
  onView?: (id: string) => void
  /** Called when user searches for certifications */
  onSearch?: (query: string) => void
  /** Called when user filters by status */
  onFilterByStatus?: (status: CertificationStatus | 'all') => void
}

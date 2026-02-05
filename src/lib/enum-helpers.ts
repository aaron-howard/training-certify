/**
 * Helper functions for validating and mapping enum values.
 * These functions ensure that string values from CSV files or API inputs
 * match the expected enum types defined in the database schema.
 */

// Category enum values
const VALID_CATEGORIES = [
  'AI',
  'AppDynamics',
  'Business Applications',
  'Channel/Partner',
  'Cloud',
  'Collaboration',
  'Cybersecurity',
  'Data',
  'Data Center',
  'Design',
  'DevNet',
  'DevOps',
  'Dynamics 365',
  'Enterprise',
  'Field Technician',
  'IT',
  'Meraki',
  'Modern Workplace',
  'Networking',
  'Power Platform',
  'Project Management',
  'Security',
  'Service Provider',
  'Support Technician',
] as const

// Difficulty enum values
const VALID_DIFFICULTIES = [
  'Advanced',
  'Associate',
  'Beginner',
  'Cybersecurity',
  'Expert',
  'Financial App',
  'Information Technology',
  'Intermediate',
  'IT Finance',
  'Networking',
  'Professional',
  'Project Management',
  'ServiceNow',
  'ServiceNow*',
  'Software and Quality',
  'Virtualization',
] as const

// Role enum values
const VALID_ROLES = ['Admin', 'User', 'Manager', 'Executive', 'Auditor'] as const

export type CertificationCategory = (typeof VALID_CATEGORIES)[number]
export type CertificationDifficulty = (typeof VALID_DIFFICULTIES)[number]
export type UserRole = (typeof VALID_ROLES)[number]

/**
 * Validates and returns a valid category enum value, or undefined if invalid.
 * Falls back to 'Cloud' if the value doesn't match any enum.
 */
export function validateCategory(
  value: string | null | undefined,
): CertificationCategory | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (VALID_CATEGORIES.includes(trimmed as CertificationCategory)) {
    return trimmed as CertificationCategory
  }
  // Fallback to Cloud for unknown categories
  console.warn(`⚠️  Unknown category "${value}", defaulting to "Cloud"`)
  return 'Cloud'
}

/**
 * Validates and returns a valid difficulty enum value, or undefined if invalid.
 * Falls back to 'Intermediate' if the value doesn't match any enum.
 */
export function validateDifficulty(
  value: string | null | undefined,
): CertificationDifficulty | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (VALID_DIFFICULTIES.includes(trimmed as CertificationDifficulty)) {
    return trimmed as CertificationDifficulty
  }
  // Fallback to Intermediate for unknown difficulties
  console.warn(`⚠️  Unknown difficulty "${value}", defaulting to "Intermediate"`)
  return 'Intermediate'
}

/**
 * Validates and returns a valid role enum value, or undefined if invalid.
 */
export function validateRole(value: string | null | undefined): UserRole | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (VALID_ROLES.includes(trimmed as UserRole)) {
    return trimmed as UserRole
  }
  console.warn(`⚠️  Unknown role "${value}"`)
  return undefined
}

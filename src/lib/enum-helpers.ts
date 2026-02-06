/**
 * Helper functions for validating and mapping enum values.
 * These functions ensure that string values from CSV files or API inputs
 * match the expected enum types defined in the database schema.
 */

import { logger } from './logging.server'

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
const VALID_ROLES = [
  'Admin',
  'User',
  'Manager',
  'Executive',
  'Auditor',
] as const

export type CertificationCategory = (typeof VALID_CATEGORIES)[number]
export type CertificationDifficulty = (typeof VALID_DIFFICULTIES)[number]
export type UserRole = (typeof VALID_ROLES)[number]

/**
 * Validates and returns a valid certification category enum value.
 *
 * Checks if the provided value matches one of the valid certification categories.
 * If the value is invalid or null/undefined, returns undefined. If the value doesn't
 * match any known category, logs a warning and defaults to 'Cloud'.
 *
 * @param value - String value to validate (from CSV, API input, etc.)
 * @returns Valid CertificationCategory enum value, or undefined if value is null/undefined
 * @returns 'Cloud' as fallback if value doesn't match any valid category (with warning)
 *
 * @example
 * ```typescript
 * const category = validateCategory('Cybersecurity') // Returns 'Cybersecurity'
 * const invalid = validateCategory('Unknown') // Returns 'Cloud' with warning
 * ```
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
  logger.warn(
    { category: value },
    `Unknown category "${value}", defaulting to "Cloud"`,
  )
  return 'Cloud'
}

/**
 * Validates and returns a valid certification difficulty enum value.
 *
 * Checks if the provided value matches one of the valid difficulty levels.
 * If the value is invalid or null/undefined, returns undefined. If the value doesn't
 * match any known difficulty, logs a warning and defaults to 'Intermediate'.
 *
 * @param value - String value to validate (from CSV, API input, etc.)
 * @returns Valid CertificationDifficulty enum value, or undefined if value is null/undefined
 * @returns 'Intermediate' as fallback if value doesn't match any valid difficulty (with warning)
 *
 * @example
 * ```typescript
 * const difficulty = validateDifficulty('Advanced') // Returns 'Advanced'
 * const invalid = validateDifficulty('Hard') // Returns 'Intermediate' with warning
 * ```
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
  logger.warn(
    { difficulty: value },
    `Unknown difficulty "${value}", defaulting to "Intermediate"`,
  )
  return 'Intermediate'
}

/**
 * Validates and returns a valid user role enum value.
 *
 * Checks if the provided value matches one of the valid user roles.
 * Returns undefined if the value is null, undefined, or doesn't match any valid role.
 * Logs a warning for invalid values.
 *
 * @param value - String value to validate (from CSV, API input, etc.)
 * @returns Valid UserRole enum value, or undefined if value is invalid/null/undefined
 *
 * @example
 * ```typescript
 * const role = validateRole('Admin') // Returns 'Admin'
 * const invalid = validateRole('SuperAdmin') // Returns undefined with warning
 * ```
 */
export function validateRole(
  value: string | null | undefined,
): UserRole | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (VALID_ROLES.includes(trimmed as UserRole)) {
    return trimmed as UserRole
  }
  logger.warn({ role: value }, `Unknown role "${value}"`)
  return undefined
}

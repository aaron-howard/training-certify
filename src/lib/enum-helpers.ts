/**
 * Helper functions for validating and mapping enum values.
 * These functions ensure that string values from CSV files or API inputs
 * match the expected enum types defined in the database schema.
 */

import { logger } from './logging.server'
import { isAppUserRole } from './roles'
import type { AppUserRole } from './roles'

// Category enum values (normalized domain areas)
const VALID_CATEGORIES = [
  'AI & Machine Learning',
  'Business Applications',
  'Cloud',
  'Collaboration',
  'Data & Analytics',
  'Database',
  'DevOps',
  'Governance & Compliance',
  'Infrastructure',
  'IT Service Management',
  'Networking',
  'Operating Systems',
  'Project Management',
  'Security',
  'Software Development',
] as const

// Difficulty enum values (normalized skill levels)
const VALID_DIFFICULTIES = [
  'Foundational',
  'Associate',
  'Professional',
  'Expert',
] as const

export type CertificationCategory = (typeof VALID_CATEGORIES)[number]
export type CertificationDifficulty = (typeof VALID_DIFFICULTIES)[number]
/** @deprecated Prefer importing `AppUserRole` from `./roles`. */
export type UserRole = AppUserRole

/**
 * Maps legacy/non-standard category values to the normalized categories.
 * Used during migration and CSV ingestion.
 */
const CATEGORY_ALIASES: Partial<Record<string, CertificationCategory>> = {
  // Direct matches (case-insensitive handled separately)
  ai: 'AI & Machine Learning',
  'artificial intelligence': 'AI & Machine Learning',
  'machine learning': 'AI & Machine Learning',
  ml: 'AI & Machine Learning',
  appdynamics: 'DevOps',
  'business applications': 'Business Applications',
  'channel/partner': 'Business Applications',
  cloud: 'Cloud',
  collaboration: 'Collaboration',
  'modern workplace': 'Collaboration',
  cybersecurity: 'Security',
  data: 'Data & Analytics',
  'data & analytics': 'Data & Analytics',
  analytics: 'Data & Analytics',
  database: 'Database',
  'data center': 'Infrastructure',
  design: 'Software Development',
  devnet: 'DevOps',
  devops: 'DevOps',
  'dynamics 365': 'Business Applications',
  enterprise: 'Infrastructure',
  'field technician': 'Infrastructure',
  it: 'IT Service Management',
  'it service management': 'IT Service Management',
  itsm: 'IT Service Management',
  meraki: 'Networking',
  networking: 'Networking',
  'operating systems': 'Operating Systems',
  'power platform': 'Business Applications',
  'project management': 'Project Management',
  security: 'Security',
  'service provider': 'Networking',
  'support technician': 'IT Service Management',
  'software development': 'Software Development',
  development: 'Software Development',
  programming: 'Software Development',
  'governance & compliance': 'Governance & Compliance',
  governance: 'Governance & Compliance',
  compliance: 'Governance & Compliance',
  audit: 'Governance & Compliance',
  infrastructure: 'Infrastructure',
  virtualization: 'Infrastructure',
  'information technology': 'IT Service Management',
}

/**
 * Maps legacy/non-standard difficulty values to normalized levels.
 * Used during migration and CSV ingestion.
 */
const DIFFICULTY_ALIASES: Partial<Record<string, CertificationDifficulty>> = {
  foundational: 'Foundational',
  fundamental: 'Foundational',
  fundamentals: 'Foundational',
  beginner: 'Foundational',
  entry: 'Foundational',
  associate: 'Associate',
  intermediate: 'Associate',
  professional: 'Professional',
  advanced: 'Professional',
  specialist: 'Professional',
  expert: 'Expert',
  // Legacy junk values that were categories, not difficulties
  cybersecurity: 'Professional',
  'financial app': 'Professional',
  'information technology': 'Associate',
  'it finance': 'Professional',
  networking: 'Associate',
  'project management': 'Professional',
  servicenow: 'Associate',
  'servicenow*': 'Associate',
  'software and quality': 'Associate',
  virtualization: 'Professional',
}

/**
 * Validates and returns a valid certification category enum value.
 *
 * Checks if the provided value matches one of the valid certification categories
 * or a known alias. Returns 'Cloud' as fallback for unknown values.
 *
 * @param value - String value to validate (from CSV, API input, etc.)
 * @returns Valid CertificationCategory enum value, or undefined if value is null/undefined
 *
 * @example
 * ```typescript
 * validateCategory('Security')       // Returns 'Security'
 * validateCategory('Cybersecurity')  // Returns 'Security' (alias)
 * validateCategory('Unknown')        // Returns 'Cloud' with warning
 * ```
 */
export function validateCategory(
  value: string | null | undefined,
): CertificationCategory | undefined {
  if (!value) return undefined
  const trimmed = value.trim()

  // Direct match
  if (VALID_CATEGORIES.includes(trimmed as CertificationCategory)) {
    return trimmed as CertificationCategory
  }

  // Alias match (case-insensitive)
  const alias = CATEGORY_ALIASES[trimmed.toLowerCase()]
  if (alias) return alias

  // Fallback
  logger.warn(
    { category: value },
    `Unknown category "${value}", defaulting to "Cloud"`,
  )
  return 'Cloud'
}

/**
 * Validates and returns a valid certification difficulty enum value.
 *
 * Checks if the provided value matches one of the valid difficulty levels
 * or a known alias. Returns 'Associate' as fallback for unknown values.
 *
 * @param value - String value to validate (from CSV, API input, etc.)
 * @returns Valid CertificationDifficulty enum value, or undefined if value is null/undefined
 *
 * @example
 * ```typescript
 * validateDifficulty('Expert')       // Returns 'Expert'
 * validateDifficulty('Beginner')     // Returns 'Foundational' (alias)
 * validateDifficulty('Unknown')      // Returns 'Associate' with warning
 * ```
 */
export function validateDifficulty(
  value: string | null | undefined,
): CertificationDifficulty | undefined {
  if (!value) return undefined
  const trimmed = value.trim()

  // Direct match
  if (VALID_DIFFICULTIES.includes(trimmed as CertificationDifficulty)) {
    return trimmed as CertificationDifficulty
  }

  // Alias match (case-insensitive)
  const alias = DIFFICULTY_ALIASES[trimmed.toLowerCase()]
  if (alias) return alias

  // Fallback
  logger.warn(
    { difficulty: value },
    `Unknown difficulty "${value}", defaulting to "Associate"`,
  )
  return 'Associate'
}

/**
 * Validates and returns a valid user role enum value.
 *
 * @param value - String value to validate (from CSV, API input, etc.)
 * @returns Valid UserRole enum value, or undefined if value is invalid/null/undefined
 */
export function validateRole(
  value: string | null | undefined,
): UserRole | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (isAppUserRole(trimmed)) {
    return trimmed
  }
  logger.warn({ role: value }, `Unknown role "${value}"`)
  return undefined
}

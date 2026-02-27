/**
 * Unit tests for enum-helpers (validateCategory, validateDifficulty, validateRole)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  validateCategory,
  validateDifficulty,
  validateRole,
} from '../enum-helpers'

vi.mock('../logging.server', () => ({
  logger: {
    warn: vi.fn(),
  },
}))

describe('enum-helpers.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateCategory', () => {
    it('returns value for direct match', () => {
      expect(validateCategory('Cloud')).toBe('Cloud')
      expect(validateCategory('Security')).toBe('Security')
      expect(validateCategory('AI & Machine Learning')).toBe(
        'AI & Machine Learning',
      )
    })

    it('returns mapped value for alias (case-insensitive)', () => {
      expect(validateCategory('cybersecurity')).toBe('Security')
      expect(validateCategory('devops')).toBe('DevOps')
      expect(validateCategory('Machine Learning')).toBe('AI & Machine Learning')
    })

    it('returns Cloud for unknown value and logs warning', async () => {
      const result = validateCategory('UnknownCategory')
      expect(result).toBe('Cloud')
      const { logger } = await import('../logging.server')
      expect(logger.warn).toHaveBeenCalledWith(
        { category: 'UnknownCategory' },
        expect.stringContaining('Unknown category'),
      )
    })

    it('returns undefined for null, undefined, empty string', () => {
      expect(validateCategory(null)).toBeUndefined()
      expect(validateCategory(undefined)).toBeUndefined()
      expect(validateCategory('')).toBeUndefined()
    })

    it('trims whitespace before matching', () => {
      expect(validateCategory('  Cloud  ')).toBe('Cloud')
    })
  })

  describe('validateDifficulty', () => {
    it('returns value for direct match', () => {
      expect(validateDifficulty('Foundational')).toBe('Foundational')
      expect(validateDifficulty('Expert')).toBe('Expert')
      expect(validateDifficulty('Associate')).toBe('Associate')
    })

    it('returns mapped value for alias', () => {
      expect(validateDifficulty('beginner')).toBe('Foundational')
      expect(validateDifficulty('intermediate')).toBe('Associate')
      expect(validateDifficulty('advanced')).toBe('Professional')
    })

    it('returns Associate for unknown value and logs warning', async () => {
      const result = validateDifficulty('UnknownLevel')
      expect(result).toBe('Associate')
      const { logger } = await import('../logging.server')
      expect(logger.warn).toHaveBeenCalledWith(
        { difficulty: 'UnknownLevel' },
        expect.stringContaining('Unknown difficulty'),
      )
    })

    it('returns undefined for null, undefined, empty string', () => {
      expect(validateDifficulty(null)).toBeUndefined()
      expect(validateDifficulty(undefined)).toBeUndefined()
      expect(validateDifficulty('')).toBeUndefined()
    })
  })

  describe('validateRole', () => {
    it('returns value for valid role', () => {
      expect(validateRole('Admin')).toBe('Admin')
      expect(validateRole('User')).toBe('User')
      expect(validateRole('Manager')).toBe('Manager')
      expect(validateRole('Executive')).toBe('Executive')
      expect(validateRole('Auditor')).toBe('Auditor')
    })

    it('returns undefined for invalid role and logs warning', async () => {
      expect(validateRole('SuperAdmin')).toBeUndefined()
      const { logger } = await import('../logging.server')
      expect(logger.warn).toHaveBeenCalledWith(
        { role: 'SuperAdmin' },
        expect.stringContaining('Unknown role'),
      )
    })

    it('returns undefined for null, undefined, empty string', () => {
      expect(validateRole(null)).toBeUndefined()
      expect(validateRole(undefined)).toBeUndefined()
      expect(validateRole('')).toBeUndefined()
    })

    it('trims whitespace before matching', () => {
      expect(validateRole('  Admin  ')).toBe('Admin')
    })
  })
})

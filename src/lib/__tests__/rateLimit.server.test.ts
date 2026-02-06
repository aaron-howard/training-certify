/**
 * Unit tests for rateLimit.server.ts
 * Tests rate limiting functionality
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  RateLimitPresets,
  rateLimiter,
  requireRateLimit,
} from '../rateLimit.server'

describe('rateLimit.server.ts', () => {
  beforeEach(() => {
    rateLimiter.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('RateLimiter.check', () => {
    it('should allow requests within limit', async () => {
      const config = { windowMs: 60000, maxRequests: 5 }

      expect(await rateLimiter.check('user1', config)).toBe(true)
      expect(await rateLimiter.check('user1', config)).toBe(true)
      expect(await rateLimiter.check('user1', config)).toBe(true)
    })

    it('should block requests exceeding limit', async () => {
      const config = { windowMs: 60000, maxRequests: 3 }

      expect(await rateLimiter.check('user1', config)).toBe(true)
      expect(await rateLimiter.check('user1', config)).toBe(true)
      expect(await rateLimiter.check('user1', config)).toBe(true)
      expect(await rateLimiter.check('user1', config)).toBe(false)
      expect(await rateLimiter.check('user1', config)).toBe(false)
    })

    it('should reset after time window', async () => {
      const config = { windowMs: 60000, maxRequests: 2 }

      expect(await rateLimiter.check('user1', config)).toBe(true)
      expect(await rateLimiter.check('user1', config)).toBe(true)
      expect(await rateLimiter.check('user1', config)).toBe(false)

      // Advance time past window
      vi.advanceTimersByTime(61000)

      expect(await rateLimiter.check('user1', config)).toBe(true)
    })

    it('should handle multiple identifiers independently', async () => {
      const config = { windowMs: 60000, maxRequests: 2 }

      expect(await rateLimiter.check('user1', config)).toBe(true)
      expect(await rateLimiter.check('user1', config)).toBe(true)
      expect(await rateLimiter.check('user1', config)).toBe(false)

      // Different user should have separate limit
      expect(await rateLimiter.check('user2', config)).toBe(true)
      expect(await rateLimiter.check('user2', config)).toBe(true)
      expect(await rateLimiter.check('user2', config)).toBe(false)
    })

    it('should clean up old timestamps', async () => {
      const config = { windowMs: 60000, maxRequests: 3 }

      await rateLimiter.check('user1', config)
      await rateLimiter.check('user1', config)

      // Advance time to trigger cleanup
      vi.advanceTimersByTime(61000)

      // Old timestamps should be cleaned up
      await rateLimiter.check('user1', config)
      expect(await rateLimiter.getRemaining('user1', config)).toBe(2)
    })
  })

  describe('RateLimiter.getRemaining', () => {
    it('should return correct remaining count', async () => {
      const config = { windowMs: 60000, maxRequests: 5 }

      expect(await rateLimiter.getRemaining('user1', config)).toBe(5)

      await rateLimiter.check('user1', config)
      expect(await rateLimiter.getRemaining('user1', config)).toBe(4)

      await rateLimiter.check('user1', config)
      expect(await rateLimiter.getRemaining('user1', config)).toBe(3)
    })

    it('should return max when no requests made', async () => {
      const config = { windowMs: 60000, maxRequests: 10 }

      expect(await rateLimiter.getRemaining('newuser', config)).toBe(10)
    })

    it('should return 0 when limit exceeded', async () => {
      const config = { windowMs: 60000, maxRequests: 2 }

      await rateLimiter.check('user1', config)
      await rateLimiter.check('user1', config)

      expect(await rateLimiter.getRemaining('user1', config)).toBe(0)
    })
  })

  describe('RateLimiter.reset', () => {
    it('should clear rate limit for identifier', async () => {
      const config = { windowMs: 60000, maxRequests: 2 }

      await rateLimiter.check('user1', config)
      await rateLimiter.check('user1', config)
      expect(await rateLimiter.check('user1', config)).toBe(false)

      await rateLimiter.reset('user1')

      expect(await rateLimiter.check('user1', config)).toBe(true)
    })

    it('should not affect other identifiers', async () => {
      const config = { windowMs: 60000, maxRequests: 2 }

      await rateLimiter.check('user1', config)
      await rateLimiter.check('user2', config)

      await rateLimiter.reset('user1')

      expect(await rateLimiter.getRemaining('user1', config)).toBe(2)
      expect(await rateLimiter.getRemaining('user2', config)).toBe(1)
    })
  })

  describe('RateLimiter.clear', () => {
    it('should remove all rate limit data', async () => {
      const config = { windowMs: 60000, maxRequests: 2 }

      await rateLimiter.check('user1', config)
      await rateLimiter.check('user2', config)
      await rateLimiter.check('user3', config)

      rateLimiter.clear()

      expect(await rateLimiter.getRemaining('user1', config)).toBe(2)
      expect(await rateLimiter.getRemaining('user2', config)).toBe(2)
      expect(await rateLimiter.getRemaining('user3', config)).toBe(2)
    })
  })

  describe('requireRateLimit', () => {
    it('should pass when under limit', async () => {
      const config = { windowMs: 60000, maxRequests: 5 }

      await expect(requireRateLimit('user1', config)).resolves.not.toThrow()
      await expect(requireRateLimit('user1', config)).resolves.not.toThrow()
    })

    it('should throw error when limit exceeded', async () => {
      const config = { windowMs: 60000, maxRequests: 2 }

      await requireRateLimit('user1', config)
      await requireRateLimit('user1', config)

      await expect(requireRateLimit('user1', config)).rejects.toThrow(
        'Rate limit exceeded',
      )
    })

    it('should include reset time in error message', async () => {
      const config = { windowMs: 60000, maxRequests: 1 }

      await requireRateLimit('user1', config)

      try {
        await requireRateLimit('user1', config)
        expect.fail('Should have thrown error')
      } catch (error: unknown) {
        const err = error as Error
        expect(err.message).toContain('Reset at:')
        expect(err.message).toContain('Remaining: 0')
      }
    })
  })

  describe('RateLimitPresets', () => {
    it('should have correct AUTH preset', () => {
      expect(RateLimitPresets.AUTH).toEqual({
        windowMs: 60000,
        maxRequests: 5,
      })
    })

    it('should have correct MUTATION preset', () => {
      expect(RateLimitPresets.MUTATION).toEqual({
        windowMs: 60000,
        maxRequests: 30,
      })
    })

    it('should have correct EXPORT preset', () => {
      expect(RateLimitPresets.EXPORT).toEqual({
        windowMs: 60000,
        maxRequests: 5,
      })
    })

    it('should have correct READ preset', () => {
      expect(RateLimitPresets.READ).toEqual({
        windowMs: 60000,
        maxRequests: 100,
      })
    })

    it('should have correct ADMIN preset', () => {
      expect(RateLimitPresets.ADMIN).toEqual({
        windowMs: 60000,
        maxRequests: 50,
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle very short time windows', async () => {
      const config = { windowMs: 100, maxRequests: 2 }

      await rateLimiter.check('user1', config)
      await rateLimiter.check('user1', config)
      expect(await rateLimiter.check('user1', config)).toBe(false)

      vi.advanceTimersByTime(101)
      expect(await rateLimiter.check('user1', config)).toBe(true)
    })

    it('should handle very high request limits', async () => {
      const config = { windowMs: 60000, maxRequests: 1000 }

      for (let i = 0; i < 999; i++) {
        expect(await rateLimiter.check('user1', config)).toBe(true)
      }

      expect(await rateLimiter.getRemaining('user1', config)).toBe(1)
    })

    it('should handle concurrent requests from same identifier', async () => {
      const config = { windowMs: 60000, maxRequests: 5 }

      const results = await Promise.all(
        Array.from({ length: 10 }, () => rateLimiter.check('user1', config)),
      )

      const allowed = results.filter((r) => r).length
      expect(allowed).toBe(5)
    })
  })
})

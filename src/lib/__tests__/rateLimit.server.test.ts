/**
 * Unit tests for rateLimit.server.ts
 * Tests rate limiting functionality
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RateLimitPresets, rateLimiter, requireRateLimit } from '../rateLimit.server'

describe('rateLimit.server.ts', () => {
    beforeEach(() => {
        rateLimiter.clear()
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe('RateLimiter.check', () => {
        it('should allow requests within limit', () => {
            const config = { windowMs: 60000, maxRequests: 5 }

            expect(rateLimiter.check('user1', config)).toBe(true)
            expect(rateLimiter.check('user1', config)).toBe(true)
            expect(rateLimiter.check('user1', config)).toBe(true)
        })

        it('should block requests exceeding limit', () => {
            const config = { windowMs: 60000, maxRequests: 3 }

            expect(rateLimiter.check('user1', config)).toBe(true)
            expect(rateLimiter.check('user1', config)).toBe(true)
            expect(rateLimiter.check('user1', config)).toBe(true)
            expect(rateLimiter.check('user1', config)).toBe(false)
            expect(rateLimiter.check('user1', config)).toBe(false)
        })

        it('should reset after time window', () => {
            const config = { windowMs: 60000, maxRequests: 2 }

            expect(rateLimiter.check('user1', config)).toBe(true)
            expect(rateLimiter.check('user1', config)).toBe(true)
            expect(rateLimiter.check('user1', config)).toBe(false)

            // Advance time past window
            vi.advanceTimersByTime(61000)

            expect(rateLimiter.check('user1', config)).toBe(true)
        })

        it('should handle multiple identifiers independently', () => {
            const config = { windowMs: 60000, maxRequests: 2 }

            expect(rateLimiter.check('user1', config)).toBe(true)
            expect(rateLimiter.check('user1', config)).toBe(true)
            expect(rateLimiter.check('user1', config)).toBe(false)

            // Different user should have separate limit
            expect(rateLimiter.check('user2', config)).toBe(true)
            expect(rateLimiter.check('user2', config)).toBe(true)
            expect(rateLimiter.check('user2', config)).toBe(false)
        })

        it('should clean up old timestamps', () => {
            const config = { windowMs: 60000, maxRequests: 3 }

            rateLimiter.check('user1', config)
            rateLimiter.check('user1', config)

            // Advance time to trigger cleanup
            vi.advanceTimersByTime(61000)

            // Old timestamps should be cleaned up
            rateLimiter.check('user1', config)
            expect(rateLimiter.getRemaining('user1', config)).toBe(2)
        })
    })

    describe('RateLimiter.getRemaining', () => {
        it('should return correct remaining count', () => {
            const config = { windowMs: 60000, maxRequests: 5 }

            expect(rateLimiter.getRemaining('user1', config)).toBe(5)

            rateLimiter.check('user1', config)
            expect(rateLimiter.getRemaining('user1', config)).toBe(4)

            rateLimiter.check('user1', config)
            expect(rateLimiter.getRemaining('user1', config)).toBe(3)
        })

        it('should return max when no requests made', () => {
            const config = { windowMs: 60000, maxRequests: 10 }

            expect(rateLimiter.getRemaining('newuser', config)).toBe(10)
        })

        it('should return 0 when limit exceeded', () => {
            const config = { windowMs: 60000, maxRequests: 2 }

            rateLimiter.check('user1', config)
            rateLimiter.check('user1', config)

            expect(rateLimiter.getRemaining('user1', config)).toBe(0)
        })
    })

    describe('RateLimiter.reset', () => {
        it('should clear rate limit for identifier', () => {
            const config = { windowMs: 60000, maxRequests: 2 }

            rateLimiter.check('user1', config)
            rateLimiter.check('user1', config)
            expect(rateLimiter.check('user1', config)).toBe(false)

            rateLimiter.reset('user1')

            expect(rateLimiter.check('user1', config)).toBe(true)
        })

        it('should not affect other identifiers', () => {
            const config = { windowMs: 60000, maxRequests: 2 }

            rateLimiter.check('user1', config)
            rateLimiter.check('user2', config)

            rateLimiter.reset('user1')

            expect(rateLimiter.getRemaining('user1', config)).toBe(2)
            expect(rateLimiter.getRemaining('user2', config)).toBe(1)
        })
    })

    describe('RateLimiter.clear', () => {
        it('should remove all rate limit data', () => {
            const config = { windowMs: 60000, maxRequests: 2 }

            rateLimiter.check('user1', config)
            rateLimiter.check('user2', config)
            rateLimiter.check('user3', config)

            rateLimiter.clear()

            expect(rateLimiter.getRemaining('user1', config)).toBe(2)
            expect(rateLimiter.getRemaining('user2', config)).toBe(2)
            expect(rateLimiter.getRemaining('user3', config)).toBe(2)
        })
    })

    describe('requireRateLimit', () => {
        it('should pass when under limit', () => {
            const config = { windowMs: 60000, maxRequests: 5 }

            expect(() => requireRateLimit('user1', config)).not.toThrow()
            expect(() => requireRateLimit('user1', config)).not.toThrow()
        })

        it('should throw error when limit exceeded', () => {
            const config = { windowMs: 60000, maxRequests: 2 }

            requireRateLimit('user1', config)
            requireRateLimit('user1', config)

            expect(() => requireRateLimit('user1', config)).toThrow('Rate limit exceeded')
        })

        it('should include reset time in error message', () => {
            const config = { windowMs: 60000, maxRequests: 1 }

            requireRateLimit('user1', config)

            try {
                requireRateLimit('user1', config)
                expect.fail('Should have thrown error')
            } catch (error: any) {
                expect(error.message).toContain('Reset at:')
                expect(error.message).toContain('Remaining: 0')
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
        it('should handle very short time windows', () => {
            const config = { windowMs: 100, maxRequests: 2 }

            rateLimiter.check('user1', config)
            rateLimiter.check('user1', config)
            expect(rateLimiter.check('user1', config)).toBe(false)

            vi.advanceTimersByTime(101)
            expect(rateLimiter.check('user1', config)).toBe(true)
        })

        it('should handle very high request limits', () => {
            const config = { windowMs: 60000, maxRequests: 1000 }

            for (let i = 0; i < 999; i++) {
                expect(rateLimiter.check('user1', config)).toBe(true)
            }

            expect(rateLimiter.getRemaining('user1', config)).toBe(1)
        })

        it('should handle concurrent requests from same identifier', () => {
            const config = { windowMs: 60000, maxRequests: 5 }

            const results = []
            for (let i = 0; i < 10; i++) {
                results.push(rateLimiter.check('user1', config))
            }

            const allowed = results.filter(r => r).length
            expect(allowed).toBe(5)
        })
    })
})

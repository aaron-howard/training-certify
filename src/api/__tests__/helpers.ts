/**
 * Test helpers for API route integration tests
 * Provides utilities for mocking auth, database, and making test requests
 */

import { vi } from 'vitest'
import { factories } from '../../test/factories'

/**
 * Mock Clerk auth for a specific user and role
 */
export function mockAuthForRole(role: string, userId?: string) {
    const factory = (factories as any)[role.toLowerCase()]
    const user = factory ? factory({ id: userId }) : factories.user({ role, id: userId })

    const { auth } = require('@clerk/tanstack-react-start/server')
    vi.mocked(auth).mockResolvedValue({ userId: user.id })

    return user
}

/**
 * Mock database with chainable query builder
 */
export function createMockDb(mockData: any = {}) {
    const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        onConflictDoNothing: vi.fn().mockReturnThis(),
        transaction: vi.fn((callback) => callback(mockDb)),
    }

    // Configure default return values
    if (Array.isArray(mockData)) {
        mockDb.limit.mockResolvedValue(mockData)
        mockDb.returning.mockResolvedValue(mockData)
    } else {
        mockDb.limit.mockResolvedValue([mockData])
        mockDb.returning.mockResolvedValue([mockData])
    }

    return mockDb
}

/**
 * Create a mock request object
 */
export function createMockRequest(options: {
    method?: string
    url?: string
    body?: any
    headers?: Record<string, string>
} = {}) {
    const {
        method = 'GET',
        url = 'http://localhost:3000/api/test',
        body = null,
        headers = {},
    } = options

    return {
        method,
        url,
        headers: new Headers(headers),
        json: vi.fn().mockResolvedValue(body),
    } as any
}

/**
 * Assert that a response has the expected status and structure
 */
export async function assertResponse(
    response: any,
    expectedStatus: number,
    assertions?: (data: any) => void
) {
    expect(response.status).toBe(expectedStatus)

    if (assertions && response.json) {
        const data = await response.json()
        assertions(data)
    }
}

/**
 * Mock rate limiter to always allow requests
 */
export function mockRateLimiterAllow() {
    vi.mock('../../lib/rateLimit.server', () => ({
        requireRateLimit: vi.fn(),
        rateLimiter: {
            check: vi.fn().mockReturnValue(true),
            getRemaining: vi.fn().mockReturnValue(100),
        },
        RateLimitPresets: {
            READ: { windowMs: 60000, maxRequests: 100 },
            MUTATION: { windowMs: 60000, maxRequests: 30 },
        },
    }))
}

/**
 * Mock rate limiter to block requests
 */
export function mockRateLimiterBlock() {
    vi.mock('../../lib/rateLimit.server', () => ({
        requireRateLimit: vi.fn(() => {
            throw new Error('Rate limit exceeded')
        }),
        rateLimiter: {
            check: vi.fn().mockReturnValue(false),
            getRemaining: vi.fn().mockReturnValue(0),
        },
        RateLimitPresets: {
            READ: { windowMs: 60000, maxRequests: 100 },
            MUTATION: { windowMs: 60000, maxRequests: 30 },
        },
    }))
}

/**
 * Clear all rate limiter state
 */
export function clearRateLimiter() {
    const { rateLimiter } = require('../../lib/rateLimit.server')
    if (rateLimiter && rateLimiter.clear) {
        rateLimiter.clear()
    }
}

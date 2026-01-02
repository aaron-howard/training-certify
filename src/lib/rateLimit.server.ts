/**
 * Simple in-memory rate limiter for API endpoints.
 * Tracks requests per identifier (user ID or IP) within a time window.
 */

interface RateLimitConfig {
    windowMs: number
    maxRequests: number
}

interface RequestLog {
    timestamps: Array<number>
    lastCleanup: number
}

class RateLimiter {
    private requests = new Map<string, RequestLog>()
    private readonly CLEANUP_INTERVAL = 60000 // Clean up every minute

    /**
     * Check if a request should be allowed based on rate limit configuration.
     * @param identifier Unique identifier (user ID, IP address, etc.)
     * @param config Rate limit configuration
     * @returns true if request is allowed, false if rate limit exceeded
     */
    check(identifier: string, config: RateLimitConfig): boolean {
        const now = Date.now()
        const windowStart = now - config.windowMs

        // Get or create request log for this identifier
        let log = this.requests.get(identifier)
        if (!log) {
            log = { timestamps: [], lastCleanup: now }
            this.requests.set(identifier, log)
        }

        // Clean up old timestamps periodically
        if (now - log.lastCleanup > this.CLEANUP_INTERVAL) {
            log.timestamps = log.timestamps.filter((time) => time > windowStart)
            log.lastCleanup = now
        }

        // Filter to only recent requests within the window
        const recentRequests = log.timestamps.filter((time) => time > windowStart)

        // Check if rate limit exceeded
        if (recentRequests.length >= config.maxRequests) {
            return false
        }

        // Add current request timestamp
        recentRequests.push(now)
        log.timestamps = recentRequests

        return true
    }

    /**
     * Get remaining requests for an identifier
     */
    getRemaining(identifier: string, config: RateLimitConfig): number {
        const now = Date.now()
        const windowStart = now - config.windowMs
        const log = this.requests.get(identifier)

        if (!log) return config.maxRequests

        const recentRequests = log.timestamps.filter((time) => time > windowStart)
        return Math.max(0, config.maxRequests - recentRequests.length)
    }

    /**
     * Reset rate limit for an identifier
     */
    reset(identifier: string): void {
        this.requests.delete(identifier)
    }

    /**
     * Clear all rate limit data (useful for testing)
     */
    clear(): void {
        this.requests.clear()
    }
}

// Singleton instance
export const rateLimiter = new RateLimiter()

/**
 * Rate limit guard for use in API handlers.
 * Throws an error if rate limit is exceeded.
 */
export function requireRateLimit(
    identifier: string,
    config: RateLimitConfig,
): void {
    if (!rateLimiter.check(identifier, config)) {
        const remaining = rateLimiter.getRemaining(identifier, config)
        const resetTime = new Date(Date.now() + config.windowMs).toISOString()

        throw new Error(
            `Rate limit exceeded. Remaining: ${remaining}. Reset at: ${resetTime}`,
        )
    }
}

/**
 * Predefined rate limit configurations for common use cases
 */
export const RateLimitPresets = {
    // Authentication endpoints (strict)
    AUTH: { windowMs: 60000, maxRequests: 5 }, // 5 requests per minute

    // Mutation endpoints (moderate)
    MUTATION: { windowMs: 60000, maxRequests: 30 }, // 30 requests per minute

    // Export/bulk endpoints (strict)
    EXPORT: { windowMs: 60000, maxRequests: 5 }, // 5 requests per minute

    // Read endpoints (lenient)
    READ: { windowMs: 60000, maxRequests: 100 }, // 100 requests per minute

    // Admin operations (moderate)
    ADMIN: { windowMs: 60000, maxRequests: 50 }, // 50 requests per minute
}

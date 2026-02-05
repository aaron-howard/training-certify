/**
 * Rate limiter for API endpoints.
 * Uses database-backed storage in production, in-memory in development.
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

class InMemoryRateLimiter {
  private requests = new Map<string, RequestLog>()
  private readonly CLEANUP_INTERVAL = 60000 // Clean up every minute

  check(identifier: string, config: RateLimitConfig): boolean {
    const now = Date.now()
    const windowStart = now - config.windowMs

    let log = this.requests.get(identifier)
    if (!log) {
      log = { timestamps: [], lastCleanup: now }
      this.requests.set(identifier, log)
    }

    if (now - log.lastCleanup > this.CLEANUP_INTERVAL) {
      log.timestamps = log.timestamps.filter((time) => time > windowStart)
      log.lastCleanup = now
    }

    const recentRequests = log.timestamps.filter((time) => time > windowStart)

    if (recentRequests.length >= config.maxRequests) {
      return false
    }

    recentRequests.push(now)
    log.timestamps = recentRequests

    return true
  }

  getRemaining(identifier: string, config: RateLimitConfig): number {
    const now = Date.now()
    const windowStart = now - config.windowMs
    const log = this.requests.get(identifier)

    if (!log) return config.maxRequests

    const recentRequests = log.timestamps.filter((time) => time > windowStart)
    return Math.max(0, config.maxRequests - recentRequests.length)
  }

  reset(identifier: string): void {
    this.requests.delete(identifier)
  }

  clear(): void {
    this.requests.clear()
  }
}

class DatabaseRateLimiter {
  private lastCleanup = 0
  private readonly CLEANUP_INTERVAL = 300000 // Clean up every 5 minutes

  /**
   * Check if a request should be allowed based on rate limit configuration.
   */
  async check(identifier: string, config: RateLimitConfig): Promise<boolean> {
    const { getDbOrThrow } = await import('../db/db.server')
    const db = await getDbOrThrow()
    const { rateLimitLogs } = await import('../db/schema')
    const { gte, and, eq } = await import('drizzle-orm')

    const now = new Date()
    const windowStart = new Date(now.getTime() - config.windowMs)

    // Periodic cleanup of old entries
    if (Date.now() - this.lastCleanup > this.CLEANUP_INTERVAL) {
      await this.cleanup(db, windowStart)
      this.lastCleanup = Date.now()
    }

    // Count recent requests
    const recentRequests = await db
      .select()
      .from(rateLimitLogs)
      .where(
        and(
          eq(rateLimitLogs.identifier, identifier),
          gte(rateLimitLogs.timestamp, windowStart)
        )
      )

    if (recentRequests.length >= config.maxRequests) {
      return false
    }

    // Log this request
    await db.insert(rateLimitLogs).values({
      identifier,
      timestamp: now,
    })

    return true
  }

  /**
   * Get remaining requests for an identifier
   */
  async getRemaining(identifier: string, config: RateLimitConfig): Promise<number> {
    const { getDbOrThrow } = await import('../db/db.server')
    const db = await getDbOrThrow()
    const { rateLimitLogs } = await import('../db/schema')
    const { gte, and, eq } = await import('drizzle-orm')

    const now = new Date()
    const windowStart = new Date(now.getTime() - config.windowMs)

    const recentRequests = await db
      .select()
      .from(rateLimitLogs)
      .where(
        and(
          eq(rateLimitLogs.identifier, identifier),
          gte(rateLimitLogs.timestamp, windowStart)
        )
      )

    return Math.max(0, config.maxRequests - recentRequests.length)
  }

  /**
   * Reset rate limit for an identifier
   */
  async reset(identifier: string): Promise<void> {
    const { getDbOrThrow } = await import('../db/db.server')
    const db = await getDbOrThrow()
    const { rateLimitLogs } = await import('../db/schema')
    const { eq } = await import('drizzle-orm')

    await db.delete(rateLimitLogs).where(eq(rateLimitLogs.identifier, identifier))
  }

  /**
   * Clean up old rate limit entries
   */
  private async cleanup(db: Awaited<ReturnType<typeof import('../db/db.server').getDbOrThrow>>, before: Date): Promise<void> {
    const { rateLimitLogs } = await import('../db/schema')
    const { lt } = await import('drizzle-orm')

    try {
      await db.delete(rateLimitLogs).where(lt(rateLimitLogs.timestamp, before))
    } catch (error) {
      // Log but don't throw - cleanup failures shouldn't break rate limiting
      console.warn('⚠️ [Rate Limit] Failed to cleanup old entries:', error)
    }
  }
}

class RateLimiter {
  private inMemory: InMemoryRateLimiter
  private database: DatabaseRateLimiter | null = null
  private useDatabase: boolean

  constructor() {
    this.inMemory = new InMemoryRateLimiter()
    this.useDatabase = process.env.NODE_ENV === 'production' && process.env.USE_DB_RATE_LIMIT !== 'false'
    
    if (this.useDatabase) {
      this.database = new DatabaseRateLimiter()
    }
  }

  /**
   * Check if a request should be allowed based on rate limit configuration.
   */
  async check(identifier: string, config: RateLimitConfig): Promise<boolean> {
    if (this.useDatabase && this.database) {
      try {
        return await this.database.check(identifier, config)
      } catch (error) {
        // Fallback to in-memory if database fails
        console.warn('⚠️ [Rate Limit] Database check failed, falling back to in-memory:', error)
        return this.inMemory.check(identifier, config)
      }
    }
    return this.inMemory.check(identifier, config)
  }

  /**
   * Get remaining requests for an identifier
   */
  async getRemaining(identifier: string, config: RateLimitConfig): Promise<number> {
    if (this.useDatabase && this.database) {
      try {
        return await this.database.getRemaining(identifier, config)
      } catch (error) {
        console.warn('⚠️ [Rate Limit] Database getRemaining failed, falling back to in-memory:', error)
        return this.inMemory.getRemaining(identifier, config)
      }
    }
    return this.inMemory.getRemaining(identifier, config)
  }

  /**
   * Reset rate limit for an identifier
   */
  async reset(identifier: string): Promise<void> {
    if (this.useDatabase && this.database) {
      try {
        await this.database.reset(identifier)
      } catch (error) {
        console.warn('⚠️ [Rate Limit] Database reset failed, falling back to in-memory:', error)
      }
    }
    this.inMemory.reset(identifier)
  }

  /**
   * Clear all rate limit data (useful for testing)
   */
  clear(): void {
    this.inMemory.clear()
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter()

/**
 * Rate limit guard for use in API handlers.
 * Checks if the request should be allowed based on rate limit configuration.
 * Uses database-backed rate limiting in production, in-memory in development.
 * 
 * @param identifier - Unique identifier (user ID, IP address, etc.)
 * @param config - Rate limit configuration with windowMs and maxRequests
 * @throws {Error} If rate limit is exceeded, includes remaining count and reset time
 */
export async function requireRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<void> {
  const allowed = await rateLimiter.check(identifier, config)
  if (!allowed) {
    const remaining = await rateLimiter.getRemaining(identifier, config)
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

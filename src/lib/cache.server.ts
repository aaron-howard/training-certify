/**
 * Simple in-memory cache with TTL support.
 * Useful for caching expensive computations and frequently accessed data.
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly CLEANUP_INTERVAL = 300000 // Clean up every 5 minutes

  private lastCleanup = Date.now()

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached value or null if not found or expired
   */
  get<T>(key: string): T | null {
    this.periodicCleanup()

    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set a value in the cache with TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttlMs Time to live in milliseconds
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    })
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Delete a specific key
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidate all keys matching a pattern
   * @param pattern String pattern to match (uses includes)
   */
  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: Array<string> } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Periodically clean up expired entries
   */
  private periodicCleanup(): void {
    const now = Date.now()
    if (now - this.lastCleanup < this.CLEANUP_INTERVAL) return

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }

    this.lastCleanup = now
  }
}

// Singleton instance
export const cache = new SimpleCache()

/**
 * Cache TTL presets for common use cases
 */
export const CacheTTL = {
  // Very short-lived (30 seconds)
  REALTIME: 30000,

  // Short-lived (1 minute)
  SHORT: 60000,

  // Medium-lived (5 minutes)
  MEDIUM: 300000,

  // Long-lived (15 minutes)
  LONG: 900000,

  // Very long-lived (1 hour)
  VERY_LONG: 3600000,
}

/**
 * Common **server-side** cache key prefixes (invalidate with `invalidateCache(prefix)` — substring match):
 * - `teams:` — GET /api/teams aggregated list + metrics
 * - `dashboard:` — GET /api/dashboard (executive + per-user stats)
 * - `compliance:` — GET /api/compliance audit list
 * - `team-requirements:` — GET /api/team-requirements per `teamId`
 * - `users:list:` — GET /api/users paginated rows
 * - `notifications:` — GET /api/notifications per user
 */

/**
 * Get a value from cache or compute it if not found.
 *
 * This function implements a cache-aside pattern. It first checks the cache
 * for the given key. If found, returns the cached value. If not found,
 * calls the compute function to generate the value, stores it in cache,
 * and returns it.
 *
 * @template T - The type of the cached value
 * @param key - Cache key string (should be unique and descriptive)
 * @param ttl - Time to live in milliseconds (how long the value should be cached)
 * @param compute - Async function that computes the value if not in cache
 * @returns Promise that resolves to the cached or computed value
 *
 * @example
 * ```typescript
 * const stats = await getOrCompute(
 *   `team-stats:${teamId}`,
 *   CacheTTL.MEDIUM,
 *   async () => {
 *     // Expensive computation
 *     return await calculateTeamStats(teamId)
 *   }
 * )
 * ```
 */
export async function getOrCompute<T>(
  key: string,
  ttl: number,
  compute: () => Promise<T>,
): Promise<T> {
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Compute value
  const value = await compute()

  // Store in cache
  cache.set(key, value, ttl)

  return value
}

/**
 * Invalidate cache keys matching a pattern.
 *
 * Removes all cache entries whose keys match the provided pattern.
 * Useful for cache invalidation when related data changes.
 *
 * @param pattern - Pattern string to match against cache keys (supports wildcards)
 *
 * @example
 * ```typescript
 * // Invalidate all team-related cache entries
 * invalidateCache('team:*')
 *
 * // Invalidate cache for a specific team
 * invalidateCache(`team:${teamId}:*`)
 * ```
 */
export function invalidateCache(pattern: string): void {
  cache.invalidate(pattern)
}

/**
 * Simple in-memory cache with TTL support.
 * Useful for caching expensive computations and frequently accessed data.
 * Now with Redis fallback for distributed caching.
 */

import { redisDel, redisDelPattern, redisGet, redisSet } from './cache.redis'

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
 * Get a value from cache or compute it if not found
 * Uses Redis as primary cache, in-memory as fallback
 * @param key Cache key
 * @param ttl Time to live in milliseconds
 * @param compute Function to compute the value if not cached
 */
export async function getOrCompute<T>(
  key: string,
  ttl: number,
  compute: () => Promise<T>,
): Promise<T> {
  // Try Redis first (distributed cache)
  const redisValue = await redisGet<T>(key)
  if (redisValue !== null) {
    // Also store in local cache for faster subsequent access
    cache.set(key, redisValue, ttl)
    return redisValue
  }

  // Fallback to in-memory cache
  const cached = cache.get<T>(key)
  if (cached !== null) {
    // Backfill Redis cache
    await redisSet(key, cached, Math.floor(ttl / 1000))
    return cached
  }

  // Compute value
  const value = await compute()

  // Store in both caches
  await redisSet(key, value, Math.floor(ttl / 1000))
  cache.set(key, value, ttl)

  return value
}

/**
 * Invalidate cache keys matching pattern
 * Clears both Redis and in-memory caches
 */
export async function invalidateCache(pattern: string): Promise<void> {
  // Invalidate Redis
  const redisDeleted = await redisDelPattern(pattern)
  if (redisDeleted > 0) {
    console.log(
      `🗑️  Invalidated ${redisDeleted} Redis keys matching: ${pattern}`,
    )
  }

  // Invalidate in-memory
  cache.invalidate(pattern)
}

/**
 * Delete specific cache key
 * Removes from both Redis and in-memory caches
 */
export async function deleteCache(key: string): Promise<void> {
  await redisDel(key)
  cache.delete(key)
}

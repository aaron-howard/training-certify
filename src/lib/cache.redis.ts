/**
 * Redis-based cache implementation
 * Distributed caching for production
 */

import Redis from 'ioredis'

let redis: Redis | null = null
let isConnected = false

/**
 * Initialize Redis connection
 */
export function initRedis() {
  if (redis) return redis

  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    console.log('⚠️  REDIS_URL not configured - using in-memory cache only')
    return null
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      reconnectOnError(err) {
        const targetErrors = ['READONLY', 'ECONNRESET']
        return targetErrors.some((e) => err.message.includes(e))
      },
    })

    redis.on('connect', () => {
      isConnected = true
      console.log('✅ Redis connected')
    })

    redis.on('error', (err) => {
      console.error('❌ Redis error:', err.message)
      isConnected = false
    })

    redis.on('close', () => {
      isConnected = false
      console.log('⚠️  Redis connection closed')
    })

    return redis
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error)
    return null
  }
}

/**
 * Get value from Redis
 */
export async function redisGet<T>(key: string): Promise<T | null> {
  if (!redis || !isConnected) return null

  try {
    const value = await redis.get(key)
    if (!value) return null

    return JSON.parse(value) as T
  } catch (error) {
    console.error('Redis GET error:', error)
    return null
  }
}

/**
 * Set value in Redis with TTL
 */
export async function redisSet(
  key: string,
  value: any,
  ttlSeconds: number,
): Promise<boolean> {
  if (!redis || !isConnected) return false

  try {
    const serialized = JSON.stringify(value)
    await redis.setex(key, ttlSeconds, serialized)
    return true
  } catch (error) {
    console.error('Redis SET error:', error)
    return false
  }
}

/**
 * Delete key from Redis
 */
export async function redisDel(key: string): Promise<boolean> {
  if (!redis || !isConnected) return false

  try {
    await redis.del(key)
    return true
  } catch (error) {
    console.error('Redis DEL error:', error)
    return false
  }
}

/**
 * Delete keys matching pattern
 */
export async function redisDelPattern(pattern: string): Promise<number> {
  if (!redis || !isConnected) return 0

  try {
    const keys = await redis.keys(`*${pattern}*`)
    if (keys.length === 0) return 0

    await redis.del(...keys)
    return keys.length
  } catch (error) {
    console.error('Redis DEL pattern error:', error)
    return 0
  }
}

/**
 * Check if key exists
 */
export async function redisExists(key: string): Promise<boolean> {
  if (!redis || !isConnected) return false

  try {
    const exists = await redis.exists(key)
    return exists === 1
  } catch (error) {
    console.error('Redis EXISTS error:', error)
    return false
  }
}

/**
 * Get cache statistics
 */
export async function redisStats() {
  if (!redis || !isConnected) {
    return {
      connected: false,
      keys: 0,
      memory: '0 MB',
    }
  }

  try {
    const dbsize = await redis.dbsize()
    const info = await redis.info('memory')

    // Parse memory usage from info
    const memoryMatch = info.match(/used_memory_human:(.+)/)
    const memory = memoryMatch ? memoryMatch[1].trim() : 'Unknown'

    return {
      connected: true,
      keys: dbsize,
      memory,
    }
  } catch (error) {
    console.error('Redis STATS error:', error)
    return {
      connected: false,
      keys: 0,
      memory: '0 MB',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Close Redis connection
 */
export async function closeRedis() {
  if (redis) {
    await redis.quit()
    redis = null
    isConnected = false
    console.log('✅ Redis connection closed')
  }
}

export { redis }

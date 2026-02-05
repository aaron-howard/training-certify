// src/db/index.server.ts
import { ENV, envReady } from '../lib/env'
import * as schema from './schema'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { Pool } from 'pg'

// Prevent multiple instances in development using globalThis
const globalForDb = globalThis as unknown as {
  db: NodePgDatabase<typeof schema> | undefined
  pool: Pool | undefined
  initPromise: Promise<NodePgDatabase<typeof schema> | null> | undefined
}

const isServer =
  typeof window === 'undefined' || !!(import.meta as { env?: { SSR?: boolean } }).env?.SSR
const instanceId = Math.random().toString(36).substring(7)

/**
 * Check if an error is transient and should be retried
 */
function isTransientError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  
  const errorCode = (error as { code?: string }).code
  const errorMessage = error.message.toLowerCase()
  
  // Transient error codes from pg library
  const transientCodes = [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EAI_AGAIN',
    'ECONNRESET',
    'EPIPE',
  ]
  
  // Check error code
  if (errorCode && transientCodes.includes(errorCode)) {
    return true
  }
  
  // Check error message for transient patterns
  const transientPatterns = [
    'connection',
    'timeout',
    'network',
    'temporary',
    'unavailable',
    'refused',
  ]
  
  return transientPatterns.some(pattern => errorMessage.includes(pattern))
}

/**
 * Check if an error is permanent and should not be retried
 */
function isPermanentError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  
  const errorCode = (error as { code?: string }).code
  const errorMessage = error.message.toLowerCase()
  
  // Permanent error codes
  const permanentCodes = [
    '28P01', // Invalid password
    '3D000', // Database does not exist
    '28000', // Invalid authorization specification
  ]
  
  if (errorCode && permanentCodes.includes(errorCode)) {
    return true
  }
  
  // Check for authentication/authorization errors
  const permanentPatterns = [
    'password',
    'authentication',
    'authorization',
    'permission denied',
    'access denied',
  ]
  
  return permanentPatterns.some(pattern => errorMessage.includes(pattern))
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000,
  operation: string = 'operation'
): Promise<T> {
  let lastError: unknown
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Don't retry permanent errors
      if (isPermanentError(error)) {
        console.error(
          `❌ [DB Retry] Instance ${instanceId} - Permanent error detected, not retrying:`,
          error instanceof Error ? error.message : String(error)
        )
        throw error
      }
      
      // Don't retry if not a transient error
      if (!isTransientError(error)) {
        throw error
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break
      }
      
      // Calculate exponential backoff delay
      const delayMs = baseDelayMs * Math.pow(2, attempt)
      console.warn(
        `⚠️ [DB Retry] Instance ${instanceId} - ${operation} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms:`,
        error instanceof Error ? error.message : String(error)
      )
      
      await sleep(delayMs)
    }
  }
  
  // All retries exhausted
  console.error(
    `❌ [DB Retry] Instance ${instanceId} - ${operation} failed after ${maxRetries + 1} attempts`
  )
  throw lastError
}

if (isServer) {
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `🔌 [DB Module] Server-side instance ${instanceId} loaded. Window: ${typeof window}, SSR: ${(import.meta as any).env?.SSR}`,
    )
  }
} else {
  console.warn(
    `⚠️ [DB Module] Client-side instance ${instanceId} loaded? Window: ${typeof window}, SSR: ${(import.meta as any).env?.SSR}`,
  )
}

async function initializeDb() {
  if (globalForDb.db) return globalForDb.db

  try {
    await envReady

    // Explicit fallback for local development if ENV fails
    const url =
      ENV.DATABASE_URL ||
      process.env.DATABASE_URL ||
      'postgresql://postgres:password@127.0.0.1:5433/devdb'

    if (!url) {
      console.error(
        `❌ [DB Init] Instance ${instanceId} - No DATABASE_URL found.`,
      )
      return null
    }

    const { Pool } = await import('pg')
    const { drizzle } = await import('drizzle-orm/node-postgres')

    const isProduction = process.env.NODE_ENV === 'production'
    const defaultPoolSize = isProduction ? 10 : 2
    
    const pool = new Pool({
      connectionString: url,
      max: parseInt(process.env.DB_POOL_SIZE || String(defaultPoolSize), 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })

    // Test connection with retry logic
    await retryWithBackoff(
      async () => {
        const client = await pool.connect()
        client.release()
        return client
      },
      3, // max retries
      1000, // base delay 1 second
      'Database connection test'
    )
    
    console.log(
      `✅ [DB Init] Instance ${instanceId} - Successfully connected to PostgreSQL (Pool Size: ${pool.totalCount})`,
    )

    globalForDb.pool = pool
    globalForDb.db = drizzle(pool, { schema })
    return globalForDb.db
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(
      `❌ [DB Init] Instance ${instanceId} - Critical failure:`,
      message,
    )
    return null
  }
}

/**
 * Async helper to obtain the DB instance.
 * Returns null if database is unavailable (caller should handle this).
 * 
 * @returns Database instance or null if unavailable
 * @throws Never throws - returns null on failure
 */
export const getDb = async (): Promise<NodePgDatabase<
  typeof schema
> | null> => {
  if (globalForDb.db) return globalForDb.db

  if (isServer) {
    if (globalForDb.initPromise) {
      const result = await globalForDb.initPromise
      if (result) return result
      globalForDb.initPromise = undefined
    }

    globalForDb.initPromise = initializeDb()
    return await globalForDb.initPromise
  }

  return null
}

/** 
 * Helper to obtain the DB instance or throw a descriptive error.
 * Use this in API handlers to avoid repetitive null checks.
 * 
 * @returns Database instance (never null)
 * @throws {Error} If database is unavailable
 */
export const getDbOrThrow = async (): Promise<NodePgDatabase<typeof schema>> => {
  const database = await getDb()
  if (!database) {
    throw new Error('Database not available. Please check environment variables and connection string.')
  }
  return database
}

export const db = globalForDb.db
export { instanceId }

/**
 * Close database connections gracefully.
 * Used during application shutdown to clean up resources.
 * 
 * @throws Never throws - logs errors instead
 */
export async function closeDb(): Promise<void> {
  if (globalForDb.pool) {
    try {
      console.log('💾 Closing database connection pool...')
      await globalForDb.pool.end()
      globalForDb.db = undefined
      globalForDb.pool = undefined
      globalForDb.initPromise = undefined
      console.log('✅ Database connections closed')
    } catch (error) {
      console.error('❌ Error closing database:', error)
    }
  }
}

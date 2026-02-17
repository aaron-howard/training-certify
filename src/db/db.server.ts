// src/db/index.server.ts
import { ENV, envReady } from '../lib/env'
import { logError, logWarning, logger } from '../lib/logging.server'
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
  typeof window === 'undefined' ||
  !!(import.meta as { env?: { SSR?: boolean } }).env?.SSR
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

  return transientPatterns.some((pattern) => errorMessage.includes(pattern))
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

  return permanentPatterns.some((pattern) => errorMessage.includes(pattern))
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000,
  operation: string = 'operation',
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry permanent errors
      if (isPermanentError(error)) {
        logError(
          error instanceof Error ? error : new Error(String(error)),
          { instanceId, operation, attempt: attempt + 1 },
          'Permanent error detected, not retrying',
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
      logWarning(
        `${operation} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms`,
        {
          instanceId,
          operation,
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          delayMs,
          error: error instanceof Error ? error.message : String(error),
        },
      )

      await sleep(delayMs)
    }
  }

  // All retries exhausted
  logError(
    lastError instanceof Error ? lastError : new Error(String(lastError)),
    { instanceId, operation, attempts: maxRetries + 1 },
    `${operation} failed after ${maxRetries + 1} attempts`,
  )
  throw lastError
}

// Type for import.meta.env SSR flag (local to this file)
interface LocalImportMetaEnv {
  SSR?: boolean | string
}

if (isServer) {
  if (process.env.NODE_ENV === 'development') {
    logger.info(
      {
        instanceId,
        environment: typeof window,
        ssr: (import.meta as { env?: LocalImportMetaEnv }).env?.SSR,
      },
      'Server-side database instance loaded',
    )
  }
} else {
  logger.warn(
    {
      instanceId,
      environment: typeof window,
      ssr: (import.meta as { env?: LocalImportMetaEnv }).env?.SSR,
    },
    'Client-side database instance loaded (unexpected)',
  )
}

async function initializeDb() {
  if (globalForDb.db) return globalForDb.db

  try {
    await envReady

    // Get DATABASE_URL from validated environment
    const url =
      ENV.DATABASE_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL || // for prisma
      process.env.POSTGRES_URL_NON_POOLING // for drizzle

    if (!url) {
      const errorMessage = `DATABASE_URL is required but not found`
      logError(new Error(errorMessage), { instanceId }, errorMessage)
      if (process.env.NODE_ENV === 'production') {
        throw new Error('DATABASE_URL environment variable is required')
      }
      return null
    }

    const { Pool } = await import('pg')
    const { drizzle } = await import('drizzle-orm/node-postgres')

    const isProduction = process.env.NODE_ENV === 'production'
    const defaultPoolSize = isProduction ? 10 : 2

    const pool = new Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: true },
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
      'Database connection test',
    )

    logger.info(
      {
        instanceId,
        poolSize: pool.totalCount,
      },
      'Successfully connected to PostgreSQL',
    )

    globalForDb.pool = pool
    globalForDb.db = drizzle(pool, { schema })
    return globalForDb.db
  } catch (error) {
    logError(
      error instanceof Error ? error : new Error(String(error)),
      { instanceId },
      'Critical database initialization failure',
    )
    return null
  }
}

/**
 * Async helper to obtain the database instance.
 *
 * Returns the initialized Drizzle ORM database instance. If the database
 * hasn't been initialized yet, triggers initialization. Returns null if
 * the database is unavailable (e.g., missing DATABASE_URL, connection failure).
 *
 * This function never throws - it returns null on failure, allowing callers
 * to handle the error gracefully. For API handlers, prefer `getDbOrThrow()`
 * which throws a descriptive error.
 *
 * @returns Promise that resolves to the database instance, or null if unavailable
 * @throws Never throws - always returns null on failure
 *
 * @example
 * ```typescript
 * const db = await getDb()
 * if (!db) {
 *   // Handle database unavailable
 *   return json({ error: 'Database unavailable' }, { status: 503 })
 * }
 * const users = await db.select().from(users)
 * ```
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
 * Helper to obtain the database instance or throw a descriptive error.
 *
 * This is the preferred function for API handlers as it eliminates the need
 * for null checks. If the database is unavailable, throws an error with a
 * descriptive message that can be caught and returned as a 503 response.
 *
 * @returns Promise that resolves to the database instance (never null)
 * @throws {Error} If database is unavailable with message: "Database not available. Please check environment variables and connection string."
 *
 * @example
 * ```typescript
 * try {
 *   const db = await getDbOrThrow()
 *   const users = await db.select().from(users)
 * } catch (error) {
 *   return json({ error: 'Database unavailable' }, { status: 503 })
 * }
 * ```
 */
export const getDbOrThrow = async (): Promise<
  NodePgDatabase<typeof schema>
> => {
  const database = await getDb()
  if (!database) {
    throw new Error(
      'Database not available. Please check environment variables and connection string.',
    )
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
      logger.info({ instanceId }, 'Closing database connection pool')
      await globalForDb.pool.end()
      globalForDb.db = undefined
      globalForDb.pool = undefined
      globalForDb.initPromise = undefined
      logger.info({ instanceId }, 'Database connections closed')
    } catch (error) {
      logError(error, { instanceId }, 'Error closing database')
    }
  }
}

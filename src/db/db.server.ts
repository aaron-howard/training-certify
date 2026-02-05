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

    const pool = new Pool({
      connectionString: url,
      max: parseInt(process.env.DB_POOL_SIZE || '2', 10), // Reduced pool size to prevent exhaustion during dev/HMR
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })

    // Test connection
    const client = await pool.connect()
    console.log(
      `✅ [DB Init] Instance ${instanceId} - Successfully connected to PostgreSQL (Pool Size: ${pool.totalCount})`,
    )
    client.release()

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

/** Async helper to obtain the DB instance. */
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
 * Close database connections
 * Used during graceful shutdown
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

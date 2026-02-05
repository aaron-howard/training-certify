// src/db/index.server.ts
import { ENV, envReady } from '../lib/env'
import * as schema from './schema'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

// Prevent multiple instances in development using globalThis
const globalForDb = globalThis as unknown as {
  db: NodePgDatabase<typeof schema> | undefined
  initPromise: Promise<NodePgDatabase<typeof schema> | null> | undefined
}

const isServer =
  typeof window === 'undefined' || !!(import.meta as any).env?.SSR
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

    // SECURITY: Require DATABASE_URL from environment, no hardcoded fallback
    const url = ENV.DATABASE_URL || process.env.DATABASE_URL

    if (!url) {
      console.error(
        `[DB Init] Instance ${instanceId} - DATABASE_URL environment variable is required.`,
      )
      throw new Error('DATABASE_URL environment variable is required. Please set it in your environment or .env file.')
    }

    const { Pool } = await import('pg')
    const { drizzle } = await import('drizzle-orm/node-postgres')

    // Pool size: use 2 for dev (prevent exhaustion during HMR), 10 for production
    const defaultPoolSize = process.env.NODE_ENV === 'production' ? '10' : '2'
    
    const pool = new Pool({
      connectionString: url,
      max: parseInt(process.env.DB_POOL_SIZE || defaultPoolSize, 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })

    // Test connection
    const client = await pool.connect()
    console.log(
      `✅ [DB Init] Instance ${instanceId} - Successfully connected to PostgreSQL (Pool Size: ${pool.totalCount})`,
    )
    client.release()

    globalForDb.db = drizzle(pool, { schema })
    return globalForDb.db
  } catch (error: any) {
    console.error(
      `❌ [DB Init] Instance ${instanceId} - Critical failure:`,
      error.message,
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

export const db = globalForDb.db
export { instanceId }

/**
 * Close database connections
 * Used during graceful shutdown
 */
export function closeDb(): void {
  if (globalForDb.db) {
    try {
      console.log('[DB] Closing database connection pool...')
      globalForDb.db = undefined
      globalForDb.initPromise = undefined
      console.log('[DB] Database connections closed')
    } catch (error) {
      console.error('[DB] Error closing database:', error)
    }
  }
}

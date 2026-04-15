/**
 * Readiness check endpoint for load balancers
 * Returns whether the application is ready to receive traffic
 */

import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDb } from '../db/db.server'
import { applySecurityHeaders } from '../lib/securityHeaders.server'

interface ReadinessCheck {
  ready: boolean
  timestamp: string
  checks: {
    database: boolean
    startup: boolean
  }
}

async function isDatabaseReady(): Promise<boolean> {
  try {
    const db = await getDb()
    if (!db) return false

    // Quick connectivity check
    const { sql } = await import('drizzle-orm')
    await db.execute(sql`SELECT 1`)
    return true
  } catch {
    return false
  }
}

export const Route = createFileRoute('/ready')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const databaseReady = await isDatabaseReady()
          const startupComplete = process.uptime() > 5 // App running for at least 5 seconds

          const readinessCheck: ReadinessCheck = {
            ready: databaseReady && startupComplete,
            timestamp: new Date().toISOString(),
            checks: {
              database: databaseReady,
              startup: startupComplete,
            },
          }

          const statusCode = readinessCheck.ready ? 200 : 503

          return applySecurityHeaders(
            json(readinessCheck, { status: statusCode }),
          )
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : 'Unknown error'
          return applySecurityHeaders(
            json(
              {
                ready: false,
                timestamp: new Date().toISOString(),
                error: message,
              },
              { status: 503 },
            ),
          )
        }
      },
    },
  },
})

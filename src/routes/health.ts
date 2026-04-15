/**
 * Health check endpoint for monitoring
 * Returns comprehensive health status of the application
 */

import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDb } from '../db/db.server'
import { requireInternalOpsAuth } from '../lib/internalOpsAuth.server'
import { applySecurityHeaders } from '../lib/securityHeaders.server'

interface HealthCheck {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime: number
  checks: {
    database: {
      status: 'healthy' | 'unhealthy'
      responseTime?: number
      error?: string
    }
    memory: {
      status: 'healthy' | 'unhealthy'
      used: number
      total: number
      percentage: number
    }
    system: {
      status: 'healthy'
      nodeVersion: string
      platform: string
    }
  }
}

async function checkDatabase(): Promise<{
  status: 'healthy' | 'unhealthy'
  responseTime?: number
  error?: string
}> {
  const startTime = Date.now()

  try {
    const db = await getDb()
    if (!db) {
      return {
        status: 'unhealthy',
        error: 'Database connection not available',
      }
    }

    // Simple query to verify database connectivity
    const { sql } = await import('drizzle-orm')
    await db.execute(sql`SELECT 1`)

    const responseTime = Date.now() - startTime

    return {
      status: 'healthy',
      responseTime,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      status: 'unhealthy',
      error: message,
      responseTime: Date.now() - startTime,
    }
  }
}

function checkMemory(): {
  status: 'healthy' | 'unhealthy'
  used: number
  total: number
  percentage: number
} {
  const memUsage = process.memoryUsage()
  const totalMemory = memUsage.heapTotal
  const usedMemory = memUsage.heapUsed
  const percentage = Math.round((usedMemory / totalMemory) * 100)

  return {
    status: percentage < 90 ? 'healthy' : 'unhealthy',
    used: Math.round(usedMemory / 1024 / 1024), // MB
    total: Math.round(totalMemory / 1024 / 1024), // MB
    percentage,
  }
}

export const Route = createFileRoute('/health')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireInternalOpsAuth(request)
        if (denied) return applySecurityHeaders(denied)

        try {
          const [database, memory] = await Promise.all([
            checkDatabase(),
            Promise.resolve(checkMemory()),
          ])

          const healthCheck: HealthCheck = {
            status:
              database.status === 'healthy' && memory.status === 'healthy'
                ? 'healthy'
                : 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            checks: {
              database,
              memory,
              system: {
                status: 'healthy',
                nodeVersion: process.version,
                platform: process.platform,
              },
            },
          }

          const statusCode = healthCheck.status === 'healthy' ? 200 : 503

          return applySecurityHeaders(json(healthCheck, { status: statusCode }))
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : 'Unknown error'
          return applySecurityHeaders(
            json(
              {
                status: 'unhealthy',
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

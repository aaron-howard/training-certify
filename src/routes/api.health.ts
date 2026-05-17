import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDb } from '../db/db.server'
import { requireRateLimit } from '../lib/rateLimit.server'
import { handleApiError, withApiMetrics } from '../lib/api-helpers.server'
import { logError } from '../lib/logging.server'
import { metrics } from '../lib/monitoring.server'

export const Route = createFileRoute('/api/health')({
  ssr: true,
  server: {
    handlers: {
      GET: async ({ request }) =>
        withApiMetrics('GET', '/api/health', async () => {
          try {
            // Apply rate limiting (health checks can be abused for DoS)
            // Use IP address or a generic identifier since health checks may not be authenticated
            const clientId =
              request.headers.get('x-forwarded-for')?.split(',')[0] ||
              request.headers.get('x-real-ip') ||
              'unknown'
            await requireRateLimit(`health:${clientId}`, {
              windowMs: 60000, // 1 minute
              maxRequests: 10, // 10 requests per minute per IP
            })

            const db = await getDb()
            const isHealthy = db !== null

            // Try a simple query to verify database connectivity
            let dbStatus = 'unknown'
            let dbError: string | undefined
            if (db) {
              try {
                // Try a simple query using Drizzle
                const { sql } = await import('drizzle-orm')
                await db.execute(sql`SELECT 1`)
                dbStatus = 'connected'
              } catch (error) {
                dbStatus = 'error'
                dbError = error instanceof Error ? error.message : String(error)
                logError(
                  error,
                  { route: 'GET /api/health', check: 'database' },
                  'Database query failed in health check',
                )
              }
            } else {
              dbStatus = 'disconnected'
              dbError = 'Database instance not available'
            }

            // Check environment variables
            const envStatus = {
              databaseUrl: !!process.env.DATABASE_URL,
              clerkSecret: !!process.env.CLERK_SECRET_KEY,
              clerkPublishable: !!process.env.VITE_CLERK_PUBLISHABLE_KEY,
            }

            const allEnvSet = Object.values(envStatus).every(Boolean)

            const statusCode =
              isHealthy && dbStatus === 'connected' && allEnvSet ? 200 : 503
            const isFullyHealthy = statusCode === 200

            return json(
              {
                status: isFullyHealthy ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                checks: {
                  database: {
                    status: dbStatus,
                    healthy: dbStatus === 'connected',
                    error: dbError,
                  },
                  environment: {
                    status: allEnvSet ? 'configured' : 'missing',
                    healthy: allEnvSet,
                    details: envStatus,
                  },
                },
                metrics: metrics.getHealthSummary(),
              },
              { status: statusCode },
            )
          } catch (error) {
            // Health check has special error format, but use handleApiError for consistency
            return handleApiError(error, 'GET /api/health')
          }
        }),
    },
  },
})

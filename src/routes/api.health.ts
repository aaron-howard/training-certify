import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDb } from '../db/db.server'
import { requireRateLimit } from '../lib/rateLimit.server'

export const Route = createFileRoute('/api/health' as any)({
  ssr: true,
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          // Apply rate limiting (health checks can be abused for DoS)
          // Use IP address or a generic identifier since health checks may not be authenticated
          const clientId = request.headers.get('x-forwarded-for')?.split(',')[0] || 
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
              console.error('❌ [Health Check] Database query failed:', error)
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

          const statusCode = isHealthy && dbStatus === 'connected' && allEnvSet ? 200 : 503
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
            },
            { status: statusCode }
          )
        } catch (error) {
          console.error('❌ [Health Check] Unexpected error:', error)
          return json(
            {
              status: 'unhealthy',
              timestamp: new Date().toISOString(),
              error: error instanceof Error ? error.message : String(error),
            },
            { status: 503 }
          )
        }
      },
    },
  },
})

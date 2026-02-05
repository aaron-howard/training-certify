import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDb } from '../db/db.server'

export const Route = createFileRoute('/api/health' as any)({
  ssr: true,
  server: {
    handlers: {
      GET: async () => {
        try {
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

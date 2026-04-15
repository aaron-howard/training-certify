import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { desc } from 'drizzle-orm'
import { getDbOrThrow } from '../db/db.server'
import { auditLogs } from '../db/schema'
import {
  handleApiError,
  setupReadHandler,
  withApiMetrics,
} from '../lib/api-helpers.server'
import { API_ROLE_SETS } from '../lib/roles'
import { CacheTTL, getOrCompute } from '../lib/cache.server'

export const Route = createFileRoute('/api/compliance')({
  server: {
    handlers: {
      GET: async ({ request }) =>
        withApiMetrics('GET', '/api/compliance', async () => {
          try {
            await setupReadHandler(request, {
              allowedRoles: API_ROLE_SETS.adminAuditorExecutive,
            })

            const db = await getDbOrThrow()

            const payload = await getOrCompute(
              'compliance:list',
              CacheTTL.MEDIUM,
              async () => {
                const logs = await db
                  .select()
                  .from(auditLogs)
                  .orderBy(desc(auditLogs.timestamp))
                  .limit(50)
                const totalAudits = logs.length
                const issuesFound = logs.filter(
                  (l) =>
                    l.action.toLowerCase().includes('issue') ||
                    l.action.toLowerCase().includes('failed'),
                ).length

                return {
                  auditLogs: logs.map((l) => ({
                    id: l.id,
                    user: l.userId || 'System',
                    action: l.action,
                    date: l.timestamp,
                    status: 'verified',
                  })),
                  stats: {
                    complianceRate: 98,
                    totalAudits,
                    issuesFound,
                  },
                }
              },
            )

            return json(payload, {
              headers: {
                'Cache-Control': 'private, max-age=120',
              },
            })
          } catch (error) {
            return handleApiError(error, 'GET /api/compliance')
          }
        }),
    },
  },
})

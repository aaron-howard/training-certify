import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDbOrThrow } from '../db/db.server'
import { auditLogs } from '../db/schema'
import { requireRole } from '../lib/auth.server'
import { RateLimitPresets, requireRateLimit } from '../lib/rateLimit.server'
import { AppError } from '../lib/errors'

export const Route = createFileRoute('/api/compliance')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const session = await requireRole(['Admin', 'Auditor', 'Executive'])
          await requireRateLimit(session.userId, RateLimitPresets.READ)

          const db = await getDbOrThrow()

          const logs = await db.select().from(auditLogs).limit(50)
          const totalAudits = logs.length
          const issuesFound = logs.filter(
            (l) =>
              l.action.toLowerCase().includes('issue') ||
              l.action.toLowerCase().includes('failed'),
          ).length

          return json({
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
          })
        } catch (error) {
          if (error instanceof AppError) {
            return json({ error: error.message, code: error.code }, { status: error.statusCode })
          }
          console.error('❌ [API Compliance GET] Unexpected Error:', error)
          return json({ error: 'Internal server error' }, { status: 500 })
        }
      },
    },
  },
})

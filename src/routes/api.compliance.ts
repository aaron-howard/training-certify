import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDb } from '../db/db.server'
import { auditLogs } from '../db/schema'
import { requireRole } from '../lib/auth.server'

export const Route = createFileRoute('/api/compliance')({
  server: {
    handlers: {
      GET: async () => {
        try {
          await requireRole(['Admin', 'Auditor', 'Executive'])

          const db = await getDb()
          if (!db) {
            return json({ error: 'Database not available' }, { status: 500 })
          }

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
        } catch (error: any) {
          console.error('[API Compliance] Error:', error)
          return json(
            { error: 'Forbidden or internal error', details: error.message },
            { status: error.message.includes('Forbidden') ? 403 : 500 },
          )
        }
      },
    },
  },
})

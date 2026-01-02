import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDb } from '../db/db.server'
import {
  teamRequirements,
  teams,
  userCertifications,
  users,
} from '../db/schema'
import { requireRole } from '../lib/auth.server'

export const Route = createFileRoute('/api/dashboard')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const session = await requireRole([
            'Admin',
            'Manager',
            'Auditor',
            'Executive',
            'User',
          ])

          const db = await getDb()
          if (!db) {
            return json(
              {
                error: 'Database not available',
                code: 'DB_UNAVAILABLE',
              },
              { status: 500 },
            )
          }

          const url = new URL(request.url)
          const userIdParam = url.searchParams.get('userId')
          const roleParam = url.searchParams.get('role')

          // Executive view security: Only Admin or Executive
          if (roleParam === 'Executive') {
            if (session.role !== 'Executive' && session.role !== 'Admin') {
              return json(
                { error: 'Forbidden: Executive view required' },
                { status: 403 },
              )
            }

            const allUsers = await db.select().from(users)
            const totalUsers = allUsers.length

            const allUserCerts = await db.select().from(userCertifications)
            const totalCerts = allUserCerts.length

            const activeCertsExec = allUserCerts.filter(
              (c) => c.status === 'active',
            ).length
            const complianceRateExec =
              totalCerts > 0
                ? Math.round((activeCertsExec / totalCerts) * 100)
                : 0

            const allTeams = await db.select().from(teams)
            const allRequirements = await db.select().from(teamRequirements)
            let criticalGaps = 0

            for (const team of allTeams) {
              const teamReqs = allRequirements.filter(
                (r) => r.teamId === team.id,
              )
              if (teamReqs.length === 0) continue
              criticalGaps++
            }

            const vendorMap = new Map()
            for (const cert of allUserCerts) {
              const vendor = cert.vendorName || 'Other'
              if (!vendorMap.has(vendor))
                vendorMap.set(vendor, { total: 0, active: 0 })
              const v = vendorMap.get(vendor)
              v.total++
              if (cert.status === 'active') v.active++
            }

            const vendorBreakdown = Array.from(vendorMap.entries()).map(
              ([name, stats]) => ({
                name,
                compliance: Math.round((stats.active / stats.total) * 100),
              }),
            )

            const expiringSoonExec = allUserCerts.filter(
              (c) => c.status === 'expiring' || c.status === 'expiring-soon',
            ).length

            return json({
              totalUsers,
              totalCerts,
              complianceRate: complianceRateExec,
              criticalGaps,
              vendorBreakdown,
              expiringSoon: expiringSoonExec,
              budgetImpact: '$12,450',
            })
          }

          // Individual/Standard View security
          const effectiveUserId = userIdParam || session.userId

          // Authority check: can you see this user's stats?
          if (effectiveUserId !== session.userId && session.role === 'User') {
            return json({ error: 'Forbidden' }, { status: 403 })
          }

          // TODO: If Manager, check if user is in their team (optional refinement)

          const filteredCerts = await db
            .select()
            .from(userCertifications)
            .where(eq(userCertifications.userId, effectiveUserId))

          const activeCerts = filteredCerts.filter(
            (c) => c.status === 'active',
          ).length
          const expiringSoon = filteredCerts.filter((c) => {
            return c.status === 'expiring' || c.status === 'expiring-soon'
          }).length

          const complianceRate =
            filteredCerts.length > 0
              ? Math.round((activeCerts / filteredCerts.length) * 100)
              : 0

          return json({
            activeCerts,
            expiringSoon,
            complianceRate,
          })
        } catch (error: any) {
          console.error('❌ [API Dashboard GET] Error:', error)
          return json(
            {
              error: 'Forbidden or internal error',
              details: error.message,
            },
            { status: error.message.includes('Forbidden') ? 403 : 500 },
          )
        }
      },
    },
  },
})

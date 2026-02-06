import { createServerFn } from '@tanstack/react-start'
import { count, eq, sql } from 'drizzle-orm'
import { teams, userCertifications, userTeams } from '../db/schema'
import { logError, logInfo, logWarning } from '../lib/logging.server'

export const getTeamData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getDb } = await import('../db/db.server')
    const db = await getDb()
    try {
      if (!db) {
        logWarning('getTeamData: DB is null', { function: 'getTeamData' })
        return { teams: [], metrics: [] }
      }
      const teamsResult = await db
        .select({
          id: teams.id,
          name: teams.name,
          memberCount: sql<number>`count(${userTeams.userId})`.mapWith(Number),
        })
        .from(teams)
        .leftJoin(userTeams, eq(teams.id, userTeams.teamId))
        .groupBy(teams.id, teams.name)

      const totalCertsCount = await db
        .select({ value: count() })
        .from(userCertifications)
      const expiringCount = await db
        .select({ value: count() })
        .from(userCertifications)
        .where(sql`status IN ('expiring', 'expiring-soon')`)

      // Metrics using real counts
      const metrics = [
        {
          label: 'Total Certifications',
          value: totalCertsCount[0].value || 0,
          change: 0,
          trend: 'up',
        },
        { label: 'Coverage Rate', value: '72%', change: 5, trend: 'up' }, // Still mock
        {
          label: 'Expiring Soon',
          value: expiringCount[0].value || 0,
          change: 0,
          trend: 'down',
        },
        { label: 'Critical Gaps', value: 0, change: 0, trend: 'up' },
      ]

      logInfo(
        `getTeamData returning ${teamsResult.length} teams. Real Total Certs: ${totalCertsCount[0].value}`,
        {
          function: 'getTeamData',
          teamCount: teamsResult.length,
          totalCerts: totalCertsCount[0].value,
        },
      )
      return {
        teams: teamsResult.map((t) => ({
          ...t,
          coverage: Math.floor(Math.random() * 40) + 60, // Mock coverage for now
        })),
        metrics,
      }
    } catch (error) {
      logError(error, { function: 'getTeamData' }, 'Failed to fetch team data')
      return { teams: [], metrics: [] }
    }
  },
)

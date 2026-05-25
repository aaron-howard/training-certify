import { eq } from 'drizzle-orm'
import { teams, userTeams } from '../db/schema'
import type { AuthSession } from './auth.server'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type * as schema from '../db/schema'

/**
 * Whether the requester may modify certifications for targetUserId.
 * @see src/routes/api.certifications.ts
 */
export async function checkCertificationAuthority(
  db: NodePgDatabase<typeof schema>,
  requester: AuthSession,
  targetUserId: string,
): Promise<boolean> {
  if (requester.userId === targetUserId) return true
  if (
    requester.role === 'Admin' ||
    requester.role === 'Auditor' ||
    requester.role === 'Executive'
  ) {
    return true
  }

  if (requester.role === 'Manager') {
    const managedTeams = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.managerId, requester.userId))

    if (managedTeams.length > 0) {
      const teamIds = managedTeams.map((t) => t.id)
      const membership = await db
        .select()
        .from(userTeams)
        .where(eq(userTeams.userId, targetUserId))

      return membership.some((m) => teamIds.includes(m.teamId))
    }
  }

  return false
}

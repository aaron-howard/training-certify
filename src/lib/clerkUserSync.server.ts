import { eq } from 'drizzle-orm'
import * as schema from '../db/schema'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

const AVATAR_MAX_LEN = 2048

function truncateAvatar(url: string | undefined): string | undefined {
  if (url == null || url === '') return undefined
  return url.length <= AVATAR_MAX_LEN ? url : url.slice(0, AVATAR_MAX_LEN)
}

/**
 * Insert or resolve a Clerk-backed user row.
 *
 * If `users.email` already exists under a different Clerk `id` (common after Clerk
 * dev resets or account recreation), migrates to the current Clerk id in a transaction:
 * frees the email on the old row, inserts the new `users` row, repoints FKs, deletes
 * the old row. This avoids updating `users.id` in place, which fails when child FKs
 * still use ON UPDATE NO ACTION (before migration 0007) or in edge cases with
 * composite keys.
 */
export async function upsertUserFromClerkProfile(
  db: NodePgDatabase<typeof schema>,
  data: {
    id: string
    name: string
    email: string
    avatarUrl?: string
  },
) {
  const {
    users,
    userCertifications,
    notifications,
    auditLogs,
    userTeams,
    teams,
  } = schema
  const avatarUrl = truncateAvatar(data.avatarUrl)

  const byId = await db
    .select()
    .from(users)
    .where(eq(users.id, data.id))
    .limit(1)
  if (byId[0]) return byId[0]

  const byEmail = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(2)

  if (byEmail.length > 1) {
    throw new Error(
      'Multiple database users share this email; resolve duplicates manually.',
    )
  }

  if (byEmail[0]) {
    const old = byEmail[0]
    if (old.id === data.id) return old

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ email: `${data.email}_migrated_${Date.now()}` })
        .where(eq(users.id, old.id))

      await tx.insert(users).values({
        id: data.id,
        name: data.name,
        email: data.email,
        avatarUrl: avatarUrl ?? old.avatarUrl ?? null,
        role: old.role,
      })

      await tx
        .update(userCertifications)
        .set({ userId: data.id })
        .where(eq(userCertifications.userId, old.id))
      await tx
        .update(userCertifications)
        .set({ assignedById: data.id })
        .where(eq(userCertifications.assignedById, old.id))

      await tx
        .update(notifications)
        .set({ userId: data.id })
        .where(eq(notifications.userId, old.id))

      await tx
        .update(auditLogs)
        .set({ userId: data.id })
        .where(eq(auditLogs.userId, old.id))

      await tx
        .update(userTeams)
        .set({ userId: data.id })
        .where(eq(userTeams.userId, old.id))

      await tx
        .update(teams)
        .set({ managerId: data.id })
        .where(eq(teams.managerId, old.id))

      await tx.delete(users).where(eq(users.id, old.id))
    })

    const after = await db
      .select()
      .from(users)
      .where(eq(users.id, data.id))
      .limit(1)
    if (!after[0]) {
      throw new Error('Failed to relink Clerk user id after matching by email')
    }
    return after[0]
  }

  const [inserted] = await db
    .insert(users)
    .values({
      id: data.id,
      name: data.name,
      email: data.email,
      avatarUrl,
      role: 'User',
    })
    .returning()

  return inserted
}

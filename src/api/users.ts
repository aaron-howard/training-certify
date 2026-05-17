import { createServerFn } from '@tanstack/react-start'

export const ensureUser = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { id: string; name: string; email: string; avatarUrl?: string }) =>
      data,
  )
  .handler(async ({ data }) => {
    const { eq } = await import('drizzle-orm')
    const { users } = await import('../db/schema')
    const { getVerifiedAuth } = await import('../lib/auth.server')
    const { logError } = await import('../lib/logging.server')
    const { getDb, instanceId } = await import('../db/db.server')

    const authenticatedId = await getVerifiedAuth()
    if (authenticatedId !== data.id) {
      throw new Error('Unauthorized: Cannot ensure a different user')
    }

    const db = await getDb()
    if (!db)
      throw new Error(`Database not available (Server Instance: ${instanceId})`)

    try {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.id, data.id))
        .limit(1)

      if (existing.length > 0) {
        return existing[0]
      }

      const result = await db
        .insert(users)
        .values({
          id: data.id,
          name: data.name,
          email: data.email,
          avatarUrl: data.avatarUrl,
          role: 'User',
        })
        .returning()

      return result[0]
    } catch (error) {
      logError(
        error,
        { function: 'ensureUser', userId: data.id },
        'Failed to ensure user',
      )
      throw error
    }
  })

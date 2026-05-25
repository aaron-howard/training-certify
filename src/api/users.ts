import { createServerFn } from '@tanstack/react-start'

export const ensureUser = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { id: string; name: string; email: string; avatarUrl?: string }) =>
      data,
  )
  .handler(async ({ data }) => {
    const { getVerifiedAuth } = await import('../lib/auth.server')
    const { logError } = await import('../lib/logging.server')
    const { getDb, instanceId } = await import('../db/db.server')
    const { upsertUserFromClerkProfile } =
      await import('../lib/clerkUserSync.server')

    const authenticatedId = await getVerifiedAuth()
    if (authenticatedId !== data.id) {
      throw new Error('Unauthorized: Cannot ensure a different user')
    }

    const db = await getDb()
    if (!db)
      throw new Error(`Database not available (Server Instance: ${instanceId})`)

    try {
      return await upsertUserFromClerkProfile(db, data)
    } catch (error) {
      logError(
        error,
        { function: 'ensureUser', userId: data.id },
        'Failed to ensure user',
      )
      throw error
    }
  })

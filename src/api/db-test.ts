import { createServerFn } from '@tanstack/react-start'

export const testDbConnection = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { users } = await import('../db/schema')
    const { getDb } = await import('../db/db.server')
    const { logError } = await import('../lib/logging.server')

    const db = await getDb()
    if (!db) {
      return { success: false, error: 'Database not available' }
    }

    try {
      const result = await db.select().from(users).limit(1)
      return { success: true, count: result.length }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      logError(error, { context: 'db-test' }, 'Database connection failed')
      return { success: false, error: errorMessage }
    }
  },
)

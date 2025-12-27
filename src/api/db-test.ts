import { createServerFn } from '@tanstack/react-start'
import { users } from '../db/schema'

export const testDbConnection = createServerFn({ method: 'GET' })
    .handler(async () => {
        const { getDb } = await import('../db/index.server');
        const db = await getDb()
        if (!db) {
            return { success: false, error: 'Database not available' }
        }
        try {
            const result = await db.select().from(users).limit(1);
            return { success: true, count: result.length };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Database connection failed:', error);
            return { success: false, error: errorMessage };
        }
    })

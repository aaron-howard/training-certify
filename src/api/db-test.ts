import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { users } from '../db/schema'

export const testDbConnection = createServerFn({ method: 'GET' })
    .handler(async () => {
        try {
            const result = await db.select().from(users).limit(1);
            return { success: true, count: result.length };
        } catch (error: any) {
            console.error('Database connection failed:', error);
            return { success: false, error: error.message };
        }
    })

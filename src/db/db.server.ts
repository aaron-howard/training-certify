// src/db/index.server.ts
import * as schema from './schema';
import { ENV, envReady } from '../lib/env';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

// Prevent multiple instances in development using globalThis
const globalForDb = globalThis as unknown as {
    db: NodePgDatabase<typeof schema> | undefined;
    initPromise: Promise<NodePgDatabase<typeof schema> | null> | undefined;
};

const isServer = typeof window === 'undefined' || !!(import.meta as any).env?.SSR;
const instanceId = Math.random().toString(36).substring(7);

if (isServer) {
    console.log(`🔌 [DB Module] Server-side instance ${instanceId} loaded`);
}

async function initializeDb() {
    if (globalForDb.db) return globalForDb.db;

    try {
        await envReady;

        const url = ENV.DATABASE_URL || process.env.DATABASE_URL;

        if (!url) {
            console.error(`❌ [DB Init] Instance ${instanceId} - No DATABASE_URL found.`);
            return null;
        }

        const { Pool } = await import('pg');
        const { drizzle } = await import('drizzle-orm/node-postgres');

        const pool = new Pool({
            connectionString: url,
            max: parseInt(process.env.DB_POOL_SIZE || '10', 10),
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });

        // Test connection
        const client = await pool.connect();
        console.log(`✅ [DB Init] Instance ${instanceId} - Successfully connected to PostgreSQL`);
        client.release();

        globalForDb.db = drizzle(pool, { schema });
        return globalForDb.db;
    } catch (error: unknown) {
        console.error(`❌ [DB Init] Instance ${instanceId} - Critical failure:`, error);
        return null;
    }
}

/** Async helper to obtain the DB instance. */
export const getDb = async (): Promise<NodePgDatabase<typeof schema> | null> => {
    if (globalForDb.db) return globalForDb.db;

    if (isServer) {
        if (globalForDb.initPromise) {
            const result = await globalForDb.initPromise;
            if (result) return result;
            globalForDb.initPromise = undefined;
        }

        globalForDb.initPromise = initializeDb();
        return await globalForDb.initPromise;
    }

    return null;
};

export const db = globalForDb.db;
export { instanceId };

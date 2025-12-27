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
    console.log(`🔌 [DB Module] Server-side instance ${instanceId} loaded. Window: ${typeof window}, SSR: ${(import.meta as any).env?.SSR}`);
} else {
    console.warn(`⚠️ [DB Module] Client-side instance ${instanceId} loaded? Window: ${typeof window}, SSR: ${(import.meta as any).env?.SSR}`);
}

async function initializeDb() {
    if (globalForDb.db) return globalForDb.db;

    try {
        await envReady;

        // Explicit fallback for local development if ENV fails
        const url = ENV.DATABASE_URL || process.env.DATABASE_URL || 'postgresql://postgres:Teamwork1@localhost:5433/devdb';

        if (!url) {
            console.error(`❌ [DB Init] Instance ${instanceId} - No DATABASE_URL found.`);
            return null;
        }

        const { Pool } = await import('pg');
        const { drizzle } = await import('drizzle-orm/node-postgres');

        const pool = new Pool({
            connectionString: url,
            max: parseInt(process.env.DB_POOL_SIZE || '2', 10), // Reduced pool size to prevent exhaustion during dev/HMR
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });

        // Test connection
        const client = await pool.connect();
        console.log(`✅ [DB Init] Instance ${instanceId} - Successfully connected to PostgreSQL (Pool Size: ${pool.totalCount})`);
        client.release();

        globalForDb.db = drizzle(pool, { schema });
        return globalForDb.db;
    } catch (error: any) {
        console.error(`❌ [DB Init] Instance ${instanceId} - Critical failure:`, error.message, error.stack);
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

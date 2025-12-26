// src/db/index.ts
import * as schema from './schema';
import { ENV } from '../lib/env';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

const isServer = typeof window === 'undefined';

let db: NodePgDatabase<typeof schema> | null = null;
let initPromise: Promise<NodePgDatabase<typeof schema> | null> | null = null;

async function initializeDb() {
    if (db) return db;

    try {
        console.log('🚀 [DB Init] Starting initialization...');

        // 1. Resolve URL
        let url = ENV.DATABASE_URL;
        if (!url && isServer) {
            // Try process.env directly
            url = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
        }

        // 2. If still no URL, try to load from .env manually if on server
        if (!url && isServer) {
            try {
                const { config } = await import('dotenv');
                const result = config();
                url = result.parsed?.DATABASE_URL || result.parsed?.VITE_DATABASE_URL || process.env.DATABASE_URL;
                console.log('📎 [DB Init] Loaded .env via dotenv, URL found:', !!url);
            } catch (e) {
                console.error('⚠️ [DB Init] Failed to load dotenv:', e);
            }
        }

        if (!url) {
            console.error('❌ [DB Init] No DATABASE_URL found in ENV, process.env, or .env file');
            return null;
        }

        // 3. Import DB drivers dynamically
        const { Pool } = await import('pg');
        const { drizzle } = await import('drizzle-orm/node-postgres');

        // 4. Create Pool and Drizzle instance
        const pool = new Pool({
            connectionString: url,
            // Add some basic connection settings for stability
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });

        // Test connection
        const client = await pool.connect();
        console.log('✅ [DB Init] Successfully connected to PostgreSQL');
        client.release();

        db = drizzle(pool, { schema });
        console.log('✅ [DB Init] Drizzle ORM initialized');
        return db;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ [DB Init] Critical failure during initialization:', errorMessage);
        return null;
    }
}

// Automatically start init on the server
if (isServer) {
    initPromise = initializeDb();
}

/** Async helper to obtain the DB instance. */
export const getDb = async (): Promise<NodePgDatabase<typeof schema> | null> => {
    if (db) return db;
    if (isServer) {
        if (!initPromise) initPromise = initializeDb();
        return await initPromise;
    }
    return null;
};

export { db };

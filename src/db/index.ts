// src/db/index.ts
import * as schema from './schema';
import { ENV, envReady } from '../lib/env';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

const isServer = typeof window === 'undefined';

let db: NodePgDatabase<typeof schema> | null = null;
let initPromise: Promise<NodePgDatabase<typeof schema> | null> | null = null;

async function initializeDb() {
    // If we already have a functional DB, return it
    if (db) return db;

    try {
        console.log('🚀 [DB Init] Starting initialization...');
        await envReady;

        // 1. Resolve URL
        let url = ENV.DATABASE_URL;
        console.log('📎 [DB Init] Initial URL from ENV:', url ? 'FOUND' : 'MISSING');

        if (!url && isServer) {
            // Try process.env directly
            url = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
            console.log('📎 [DB Init] URL from process.env:', url ? 'FOUND' : 'MISSING');
        }

        // 2. If still no URL, try to load from .env manually if on server
        if (!url && isServer) {
            try {
                const { config } = await import('dotenv');
                const result = config();
                url = result.parsed?.DATABASE_URL || result.parsed?.VITE_DATABASE_URL || process.env.DATABASE_URL;
                console.log('📎 [DB Init] URL after dotenv config:', url ? 'FOUND' : 'MISSING');
            } catch (e) {
                console.error('⚠️ [DB Init] Failed to load dotenv:', e);
            }
        }

        if (!url) {
            console.error('❌ [DB Init] No DATABASE_URL found. Environment check:', {
                DATABASE_URL: !!process.env.DATABASE_URL,
                VITE_DATABASE_URL: !!process.env.VITE_DATABASE_URL,
                ENV_URL: !!ENV.DATABASE_URL
            });
            return null;
        }

        console.log('📎 [DB Init] Using URL:', url.split('@')[1] || 'URL present but hidden');

        // 3. Import DB drivers dynamically
        const { Pool } = await import('pg');
        const { drizzle } = await import('drizzle-orm/node-postgres');

        // 4. Create Pool and Drizzle instance
        const pool = new Pool({
            connectionString: url,
            max: parseInt(process.env.DB_POOL_SIZE || '1', 10),
            idleTimeoutMillis: 10000,
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

/** Async helper to obtain the DB instance. */
export const getDb = async (): Promise<NodePgDatabase<typeof schema> | null> => {
    // If we have a DB, return it.
    if (db) return db;

    // If on server, ensure we try to initialize.
    if (isServer) {
        // If we have a pending promise, wait for it.
        if (initPromise) {
            const result = await initPromise;
            // If the pending promise resulted in success, return it.
            if (result) return result;
            // If it failed (returned null), clear it so we can try again.
            initPromise = null;
        }

        // Try to initialize (or re-initialize if it was cleared)
        initPromise = initializeDb();
        const result = await initPromise;
        return result;
    }
    return null;
};

export { db };

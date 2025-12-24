import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const isServer = typeof window === 'undefined';

function getDatabaseUrl() {
    if (!isServer) return null;

    // Check various env sources
    const url = process.env.DATABASE_URL || (import.meta as any).env?.DATABASE_URL;

    if (url) return url;

    // Try to load from .env file locally if on server
    try {
        // We use a dynamic import here to avoid bundling dotenv in the client
        // but since this is a server-only path it's safe.
        // However, in Vite, we might need a more direct approach.
    } catch (e) { }

    return null;
}

const dbUrl = getDatabaseUrl();

if (isServer && !dbUrl) {
    console.warn('⚠️ DATABASE_URL is not set. Database features will fail.');
}

export const db = (isServer && dbUrl)
    ? drizzle(neon(dbUrl), { schema })
    : new Proxy({}, {
        get() {
            throw new Error('Database accessed on the client or DATABASE_URL is missing. Check your server environment variables.');
        }
    }) as any;

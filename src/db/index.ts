import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const isServer = typeof window === 'undefined';

function getDatabaseUrl() {
    if (!isServer) return null;

    // Check multiple environment sources
    return (import.meta as any).env?.DATABASE_URL ||
        process.env.DATABASE_URL ||
        (import.meta as any).env?.VITE_DATABASE_URL;
}

const dbUrl = getDatabaseUrl();

if (isServer && !dbUrl) {
    console.warn('⚠️ DATABASE_URL is MISSING. Remote data features will fail.');
}

export const db = (isServer && dbUrl)
    ? drizzle(neon(dbUrl), { schema })
    : null;

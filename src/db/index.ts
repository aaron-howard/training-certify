import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const isServer = typeof window === 'undefined';

function getDatabaseUrl() {
    // ONLY check for DB URL on server
    if (!isServer) return null;

    // Check process.env first (standard Node/Nitro)
    let url = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;

    // Check import.meta.env (Vite dev server)
    if (!url) {
        url = (import.meta as any).env?.DATABASE_URL || (import.meta as any).env?.VITE_DATABASE_URL;
    }

    return url;
}

const dbUrl = getDatabaseUrl();

// Diagnostic logging - strictly server-side to avoid leaking info to client consoles in prod
// (Though TanStack dev console might catch it)
if (isServer) {
    console.log('⚙️ [Server DB Init]', {
        hasDbUrl: !!dbUrl,
        urlPrefix: dbUrl ? dbUrl.substring(0, 15) : 'none',
        envKeys: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('CLERK'))
    });
}

export const db = (isServer && dbUrl)
    ? drizzle(neon(dbUrl), { schema })
    : null;

if (isServer && !db) {
    const errorMsg = '❌ [Server DB] FATAL: Database connection could not be initialized. DATABASE_URL is missing.';
    console.error(errorMsg);
}

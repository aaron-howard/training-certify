import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const isServer = typeof window === 'undefined';

function getDatabaseUrl() {
    if (!isServer) return null;

    // Check multiple environment sources
    let url = (import.meta as any).env?.DATABASE_URL ||
        process.env.DATABASE_URL ||
        (import.meta as any).env?.VITE_DATABASE_URL ||
        process.env.VITE_DATABASE_URL;

    // Last resort for local dev: try reading .env.local file directly
    if (!url) {
        try {
            // Using a dynamic require/import-like approach that is safe for Node
            const fs = typeof require !== 'undefined' ? require('fs') : null;
            if (fs && fs.existsSync('.env.local')) {
                const content = fs.readFileSync('.env.local', 'utf8');
                const match = content.match(/DATABASE_URL=["']?(.+?)["']?(\s|$)/m);
                if (match) url = match[1];
            }
        } catch (e) { }
    }

    console.log('🔍 [Server] DATABASE_URL Check:', {
        hasUrl: !!url,
        urlPrefix: url ? url.substring(0, 15) : 'none'
    });

    return url;
}

const dbUrl = getDatabaseUrl();

if (isServer && !dbUrl) {
    console.warn('⚠️ DATABASE_URL is MISSING. Remote data features will fail.');
}

export const db = (isServer && dbUrl)
    ? drizzle(neon(dbUrl), { schema })
    : null;

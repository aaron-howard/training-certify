// src/db/index.ts
import * as schema from './schema';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ENV } from '../lib/env';

const isServer = typeof window === 'undefined';

/** Resolve DATABASE_URL from ENV or .env files. */
function getDatabaseUrl(): string | undefined {
    if (!isServer) return undefined;
    let url = ENV.DATABASE_URL;
    if (!url) {
        const envFiles = ['.env.local', '.env'];
        for (const file of envFiles) {
            try {
                const fullPath = path.resolve(process.cwd(), file);
                if (fs.existsSync(fullPath)) {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const lines = content.split(/\r?\n/);
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed.startsWith('DATABASE_URL=') || trimmed.startsWith('VITE_DATABASE_URL=')) {
                            const value = trimmed.split('=')[1]?.replace(/["']/g, '').trim();
                            if (value) {
                                url = value;
                                console.log(`📎 [DB Init] Found URL in ${file} via manual line parse`);
                                break;
                            }
                        }
                    }
                    if (url) break;
                }
            } catch { }
        }
    }
    return url;
}

let db: any = null;
let initPromise: Promise<any> | null = null;

if (isServer) {
    initPromise = (async () => {
        const { Pool } = await import('pg');
        const { drizzle } = await import('drizzle-orm/node-postgres');
        const dbUrl = getDatabaseUrl();
        if (dbUrl) {
            db = drizzle(new Pool({ connectionString: dbUrl }), { schema });
        }
        console.log('⚙️ [DB Init]', {
            hasDbUrl: !!dbUrl,
            urlPrefix: dbUrl ? dbUrl.substring(0, 20) + '...' : 'none',
        });
        return db;
    })();
}

/** Async helper to obtain the DB instance. */
export const getDb = async (): Promise<any> => {
    if (db) return db;
    if (initPromise) await initPromise;
    return db;
};

export { db };

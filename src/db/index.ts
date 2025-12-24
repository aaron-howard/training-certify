import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import * as fs from 'node:fs';
import * as path from 'node:path';

const isServer = typeof window === 'undefined';

function getDatabaseUrl() {
    if (!isServer) return null;

    // 1. Try standard process.env
    let url = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;

    // 2. Try import.meta.env (Vite dev)
    if (!url && (import.meta as any).env) {
        url = (import.meta as any).env.DATABASE_URL || (import.meta as any).env.VITE_DATABASE_URL;
    }

    // 3. Last resort: Manual file read (useful for some Windows dev environments where env injection is flaky)
    if (!url) {
        const envFiles = ['.env.local', '.env'];
        for (const file of envFiles) {
            try {
                const fullPath = path.resolve(process.cwd(), file);
                if (fs.existsSync(fullPath)) {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    // More lenient regex: allows spaces around =, handles CRLF/LF, etc.
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
            } catch (e) {
                // Ignore FS errors
            }
        }
    }

    return url;
}

const dbUrl = getDatabaseUrl();

if (isServer) {
    console.log('⚙️ [Server DB Init]', {
        hasDbUrl: !!dbUrl,
        urlPrefix: dbUrl ? dbUrl.substring(0, 20) + '...' : 'none',
        cwd: process.cwd(),
        nodeVersion: process.version
    });
}

export const db = (isServer && dbUrl)
    ? drizzle(neon(dbUrl), { schema })
    : null;

if (isServer && !db) {
    console.warn('❌ [Server DB] FATAL: Database initialization failed. Check your DATABASE_URL in .env');
}

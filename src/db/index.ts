import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ENV } from '../lib/env';

const isServer = typeof window === 'undefined';

function getDatabaseUrl() {
    if (!isServer) return null;

    // 1. Try centralized ENV (handles process.env and import.meta.env)
    let url = ENV.DATABASE_URL;

    // 2. Manual file read fallback (only on server if first check failed)
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
            } catch (e) { }
        }
    }

    return url;
}

const dbUrl = getDatabaseUrl();

if (isServer) {
    console.log('⚙️ [DB Init]', {
        hasDbUrl: !!dbUrl,
        urlPrefix: dbUrl ? dbUrl.substring(0, 20) + '...' : 'none',
    });
}

export const db = (isServer && dbUrl)
    ? drizzle(neon(dbUrl), { schema })
    : null;

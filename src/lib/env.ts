// src/lib/env.ts
const isServer = typeof window === 'undefined';

interface EnvType {
    isServer: boolean;
    DATABASE_URL: string | undefined;
    CLERK_PUBLISHABLE_KEY: string | undefined;
    CLERK_SECRET_KEY: string | undefined;
    // Add other keys as needed
}

// Global cache to store the *result* of the parsing, not the object itself.
// This ensures that even if module instances are different, they can fetch the same data.
const globalForEnv = globalThis as unknown as {
    parsedEnv: Record<string, string> | undefined;
    envLoadingPromise: Promise<Record<string, string>> | undefined;
};

// Initialize the local ENV object for this module instance
export const ENV: EnvType = {
    isServer,
    DATABASE_URL: undefined,
    CLERK_PUBLISHABLE_KEY: undefined,
    CLERK_SECRET_KEY: undefined,
};

// Client-side hydration
if (!isServer && typeof window !== 'undefined' && (window as any).__ENV__) {
    Object.assign(ENV, (window as any).__ENV__);
}

export const envReady = isServer ? (async () => {
    // 1. If we already have parsed data globally, populate this instance and return.
    if (globalForEnv.parsedEnv) {
        Object.assign(ENV, globalForEnv.parsedEnv);
        return;
    }

    // 2. If a load is in progress, wait for it, then populate.
    if (globalForEnv.envLoadingPromise) {
        const result = await globalForEnv.envLoadingPromise;
        Object.assign(ENV, result);
        return;
    }

    // 3. Otherwise, perform the load.
    globalForEnv.envLoadingPromise = (async () => {
        const processEnv = process.env;
        const loaded: Record<string, string> = {};

        // A. Process Env Vars
        let dbSource = 'fallback';
        if (processEnv.DATABASE_URL || processEnv.VITE_DATABASE_URL) {
            loaded.DATABASE_URL = (processEnv.DATABASE_URL || processEnv.VITE_DATABASE_URL) as string;
            dbSource = 'process.env';
        }

        // Clerk Key Search
        loaded.CLERK_PUBLISHABLE_KEY =
            processEnv.CLERK_PUBLISHABLE_KEY ||
            processEnv.VITE_CLERK_PUBLISHABLE_KEY ||
            processEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
            '';

        loaded.CLERK_SECRET_KEY =
            processEnv.CLERK_SECRET_KEY ||
            processEnv.VITE_CLERK_SECRET_KEY ||
            '';

        // B. File Fallback (.env.local, .env)
        if (!loaded.DATABASE_URL || !loaded.CLERK_PUBLISHABLE_KEY || !loaded.CLERK_SECRET_KEY) {
            try {
                const fs = await import('node:fs');
                const path = await import('node:path');
                const envFiles = ['.env.local', '.env'];

                for (const file of envFiles) {
                    const searchPaths = [
                        path.resolve(process.cwd(), file),
                        path.resolve(process.cwd(), '..', file)
                    ];

                    for (const filePath of searchPaths) {
                        if (fs.existsSync(filePath)) {
                            const content = fs.readFileSync(filePath, 'utf-8');
                            const lines = content.split(/\r?\n/);
                            for (const line of lines) {
                                const trimmed = line.trim();
                                if (!trimmed || trimmed.startsWith('#')) continue;
                                const match = trimmed.match(/^([^=]+)=(.*)$/);
                                if (match) {
                                    const key = match[1].trim();
                                    const val = match[2].trim().replace(/^["']|["']$/g, '');

                                    if (!loaded.DATABASE_URL && (key === 'DATABASE_URL' || key === 'VITE_DATABASE_URL')) {
                                        loaded.DATABASE_URL = val;
                                        dbSource = file;
                                    }
                                    if (!loaded.CLERK_PUBLISHABLE_KEY && (key === 'CLERK_PUBLISHABLE_KEY' || key === 'VITE_CLERK_PUBLISHABLE_KEY')) loaded.CLERK_PUBLISHABLE_KEY = val;
                                    if (!loaded.CLERK_SECRET_KEY && (key === 'CLERK_SECRET_KEY' || key === 'VITE_CLERK_SECRET_KEY')) loaded.CLERK_SECRET_KEY = val;
                                }
                            }
                            // If we found a file and loaded something, we can stop for this specific filename type? 
                            // Actually, let's keep it simple: any found file contributes.
                        }
                    }
                }
            } catch (e) {
                console.error('⚠️ [ENV] Failed during dynamic parsing:', e);
            }
        }

        // C. Final Fallback (Hardcoded for local dev)
        if (!loaded.DATABASE_URL) {
            console.warn('⚠️ [ENV] DATABASE_URL not found. Using local fallback.');
            loaded.DATABASE_URL = 'postgresql://postgres:password@127.0.0.1:5433/devdb';
        }

        try {
            const url = new URL(loaded.DATABASE_URL);
            console.log('💎 [ENV Final]', {
                source: dbSource,
                db: '✅ ok',
                host: url.hostname,
                port: url.port ? url.port : '5432 (default)',
                dbName: url.pathname
            });
        } catch (e) {
            console.log('💎 [ENV Final]', {
                source: dbSource,
                db: loaded.DATABASE_URL ? '✅ ok' : '❌ missing',
                parseError: 'Failed to parse URL'
            });
        }

        return loaded;
    })();

    // Await the promise we just created (or found) and populate local ENV
    const result = await globalForEnv.envLoadingPromise;
    globalForEnv.parsedEnv = result; // Cache result
    Object.assign(ENV, result); // Update THIS instance

})() : Promise.resolve();

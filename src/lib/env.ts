// src/lib/env.ts
const isServer = typeof window === 'undefined';

interface EnvType {
    isServer: boolean;
    DATABASE_URL: string | undefined;
    CLERK_PUBLISHABLE_KEY: string | undefined;
    CLERK_SECRET_KEY: string | undefined;
}

const globalForEnv = globalThis as unknown as {
    ENV: EnvType | undefined;
    envReady: Promise<void> | undefined;
};

export const ENV: EnvType = globalForEnv.ENV || {
    isServer,
    DATABASE_URL: undefined,
    CLERK_PUBLISHABLE_KEY: (import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY ?? (import.meta as any).env?.CLERK_PUBLISHABLE_KEY as string | undefined,
    CLERK_SECRET_KEY: undefined,
};

if (isServer && !globalForEnv.ENV) {
    globalForEnv.ENV = ENV;
}

export const envReady = isServer ? (globalForEnv.envReady || (globalForEnv.envReady = (async () => {
    const processEnv = process.env;

    // Primary check: standard environment variables
    ENV.DATABASE_URL = processEnv.DATABASE_URL || processEnv.VITE_DATABASE_URL;

    // Check all possible variants for Publishable Key
    ENV.CLERK_PUBLISHABLE_KEY =
        processEnv.CLERK_PUBLISHABLE_KEY ||
        processEnv.VITE_CLERK_PUBLISHABLE_KEY ||
        processEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
        ENV.CLERK_PUBLISHABLE_KEY;

    // Check all possible variants for Secret Key
    ENV.CLERK_SECRET_KEY =
        processEnv.CLERK_SECRET_KEY ||
        processEnv.VITE_CLERK_SECRET_KEY;

    try {
        // Fallback: Manually parse .env files if variables are missing
        if (!ENV.DATABASE_URL || !ENV.CLERK_PUBLISHABLE_KEY || !ENV.CLERK_SECRET_KEY) {
            const fs = await import('node:fs');
            const path = await import('node:path');
            const envFiles = ['.env.local', '.env'];

            for (const file of envFiles) {
                const fullPath = path.resolve(process.cwd(), file);
                if (fs.existsSync(fullPath)) {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const lines = content.split(/\r?\n/);
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed.startsWith('#')) continue;

                        const match = trimmed.match(/^([^=]+)=(.*)$/);
                        if (match) {
                            const key = match[1].trim();
                            const val = match[2].trim().replace(/["']/g, '');

                            // Database URL
                            if (!ENV.DATABASE_URL && (key === 'DATABASE_URL' || key === 'VITE_DATABASE_URL')) {
                                ENV.DATABASE_URL = val;
                            }

                            // Publishable Key
                            if (!ENV.CLERK_PUBLISHABLE_KEY &&
                                (key === 'CLERK_PUBLISHABLE_KEY' ||
                                    key === 'VITE_CLERK_PUBLISHABLE_KEY' ||
                                    key === 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY' ||
                                    key === 'REACT_APP_CLERK_PUBLISHABLE_KEY')) {
                                ENV.CLERK_PUBLISHABLE_KEY = val;
                            }

                            // Secret Key
                            if (!ENV.CLERK_SECRET_KEY &&
                                (key === 'CLERK_SECRET_KEY' ||
                                    key === 'VITE_CLERK_SECRET_KEY')) {
                                ENV.CLERK_SECRET_KEY = val;
                            }
                        }
                    }
                }
                if (ENV.DATABASE_URL && ENV.CLERK_PUBLISHABLE_KEY && ENV.CLERK_SECRET_KEY) break;
            }
        }

        // Final Fallback for Local Development
        if (!ENV.DATABASE_URL) {
            console.warn('⚠️ [ENV] DATABASE_URL not found in environment or files. Using local Docker default.');
            ENV.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/devdb';
        }
    } catch (e) {
        console.error('⚠️ [ENV] Failed during dynamic parsing:', e);
    }

    console.log('💎 [ENV Final]', {
        db: ENV.DATABASE_URL ? '✅ ok' : '❌ missing',
        clerkPk: ENV.CLERK_PUBLISHABLE_KEY ? '✅ ok' : '❌ missing',
        clerkSk: ENV.CLERK_SECRET_KEY ? '✅ ok' : '❌ missing',
        cwd: process.cwd(),
    });
})())) : (() => {
    // Client-side: Try to pick up injected environment variables
    if (typeof window !== 'undefined' && (window as any).__ENV__) {
        Object.assign(ENV, (window as any).__ENV__);
    }
    return Promise.resolve();
})();

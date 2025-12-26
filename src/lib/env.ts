const isServer = typeof window === 'undefined';

export const ENV = {
    isServer,
    DATABASE_URL: undefined as string | undefined,
    CLERK_PUBLISHABLE_KEY: (import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY ?? (import.meta as any).env?.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string | undefined,
    CLERK_SECRET_KEY: undefined as string | undefined,
};

if (isServer) {
    const processEnv = process.env;
    ENV.DATABASE_URL = processEnv.DATABASE_URL || processEnv.VITE_DATABASE_URL;
    ENV.CLERK_PUBLISHABLE_KEY = processEnv.CLERK_PUBLISHABLE_KEY || processEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || processEnv.VITE_CLERK_PUBLISHABLE_KEY || ENV.CLERK_PUBLISHABLE_KEY;
    ENV.CLERK_SECRET_KEY = processEnv.CLERK_SECRET_KEY || processEnv.VITE_CLERK_SECRET_KEY;

    try {
        // Use dynamic imports with server-only check to prevent bundler from including
        // Node.js modules in client bundle. Vite will externalize these automatically.
        if (!ENV.DATABASE_URL || !ENV.CLERK_PUBLISHABLE_KEY) {
            // Dynamic imports are only executed on server, so bundler won't include
            // these modules in client bundle
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

                        // Use regex to catch "KEY = VALUE", "KEY=VALUE", etc.
                        const match = trimmed.match(/^([^=]+)=(.*)$/);
                        if (match) {
                            const key = match[1].trim();
                            const val = match[2].trim().replace(/["']/g, '');

                            if (!ENV.DATABASE_URL && (key === 'DATABASE_URL' || key === 'VITE_DATABASE_URL')) {
                                ENV.DATABASE_URL = val;
                            }
                            if (!ENV.CLERK_PUBLISHABLE_KEY && (key === 'CLERK_PUBLISHABLE_KEY' || key === 'VITE_CLERK_PUBLISHABLE_KEY' || key === 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')) {
                                ENV.CLERK_PUBLISHABLE_KEY = val;
                            }
                            if (!ENV.CLERK_SECRET_KEY && (key === 'CLERK_SECRET_KEY' || key === 'VITE_CLERK_SECRET_KEY')) {
                                ENV.CLERK_SECRET_KEY = val;
                            }
                        }
                    }
                }
                if (ENV.DATABASE_URL && ENV.CLERK_PUBLISHABLE_KEY) break;
            }
        }
    } catch (e) {
        // Fallback for non-node environments
    }

    console.log('💎 [ENV Final]', {
        db: ENV.DATABASE_URL ? '✅ ok' : '❌ missing',
        clerkPk: ENV.CLERK_PUBLISHABLE_KEY ? '✅ ok' : '❌ missing',
        clerkSk: ENV.CLERK_SECRET_KEY ? '✅ ok' : '❌ missing',
    });
}

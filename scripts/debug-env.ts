import { ENV } from '../src/lib/env';

async function debugEnv() {
    console.log('--- Environment Debug ---');
    console.log('CWD:', process.cwd());
    console.log('ENV.DATABASE_URL:', ENV.DATABASE_URL ? 'PRESENT' : 'MISSING');
    console.log('process.env.DATABASE_URL:', process.env.DATABASE_URL ? 'PRESENT' : 'MISSING');

    // Check files directly
    const fs = await import('node:fs');
    const path = await import('node:path');

    ['.env', '.env.local'].forEach(file => {
        const fullPath = path.resolve(process.cwd(), file);
        const exists = fs.existsSync(fullPath);
        console.log(`${file} exists at ${fullPath}: ${exists}`);
    });

    console.log('ENV Final State:', JSON.stringify(ENV, null, 2));
}

debugEnv().catch(console.error);

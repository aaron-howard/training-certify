import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const isServer = typeof window === 'undefined';

if (isServer && !process.env.DATABASE_URL) {
    // Only try to load dotenv on server if URL is missing
    try {
        const { config } = await import('dotenv');
        config();
    } catch (e) {
        // dotenv might not be available in all production environments, which is fine
    }
}

if (isServer && !process.env.DATABASE_URL) {
    console.error('DATABASE_URL is MISSING on the server');
}

export const db = isServer && process.env.DATABASE_URL
    ? drizzle(neon(process.env.DATABASE_URL), { schema })
    : (null as any);

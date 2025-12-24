import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is MISSING');
    throw new Error('DATABASE_URL must be set');
}

console.log('Initializing Neon connection with URL starting with:', process.env.DATABASE_URL.substring(0, 15) + '...');
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

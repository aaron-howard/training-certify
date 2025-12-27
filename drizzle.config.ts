import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL is not set in environment variables. Drizzle Kit might fail.');
}

export default defineConfig({
    out: './src/db/migrations',
    schema: './src/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/devdb',
    },
});
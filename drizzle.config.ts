import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    // ──► Put generated SQL files in src/db/migrations
    out: './src/db/migrations',
    schema: './src/db/schema.ts',
    dialect: 'postgresql',
    // No `driver` property – Drizzle will use the native pg driver automatically
    dbCredentials: {
        url: process.env.DATABASE_URL!,   // reads from .env (local DB)
    },
});
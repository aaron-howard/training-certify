import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../src/db/schema';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is not set');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
    const db = drizzle(pool, { schema });

    console.log('⚠️  Clearing certification catalog...');

    try {
        // Since user_certifications references certifications, we must clear it first
        console.log('- Clearing user certifications references...');
        await db.delete(schema.userCertifications);

        console.log('- Clearing certifications catalog...');
        await db.delete(schema.certifications);

        console.log('✅ Catalog cleared successfully.');
    } catch (error) {
        console.error('❌ Failed to clear catalog:', error);
        process.exit(1);
    }

    process.exit(0);
}

main().catch(console.error);

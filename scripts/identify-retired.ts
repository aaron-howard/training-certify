import { sql } from 'drizzle-orm';
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

    console.log('Querying Microsoft certifications...');
    const msCerts = await db.select().from(schema.certifications).where(sql`vendor_id = 'microsoft'`);

    console.log(`Found ${msCerts.length} Microsoft certifications.`);

    const retiredPrefixes = ['70-', '74-', '77-', '98-', 'MB2-', 'MB3-', 'MB4-', 'MB5-', 'MB6-'];

    const potentiallyRetired = msCerts.filter(c => {
        // The ID format is 'microsoft-code'
        const code = c.id.replace('microsoft-', '');
        return retiredPrefixes.some(prefix => code.startsWith(prefix.toLowerCase()));
    });

    console.log(`Identified ${potentiallyRetired.length} exams matching retired prefixes.`);
    potentiallyRetired.forEach(c => console.log(`- ${c.id}: ${c.name}`));

    process.exit(0);
}

main().catch(console.error);

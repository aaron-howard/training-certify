
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './src/db/schema';

async function diagnose() {
    const client = new pg.Client({
        connectionString: "postgresql://postgres:password@127.0.0.1:5433/devdb"
    });
    await client.connect();
    const db = drizzle(client, { schema });

    console.log("--- User Certifications ---");
    const certs = await db.select().from(schema.userCertifications);
    console.log(JSON.stringify(certs, null, 2));

    console.log("--- User Certification Proofs ---");
    const proofs = await db.select().from(schema.userCertificationProofs);
    console.log(JSON.stringify(proofs, null, 2));

    await client.end();
}

diagnose().catch(console.error);

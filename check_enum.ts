import pg from 'pg';
import 'dotenv/config';

async function checkEnum() {
    const url = process.env.DATABASE_URL || "postgresql://postgres:password@127.0.0.1:5433/devdb";
    const client = new pg.Client({ connectionString: url });
    await client.connect();

    const res = await client.query(`
        SELECT n.nspname as schema, t.typname as type, e.enumlabel as label
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'role'
    `);

    console.log("Enum 'role' labels:", res.rows.map(r => r.label));
    await client.end();
}

checkEnum().catch(console.error);


import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './src/db/schema';
import 'dotenv/config';

async function diagnose() {
    const url = process.env.DATABASE_URL || "postgresql://postgres:password@127.0.0.1:5433/devdb";
    console.log("Actual DATABASE_URL from process.env:", process.env.DATABASE_URL ? "SET" : "NOT SET");
    console.log("Connecting to:", url.replace(/:[^:@]+@/, ":****@"));
    const client = new pg.Client({
        connectionString: url
    });
    await client.connect();
    const db = drizzle(client, { schema });

    console.log("--- Database Check ---");
    try {
        const users = await db.select().from(schema.users).limit(1);
        console.log("Connected! Found user:", users[0]?.id);
    } catch (e: any) {
        console.error("Query failed:", e.message);
    }

    await client.end();
}

diagnose().catch(console.error);

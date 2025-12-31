import * as fs from 'node:fs';
import * as path from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../src/db/schema';
import 'dotenv/config';

async function testConnection() {
    console.log('🧪 Testing DB Connection...');

    let url = process.env.DATABASE_URL;

    if (!url) {
        console.log('🔍 process.env.DATABASE_URL is empty, trying .env files...');
        const envFiles = ['.env.local', '.env'];
        for (const file of envFiles) {
            try {
                const fullPath = path.resolve(process.cwd(), file);
                if (fs.existsSync(fullPath)) {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const lines = content.split(/\r?\n/);
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed.startsWith('DATABASE_URL=')) {
                            url = trimmed.split('=')[1]?.replace(/["']/g, '').trim();
                            if (url) {
                                console.log(`✅ Found URL in ${file}`);
                                break;
                            }
                        }
                    }
                }
            } catch (e) {
                // Ignore file read errors
            }
            if (url) break;
        }
    }

    if (!url) {
        console.error('❌ No DATABASE_URL found!');
        console.error('💡 Tip: Set DATABASE_URL in .env file or environment variable');
        console.error('💡 Example: postgresql://postgres:password@localhost:5432/devdb');
        process.exit(1);
    }

    console.log(`🔗 URL Prefix: ${url.substring(0, 30)}...`);

    try {
        const pool = new Pool({
            connectionString: url,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });

        // Initialize drizzle (db variable not used but kept for future queries)
        drizzle(pool, { schema });

        console.log('📡 Testing connection...');
        const client = await pool.connect();
        console.log('✅ Connection successful!');

        console.log('📊 Checking for tables...');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        const tableNames = tablesResult.rows.map((row: { table_name: string }) => row.table_name);
        console.log('📁 Available tables:', tableNames);

        if (tableNames.length === 0) {
            console.warn('⚠️ No tables found in the public schema. You might need to run migrations.');
            console.warn('💡 Run: npx drizzle-kit push');
        } else {
            console.log(`✅ Found ${tableNames.length} table(s)`);
        }

        client.release();
        await pool.end();
        console.log('✅ Test completed successfully!');
    } catch (error: unknown) {
        console.error('❌ Connection failed!');
        if (error instanceof Error) {
            console.error('Error Message:', error.message);
            if ('code' in error) {
                console.error('Error Code:', error.code);
            }
        } else {
            console.error('Unknown error:', error);
        }
        if (error instanceof Error && error.message.includes('SSL')) {
            console.error('💡 Tip: Try adding ?sslmode=require to your connection string.');
        }
        process.exit(1);
    }
}

testConnection();

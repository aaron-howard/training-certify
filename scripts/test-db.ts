import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as fs from 'node:fs';
import * as path from 'node:path';
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
            } catch (e) { }
            if (url) break;
        }
    }

    if (!url) {
        console.error('❌ No DATABASE_URL found!');
        process.exit(1);
    }

    console.log(`🔗 URL Prefix: ${url.substring(0, 20)}...`);

    try {
        const sql = neon(url);
        const db = drizzle(sql);

        console.log('📡 Sending query: SELECT 1...');
        const result = await sql`SELECT 1 as test`;
        console.log('✅ Connection successful!', result);

        console.log('📊 Checking for tables...');
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        console.log('📁 Available tables:', tables.map(t => t.table_name));

        if (tables.length === 0) {
            console.warn('⚠️ No tables found in the public schema. You might need to run migrations.');
        }

    } catch (error: any) {
        console.error('❌ Connection failed!');
        console.error('Error Message:', error.message);
        console.error('Error Code:', error.code);
        if (error.message.includes('SSL')) {
            console.error('💡 Tip: Try adding ?sslmode=require to your connection string.');
        }
        process.exit(1);
    }
}

testConnection();

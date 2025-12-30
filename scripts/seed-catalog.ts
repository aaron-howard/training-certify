
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { getDb } from '../src/db/db.server';
import { certifications } from '../src/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
    const csvPath = path.resolve(process.cwd(), 'itexams_certifications.csv');
    if (!fs.existsSync(csvPath)) {
        console.error(`❌ CSV file not found at ${csvPath}`);
        process.exit(1);
    }

    const args = process.argv.slice(2);
    const limitArg = args.find(arg => arg.startsWith('--limit='));
    const limit = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity;

    console.log(`📂 Reading certifications from ${csvPath}...`);
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Skip header
    const dataLines = lines.slice(1);
    const totalLines = dataLines.length;
    const toProcess = Math.min(totalLines, limit);

    console.log(`🚀 Starting seed. Total records: ${totalLines}. Processing: ${toProcess}`);

    const db = await getDb();
    if (!db) {
        console.error('❌ Database not available');
        process.exit(1);
    }

    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < toProcess; i++) {
        const line = dataLines[i];
        // Basic CSV parsing (splitting by comma, but handling potential commas in quotes)
        // This is a simple regex for CSV parsing
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        
        if (!matches || matches.length < 3) {
            console.warn(`[Line ${i + 2}] Skipping invalid line: ${line}`);
            skippedCount++;
            continue;
        }

        const [examCodeRaw, examTitleRaw, vendorRaw, difficultyRaw] = matches.map(m => m.replace(/^"|"$/g, '').trim());
        
        const id = examCodeRaw;
        const name = examTitleRaw;
        const vendorName = vendorRaw;
        const difficulty = difficultyRaw || 'Intermediate';
        const vendorId = vendorName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        try {
            await db.insert(certifications).values({
                id,
                name,
                vendorId,
                vendorName,
                difficulty,
                category: 'Cloud', // Defaulting to Cloud as per schema requirements if not provided
            }).onConflictDoNothing();
            
            addedCount++;
            if (addedCount % 100 === 0) {
                console.log(`✅ Processed ${addedCount} records...`);
            }
        } catch (error) {
            console.error(`❌ Error inserting ${id}:`, error);
            errorCount++;
        }
    }

    console.log('\n--- Seed Summary ---');
    console.log(`✅ Records Added/Checked: ${addedCount}`);
    console.log(`⏭️ Records Skipped (Invalid): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('--------------------\n');
}

main().catch(err => {
    console.error('💥 Unhandled error:', err);
    process.exit(1);
});


import 'dotenv/config';
import { inArray } from 'drizzle-orm';
import { getDb } from '../src/db/db.server';
import { certifications } from '../src/db/schema';

async function main() {
    console.log('🔍 Starting Catalog Deduplication...');
    const db = await getDb();
    if (!db) {
        console.error('❌ Database not available');
        process.exit(1);
    }

    const allCerts = await db.select().from(certifications);
    console.log(`📊 Found ${allCerts.length} total certifications.`);

    const dryRun = process.argv.includes('--dry-run');
    if (dryRun) {
        console.log('🧪 DRY RUN MODE - No changes will be made.');
    }

    // Normalization helper
    const normalizeId = (id: string) => id.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

    const groupsById = new Map<string, typeof allCerts>();
    const groupsByNameVendor = new Map<string, typeof allCerts>();

    for (const cert of allCerts) {
        // Group by normalized ID
        const normId = normalizeId(cert.id);
        const existingIdGroup = groupsById.get(normId) || [];
        existingIdGroup.push(cert);
        groupsById.set(normId, existingIdGroup);

        // Group by normalized Name + Vendor
        const normNameVendor = `${normalizeName(cert.name)}|${cert.vendorName.toLowerCase()}`;
        const existingNameGroup = groupsByNameVendor.get(normNameVendor) || [];
        existingNameGroup.push(cert);
        groupsByNameVendor.set(normNameVendor, existingNameGroup);
    }

    const idsToDelete = new Set<string>();
    const duplicateInfos: Array<string> = [];

    const processGroup = (group: typeof allCerts, type: string, key: string) => {
        if (group.length <= 1) return;

        // Sort by "completeness" (number of non-null fields)
        const sorted = [...group].sort((a, b) => {
            const getScore = (c: typeof allCerts[0]) => {
                let score = 0;
                if (c.description && c.description.length > 20) score += 10;
                if (c.price) score += 5;
                if (c.category && c.category !== 'Cloud') score += 3; // Prefer non-default categories
                if (c.difficulty && c.difficulty !== 'Intermediate') score += 2;
                if (c.vendorLogo) score += 1;
                // Prefer names that contain the ID (often official names)
                if (c.name.toLowerCase().includes(c.id.toLowerCase())) score += 5;
                // Deduct score for very short names if long ones exist
                if (c.name.length < 5) score -= 10;
                return score;
            };
            const scoreA = getScore(a);
            const scoreB = getScore(b);
            if (scoreA !== scoreB) return scoreB - scoreA;
            // Tie-breaker: prefer the ID that looks more "standard" (e.g. has a dash)
            const hasDashA = a.id.includes('-') ? 1 : 0;
            const hasDashB = b.id.includes('-') ? 1 : 0;
            return hasDashB - hasDashA;
        });

        const winner = sorted[0];
        const losers = sorted.slice(1);

        duplicateInfos.push(`[${type}: ${key}] \n      ✅ Winner: ${winner.id} ("${winner.name}") \n      ❌ Removing: ${losers.map(l => `${l.id} ("${l.name}")`).join(', ')}`);

        for (const loser of losers) {
            idsToDelete.add(loser.id);
        }
    };

    // Process both group types
    for (const [key, group] of groupsById.entries()) {
        processGroup(group, 'ID', key);
    }
    for (const [key, group] of groupsByNameVendor.entries()) {
        processGroup(group, 'NAME', key);
    }

    console.log(`\n🔎 Found ${idsToDelete.size} duplicates to remove.`);
    duplicateInfos.forEach(info => console.log(`   ${info}`));

    if (idsToDelete.size > 0 && !dryRun) {
        console.log(`\n🗑️ Deleting ${idsToDelete.size} records...`);
        const idArray = Array.from(idsToDelete);

        // Drizzle delete in batches if necessary, but here probably small enough
        for (let i = 0; i < idArray.length; i += 50) {
            const batch = idArray.slice(i, i + 50);
            await db.delete(certifications).where(inArray(certifications.id, batch));
        }
        console.log('✅ Deletion complete.');
    } else if (idsToDelete.size > 0) {
        console.log('\n⏩ Skipping deletion (dry run).');
    } else {
        console.log('\n✨ No duplicates found.');
    }
}

main().catch(err => {
    console.error('💥 Unhandled error:', err);
    process.exit(1);
});


import { fetchExams, fetchVendors } from '../src/lib/ingestion.server';

async function main() {
    console.log('🧪 Testing ITExams Scraping...');

    try {
        console.log('--- Fetching Vendors ---');
        const vendors = await fetchVendors();
        console.log(`Found ${vendors.length} vendors.`);

        if (vendors.length === 0) {
            console.error('❌ No vendors found! The CSS selectors might be outdated.');
            return;
        }

        console.log('Top 5 Vendors:', vendors.slice(0, 5));

        const sampleVendor = vendors.find(v => v.slug.toLowerCase() === 'microsoft') || vendors[0];
        console.log(`\n--- Fetching Exams for vendor: ${sampleVendor.name} (${sampleVendor.slug}) ---`);

        const exams = await fetchExams(sampleVendor);
        console.log(`Found ${exams.length} exams.`);

        if (exams.length > 0) {
            console.log('Sample Exam:', exams[0]);
        } else {
            console.warn(`⚠️ No exams found for ${sampleVendor.name}.`);
        }

    } catch (error) {
        console.error('❌ Scraping failed:', error);
    }
}

main();

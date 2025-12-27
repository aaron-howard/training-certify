import { fetchVendors, fetchExams } from '../src/lib/ingestion.server';

async function test() {
    console.log('--- ITExams Scraper Test ---');

    // 1. Test Vendor fetching
    const vendors = await fetchVendors();
    if (vendors.length === 0) {
        console.error('Failed to fetch vendors');
        return;
    }

    console.log(`Successfully fetched ${vendors.length} vendors.`);
    console.log('Sample vendors:', vendors.slice(0, 5));

    // 2. Test Exam fetching for a specific vendor (e.g., Microsoft)
    const microsoft = vendors.find(v => v.slug === 'Microsoft') || vendors[0];
    console.log(`Testing exam fetching for: ${microsoft.name}`);

    const exams = await fetchExams(microsoft);
    if (exams.length === 0) {
        console.error(`Failed to fetch exams for ${microsoft.name}`);
        return;
    }

    console.log(`Successfully fetched ${exams.length} exams for ${microsoft.name}.`);
    console.log('Sample exams:', exams.slice(0, 5));

    console.log('--- Test Complete ---');
}

test().catch(console.error);

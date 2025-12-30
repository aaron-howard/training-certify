
import { certifications } from '../db/schema';

const BASE_URL = 'https://www.itexams.com';
const ALL_EXAMS_URL = `${BASE_URL}/all-exams/`;

export interface VendorInfo {
    name: string;
    slug: string;
}

export interface ExamInfo {
    code: string;
    name: string;
    vendorName: string;
    vendorId: string;
}

const isServer = typeof window === 'undefined';

/**
 * List of prefixes for retired legacy Microsoft exams.
 */
const RETIRED_LEGACY_PREFIXES = ['70-', '74-', '77-', '98-', 'MB2-', 'MB3-', 'MB4-', 'MB5-', 'MB6-'];

/**
 * Specifically retired role-based exams or others from the image.
 */
const RETIRED_SPECIFIC_CODES = [
    'AZ-100', 'AZ-101', 'AZ-102', 'AZ-103',
    'AZ-200', 'AZ-201', 'AZ-202', 'AZ-203',
    'AZ-300', 'AZ-301', 'AZ-302', 'AZ-303', 'AZ-304',
    'AI-100', 'AZ-600', 'AZ-720',
    'MS-100', 'MS-101', 'MS-200', 'MS-201', 'MS-202', 'MS-300', 'MS-301', 'MS-600', 'MS-740',
    'MD-100', 'MD-101',
    'MB-200', 'MB-400', 'MB-600', 'MB-900', 'MB-901'
];

/**
 * Checks if a certification should be skipped because it is retired.
 */
function isRetiredExam(vendorId: string, code: string): boolean {
    if (vendorId.toLowerCase() !== 'microsoft' && vendorId.toLowerCase() !== 'msft') {
        return false;
    }

    const upperCode = code.toUpperCase();

    if (RETIRED_LEGACY_PREFIXES.some(prefix => upperCode.startsWith(prefix))) {
        return true;
    }

    if (RETIRED_SPECIFIC_CODES.some(retiredCode => upperCode === retiredCode.toUpperCase())) {
        return true;
    }

    return false;
}

/**
 * Fetches the list of all vendors from ITExams.
 */
export async function fetchVendors(): Promise<VendorInfo[]> {
    if (!isServer) {
        console.warn('[Ingestion] fetchVendors called on client. Skipping.');
        return [];
    }
    console.log(`[Ingestion] Fetching vendors from ${ALL_EXAMS_URL}`);
    try {
        const response = await fetch(ALL_EXAMS_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = await response.text();
        const { JSDOM } = await import('jsdom');
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        const vendorLinks = doc.querySelectorAll('.allExams__vendors a');
        const vendors: VendorInfo[] = [];

        vendorLinks.forEach((link: any) => {
            const name = link.textContent?.trim() || '';
            const href = link.getAttribute('href') || '';
            const slug = href.split('/').pop() || '';
            if (name && slug) {
                vendors.push({ name, slug });
            }
        });

        console.log(`[Ingestion] Found ${vendors.length} vendors`);
        return vendors;
    } catch (error) {
        console.error('[Ingestion] Error fetching vendors:', error);
        return [];
    }
}

/**
 * Fetches exams for a specific vendor.
 */
export async function fetchExams(vendor: VendorInfo): Promise<ExamInfo[]> {
    if (!isServer) {
        console.warn('[Ingestion] fetchExams called on client. Skipping.');
        return [];
    }
    const vendorUrl = `${BASE_URL}/vendor/${vendor.slug}`;
    console.log(`[Ingestion] Fetching exams for ${vendor.name} from ${vendorUrl}`);
    try {
        const response = await fetch(vendorUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = await response.text();
        const { JSDOM } = await import('jsdom');
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        const examElements = doc.querySelectorAll('.allExams__exam a');
        const exams: ExamInfo[] = [];

        examElements.forEach((el: any) => {
            const strongTag = el.querySelector('strong');
            const code = strongTag?.textContent?.replace(':', '').trim() || '';
            // Get text content excluding the strong tag
            const name = el.textContent?.replace(strongTag?.textContent || '', '').trim() || '';

            if (code && name) {
                exams.push({
                    code,
                    name,
                    vendorName: vendor.name,
                    vendorId: vendor.slug.toLowerCase()
                });
            }
        });

        console.log(`[Ingestion] Found ${exams.length} exams for ${vendor.name}`);
        return exams;
    } catch (error) {
        console.error(`[Ingestion] Error fetching exams for ${vendor.name}:`, error);
        return [];
    }
}

/**
 * Syncs the catalog with itexams.com
 * @param limitVendors Optional limit for development/testing
 */
export async function syncCatalogFromITExams(limitVendors?: number) {
    const { getDb } = await import('../db/db.server');
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const vendors = await fetchVendors();
    const vendorsToProcess = limitVendors ? vendors.slice(0, limitVendors) : vendors;

    let totalAdded = 0;

    for (const vendor of vendorsToProcess) {
        const exams = await fetchExams(vendor);

        for (const exam of exams) {
            if (isRetiredExam(exam.vendorId, exam.code)) {
                console.log(`[Ingestion] Skipping retired exam: ${exam.code} (${exam.name})`);
                continue;
            }

            const certId = `${exam.vendorId}-${exam.code.toLowerCase()}`.replace(/\s+/g, '-');

            const certData = {
                id: certId,
                name: exam.name,
                vendorId: exam.vendorId,
                vendorName: exam.vendorName,
                description: `Official Exam ${exam.code}: ${exam.name}`,
                category: 'IT Certification', // Default category
                difficulty: 'Intermediate', // Default difficulty
            };

            try {
                // Upsert logic
                await db.insert(certifications).values(certData).onConflictDoUpdate({
                    target: certifications.id,
                    set: certData
                });
                totalAdded++; // Counting upserts as additions for progress reporting
            } catch (err) {
                console.error(`[Ingestion] Failed to save exam ${exam.code}:`, err);
            }

            // Respectful delay between exam pages for the same vendor if needed, 
            // but here we get all exams from one vendor page.
        }

        // Respectful delay between vendors
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`[Ingestion] Sync complete. Total processed: ${totalAdded}`);
    return { totalProcessed: totalAdded };
}

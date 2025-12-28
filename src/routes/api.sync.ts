import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDb } from '../db/db.server'
import { certifications } from '../db/schema'

import { JSDOM } from 'jsdom'

const ITEXAMS_BASE_URL = 'https://www.itexams.com'

async function fetchHtml(url: string) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        })
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        return await response.text()
    } catch (error) {
        console.error(`Error fetching ${url}:`, error)
        return null
    }
}

export const Route = createFileRoute('/api/sync')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                try {
                    const data = await request.json().catch(() => ({}))
                    const vendorLimit = data.vendorLimit || 500 // Increased to capture all vendors
                    const examLimitPerVendor = data.examLimit || 100

                    const db = await getDb()
                    if (!db) {
                        return json({ error: 'Database not available' }, { status: 500 })
                    }

                    console.log('🔄 [Sync] Starting ITExams vendor discovery...')
                    const allExamsHtml = await fetchHtml(`${ITEXAMS_BASE_URL}/all-exams/`)
                    if (!allExamsHtml) {
                        return json({ error: 'Failed to fetch ITExams vendor list' }, { status: 500 })
                    }

                    const dom = new JSDOM(allExamsHtml)
                    const document = dom.window.document
                    const vendorLinks = Array.from(document.querySelectorAll('a[href^="/vendor/"]'))
                        .map(a => ({
                            name: a.textContent?.trim() || 'Unknown',
                            url: ITEXAMS_BASE_URL + a.getAttribute('href'),
                            id: a.getAttribute('href')?.split('/').pop()?.toLowerCase() || 'unknown'
                        }))
                        .filter(v => v.id !== 'unknown')

                    console.log(`🔍 [Sync] Found ${vendorLinks.length} vendors. Syncing top ${vendorLimit}...`)

                    // Helper for vendor logos (placeholders/mapping)
                    const getVendorLogo = (vendorId: string) => {
                        const logos: Record<string, string> = {
                            'microsoft': 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
                            'amazon': 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg',
                            'aws': 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg',
                            'amazon-web-services': 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg',
                            'cisco': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Cisco_logo_blue_2016.svg',
                            'comptia': 'https://upload.wikimedia.org/wikipedia/commons/a/af/CompTIA_Logo.svg',
                            'google': 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
                            'google-cloud-platform': 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
                            'servicenow': 'https://upload.wikimedia.org/wikipedia/commons/b/b3/ServiceNow_logo.svg'
                        }
                        return logos[vendorId] || null
                    }

                    let syncedTotal = 0
                    let skippedTotal = 0
                    const vendorsToSync = vendorLinks.slice(0, vendorLimit)

                    for (const vendor of vendorsToSync) {
                        console.log(`📦 [Sync] Scraping vendor: ${vendor.name} (${vendor.url})`)
                        const vendorHtml = await fetchHtml(vendor.url)
                        if (!vendorHtml) continue

                        const vDom = new JSDOM(vendorHtml)
                        const vDoc = vDom.window.document

                        // Verified Selector: Each exam is in a li.vendor-exam-cell
                        const examCells = Array.from(vDoc.querySelectorAll('li.vendor-exam-cell'))

                        let vendorSynced = 0
                        const exams = examCells.slice(0, examLimitPerVendor).map(cell => {
                            // Verified Selectors: Code is in strong a, Name is in the other a
                            const codeLink = cell.querySelector('strong a')
                            const nameLink = cell.querySelector('a:not(strong a)')

                            const code = codeLink?.textContent?.trim() || ''
                            const name = nameLink?.textContent?.trim() || ''

                            return { code, name }
                        }).filter(e => e.code && e.name)

                        for (const exam of exams) {
                            try {
                                const certId = exam.code.toLowerCase().replace(/[^a-z0-9]/g, '-')
                                await db.insert(certifications).values({
                                    id: certId,
                                    name: exam.name.trim(),
                                    vendorId: vendor.id,
                                    vendorName: vendor.name,
                                    vendorLogo: getVendorLogo(vendor.id),
                                    category: 'Cloud', // Default
                                    difficulty: 'Intermediate', // Default
                                }).onConflictDoNothing()
                                syncedTotal++
                                vendorSynced++
                            } catch (err) {
                                skippedTotal++
                            }
                        }
                        console.log(`✅ [Sync] Finished ${vendor.name}: ${vendorSynced} exams synced.`)
                    }

                    return json({
                        success: true,
                        synced: syncedTotal,
                        skipped: skippedTotal,
                        total: syncedTotal + skippedTotal,
                        message: `Successfully synced ${syncedTotal} certifications from ${vendorsToSync.length} vendors.`
                    })
                } catch (error) {
                    console.error('[API Sync] Error:', error)
                    return json({ error: 'Failed to sync catalog' }, { status: 500 })
                }
            }
        }
    }
})

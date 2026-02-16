/**
 * Phase 1: Normalize and deduplicate the raw vendor list.
 *
 * Reads data/vendor-list-raw.txt, normalizes text (trim, fix encoding),
 * deduplicates case-insensitively, applies optional alias map to merge
 * obvious duplicates, and writes data/vendor-list-deduped.txt and
 * data/vendor-list-deduped.json.
 *
 * Usage:
 *   npx tsx scripts/dedupe-vendor-list.ts
 *   npx tsx scripts/dedupe-vendor-list.ts --no-alias   # skip alias merging
 */

import fs from 'node:fs'
import path from 'node:path'

const RAW_PATH = path.join(process.cwd(), 'data', 'vendor-list-raw.txt')
const DEDUPED_TXT_PATH = path.join(
  process.cwd(),
  'data',
  'vendor-list-deduped.txt',
)
const DEDUPED_JSON_PATH = path.join(
  process.cwd(),
  'data',
  'vendor-list-deduped.json',
)

/** Fix common encoding issues in vendor names */
function normalizeEncoding(name: string): string {
  return name
    .replace(/\u00C2\u00B2/g, '\u00B2') // Â² → ²
    .replace(/\(ISC\)Â²/g, '(ISC)²')
    .replace(/Onâ€'-Call/g, 'On-Call')
    .replace(/Onâ€'Call/g, 'On-Call')
    .replace(/\u2019/g, "'") // smart apostrophe
    .trim()
}

/** Alias map: input name (after normalize) -> canonical name for dedupe */
const ALIAS_MAP: Record<string, string> = {
  isc2: '(ISC)²',
  'amazon eks': 'Amazon Web Services',
  'aws codesuite': 'Amazon Web Services',
  'aws cost explorer': 'Amazon Web Services',
  'aws sagemaker': 'Amazon Web Services',
  'aws step functions': 'Amazon Web Services',
  'aws waf': 'Amazon Web Services',
  'azure ad / entra id': 'Microsoft',
  'azure cost management': 'Microsoft',
  'azure data factory': 'Microsoft',
  'azure devops': 'Microsoft',
  'azure front door': 'Microsoft',
  'azure kubernetes service': 'Microsoft',
  'azure machine learning': 'Microsoft',
  'bamboo (atlassian)': 'Atlassian',
  bitbucket: 'Atlassian',
  confluence: 'Atlassian',
  'jira product discovery': 'Atlassian',
  'jira service management': 'Atlassian',
  'opsgenie (atlassian)': 'Atlassian',
  'statuspage (atlassian)': 'Atlassian',
  trello: 'Atlassian',
  'chartio (atlassian legacy)': 'Atlassian',
  'google kubernetes engine': 'Google Cloud',
  'looker (google cloud)': 'Google Cloud',
  'power bi': 'Microsoft',
  'microsoft power bi': 'Microsoft',
  'duo security (cisco)': 'Cisco',
  'cisco meraki': 'Cisco',
  'k3s / k0s': 'K3s',
  'victorops (splunk on-call)': 'Splunk',
  'humio (crowdstrike)': 'CrowdStrike',
  'lightstep (servicenow)': 'ServiceNow',
  'marketo (adobe)': 'Adobe',
  'magento (adobe commerce)': 'Adobe',
  'trifacta (google cloud dataprep)': 'Google Cloud',
  'edcast (cornerstone)': 'Cornerstone OnDemand',
  'segment (twilio)': 'Twilio',
  'pentaho (hitachi vantara)': 'Hitachi Vantara',
  'surveymonkey (momentive)': 'Momentive',
  'cloudability (apptio)': 'Apptio',
  'axelos / peoplecert': 'Axelos',
  'broadcom / symantec': 'Broadcom',
  'silver peak (hpe aruba)': 'Aruba Networks',
  'hortonworks (legacy)': 'Hortonworks (Legacy)',
}

function main() {
  const useAlias = !process.argv.includes('--no-alias')

  if (!fs.existsSync(RAW_PATH)) {
    console.error(`❌ Raw list not found at ${RAW_PATH}`)
    process.exit(1)
  }

  const content = fs.readFileSync(RAW_PATH, 'utf-8')
  const rawLines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  console.log(`📂 Read ${rawLines.length} lines from vendor-list-raw.txt`)

  const seen = new Set<string>()
  const deduped: Array<string> = []

  for (const line of rawLines) {
    const normalized = normalizeEncoding(line)
    if (!normalized) continue

    const key = normalized.toLowerCase()
    const canonical = useAlias && ALIAS_MAP[key] ? ALIAS_MAP[key] : normalized

    const canonicalKey = canonical.toLowerCase()
    if (seen.has(canonicalKey)) continue
    seen.add(canonicalKey)
    deduped.push(canonical)
  }

  const outDir = path.dirname(DEDUPED_TXT_PATH)
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  fs.writeFileSync(DEDUPED_TXT_PATH, deduped.join('\n') + '\n', 'utf-8')
  fs.writeFileSync(
    DEDUPED_JSON_PATH,
    JSON.stringify(
      deduped.map((name) => ({ name })),
      null,
      2,
    ),
    'utf-8',
  )

  console.log(`✅ Wrote ${deduped.length} unique vendors to:`)
  console.log(`   ${DEDUPED_TXT_PATH}`)
  console.log(`   ${DEDUPED_JSON_PATH}`)
  console.log(`   (Removed ${rawLines.length - deduped.length} duplicates)`)
}

main()

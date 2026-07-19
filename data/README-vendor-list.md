# Vendor list files

- **vendor-list-raw.txt** – Original pasted list (one vendor per line).
- **vendor-list-deduped.txt** – Normalized and deduplicated list (output of `npx tsx scripts/dedupe-vendor-list.ts`).
- **vendor-list-deduped.json** – Same as above as JSON: `[{ "name": "..." }, ...]`.

## Phase 1 alias rules (dedupe script)

- Encoding fixes: `(ISC)Â²` → `(ISC)²`, `Onâ€'-Call` → `On-Call`.
- Case-insensitive dedupe; first occurrence wins.
- Optional alias merge (use `--no-alias` to disable): e.g. `ISC2` → `(ISC)²`; `Amazon EKS`, `AWS CodeSuite`, `AWS WAF`, etc. → `Amazon Web Services`; Azure/\* → `Microsoft`; Atlassian product names → `Atlassian`; `Power BI` / `Microsoft Power BI` → `Microsoft`. See `scripts/dedupe-vendor-list.ts` for the full `ALIAS_MAP`.

## Phase 2

Use **vendor-list-deduped.txt** (or the checklist from `scripts/vendor-validation-checklist.ts`) to validate each vendor has a public certification program. Vendors that do not go on **vendor-cleanup-list.txt** (one name per line).

**Production seed authority:** For go-live, treat [`certification-catalog.json`](./certification-catalog.json) as the approved catalog. Fill the eight batch CSVs with:

```bash
npx tsx scripts/fill-vendor-validation-from-catalog.ts
# optional: --dry-run
```

That sets `hasCertProgram=Y` for vendors present in the seed catalog and `hasCertProgram=N` (plus **vendor-cleanup-list.txt**) for everyone else until manually validated.

## Phase 3

Run `npx tsx scripts/remove-vendors-from-cleanup-list.ts --dry-run` then without `--dry-run` to remove those vendors and their certifications from the database.

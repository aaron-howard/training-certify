# `pnpm-workspace.yaml` overrides (pnpm)

pnpm [`overrides`](https://pnpm.io/settings#overrides) live under the **`overrides`** key in `pnpm-workspace.yaml` (pnpm v11+; the old `package.json` → `pnpm.overrides` field is ignored). They force specific versions of **transitive** dependencies. This file keeps a complete summary table for all active overrides, plus detailed rationale/removal guidance for high-risk or long-lived entries.

Native postinstall packages (`esbuild`, `@sentry/cli`, `unrs-resolver`) are allowlisted via **`allowBuilds`** in the same workspace file so pnpm 11 `strictDepBuilds` does not fail install.

**Review cadence:** When upgrading Vite, TanStack Start, Nitro, or `vercel`, re-run the checks below and try deleting overrides one at a time.

**Useful commands:**

```bash
pnpm why tar
pnpm why esbuild
pnpm why undici
pnpm why path-to-regexp
pnpm why seroval
pnpm audit --audit-level=high
```

---

## Summary table

| Package             | Override   | Primary reason                                                  |
| ------------------- | ---------- | --------------------------------------------------------------- |
| `tar`               | `^7.5.19`  | Security: patched release for extraction/DoS advisories         |
| `seroval`           | `^1.4.1`   | Align serialization across TanStack / Nitro tree                |
| `undici`            | `^6.28.0`  | Security: keep 6.x on a patched minor (retry/CRLF/cookie GHSAs) |
| `path-to-regexp`    | `^6.3.0`   | Security: ReDoS / routing fixes in 6.x                          |
| `esbuild`           | `^0.28.1`  | Security: build tool chain; path handling fixes                 |
| `minimatch@3`       | `^3.1.5`   | Security: ReDoS fix for ESLint’s 3.x line                       |
| `minimatch@9`       | `^9.0.6`   | Security: ReDoS fix for TanStack ESLint 9.x line                |
| `minimatch@10`      | `^10.2.5`  | Security: ReDoS fix for other 10.x consumers                    |
| `picomatch`         | `^4.0.4`   | Security: align fdir/vite picomatch consumers                   |
| `rollup`            | `^4.59.0`  | Security: build-time path handling fixes                        |
| `flatted`           | `^3.4.1`   | Security: circular JSON / prototype pollution fix               |
| `ajv@6`             | `^6.14.0`  | Security: ReDoS with `$data` (ESLint tree)                      |
| `ajv@8`             | `^8.18.0`  | Security: ReDoS with `$data` (Vercel CLI tree)                  |
| `@tootallnate/once` | `^3.0.1`   | Security: control-flow scoping (Vercel CLI)                     |
| `smol-toml`         | `^1.6.1`   | Security: DoS via commented lines (Vercel CLI)                  |
| `srvx`              | `^0.11.15` | Security: middleware bypass; lifts 0.8.x stragglers             |
| `brace-expansion@1` | `^1.1.18`  | Security: ReDoS / OOM in ESLint minimatch 3.x                   |
| `brace-expansion@2` | `^2.1.4`   | Security: ReDoS / OOM in eslint-plugin-import-x                 |
| `brace-expansion@5` | `^5.0.9`   | Security: ReDoS / OOM in Sentry / TypeDoc / Vercel CLI          |
| `yaml`              | `^2.8.3`   | Security: stack overflow on nested YAML (typedoc)               |
| `postcss`           | `^8.5.23`  | Security: sourceMappingURL path traversal (Vite)                |
| `@clerk/shared@3`   | `3.47.4`   | Clerk 0.x peer line until full Clerk 1.x migration              |
| `@clerk/shared@4`   | `4.12.0`   | Clerk 1.x: ≥4.8.1 for GHSA-vqx2-fgx2-5wq9                       |
| `js-cookie`         | `^3.0.7`   | Security: prototype hijack in assign() (Clerk tree)             |
| `ws`                | `^8.21.0`  | Security: fragment DoS (jsdom) + prior memory disclosure        |
| `js-yaml`           | `^4.3.1`   | Security: quadratic YAML merge-key / !!omap DoS (ESLint)        |
| `nanoid`            | `^3.3.18`  | Security: infinite loop on size 0 / negative (PostCSS)          |
| `shell-quote`       | `^1.9.0`   | Security: quadratic parse() DoS (TanStack launch-editor)        |
| `fast-uri`          | `^3.1.5`   | Security: host confusion via backslash authority (Vercel CLI)   |
| `ip-address`        | `^10.3.1`  | Security: SSRF classification bugs (Vercel CLI SOCKS)           |
| `linkify-it`        | `^5.0.2`   | Security: mailto: quadratic DoS (TypeDoc markdown-it)           |

---

## `tar` → `^7.5.19`

**Why:** Older `tar` (used transitively by `@vercel/*`, `@mapbox/node-pre-gyp`, and similar) had **high/critical** issues in archive extraction and decompression DoS. The ecosystem often lags on declaring a safe lower bound.

**Advisory (example):** [GHSA-23hp-3jrh-7fpw](https://github.com/advisories/GHSA-23hp-3jrh-7fpw) (fixed in `tar` ≥ 7.5.19; related issues under the `tar` advisory list).

**Before removing:**

1. Run `pnpm why tar` and confirm every path resolves to **≥ 7.5.19** without the override.
2. Run `pnpm audit --audit-level=critical` and confirm no `tar`-related finding.
3. Run `pnpm run test` and `pnpm run build`.

---

## `seroval` → `^1.4.1`

**Why:** `seroval` appears across **TanStack** and **Nitro** dependencies for serialization. Mixed nested versions have caused **runtime / hydration mismatches** in similar stacks; the override pins a single compatible line.

**Before removing:**

1. Upgrade `@tanstack/react-start`, `nitro`, and related packages together per upstream release notes.
2. Remove the override locally, run `pnpm install`, then `pnpm run dev`, `pnpm run build`, and full `pnpm run test`.
3. Watch for serialization errors or duplicate `seroval` versions in `pnpm list seroval`.

---

## `undici` → `^6.28.0`

**Why:** `undici` is pulled in by **Node tooling** and some **framework / adapter** paths (notably `@vercel/blob` for certification proof uploads). Keep the whole tree on a **patched** 6.x line without jumping to an incompatible major. `6.28.0` patches GHSA-8xcm-r25x-g524 (retry interceptor desync), GHSA-m8rv-5g2x-5cg5 (CRLF via blob `type`), and GHSA-v3r7-h72x-cjcm (cookie attribute injection), on top of the earlier 6.27.x CVEs.

**Before removing:**

1. Run `pnpm why undici` and note the shallowest vulnerable range (if any) from `pnpm audit`.
2. After removing, confirm `pnpm list undici` meets your security bar (`≥ 6.28.0` on the 6.x line).

---

## `path-to-regexp` → `^6.3.0`

**Why:** Some dependencies still resolve to **older 6.x** of `path-to-regexp`, which had **ReDoS / backtracking** reports. Forcing **≥ 6.3.0** aligns with ecosystem guidance when Express-style routers appear in the tree.

**Advisory (class):** [GHSA-9wv6-86v2-598j](https://github.com/advisories/GHSA-9wv6-86v2-598j) (path-to-regexp — check current CVE database for the exact range in your lockfile).

**Before removing:**

1. `pnpm why path-to-regexp` — ensure no dependency forces `< 6.3.0`.
2. Run API/E2E smoke tests; routing middleware can regress if a package expected an older API (rare but possible).

---

## `esbuild` → `^0.25.0`

**Why:** **Vite**, **Nitro**, and other bundlers depend on `esbuild`. Transitive versions occasionally lag behind **security-patched** releases. The override lifts the whole graph to a **known-good 0.25.x** line (also related to Rollup advisory chains that mention vulnerable bundler dependencies).

**Advisory (class):** [GHSA-mw96-cpmx-2vgc](https://github.com/advisories/GHSA-mw96-cpmx-2vgc) (Rollup — build-time path handling; often paired with keeping `esbuild` current).

**Before removing:**

1. Upgrade `vite` and `@tanstack/react-start` / `nitro` to versions that declare a safe `esbuild` range.
2. `pnpm run build` must succeed; watch for native `esbuild` binary platform issues after bumps.

---

## `js-cookie` → `^3.0.7`

**Why:** `@clerk/testing` → `@clerk/shared` still resolves `js-cookie` **≤ 3.0.5**, which has a **high** advisory ([GHSA-qjx8-664m-686j](https://github.com/advisories/GHSA-qjx8-664m-686j)) for cookie-attribute injection via `assign()`.

**Before removing:**

1. `pnpm why js-cookie` — confirm `@clerk/shared` (or upstream) declares **≥ 3.0.7** without the override.
2. `pnpm audit --audit-level=high` — no `js-cookie` finding.

---

## `ws` → `^8.21.0`

**Why:** `jsdom` (Vitest) still resolved `ws` **8.20.1**, which is **high** for memory-exhaustion DoS from tiny WebSocket fragments ([GHSA-96hv-2xvq-fx4p](https://github.com/advisories/GHSA-96hv-2xvq-fx4p)). The previous `^8.20.1` pin also covered [GHSA-58qx-3vcg-4xpx](https://github.com/advisories/GHSA-58qx-3vcg-4xpx) (TanStack devtools event-bus). Forcing **≥ 8.21.0** covers both.

**Before removing:**

1. `pnpm why ws` — confirm jsdom and `@tanstack/devtools-event-bus` declare **≥ 8.21.0** without the override.
2. `pnpm audit --audit-level=high` — no `ws` finding.

---

## `brace-expansion` → `@1 ^1.1.18` / `@2 ^2.1.4` / `@5 ^5.0.9`

**Why:** Three stacked ReDoS / OOM advisories ([GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp), [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg), [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895)) land on every major line still in the tree: ESLint `minimatch@3` (1.x), `eslint-plugin-import-x` (2.x), and Sentry / TypeDoc / Vercel CLI `minimatch@10` (5.x). The incomplete `maxLength` fix in 5.0.8 is why 5.x must be **≥ 5.0.9**.

**Before removing:**

1. `pnpm why brace-expansion` — confirm no path stays below the patched floor for that major.
2. `pnpm audit --audit-level=high` — no `brace-expansion` finding.

---

## `postcss` → `^8.5.23`

**Why:** Vite (and Tailwind / TanStack Start / Nitro) pull PostCSS. `≤ 8.5.17` auto-loads attacker-controlled `sourceMappingURL` paths ([GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849)); `≤ 8.5.22` is an incomplete fix when `from` is unset ([GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp)).

**Before removing:**

1. Upgrade `vite` until it declares PostCSS **≥ 8.5.23**, then try removing the override.
2. `pnpm run build` and `pnpm audit --audit-level=high` — no `postcss` finding.

---

## `js-yaml` → `^4.3.1`

**Why:** ESLint (`@eslint/eslintrc`) and the Vercel CLI still resolve `4.2.0`. That line is **high** for quadratic CPU on merge-key chains ([GHSA-52cp-r559-cp3m](https://github.com/advisories/GHSA-52cp-r559-cp3m)) and `!!omap` resolution ([GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj)).

**Before removing:**

1. `pnpm why js-yaml` — confirm ESLint / Vercel CLI declare **≥ 4.3.1**.
2. `pnpm audit --audit-level=high` — no `js-yaml` finding.

---

## Adding a new override

1. Document it in **this file** before merging (same sections: why, before removing, links).
2. Prefer **bumping the direct dependency** that pulls the bad transitive version; use overrides only when upstream has not released a fix.
3. Add a calendar or issue reminder to **re-try removal** after the next major framework upgrade.

---

## Related docs

- [DEPENDENCY_SECURITY.md](./DEPENDENCY_SECURITY.md) — Dependabot, audit policy, update workflow

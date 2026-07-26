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

| Package             | Override   | Primary reason                                                   |
| ------------------- | ---------- | ---------------------------------------------------------------- |
| `tar`               | `^7.5.8`   | Security: patched release for extraction/CVE class               |
| `seroval`           | `^1.4.1`   | Align serialization across TanStack / Nitro tree                 |
| `undici`            | `^6.27.0`  | Security: keep 6.x on a patched minor (CVE-2026-9679/6733/11525) |
| `path-to-regexp`    | `^6.3.0`   | Security: ReDoS / routing fixes in 6.x                           |
| `esbuild`           | `^0.28.1`  | Security: build tool chain; path handling fixes                  |
| `minimatch@3`       | `^3.1.5`   | Security: ReDoS fix for ESLint’s 3.x line                        |
| `minimatch@9`       | `^9.0.6`   | Security: ReDoS fix for TanStack ESLint 9.x line                 |
| `minimatch@10`      | `^10.2.5`  | Security: ReDoS fix for other 10.x consumers                     |
| `picomatch`         | `^4.0.4`   | Security: align fdir/vite picomatch consumers                    |
| `rollup`            | `^4.59.0`  | Security: build-time path handling fixes                         |
| `flatted`           | `^3.4.1`   | Security: circular JSON / prototype pollution fix                |
| `ajv@6`             | `^6.14.0`  | Security: ReDoS with `$data` (ESLint tree)                       |
| `ajv@8`             | `^8.18.0`  | Security: ReDoS with `$data` (Vercel CLI tree)                   |
| `@tootallnate/once` | `^3.0.1`   | Security: control-flow scoping (Vercel CLI)                      |
| `smol-toml`         | `^1.6.1`   | Security: DoS via commented lines (Vercel CLI)                   |
| `srvx`              | `^0.11.15` | Security: middleware bypass; lifts 0.8.x stragglers              |
| `brace-expansion@2` | `^2.0.3`   | Security: ReDoS / hang in minimatch 10.x tree                    |
| `yaml`              | `^2.8.3`   | Security: stack overflow on nested YAML (typedoc)                |
| `postcss`           | `^8.5.14`  | Security: XSS in CSS stringify (Vite)                            |
| `@clerk/shared@3`   | `3.47.4`   | Clerk 0.x peer line until full Clerk 1.x migration               |
| `@clerk/shared@4`   | `4.12.0`   | Clerk 1.x: ≥4.8.1 for GHSA-vqx2-fgx2-5wq9                        |
| `js-cookie`         | `^3.0.7`   | Security: prototype hijack in assign() (Clerk tree)              |
| `ws`                | `^8.20.1`  | Security: memory disclosure (TanStack devtools)                  |

---

## `tar` → `^7.5.8`

**Why:** Older `tar` (used transitively by `@vercel/*`, `@mapbox/node-pre-gyp`, and similar) had **high-severity** issues in archive extraction (e.g. symlink / hardlink handling). The ecosystem often lags on declaring a safe lower bound.

**Advisory (example):** [GHSA-83g3-92jg-28cx](https://github.com/advisories/GHSA-83g3-92jg-28cx) (fixed in `tar` ≥ 7.5.8; related issues tracked under the `tar` advisory list).

**Before removing:**

1. Run `pnpm why tar` and confirm every path resolves to **≥ 7.5.8** without the override.
2. Run `pnpm audit --audit-level=high` and confirm no `tar`-related finding.
3. Run `pnpm run test` and `pnpm run build`.

---

## `seroval` → `^1.4.1`

**Why:** `seroval` appears across **TanStack** and **Nitro** dependencies for serialization. Mixed nested versions have caused **runtime / hydration mismatches** in similar stacks; the override pins a single compatible line.

**Before removing:**

1. Upgrade `@tanstack/react-start`, `nitro`, and related packages together per upstream release notes.
2. Remove the override locally, run `pnpm install`, then `pnpm run dev`, `pnpm run build`, and full `pnpm run test`.
3. Watch for serialization errors or duplicate `seroval` versions in `pnpm list seroval`.

---

## `undici` → `^6.27.0`

**Why:** `undici` is pulled in by **Node tooling** and some **framework / adapter** paths (notably `@vercel/blob` for certification proof uploads). Older 6.x minors had **security fixes** landed in later 6.x releases; the override keeps the whole tree on a **patched** 6.x line without jumping to an incompatible major. As of Jul 2026, `6.27.0` patches CVE-2026-9679, CVE-2026-6733, and CVE-2026-11525.

**Before removing:**

1. Run `pnpm why undici` and note the shallowest vulnerable range (if any) from `pnpm audit`.
2. After removing, confirm `node -e "require('undici/package.json').version"` (or `pnpm list undici`) meets your security bar.

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

## `ws` → `^8.20.1`

**Why:** `@tanstack/devtools-vite` → `@tanstack/devtools-event-bus` pulls `ws` **&lt; 8.20.1**, flagged **moderate** for uninitialized memory disclosure ([GHSA-58qx-3vcg-4xpx](https://github.com/advisories/GHSA-58qx-3vcg-4xpx)).

**Before removing:**

1. Bump `@tanstack/devtools-vite` (or the event-bus package) if a release pins `ws` ≥ 8.20.1, then try removing the override.
2. `pnpm audit --audit-level=moderate` — no `ws` finding.

---

## Adding a new override

1. Document it in **this file** before merging (same sections: why, before removing, links).
2. Prefer **bumping the direct dependency** that pulls the bad transitive version; use overrides only when upstream has not released a fix.
3. Add a calendar or issue reminder to **re-try removal** after the next major framework upgrade.

---

## Related docs

- [DEPENDENCY_SECURITY.md](./DEPENDENCY_SECURITY.md) — Dependabot, audit policy, update workflow

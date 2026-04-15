# Nitro + TanStack Start upgrade path

This app uses **TanStack Start** with the **Vite** plugin and **Nitro** for the production server bundle (`vite.config.ts` → `tanstackStart()` + `nitro()`; deploy preset in `app.config.ts` → `vercel`).

## Current pins (check `package.json`)

| Package                 | Role                              | Notes                                                                                                                         |
| ----------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `@tanstack/react-start` | App framework / SSR entry         | Keep in sync with `@tanstack/react-router`, `@tanstack/router-plugin`, `@tanstack/react-router-ssr-query`, devtools packages. |
| `nitro`                 | Vite Nitro plugin + server output | **Pinned to an explicit version** (not `^`) while Nitro 3 is pre-stable — avoids surprise prerelease jumps.                   |
| `vite`                  | Bundler                           | Peer of Nitro; see Nitro’s `peerDependencies` for supported Vite majors.                                                      |

**Last documented bump (repo maintenance):** `nitro` **3.0.1-alpha.2** → **3.0.260311-beta** — `pnpm run type-check`, `pnpm run build`, and `pnpm run test` all passed locally after the change.

## Why Nitro is pinned

- TanStack Start’s Vite pipeline expects a **Nitro 3**-compatible plugin; releases are still often **alpha / beta / date-tagged**.
- Using a **fixed** `nitro` version makes CI and deploys reproducible until you consciously adopt the next tag.
- When **stable** Nitro 3.x (non-prerelease) is published and TanStack documents support, prefer moving to that range and widening the range only if you want Dependabot to propose minors.

## Exit criteria (“off alpha/beta”)

Treat Nitro as **“stable enough”** when:

1. **Upstream** publishes a **stable** Nitro 3 semver (no `-alpha` / `-beta` / date suffix) _and_ TanStack Start’s release notes or peer range recommend it, **or**
2. You intentionally stay on a **known-good date-tagged** beta (current approach) with a quarterly review.

Until then, expect **manual** Nitro bumps rather than automated majors (see `nitro` in [`.github/dependabot.yml`](../.github/dependabot.yml) ignore list in [dependabot-majors.md](./dependabot-majors.md)).

## How to upgrade Nitro (one PR)

1. **Branch:** `chore/bump-nitro-…`
2. **Inspect tags:** `pnpm view nitro versions --json` (or [npm `nitro`](https://www.npmjs.com/package/nitro?activeTab=versions)) — prefer the newest **3.x** line recommended by TanStack or Vercel docs.
3. **Bump:** `pnpm add nitro@<version>` (keeps an exact save in `package.json` by default for prerelease tags).
4. **Verify:**
   - `pnpm install`
   - `pnpm run type-check`
   - `pnpm run test`
   - `pnpm run build`
   - Smoke **preview:** `pnpm run preview` (or deploy a **Vercel preview** and hit `/`, `/api/health`, sign-in).
5. **Document:** Update the **“Last documented bump”** row in this file in the same PR.

### If the build fails

- Read **Nitro** and **TanStack Start** changelogs for breaking Vite plugin or preset changes.
- Compare **Vite** version to Nitro’s `peerDependencies` (`pnpm view nitro@<version> peerDependencies`).
- Clear caches: remove `.output`, `.nitro`, `node_modules/.vite`, reinstall.

## How to upgrade TanStack Start / Router (one PR)

TanStack packages should move **together** (same release train when possible):

1. Read [TanStack Router / Start blog](https://tanstack.com/blog) and GitHub releases for **breaking** notes.
2. Bump `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/router-plugin`, `@tanstack/react-router-ssr-query`, and related `@tanstack/*` devtools packages in **one** dependency pass.
3. Run `pnpm run type-check` — file routes and generated `routeTree.gen.ts` may need codegen or small API fixes.
4. `pnpm run test` + `pnpm run build` + targeted E2E if routing or auth changed.

`@clerk/tanstack-react-start` may lag behind TanStack majors — check [Clerk changelog](https://clerk.com/changelog) before merging.

## Related docs

- [dependabot-majors.md](./dependabot-majors.md) — which majors Dependabot may open vs manual
- [dependency-overrides.md](./dependency-overrides.md) — `pnpm.overrides` (e.g. `esbuild`, `seroval`) often touched during toolchain bumps
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Vercel preset and production checks

## References

- [Nitro](https://nitro.build/) — docs and deployment presets
- [TanStack Start](https://tanstack.com/start/latest) — framework docs
- [Vite](https://vite.dev/) — build options shared with Nitro’s Vite integration

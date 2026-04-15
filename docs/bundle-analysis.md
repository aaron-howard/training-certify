# Bundle analysis and route-level code splitting (#18)

## Goals

1. **Measure** what ships to the browser (treemap of modules and gzip/brotli sizes).
2. **Keep default routes lean** — heavy **admin / catalog / certification** UI loads in **async chunks** only when the user navigates there (`lazyRouteComponent` in TanStack Router).

## Analyze the client bundle

From the repo root:

```bash
pnpm run build:analyze
```

When finished, open **`dist/bundle-stats.html`** in a browser (treemap). `dist/` is gitignored; the HTML is generated locally only.

- Uses **`rollup-plugin-visualizer`** when Vite runs with **`--mode analyze`** (see `vite.config.ts`).
- The report reflects the Rollup graph for that build (TanStack Start + Nitro may emit multiple outputs; the treemap still helps spot large dependencies).

### Suggested cadence

- After **large dependency** or **framework** upgrades.
- When adding **new heavy UI** (charts, editors, large icon subsets).
- At least **quarterly** for production apps.

## Route-level code splitting (implemented)

Heavy pages live under **`src/components/pages/`** and are referenced only via **dynamic `import()`** from thin route files in **`src/routes/`**:

| Route                       | Lazy chunk export                  |
| --------------------------- | ---------------------------------- |
| `/catalog`                  | `CatalogRoutePage`                 |
| `/team-management`          | `TeamManagementRoutePage`          |
| `/certification-management` | `CertificationManagementRoutePage` |

The dashboard (`/`) and other smaller routes stay **eagerly** loaded so first paint for typical users stays simple.

### Adding a new lazy route

1. Move the page component to `src/components/pages/YourRoutePage.tsx` with **`export function YourRoutePage()`** (or a named export matching the string you pass to `lazyRouteComponent`).
2. In `src/routes/your-route.tsx`, keep only `createFileRoute` + `lazyRouteComponent(() => import('...'), 'YourRoutePage')`.
3. Fix **import paths** (from `components/pages/`, use `../../api/`, `../../lib/`, `../…` for sibling components).

Do **not** set custom `build.rollupOptions.output.manualChunks` for React without careful testing — it has caused **hydration / scheduler ordering** issues in this stack; prefer route-level splits and letting Rollup chunk vendor code automatically.

## Related

- `vite.config.ts` — `chunkSizeWarningLimit`, analyze plugin
- [ARCHITECTURE.md](../ARCHITECTURE.md) — stack overview

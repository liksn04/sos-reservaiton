# SOS Reservation Performance Refactor Plan

Reviewed: 2026-05-01
Scope: production bundle/runtime performance after the security and dependency gate.

## Current Baseline

Recent validation:
- `npm run lint` passes.
- `npm test` passes: 8 files, 49 tests.
- `npm run build` passes with PWA generation.
- `npm audit --audit-level=high` passes with `found 0 vulnerabilities`.

Build warnings to resolve:
- Vite reports a circular chunk warning: `vendor -> react-vendor -> vendor`.
- Vite reports one chunk above 500 kB after minification.

Largest JS assets from the latest local build:

| Asset | Size | Current interpretation |
|---|---:|---|
| `vendor-*.js` | 514 KB | Overloaded fallback vendor bucket and likely source of the size warning. |
| `charts-vendor-*.js` | 251 KB | Recharts is correctly lazy-loaded for the budget charts surface. |
| `react-vendor-*.js` | 185 KB | React/router chunk is large but expected for the app shell. |
| `EventsRoute-*.js` | 37 KB | Route-level feature chunk; acceptable but can improve after component split. |
| `BudgetRoute-*.js` | 36 KB | Route-level feature chunk; acceptable but tightly coupled to several sub-surfaces. |
| `motion-vendor-*.js` | 34 KB | Framer Motion and Lucide are grouped together. |
| `index-*.css` | 75 KB | Single global stylesheet; CSS ownership is too broad. |

## Performance Goals

Primary goals:
- Remove the circular chunk warning.
- Keep every emitted JS chunk below 500 KB minified.
- Reduce initial route dependency on fallback `vendor`.
- Preserve current route-level lazy loading and PWA behavior.
- Keep all refactors behavior-preserving unless a gate explicitly says otherwise.

Target acceptance:
- `npm run lint` pass.
- `npm test` pass.
- `npm run build` pass.
- Build output has no circular chunk warning.
- Build output has no chunk-size warning above 500 KB.
- `npm audit --audit-level=high` still passes.
- `npm ls vite-plugin-pwa workbox-build @rollup/plugin-terser serialize-javascript vite postcss @vitejs/plugin-react` still passes.

## Root-Cause Hypothesis

The current `manualChunks` function in `vite.config.ts` splits only a few explicit dependencies and sends everything else under `node_modules` to a single `vendor` chunk. This creates two issues:

1. Shared dependencies used by specialized chunks still fall back into `vendor`, causing chunk cross-dependencies.
2. The fallback `vendor` bucket absorbs unrelated heavy packages, so it grows past the warning threshold.

The route lazy-loading setup in `src/lib/moduleLoaders.ts` is already a good foundation. The next work should refine chunk ownership and prevent idle prefetch from pulling too much too early.

## Proposed Gates

### PERF-01 - Bundle Attribution and Guardrail

Goal: make bundle changes measurable before changing behavior.

Tasks:
1. Add a lightweight build analysis script that parses `dist/assets` after `npm run build` and reports JS/CSS asset sizes.
2. Add thresholds:
   - fail if any JS asset exceeds 500 KB minified,
   - warn if initial route CSS exceeds 90 KB,
   - warn if total precache exceeds the current baseline by more than 10 percent.
3. Store the latest accepted output in docs or print it as CI-readable text.

Preferred implementation:
- `scripts/check-bundle-size.mjs`
- `npm run check:bundle`
- `npm run build && npm run check:bundle`

Exit criteria:
- Bundle regression is detectable without reading Vite logs manually.
- No app code behavior changes.

### PERF-02 - Manual Chunk Strategy Cleanup

Goal: remove circular chunk warning and oversized fallback vendor chunk.

Tasks:
1. Replace broad `return 'vendor'` with explicit package-family buckets.
2. Keep React and router together only if it removes cycles; otherwise split `react-core` and `router`.
3. Move date utilities, Supabase, Workbox/PWA runtime, React Query, charts, motion, and general UI helpers into deterministic buckets.
4. Avoid splitting packages that have strong internal cross-imports into separate chunks.

Candidate chunk map:
- `react-core`: `react`, `react-dom`, `scheduler`
- `router`: `react-router`, `react-router-dom`
- `query`: `@tanstack/react-query`
- `supabase`: `@supabase/supabase-js`, `@supabase/*`
- `charts`: `recharts`, `victory-vendor`, `d3-*`, `decimal.js-light`
- `motion-ui`: `framer-motion`, `motion-dom`, `motion-utils`, `lucide-react`
- `date-utils`: `date-fns`
- `pwa`: `workbox-window`
- `vendor`: only small residual packages

Exit criteria:
- No `vendor -> react-vendor -> vendor` circular warning.
- `vendor` is materially smaller than 500 KB.
- Lazy `BudgetCharts` still owns chart-heavy code and is not pulled by first paint.

### PERF-03 - Route and Prefetch Budget

Goal: keep initial app load focused on the current route.

Tasks:
1. Audit idle prefetch behavior in `BottomNav`, `Admin`, and `BudgetRoute`.
2. Make route prefetch conditional:
   - prefetch only after auth/profile is resolved,
   - skip heavy routes on slow connection or data saver,
   - prefer `requestIdleCallback` with a longer timeout for admin/budget/chart routes.
3. Keep critical path routes (`home`, `reserve`) warm, but delay budget charts/admin tabs.
4. Add an optional `shouldPrefetchHeavyRoute()` helper in `moduleLoaders.ts`.

Exit criteria:
- Initial authenticated shell does not eagerly pull budget charts/admin tab code.
- Hover/focus/touch prefetch still works for deliberate navigation.
- No functional route regressions.

### PERF-04 - Heavy Surface Decomposition

Goal: lower route chunk sizes and reduce unnecessary re-render scope.

Priority files:
- `src/routes/BudgetRoute.tsx`
- `src/routes/EventsRoute.tsx`
- `src/components/BudgetTransactionModal.tsx`
- `src/components/EventModal.tsx`
- `src/components/MembershipFeePanel.tsx`

Tasks:
1. Move large item cards and modal sub-sections into separate files.
2. Keep route files as orchestration only.
3. Lazy-load modal components where they are not needed for first route render.
4. Memoize derived lists only where inputs are stable and the computation is non-trivial.
5. Avoid broad prop objects that cause child re-renders; pass primitives or stable callbacks where useful.

Exit criteria:
- `BudgetRoute` and `EventsRoute` route chunks each stay comfortably below current size.
- Modal code is not loaded until the modal can actually open, where practical.
- No file grows beyond the refactor-plan target without a reason.

### PERF-05 - CSS Ownership Split

Goal: reduce CSS blast radius and make route-specific style cost visible.

Tasks:
1. Split `src/index.css` without class renames:
   - `src/styles/tokens.css`
   - `src/styles/base.css`
   - `src/styles/layout.css`
   - `src/styles/components.css`
   - `src/styles/routes.css`
   - `src/styles/theme-light.css`
2. Keep `src/index.css` as the import hub initially.
3. Only after the import split, identify route-specific classes that can move closer to components or be replaced by local Tailwind composition.

Exit criteria:
- CSS import order is explicit.
- Visual regression risk is bounded because class names remain unchanged in the first pass.
- Follow-up UI work can identify ownership from filename.

### PERF-06 - PWA Cache Budget

Goal: keep offline behavior useful without precaching unnecessary weight.

Tasks:
1. Review VitePWA precache output after chunk cleanup.
2. Confirm heavy chart/admin chunks should be precached or left to runtime caching.
3. Consider excluding non-critical chunks from precache only if offline behavior remains acceptable.
4. Keep Supabase runtime caching conservative because API data is permissioned and time-sensitive.

Exit criteria:
- PWA generation still passes.
- Precache size does not grow unexpectedly after chunk split.
- Offline fallback behavior remains stable.

## Recommended Execution Order

1. PERF-01: add bundle-size guardrail first.
2. PERF-02: fix manual chunk strategy and verify build warnings disappear.
3. PERF-03: tune idle prefetch so heavy routes do not load prematurely.
4. PERF-04: decompose heavy route/modal surfaces if route chunks remain large.
5. PERF-05: split CSS ownership after JS chunk warnings are stable.
6. PERF-06: revisit PWA precache once emitted assets settle.

## First Implementation Slice

Recommended first slice:

1. Add `scripts/check-bundle-size.mjs`.
2. Add `check:bundle` script.
3. Update `vite.config.ts` manual chunk buckets.
4. Run:
   - `npm run build`
   - `npm run check:bundle`
   - `npm run lint`
   - `npm test`
   - `npm audit --audit-level=high`
5. Record new asset table and warning status in this document.

This keeps the first performance gate focused on measurable bundle output and avoids mixing UI decomposition with bundler behavior.

## Implementation Log - 2026-05-01

Completed gates:
- PERF-01: added `scripts/check-bundle-size.mjs` and `npm run check:bundle`.
- PERF-02: replaced the oversized fallback vendor chunk with explicit package-family chunks in `vite.config.ts`.
- PERF-03: added `shouldPrefetchHeavyRoute()` and made idle prefetch skip admin/budget/chart-heavy code on data saver or slow connections.

Current chunk policy:
- `react-core`: React runtime packages.
- `router`: React Router packages.
- `charts-vendor`: Recharts, D3, Victory vendor dependencies, and decimal chart helpers.
- `motion-ui`: Framer Motion and Lucide UI dependencies.
- `supabase`: Supabase client packages.
- `query`: TanStack Query packages.
- `date-utils`: date-fns.
- `pwa`: Workbox runtime package.

Accepted build baseline after PERF-01/02:

| Asset | Size |
|---|---:|
| `charts-vendor-*.js` | 385.2 KiB |
| `react-core-*.js` | 193.0 KiB |
| `supabase-*.js` | 186.8 KiB |
| `motion-ui-*.js` | 124.9 KiB |
| `EventsRoute-*.js` | 37.5 KiB |
| `router-*.js` | 36.1 KiB |
| `BudgetRoute-*.js` | 35.9 KiB |
| `query-*.js` | 34.8 KiB |
| `date-utils-*.js` | 24.3 KiB |
| `index-*.css` | 73.1 KiB |

Build result:
- Circular chunk warning removed.
- 500 KB chunk-size warning removed.
- PWA precache baseline: 40 entries, 1.97 MiB.
- Bundle gate passes with every JS asset below 500 KiB.

Remaining follow-up:
- PERF-04 is only needed if future feature work grows `BudgetRoute`, `EventsRoute`, or modal chunks beyond the current baseline.
- PERF-05 can be done later as a low-risk CSS ownership cleanup because the current CSS asset is below the warning threshold.
- PERF-06 should be revisited only after a meaningful PWA behavior or asset policy change.

# PROJECT KNOWLEDGE BASE

**Generated:** 2026-06-03
**Commit:** 909b96b
**Branch:** main

## OVERVIEW

Roomin is a mobile-first Vite + React 19 + TypeScript SPA for room reservation,
events, membership fees, budgets, admin operations, legal docs, PWA updates, and
reservation reminders. Supabase owns auth, Postgres/RLS, realtime, storage, cron,
and Edge Functions.

## STRUCTURE

```text
sos-reservation-t/
├── src/                 # app bootstrap, routes, hooks, UI, utilities
├── src/hooks/           # TanStack Query reads and mutations
├── src/components/      # feature UI, modals, route guards, shared widgets
├── src/utils/           # tested reservation/time/policy/domain helpers
├── src/styles/          # token-driven CSS layer stack
├── supabase/            # migrations plus service-role Edge Functions
├── docs/                # architecture, refactor, legal source docs
├── public/              # PWA icons, logos, local Pretendard fonts
└── scripts/             # build guardrails, currently bundle-size check
```

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| App providers and route tree | `src/App.tsx` | Query, auth, realtime, router, guards, lazy route modules |
| React mount and CSS imports | `src/main.tsx` | Imports `src/index.css` and `src/styles/app.css` |
| Route/page flow | `src/routes/` | Page shells own page state and compose hooks/components |
| Auth and access guards | `src/context/AuthContext.tsx`, `src/components/RouteGuards.tsx` | `src/context` is auth only; UI providers are in `src/contexts` |
| Query cache keys | `src/lib/queryKeys.ts` | Source of truth for query and invalidation keys |
| Realtime invalidation | `src/lib/RealtimeProvider.tsx` | Single global Supabase realtime channel |
| Lazy route/admin loading | `src/lib/moduleLoaders.ts` | Cached dynamic imports and heavy-route prefetch budget |
| Supabase client | `src/lib/supabase.ts` | Frontend anon client from `VITE_SUPABASE_*` |
| Admin/auth/profile/budget services | `src/services/` | Storage, edge-function, and audit-sensitive helpers |
| Reservation rules | `src/utils/time.ts`, `src/utils/reservationPolicy.ts`, `src/utils/validation.ts` | Keep focused tests near changed utility logic |
| Database/RLS/backend | `supabase/migrations/`, `supabase/functions/` | Security boundary; service role is function-only |
| Style system | `src/styles/`, `tailwind.config.js` | CSS variables drive Tailwind colors and theme switching |
| Bundle guardrail | `vite.config.ts`, `scripts/check-bundle-size.mjs` | Manual chunks plus 500 KiB JS threshold |

## CODE MAP

| Symbol | Type | Location | Role |
|---|---|---|---|
| `App` | React component | `src/App.tsx` | Provider stack and protected route composition |
| `AppShell` | React component | `src/routes/AppShell.tsx` | Approved-user shell and global reservation modal owner |
| `RealtimeProvider` | React component | `src/lib/RealtimeProvider.tsx` | Maps table changes to query invalidations |
| `queryKeys` | constant registry | `src/lib/queryKeys.ts` | Cache-key source of truth |
| `routeModuleLoaders` | constant registry | `src/lib/moduleLoaders.ts` | Lazy route imports with cached loader promises |
| `adminTabModuleLoaders` | constant registry | `src/lib/moduleLoaders.ts` | Lazy admin tab imports |
| `shouldPrefetchHeavyRoute` | function | `src/lib/moduleLoaders.ts` | Skips admin/budget prefetch on slow/data-saver connections |
| `useCreateReservation` | mutation hook | `src/hooks/mutations/useReservationMutations.ts` | Client validation, Supabase insert, invitees, invalidation |
| `validateReservationTime` | utility | `src/utils/validation.ts` | Reservation overlap/time policy boundary |
| `isSameDayHanjuBookingAllowed` | utility | `src/utils/reservationPolicy.ts` | Same-day `합주` exception gate |

## CONVENTIONS

- Use `npm`; `.npmrc` sets `legacy-peer-deps=true`.
- Dev server port is `5150`; preview uses Vite's default preview surface.
- Route files live in `src/routes`, not `src/pages`.
- Route modules and admin tabs are lazy-loaded through `src/lib/moduleLoaders.ts`.
- `src/context/AuthContext.tsx` is the auth provider; `src/contexts/*` is for UI providers.
- UI components should depend on hooks/services, not raw Supabase calls.
- React Query keys should come from `queryKeys`; direct array keys are legacy exceptions to remove, not examples.
- Realtime is opt-in through `VITE_ENABLE_SUPABASE_REALTIME=true` and belongs in `RealtimeProvider`.
- Tests are colocated `*.test.ts` files under `src/lib` and `src/utils`; descriptions commonly use Korean behavior wording.
- Styling is global layered CSS plus Tailwind token utilities; Tailwind preflight is disabled.
- Build chunk names in `vite.config.ts` are intentional: `react-core`, `router`, `charts-vendor`, `motion-ui`, `supabase`, `query`, `date-utils`, `pwa`.

## ANTI-PATTERNS (THIS PROJECT)

- Do not create per-hook Supabase realtime channels.
- Do not bypass `queryKeys` for new cache keys or invalidations.
- Do not move `@import` rules after Tailwind directives; keep CSS import order explicit.
- Do not make route files own upload/category CRUD or deep DB workflows.
- Do not leave production `console.log`; use gated `console.warn/error` only when operationally useful.
- Do not use `npm audit fix --force` blindly; `vite-plugin-pwa` and Workbox need version strategy.
- Do not expose service-role behavior to frontend code.
- Do not edit generated `dist/`, `coverage/`, or dependency files.

## COMMANDS

```bash
npm install
npm run dev
npm run test
npm run test:coverage
npm run lint
npm run build
npm run check:bundle
npm run preview
```

## NOTES

- Required frontend env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; optional realtime and push envs are documented in `README.md`.
- Edge Functions need Supabase-side `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; reminder push also needs VAPID/web-push secrets.
- `send-reservation-reminders` is designed for 5-minute Supabase Cron POST calls.
- Main security posture depends on RLS plus helper functions like `is_approved` and `is_admin_user`.

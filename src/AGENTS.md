# SRC KNOWLEDGE BASE

## OVERVIEW

`src` is the app runtime: providers, guarded routes, lazy loaders, query hooks,
domain utilities, feature UI, and global style entrypoints.

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| Bootstrap | `main.tsx` | Mounts React and imports global CSS |
| Provider stack | `App.tsx` | Theme, toast, confirm, query, auth, realtime, router |
| Route guards | `components/RouteGuards.tsx` | Login, approval, admin, banned redirects |
| Auth state | `context/AuthContext.tsx` | Session/profile loading and auth actions |
| UI providers | `contexts/` | Theme, toast, confirm |
| Route shells | `routes/` | Page state and feature composition |
| Data hooks | `hooks/`, `hooks/mutations/` | TanStack Query reads/writes |
| Infrastructure | `lib/` | Supabase, query keys, realtime, module loaders |
| Services | `services/` | Storage, admin, auth, budget, profile helpers |
| Pure domain logic | `utils/` | Time, reservation policy, file upload, fees, redirect logic |
| CSS entry | `styles/app.css` | Ordered import stack for style layers |

## DEPENDENCY DIRECTION

- `App.tsx` composes providers and routes; do not push feature workflow into it.
- Routes compose hooks and components; keep route files as page orchestration.
- Components call hooks/services through props or local hooks; avoid direct Supabase queries in UI.
- Hooks own query/mutation wiring and cache invalidation.
- Services own storage, admin, edge-function, or audit-sensitive remote workflows.
- Utilities should remain framework-light and get colocated Vitest coverage when behavior changes.
- `AuthContext` is central: route guards, realtime, admin/budget behavior, and profile UI depend on it.

## CONVENTIONS

- `src/context` is singular because auth lives there; `src/contexts` is plural for UI providers. Keep the split unless doing an intentional migration.
- Lazy imports belong in `lib/moduleLoaders.ts`; avoid ad hoc route-level dynamic import registries.
- Add new query keys to `lib/queryKeys.ts` before using them in hooks or realtime.
- If a new Supabase table should live-update the UI, update `lib/RealtimeProvider.tsx`.
- Reservation changes usually cross `components/ReservationModal/useReservationForm.ts`, `utils/time.ts`, `utils/reservationPolicy.ts`, and `utils/validation.ts`.

## ANTI-PATTERNS

- Do not turn route files into mixed render/form/upload/database files.
- Do not duplicate global modal state across multiple routes when `AppShell` outlet context already owns reservation modal open/edit actions.
- Do not add provider dependencies above `QueryClientProvider` if they call `useQueryClient`.
- Do not add raw cache key arrays outside `queryKeys` for new work.

# HOOKS KNOWLEDGE BASE

## OVERVIEW

`src/hooks` contains TanStack Query read hooks, UI/form hooks, and mutation hooks
that connect Supabase workflows to cache invalidation.

## STRUCTURE

```text
hooks/
├── *.ts              # read hooks and local form/filter hooks
└── mutations/        # write hooks grouped by feature/action
```

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| Query key registry | `../lib/queryKeys.ts` | Add keys here first |
| Realtime invalidation | `../lib/RealtimeProvider.tsx` | Table-to-key mapping |
| Reservation reads | `useReservations.ts`, `useMyReservations.ts`, `useReservationChangeLog.ts` | Calendar/profile/detail surfaces |
| Reservation writes | `mutations/useReservationMutations.ts`, `useDeleteReservation.ts`, `useLeaveReservation.ts` | Policy validation before Supabase writes |
| Event reads/writes | `useEvents.ts`, `useEventParticipants.ts`, `mutations/useEventMutations.ts` | Event hub and RSVP |
| Budget reads/writes | `useBudgetTransactions.ts`, `useBudgetStatsByYear.ts`, `useMembershipFees.ts`, `mutations/useBudgetMutations.ts` | Admin-only finance surfaces |
| Admin actions | `mutations/useBanUser.ts`, `useUnbanUser.ts`, `useSetAdminRole.ts`, `useAdminDeleteUser.ts` | Prefer service-backed audit-safe operations |
| Legal docs | `useLegalDocument.ts`, `mutations/useLegalDocumentMutations.ts` | Public read, admin write |

## CONVENTIONS

- Read hooks are usually thin `useQuery` wrappers around Supabase selects.
- Mutation hooks validate client policy, call Supabase/services, then invalidate query keys.
- Use `useAuth()` inside hooks when role/profile state affects permissions.
- Query keys should come from `queryKeys`; the direct `['reservations', 'history']` invalidation in reservation mutations is a legacy exception.
- If a hook touches a table included in realtime, align success invalidation with `RealtimeProvider`.
- Service helpers are appropriate when storage, admin edge functions, or audit persistence are involved.

## ANTI-PATTERNS

- Do not open realtime channels from individual hooks.
- Do not let UI components duplicate mutation-side validation that already belongs in hooks/utilities.
- Do not ignore Supabase delete/update errors before following with inserts.
- Do not make audit inserts best-effort for admin state-changing operations unless that policy is explicit.

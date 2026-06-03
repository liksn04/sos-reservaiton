# COMPONENTS KNOWLEDGE BASE

## OVERVIEW

`src/components` holds shared UI plus feature-specific component folders. Routes
own page state; components own reusable rendering, modal contents, and focused
form sections.

## STRUCTURE

```text
components/
├── admin/                    # admin tabs, user cards, ban dialog
├── budget/                   # summary cards, transaction list/items, payment cards
├── events/                   # event cards and category editor
├── ReservationModal/         # reservation form container and fields
├── BudgetTransactionModal/   # budget modal sub-sections
├── Calendar/                 # reservation calendar
├── DailySchedule/            # day schedule
├── Toast/                    # toast portal UI
└── profile/                  # profile header/reservation cards
```

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| Route access | `RouteGuards.tsx` | Auth/approval/admin gate UI |
| Global navigation | `BottomNav.tsx` | Shell route navigation |
| Reservation create/edit | `ReservationModal/` | `useReservationForm.ts` is the form-policy bridge |
| Reservation detail | `ReservationDetailModal.tsx` | Detail/history modal |
| Event create/edit | `EventModal.tsx`, `events/EventCategoryEditor.tsx` | Date/time/category flow |
| Event attendance | `EventParticipantsModal.tsx` | RSVP/admin attendance modal |
| Budget transaction modal | `BudgetTransactionModal.tsx`, `BudgetTransactionModal/` | Category, receipt, type controls |
| Budget list/cards | `budget/` | Finance display components |
| Admin tabs | `admin/` | Lazy-loaded from `lib/moduleLoaders.ts` |
| Toast rendering | `Toast/ToastContainer.tsx` | Portal placement is deliberate |

## MODAL PATTERN

- Parent route/shell owns `isOpen`, selected item, and close handlers.
- Modal returns `null` when closed.
- Overlay click closes only when `event.target === event.currentTarget`.
- Keep form state in a local hook or inner component when the modal has real workflow.
- Use dedicated subcomponents for upload/category/field sections instead of growing one modal file.

## CONVENTIONS

- `AppShell` owns global reservation modal open/edit state and exposes it through outlet context.
- `Reserve`, `EventsRoute`, and `BudgetRoute` own their own detail/create/edit modal state.
- Admin tab components are lazy-loaded through `adminTabModuleLoaders`; keep that registry updated for new tabs.
- Shared visual primitives are CSS classes from `src/styles`, not per-component CSS modules.

## ANTI-PATTERNS

- Do not move Supabase CRUD directly into modal field components.
- Do not duplicate event/reservation/budget category editors inline in route files.
- Do not break toast portal placement; it keeps notifications above the scroll surface.
- Do not create route-level item cards inline when they are reused or complex.

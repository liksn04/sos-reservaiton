# AGENTS Hierarchy Closeout - 2026-06-03

## Scope

Generated process guidance files:
- `AGENTS.md`
- `src/AGENTS.md`
- `src/components/AGENTS.md`
- `src/hooks/AGENTS.md`
- `src/styles/AGENTS.md`
- `src/utils/AGENTS.md`
- `supabase/AGENTS.md`

This is a process/meta change group. It is not mixed with the runtime
font/login change group.

## Verification

Command:

```text
find . -name AGENTS.md -not -path './node_modules/*' -not -path './dist/*' -not -path './coverage/*' -print | sort
```

Observed files:

```text
./AGENTS.md
./src/AGENTS.md
./src/components/AGENTS.md
./src/hooks/AGENTS.md
./src/styles/AGENTS.md
./src/utils/AGENTS.md
./supabase/AGENTS.md
```

No `AGENTS.md` under `node_modules`, `dist`, or `coverage` is treated as repo
guidance.

Line counts:

```text
105 AGENTS.md
 47 src/AGENTS.md
 59 src/components/AGENTS.md
 43 src/hooks/AGENTS.md
 52 src/styles/AGENTS.md
 42 src/utils/AGENTS.md
 53 supabase/AGENTS.md
```

All files are within the required ranges:
- root: 50-150 lines
- scoped files: 30-80 lines

## Scope Fit

- Root guidance describes the full Roomin repository, command set, runtime
  stack, public/static assets, and anti-patterns.
- `src/AGENTS.md` matches the app runtime structure and the current
  `src/context` versus `src/contexts` split.
- `src/components/AGENTS.md` matches current component subdirectories:
  `admin`, `budget`, `events`, `ReservationModal`, `BudgetTransactionModal`,
  `Calendar`, `DailySchedule`, `Toast`, and `profile`.
- `src/hooks/AGENTS.md` matches current read hooks and `hooks/mutations`.
- `src/styles/AGENTS.md` matches the layered CSS stack including `fonts.css`.
- `src/utils/AGENTS.md` matches current utility/test ownership.
- `supabase/AGENTS.md` matches current migrations and Edge Function
  directories.

## Result

The generated AGENTS hierarchy is classified `keep-meta`. It is ready for
user-requested staging/commit as a separate process/meta change group. No commit
or staging was performed.

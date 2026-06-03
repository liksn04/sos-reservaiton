# Execution Wave 2 - 2026-06-03

## Scope

This wave followed the passed `omo:review-work` review for Wave 1.

The user asked to proceed with the recommended sequence and decided that
ordinary users should see event participant counts.

## Change Groups

Keep these groups separate for review and any future commit request:

1. Runtime font/login baseline from Wave 1.
2. Generated AGENTS/meta guidance from Wave 1.
3. OMO/process evidence from Wave 1.
4. Wave 2 QA and event-count implementation:
   - `package.json`
   - `scripts/verify-public-routes.mjs`
   - `src/hooks/useEventParticipantSummaries.ts`
   - `src/utils/eventParticipantSummary.ts`
   - `src/utils/eventParticipantSummary.test.ts`
   - `src/components/EventParticipantsModal.tsx`
   - `src/lib/RealtimeProvider.tsx`
   - `supabase/migrations/20260603190000_publish_event_participant_counts_realtime.sql`

No staging, commit, stash, branch creation, discard, checkout, or destructive
revert was performed.

## Decisions

- `npm run qa:public-routes` is the repeatable public-route browser QA harness.
- General approved users can see event participant counts.
- Participant names, detailed roster, and attendance state remain admin-only.
- Count updates should invalidate event summaries through Realtime when
  `event_participant_counts` changes.

## Verification Plan

Run:

```text
npm run lint
npm run test
npm run build
npm run check:bundle
npm run qa:public-routes
```

Manual authenticated `/events` QA requires a valid Supabase session and seeded
event participant data. Without that environment, the implementation is verified
by unit tests, build/typecheck, and public-route browser QA.

## Verification Result

Passed:

```text
npm run lint
npm run test
npm run build
npm run check:bundle
npm run qa:public-routes
npm audit --audit-level=high
```

Observed:
- `npm run test`: 10 files, 58 tests passed.
- `npm run check:bundle`: largest JavaScript asset remained
  `charts-vendor` at 385.2 KiB; CSS was 88.0 KiB; precache was 48 entries /
  2.09 MiB.
- `npm run qa:public-routes`: `/login` desktop, `/login` mobile, and
  `/legal/terms` desktop passed with Pretendard active, no external app-font
  stylesheet, no blocking console messages, and reload checks passing.
- `lsof -nP -iTCP:5150 -sTCP:LISTEN` returned no listener after QA cleanup.

Remaining environment-gated check:
- Authenticated `/events` runtime QA still requires an approved user session and
  event participant seed data.

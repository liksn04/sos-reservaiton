# UTILS KNOWLEDGE BASE

## OVERVIEW

`src/utils` is the domain logic layer: reservation time math, policy validation,
auth redirects, fee/status derivation, upload validation, push helpers, and
formatting.

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| Time/date calculations | `time.ts` | Slot availability, overlap, next-day, past reservation logic |
| Reservation policy | `reservationPolicy.ts`, `validation.ts` | Same-day `합주`, seasons, date/time/purpose guards |
| Reservation display | `reservationDetails.ts` | Detail formatting and participant normalization |
| Auth redirects | `authRedirect.ts` | Approved/banned/legacy status routing |
| Fees | `membershipFees.ts` | Policy/record merge and payment status |
| Upload validation | `fileUpload.ts` | Image type, size, safe extension helpers |
| Event summaries | `eventParticipantSummary.ts` | Event participant aggregate map |
| Push helpers | `pushNotifications.ts` | PWA push support and subscription key helpers |
| Policy feature fallback | `reservationPolicyFeature.ts` | Missing-table/feature availability handling |
| Display format | `format.ts`, `dateLabels.ts` | Currency/date labels |

## TEST CONVENTIONS

- Tests are colocated as `*.test.ts` next to the utility.
- Behavior descriptions are often Korean and should stay behavior-focused.
- Time-sensitive tests use fixed dates/fake timers where practical.
- Add or update tests when changing reservation/time/policy/fee/upload behavior.

## CURRENT COVERAGE MAP

- Tested: `time.ts`, `reservationPolicy.ts`, `reservationDetails.ts`, `membershipFees.ts`, `fileUpload.ts`, `eventParticipantSummary.ts`, `authRedirect.ts`, `dateLabels.ts`.
- Indirectly covered: `validation.ts` through reservation policy tests.
- Not covered yet: `format.ts`, `pushNotifications.ts`, `reservationPolicyFeature.ts`.

## ANTI-PATTERNS

- Do not hide user-facing policy changes in UI-only code; put rules in utilities and test them.
- Do not compare malformed dates/times without normalization guards.
- Do not duplicate image MIME/size checks in upload surfaces; use `fileUpload.ts`.
- Do not rely on realtime or Supabase state in utilities; keep them deterministic where possible.

# Roomin Roadmap Reset - 2026-06-03

## Source of Truth

This document is the near-term execution baseline for Roomin realignment.
Older roadmap and review documents are historical inputs unless a statement is
revalidated against current code and copied into this reset document.

Historical inputs:
- `docs/project-overview-report-2026-04-20.md`
- `docs/refactor-plan-2026-05-01.md`
- `docs/performance-refactor-plan-2026-05-01.md`
- `README.md`
- current root/scoped `AGENTS.md` files

Current factual sources, in priority order:
1. Current `src/`, `supabase/`, `package.json`, `vite.config.ts`, and tests.
2. Current generated `AGENTS.md` hierarchy.
3. This roadmap reset and the worktree triage report.
4. Historical docs listed above.

## Current Baseline

- Branch: `main`, tracking `origin/main`.
- Worktree is intentionally dirty during realignment.
- The current dirty runtime change is coherent: local Pretendard font loading,
  removal of the external app font stylesheet, Tailwind/base/modal font-stack
  alignment, and a small `/login` copyright polish.
- Generated `AGENTS.md` files are process guidance, not app runtime changes.
- `.omo` files and realignment docs are execution artifacts for this workflow.
- No destructive revert, stash, staging, branch creation, or commit has been
  performed by this realignment run.

## Already Done, Do Not Re-plan As Open Work

These items are treated as historical completion records unless current code
validation disproves them:

- `markMembershipPaid` policy lookup was fixed in the 2026-05-01 action log.
- Reservation invitee delete-error handling was fixed in the 2026-05-01 action
  log.
- High-severity dependency audit remediation passed in later action logs.
- Bundle guardrail and manual chunk cleanup were completed in the performance
  log.
- Route/modal decomposition for the largest product surfaces was completed in
  the 2026-05-22 action logs.
- Upload validation and preview URL lifecycle cleanup were completed in the
  2026-05-22 action log.

These are not automatically reopened. They can become work only after current
code validation finds a concrete regression or gap.

## Current Dirty Worktree Ownership

Runtime font/login group:
- `index.html`
- `src/routes/Login.tsx`
- `src/styles/app.css`
- `src/styles/base.css`
- `src/styles/modals.css`
- `src/styles/routes-login.css`
- `tailwind.config.js`
- `src/styles/fonts.css`
- `public/fonts/pretendard/*.otf`

Agent guidance group:
- `AGENTS.md`
- `src/AGENTS.md`
- `src/components/AGENTS.md`
- `src/hooks/AGENTS.md`
- `src/styles/AGENTS.md`
- `src/utils/AGENTS.md`
- `supabase/AGENTS.md`

OMO/process group:
- `.omo/boulder.json`
- `.omo/drafts/roomin-realignment.md`
- `.omo/plans/roomin-realignment.md`
- `.omo/start-work/ledger.jsonl`
- `.omo/start-work/runtime-font-login-browser-qa.json`
- `.omo/start-work/screenshots/`
- `docs/worktree-triage-2026-06-03.md`
- `docs/roadmap-reset-2026-06-03.md`
- `docs/runtime-font-login-closeout-2026-06-03.md`
- `docs/agents-hierarchy-closeout-2026-06-03.md`

Ownership rule:
- Keep these groups separate in review, commit planning, and rollback
  discussion. Do not mix runtime, meta, and OMO/process artifacts into one
  vague change.

## Next 3 Milestones

### Milestone 0: Baseline and Worktree Ownership

Scope:
- Finish dirty worktree classification.
- Decide whether local Pretendard font assets are acceptable for repo-local
  storage based on license/source and size evidence.
- Keep runtime, agent guidance, and OMO artifacts separate.

Acceptance criteria:
- Every dirty path has an owner group and classification.
- Binary font assets are either accepted with evidence or left as a documented
  user decision.
- No destructive git cleanup is performed without explicit user approval.

Quality gates:
- `git status --short --branch`
- `git diff --name-status`
- `git diff --stat`
- `find public/fonts/pretendard -maxdepth 1 -type f | sort`
- `du -sh public/fonts/pretendard`

Manual QA:
- Not applicable for the ownership document itself.
- Runtime public-route QA is deferred to Milestone 1.

### Milestone 1: Current Runtime Change Closeout

Scope:
- Verify the local Pretendard font migration.
- Verify the `/login` copyright polish.
- Avoid unrelated UI redesign or feature work.

Acceptance criteria:
- App font is loaded from the local stylesheet and not from the removed external
  app-font Google stylesheet.
- Material Symbols remain available.
- `/login` renders correctly on desktop and mobile, including the copyright
  line and dark-mode styling.
- One public non-login route renders without font/layout regressions.
- Font asset license/source and size evidence are recorded; if evidence is
  incomplete, the font assets remain marked as a user decision.

Quality gates:
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run check:bundle`
- `npm audit --audit-level=high`

Manual QA:
- Browser smoke for `/login` on desktop viewport.
- Browser smoke for `/login` on mobile viewport.
- Browser smoke for `/legal/terms` or `/legal/privacy`.
- Authenticated routes are blocked unless valid Supabase config and a usable
  session are available.

### Milestone 2: Product Debt Validation and Prioritization

Scope:
- Validate top product-debt claims against current code before implementing any
  fix:
  - membership fee schema/query drift
  - event participant RLS/UI count mismatch
  - auth approval-flow remnants
  - old reservation cleanup responsibility
  - missing route/component QA coverage

Acceptance criteria:
- Each claim is classified as `confirmed`, `resolved`, `stale`,
  `needs-runtime-qa`, or `needs-user-decision`.
- Confirmed claims have exact file references and an observable failure mode.
- Resolved or stale claims are not reintroduced as open work.
- The next implementation wave contains only validated, bounded work.

Quality gates:
- `rg` evidence for each claim.
- Targeted source reads for every matching file.
- `npm run test` when validation touches testable utility or route behavior.
- `npm run lint` before any implementation follow-up.

Manual QA:
- No manual QA for claim validation itself unless a claim depends on live route
  behavior.
- If live route behavior is needed, use the same public-route browser smoke as
  Milestone 1 and record any auth blocker explicitly.

## Quality Gates

Baseline gate for runtime or source changes:

```bash
npm run lint
npm run test
npm run build
npm run check:bundle
npm audit --audit-level=high
```

Use `npm run test:coverage` only for risky utility/domain changes, roadmap
reporting, or when a validated debt item changes coverage-sensitive behavior.

Use `npm audit --audit-level=high` before release cutoff, whenever dependency
files change, and during the first baseline reset because older docs disagree on
audit state.

## Manual QA Surfaces

Always required for public runtime/UI changes:
- `/login`
- `/legal/terms` or `/legal/privacy`

Conditional on local Supabase environment and valid session:
- `/`
- `/reserve`
- `/events`
- `/profile`

Conditional on admin session:
- `/admin`
- `/budget`

Blocked authenticated/admin QA is acceptable only when the missing environment
or session is named in the evidence ledger. Public route QA remains mandatory.

## Supersession Rules For Older Docs

- `docs/project-overview-report-2026-04-20.md` is a historical overview, not a
  current backlog.
- `docs/refactor-plan-2026-05-01.md` is a historical plan and action log. Its
  completed items stay closed unless current code evidence reopens them.
- `docs/performance-refactor-plan-2026-05-01.md` is a historical performance
  action log. PERF-01 through PERF-03 are not open work unless current build
  evidence shows regression.
- Narrative claims from older docs must be revalidated before they become
  implementation tasks.
- If a historical claim conflicts with current code, current code wins until a
  new defect is reproduced.

## Out-of-scope Backlog

These are intentionally not part of the first realignment wave:
- Broad UI redesign.
- New reservation, event, budget, admin, or PWA features.
- Production Supabase data changes.
- Dependency upgrade strategy beyond the baseline audit gate.
- Large CSS architecture rewrites beyond the current font migration.
- Reworking completed decomposition solely because older docs mention it.
- Commit grouping, staging, stashing, or branch creation without a separate user
  request.

## Validated Debt Claims

Task 5 validated the top historical debt claims against current code. No
implementation fix was performed during this validation.

| Claim | Status | Current evidence | Milestone 2 implication |
|---|---|---|---|
| Membership fee schema/query drift | `resolved` | `src/hooks/useMembershipFees.ts:14-19` reads policies by `fiscal_year` and `fiscal_half`; `src/hooks/useMembershipFees.ts:43-46` reads records by `policy_id`; `src/hooks/mutations/useBudgetMutations.ts:193-216` reads policy amount by policy id and upserts records on `policy_id,user_id`; `supabase/migrations/0006_budget_hub.sql` defines that schema. | Do not reopen this from older docs unless a new reproduction appears. |
| Event participant RLS/UI count mismatch | `implemented-public-count` | User decision on 2026-06-03: 일반 사용자에게 이벤트 참여자 수를 공개한다. `src/hooks/useEventParticipantSummaries.ts` now reads `event_participant_counts` for every approved viewer, `src/utils/eventParticipantSummary.ts` accepts aggregate `participant_count` rows, `src/components/EventParticipantsModal.tsx` states that count is public while detailed roster/attendance remains admin-only, and `supabase/migrations/20260603190000_publish_event_participant_counts_realtime.sql` publishes count updates to Realtime. | Verify with unit tests, build, and authenticated runtime QA when a valid Supabase session is available. Detailed roster and attendance remain admin-only. |
| Auth approval-flow remnants | `resolved` | `src/utils/authRedirect.ts:7-12` routes all non-banned profiles to `/`; `src/components/RouteGuards.tsx:14-30` keeps legacy statuses in app entry and only redirects banned users; `src/utils/authRedirect.test.ts:36-39` asserts pending/rejected stay on `/`. `rg` found `pending-approval` and `ProfileSetup` only in historical docs, not current `src`. | Do not reopen `/pending-approval` cleanup from older docs. |
| Old reservation cleanup responsibility | `resolved` | `rg` found `useAutoCleanup` only in the old overview doc. `supabase/migrations/20260419164222_structural_drift_cleanup.sql:106-184` moves cleanup to `private.cleanup_expired_reservations` and schedules `cleanup-expired-reservations` with `pg_cron`. | Do not plan a frontend cleanup hook removal; current ownership is database-side. |
| Missing route/component QA coverage | `confirmed` | `rg --files src | rg "\\.test\\.(ts|tsx)$"` lists 10 tests, all under `src/lib` or `src/utils`; `rg --files src | rg "\\.test\\.tsx$"` returns none; `find src/routes src/components -type f \( -name '*.test.ts' -o -name '*.test.tsx' \)` returns none. `package.json:6-13` has Vitest scripts only and no Playwright/Cypress/Testing Library route/component test setup. | First product-debt candidate should be a small route/component QA harness or browser-test plan, not broad feature repair. |

Milestone 2 prioritization update:
- Primary confirmed debt: route/component QA coverage is missing.
- Product-decision debt: event participant public count behavior was decided on
  2026-06-03 and implemented as public count plus admin-only detailed roster.
- Resolved/stale items are not part of the next implementation wave unless a
  new reproduction appears.

## First Execution Wave

### Execution Wave 1

Objective:
- Close the baseline: classify the dirty worktree, verify the current runtime
  font/login change, and publish a current roadmap without broad product fixes.

Included tasks:
- Finish `docs/worktree-triage-2026-06-03.md`.
- Finish `docs/roadmap-reset-2026-06-03.md`.
- Verify current runtime font/login change.
- Verify generated `AGENTS.md` hierarchy.
- Validate top product-debt claims only far enough to prioritize the next
  milestone.

Excluded tasks:
- No membership-fee fix yet.
- No event participant RLS/count fix yet.
- No auth-flow rewrite yet.
- No reservation cleanup migration yet.
- No route/component QA harness implementation yet.
- No commits unless the user explicitly requests commit creation.
- No branch, stash, staging, revert, or discard operation unless the user
  explicitly requests it.

Exact automated gates:

```bash
npm run lint
npm run test
npm run build
npm run check:bundle
npm audit --audit-level=high
```

Exact static verification:

```bash
git status --short --branch
git diff --name-status
git diff --stat
find . -name AGENTS.md -not -path './node_modules/*' -not -path './dist/*' -not -path './coverage/*' -print | sort
wc -l AGENTS.md src/AGENTS.md src/components/AGENTS.md src/hooks/AGENTS.md src/styles/AGENTS.md src/utils/AGENTS.md supabase/AGENTS.md
rg -n "pending-approval|ProfileSetup|useAutoCleanup|membership_fee_records|membership_fee_policies|event_participants|fiscal_year|fiscal_half" src supabase docs README.md
rg --files src | rg "\\.test\\.tsx$"
```

Exact manual QA surfaces:
- `http://localhost:5150/login` at `1280x720`.
- `http://localhost:5150/login` at `390x844`.
- `http://localhost:5150/legal/terms` at `1280x720`.

Manual QA pass conditions:
- `/login` renders with visible copyright, active Pretendard stack, no text
  overlap, no blocking console errors, and hard refresh pass.
- `/legal/terms` renders the loaded legal document body, active Pretendard
  stack, visible Material Symbols icon, and no blocking console errors.

Review trigger:
- After Wave 1 completes and all gates pass or blockers are documented, run
  `omo:review-work` against the Wave 1 changes.
- For future milestones, run `omo:review-work` after every code-changing
  milestone and after every release-candidate milestone.
- Documentation-only milestones may skip `review-work` only if automated checks
  and plan evidence show no source/runtime changes.

Next implementation candidates after Wave 1:
- Route/component QA harness or browser-test plan. Completed in Wave 2 with
  `npm run qa:public-routes`.
- Event participant public count runtime decision. Completed in Wave 2 after
  user confirmed that 일반 사용자에게 이벤트 참여자 수는 공개한다.

Do not start additional candidates until the current Wave 2 changes pass review
or the user explicitly redirects.

## Post-Review Execution Wave 2

Triggered by the user on 2026-06-03 after `omo:review-work` passed.

Objective:
- Keep the Wave 1 change groups separate, add a repeatable public-route QA
  harness, and implement the product decision that event participant counts are
  visible to ordinary approved users.

Included tasks:
- Preserve runtime font/login, AGENTS/meta, and OMO/process artifacts as
  separate review/commit groups.
- Add `npm run qa:public-routes` as a Puppeteer smoke harness for `/login`
  desktop, `/login` mobile, and `/legal/terms` desktop.
- Read event participation counts from `event_participant_counts` for all
  approved viewers.
- Keep participant roster details and attendance state admin-only.
- Publish `event_participant_counts` to Supabase Realtime so count changes can
  invalidate event summaries.

Excluded tasks:
- No commit, staging, stash, branch, discard, or revert unless separately
  requested.
- No broad event redesign.
- No public exposure of participant names or attendance for non-admin users.
- No production Supabase data change in this local execution.

Quality gates:

```bash
npm run lint
npm run test
npm run build
npm run check:bundle
npm run qa:public-routes
```

Authenticated runtime QA:
- Public route QA is covered by `npm run qa:public-routes`.
- `/events` public-count QA still needs a valid approved Supabase session and
  seeded event participant data. If unavailable, treat it as an environment
  blocker and rely on unit/build evidence until a session is supplied.

## Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-06-03 | Use this reset document as the near-term source of truth. | Milestones had become fragmented across older reports and current dirty worktree state. |
| 2026-06-03 | Keep runtime, agent guidance, and OMO/process artifacts separate. | The current worktree contains multiple intent groups that should not be reviewed or committed as one change. |
| 2026-06-03 | Treat older docs as historical inputs unless revalidated. | Several older findings have later action logs that appear to close them. |
| 2026-06-03 | Do not perform destructive git cleanup during realignment. | The user asked for realignment, not discard/revert operations. |
| 2026-06-03 | Keep the current dirty worktree in four change groups. | Runtime font/login, AGENTS meta guidance, OMO/process evidence, and Wave 2 QA/event-count code should not be reviewed or committed as one vague change. |

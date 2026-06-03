# Roomin Realignment Plan

Generated: 2026-06-03
Mode: OMO realignment plan
Planner: `omo:ulw-plan`
Repository: `/Users/liksn04/Desktop/Coding/artifact_2/sos-reservation-t`

## Objective

Re-stabilize Roomin development by turning the current vague milestone state and
dirty worktree into a documented, verifiable execution baseline. This plan does
not assume that every known debt must be fixed immediately. The first goal is to
restore direction, classify local changes, define the next milestones, and make
future `omo:start-work` runs evidence-driven.

## Current Facts

- Branch is `main`, tracking `origin/main`.
- Current tracked dirty files:
  - `index.html`
  - `src/routes/Login.tsx`
  - `src/styles/app.css`
  - `src/styles/base.css`
  - `src/styles/modals.css`
  - `src/styles/routes-login.css`
  - `tailwind.config.js`
- Current untracked runtime files:
  - `src/styles/fonts.css`
  - `public/fonts/pretendard/Pretendard-*.otf`
- Current untracked process/meta files:
  - `AGENTS.md`
  - `src/AGENTS.md`
  - `src/components/AGENTS.md`
  - `src/hooks/AGENTS.md`
  - `src/styles/AGENTS.md`
  - `src/utils/AGENTS.md`
  - `supabase/AGENTS.md`
  - `.omo/drafts/roomin-realignment.md`
  - `.omo/plans/roomin-realignment.md`
- Current app dirty diff is coherent: local Pretendard font migration, removal
  of external Google Fonts app-font import, Tailwind/base/modal font stack
  switch, and a login copyright line.
- Existing milestone references are fragmented across:
  - `docs/project-overview-report-2026-04-20.md`
  - `docs/refactor-plan-2026-05-01.md`
  - `docs/performance-refactor-plan-2026-05-01.md`
  - `README.md`
  - new `AGENTS.md` hierarchy

## Scope

IN:
- Worktree triage and ownership classification.
- Durable roadmap reset document.
- Quality gate and manual QA definition.
- Verification of current font/login runtime change as a discrete pending change.
- Verification of generated `AGENTS.md` hierarchy as a discrete process change.
- Validation of highest-priority debt claims before implementation.

OUT:
- No destructive revert without explicit user approval.
- No automatic commit unless user separately asks for commits.
- No automatic staging, stash, branch creation, or commit grouping unless user
  separately asks for that git operation.
- No broad feature work before baseline and roadmap reset.
- No Supabase production data changes.
- No generated `dist`, `coverage`, or dependency edits.

## Defaults Applied

- Keep the current runtime font/login changes as pending work to verify, not as
  discard candidates.
- Keep generated `AGENTS.md` hierarchy as intended repo guidance unless the user
  later says it should remain local-only.
- Keep `.omo` draft/plan artifacts as planning artifacts; do not mix them with
  runtime UI changes.
- Create a new roadmap document during execution:
  `docs/roadmap-reset-2026-06-03.md`.
- Create a worktree triage document during execution:
  `docs/worktree-triage-2026-06-03.md`.
- Treat older docs as historical input unless the new roadmap reset explicitly
  adopts a statement as current truth.
- Treat `package.json`, current source, current migrations, and current
  `AGENTS.md` hierarchy as stronger evidence than older narrative docs when
  facts conflict.

## Execution Guardrails

- Follow `AGENTS.md` plus scoped files under `src`, `src/hooks`,
  `src/components`, `src/utils`, `src/styles`, and `supabase`.
- Before any source edit, re-read the relevant scoped `AGENTS.md`.
- Do not stage, commit, discard, or revert files unless the user explicitly asks.
- If the user later asks for commits, use separate change groups:
  - runtime font/login change
  - meta `AGENTS.md` hierarchy
  - OMO/process artifacts
- Do not mix runtime, meta, and `.omo` artifacts in one proposed change group.
- Every user-visible milestone needs automated gates and manual browser evidence.
- If authenticated/admin QA is blocked by missing Supabase state, record the
  blocker and still run public-route smoke QA.
- Historical docs are not authoritative until revalidated against current code.

## Quality Gates

Baseline automated commands:

```bash
npm run lint
npm run test
npm run build
npm run check:bundle
npm audit --audit-level=high
```

Conditional commands:

```bash
npm run test:coverage
npm audit --audit-level=high
```

Use `npm run test:coverage` for roadmap reporting or risky utility/domain
changes. `npm audit --audit-level=high` is part of the first baseline because
older docs disagree on audit state; after baseline, rerun it whenever
package/dependency files change or before release cutoff.

Environment assumptions:
- `npm run lint`, `npm run test`, `npm run build`, and `npm run check:bundle`
  must run without Supabase credentials.
- Manual authenticated/admin QA requires valid `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`, and an available session/profile.
- If those are unavailable, record authenticated/admin QA as blocked and keep
  public-route QA mandatory.

Manual QA surfaces:
- Required public smoke: `/login`.
- Required public non-login smoke: `/legal/terms` or `/legal/privacy`.
- Conditional authenticated smoke: `/`, `/reserve`, `/events`, `/profile` if a
  valid Supabase session/config is available.
- Conditional admin smoke: `/admin`, `/budget` if an admin session is available.

## TODOs

- [x] Task 1: Produce dirty worktree triage report.
- [x] Task 2: Produce roadmap reset document.
- [x] Task 3: Verify current runtime font/login change as a discrete pending change.
- [x] Task 4: Verify generated AGENTS hierarchy as a discrete process change.
- [x] Task 5: Validate top product-debt claims against current code.
- [x] Task 6: Define the first execution wave for `omo:start-work`.

## Task 1: Dirty Worktree Triage Report

Deliverable:
- Create `docs/worktree-triage-2026-06-03.md`.

Required classification table:
- Each dirty path must be classified as one of:
  - `keep-runtime`
  - `keep-meta`
  - `keep-omo`
  - `defer`
  - `discard-candidate`
  - `needs-user-decision`

Required initial classifications:
- `index.html`: `keep-runtime`
- `src/routes/Login.tsx`: `keep-runtime`
- `src/styles/app.css`: `keep-runtime`
- `src/styles/base.css`: `keep-runtime`
- `src/styles/modals.css`: `keep-runtime`
- `src/styles/routes-login.css`: `keep-runtime`
- `tailwind.config.js`: `keep-runtime`
- `src/styles/fonts.css`: `keep-runtime`
- `public/fonts/pretendard/*.otf`: `needs-user-decision` until license and size
  evidence is recorded, then `keep-runtime` or `defer`
- root/scoped `AGENTS.md`: `keep-meta`
- `.omo/drafts/roomin-realignment.md`: `keep-omo`
- `.omo/plans/roomin-realignment.md`: `keep-omo`

Acceptance criteria:
- The report includes `git status --short --branch`, `git diff --name-status`,
  and `git diff --stat` snapshots.
- The report names the intended change group for every dirty path.
- The report explicitly says no destructive revert was performed.
- The report separates runtime, meta, and OMO artifacts.

Verification:
- Run `git status --short --branch`.
- Run `git diff --name-status`.
- Re-read `docs/worktree-triage-2026-06-03.md` and confirm every dirty path is
  represented.

Manual QA:
- Not applicable for the report itself; mark manual QA not-applicable with the
  reason "documentation-only triage".

## Task 2: Roadmap Reset Document

Deliverable:
- Create `docs/roadmap-reset-2026-06-03.md`.

Required sections:
- Current baseline.
- What is already done and should not be re-planned as open work.
- Current dirty worktree ownership.
- Next 3 milestones.
- Quality gates per milestone.
- Manual QA surfaces per milestone.
- Supersession rules for older docs.
- Out-of-scope backlog.
- Decision log.

Required next 3 milestones:
- Milestone 0: Baseline and Worktree Ownership.
- Milestone 1: Current Runtime Change Closeout.
- Milestone 2: Product Debt Validation and Prioritization.

Milestone 0 scope:
- Finish dirty worktree classification.
- Decide whether font assets are acceptable for repo-local storage.
- Keep runtime/meta/OMO changes separate.

Milestone 1 scope:
- Verify and finish the local Pretendard font migration and login copyright
  polish.
- No unrelated UI redesign.

Milestone 2 scope:
- Validate current status of these claims before any fix:
  - membership fee schema/query drift
  - event participant RLS/UI count mismatch
  - auth approval-flow remnants
  - old reservation cleanup responsibility
  - missing route/component QA coverage

Acceptance criteria:
- New roadmap doc clearly names the source of truth for near-term work.
- New roadmap doc says `docs/project-overview-report-2026-04-20.md`,
  `docs/refactor-plan-2026-05-01.md`, and
  `docs/performance-refactor-plan-2026-05-01.md` are historical inputs unless a
  statement is revalidated and copied into the reset doc.
- The roadmap references historical docs as inputs, not current truth.
- The roadmap avoids broad "fix everything" scope.
- Every milestone has acceptance criteria, automated commands, and manual QA
  surface.

Verification:
- Re-read `docs/roadmap-reset-2026-06-03.md`.
- Run `rg -n "Milestone 0|Milestone 1|Milestone 2|Quality Gates|Out-of-scope" docs/roadmap-reset-2026-06-03.md`.

Manual QA:
- Not applicable for the roadmap document; mark manual QA not-applicable with
  the reason "documentation-only roadmap".

## Task 3: Runtime Font/Login Change Closeout

Scope:
- `index.html`
- `src/routes/Login.tsx`
- `src/styles/app.css`
- `src/styles/base.css`
- `src/styles/modals.css`
- `src/styles/routes-login.css`
- `tailwind.config.js`
- `src/styles/fonts.css`
- `public/fonts/pretendard/`

Required checks:
- Verify Pretendard font file paths referenced in `src/styles/fonts.css` exist
  under `public/fonts/pretendard/`.
- Record total added font asset size.
- Record font source/license evidence. If license cannot be verified locally,
  classify font assets as `needs-user-decision` and do not call the runtime
  change ready.
- Record whether repo-local OTF assets are acceptable compared with alternatives
  such as remote font loading or smaller webfont formats. Do not change delivery
  path in this task; only record the decision evidence.
- Confirm `index.html` still loads Material Symbols.
- Confirm `src/styles/app.css` imports `fonts.css` before `base.css`.
- Confirm Tailwind and CSS font stacks agree on Pretendard.

Automated verification:
```bash
npm run lint
npm run test
npm run build
npm run check:bundle
npm audit --audit-level=high
```

Manual browser QA:
- Start dev server with `npm run dev`.
- Open `http://localhost:5150/login`.
- PASS if login page renders, the copyright line is visible, no text overlaps,
  Material Symbols icons still render, and dev console has no blocking runtime
  error.
- Open `http://localhost:5150/legal/terms`.
- PASS if the public legal page renders with the same font stack and no blocking
  runtime error.
- If port 5150 is occupied, use the actual Vite port printed by the dev server
  and record it.

Adversarial cases:
- Dirty worktree: verify only the runtime files above are considered runtime
  change scope.
- Stale state: hard refresh `/login` after first load.
- Misleading success output: do not accept Vite "ready" alone; require browser
  render evidence.
- Hung command: if dev server hangs, capture PID/port and cleanup receipt.

Acceptance criteria:
- Automated gates pass or failures are recorded as pre-existing/blocking with
  exact command output.
- Manual `/login` and public legal-page browser evidence is recorded.
- Font license/size evidence is recorded.
- If font license/size evidence is inconclusive, runtime change remains
  `needs-user-decision` and is not marked ready.
- The runtime change group is ready for user-requested staging/commit, but no
  commit is made by this plan.

## Task 4: AGENTS Hierarchy Process Change Closeout

Scope:
- `AGENTS.md`
- `src/AGENTS.md`
- `src/components/AGENTS.md`
- `src/hooks/AGENTS.md`
- `src/styles/AGENTS.md`
- `src/utils/AGENTS.md`
- `supabase/AGENTS.md`

Required checks:
- Confirm no `AGENTS.md` under `node_modules` is treated as repo guidance.
- Confirm each generated file is specific to its scoped directory.
- Confirm line counts stay in useful ranges:
  - root: 50-150 lines
  - scoped files: 30-80 lines
- Confirm no instructions contradict the current source layout.

Verification:
```bash
find . -path './node_modules' -prune -o -name AGENTS.md -print
wc -l AGENTS.md src/AGENTS.md src/components/AGENTS.md src/hooks/AGENTS.md src/styles/AGENTS.md src/utils/AGENTS.md supabase/AGENTS.md
```

Manual QA:
- Not applicable; mark manual QA not-applicable with the reason "process
  guidance only".

Acceptance criteria:
- The generated hierarchy is either classified `keep-meta` in the triage report
  or marked `needs-user-decision`.
- The meta change group is not mixed with runtime UI/font files.

## Task 5: Validate Top Product-Debt Claims

Deliverable:
- Add a "Validated Debt Claims" section to `docs/roadmap-reset-2026-06-03.md`.

Claims to validate with current code before planning fixes:
- Membership fee schema/query drift:
  - inspect `src/hooks/useMembershipFees.ts`
  - inspect `src/hooks/mutations/useBudgetMutations.ts`
  - inspect `supabase/migrations/0006_budget_hub.sql`
- Event participant RLS/UI mismatch:
  - inspect `src/hooks/useEventParticipantSummaries.ts`
  - inspect `src/hooks/useEventParticipants.ts`
  - inspect `supabase/migrations/0005_event_participants.sql`
  - inspect `supabase/migrations/20260419164222_structural_drift_cleanup.sql`
- Auth approval-flow remnants:
  - inspect `src/utils/authRedirect.ts`
  - inspect `src/components/RouteGuards.tsx`
  - inspect `src/routes/Login.tsx`
  - search for `pending-approval` and `ProfileSetup`
- Reservation cleanup responsibility:
  - search for `useAutoCleanup`
  - inspect current reservation cleanup code if present
- Missing route/component QA:
  - search for `*.test.tsx`
  - search package scripts for Playwright/Cypress/Testing Library

Acceptance criteria:
- Each claim is marked `confirmed`, `resolved`, `stale`, or
  `needs-runtime-qa`.
- Each claim cites exact files.
- No implementation fix is performed in this task.
- The next milestone list is updated based on validated current facts, not old
  report assumptions.

Verification:
```bash
rg -n "pending-approval|ProfileSetup|useAutoCleanup|membership_fee_records|membership_fee_policies|event_participants|fiscal_year|fiscal_half" src supabase docs README.md
rg --files src | rg "\\.test\\.tsx$"
```

Manual QA:
- Not applicable for validation-only code reading; mark manual QA
  not-applicable with reason "static validation only".

## Task 6: First `omo:start-work` Execution Wave Definition

Deliverable:
- Add an "Execution Wave 1" section to `docs/roadmap-reset-2026-06-03.md`.

Required contents:
- Wave 1 objective.
- Wave 1 included tasks.
- Wave 1 excluded tasks.
- Exact automated gates.
- Exact manual QA surfaces.
- Review trigger.

Required Wave 1 objective:
- "Close the baseline: classify the dirty worktree, verify the current runtime
  font/login change, and publish a current roadmap without broad product fixes."

Required Wave 1 included tasks:
- Finish `docs/worktree-triage-2026-06-03.md`.
- Finish `docs/roadmap-reset-2026-06-03.md`.
- Verify current runtime font/login change.
- Verify generated `AGENTS.md` hierarchy.

Required Wave 1 excluded tasks:
- No membership-fee fix yet.
- No event participant RLS fix yet.
- No auth-flow rewrite yet.
- No reservation cleanup migration yet.
- No commits unless user explicitly requests commit creation.
- No branch/stash/staging operation unless user explicitly requests it.

Required review trigger:
- After Wave 1 completes and all gates pass or blockers are documented, run
  `omo:review-work` against the Wave 1 changes.
- For future milestones, run `omo:review-work` after every code-changing
  milestone and after every release-candidate milestone. Documentation-only
  milestones may skip `review-work` only if automated checks and plan evidence
  show no source/runtime changes.

Acceptance criteria:
- A future worker can execute Wave 1 without deciding what to include.
- Wave 1 does not expand into broad debt repair.
- Wave 1 includes browser QA for `/login` and a public legal page.

## Final Verification Wave

- [x] Final check: plan artifacts are internally consistent.
- [x] Final check: worktree status is reported without hiding unrelated dirty files.
- [x] Final check: no source code was modified during planning.
- [x] Final check: next execution command is unambiguous.

## Final Verification Details

For `Final check: plan artifacts are internally consistent`:
- Read `.omo/drafts/roomin-realignment.md`.
- Read `.omo/plans/roomin-realignment.md`.
- Confirm the plan incorporates Metis guardrails:
  - explicit dirty file policy
  - font license/size acceptance
  - concrete browser QA surfaces
  - durable roadmap reset document
  - no-code planning boundary
  - stale-doc supersession rules
  - audit baseline despite historical audit-status conflict

For `Final check: worktree status is reported without hiding unrelated dirty files`:
```bash
git status --short --branch
```

For `Final check: no source code was modified during planning`:
- Confirm runtime source diffs match the initial tracked runtime diff recorded
  by Task 1.
- Confirm this realignment execution added/updated only `.omo` state/evidence
  and `docs/*-2026-06-03.md` workstream documents.
- Existing runtime dirty files remain pending runtime work and were verified,
  not rewritten, by this plan.

For `Final check: next execution command is unambiguous`:
- The next command after this Wave 1 baseline is `omo:review-work`.
- After review, the next implementation choices are:
  - route/component QA harness or browser-test plan
  - event participant public count runtime decision

## Wave 1 Completion Handoff

Wave 1 was executed by `omo:start-work roomin-realignment`. The required next
review command is:

```text
omo:review-work
```

No further implementation should start until the review is complete or the user
explicitly redirects the workflow.

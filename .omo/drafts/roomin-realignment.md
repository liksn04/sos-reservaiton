# Draft: Roomin Realignment

## Requirements (confirmed)

- "앱의 개발이 굉장히 흐지부지 되고 있다는 느낌"
- "마일스톤이 흐릿해지고 워크트리도 더럽고 무언가 재정렬이 필요"
- OMO skills를 활용해 문제를 해결할 수 있는지 확인하고 진행
- 진행 방향: `omo:ulw-plan`으로 재정렬 계획을 먼저 만든다
- 이 단계에서는 소스 코드를 수정하지 않고 `.omo` 계획 산출물만 만든다

## Technical Decisions

- Use `omo:ulw-plan` first, not `omo:refactor`.
  - Reason: the problem is roadmap/worktree/process drift, not one bounded refactor target.
- Treat this as a brownfield architecture/process reset.
  - Reason: repo already has product code, Supabase backend, prior refactor docs, dirty worktree, and new AGENTS hierarchy.
- First executable milestone should be no-code baseline and triage.
  - Reason: current worktree is dirty and app behavior should not be changed before ownership of local changes is decided.
- Split current dirty worktree into at least two decision buckets.
  - Runtime/UI bucket: local Pretendard font migration plus login copyright polish.
  - Meta bucket: generated `AGENTS.md` hierarchy from `omo:init-deep`.
- Use `start-work` only after the plan is accepted.
  - Reason: it writes Boulder state, executes checkboxes, and requires full QA/ledger evidence.
- Use `review-work` after each significant implementation milestone.
  - Reason: the user concern is loss of direction and trust, so completion needs independent review evidence.

## Research Findings

- Current branch: `main`, tracking `origin/main`, dirty worktree.
- Modified tracked files: `index.html`, `src/routes/Login.tsx`, `src/styles/app.css`, `src/styles/base.css`, `src/styles/modals.css`, `src/styles/routes-login.css`, `tailwind.config.js`.
- Untracked runtime files: `src/styles/fonts.css`, `public/fonts/pretendard/*.otf`.
- Untracked meta files: root and scoped `AGENTS.md` files under `src`, `src/components`, `src/hooks`, `src/styles`, `src/utils`, `supabase`.
- App dirty diff is coherent: remove external Google Fonts, add local Pretendard font faces/assets, switch font stacks, add login copyright.
- Font asset addition is a binary/repo-size/licensing decision and should not be silently bundled into a random UI commit.
- Prior docs already record substantial clean-code work and quality gates:
  - `docs/refactor-plan-2026-05-01.md`
  - `docs/performance-refactor-plan-2026-05-01.md`
  - `docs/project-overview-report-2026-04-20.md`
- Old overview says "README/doc/source drift" and recommends baseline/documentation reset before more feature work.
- Current root `AGENTS.md` now documents repo structure, commands, anti-patterns, and scoped boundaries.
- Quality command surface:
  - `npm run lint`
  - `npm run test`
  - `npm run test:coverage`
  - `npm run build`
  - `npm run check:bundle`
  - `npm audit --audit-level=high`
- Current automated tests are mostly `src/lib` and `src/utils`; no route/component E2E suite was found.
- Metis gap analysis added required guardrails:
  - explicit commit/branch/no-revert policy
  - font license and binary-size acceptance criteria
  - concrete manual QA routes and auth fallback
  - durable roadmap artifact separate from `.omo` execution plan
  - stale-doc supersession rules
  - `npm audit --audit-level=high` as baseline because historical docs disagree on audit state

## Open Questions

- None blocking for plan generation after applying defaults.
- Assumption: local Pretendard migration and login copyright should be evaluated as pending work, not discarded.
- Assumption: generated `AGENTS.md` hierarchy should be kept as repo/process guidance unless user later says it should remain local-only.
- Assumption: no commits, branches, staging, stash, or destructive cleanup are part of the plan unless the user later asks.
- Assumption: authenticated/admin QA is conditional on available Supabase env and session state; public-route smoke QA is mandatory.

## Scope Boundaries

- INCLUDE: worktree triage, milestone reset, quality gates, immediate cleanup order, execution handoff plan, review gates.
- INCLUDE: current dirty files classification and commit/branch policy recommendation.
- INCLUDE: OMO workflow sequence (`ulw-plan`, `start-work`, `review-work`, targeted `refactor` only after scope is clear).
- EXCLUDE: source code edits during planning.
- EXCLUDE: destructive cleanup or reverting user changes.
- EXCLUDE: broad new product features before baseline is restored.

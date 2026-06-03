# First Load Icon Key Flash Fix Plan

## TL;DR
> **Summary**: The repo has no i18n subsystem; the "translation keys" are most likely Material Symbols ligature strings such as `calendar_month`, `person`, and `add_circle` flashing while the external Google font loads. Fix by proving the flash under delayed font loading, self-hosting Material Symbols, hiding ligatures until the icon font is ready, and routing JSX icon rendering through one safe component.
> **Deliverables**:
> - TDD regression for first-load icon-key flash under delayed/blocked Material Symbols loading
> - Local Material Symbols font delivery with readiness guard
> - `MaterialIcon` component and migration away from raw icon ligature text in JSX
> - Updated Puppeteer public-route QA artifacts proving no visible raw keys during the first 4 seconds
> **Effort**: Medium
> **Parallel**: YES - 3 waves
> **Critical Path**: Task 1 -> Task 2 -> Task 3 -> Task 4 -> Final Verification

## Context

### Original Request
처음 접속했을 때 번역키가 일시적으로 3-4초 정도 노출되고 디자인이 보이는 문제가 있으니, 이 문제를 해결할 계획을 세워달라는 요청.

### Interview Summary
- User asked for a plan via `omo:ulw-plan`, not implementation.
- No blocking user decision remains. Defaults are applied below.
- Default root cause: visible "번역키" means Material Symbols ligature keys, because no app i18n code exists.
- Desired behavior: raw key/ligature text must never be visible. Icon slots may reserve space while the font is loading, and icons must render once the local font is ready.

### Research Findings
- `package.json:6` defines `dev`, `build`, `check:bundle`, `qa:public-routes`, `test`, and `lint`.
- `package.json:16` lists React, Vite, `lucide-react`, Puppeteer, and Vitest; no `i18next`, `react-i18next`, or locale-loading dependency exists.
- `index.html:34` preconnects Google Fonts and `index.html:37` loads `Material+Symbols+Outlined` with `display=swap`.
- `src/styles/app.css:1` imports `tokens.css`, then `fonts.css`, then `base.css`; keep this order.
- `src/styles/base.css:47` owns Material Symbols normalization but does not prevent fallback ligature text.
- `src/main.tsx:3` imports global CSS before app render.
- `src/App.tsx:85` defines the route fallback, and `src/App.tsx:113` wraps the lazy route tree in `Suspense`.
- `scripts/verify-public-routes.mjs:58` and `scripts/verify-public-routes.mjs:104` evaluate public routes, but `scripts/verify-public-routes.mjs:156` waits for `networkidle0`, so it can miss an early 3-4 second flash.
- `scripts/verify-public-routes.mjs:214` already checks `/login` desktop/mobile and `/legal/terms` desktop.
- `rg "material-symbols-outlined" src --glob '*.tsx' --glob '*.ts'` currently finds 138 JSX occurrences.

### Metis Review (gaps addressed)
- Add a true early-frame detector; final-state checks after `networkidle0` are insufficient.
- Use a public route first because authenticated `/` depends on Supabase session/profile.
- Simulate delayed/blocked Material Symbols font requests in Puppeteer to make the bug deterministic.
- Keep layout stable when icons are hidden during font loading.
- Avoid adding i18n or broad route/auth refactors unless evidence disproves the Material Symbols diagnosis.
- Do not rely on component-by-component edits alone; add a global guard in the style/font layer.
- If any icon-only controls are touched during migration, preserve or add accessible labels on their parent control.

## Work Objectives

### Core Objective
Prevent raw translation-like icon keys from being visibly exposed during first load, including slow or blocked icon-font loading, while keeping existing Roomin visual layout stable.

### Deliverables
- `public/fonts/material-symbols/MaterialSymbolsOutlined.woff2`
- `public/fonts/material-symbols/LICENSE.txt`
- `src/utils/materialSymbolsReady.ts`
- `src/utils/materialSymbolsReady.test.ts`
- `src/components/MaterialIcon.tsx`
- `src/components/MaterialIcon.test.tsx`
- Updated `src/main.tsx`, `src/styles/fonts.css`, `src/styles/base.css`, `index.html`
- JSX migration away from direct Material Symbols ligature text in `src/routes/**` and `src/components/**`
- Updated `scripts/verify-public-routes.mjs` with first-load flash detection
- Evidence files under `.omo/evidence/`

### Definition of Done (verifiable conditions with commands)
- `npm run test` exits 0.
- `npm run lint` exits 0.
- `npm run build` exits 0.
- `npm run check:bundle` exits 0.
- `npm run qa:public-routes` exits 0 and reports no visible raw icon-key text in delayed-font first-load samples.
- `rg -n "fonts.googleapis.com|fonts.gstatic.com" index.html src scripts` returns no runtime dependency on Google Fonts for Material Symbols.
- `rg -n "<span[^\\n]*material-symbols-outlined|className=\\{?\\`[^\\n]*material-symbols-outlined" src --glob '*.tsx' -g '!src/components/MaterialIcon.tsx'` returns no direct JSX Material Symbols spans.
- `.omo/evidence/final-icon-key-flash-browser.json` exists and includes PASS results for desktop `/legal/terms`, mobile `/legal/terms`, desktop `/login`, and mobile `/login`.

### Must Have
- Test-first RED->GREEN proof for the first-load flash detector.
- No generated `dist/`, `coverage/`, or dependency file edits.
- No full i18n library added.
- No auth, reservation, Supabase, route guard, or query-cache behavior changes.
- Existing visual hierarchy and layout spacing must remain stable.

### Must NOT Have
- Do not use `as any`, `@ts-ignore`, or `@ts-expect-error`.
- Do not weaken or skip existing tests.
- Do not use `npm audit fix --force`.
- Do not replace Material Symbols with broad unrelated redesign work.
- Do not leave external Google Material Symbols as the primary runtime dependency after the local font is added.

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: TDD with Vitest for utility/component contracts plus Puppeteer QA for the rendered first-load surface.
- QA policy: Every task has agent-executed scenarios.
- Evidence: `.omo/evidence/task-{N}-{slug}.{json,png,txt}`
- Browser path: Browser plugin is available in this session; for implementation QA, use Browser when driving a known localhost page interactively. For the repository's existing automated QA, keep `scripts/verify-public-routes.mjs` on Puppeteer because that is the current project harness.

## Execution Strategy

### Parallel Execution Waves
Wave 1: Task 1
Wave 2: Tasks 2 and 3 after Task 1 RED evidence is captured
Wave 3: Task 4 after Tasks 2 and 3 are GREEN
Final: Final Verification Wave

### Dependency Matrix (full, all tasks)
| Task | Blocks | Blocked By |
|---|---|---|
| 1. Add deterministic flash regression | 2, 3, 4 | none |
| 2. Self-host Material Symbols and add readiness guard | 4 | 1 |
| 3. Add `MaterialIcon` and migrate raw JSX ligatures | 4 | 1 |
| 4. Harden public-route QA and source sweeps | Final | 1, 2, 3 |
| F1-F4. Final Verification Wave | completion | 1-4 |

## TODOs
> Implementation + Test = ONE task. Every production task starts with the failing test/check, captures RED, then applies the smallest implementation needed for GREEN.

- [x] 1. Add deterministic first-load icon-key flash regression

  **What to do**:
  - Edit `scripts/verify-public-routes.mjs` only.
  - Add a helper named `collectVisibleIconKeyLeaks(page)` that inspects `.material-symbols-outlined` elements and returns entries only when a raw icon key is visibly rendered. Treat these as keys: `calendar_month`, `calendar_today`, `person`, `add_circle`, `arrow_back`, `schedule`, `music_note`, `event_busy`, `draft`, `error`, `groups`, and any visible text matching `/^[a-z]+(?:_[a-z0-9]+)+$/`.
  - Add a delayed-font scenario for `/legal/terms` that intercepts `fonts.googleapis.com` and `fonts.gstatic.com` Material Symbols requests and holds them for 4 seconds before continuing. Do not delay app JS or CSS.
  - Sample at `DOMContentLoaded`, `250ms`, `1000ms`, and `4000ms` after navigation start. Save `path`, `viewport`, `sampleMs`, `leaks`, `materialSymbolsReady`, and screenshot path for every sample.
  - Keep existing final-state `/login` and `/legal/terms` checks, but do not change the production app yet.
  - Run `npm run qa:public-routes` and capture RED output showing at least one visible raw icon key in the delayed-font `/legal/terms` scenario.

  **Must NOT do**:
  - Do not change `index.html`, `src/**`, or font assets in this task.
  - Do not remove existing route checks.
  - Do not make the detector wait for `networkidle0` before sampling the flash window.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 2, 3, 4 | Blocked By: none

  **References**:
  - Pattern: `scripts/verify-public-routes.mjs:10` - existing `delay(ms)` helper.
  - Pattern: `scripts/verify-public-routes.mjs:58` - existing route evaluator shape.
  - Pattern: `scripts/verify-public-routes.mjs:144` - existing `checkScenario` browser lifecycle.
  - Pattern: `scripts/verify-public-routes.mjs:179` - existing failure collection.
  - Pattern: `scripts/verify-public-routes.mjs:214` - existing scenario registry.
  - Evidence route: `src/routes/LegalDocumentRoute.tsx:30` renders a public Material Symbols icon.
  - Root cause: `index.html:37` uses external Material Symbols with `display=swap`.

  **Acceptance Criteria**:
  - [ ] `npm run qa:public-routes` exits non-zero before the production fix.
  - [ ] RED output contains a failure with the exact prefix `visible icon key leak`.
  - [ ] `.omo/evidence/task-1-font-delay-red.json` records at least one leaked key and the sample timestamp.
  - [ ] `.omo/evidence/task-1-font-delay-red.png` shows the `/legal/terms` delayed-font state.

  **QA Scenarios**:
  ```text
  Scenario: Delayed Material Symbols exposes raw key before fix
    Tool: bash
    Steps: mkdir -p .omo/evidence && npm run qa:public-routes 2>&1 | tee .omo/evidence/task-1-qa-red.txt
    Expected: command exits non-zero and output includes "visible icon key leak"
    Evidence: .omo/evidence/task-1-qa-red.txt

  Scenario: Existing final-state route checks still run
    Tool: bash
    Steps: inspect .omo/evidence/task-1-font-delay-red.json for login desktop, login mobile, terms desktop entries
    Expected: JSON includes existing scenario names plus delayed-font terms samples
    Evidence: .omo/evidence/task-1-font-delay-red.json
  ```

  **Commit**: NO | Draft Message: `test(icons): catch first-load material symbol key flash` | Files: `scripts/verify-public-routes.mjs`

- [x] 2. Self-host Material Symbols and add font readiness guard

  **What to do**:
  - Write `src/utils/materialSymbolsReady.test.ts` first. It must fail because `initMaterialSymbolsReady` does not exist yet.
  - Test cases:
    - adds `roomin-material-symbols-loading` immediately and `roomin-material-symbols-ready` after `document.fonts.load('24px "Material Symbols Outlined"')` resolves.
    - adds `roomin-material-symbols-failed` after a timeout/rejection without ever adding `ready`.
    - never throws when `document.fonts` is unavailable; in that case it must add `roomin-material-symbols-failed` so raw keys remain hidden.
  - Add `src/utils/materialSymbolsReady.ts` with `initMaterialSymbolsReady(options?)`. Keep it framework-free and testable with injected `document`, `timeoutMs`, and `setTimeout`/`clearTimeout`.
  - Call `initMaterialSymbolsReady()` in `src/main.tsx` before `createRoot(...).render(...)`.
  - Add `public/fonts/material-symbols/MaterialSymbolsOutlined.woff2` from the official Material Symbols Outlined Google Fonts asset and add `public/fonts/material-symbols/LICENSE.txt`.
  - Use these exact source steps unless Google Fonts changes the generated CSS format:
    - `mkdir -p public/fonts/material-symbols .omo/evidence`
    - `curl -fsSL -A "Mozilla/5.0" "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block" -o .omo/evidence/material-symbols-source.css`
    - Extract the first `https://fonts.gstatic.com/...woff2` URL from `.omo/evidence/material-symbols-source.css`.
    - `curl -fsSL "<extracted-woff2-url>" -o public/fonts/material-symbols/MaterialSymbolsOutlined.woff2`
    - `curl -fsSL "https://raw.githubusercontent.com/google/material-design-icons/master/LICENSE" -o public/fonts/material-symbols/LICENSE.txt`
  - Record the extracted WOFF2 URL and byte size in `.omo/evidence/task-2-font-source.txt`.
  - Add `@font-face` for `Material Symbols Outlined` to `src/styles/fonts.css`; use local `/fonts/material-symbols/MaterialSymbolsOutlined.woff2`, `format('woff2')`, and `font-display: block`.
  - Remove the external Material Symbols Google Fonts preconnect/link from `index.html`.
  - Update `src/styles/base.css` so `.material-symbols-outlined` has stable icon-box dimensions and hides pseudo/ligature content while `html` has `roomin-material-symbols-loading` or `roomin-material-symbols-failed`.
  - CSS guard must preserve layout: `display: inline-flex`, `align-items: center`, `justify-content: center`, `line-height: 1`, `width: 1em`, `height: 1em`, `overflow: hidden`, `vertical-align: middle`, `flex-shrink: 0`.

  **Must NOT do**:
  - Do not reorder `src/styles/app.css` imports.
  - Do not add another external font provider.
  - Do not mark failed font loading as ready.
  - Do not alter Pretendard font faces.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 4 | Blocked By: 1

  **References**:
  - Pattern: `src/styles/app.css:1` - keep import order stable.
  - Pattern: `src/styles/fonts.css:1` - local font-face declarations live here.
  - Pattern: `src/styles/base.css:47` - Material Symbols normalization belongs here.
  - Pattern: `src/main.tsx:3` - CSS is imported before app render.
  - Pattern: `src/utils/dateLabels.test.ts:1` - Vitest style.
  - Project rule: `src/styles/AGENTS.md:27` - keep `app.css` order deterministic.
  - Project rule: `src/styles/AGENTS.md:30` - `base.css` owns reset/base behavior.
  - External: `https://developers.google.com/fonts/docs/material_symbols` - Material Symbols docs recommend `display=block` to prevent FOUC and document self-hosting.
  - External: `https://github.com/google/material-design-icons` - official Material Symbols repository and Apache 2.0 license.

  **Acceptance Criteria**:
  - [ ] `npm run test -- src/utils/materialSymbolsReady.test.ts` fails before implementation and passes after implementation.
  - [ ] `index.html` no longer contains `fonts.googleapis.com`, `fonts.gstatic.com`, or `Material+Symbols+Outlined`.
  - [ ] `src/styles/fonts.css` contains exactly one `@font-face` for `Material Symbols Outlined`.
  - [ ] `src/styles/base.css` keeps icon boxes stable and hides icon glyph content until `roomin-material-symbols-ready`.
  - [ ] `.omo/evidence/task-2-font-source.txt` records the font source URL and license file path.

  **QA Scenarios**:
  ```text
  Scenario: Readiness utility RED->GREEN
    Tool: bash
    Steps: npm run test -- src/utils/materialSymbolsReady.test.ts
    Expected: RED before utility exists; GREEN after src/utils/materialSymbolsReady.ts is implemented
    Evidence: .omo/evidence/task-2-vitest-red.txt and .omo/evidence/task-2-vitest-green.txt

  Scenario: Runtime no longer depends on Google Material Symbols
    Tool: bash
    Steps: rg -n "fonts.googleapis.com|fonts.gstatic.com|Material\\+Symbols\\+Outlined" index.html src scripts
    Expected: no runtime match outside documentation/evidence; command exits non-zero or prints no matches
    Evidence: .omo/evidence/task-2-google-font-sweep.txt
  ```

  **Commit**: NO | Draft Message: `fix(icons): self-host material symbols and gate first paint` | Files: `index.html`, `src/main.tsx`, `src/styles/fonts.css`, `src/styles/base.css`, `src/utils/materialSymbolsReady.ts`, `src/utils/materialSymbolsReady.test.ts`, `public/fonts/material-symbols/*`

- [x] 3. Add `MaterialIcon` component and migrate raw JSX ligatures

  **What to do**:
  - Write `src/components/MaterialIcon.test.tsx` first using `react-dom/server` and Vitest; do not add Testing Library or jsdom.
  - Tests:
    - renders a `span.material-symbols-outlined` with `data-icon="calendar_month"` and no text child.
    - forwards `className`, `style`, and non-dangerous span props.
    - defaults `aria-hidden="true"`.
    - supports `filled` by applying `fontVariationSettings: "'FILL' 1"` while preserving caller-provided style keys.
  - Add `src/components/MaterialIcon.tsx`.
  - Component props must include:
    - `name: string`
    - `className?: string`
    - `filled?: boolean`
    - all safe `React.HTMLAttributes<HTMLSpanElement>` except `children` and `dangerouslySetInnerHTML`
  - Component render contract:
    - `<span className={...} data-icon={name} aria-hidden="true" />`
    - no text children
    - always include `material-symbols-outlined`
  - Migrate every JSX Material Symbols span under `src/routes/**` and `src/components/**` to `MaterialIcon`.
  - Preserve all existing class names except remove the literal `material-symbols-outlined` from call sites because the component adds it.
  - Preserve inline styles and variation settings. Replace inline `"FILL" 1` with `filled` where possible; otherwise keep caller style.
  - For icon-only buttons touched in this migration, add an `aria-label` to the button if it currently has no visible text and no label.
  - Do not migrate CSS selectors; `.material-symbols-outlined` selectors in CSS remain valid because `MaterialIcon` still renders that class.

  **Must NOT do**:
  - Do not change labels, Korean copy, route structure, data hooks, or Supabase calls.
  - Do not replace icons with Lucide in this task.
  - Do not leave direct Material Symbols text children in TSX.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 4 | Blocked By: 1

  **References**:
  - Public route examples: `src/routes/LegalDocumentRoute.tsx:30`, `src/routes/LegalDocumentRoute.tsx:44`, `src/routes/LegalDocumentRoute.tsx:52`.
  - Shell examples: `src/routes/AppShell.tsx:74`, `src/routes/AppShell.tsx:99`.
  - Bottom nav examples: `src/components/BottomNav.tsx:5`, `src/components/BottomNav.tsx:43`.
  - Dashboard examples: `src/components/DashboardView.tsx:69`, `src/components/DashboardView.tsx:167`, `src/components/DashboardView.tsx:228`.
  - Dynamic event category examples: `src/components/events/EventCategoryEditor.tsx:94`, `src/components/events/EventCategoryEditor.tsx:147`.
  - Dynamic budget category examples: `src/components/BudgetTransactionModal/CategorySection.tsx:78`, `src/components/BudgetTransactionModal/CategorySection.tsx:141`.
  - Component conventions: `src/components/AGENTS.md:25` - shared visual primitives belong in components/CSS, not route-local duplication.

  **Acceptance Criteria**:
  - [ ] `npm run test -- src/components/MaterialIcon.test.tsx` fails before implementation and passes after implementation.
  - [ ] `rg -n "<span[^\\n]*material-symbols-outlined|className=\\{?\\`[^\\n]*material-symbols-outlined" src --glob '*.tsx' -g '!src/components/MaterialIcon.tsx'` returns no direct JSX spans.
  - [ ] `rg -n ">\\s*(calendar_month|calendar_today|person|add_circle|arrow_back|schedule|music_note|event_busy|draft|error|groups)\\s*</span>" src --glob '*.tsx'` returns no matches.
  - [ ] All touched icon-only buttons have either visible text or `aria-label`.

  **QA Scenarios**:
  ```text
  Scenario: Component contract has no text-child key
    Tool: bash
    Steps: npm run test -- src/components/MaterialIcon.test.tsx
    Expected: RED before component exists; GREEN after MaterialIcon renders data-icon without children
    Evidence: .omo/evidence/task-3-material-icon-red.txt and .omo/evidence/task-3-material-icon-green.txt

  Scenario: Source sweep has no raw JSX Material Symbols spans
    Tool: bash
    Steps: rg -n "<span[^\\n]*material-symbols-outlined|>\\s*(calendar_month|calendar_today|person|add_circle|arrow_back|schedule|music_note|event_busy|draft|error|groups)\\s*</span>" src --glob '*.tsx' -g '!src/components/MaterialIcon.tsx' -g '!src/components/MaterialIcon.test.tsx'
    Expected: no matches except if the match is inside MaterialIcon test fixture; test fixtures must use explicit "fixture" comments
    Evidence: .omo/evidence/task-3-source-sweep.txt
  ```

  **Commit**: NO | Draft Message: `refactor(icons): route material symbols through safe component` | Files: `src/components/MaterialIcon.tsx`, `src/components/MaterialIcon.test.tsx`, `src/routes/**/*.tsx`, `src/components/**/*.tsx`

- [x] 4. Harden public-route QA for first-load, final-state, and mobile surfaces

  **What to do**:
  - Update `scripts/verify-public-routes.mjs` after Tasks 2 and 3 so it reflects local Material Symbols delivery.
  - Replace old `materialSymbolsStylesheet` checks with:
    - `localMaterialSymbolsFontFace`: `document.fonts.check('24px "Material Symbols Outlined"')`
    - `materialSymbolsReadyClass`: `document.documentElement.classList.contains('roomin-material-symbols-ready')`
    - `visibleIconKeyLeaks`: result of `collectVisibleIconKeyLeaks(page)`
    - `externalMaterialSymbolsStylesheets`: any stylesheet URL containing `fonts.googleapis.com` or `fonts.gstatic.com`
  - Keep existing Pretendard checks.
  - Add mobile `/legal/terms` scenario at `390x844`.
  - In delayed-font mode, block or delay local `/fonts/material-symbols/MaterialSymbolsOutlined.woff2` for 4 seconds and assert:
    - no raw key text is visible at 0, 250, 1000, or 4000 ms;
    - icon boxes reserve nonzero dimensions;
    - final state after font release has no leaks and `Material Symbols Outlined` is active.
  - Save JSON and screenshots to `.omo/evidence/`.

  **Must NOT do**:
  - Do not remove `/login` checks.
  - Do not weaken console warning/error collection.
  - Do not make QA depend on a real Supabase account.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: Final | Blocked By: 1, 2, 3

  **References**:
  - Existing public QA routes: `scripts/verify-public-routes.mjs:214`.
  - Existing font checks: `scripts/verify-public-routes.mjs:87`, `scripts/verify-public-routes.mjs:126`.
  - Existing failures list: `scripts/verify-public-routes.mjs:179`.
  - Existing dev server lifecycle: `scripts/verify-public-routes.mjs:31`, `scripts/verify-public-routes.mjs:51`, `scripts/verify-public-routes.mjs:257`.

  **Acceptance Criteria**:
  - [ ] `npm run qa:public-routes` exits 0 after Tasks 2 and 3.
  - [ ] `.omo/evidence/task-4-public-routes-green.json` includes delayed-font samples and final-state samples.
  - [ ] JSON shows `visibleIconKeyLeaks: []` for every sample.
  - [ ] JSON shows no external Google font stylesheets for app fonts or Material Symbols.
  - [ ] Screenshots exist for desktop `/legal/terms`, mobile `/legal/terms`, desktop `/login`, and mobile `/login`.

  **QA Scenarios**:
  ```text
  Scenario: Delayed local Material Symbols never exposes raw keys
    Tool: bash
    Steps: npm run qa:public-routes 2>&1 | tee .omo/evidence/task-4-qa-green.txt
    Expected: command exits 0 and JSON has visibleIconKeyLeaks: [] for all delayed-font samples
    Evidence: .omo/evidence/task-4-qa-green.txt and .omo/evidence/task-4-public-routes-green.json

  Scenario: Mobile public route keeps layout and final icon rendering
    Tool: bash
    Steps: inspect .omo/evidence/task-4-public-routes-green.json scenario "terms mobile"
    Expected: articleVisible true, headingVisible true, localMaterialSymbolsFontFace true after final state, no overlap/console failures
    Evidence: .omo/evidence/task-4-terms-mobile.png
  ```

  **Commit**: NO | Draft Message: `test(qa): verify first-load icons without key flashes` | Files: `scripts/verify-public-routes.mjs`

## Final Verification Wave (MANDATORY - after ALL implementation tasks)
> ALL must APPROVE. Present consolidated results to user and do not commit without explicit user approval.

- [x] F1. Plan Compliance Audit
  - Command: `git diff --name-only`
  - PASS if changed files are limited to the deliverables listed in this plan plus `.omo/evidence/`.
  - PASS if no generated `dist/`, `coverage/`, or dependency files are changed.

- [x] F2. Code Quality Review
  - Commands:
    - `npm run test`
    - `npm run lint`
    - `npm run build`
    - `npm run check:bundle`
  - PASS if all exit 0.

- [x] F3. Real Manual QA
  - Tool: Browser plugin for interactive localhost confirmation, plus existing Puppeteer script for automated evidence.
  - Browser invocation:
    - start `npm run dev -- --host 127.0.0.1`
    - open `http://127.0.0.1:5150/legal/terms`
    - set viewport `390x844`
    - verify page identity, not blank, no framework overlay, no console errors/warnings, and screenshot shows legal page without `arrow_back`/`draft` raw text.
  - Puppeteer command:
    - `npm run qa:public-routes`
  - PASS if Browser screenshot and Puppeteer JSON both show no raw key text during first-load samples.

- [x] F4. Scope Fidelity Check
  - Commands:
    - `rg -n "i18next|react-i18next|useTranslation|createI18n" package.json src`
    - `rg -n "fonts.googleapis.com|fonts.gstatic.com" index.html src scripts`
    - `rg -n "<span[^\\n]*material-symbols-outlined|className=\\{?\\`[^\\n]*material-symbols-outlined" src --glob '*.tsx' -g '!src/components/MaterialIcon.tsx'`
  - PASS if no i18n system was added, no Google font runtime dependency remains, and no direct JSX Material Symbols spans remain outside `MaterialIcon`.

## Commit Strategy
- Do not auto-commit unless the user explicitly asks.
- If the user asks for commits later, use one atomic commit:
  - `fix(icons): prevent first-load material symbol key flashes`
- Commit body must mention:
  - RED evidence: `.omo/evidence/task-1-qa-red.txt`
  - GREEN evidence: `.omo/evidence/task-4-qa-green.txt`
  - Plan: `.omo/plans/first-load-icon-key-flash.md`

## Success Criteria
- Raw Material Symbols/i18n-like key text is never visibly exposed during the first 4 seconds of delayed icon-font loading.
- Icons reserve stable space while loading and render after the local font is ready.
- Runtime no longer depends on Google Fonts for Material Symbols.
- All direct JSX Material Symbols spans route through `MaterialIcon`.
- Unit tests, lint, build, bundle check, and browser QA pass with captured evidence.

# Worktree Triage - 2026-06-03

## Purpose

This report classifies the current dirty worktree so runtime changes, process
guidance, and OMO execution artifacts do not get mixed into one unclear change.
No staging, commit, stash, branch creation, discard, checkout, or destructive
revert was performed while producing this report.

## Command Snapshots

### `git status --short --branch`

Snapshot captured before this report file was written:

```text
## main...origin/main
 M index.html
 M src/routes/Login.tsx
 M src/styles/app.css
 M src/styles/base.css
 M src/styles/modals.css
 M src/styles/routes-login.css
 M tailwind.config.js
?? .omo/
?? AGENTS.md
?? public/fonts/
?? src/AGENTS.md
?? src/components/AGENTS.md
?? src/hooks/AGENTS.md
?? src/styles/AGENTS.md
?? src/styles/fonts.css
?? src/utils/AGENTS.md
?? supabase/AGENTS.md
```

Verification snapshot after this report file was written:

```text
## main...origin/main
 M index.html
 M src/routes/Login.tsx
 M src/styles/app.css
 M src/styles/base.css
 M src/styles/modals.css
 M src/styles/routes-login.css
 M tailwind.config.js
?? .omo/
?? AGENTS.md
?? docs/worktree-triage-2026-06-03.md
?? public/fonts/
?? src/AGENTS.md
?? src/components/AGENTS.md
?? src/hooks/AGENTS.md
?? src/styles/AGENTS.md
?? src/styles/fonts.css
?? src/utils/AGENTS.md
?? supabase/AGENTS.md
```

### `git diff --name-status`

```text
M	index.html
M	src/routes/Login.tsx
M	src/styles/app.css
M	src/styles/base.css
M	src/styles/modals.css
M	src/styles/routes-login.css
M	tailwind.config.js
```

### `git diff --stat`

```text
 index.html                  |  4 ----
 src/routes/Login.tsx        |  4 ++++
 src/styles/app.css          |  1 +
 src/styles/base.css         |  4 ++--
 src/styles/modals.css       |  2 +-
 src/styles/routes-login.css | 16 +++++++++++++++-
 tailwind.config.js          |  6 +++---
 7 files changed, 26 insertions(+), 11 deletions(-)
```

### Untracked OMO Files

```text
.omo/boulder.json
.omo/drafts/roomin-realignment.md
.omo/plans/roomin-realignment.md
.omo/start-work/ledger.jsonl
```

### Untracked Font Assets

```text
public/fonts/pretendard/Pretendard-Black.otf
public/fonts/pretendard/Pretendard-Bold.otf
public/fonts/pretendard/Pretendard-ExtraBold.otf
public/fonts/pretendard/Pretendard-ExtraLight.otf
public/fonts/pretendard/Pretendard-Light.otf
public/fonts/pretendard/Pretendard-Medium.otf
public/fonts/pretendard/Pretendard-Regular.otf
public/fonts/pretendard/Pretendard-SemiBold.otf
public/fonts/pretendard/Pretendard-Thin.otf
```

Font asset directory size snapshot:

```text
13M	public/fonts/pretendard
```

## Classification Table

| Path | Status | Classification | Change group | Rationale |
|---|---:|---|---|---|
| `index.html` | modified | `keep-runtime` | Runtime font/login | Removes the external app-font Google Fonts stylesheet while preserving Material Symbols loading. |
| `src/routes/Login.tsx` | modified | `keep-runtime` | Runtime font/login | Adds the login copyright line; belongs with login visual QA. |
| `src/styles/app.css` | modified | `keep-runtime` | Runtime font/login | Imports the new local font stylesheet before base styles. |
| `src/styles/base.css` | modified | `keep-runtime` | Runtime font/login | Switches global and headline font stacks to Pretendard. |
| `src/styles/modals.css` | modified | `keep-runtime` | Runtime font/login | Aligns primary button typography with Pretendard. |
| `src/styles/routes-login.css` | modified | `keep-runtime` | Runtime font/login | Styles the login copyright line with dark/mobile variants. |
| `tailwind.config.js` | modified | `keep-runtime` | Runtime font/login | Aligns Tailwind font families with Pretendard. |
| `src/styles/fonts.css` | untracked | `keep-runtime` | Runtime font/login | Defines local Pretendard `@font-face` rules. |
| `public/fonts/pretendard/Pretendard-Black.otf` | untracked | `keep-runtime` | Runtime font/login | Task 3 recorded license/source and 13M size evidence; keep with runtime group and call out weight in review notes. |
| `public/fonts/pretendard/Pretendard-Bold.otf` | untracked | `keep-runtime` | Runtime font/login | Task 3 recorded license/source and 13M size evidence; keep with runtime group and call out weight in review notes. |
| `public/fonts/pretendard/Pretendard-ExtraBold.otf` | untracked | `keep-runtime` | Runtime font/login | Task 3 recorded license/source and 13M size evidence; keep with runtime group and call out weight in review notes. |
| `public/fonts/pretendard/Pretendard-ExtraLight.otf` | untracked | `keep-runtime` | Runtime font/login | Task 3 recorded license/source and 13M size evidence; keep with runtime group and call out weight in review notes. |
| `public/fonts/pretendard/Pretendard-Light.otf` | untracked | `keep-runtime` | Runtime font/login | Task 3 recorded license/source and 13M size evidence; keep with runtime group and call out weight in review notes. |
| `public/fonts/pretendard/Pretendard-Medium.otf` | untracked | `keep-runtime` | Runtime font/login | Task 3 recorded license/source and 13M size evidence; keep with runtime group and call out weight in review notes. |
| `public/fonts/pretendard/Pretendard-Regular.otf` | untracked | `keep-runtime` | Runtime font/login | Task 3 recorded license/source and 13M size evidence; keep with runtime group and call out weight in review notes. |
| `public/fonts/pretendard/Pretendard-SemiBold.otf` | untracked | `keep-runtime` | Runtime font/login | Task 3 recorded license/source and 13M size evidence; keep with runtime group and call out weight in review notes. |
| `public/fonts/pretendard/Pretendard-Thin.otf` | untracked | `keep-runtime` | Runtime font/login | Task 3 recorded license/source and 13M size evidence; keep with runtime group and call out weight in review notes. |
| `AGENTS.md` | untracked | `keep-meta` | Agent guidance | Repo-level guidance generated by `omo:init-deep`; process/meta change, not runtime. |
| `src/AGENTS.md` | untracked | `keep-meta` | Agent guidance | Source-layer guidance generated by `omo:init-deep`. |
| `src/components/AGENTS.md` | untracked | `keep-meta` | Agent guidance | Component/modal guidance generated by `omo:init-deep`. |
| `src/hooks/AGENTS.md` | untracked | `keep-meta` | Agent guidance | Hook/query guidance generated by `omo:init-deep`. |
| `src/styles/AGENTS.md` | untracked | `keep-meta` | Agent guidance | Style-layer guidance generated by `omo:init-deep`. |
| `src/utils/AGENTS.md` | untracked | `keep-meta` | Agent guidance | Utility/test guidance generated by `omo:init-deep`. |
| `supabase/AGENTS.md` | untracked | `keep-meta` | Agent guidance | Supabase/backend guidance generated by `omo:init-deep`. |
| `.omo/boulder.json` | untracked | `keep-omo` | OMO execution state | Boulder state required by `omo:start-work`; process artifact. |
| `.omo/drafts/roomin-realignment.md` | untracked | `keep-omo` | OMO planning | Planning draft from `omo:ulw-plan`; process artifact. |
| `.omo/plans/roomin-realignment.md` | untracked | `keep-omo` | OMO planning | Active execution plan for this run. |
| `.omo/start-work/ledger.jsonl` | untracked | `keep-omo` | OMO evidence | Evidence ledger for `omo:start-work`; process artifact. |
| `docs/worktree-triage-2026-06-03.md` | untracked | `keep-omo` | OMO workstream docs | This triage deliverable; created by Task 1. |
| `.omo/start-work/runtime-font-login-browser-qa.json` | untracked | `keep-omo` | OMO evidence | Browser QA evidence created by Task 3. |
| `.omo/start-work/screenshots/login-desktop-1280x720.png` | untracked | `keep-omo` | OMO evidence | Browser QA screenshot created by Task 3. |
| `.omo/start-work/screenshots/login-mobile-390x844.png` | untracked | `keep-omo` | OMO evidence | Browser QA screenshot created by Task 3. |
| `.omo/start-work/screenshots/terms-desktop-1280x720.png` | untracked | `keep-omo` | OMO evidence | Initial legal-page screenshot captured before the document body finished loading; retained as process evidence. |
| `.omo/start-work/screenshots/terms-desktop-1280x720-loaded.png` | untracked | `keep-omo` | OMO evidence | Final legal-page browser QA screenshot created by Task 3. |
| `docs/roadmap-reset-2026-06-03.md` | untracked | `keep-omo` | OMO workstream docs | Roadmap reset deliverable created by Task 2. |
| `docs/runtime-font-login-closeout-2026-06-03.md` | untracked | `keep-omo` | OMO workstream docs | Runtime font/login closeout deliverable created by Task 3. |
| `docs/agents-hierarchy-closeout-2026-06-03.md` | untracked | `keep-omo` | OMO workstream docs | AGENTS hierarchy closeout deliverable created by Task 4. |

## Change Groups

### Runtime Font/Login

Scope:
- `index.html`
- `src/routes/Login.tsx`
- `src/styles/app.css`
- `src/styles/base.css`
- `src/styles/modals.css`
- `src/styles/routes-login.css`
- `tailwind.config.js`
- `src/styles/fonts.css`
- `public/fonts/pretendard/*.otf`

Current interpretation:
- Coherent pending runtime change.
- Task 3 recorded font license/source and binary-size evidence in
  `docs/runtime-font-login-closeout-2026-06-03.md`.
- Ready for user-requested staging/commit as a runtime change group, with the
  13M repo-local font asset weight called out in review notes.

### Agent Guidance

Scope:
- root/scoped `AGENTS.md` files.

Current interpretation:
- Process/meta change generated by `omo:init-deep`.
- Should remain separate from runtime font/login changes.

### OMO Execution State

Scope:
- `.omo/boulder.json`
- `.omo/drafts/roomin-realignment.md`
- `.omo/plans/roomin-realignment.md`
- `.omo/start-work/ledger.jsonl`
- `.omo/start-work/runtime-font-login-browser-qa.json`
- `.omo/start-work/screenshots/*.png`
- `docs/worktree-triage-2026-06-03.md`
- `docs/roadmap-reset-2026-06-03.md`
- `docs/runtime-font-login-closeout-2026-06-03.md`
- `docs/agents-hierarchy-closeout-2026-06-03.md`

Current interpretation:
- OMO process artifacts for this planning/execution workflow.
- Should remain separate from runtime and agent-guidance changes.

## Notes

- No path is currently classified as `discard-candidate`.
- No destructive cleanup has been performed.
- Task 3 reclassified `public/fonts/pretendard` as `keep-runtime` after
  recording license, source, size, automated gate, and browser QA evidence.

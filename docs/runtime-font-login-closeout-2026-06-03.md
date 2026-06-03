# Runtime Font/Login Closeout - 2026-06-03

## Scope

Runtime change group:
- `index.html`
- `src/routes/Login.tsx`
- `src/styles/app.css`
- `src/styles/base.css`
- `src/styles/modals.css`
- `src/styles/routes-login.css`
- `tailwind.config.js`
- `src/styles/fonts.css`
- `public/fonts/pretendard/*.otf`

No staging, commit, stash, branch creation, discard, checkout, or destructive
revert was performed.

## Static Evidence

Font path check:
- All 9 `@font-face` paths referenced by `src/styles/fonts.css` exist under
  `public/fonts/pretendard/`.
- Directory size: `13M public/fonts/pretendard`.
- Per-file size: each OTF is about `1.4M` to `1.5M`.

Import and stack check:
- `src/styles/app.css` imports `./fonts.css` before `./base.css`.
- `index.html` no longer loads the previous Inter / Plus Jakarta / Pretendard
  app-font Google stylesheet.
- `index.html` still loads the Material Symbols stylesheet.
- `src/styles/base.css`, `src/styles/modals.css`, and `tailwind.config.js`
  agree on the `Pretendard, system-ui, -apple-system, sans-serif` stack.

Local license evidence:
- No local license file is present under `public/fonts/pretendard`.
- `strings public/fonts/pretendard/Pretendard-Regular.otf` shows Pretendard
  copyright/trademark metadata but not the full license text.

External license/source evidence:
- Official Pretendard license:
  `https://github.com/orioncactus/pretendard/blob/main/LICENSE`
- Official Pretendard docs:
  `https://github.com/orioncactus/pretendard/blob/main/packages/pretendard/docs/en/README.md`
- The official license identifies Pretendard as SIL Open Font License 1.1.
- The official docs list CDN, dynamic subset, variable dynamic subset, and
  variable font alternatives.

## Delivery Decision

Current repo-local OTF delivery is acceptable as a first-party, offline-friendly
pending runtime change because license evidence is verified and the browser only
loads the used weights on the checked public routes.

Tradeoff:
- This is heavier than the official webfont alternatives.
- `/login` loaded 4 OTF font assets in browser QA.
- A future performance pass should consider WOFF2, variable, or dynamic subset
  delivery if mobile first-load weight becomes a release blocker.

Classification update:
- `public/fonts/pretendard/*.otf`: `keep-runtime`
- Change group is ready for user-requested staging/commit as a runtime change,
  with the 13M font asset addition called out in review notes.

## Automated Verification

Passed:

```text
npm run lint
npm run test
npm run build
npm run check:bundle
npm audit --audit-level=high
```

Observed summaries:
- `npm run test`: 10 test files, 57 tests passed.
- `npm run build`: Vite build completed with PWA generation.
- `npm run check:bundle`: largest JS asset was `charts-vendor` at 385.2 KiB;
  CSS was 88.0 KiB; precache was 48 entries / 2.09 MiB.
- `npm audit --audit-level=high`: found 0 vulnerabilities.

## Browser QA

Dev server:
- Command: `npm run dev`
- URL: `http://localhost:5150`
- Cleanup: server stopped with `Ctrl-C`; `lsof -nP -iTCP:5150 -sTCP:LISTEN`
  returned no listener.

Artifacts:
- `.omo/start-work/runtime-font-login-browser-qa.json`
- `.omo/start-work/screenshots/login-desktop-1280x720.png`
- `.omo/start-work/screenshots/login-mobile-390x844.png`
- `.omo/start-work/screenshots/terms-desktop-1280x720-loaded.png`

Desktop `/login`:
- Viewport: `1280x720`
- `document.fonts.check('16px Pretendard')`: `true`
- Body/page font stack: `Pretendard, system-ui, -apple-system, sans-serif`
- Copyright text visible.
- No overlap between title, legal text, and copyright.
- Removed external app-font stylesheet absent.
- Material Symbols stylesheet still present.
- Console errors/warnings: none.
- Hard refresh check: pass.

Mobile `/login`:
- Viewport: `390x844`
- `document.fonts.check('16px Pretendard')`: `true`
- Copyright text visible.
- No overlap between title, legal text, and copyright.
- Console errors/warnings: none.
- Hard refresh check: pass.

Desktop `/legal/terms`:
- Viewport: `1280x720`
- Legal document article visible after load.
- `document.fonts.check('16px Pretendard')`: `true`
- Material Symbols icon visible with computed family `"Material Symbols
  Outlined"`.
- Console errors/warnings: none.

## Result

Runtime font/login change is verified as a coherent pending runtime change.
It is ready for user-requested staging/commit as its own change group. No commit
or staging was performed.

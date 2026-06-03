# STYLES KNOWLEDGE BASE

## OVERVIEW

`src/styles` is a layered global CSS system backed by CSS variables. Tailwind is
a token adapter, not the only styling surface.

## STRUCTURE

```text
styles/
├── app.css             # import order entrypoint
├── tokens.css          # dark/light design tokens
├── fonts.css           # local Pretendard font faces
├── base.css            # reset, body, typography, Material Symbols
├── layout.css          # shell, top bar, nav, logo, action buttons
├── routes-login.css    # login-specific surface
├── shell.css           # shell cards, chips, calendar cells, avatars
├── modals.css          # modal surfaces and typography
├── routes.css          # route-level feature visuals
├── components.css      # reusable controls and surface primitives
└── theme-light.css     # light-mode polish
```

## CONVENTIONS

- Keep `app.css` import order deterministic.
- Dark theme is `:root, html.dark`; light overrides are `html.light`.
- Tailwind colors map to `rgb(var(--color-*) / <alpha-value>)` in `tailwind.config.js`.
- Tailwind `preflight` is disabled; `base.css` owns the reset.
- Font utilities use local Pretendard from `public/fonts/pretendard`.
- Material Symbols are loaded in `index.html` and normalized in `base.css`.
- Brand assets use `public/roomin-logo-blue.svg` and `public/roomin-logo-purple.svg`.

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| Add theme color | `tokens.css`, `tailwind.config.js` | Define CSS vars, then map utilities if needed |
| Change global typography | `fonts.css`, `base.css` | Keep Pretendard stack stable |
| Shell/nav changes | `layout.css`, `shell.css` | Route frame and cards |
| Login screen | `routes-login.css` | Login-only layout and logo treatment |
| Modal polish | `modals.css` | Shared modal sizing/surface details |
| Route visuals | `routes.css` | Dashboard/calendar/hero-like feature visuals |
| Reusable controls | `components.css` | Segments, chips, selects, cards |

## ANTI-PATTERNS

- Do not add `@import` rules after Tailwind directives in the same file.
- Do not reorder `app.css` layers casually; later files intentionally override earlier layers.
- Do not add new one-off global classes when a feature subcomponent can use existing primitives.
- Do not edit generated `dist` CSS; source lives here.

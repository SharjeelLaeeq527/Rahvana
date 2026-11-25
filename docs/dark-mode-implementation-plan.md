# Dark Mode - Implementation Plan

> **Who this is for:** anyone on the team working on dark mode. Read sections 1-3 once,
> then follow the phases in order. Every phase ends with a "Done when" list; do not start
> the next phase until it is true.
>
> **Status:** plan only, nothing implemented yet (written 2026-11-24).

---

## Table of contents

1. [Why the last attempt looked bad](#1-why-the-last-attempt-looked-bad)
2. [Strategy in one page](#2-strategy-in-one-page)
3. [Decision: marketing / home pages](#3-decision-marketing--home-pages)
4. [Phases (step by step)](#4-phases-step-by-step)
5. [Class replacement cheat sheet](#5-class-replacement-cheat-sheet)
6. [Special cases](#6-special-cases)
7. [Working alongside other branches](#7-working-alongside-other-branches)
8. [PR checklist (copy into every PR)](#8-pr-checklist-copy-into-every-pr)
9. [Suggested calendar](#9-suggested-calendar)

---

## 1. Why the last attempt looked bad

Measured in the repo on 2026-11-24:

| What | Count | Problem |
|---|---|---|
| Hardcoded neutral Tailwind classes (`bg-white`, `text-gray-*`, `text-slate-*`, `bg-gray-*`, `border-gray-*` ...) in `app/` + `components/` | **~7,800 in 422 files** | These never change colour in dark mode. Half the page goes dark, white cards stay white, grey text lands on dark grey. |
| Hex colour literals (`#0d7377`, `#1c2b3a` ...) inside `.ts/.tsx` | **~13,000** | Same problem, and harder to find because they sit in `style={{}}` and JS objects. |
| Semantic token classes (`bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`) | ~1,400 | These DO switch, so mixed screens look broken. |
| `dark:` variants | ~720 in only 57 files | Most of the app never got a dark variant. |

Top folders by hardcoded classes: `components/tools` (~650), `journey-engine/components`
(~340), `journey-spouse/components` (~320), `journey-engine` (~240), `home-page` (~210).

In `app/globals.css`:

- The `.dark { ... }` block is the **default shadcn grey palette**. It sets `--primary` to
  near-white, so the teal brand colour disappears in dark mode.
- The brand variables (`--rahvana-*`, `--rv-*`, `--guide-*`, `--rv-launch-*`) have **no dark
  values**.
- No `color-scheme: dark`, so native inputs, scrollbars and date pickers stay light.

Already in place (reuse it): `next-themes` is installed, `app/components/theme-provider.tsx`
exists (commented out in `app/layout.tsx`), and Tailwind already has class-based dark mode
(`@custom-variant dark (&:is(.dark *))` in `globals.css`).

**Conclusion:** the toggle was never the problem. Colours are hardcoded everywhere. The fix is
a design-token layer plus a screen-by-screen migration, with unconverted screens forced to
light until they are done.

---

## 2. Strategy in one page

1. **Design a real dark palette** (brand-aware, not shadcn grey): dark navy surfaces, a
   brighter teal for contrast, every text/background pair checked for WCAG AA (4.5:1 body
   text, 3:1 large text and icons).
2. **Semantic tokens, not colours.** Components say *what* a colour is for (`bg-surface`,
   `text-subtle`, `bg-success-soft`), never *which* colour (`bg-white`, `text-gray-500`).
   Light and dark values live only in `globals.css`.
3. **Per-route opt-in ("dark-ready routes").** A list says which routes are converted. Every
   other route is forced to light even if the user chose dark, so nobody ever lands on a
   half-broken screen.
4. **Feature flag.** `NEXT_PUBLIC_ENABLE_DARK_MODE` hides the toggle on production until
   launch (same pattern as `IR5_ENABLED` in `lib/feature-flags.ts`).
5. **Migrate area by area**, one PR per area, screenshots of both themes in every PR.
6. **Ratchet guard.** A script counts hardcoded colours per folder; a folder's count may
   never go up. All new code uses tokens.
7. **Default stays light at launch.** Users opt in (Light / Dark / System). Switch the default
   to "System" only when the whole site is converted (DM-6).

---

## 3. Decision: marketing / home pages

**Decision: marketing and home pages DO get dark mode, but LAST (phase DM-5). Until then
they are forced light.**

Why this is the industry standard for a product like ours:

- **Theme is one site-wide preference.** Products that respect it everywhere (GitHub,
  Vercel, Tailwind, Supabase, Linear docs) feel consistent: a user who picked dark is not
  flashed with a bright white home page after logging out or clicking the logo.
- **Converting it last is also standard.** The logged-in app is where users spend hours
  (journey, vault, tools); that is where dark mode actually matters. Marketing pages are
  visited briefly and carry the most custom art, so they are the most work for the least
  benefit. Large products (Stripe, Notion) keep marketing light-only for exactly this
  reason, so a temporary light-only marketing site is perfectly acceptable.
- **Our setup makes "last" safe.** With the dark-ready list, marketing simply stays light
  until its art is ready. No half-dark home page ever ships.

How marketing will be converted (details in DM-5):

- Line art / SVG illustrations: switch strokes and fills to `currentColor` or CSS variables,
  so one file works in both themes.
- Raster images and backgrounds: either a `-dark` variant (render both, `dark:hidden` /
  `hidden dark:block`) or reduce opacity / add a token-coloured overlay in dark.
- Gradients and hero sections: rebuilt from tokens, not hex.
- If a specific piece of art cannot be made to work, that one section may keep a light
  "card" inside the dark page; the page as a whole still follows the theme.

---

## 4. Phases (step by step)

### DM-0: Audit and palette (designer + 1 dev, ~2-3 days)

1. Confirm the counts in section 1 and the area order below with the team.
2. Designer produces the dark palette as a token table (token names in DM-1 step 1): light
   value, dark value, and contrast ratio against its paired text/background.
3. Agree the routes that never go dark: `/admin/*` (internal), the PDF editor canvas and
   printable pages (a document is paper; only the chrome around it goes dark).

**Done when:** palette table approved, never-dark list agreed and written here.

### DM-1: Foundation (1 dev, ~3-4 days) - hidden from users

1. **Tokens in `app/globals.css`.** In `:root` (light) and `.dark` (dark). Keep the existing
   shadcn names (`--background`, `--card`, `--primary` ...) and give them brand-correct dark
   values (`--primary` stays teal). Add:

   | Token | Use for |
   |---|---|
   | `--surface` / `--surface-raised` / `--surface-sunken` | page, card, inset areas |
   | `--text-strong` / `--text-default` / `--text-subtle` / `--text-faint` | heading, body, secondary, placeholder |
   | `--line` / `--line-strong` | borders, dividers |
   | `--brand` / `--brand-hover` / `--brand-soft` / `--brand-contrast` | teal accents, buttons, chips |
   | `--success`, `--success-soft`, `--warning`, `--warning-soft`, `--danger`, `--danger-soft`, `--info`, `--info-soft` | status text + status background |
   | `--overlay` | modal backdrops |
   | `--shadow-color` | shadows (much weaker in dark) |

   Also give every existing brand variable (`--rahvana-*`, `--rv-*`, `--guide-*`) a dark value
   inside `.dark`, so screens already using them convert for free.
2. **Expose tokens to Tailwind** in the existing `@theme inline { ... }` block in
   `globals.css`, e.g. `--color-surface: var(--surface);`. This gives `bg-surface`,
   `text-subtle`, `border-line`, `bg-success-soft` and so on.
3. **`color-scheme`:** `:root { color-scheme: light; } .dark { color-scheme: dark; }`.
4. **Feature flag** in `lib/feature-flags.ts`:
   ```ts
   export const DARK_MODE_ENABLED =
     process.env.NEXT_PUBLIC_ENABLE_DARK_MODE === "true" ||
     (process.env.NEXT_PUBLIC_ENABLE_DARK_MODE !== "false" &&
       process.env.NEXT_PUBLIC_ENVIRONMENT !== "production");
   ```
5. **Provider + dark-ready routes.**
   - `lib/theme/darkReadyRoutes.ts`: `DARK_READY_PREFIXES: string[]` (starts EMPTY) and
     `isDarkReadyRoute(pathname)`.
   - `app/components/theme/AppThemeProvider.tsx` (client): reads `usePathname()` and renders
     the existing `ThemeProvider` with `attribute="class"`, `defaultTheme="light"`,
     `enableSystem`, `disableTransitionOnChange`, `storageKey="rahvana-theme"`, and
     `forcedTheme={DARK_MODE_ENABLED && isDarkReadyRoute(pathname) ? undefined : "light"}`.
   - `app/layout.tsx`: replace the commented-out block with `<AppThemeProvider>` around the
     same children, and add `suppressHydrationWarning` on `<html>` (next-themes needs it).
6. **Ratchet script** `scripts/check-hardcoded-colors.mjs`: counts the section 1 patterns per
   folder, compares with a committed `scripts/color-baseline.json`, fails if any folder goes
   UP. Add `npm run check:colors` and run it in CI next to lint.
7. **Toggle** `app/components/theme/ThemeToggle.tsx` (Light / Dark / System), with a `mounted`
   check before showing the current value (avoids hydration mismatch). Put it in the
   `SiteHeader` profile dropdown, only when `DARK_MODE_ENABLED`. On a forced-light route the
   toggle stays usable (it saves the preference) and shows a small note "This page is light
   only for now".
8. **Docs:** add a "Theming" subsection to `docs/PROJECT_KNOWLEDGE.md`, and a critical rule
   to `CLAUDE.md`: "Use colour tokens; never `bg-white` / `text-gray-*` / hex in TSX".

**Done when:** on staging the toggle works, the choice survives a reload with no flash, every
route is still light (list is empty), `npx tsc --noEmit` is clean, `npm run check:colors`
passes.

### DM-2: Global shell (1 dev, ~1 week)

Convert what appears on EVERY page, otherwise nothing else can go dark:

- `components/ui/*` (shadcn: button, input, select, dialog, dropdown, card, tabs, toast,
  tooltip, popover, sheet)
- `app/components/layout/*` (`ClientHeader`, `SiteHeader`, `MegaMenu`, `Footer`,
  `ClientWidgets`, mobile bottom nav)
- `app/components/shared/*` (modals, `ConfirmationModal`, `AuthRequiredModal`, inputs)
- `UpgradeModal`, `LockedFeature`, `PageGate`, `ResultGate`, wallet modals
- `FloatingChatWidget` / `ChatInterface`

Then add the first routes to `DARK_READY_PREFIXES`: auth pages (`/login`, `/signup`, password
reset) and settings / profile.

**Done when:** those routes look right in both themes on desktop and mobile, screenshots in
the PR.

### DM-3: Logged-in core (1-2 devs, ~2 weeks)

One PR each, in this order; add a route to the list only after its PR is reviewed:

1. `/user-dashboard`, `/my-journeys`, notifications
2. Document vault (`app/components/document-vault/*`, `app/(tools)/document-vault`)
3. Journey dashboard skins (`app/components/journey-dashboard/*`, including `desktop.css` and
   `mobile.css`: add `.dark` overrides for their own CSS variables in the same files)
4. `journey-engine` (IR-5, IR-2, future categories) - see section 7
5. `journey-spouse` (IR-1 / CR-1)
6. Portal wallet, wallet pages, pricing

**Milestone:** after DM-3 the product is worth launching dark mode (DM-6) even before tools
are done, because unconverted routes are safely forced light.

### DM-4: Tools and guides (1-2 devs, ~2-3 weeks)

Biggest area (`components/tools` alone has ~650 hardcoded classes). One tool per PR. Tools on
`ToolLayout` first: fixing `ToolLayout` once covers their chrome. Guides share the wizard
shell, so fix the shell first, then each guide's steps.

### DM-5: Marketing / home (1 dev + designer, ~1-2 weeks)

Per the decision in section 3:

1. Designer reviews each home/marketing section in dark and marks art that needs a variant.
2. Convert SVG / line art to `currentColor` or CSS variables.
3. Add dark variants or overlays for raster images and backgrounds.
4. Rebuild hero gradients from tokens.
5. Add marketing routes to `DARK_READY_PREFIXES` page by page (home last, it has the most art).

### DM-6: Launch

1. Set `NEXT_PUBLIC_ENABLE_DARK_MODE=true` on production (can happen right after DM-3).
   Default stays `light`; users opt in.
2. Watch feedback for a week and fix reported screens.
3. When every route except the never-dark list is converted, switch to
   `defaultTheme="system"`, the modern default (follows the user's device).

---

## 5. Class replacement cheat sheet

Pick by **meaning**, not by exact shade.

| Old (hardcoded) | New (token) | Meaning |
|---|---|---|
| `bg-white` (page) | `bg-background` | page background |
| `bg-white` (card, panel, modal) | `bg-card` or `bg-surface-raised` | raised surface |
| `bg-gray-50`, `bg-slate-50`, `bg-gray-100` | `bg-muted` or `bg-surface-sunken` | inset / subtle area |
| `text-gray-900`, `text-slate-900`, `text-black` | `text-foreground` / `text-strong` | headings, main text |
| `text-gray-700`, `text-slate-700` | `text-default` | body text |
| `text-gray-500`, `text-gray-600`, `text-slate-500` | `text-muted-foreground` / `text-subtle` | secondary text |
| `text-gray-400` | `text-faint` | placeholder, disabled |
| `border-gray-200`, `border-slate-200`, `divide-gray-200` | `border-border` / `border-line` | borders |
| `bg-teal-600`, `#0d7377`, `#0d9488` | `bg-primary` / `bg-brand` | brand |
| `bg-teal-50`, `#e8f6f6` | `bg-brand-soft` | brand tint |
| `bg-green-50 text-green-700` | `bg-success-soft text-success` | success chip |
| `bg-amber-50 text-amber-700` | `bg-warning-soft text-warning` | warning chip |
| `bg-red-50 text-red-600` | `bg-danger-soft text-danger` | error chip |
| `bg-blue-50 text-blue-700` | `bg-info-soft text-info` | info chip |
| `bg-black/50` (backdrop) | `bg-overlay` | modal backdrop |
| `style={{ color: "#1c2b3a" }}` | `style={{ color: "var(--rv-ink)" }}` or a class | hex in JS |
| `shadow-lg` on cards | keep, rely on `--shadow-color`, add `dark:border dark:border-line` | depth in dark comes from borders |

Rules:

- If a colour has no token, **add a token** in `globals.css`. A few `dark:` tweaks are fine;
  hundreds of `dark:bg-...` pairs are not.
- Never pure black (`#000`) for dark surfaces, never pure white for dark-mode body text.
- Colour-only changes. No layout, copy or logic changes in a dark mode PR (easy review, easy
  rollback).

---

## 6. Special cases

| Case | What to do |
|---|---|
| Images with white backgrounds (e.g. `/assets/images/dashboard.png` journey backdrop) | Lower opacity in dark (`dark:opacity-40`) or a `-dark` variant. |
| Logo | Light-on-dark variant. |
| PDFs, PDF editor canvas, form previews | Stay light (paper). Only the chrome around them goes dark. |
| Charts | Axis, grid, labels from tokens; series colours checked against the dark surface. |
| Third-party embeds (Stripe checkout, Google widgets) | Out of our control; leave them. |
| Emails (Resend) | Not affected. |
| Browser autofill (yellow / white flash on inputs) | `.dark input:-webkit-autofill` rule in `globals.css`. |
| Inline `<svg fill="#...">` icons | `fill="currentColor"`, colour via text class. |
| `journey-dashboard/*.css` | Those files define their own variables; add a `.dark` override block in the same file. |
| Admin area | Never in the dark-ready list (internal tool). |
| Flash of wrong theme on first load | Handled by next-themes' inline script + `suppressHydrationWarning` on `<html>`. Never read the theme in a server component. |
| Modal scroll lock | `ModalScrollLock` is unaffected; just keep overlays `fixed inset-0` as today. |

---

## 7. Working alongside other branches

The new visa category is being built on a separate branch. Two things keep both branches
clean:

- **Merge DM-1 early** so the category branch can rebase and use tokens for every new screen
  (then it adds nothing to the dark mode backlog, and `check:colors` stays green).
- **`app/components/journey-engine/*` and `journey-dashboard/*` are touched by both.** Convert
  them (DM-3 items 3-4) only after the category's dashboard work merges, or agree file by file
  with that developer.

General habits: rebase on `staging` at least twice a week, keep PRs small (one area each).

---

## 8. PR checklist (copy into every PR)

- [ ] Only colour changes (no layout / copy / logic).
- [ ] Screenshots: light + dark, desktop + mobile.
- [ ] Contrast checked on text and status chips (browser devtools contrast checker).
- [ ] Hover, focus, disabled, error and empty states checked in dark.
- [ ] Modals, dropdowns, toasts on this screen checked in dark.
- [ ] Route added to `DARK_READY_PREFIXES` (only if the whole route is done).
- [ ] `npm run check:colors` count went down and the baseline was updated.
- [ ] `npx tsc --noEmit` clean.

---

## 9. Suggested calendar

Rough sizing for 1-2 developers + a part-time designer. Re-estimate after DM-0.

| Week | Work |
|---|---|
| 1 | DM-0 palette + DM-1 foundation (hidden), merge DM-1 |
| 2 | DM-2 global shell; auth + settings dark-ready |
| 3-4 | DM-3 logged-in core (dashboard, vault, journey screens, wallet, pricing) |
| 4 | DM-6 step 1: launch dark mode as opt-in on production |
| 5-7 | DM-4 tools and guides, one per PR |
| 8-9 | DM-5 marketing / home |
| 9+ | DM-6 step 3: default to "System" |

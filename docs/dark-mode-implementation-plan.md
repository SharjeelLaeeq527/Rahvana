# Dark Mode - Implementation Plan

Follow the phases in order. Do not start a phase until the previous one's "Done when" is true.

---

## Phase 1: Dark palette

Draft ready: `docs/dark-mode-palette.md` (tokens, contrast check, open decisions).

1. Designer makes a token table: token name, light value, dark value.
2. Dark surfaces are dark navy (not pure black). Teal stays the brand colour, a bit brighter
   in dark.
3. Every text/background pair passes WCAG AA (4.5:1 body text, 3:1 large text and icons).

**Done when:** token table approved.

---

## Phase 2: Foundation (hidden from users)

### 2.1 Tokens - `app/globals.css`

Add to `:root` (light) and `.dark` (dark):

| Token | Use for |
|---|---|
| `--surface` / `--surface-raised` / `--surface-sunken` | page, card, inset areas |
| `--text-strong` / `--text-default` / `--text-subtle` / `--text-faint` | heading, body, secondary, placeholder |
| `--line` / `--line-strong` | borders, dividers |
| `--brand` / `--brand-hover` / `--brand-soft` / `--brand-contrast` | teal accents, buttons, chips |
| `--success`, `--success-soft`, `--warning`, `--warning-soft`, `--danger`, `--danger-soft`, `--info`, `--info-soft` | status text + status background |
| `--overlay` | modal backdrops |
| `--shadow-color` | shadows |

Also in `.dark`:
- Replace the shadcn grey values (`--background`, `--card`, `--primary` ...) with palette
  values. `--primary` must stay teal.
- Add a dark value for every `--rahvana-*`, `--rv-*`, `--guide-*` variable.

### 2.2 Tailwind classes - `app/globals.css`

In the existing `@theme inline { ... }` block, map each token, e.g.
`--color-surface: var(--surface);`. This gives `bg-surface`, `text-subtle`, `border-line`,
`bg-success-soft` and so on.

### 2.3 Native controls - `app/globals.css`

```css
:root { color-scheme: light; }
.dark { color-scheme: dark; }
.dark input:-webkit-autofill { /* palette colours */ }
```

### 2.4 Feature flag - `lib/feature-flags.ts`

```ts
export const DARK_MODE_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_DARK_MODE === "true" ||
  (process.env.NEXT_PUBLIC_ENABLE_DARK_MODE !== "false" &&
    process.env.NEXT_PUBLIC_ENVIRONMENT !== "production");
```

### 2.5 Dark-ready route list - `lib/theme/darkReadyRoutes.ts` (new)

- `DARK_READY_PREFIXES: string[]` (starts empty).
- `isDarkReadyRoute(pathname)`.

Any route not in the list is forced to light.

### 2.6 Provider - `app/components/theme/AppThemeProvider.tsx` (new, client)

Wraps the existing `app/components/theme-provider.tsx` with:

```tsx
attribute="class"
defaultTheme="light"
enableSystem
disableTransitionOnChange
storageKey="rahvana-theme"
forcedTheme={DARK_MODE_ENABLED && isDarkReadyRoute(pathname) ? undefined : "light"}
```

`pathname` comes from `usePathname()`.

### 2.7 Layout - `app/layout.tsx`

- Replace the commented-out `ThemeProvider` block with `<AppThemeProvider>` around the same
  children.
- Add `suppressHydrationWarning` on `<html>`.

### 2.8 Toggle - `app/components/theme/ThemeToggle.tsx` (new)

- Options: Light / Dark / System.
- Render the current value only after mount (avoids hydration mismatch).
- Put it in the `SiteHeader` profile dropdown, only when `DARK_MODE_ENABLED`.
- On a forced-light route show "This page is light only for now".

### 2.9 Hardcoded colour check - `scripts/check-hardcoded-colors.mjs` (new)

- Counts per folder in `app/` and `components/`: `bg-white`, `text-gray-*`, `text-slate-*`,
  `bg-gray-*`, `bg-slate-*`, `border-gray-*`, `border-slate-*`, hex colours in `.ts/.tsx`.
- Compares with `scripts/color-baseline.json`; fails if any folder goes up.
- Add `"check:colors"` to `package.json` and run it in CI.

### 2.10 Docs

- `docs/PROJECT_KNOWLEDGE.md`: add a "Theming" section (tokens, provider, dark-ready list).
- `CLAUDE.md` critical rules: "Use colour tokens; never `bg-white` / `text-gray-*` / hex in TSX."

**Done when:** on staging the toggle works, the choice survives a reload with no flash, all
routes are still light, `npx tsc --noEmit` is clean, `npm run check:colors` passes.

---

## Phase 3: Global shell

Convert:

- `components/ui/*`
- `app/components/layout/*` (`ClientHeader`, `SiteHeader`, `MegaMenu`, `Footer`,
  `ClientWidgets`, mobile bottom nav)
- `app/components/shared/*`
- `UpgradeModal`, `LockedFeature`, `PageGate`, `ResultGate`, wallet modals
- `FloatingChatWidget`, `ChatInterface`
- Logo: add a light-on-dark version.

Then add to `DARK_READY_PREFIXES`: `/login`, `/signup`, password reset, settings / profile.

**Done when:** those routes look right in both themes on desktop and mobile.

---

## Phase 4: Logged-in core

One PR each, in this order. Add the route to the list after its PR is merged.

1. `/user-dashboard`, `/my-journeys`, notifications
2. Document vault (`app/components/document-vault/*`, `app/(tools)/document-vault`)
3. Journey dashboard (`app/components/journey-dashboard/*`): add a `.dark` block to
   `desktop.css` and `mobile.css` for their own variables; lower the opacity of the
   `dashboard.png` backdrop in dark.
4. `app/components/journey-engine/*` (do this after the new visa category branch merges)
5. `app/components/journey-spouse/*`
6. Portal wallet, wallet pages, pricing

**Done when:** all routes above are in the list.

---

## Phase 5: Launch (opt-in)

1. Set `NEXT_PUBLIC_ENABLE_DARK_MODE=true` on production. Default stays `light`.
2. Fix screens reported in feedback.

---

## Phase 6: Tools and guides

- One tool per PR, starting with tools on `ToolLayout` (fix `ToolLayout` first).
- Guides: fix the shared wizard shell first, then each guide's steps.
- Add each route to the list after its PR is merged.

---

## Phase 7: Marketing and home

1. SVG / line art: use `currentColor` or CSS variables.
2. Raster images: add a dark version (render both with `dark:hidden` / `hidden dark:block`)
   or lower opacity in dark.
3. Rebuild gradients and hero sections from tokens.
4. Add marketing routes to the list page by page, home page last.

---

## Phase 8: Default to system

When every route except the never-dark ones is in the list, set `defaultTheme="system"`.

Never dark (always forced light): `/admin/*`, PDF editor canvas, printable pages, PDF and
form previews.

---

## Class replacement cheat sheet

| Old | New |
|---|---|
| `bg-white` (page) | `bg-background` |
| `bg-white` (card, panel, modal) | `bg-card` / `bg-surface-raised` |
| `bg-gray-50`, `bg-slate-50`, `bg-gray-100` | `bg-muted` / `bg-surface-sunken` |
| `text-gray-900`, `text-slate-900`, `text-black` | `text-foreground` / `text-strong` |
| `text-gray-700`, `text-slate-700` | `text-default` |
| `text-gray-500`, `text-gray-600`, `text-slate-500` | `text-muted-foreground` / `text-subtle` |
| `text-gray-400` | `text-faint` |
| `border-gray-200`, `border-slate-200`, `divide-gray-200` | `border-border` / `border-line` |
| `bg-teal-600`, `#0d7377`, `#0d9488` | `bg-primary` / `bg-brand` |
| `bg-teal-50`, `#e8f6f6` | `bg-brand-soft` |
| `bg-green-50 text-green-700` | `bg-success-soft text-success` |
| `bg-amber-50 text-amber-700` | `bg-warning-soft text-warning` |
| `bg-red-50 text-red-600` | `bg-danger-soft text-danger` |
| `bg-blue-50 text-blue-700` | `bg-info-soft text-info` |
| `bg-black/50` (backdrop) | `bg-overlay` |
| `style={{ color: "#1c2b3a" }}` | `style={{ color: "var(--rv-ink)" }}` or a class |
| `<svg fill="#...">` | `fill="currentColor"` + text class |
| card `shadow-lg` | keep it, add `dark:border dark:border-line` |

Rules:
- No token for a colour? Add one in `globals.css`. Don't scatter `dark:` pairs.
- Dark mode PRs change colours only.

---

## PR checklist

- [ ] Only colour changes.
- [ ] Screenshots: light + dark, desktop + mobile.
- [ ] Hover, focus, disabled, error, empty states checked in dark.
- [ ] Modals, dropdowns, toasts checked in dark.
- [ ] Route added to `DARK_READY_PREFIXES` (only if the whole route is done).
- [ ] `npm run check:colors` went down; baseline updated.
- [ ] `npx tsc --noEmit` clean.

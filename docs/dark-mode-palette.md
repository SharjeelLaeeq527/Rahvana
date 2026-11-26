# Dark Mode Palette (Phase 1 draft)

Status: **approved 2026-11-25, live in `app/globals.css`.** The three open decisions in
section 5 are not applied yet (light mode is unchanged). Light values match what the site uses today; only the items under
"Open decisions" change the light look.

Contrast = WCAG ratio, checked with a script. Target: 4.5 for normal text, 3.0 for large
text, icons and UI parts.

---

## 1. Core tokens

| Token | Light | Dark | Use for |
|---|---|---|---|
| `--surface` | `#f8fafc` | `#0b1220` | page background |
| `--surface-raised` | `#ffffff` | `#111a2e` | cards, panels, modals, dropdowns |
| `--surface-sunken` | `#f1f5f9` | `#070d18` | inset areas, table headers, inputs |
| `--text-strong` | `#0f172a` | `#f1f5f9` | headings, main text |
| `--text-default` | `#334155` | `#cbd5e1` | body text |
| `--text-subtle` | `#5b6b80` | `#94a3b8` | secondary text, captions |
| `--text-faint` | `#94a3b8` | `#64748b` | placeholder, disabled only |
| `--line` | `#e2e8f0` | `#1e293b` | borders, dividers |
| `--line-strong` | `#cbd5e1` | `#334155` | input borders, stronger dividers |
| `--brand` | `#0d9488` | `#2dd4bf` | brand accents, icons, button background |
| `--brand-text` | `#0f766e` | `#2dd4bf` | brand-coloured text and links |
| `--brand-hover` | `#0f766e` | `#5eead4` | hover on brand elements |
| `--brand-soft` | `#f0fdfa` | `#0f2e33` | brand tint background (chips, selected rows) |
| `--brand-contrast` | `#ffffff` | `#042f2e` | text on a `--brand` background |
| `--success` / `--success-soft` | `#15744f` / `#e8f5ef` | `#4ade80` / `#0f2a1d` | success text / background |
| `--warning` / `--warning-soft` | `#8a6200` / `#fef8e8` | `#fbbf24` / `#2b2108` | warning text / background |
| `--danger` / `--danger-soft` | `#b91c1c` / `#fef2f2` | `#f87171` / `#2d1517` | error text / background |
| `--info` / `--info-soft` | `#2460bb` / `#e8f1fb` | `#60a5fa` / `#0f2140` | info text / background |
| `--overlay` | `rgb(15 23 42 / 0.5)` | `rgb(0 0 0 / 0.6)` | modal backdrop |
| `--shadow-color` | `rgb(15 23 42 / 0.08)` | `rgb(0 0 0 / 0.4)` | shadows |

Dark mode idea: dark navy (not black), raised surfaces are lighter than the page, teal gets
brighter so it reads on navy, and text on a teal button turns dark.

## 2. Contrast check

| Pair | Light | Dark |
|---|---|---|
| strong on surface | 17.06 | 17.09 |
| strong on raised | 17.85 | 15.83 |
| default on raised | 10.35 | 11.68 |
| subtle on surface | 5.20 | 7.30 |
| subtle on raised | 5.44 | 6.76 |
| subtle on sunken | 4.97 | 7.58 |
| brand-text on raised | 5.47 | 9.32 |
| brand-text on brand-soft | 5.25 | 7.73 |
| brand-contrast on brand (button) | **3.74** | 7.77 |
| success on success-soft | 5.14 | 8.80 |
| warning on warning-soft | 5.17 | 9.50 |
| danger on danger-soft | 5.91 | 6.17 |
| info on info-soft | 5.31 | 6.30 |
| faint on raised (placeholder) | 2.56 | 3.64 |

Every text pair passes 4.5 except the two marked under "Open decisions".

## 3. Existing shadcn variables (inside `.dark`, replaces the grey values)

| Variable | Dark value |
|---|---|
| `--background` | `var(--surface)` |
| `--foreground` | `var(--text-strong)` |
| `--card`, `--popover` | `var(--surface-raised)` |
| `--card-foreground`, `--popover-foreground` | `var(--text-strong)` |
| `--primary` | `var(--brand)` |
| `--primary-foreground` | `var(--brand-contrast)` |
| `--secondary`, `--muted` | `#1e293b` |
| `--secondary-foreground` | `var(--text-strong)` |
| `--muted-foreground` | `var(--text-subtle)` |
| `--accent` | `var(--brand-soft)` |
| `--accent-foreground` | `var(--text-strong)` |
| `--destructive` | `#ef4444` |
| `--border` | `var(--line)` |
| `--input` | `var(--line-strong)` |
| `--ring` | `var(--brand)` |
| `--sidebar*` | same mapping as above |

## 4. Existing brand variables (dark values)

| Variable | Light (today) | Dark |
|---|---|---|
| `--rahvana-primary` | `#0d7377` | unchanged (see note) |
| `--rahvana-primary-light` | `#14a0a6` | unchanged (see note) |
| `--rahvana-primary-dark` | `#0a5a5d` | unchanged (see note) |
| `--rahvana-primary-pale` | `#e8f6f6` | `#0f2e33` |
| `--rahvana-secondary` | `#32e0c4` | `#32e0c4` |
| `--rv-navy` | `#0c1b33` | `#f1f5f9` |
| `--rv-ink` | `#1c2b3a` | `#e2e8f0` |
| `--rv-soft` | `#3a4f63` | `#cbd5e1` |
| `--rv-muted` | `#6b8097` | `#94a3b8` |
| `--rv-line` | `#d0e4f7` | `#1e3350` |
| `--rv-sky` | `#e8f1fb` | `#0f2140` |
| `--rv-blue` / `--rv-blue-dark` | `#2f6fd4` / `#2460bb` | `#60a5fa` / `#3b82f6` |
| `--rv-green` / `--rv-green-bg` | `#15744f` / `#e8f5ef` | `#4ade80` / `#0f2a1d` |
| `--rv-amber` / `--rv-amber-bg` | `#8a6200` / `#fef8e8` | `#fbbf24` / `#2b2108` |
| `--rv-purple` / `--rv-purple-bg` | `#4a2d8a` / `#f3f0fb` | `#c4b5fd` / `#1f1838` |
| `--rv-rose` / `--rv-rose-bg` / `--rv-rose-soft` | `#c0596a` / `#fbeaec` / `#f0f1fb` | `#fb7185` / `#2d1520` / `#161a2e` |
| `--rv-ch*`, `--rv-launch-*` | already dark | unchanged |
| `--guide-card-shadow` / `--guide-card-hover-shadow` | teal glow | `0 4px 24px -4px rgb(0 0 0 / 0.5)` / `0 8px 32px -4px rgb(0 0 0 / 0.6)` |
| `--guide-grid-color` | `hsl(168 70% 42% / 0.025)` | `hsl(168 70% 60% / 0.04)` |

Note: `--rahvana-primary` / `-light` / `-dark` are used both as button backgrounds (with
white text) and as text colours, and no single dark value works for both. They keep their
light values; screens switch to `bg-primary` / `text-brand-text` during migration.

Note: `--rv-navy`, `--rv-ink`, `--rv-soft` are used as text colours today, so they flip to
light values. Any place that uses one of them as a BACKGROUND will need a fix during the
screen migration.

## 5. Open decisions (designer)

1. **White text on the teal button is 3.74 today (fails 4.5).** This is the current site, not
   new. Options:
   - a) Keep `#0d9488` (no visual change, stays below AA for button text).
   - b) Recommended: use `#0f766e` as the light button background (5.47, slightly darker teal)
     and keep `#0d9488` for icons and accents.
2. **Placeholder text** (`--text-faint`) is 2.56 in light. Fine for disabled text; for input
   placeholders consider `--text-subtle` instead.
3. **Input borders** (`--line-strong`) are 1.48 / 1.67 against cards. WCAG asks 3.0 for
   form-control borders. Decide whether inputs get a darker border (e.g. light `#94a3b8`,
   dark `#475569`) or keep today's soft look.

**Done when:** these three decisions are made and the table is approved.

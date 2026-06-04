# Plan — Dynamic Tool/Resource Detail Pages (E‑commerce style)

> **Scope (locked):** Sirf `/pricing` page ke **"Individual Resources"** section
> ("Buy individual tools and services") par kaam hoga. `/tools` page ko **bilkul
> haath nahi lagana**. Har add‑on card ko attractive banana hai, aur card par
> click karne par us tool/service ka ek **detailed dynamic page** (slug‑based)
> khulega — bilkul kisi e‑commerce product page ki tarah (overview, features,
> how‑it‑works, images/video, FAQ, price + "Add to order").

> **Status (implemented):** Saare pieces ban chuke hain. **"Interview Prep" ab ek
> hi tool hai** (`interview-prep`, $200) — pehle ke do alag add‑ons `mock` (Mock
> Interview) + `rapid` (Rapid Fire) isi mein merge ho gaye. Ek hi resource card +
> ek hi detail page jo guided prep + rapid‑fire + mock teeno modes cover karta hai.

---

## 1. Aaj kya hai (current state)

- **Data:** `app/(main)/pricing/data/pricing.ts` → `ADDONS[]` (11 items, har ek mein
  `id, title, price, unit, copy, note`; `mock` + `rapid` ab ek `interview-prep`).
  `case-manager` ka `title` commented hai, isliye effectively **10 cards** dikhte hain.
- **Render:** `app/(main)/pricing/page.tsx`
  - `mode === "resources"` block (lines ~1212‑1369) — main grid jise screenshot mein
    dikhaya gaya hai.
  - Yahi card markup **3 jagah** repeat hota hai (resources grid, "Recommended"
    add‑ons, "All add‑ons") — `resource-fcard` CSS (globals.css ~920‑1045).
  - Icon + color mapping: `ADDON_CONFIG` (page.tsx ~76‑98).
  - Card sirf "+ Add to order" toggle karta hai (`toggleAddon`) — **koi detail
    page nahi**.
- **Routing group:** Pricing `app/(main)/pricing/` ke andar hai. `app/(main)/resources/`
  pehle se ek hub page hai (`page.tsx` + `ResourcesContent.tsx`) — uska index
  route `/resources` waise hi rahega.

---

## 2. Final UX flow

```
/pricing  → "Individual Resources" tab
   └─ attractive add-on card  ──(click card body)──▶  /resources/[slug]   ← NEW detail page
        └─ "+ Add to order" button (card par)  ── toggle, page change nahi (stopPropagation)

/resources/[slug]  (e-commerce style detail page)
   ├─ Hero: title, tagline, price, category badge, "Add to order" + "View all tools"
   ├─ Media: hero image / video + gallery (user-provided screenshots)
   ├─ Overview (long description)
   ├─ Key features (icon grid)
   ├─ How it works (numbered steps)
   ├─ Who it's for / benefits
   ├─ FAQ (tool-specific)
   ├─ Related tools (cross-links to other slugs)
   └─ Sticky CTA: "Add to order – $X" ──▶ /pricing?mode=resources&addons=<id>
```

**Slugs = addon `id`** (already URL‑safe): `221g`, `case-strength`, `interview-prep`,
`photo`, `smart`, `sponsor`, `doc-review`, `consultation`, `translate`,
`civil-guid` (+ optional `case-manager`).

---

## 3. Kaam ke pieces (deliverables)

### 3.1 Naya data layer — `app/(main)/pricing/data/resourceDetails.ts`
Ek rich content map jo `ADDONS` ke upar bethega (price/unit wahin se aate rahenge,
duplicate nahi karenge). Shape:

```ts
export type ResourceMedia = {
  type: "image" | "video";
  src: string;          // e.g. "/assets/images/tools/case-strength/hero.png"
  alt: string;
  caption?: string;
  poster?: string;      // video ke liye thumbnail
};

export type ResourceDetail = {
  slug: string;             // == ADDON.id
  badge?: string;           // "AI-Powered" | "Most Popular" | "Expert Service"
  tagline: string;          // hero subtitle (1 line)
  overview: string[];       // 1-3 paragraph
  highlights: { icon: string; title: string; text: string }[]; // key features
  steps: { title: string; text: string }[];                    // how it works
  audience: string[];       // "who it's for" bullets
  outcomes: string[];       // "what you get" bullets
  faqs: [string, string][]; // tool-specific Q&A
  media: ResourceMedia[];   // hero + gallery (placeholders until SS aaye)
  related: string[];        // dusre slugs
};

export const RESOURCE_DETAILS: Record<string, ResourceDetail> = { ... }
```
- Saare 11 (+1) tools ke liye **maine khud detailed marketing content likhunga**
  (overview, features, steps, FAQ) — placeholder nahi.
- Icon names `lucide-react` se map honge (reuse `ADDON_CONFIG` accent colors).
- Helper: `getResourceDetail(slug)` + `RESOURCE_SLUGS` array.

### 3.2 Dynamic route — `app/(main)/resources/[slug]/page.tsx`
- **Server component** (SEO friendly): `generateStaticParams()` (saare slugs),
  `generateMetadata()` (title/description/og‑image per tool), Next 15 async
  `params` pattern (`const { slug } = await params`). Unknown slug → `notFound()`.
- Layout: shadcn `Card`/`Badge`/`Button` + Tailwind 4, brand teal `#0d7a5c`,
  category accent color. Fully responsive, `animate-fade-up` entry.
- Price/unit/note `ADDONS` se, baaki content `RESOURCE_DETAILS` se.
- Ek chhota **client island** `AddToOrderButton.tsx` — sirf CTA, jo deep‑link
  karta hai `/pricing?mode=resources&addons=<slug>` (koi shared global state nahi).

### 3.3 Media component — `ResourceGallery.tsx`
- Hero image/video + thumbnail gallery (click to switch). `next/image` use karega.
- **Graceful fallback:** agar image file abhi missing hai to ek styled gradient
  panel + tool icon dikhega (category color), taake page kabhi toota na lage.
  SS aate hi bas file drop karni hai, code change nahi.
- Video support: `<video controls poster>` agar `type: "video"`.

### 3.4 Card redesign + clickable — `ResourceToolCard.tsx` (shared)
- Teeno jagah ka duplicate markup ek reusable component mein nikaalenge.
- **Naya attractive design** (out‑of‑the‑box):
  - Top par chhota **media strip / icon tile** with category‑tinted gradient,
    soft glow, hover par lift + icon micro‑rotate (jaisa `/tools` page).
  - Title, 2‑line desc, **price tag** + unit, category chip, optional badge ribbon.
  - "View details →" affordance (poora card `Link` → `/resources/[slug]`).
  - "+ Add to order" button card ke andar — `e.stopPropagation()` + `preventDefault()`
    taake card click navigate kare aur button sirf toggle kare.
  - `is-added` state (green) barqaraar.
- `pricing/page.tsx` ke teeno blocks isi component ko use karenge → less code,
  consistent look.

### 3.5 Pricing deep‑link handling (chhota patch)
- `PricingContent` ke `useEffect` (jo query params parse karta hai) mein:
  - `mode=resources` aaye to `setMode("resources")`.
  - `addons=<id>` already supported hai (set ko replace karta hai). Detail page se
    aaye user ka selection order summary mein turant dikhega.

---

## 4. Files — summary

| Action | File |
|---|---|
| **New** | `app/(main)/pricing/data/resourceDetails.ts` (rich content) |
| **New** | `app/(main)/resources/[slug]/page.tsx` (detail page, server) |
| **New** | `app/(main)/resources/[slug]/AddToOrderButton.tsx` (client CTA) |
| **New** | `app/(main)/resources/[slug]/ResourceGallery.tsx` (media) |
| **New** | `components/pricing/ResourceToolCard.tsx` (shared card) |
| **Edit** | `app/(main)/pricing/page.tsx` (use ResourceToolCard ×3, mode param) |
| **Edit** | `app/globals.css` (naye card styles, optional polish) |
| **Assets** | `public/assets/images/tools/<slug>/...` (aap denge) |

> Koi entitlement/RLS/checkout logic change **nahi** — sirf UI + naya read‑only
> content + ek query param. `/tools` page untouched.

---

## 5. 📸 IMAGE / VIDEO DIRECTIONS (aap ye provide karenge)

Har tool ke liye ek folder: `public/assets/images/tools/<slug>/`.
Recommended: **PNG/JPG, ~1600×1000 (16:10), <500KB**. Hero zaroori, gallery optional.
Video ho to `.mp4` (H.264) + ek poster image. File names exactly jaise neeche likhe.

> Jab tak aap SS nahi dete, page styled placeholder dikhayega — koi error nahi.

### Slug‑wise list

1. **`case-strength`** — Case Strength Analyzer
   - `hero.png` → tool ka result screen: AI **case strength score** (e.g. circular
     meter/percentage) + flagged gaps list.
   - `gallery-1.png` → gaps/checklist detail ("fix before NVC").

2. **`221g`** — 221(g) Action Planner
   - `hero.png` → generated **action roadmap / step‑by‑step plan** screen.
   - `gallery-1.png` → intake form ya 221(g) reason selection.

3. **`interview-prep`** — Interview Prep (guided prep + rapid‑fire + mock, ek hi tool)
   - `hero.png` → AI voice mock interview UI (question + answer area).
   - `gallery-1.png` → performance/score summary screen.

4. **`smart`** — Smart Form Filler
   - `hero.png` → auto‑filled **I‑130/I‑130A** form preview (filled fields).
   - `gallery-1.png` → "ready‑to‑upload PDF" download screen.

5. **`sponsor`** — Sponsorship Calculator
   - `hero.png` → income/assets vs **I‑864 poverty guideline** result.
   - `gallery-1.png` → "what you still need" summary.

6. **`photo`** — Photo Booth
   - `hero.png` → compliant passport/visa photo output (before/after ya crop guide).
   - `gallery-1.png` → background removal / compliance check screen.

7. **`doc-review`** — Expert Case Review
   - `hero.png` → reviewed packet with written feedback / annotations.
   - (optional) reviewer/expert visual.

8. **`consultation`** — Expert Consultation
   - `hero.png` → video call / booking calendar screen.

9. **`translate`** — Document Translation
    - `hero.png` → certified translation side‑by‑side (source → embassy‑ready).

10. **`civil-guid`** — Civil Document Guides
    - `hero.png` → guide library / a sample country‑specific guide.

11. **`case-manager`** *(optional, abhi hidden)* — Dedicated Case Manager
    - `hero.png` → case manager dashboard / chat.

**Video (optional):** kisi bhi tool ke liye `demo.mp4` + `demo-poster.png` dे dein,
main usko hero ke jagah ya gallery mein laga dunga. Bas batayein kaunse tool ka.

---

## 6. Build order (jab aap "go" karein)

1. `resourceDetails.ts` — saara content + types.
2. `ResourceGallery.tsx` + `AddToOrderButton.tsx`.
3. `resources/[slug]/page.tsx` — detail page assemble.
4. `ResourceToolCard.tsx` — naya card, phir `pricing/page.tsx` ×3 jagah swap + mode param.
5. CSS polish + responsive check.
6. `npm run lint` + `npx tsc --noEmit` (type check) + `npm run dev` se visual verify.

---

## 7. Confirm karne ke liye (jaldi)

- **Route URL** theek hai? → `/resources/case-strength` style. (Alternatives:
  `/pricing/<slug>` ya `/tools-detail/<slug>`.)
- **Card click behaviour:** poora card → detail page, "Add to order" button alag.
  Ya aap chahte ho ek alag "View details" link ho aur card body kuch aur kare?
- Detail page CTA buy par **`/pricing` par wapas le jaye** (deep‑link) — theek hai
  na, ya direct Stripe checkout?

(Default: upar wale recommended options par chaloonga agar aap kuch aur na kahein.)
```

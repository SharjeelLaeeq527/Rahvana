# Resources Funnel Plan — Demo → Lock → Buy → Unlock

> Goal: A user finds a tool/guide/service, **tries a demo for free**, hits a **lock**
> at the paid step, can either **see details/reviews** or **buy**, and after buying
> the item **unlocks** and shows up in their **"My Tools / My Guides / My Services"**.

---

## 1. The big picture (the flow we want)

```
[1] /resources  →  "Browse Tools/Guides/Services" section
         |  (user clicks a card)
         v
[2] The real tool opens in DEMO mode (free, try a little)
         |  (user reaches the paid/value step)
         v
[3] A LOCK appears  ->  "This is a paid feature"
         |   give the user two clear paths:
         |   |- "See details & reviews"  ->  /resources/{slug}  (sales page)
         |   `- "Add to order / Buy"      ->  /pricing?...&addons={id}  (checkout)
         v
[4] Buy  ->  Stripe checkout  ->  /payment/success
         |   (plan.refresh() runs here)
         v
[5] Lock opens AND the item moves into "My Tools/Guides/Services"  ✅
```

---

## 2. Two different pages (clear this up first)

People get confused because each tool has **two** separate pages:

| Page | What it is | Example (221g) |
|---|---|---|
| **Real tool (demo)** | Where the user actually works — inputs, results | `/221g-action-planner` |
| **Sales / detail page** | Marketing page — price, reviews, "what you get", "Add to order" | `/resources/221g` |

The `/resources/[slug]` page is the **sales page** (slug = pricing add-on id like `221g`, `guide-passport`, `smart`).

---

## 3. Good news: most of this already exists

- **Demo + lock is already built.** In `lib/entitlements/routeFeatureMap.ts` all the
  route walls are commented out. The app uses a **"Result-Lock" strategy**: users can
  open any tool freely, and the lock only appears at the final result/output step
  (via `ResultGate` + `UpgradeModal`). That is exactly the "try before you buy" we want.
- **Buy after the lock already works.** `UpgradeModal` already shows both
  **"Upgrade to plan"** and **"Buy once"** (add-on) buttons.
- **After purchase the item moves to "My".** The My/Browse split on `/resources` is
  computed live from `plan.isLocked(feature)`. When a purchase flips `isLocked` to
  false (via tier change or `purchased_addons`), the item moves Browse → My
  automatically. (Verified with the real entitlement functions.)

So we only need to **connect the pieces**, not rebuild them.

---

## 4. Two important facts found in the code

1. **The lock screen already has "Buy".** `UpgradeModal` shows Upgrade + Buy-once, and
   `ResultGate` opens that same modal. So we only need to add a **"See details &
   reviews"** link. We do **not** need to touch `ResultGate`.

2. **ID mismatch (must handle carefully).** The add-on ids in `pricing.ts` and
   `lib/entitlements/config.ts` are **not always the same**:
   - `pdf_toolkit` → config id `pdf-tool-kit`, but the **sales page slug is `pdf`**
   - `snap_sign` → config id `snap-sign`, but the **sales page slug is `snap`**

   So building the sales link from `entitlement(feature).addon.id` would be **wrong**
   (it would 404). We fix this with one small explicit mapping file.

---

## 5. The changes (3 in total)

### Change 1 — New mapping file
**File:** `lib/entitlements/resourceLinks.ts` *(new)*

Two simple maps + two helpers:

```ts
// feature key  ->  sales page slug (the id used by pricing.ts / /resources/[slug])
export const FEATURE_TO_SALES_SLUG: Record<string, string> = {
  action_221g: "221g",
  basic_interview_prep: "interview-prep",
  sponsorship_calc: "sponsor",
  photo_booth: "photo",
  pdf_toolkit: "pdf",          // mismatch handled here
  snap_sign: "snap",           // mismatch handled here
  smart_form_filler: "smart",
  guide_passport: "guide-passport",
  guide_police: "guide-police",
  guide_cnic: "guide-cnic",
  guide_birth_cert: "guide-birth-cert",
  guide_frc: "guide-frc",
  guide_nikah_nama: "guide-nikah-nama",
  expert_consultation: "consultation",
  pcc_filing: "pcc",
  medical_booking: "medical",
  document_translation: "translate",
  // dq_status_check & polio_certificate have no sales page — left out on purpose
};

// sales slug  ->  real tool route (demo). Only items that have a working demo.
export const SALES_SLUG_TO_TOOL_ROUTE: Record<string, string> = {
  "221g": "/221g-action-planner",
  "interview-prep": "/interview-prep",
  sponsor: "/affidavit-support-calculator",
  photo: "/passport",
  pdf: "/pdf-processing",
  snap: "/signature-image-processing",
  smart: "/visa-forms",
  "guide-passport": "/guides/passport-guide",
  "guide-police": "/guides/police-verification-guide",
  "guide-cnic": "/guides/cnic-guide",
  "guide-birth-cert": "/guides/birth-certificate-guide",
  "guide-frc": "/guides/frc-guide",
  "guide-nikah-nama": "/guides/nikah-nama-guide",
  // services (consultation/pcc/medical/translate) have no demo — skipped
};

export const getDetailsHref = (feature: string) =>
  FEATURE_TO_SALES_SLUG[feature] ? `/resources/${FEATURE_TO_SALES_SLUG[feature]}` : null;

export const getDemoRouteForSlug = (slug: string) =>
  SALES_SLUG_TO_TOOL_ROUTE[slug] ?? null;
```

**Why a central file:** the id mismatch is handled in one place, and adding a new tool
later means adding just one line here (matches the codebase's registry pattern).

---

### Change 2 — "See details & reviews" link on the lock screen
**File:** `app/components/entitlements/UpgradeModal.tsx`

- Import `Link` from `next/link` and `getDetailsHref`.
- In **both** modal layouts (the add-on layout and the upgrade-only layout), near the
  bottom "Secure checkout…" line, add a small link:

```tsx
{getDetailsHref(feature) && (
  <Link
    href={getDetailsHref(feature)!}
    onClick={onClose}
    className="text-center text-[12px] underline ..."
  >
    See details & reviews
  </Link>
)}
```

- **Bonus:** the Browse-card lock and the `ResultGate` lock both use this same modal,
  so one change covers both. No need to edit `ResultGate.tsx`.

---

### Change 3 — "Try the demo" button on the sales page
**File:** `app/(main)/resources/[slug]/page.tsx`

- Import `getDemoRouteForSlug`.
- In the hero CTA area (next to "Add to order" / "Browse all"), add:

```tsx
{getDemoRouteForSlug(slug) && (
  <Link href={getDemoRouteForSlug(slug)!} className="...outline button...">
    Try the demo →
  </Link>
)}
```

- Services (consultation/pcc/medical/translate) have no demo, so the helper returns
  null and the button simply won't appear (they keep their existing
  "Add … info to checkout" button).

---

## 6. What we will NOT touch

- Entitlement logic, `isLocked`, the checkout API, and the My/Browse split — these
  already work.
- `ResultGate.tsx` — the `UpgradeModal` change covers it automatically.

---

## 7. Files summary

| File | What |
|---|---|
| `lib/entitlements/resourceLinks.ts` | **new** — 2 maps + 2 helpers |
| `app/components/entitlements/UpgradeModal.tsx` | add "See details & reviews" link (both layouts) |
| `app/(main)/resources/[slug]/page.tsx` | add "Try the demo" button |

---

## 8. How to test

1. Run `tsc --noEmit` and check only these files for errors.
2. Manual check (free user):
   - `/resources` → "Browse" → click a card → the real tool opens (demo).
   - Reach the paid step → lock appears.
   - The modal shows **3 things**: Upgrade / Buy once / **See details & reviews**.
   - "See details & reviews" → sales page → **Try the demo** → back to the tool.
   - After a successful purchase → item appears in **"My …"** section.

---

## 9. Backend note (for your half)

When buying from the lock, `UpgradeModal` sends the **config id** to checkout
(`pdf-tool-kit`, `snap-sign`), while the sales page slug is `pdf` / `snap`. The UI link
mismatch is handled in Change 1, **but the checkout/Stripe mapping** must be verified on
the backend: buying `pdf-tool-kit` must store the exact id in `purchased_addons` that
`config.ts` expects — otherwise the unlock won't happen. This is the backend half to
confirm.

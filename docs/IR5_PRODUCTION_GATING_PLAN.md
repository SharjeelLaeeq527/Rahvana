# IR-5 Production Gating Plan

Hide the IR-5 category on **production** while keeping it fully visible on **staging** - without deleting any IR-5 code. Same idea as the existing Plan Tier dev toggle (env-gated), but for a whole category.

Status: PLAN ONLY (nothing changed yet). Approved decisions: dedicated env flag, production hosted on Vercel.

---

## 1. Goal

- Merge the entire `staging` branch into `main` (production). All IR-5 code ships too.
- On production, a user must NOT be able to see or open IR-5 anywhere.
- On staging, IR-5 keeps working exactly as today.
- Later, when IR-5 is ready for production, we flip ONE env var - no code change, no re-merge.

Key principle: **do not strip IR-5 from the code.** We only hide the entry points behind an environment flag. This keeps one codebase and avoids painful merge conflicts later.

---

## 2. The Flag (single source of truth)

New file: `lib/feature-flags.ts`

```ts
/**
 * Feature flags gated by deploy environment.
 * IR-5 is hidden on production until it is ready to launch.
 *
 * Rule: IR-5 is visible when EITHER
 *   - NEXT_PUBLIC_ENABLE_IR5 === "true"  (explicit force-on, e.g. prod launch), OR
 *   - NEXT_PUBLIC_ENVIRONMENT !== "production"  (staging/local show it by default)
 */
export const IR5_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_IR5 === "true" ||
  process.env.NEXT_PUBLIC_ENVIRONMENT !== "production";
```

Why this rule:
- Staging already has `NEXT_PUBLIC_ENVIRONMENT=development` (confirmed in `.env.local`), so IR-5 shows there automatically. No staging change needed.
- Production must have `NEXT_PUBLIC_ENVIRONMENT=production` set (on Vercel), so IR-5 hides.
- Day IR-5 launches on prod: set `NEXT_PUBLIC_ENABLE_IR5=true` on the Vercel production project. Done.

Note: `NEXT_PUBLIC_` vars are inlined at build time, so this works in both server and client components.

---

## 3. How a user reaches IR-5 today (the surfaces we must gate)

Traced through the code. The live path is:

1. `/visa-category` explorer grid -> **IR-5 "Parent Visa" card**
   - Source: `app/(tools)/(visa)/visa-category/data/journeys.ts` -> `EXPLORER_CARDS`
   - Rendered by: `app/(tools)/(visa)/visa-category/components/journey-explorer.tsx`
2. Card click -> `/visa-category/ir-5` -> **IR-5 detail page** (`JourneyDetailPage`)
3. Detail CTA "Start IR-5 assessment" -> `/visa-category/ir5-journey` -> **the actual IR-5 roadmap/dashboard** (`RoadmapLayoutEngine`)
4. `/my-journeys` -> shows an IR-5 card ONLY if that user already started an IR-5 journey
5. Nav menu already lists IR-5 as `href:"#"` + "Soon" badge -> **not a live link, no change needed**
6. (Legacy) `ExploreJourneys.tsx` has its own `JOURNEYS` array with an `ir5` entry - gated for safety in case it is still mounted anywhere.

---

## 4. Files to change

### 4.1 NEW - `lib/feature-flags.ts`
Add the `IR5_ENABLED` flag shown in section 2.

### 4.2 HARD ROUTE GUARD (most important) - `app/(tools)/(visa)/visa-category/[visa-journey]/page.tsx`
This is the wall. Even if a link leaks or someone bookmarks `/visa-category/ir-5` or `/visa-category/ir5-journey`, the page itself refuses on production.

- Import `IR5_ENABLED` and `useRouter`.
- After the journey param is resolved to its canonical form, if it points to IR-5 and `!IR5_ENABLED`, redirect to `/visa-category`.
- Covers both `ir-5` (detail slug) and `ir5-journey` (roadmap slug), because both map to the IR-5 experience.

Sketch:
```ts
import { IR5_ENABLED } from "@/lib/feature-flags";
import { useRouter } from "next/navigation";
// ...
const router = useRouter();
const isIr5 =
  visaJourneyParam === "ir-5" ||
  visaJourneyParam === "ir5-journey" ||
  visaJourney === "ir-5";

useEffect(() => {
  if (isIr5 && !IR5_ENABLED) {
    router.replace("/visa-category");
  }
}, [isIr5, router]);

if (isIr5 && !IR5_ENABLED) return null; // avoid flashing IR-5 before redirect
```
(Exact placement will respect the existing hooks order in that file so nothing crashes on render.)

### 4.3 EXPLORER GRID - `app/(tools)/(visa)/visa-category/components/journey-explorer.tsx`
Filter the IR-5 card out of the grid when the flag is off, so it is never shown or searchable.

```ts
import { IR5_ENABLED } from "@/lib/feature-flags";
// ...
const baseCards = useMemo(
  () => EXPLORER_CARDS.filter((c) => IR5_ENABLED || c.slug !== "ir-5"),
  []
);
// then filter baseCards by query instead of EXPLORER_CARDS
```

### 4.4 MY JOURNEYS - `app/(main)/my-journeys/page.tsx`
If an existing user already has an IR-5 journey record, hide that card on production so they cannot re-open it.

```ts
import { IR5_ENABLED } from "@/lib/feature-flags";
// in fetchJourneys(), after unique[] is built:
const gated = IR5_ENABLED
  ? unique
  : unique.filter((j) => normalizeJourneyId(j.journey_id) !== "ir5");
setJourneys(gated);
```

### 4.5 LEGACY EXPLORER (safety) - `app/(tools)/(visa)/visa-category/components/ExploreJourneys.tsx`
Filter the `ir5` entry from the `JOURNEYS` array render, same pattern, in case this component is still reachable.

```ts
const visibleJourneys = JOURNEYS.filter((j) => IR5_ENABLED || j.id !== "ir5");
// use visibleJourneys in the existing filteredJourneys logic
```

### 4.6 Optional marketing/mentions (decide later, low priority)
Places that only *mention* IR-5 in copy (home page ticker, pricing text, `/visa-category` meta description). These do not let a user OPEN IR-5, so they are cosmetic. Recommend leaving them for now and revisiting if you want zero mention of IR-5 on prod. Listed here so nothing is a surprise:
- `app/(tools)/(visa)/visa-category/page.tsx` (meta description text)
- `app/components/home-page/VisaTicker.tsx`, `StaticSections.tsx`
- `app/(main)/pricing/*`

---

## 5. Vercel setup (production project)

On the Vercel **production** project -> Settings -> Environment Variables, make sure:

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_ENVIRONMENT` | `production` | Required. This is what turns IR-5 (and the tier toggle) OFF. Verify it is actually set. |
| `NEXT_PUBLIC_ENABLE_IR5` | (do NOT set, or set `false`) | Leave unset to keep IR-5 hidden. Set to `true` later to launch IR-5 on prod. |

Staging project: no change needed (it already runs with `NEXT_PUBLIC_ENVIRONMENT=development`, so IR-5 stays visible).

IMPORTANT: `NEXT_PUBLIC_` vars are baked in at build time, so after changing them you must **redeploy** for the change to take effect.

---

## 6. Behavior matrix

| Environment | `NEXT_PUBLIC_ENVIRONMENT` | `NEXT_PUBLIC_ENABLE_IR5` | IR-5 visible? |
|---|---|---|---|
| Local dev | development (or unset) | unset | YES |
| Staging | development | unset | YES |
| Production (now) | production | unset / false | NO |
| Production (after launch) | production | true | YES |

---

## 7. Verification checklist (before + after merge)

Local, simulate production:
1. Set `NEXT_PUBLIC_ENVIRONMENT=production` in `.env.local` temporarily, `npm run build && npm start` (or dev).
2. `/visa-category` -> IR-5 card is GONE.
3. Visit `/visa-category/ir-5` directly -> redirected to `/visa-category`.
4. Visit `/visa-category/ir5-journey` directly -> redirected to `/visa-category`.
5. `/my-journeys` (as a user who had an IR-5 journey) -> IR-5 card GONE.
6. IR-1 everywhere works normally.
7. Revert `.env.local` back to `development` -> IR-5 reappears.

Note (from project memory): green Jest/tsc does not prove React renders. Actually load these pages in the browser to confirm no hook-order crash after the guard is added.

---

## 8. Merge flow

1. Implement the changes above on `staging`, verify with section 7.
2. Commit on `staging`.
3. Merge `staging` -> `main` (PR).
4. Confirm Vercel production has `NEXT_PUBLIC_ENVIRONMENT=production` (section 5).
5. Deploy `main`. Re-run section 7 checks on the live production URL.

Rollback: if anything is wrong, IR-5 hiding is pure env + guard - set `NEXT_PUBLIC_ENABLE_IR5=true` to instantly reveal, or revert the small commit. No data migration involved.

---

## 9. Files touched (summary)

| File | Change |
|---|---|
| `lib/feature-flags.ts` | NEW - `IR5_ENABLED` flag |
| `app/(tools)/(visa)/visa-category/[visa-journey]/page.tsx` | Route guard + redirect (hard wall) |
| `app/(tools)/(visa)/visa-category/components/journey-explorer.tsx` | Filter IR-5 card from grid |
| `app/(main)/my-journeys/page.tsx` | Filter IR-5 from saved journeys |
| `app/(tools)/(visa)/visa-category/components/ExploreJourneys.tsx` | Filter IR-5 from legacy explorer (safety) |
| Vercel prod env | Ensure `NEXT_PUBLIC_ENVIRONMENT=production` |

No IR-5 data files, engines, or JSON are deleted. Everything ships; only the doors are locked on production.

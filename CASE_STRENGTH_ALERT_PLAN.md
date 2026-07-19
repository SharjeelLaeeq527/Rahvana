# Case-Strength Dashboard — Progressive Alert Plan (IR-1 first)

> **Goal:** Alerts / warnings / criticals dashboard pe **sab ek saath** na aayein.
> Har alert tab dikhe jab woh deficiency user ke process-position pe **actually
> actionable** ho — aur ek fair grace/time ke baad. IR-1 pehle; design
> category-agnostic hai to IR-5 pe wesa hi apply hoga.

---

## 1. Root cause (confirmed, guess nahi)

Dashboard ka **single alert surface = `AlertCenter`**.

- Data `DashboardViewV3.tsx` ke `alertCenterIssues` memo mein banta hai
  (`app/components/journey-v3/DashboardViewV3.tsx:359–427`) aur `AlertCenter` ko
  pass hota hai (desktop `:988–997`, mobile `:1008–1017`).
- Wahan `aggregateChapter1Issues` / `aggregateChapter2Issues` /
  `aggregateChapter3Issues` (`lib/case-strength/aggregate-issues.ts`) **har
  chapter ke har step** ko bina kisi progress/time shart ke loop karte hain
  (Ch1 loop `:124–147`, Ch2 `:178–201`, Ch3 `:234–243`).
- `AlertCenter` ka andar sirf **severity + `!resolved`** filter hai — koi progress
  ya time gate nahi (`app/components/journey-v3/components/AlertCenter.tsx:167–169`).

**Natija:** user Chapter 1 (I-130) pe hai, magar Chapter 3 ka
medical/interview/221(g) warning bhi din 1 se dikh jata hai → confusion.

**Achhi khabar:** har issue (`AggregatedIssue`,
`lib/case-strength/aggregate-issues.ts:21–34`) mein pehle se `stepKey`,
`chapterIdx`, `stepIdx`, `stepNumber`, `level` mojood hai — yani gating ke liye
zaroori data already hai.

---

## 2. Kya infra pehle se mojood hai

| Cheez | Status | Source |
|---|---|---|
| Kaun se steps complete (`completedSteps` Set) | ✅ available | `app/(main)/dashboard/hooks/useWizard.ts:174–176` |
| Current step (frontier) | ✅ derive ho jata hai | `useWizard` load + `lib/journey/service.ts:232–243` |
| "Step complete kiye kitne din huye" (`completed_at`) | ✅ DB mein reliably likha jata hai | `lib/journey/service.ts:527–533` |
| "Step pe pehli baar kab pohcha" (`started_at`) | ❌ schema mein hai par **kabhi likha nahi jata** | field `lib/journey/types.ts:69`; insert `null` `lib/journey/data-access.ts:505` |
| Scheduled/recurring reminders (delayDays / fire_at) | ✅ `UnifiedReminderEngine` + `reminderRegistry` | `lib/notifications/UnifiedReminderEngine.ts`, `lib/notifications/reminderRegistry.ts` |
| Visible-step filtering (Ch3 `visible_when`) | ✅ **hamesha `getActiveStepsForStage` use karo** | `lib/journeyHelpers.ts` (CLAUDE.md rule) |

Yani: **AHEAD-suppression aur BEHIND-escalation bina naye DB ke ho sakti hai.**
Sirf **ACTIVE-step grace timer** ke liye `started_at` plumbing chahiye (Phase 2).

---

## 3. Design principle (professional / official standpoint)

Ek alert us step se bandha hai jahan woh deficiency **official process mein
actionable** banti hai (yeh `stepKey` mein already encode hai). Har step user ke
frontier ke lehaz se teen states mein hota hai:

| State | Matlab | Rule |
|---|---|---|
| **AHEAD** | user abhi wahan pohcha hi nahi (step frontier ke aage) | AlertCenter se **poori tarah chhupao** |
| **ACTIVE** | user abhi is step pe hai (= frontier) | dikhao, **severity-based grace** ke baad |
| **BEHIND** | step pass/skip kiya par deficiency reh gayi | **escalate** — "pass kar liya par X missing → case strength kamzor" |
| **LOOK-AHEAD** | curated deadline-driven item, ek chapter pehle plan karna behtar | "prepare ahead" tone, capped severity |

---

## 4. Timing constants (tunable — ek jagah define honge)

```ts
// lib/case-strength/alert-gating.ts
export const ALERT_TIMING = {
  activeWarningGraceDays: 3,     // current step pe warning itne din baad
  behindWarningShowDays: 7,      // pass kiye N din baad behind-warning dikhe
  behindWarningEscalateDays: 21, // uske baad critical mein escalate
  recurringNudgeDays: 14,        // dubara yaad-dahani ka interval
  recurringNudgeMax: 3,          // spam se bachne ke liye cap
  lookAheadChapters: 1,          // apne chapter se itne pehle look-ahead dikhe
};
```

- **Critical (jo action block kare):** din **0** — foran (grace nahi).
- **Info:** kabhi AlertCenter mein nahi — sirf step page pe inline (already aisa hai).
  AlertCenter sirf `critical` + `warning` dikhata hai.

---

## 5. Konsa alert KAB dikhega — full schedule

Legend — **When:** `foran` = din 0 | `ACTIVE+Nd` = current step pe N din baad |
`BEHIND 7d→21d` = pass ke 7 din baad warning, 21 din baad critical |
`hidden→reach` = us chapter/step tak chhupa, phir apna rule.

### Chapter 1 — USCIS / I-130

| Step | Alert | Sev | When |
|---|---|---|---|
| 1.3 Filing method | Filing method not chosen | warn | ACTIVE+3d |
| 1.4 I-130 | Marriage date / DOB missing | warn | ACTIVE+3d → agar submit ke baad bhi missing to **BEHIND 7d→21d** |
| 1.4 I-130 | Date-risk flags (short marriage / high age-gap) | crit/warn | crit **foran**; warn ACTIVE+3d |
| 1.5 I-130A | Current country missing | warn | ACTIVE+3d |
| 1.5 I-130A | Multi-country history → PCC needed | info | inline only (+ **look-ahead** to 3.3, see §6) |
| 1.8 Upload | File too large / wrong format | crit | **foran** (upload block karta hai) |
| 1.9 Pre-submit | Unresolved eligibility blockers | crit | **foran jab user 1.9 pe** (1.1 pe already inline dikh chuka) |
| 1.10 Review & submit | Key dates not captured / "do not submit" | warn/crit | **foran jab user 1.10 pe** |

### Chapter 2 — NVC / CEAC

| Step | Alert | Sev | When |
|---|---|---|---|
| 2.3 DS-260 | DS-260 ↔ I-130 mismatch | crit | `hidden→reach` Ch2, phir **foran** |
| 2.3 DS-260 | Mandatory disclosure missing (visa refusal / record / overstay / prior marriage) | warn | `hidden→reach` Ch2, phir ACTIVE+3d |
| 2.4 Civil docs | Required civil doc missing | warn | ACTIVE+3d → **BEHIND 7d→21d** |
| 2.5 I-864 | Income 125% guideline se kam (`sponsorshipResult`) | warn | ACTIVE → **BEHIND escalate to crit** + **look-ahead** (§6) |
| 2.7 Joint sponsor | Add joint sponsor in CEAC | warn | ACTIVE+3d |
| 2.8 Submit to NVC | DS-260 / civil docs incomplete | warn | **foran** (final QA gate) |
| 2.8 Submit to NVC | Affidavit income gap unresolved | crit | **foran** |

### Chapter 3 — Medical / Interview

| Step | Alert | Sev | When |
|---|---|---|---|
| 3.1 Medical | Exam not scheduled | warn | `hidden→reach` Ch3, phir ACTIVE |
| 3.3 Fresh PCC | Apply for fresh police certificate | warn | ACTIVE (weeks lagte hain) + **look-ahead** (§6) |
| 3.8 Interview | Originals not gathered (dep. on 3.6) | warn | ACTIVE+3d |
| 3.11 221(g) | Submit exactly what requested | warn | sirf jab 221(g) outcome (already `visible_when`-gated) |

> Baaki Chapter 3 items (polio, sealed envelope, originals-match, visa-verify) **info**
> hain → inline rahengi, AlertCenter mein nahi. Yeh badalna nahi.

---

## 6. Look-ahead tier (optional — ab include kar rahe hain)

Kuch deficiencies deadline-driven hain; inhe apne step se **ek chapter pehle**
"plan ahead" ke taur pe dikhana professionally behtar hai (warna user der se
pata chalega). Rule: item tab dikhe jab `frontierChapter >= itemChapter - 1`,
aur **severity `warning` pe cap** (early stage pe kabhi `critical` nahi), aur
title pe **"Plan ahead"** tag.

Curated allowlist (sirf yeh — poora look-ahead nahi):

| Item | Natural step | Look-ahead se dikhe | Reason |
|---|---|---|---|
| Income shortfall / joint sponsor | 2.5 | Chapter 1 ke aakhir se | Joint sponsor arrange karne mein weeks lagte hain |
| Multi-country → extra PCCs | 3.3 | jab 1.5 pe multi-country history mile | Har mulk ka PCC time-consuming |
| Fresh PCC lead time | 3.3 | Chapter 2 ke aakhir se | Fresh PCC (NVC waala nahi) mein weeks |

Look-ahead item **kabhi block nahi karta** aur clearly "abhi zaroori nahi, plan
kar lo" framing mein hota hai — active critical se alag.

---

## 7. Core logic — frontier + gating

```ts
// lib/case-strength/alert-gating.ts

// Frontier = user ki current position = pehla incomplete VISIBLE step.
// visible_when hamesha getActiveStepsForStage se — manually filter mat karna.
type Position = { chapterIdx: number; stepIdx: number };

function stepState(issue: AggregatedIssue, frontier: Position, ctx): 
  "AHEAD" | "ACTIVE" | "BEHIND" {
  const cmp = comparePos({ chapterIdx: issue.chapterIdx, stepIdx: issue.stepIdx }, frontier);
  if (cmp > 0) return "AHEAD";
  if (cmp === 0) return "ACTIVE";
  return "BEHIND";
}

function shouldShow(issue, frontier, ctx, now): boolean {
  // Info kabhi AlertCenter mein nahi (existing behaviour)
  if (issue.level === "info") return false;

  // Look-ahead allowlist: apne chapter se lookAheadChapters pehle, warning-capped
  if (isLookAhead(issue) &&
      frontier.chapterIdx >= issue.chapterIdx - ALERT_TIMING.lookAheadChapters) {
    return true; // caller severity ko warning pe cap kare + "Plan ahead" tag
  }

  const state = stepState(issue, frontier, ctx);

  if (state === "AHEAD")  return false;                    // core fix
  if (issue.level === "critical") return true;             // crit hamesha foran

  if (state === "ACTIVE") {
    const days = daysOnStep(ctx, issue.stepKey, now);      // Phase 2: started_at se
    return days >= ALERT_TIMING.activeWarningGraceDays;
  }

  // BEHIND warning: completed_at se time-gate + escalation
  const completedAt = ctx.completedStepDates[issue.stepKey];
  if (!completedAt) return true; // skipped-without-completing → foran dikhao
  const days = daysSince(completedAt, now);
  return days >= ALERT_TIMING.behindWarningShowDays;
}

// Escalation: BEHIND warning jo behindWarningEscalateDays paar kare → critical
// dikhao aur message mein "case strength kamzor ho rahi hai" line lagao.
function effectiveLevel(issue, ctx, now) {
  const completedAt = ctx.completedStepDates[issue.stepKey];
  if (issue.level === "warning" && completedAt &&
      daysSince(completedAt, now) >= ALERT_TIMING.behindWarningEscalateDays) {
    return "critical";
  }
  return issue.level;
}
```

---

## 8. Logical edge cases (proper handling)

1. **Skipped step (behind + incomplete):** frontier = pehla incomplete step, to
   normally behind steps complete hote hain. Lekin agar user ne aage jaa kar ek
   step chhod diya (incomplete + behind), `completed_at` nahi hoga → us case mein
   warning **foran** dikhao (user ne genuinely skip kiya).
2. **Eligibility blocker double-count nahi:** eligibility risk step 1.1 pe pehle
   se inline dikhta hai (`EligibilityRiskBanner`). 1.9/1.10 ka dashboard alert
   sirf tab dikhega jab user wahan pohche — koi double alarm nahi.
3. **`visible_when` (Chapter 3 branches):** frontier calc aur gating dono
   `getActiveStepsForStage` par based hon — hidden step ko na frontier mein ginna
   hai na alert dikhana (CLAUDE.md rule).
4. **Consistency findings (whole-journey):** `runFullConsistencyAnalysis` ke
   findings ka `stepKey` **later comparison step** (e.g. DS-260 `step_2_3`) set
   karo, taake woh us milestone pe hi surface hon, pehle nahi.
5. **Resolved issues:** `!resolved` filter waise hi rahega (AlertCenter:167–169).
6. **Recurring nudge cap:** behind-deficiency ki yaad-dahani har 14 din, max 3 —
   dashboard spam se bachao.
7. **Fresh start (journey shuru hi nahi):** completedSteps khaali → frontier =
   1.1 → sirf 1.1 + look-ahead dikhega. **Yehi asal fix hai** (koi wall of alerts
   nahi).
8. **Time source reliability:** `completed_at` reliable hai (Phase 1 usi pe).
   `started_at` Phase 2 mein populate hoga; jab tak nahi, ACTIVE warnings foran
   (grace = 0) — degrade gracefully, kuch toota nahi.

---

## 9. Implementation phases (IR-1 pehle)

### Phase 1 — Progress gating (essential fix, **zero naya DB**)
1. Naya module `lib/case-strength/alert-gating.ts` — `stepState`, `shouldShow`,
   `effectiveLevel`, `ALERT_TIMING`, `isLookAhead` (§7).
2. `DashboardViewV3.tsx` ke `alertCenterIssues` memo (`:359–427`) mein: aggregate
   ke baad `frontier` compute karke `.filter(shouldShow)` + `effectiveLevel` map.
3. Consistency findings ko sahi `stepKey` assign (edge-case #4).
4. **Asar:** AHEAD alerts gayab, "sab ek saath" confusion khatam. BEHIND-warning
   `completed_at` se time-gate. Look-ahead allowlist active.

### Phase 2 — Time staggering ("specific time ke baad" nag)
5. `steps.started_at` populate karo jab step pehli baar current bane
   (`useWizard` navigation / previous step complete hone pe). `daysOnStep()` isi
   se ACTIVE grace lagayega.
6. BEHIND escalation 7d→21d (`completed_at`) + `effectiveLevel` critical upgrade
   + "case strength kamzor" messaging.
7. **(Optional)** passed-step deficiencies ko `UnifiedReminderEngine` +
   `reminderRegistry` (`delayDays` / `recurring` / `fire_at`) se scheduled
   notification bhi banao — dashboard ke bahar bhi nudge (email/bell), recurring
   cap ke saath.

### Category-agnostic
Sab kuch `AggregatedIssue` + `completedSteps` par based hai — IR-1 ke baad IR-5
pe apne aap apply hoga (koi hardcoded step id nahi).

---

## 10. Testing / verification

- **Unit** (`__tests__/case-strength/`): `shouldShow` / `effectiveLevel` ke liye —
  fresh-start (sirf 1.1), mid-Ch1 (Ch2/3 hidden), behind-deficiency 7d/21d
  escalation, look-ahead one-chapter-early + severity cap, skipped-step foran.
- **Frontier**: `visible_when`-hidden step na frontier mein ginna na alert.
- **End-to-end**: dashboard pe stage aage badha kar dekho ke alerts progressively
  reveal hote hain, ek saath nahi.
- Existing case-strength tests green rahein (regression na ho).

---

## 11. Deliverable summary (boss ke liye ek line)

> "Case-strength dashboard ab alerts ko user ki journey-position + time ke hisaab
> se progressively dikhata hai — jo step reach nahi hua uske warnings chhupe
> rehte hain; pass kiye step ki deficiency specific time baad escalate hoti hai;
> aur kuch deadline-driven items (joint sponsor, PCC) 'plan ahead' ke taur pe
> ek chapter pehle aate hain. IR-1 pe implement, IR-5 pe portable."

---

## 12. Addendum — implementation notes (what actually shipped)

**Dashboard version:** IR-1/CR-1 render the **V2** dashboard
(`.../components/v2/DashboardView.tsx`), IR-5 renders **V3**
(`app/components/journey-v3/DashboardViewV3.tsx`). Both are near-identical copies.
Gating + empty state were wired into **both** (IR-1 = V2 is the priority target).

**Two separate fixes shipped (Phase 1):**

1. **Progressive alert gating** — `lib/case-strength/alert-gating.ts`
   (`gateAlertIssues`, pure/decoupled: caller passes `activeOrder` +
   `frontierStepKey` + `frontierChapterIdx`). Wired into both `DashboardView`
   memos. AHEAD alerts hidden; ACTIVE/BEHIND shown; look-ahead allowlist;
   time-ready for Phase 2.

2. **Empty-state gate (NN/g)** — `isMeaningfullyStarted()` decides when there's
   enough signal to assess. Below it, `CaseHealthOverview` renders a neutral
   "Not started" panel (score `—`, no red critical/warning, a learning cue)
   instead of a fabricated score. **"Started" = ≥1 completed step** (strict, on
   purpose: the wizard hydrates `metadata` from case_data + profile autofill on
   load, so a fresh journey already has non-empty metadata — softer signals like
   an eligibility draft or a stray vault upload would false-trigger the score).
   Grounded in: NN/g empty states (status +
   learning cue + one pathway), progressive disclosure, and "no false precision"
   for a health score computed from a near-empty case.

**Verification:** 94/94 case-strength Jest tests pass (incl. 20 gating +
engagement tests); `tsc --noEmit` clean on all touched files. In-app visual check
of the empty state (fresh authed IR-1 journey) still recommended.

**Known minor follow-up:** at fresh start `AlertCenter` shows its "All clear"
empty state (harmless but slightly implies "assessed & fine"); could pass
`notStarted` to it for a "complete steps to see alerts" message.

---

## 13. Addendum — scalability pass + Phase 2 (shipped)

**Scalability (so a new category needs zero gating/UI code):**

- **Look-ahead is now category-driven.** The rules moved off the shared engine
  onto `CaseStrengthProfile.lookAhead`. Family categories reuse
  `COMMON_LOOK_AHEAD` (step-checkers.ts); IR-1 and IR-5 both point at it; a
  non-family category declares its own or omits it. `alert-gating.ts` is fully
  visa-agnostic and receives the rules via `GateContext.lookAheadRules`.
- **`buildGateContext()`** derives frontier + active-order once and is shared by
  the V2 (IR-1) and V3 (IR-5) dashboards — the per-dashboard loop is gone (DRY).
  journeyHelpers are injected, so it stays UI-agnostic.
- Net: **adding a category = one profile file** (checkers + lookAhead + evidence
  + …). No changes to the gating engine, the empty state, or the dashboards.
- Remaining structural redundancy (out of scope): IR-1 renders the **V2**
  dashboard and IR-5 the **V3** copy, so UI-component edits are still done twice.
  Consolidating V2→V3 is a separate journey migration, not a case-strength task.

**Phase 2 — time-based escalation (shipped, `completed_at` path):**

- `WizardState.stepTimestamps` now carries per-step `completedAt`/`startedAt`
  (ms), hydrated from the DB `steps` rows on load; `completedAt` is also stamped
  locally in `toggleComplete` so the clock is right without a reload.
- Passed into `buildGateContext({ stepTimestamps })` → the gate applies the
  behind-step windows: a passed step's unresolved **warning** stays hidden for
  `behindWarningShowDays` (7d), shows as a warning 7–21d, then **escalates to
  critical** with the "weakening your case strength" note after
  `behindWarningEscalateDays` (21d). This is the "passed a step, after a specific
  time, told your case strength is weak" behaviour the user asked for.
- **Active-step grace (`startedAt`) left inert on purpose.** `steps.started_at`
  isn't written today, so the map is empty → current-step warnings show
  immediately (which is correct: the user is on that step). Enabling a 3-day
  current-step grace would need a write-on-view of `started_at`; deferred as an
  optional nicety (arguably undesirable, since it would hide relevant current
  warnings).
- **Re-render caveat:** the escalation is evaluated per render, not on a timer —
  a dashboard left open won't flip at exactly T+21d until the next load/render.
  Acceptable for a dashboard; a scheduled push (UnifiedReminderEngine) is the
  path if a real-time nudge is ever needed.

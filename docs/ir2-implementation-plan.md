# IR-2 (Child of U.S. Citizen) Journey - Implementation Plan

**Status**: Phase 0a DONE (2026-10-30). Phase 0b not started.
**Date**: 2026-10-28 (updated 2026-10-30)

> **Phase 0a result.** Stripe mapping (`journeyTypeForVisaCategory` -> `IR1 | IR2 | IR5`),
> checkout `CATEGORY_NOT_AVAILABLE` gate (`IR2_ENABLED`), shared config resolver
> `lib/journey/journeyConfig.ts` (provisioning, `journeys/initialize`, `sync-steps`), IR-2
> candidate-1 = `Child`, CR-2 -> IR-2 journey/config. Test groups A, B, C, D added plus webhook
> purchase / cancellation IR-2 cases. Dev database (the one `.env.local` points at) had 0
> IR-2 / CR-2 journeys, candidates or payments; production not checked.
> `docs/PROJECT_KNOWLEDGE.md` still needs the Stripe / config-resolver note (held back because
> that file has unrelated uncommitted edits).
**Branch**: `hashir`
**Goal**: Ship IR-2 as a full live journey on the same architecture IR-5 uses (chapters-schema JSON
-> `RoadmapLayoutEngine`, multi-candidate, per-journey tier, case strength, vault, reminders,
interview prep), reusing everything IR-5 already built and only adding what is genuinely
child-specific.

---

## Table of Contents

1. [Where IR-2 stands today (audit)](#1-where-ir-2-stands-today-audit)
2. [Core strategy: mirror IR-5 step keys](#2-core-strategy-mirror-ir-5-step-keys)
3. [IR-2 domain rules that differ from IR-5](#3-ir-2-domain-rules-that-differ-from-ir-5)
4. [Decisions (resolved)](#4-decisions-resolved)
5. [Pre-implementation verification](#5-pre-implementation-verification)
6. [Phase 0: Feature flag + routing skeleton](#phase-0-feature-flag--routing-skeleton)
7. [Phase 1: Convert ir-2.json to the chapters schema](#phase-1-convert-ir-2json-to-the-chapters-schema)
8. [Phase 2: Engine + dashboard wiring](#phase-2-engine--dashboard-wiring)
9. [Phase 3: Purchase, provisioning, multi-candidate](#phase-3-purchase-provisioning-multi-candidate)
10. [Phase 4: Document vault + checklist](#phase-4-document-vault--checklist)
11. [Phase 5: Case strength, evidence gap, questionnaire](#phase-5-case-strength-evidence-gap-questionnaire)
12. [Phase 6: Reminders, notifications, tools](#phase-6-reminders-notifications-tools)
13. [Phase 7: Interview prep, marketing, launch](#phase-7-interview-prep-marketing-launch)
14. [Phase 8 (optional): Chapter 4, visa to arrival](#phase-8-optional-chapter-4-visa-to-arrival)
15. [Generalization refactors (remove `ir5` literals)](#generalization-refactors-remove-ir5-literals)
16. [Testing plan](#testing-plan)
17. [File change map](#file-change-map)
18. [Risks and gotchas](#risks-and-gotchas)

---

## 1. Where IR-2 stands today (audit)

### 1.1 The JSON is in the OLD schema

| | `ir-5.json` (live) | `ir-2.json` (today) |
|---|---|---|
| Schema | chapters (`journey_type`, `chapters[]`, `step_key`) | legacy stages (`stages[]`, `id: "I-01"`) |
| Size | 566 KB | 40 KB |
| Structure | 3 chapters, 50 steps | 5 stages, 37 steps |
| Branching | `visible_when` (filingMethod, uscisNoticeType, interviewOutcome, 221g subtype) | `scenarioSpecific: bio/step/adopted` only |
| Rich data | `document_items`, `quest_data`, `tool_data`, `guide_data`, `inline_guide_data`, `household_guide_content`, tutorial steps, citations | plain `actions` / `output` / `info` text |

So `ir-2.json` is a content draft, not a usable journey. The page router would send it to the
legacy `Wizard` fallback (and it is not even in `JOURNEY_DATA_MAP`, so `/visa-category/ir-2`
resolves to `null` today). **The biggest single work item is rewriting this JSON into the IR-5
chapters schema.** The draft's 37 steps of content are still valuable: they become the IR-2
wording inside the IR-5 skeleton (mapping in Phase 1).

### 1.2 What already supports IR-2 (reuse, do not rebuild)

| Area | Already there | File |
|---|---|---|
| Base category | `getBaseVisaCategory("ir2...") -> "IR-2"` | `lib/candidate/candidateSyncService.ts` |
| Multi-candidate | `MULTI_CANDIDATE_VISA_CATEGORIES` includes `IR-2`, `CR-2` | same |
| Candidate defaults | `getDefaultCandidatesForVisa` returns a `Child` candidate for IR-2 | same |
| Relation -> category | `Child -> IR-2` (`getVisaCategoryForRelation`) | same |
| Add Candidate UI | "Child / IR-2 Child" option already listed | `app/components/candidate/AddCandidateModal.tsx` |
| Provisioning | default relation `Child` for IR-2/CR-2 | `lib/candidate/candidateProvisioningService.ts` |
| Vault labels | `ir2`, `ir-2`, `IR-2` journey-name + category mapping | `lib/document-vault/journey-mapping.ts` |
| Vault type | `"IR-2"` in `VisaCategory`, personalization label | `lib/document-vault/types.ts`, `personalization-engine.ts` |
| Checklist PDF | `IR2 -> "IR-2"` | `lib/journey/document-checklist/exportChecklistPDF.ts` |
| Pricing | `"IR-2 / CR-2"` category with `CR2Plans` (not purchasable yet) | `app/(main)/pricing/data/pricing.ts` |
| Interview prep | **full `ir-2-child` category exists** (config, 25 KB question bank, rules, questionnaire) but is NOT registered | `data/interview-categories/ir-2-child/*` |
| Guides | adoption, birth certificate, FRC, step-parent, polio, police, passport, CNIC guides | `data/*-guide-data.json` |
| SEO metadata | `ir-2` entry | `[visa-journey]/layout.tsx`, `app/sitemap.ts` |
| DB | `journey_type` is free TEXT ('IR2' named in the column comment); `UNIQUE(user_id, journey_type)` works with candidate suffixes | `supabase/migrations/20260403_create_journeys_table.sql` |
| Visa eligibility / exploration | IR-2 criteria + under-21 / unmarried rules | `visa-eligibility/criteria-data.ts`, `visa-exploration/visa-engine/data/us.ts` |

**No DB migration is expected.** Everything is keyed on `journey_type` text + `candidate_id`
columns that already exist.

### 1.3 What is hard-wired to IR-5 and will break or mis-route for IR-2

These are the real blockers found in the audit:

| # | Problem | Where |
|---|---|---|
| B1 | `journeyTypeForVisaCategory()` returns only `"IR1" \| "IR5"` (`includes("5")`), so an IR-2 plan is treated as an **IR-1** plan: the live-sub guard would block buying IR-2 for an IR-1 owner, and upgrade cleanup could cancel the wrong plan. | `lib/stripe/subscriptionCleanup.ts:96` (used by checkout + cleanup) |
| B2 | Provisioning seeds `ir-5.json` or else **`ir-1.json`**, so a paid IR-2 journey would be seeded with IR-1 spouse steps. Two places. | `lib/candidate/candidateProvisioningService.ts:120, 232` |
| B3 | `getJourneyHrefByType("IR-2")` returns `""`, so AddCandidateModal (Child), switcher, reminders and My Journeys cannot navigate to IR-2. | `lib/constants/routes.ts` |
| B4 | Dashboard router: no `ir-2` in `JOURNEY_DATA_MAP`, `resolveJourneyData`, `journeyMapping`; env context has no `ir2-journey` slug. | `[visa-journey]/page.tsx`, `app/context/JourneyEnvironmentContext.tsx` |
| B5 | My Journeys progress totals only know `ir1`/`ir5` configs, so IR-2 shows no step count. | `lib/journey/journeyProgressService.ts:33` |
| B6 | `StepView` milestone map uses `isIr5Journey` for the chapter-1 step numbering (USCIS account = `step_1_5`, fee = `step_1_8`, submit = `step_1_9`, approval). IR-2 must take the same branch. Same for `isUscisAccountStep`. | `app/components/journey-engine/StepView.tsx:317, 535` |
| B7 | `EmbeddedToolContainer` / `DashboardView` default to IR-5 / have only an `ir5-journey` label. | `journey-engine/EmbeddedToolContainer.tsx:447`, `DashboardView.tsx:113` |
| B8 | `ConfigLoader.extractCaseDataKeys` / `extractVisaCategoryFromType` only know IR1/IR5. | `lib/journey/config-loader.ts:246, 345` |
| B9 | Pricing page multi-candidate flow is literally IR-5 (`isIr5`, `journeyTiers.ir5`, `ir5Action`, `parentCount`, `catKey = includes("5") ? "ir5" : "ir1"`); `AVAILABLE_VISA_IDS` excludes IR-2. | `app/(main)/pricing/page.tsx` (108 refs) |
| B10 | My Journeys candidate-card mapping is IR-5 only (`isIr5`, `ir5_${cand.id}` customization + tier keys). | `app/(main)/my-journeys/page.tsx` (38 refs) |
| B11 | Vault: `document-definitions.ts` has almost no `"IR-2"` in `applicableVisas` (1 hit vs 14 for IR-5) -> the IR-2 Required tab would be empty (same failure as the documented "IR-1 required docs not showing" gotcha). | `lib/document-vault/document-definitions.ts` |
| B12 | Case strength, questionnaire, evidence gap, reminders all fall back to **IR-1** for unknown types (marriage evidence, spouse risks), which is wrong for a child. | `lib/case-strength/categories/index.ts`, `lib/questionnaire/index.ts`, `lib/reminders/ReminderEngine.ts` |
| B13 | Document checklist engine adds IR-5 petitioner-birth-cert only for IR5. | `lib/journey/document-checklist/engine.ts:336` |
| B14 | Interview prep `JOURNEY_CATEGORY_MAP` throws for unknown types; `getActiveCategories` lists only ir-1 + ir-5. | `lib/interview-prep/journey-category-map.ts`, `category-loader.ts` |
| B15 | Middleware `PRIVATE_PREFIXES` lists `/visa-category/ir5-journey` (noindex) but no ir2 route. | `lib/supabase/middleware.ts:52` |
| B16 | Profile section relevance lists `IR5` but not `IR2`. | `lib/profile/profileSectionRegistry.ts` |
| B17 | Smart form filler catalog `journeys: [...]` arrays and dropdown have `IR5` only. | `app/(tools)/(visa)/visa-forms/page.tsx` |

---

## 2. Core strategy: mirror IR-5 step keys

A lot of shared code is keyed on literal `step_key`s, not on the category:

- `lib/entitlements/hardLockRules.ts` (per-step tier locks, e.g. `step_3_12` executive-only)
- `lib/entitlements/stepFeatureMap.ts` (step -> feature)
- `StepView` milestone metadata (`step_1_5` / `step_1_8` / `step_1_9` / `step_2_10` / `step_3_7` ...)
- `lib/case-strength/step-checkers.ts` + `consistency-intelligence.ts` + `aggregate-issues.ts`
- `lib/notifications/reminderRegistry.ts`, `lib/reminders/ReminderEngine.ts`
- `lib/journey/document-checklist/engine.ts` (`source_steps`)
- `DashboardView`, `ActionStepRenderer`, `TutorialOverlay`, `CaseStatusHero`, `RegisterReceiptStep`

**Decision: `ir-2.json` uses EXACTLY the IR-5 chapter/step keys and step order** (including
IR-5's quirks: no `step_1_14`, `step_1_17` placed last in chapter 1, `step_3_11b`). IR-2 and IR-5
are the same legal process (I-130 by a U.S. citizen -> NVC -> consular interview, no I-130A),
so the steps line up 1:1. Result: every step-keyed map above "just works" for IR-2 by taking the
IR-5 branch, and the work in those files collapses to "treat IR-2 like IR-5" instead of new maps.

Build approach for the JSON: **start from a copy of `ir-5.json`, then rewrite content**
(parent -> child wording, relationship evidence, child-specific steps), pulling the IR-2 facts
from the current draft. Do not hand-build a new JSON from the draft; that would lose
`tool_data`, `guide_data`, `quest_data`, tutorial steps, citations and every UI hook IR-5 has.

To make "treat IR-2 like IR-5" one switch instead of many `|| IR2` checks, introduce a single
helper (Phase 2):

```ts
// lib/journey/journeyLayout.ts (new, tiny)
// Journeys whose chapters-schema JSON follows the IR-5 step numbering
// (no I-130A step). Every step-keyed map uses this instead of `journey_type === "IR5"`.
export const IR5_LAYOUT_JOURNEYS = new Set(["IR-5", "IR-2"]);
export function usesIr5StepLayout(journeyType?: string | null): boolean {
  return IR5_LAYOUT_JOURNEYS.has(getBaseVisaCategory(journeyType));
}
```

---

## 3. IR-2 domain rules that differ from IR-5

Everything financial / NVC / medical / interview / 221(g) is the same as IR-5. The differences
are in WHO the beneficiary is (a minor or young adult) and HOW the relationship is proven.

> **Pending qualified U.S. immigration legal review (D6).** Every point below is a drafting
> assumption, not verified law. Each must be checked against current USCIS / DOS / Islamabad
> embassy sources (and the Pakistan reciprocity schedule) and signed off by the reviewer before
> it is shown as a rule. Citations go into the step `citations` field the same way IR-5 does.

| Topic | IR-2 rule | Where it lands |
|---|---|---|
| Eligibility | Child is unmarried AND under 21; petitioner is a U.S. citizen parent (INA 101(b)(1)) | `step_1_1` quest + eligibility risks |
| Age-out / CSPA | For immediate relatives the child's age is frozen on the I-130 filing date (INA 201(f)(1)). The JSON must explain this, and step_1_1 should capture the child's DOB so we can warn when the child is close to 21 and the I-130 is not yet filed | `step_1_1`, case-strength risk, reminder |
| Marriage kills IR-2 | If the child marries before immigrating, IR-2 is lost (becomes F-3 married son/daughter, long wait) | risk flag + `step_3_8` interview prep note |
| Turning 21 after a petition by a LPR parent | Out of scope (F-2A/F-2B), but the eligibility step should route the user away | `step_1_1` |
| Relationship types | Biological (mother / father married / father unmarried = legitimation or bona fide father-child relationship), Stepchild (marriage before the child turned 18), Adopted (adoption before 16, 2 years legal custody + 2 years joint residence) | `step_1_1` quest `child_relationship_type`, `step_1_2` document_items |
| Adoption / guardianship from Pakistan (D4) | Guardianship (e.g. under the Guardians and Wards Act) must NOT be treated as qualifying. The adopted path is a guarded branch: clear warning that guardianship is not automatically an adoption for IR-2, plus "consult a qualified U.S. immigration attorney" guidance (and the consultation service CTA). No happy path. Orphan / Hague cases (IR-3/IR-4/IH-3/IH-4) are out of scope | `step_1_1` risk (critical), `step_1_2` doc item, case-strength critical flag |
| CR-2 (D1) | Reuses the IR-2 journey, but its legal differences (conditional residence, the marriage-timing rule that decides CR-2 vs IR-2, later removal of conditions) are separate explicit branches. Never assume CR-2 eligibility equals IR-2 eligibility | `step_1_1` captures the stepchild marriage date -> `visaClass` (`IR2` / `CR2`) case_data key; CR-2-only steps and risks use `visible_when: { visaClass: "CR2" }` |
| One petition per child | Each child needs its own I-130. This maps perfectly to "one journey per candidate" | `step_1_4` copy, pricing beneficiary count |
| Pakistani civil docs | NADRA CRC (B-Form), computerized Union Council birth certificate, FRC (Family Registration Certificate), minor passport (needs both parents at NADRA / passport office), custody order if parents divorced | `step_1_2`, `step_2_4`, reuse FRC + birth-certificate guides |
| Police certificate | Required only from age 16 (verify reciprocity schedule) | `step_3_3` gets `visible_when: { childAgeBand: ["16_17", "18_20"] }` |
| Medical | Age-appropriate vaccinations; TB testing rules depend on age (verify) | `step_3_1` / `step_3_4` copy |
| Biometrics / interview | Fingerprints from 14; a parent attends with a minor; DS-260 is completed and signed by a parent for a minor | `step_2_3`, `step_3_8`, `step_3_9` copy |
| Affidavit of Support | I-864 generally required; exception for a child who will acquire citizenship automatically on admission (INA 320). Verify the current way to claim the exemption (I-864W was retired) | `step_2_5` copy + branch |
| After arrival | A child under 18 in the U.S. citizen parent's legal and physical custody acquires citizenship automatically on admission (Child Citizenship Act / INA 320); apply for a U.S. passport or N-600 | Phase 8 chapter 4 |
| Other parent's consent | Where the non-petitioning parent has custody rights, the consulate may ask for consent / custody documents (verify) | `step_1_2` "Required if Applicable" + `step_3_6` |

### Age band (no helper change needed)

`step_1_1` derives one case_data key, `childAgeBand` = `under_14 | 14_15 | 16_17 | 18_20`, from
the child's DOB. Age-dependent steps use the array form of `visible_when`, which
`getActiveStepsForStage` already supports generically (`Array.isArray(value) -> includes`), so
CLAUDE.md's "helper first" rule is satisfied with no helper change. Only if we later need a
computed comparison (e.g. "DOB within 6 months of 21") does the helper (both copies) change first.

---

## 4. Decisions (resolved)

| # | Decision | What it means for the build |
|---|---|---|
| D1 | **CR-2 reuses the IR-2 journey where appropriate, with explicit branching where the law differs.** Do not assume identical eligibility. | One journey (`journey_type` `IR2`, config `ir-2.json`). A `CR-2` category input resolves to the IR-2 journey and config. CR-2-specific rules (conditional residence, the 2-year marriage timing, later removal of conditions) are separate `visible_when` branches and separate case-strength rules, never shared copy that silently claims IR-2 rules apply. |
| D2 | **Keep an `IR2_ENABLED` flag, IR-5 pattern.** | `NEXT_PUBLIC_ENABLE_IR2`, on everywhere except production until launch. Gated on the server too (checkout), not only in the UI. |
| D3 | **Launch the three chapters first; defer Chapter 4** unless a required business dependency is found. | Phase 8 stays optional and post-launch. |
| D4 | **Pakistan guardianship / adoption: clear warning + attorney-consultation guidance. Never treat guardianship as qualifying.** | The adopted path is a guarded branch: eligibility risk = critical, copy says guardianship is not automatically an adoption for IR-2, CTA = consult a qualified U.S. immigration attorney (and the consultation service). No happy path for guardianship. |
| D5 | **Reuse the existing journey pricing structure provisionally, subject to product approval.** | Same tiers / prices / Stripe price ids as IR-1 and IR-5. Launch gate: product sign-off recorded before Phase 7 flips pricing on. |
| D6 | **Legal content is pending qualified U.S. immigration legal review.** No unverified legal claims are published. | Every legal statement carries a citation and a review marker (see "Legal review marker" below). Production launch is blocked until review is complete. |

### Legal review marker (D6)

- `ir-2.json` gets a top-level `content_review` object:
  `{ "status": "pending_legal_review", "reviewer": null, "reviewed_at": null, "notes": "..." }`.
  Individual steps with legal claims may carry `"legal_review": "pending"`.
- While `status !== "approved"`, the IR-2 dashboard shows a visible notice: "This journey's
  guidance is being reviewed by a U.S. immigration attorney and may change." (plain ASCII copy).
  The engine renders it only when `content_review` exists, so IR-1 / IR-5 are unaffected.
- **Launch gate (Phase 7):** a test fails if `IR2_ENABLED` can be forced on for production while
  `content_review.status !== "approved"`, and the launch checklist requires the reviewer's name
  and date in the JSON.
- Claims listed in section 3 are working assumptions for drafting only. Where a claim is not yet
  confirmed, the copy says what to check and links the official source instead of stating a rule.

---

## 5. Pre-implementation verification

Done by reading the code paths end to end (2026-10-30). Regression tests were drafted and are
kept out of the repo until implementation starts (copy in the session scratchpad:
`ir2-drafted-tests/stripe-tests.patch` and `ir2-drafted-tests/candidate-provisioning.test.ts`).
They are specified in 5.4 so they can be rewritten from this doc alone.

### 5.1 Stripe category mapping (B1): CONFIRMED

- `journeyTypeForVisaCategory()` (`lib/stripe/subscriptionCleanup.ts:96`) returns
  `includes("5") ? "IR5" : "IR1"`. `"IR-2 / CR-2"` (the pricing id) and `"CR-2"` contain no "5",
  so **an IR-2 plan is classified as an IR-1 plan**.
- It has three consumers, and all three are wrong for IR-2:
  1. Checkout `selectedJourneyType` (`app/api/stripe/checkout/route.ts:168`). When no
     `candidateId` is sent, `targetCandidateJourneyKey` falls back to `selectedJourneyType`, so
     the tier guard reads the **`IR1` journey row** for an IR-2 purchase.
  2. Checkout `journeyLiveSubs` filter (`route.ts:305-313`): IR-1 subscriptions count as the
     IR-2 plan. An IR-1 Executive owner trying an IR-2 Basic -> Premium upgrade is rejected as a
     downgrade. The `oldSubscriptionId` hint can point at the **IR-1** sub.
  3. `cancelSupersededSubscriptions` (`subscriptionCleanup.ts:138-148`): after an IR-2 upgrade,
     a live IR-1 plan tagged `visa_category: "IR-1 / CR-1"` matches "same journey" and **gets
     cancelled**. The reverse also holds: an IR-1 upgrade cancels a live IR-2 plan. Both
     `verify-session` and the webhook call this cleanup.
- **Live today, not only after launch:** checkout does not restrict `visaCategory` on the
  server (only the pricing UI's `AVAILABLE_VISA_IDS` does), so a crafted request for
  `"IR-2 / CR-2"` can already create an IR-2 subscription.
- Fix (first commit of implementation): derive the journey from `getBaseVisaCategory` with
  `IR-1 | CR-1 -> IR1`, `IR-2 | CR-2 -> IR2`, `IR-5 -> IR5`, and keep the legacy `IR1` default
  for categories not sold as journeys (F-2A, K-1) so nothing else changes. Add a server-side
  gate in checkout: an IR-2 / CR-2 plan purchase returns 400 `CATEGORY_NOT_AVAILABLE` while
  `IR2_ENABLED` is false (IR-1 / IR-5 unaffected).

### 5.2 Journey provisioning (B2): CONFIRMED, three seeding paths

| Path | File | Behavior for IR-2 today |
|---|---|---|
| Post-payment primary journey | `lib/candidate/candidateProvisioningService.ts:120` | `isIr5 ? ir-5.json : ir-1.json` -> **IR-2 row (`journey_type` `IR2`) seeded with IR-1 spouse chapters/steps** |
| Post-payment extra children | same file `:232` | same ternary -> `ir2_candidate2` rows seeded from **ir-1.json** |
| Empty roster candidate-1 | same file `:214` | `relation: isIr5 ? "Other" : "Spouse"` -> **IR-2 child saved as "Spouse"**, colorTag `emerald` |
| Lazy create on first open | `app/api/journeys/initialize/route.ts:30` | `data/visa-category/<base>.json` -> `ir-2.json`, which is still the old `stages` schema (no `chapters`), so seeding / sync fails |
| Manual re-sync | `app/api/journeys/[id]/sync-steps/route.ts:18` | same resolver as initialize |
| CR-2 input | initialize + sync-steps | resolves to `cr-2.json`, **which does not exist** |

Why this matters more than a wrong label: `syncStepsBackground` only INSERTS missing steps and
never deletes, so a journey row seeded with IR-1 steps stays polluted forever; the IR-2 steps
would be added next to the spouse steps. Fixing provisioning must land **before** IR-2 can be
bought anywhere (see the live checkout gap in 5.1).

Fix: one resolver, `lib/journey/journeyConfig.ts`:
`journeyConfigKeyFor(journeyTypeOrVisa)` (`IR-1 | CR-1 -> ir-1`, `IR-2 | CR-2 -> ir-2`,
`IR-5 -> ir-5`, anything else keeps today's `base.toLowerCase()`), and
`journeyConfigPathFor()`. Used by the provisioner (both sites), `initialize` and `sync-steps`.
The provisioner keeps `ir-1.json` as the default for categories outside IR-1/IR-2/IR-5 so
non-journey categories behave exactly as before. A `CR-2` input is provisioned as the IR-2
journey (`journey_type` `IR2`, candidate keys `ir2_candidate-N`) per D1. Candidate-1 default
relation: IR-5 `Other` / purple (unchanged), IR-2 `Child` / blue (matches
`getDefaultCandidatesForVisa`), everything else `Spouse` / emerald (unchanged).

### 5.3 IR-1 fallback inventory

Every resolver that can hand an IR-2 journey spouse (IR-1) content or rules. "Safe" means IR-2
gets nothing (null / skip), not IR-1.

| # | Resolver | IR-2 today | Status | Closed in |
|---|---|---|---|---|
| F1 | `journeyTypeForVisaCategory` (Stripe) | IR1 | **UNSAFE** | Implementation step 0a |
| F2 | Provisioner config + candidate-1 relation | ir-1.json, Spouse | **UNSAFE** | Step 0a |
| F3 | `initialize` / `sync-steps` config (incl. CR-2) | old-schema ir-2.json / missing cr-2.json | **BROKEN** (not IR-1, but fails) | Step 0a + Phase 0 JSON |
| F4 | `resolveCaseStrengthProfile` (`lib/case-strength/categories/index.ts`) | `IR1_PROFILE` | **UNSAFE**: spouse risks, marriage evidence, IR-1 step checkers | Phase 5 |
| F5 | Everything fed by F4: `EligibilityRiskBanner`, alert gating (`buildAlertGateContext`), `EvidenceGapEngine` (default ctor = `IR1_EVIDENCE_REQUIREMENTS`), `ReminderEngine` (uses the profile) | IR-1 rules | **UNSAFE** | Phase 5 |
| F6 | `StepView` milestone map / `isUscisAccountStep` (`isIr5Journey`) | IR-1 step numbering (`step_1_6` = USCIS account, etc.) | **UNSAFE** (wrong milestones) | Phase 2 (`usesIr5StepLayout`) |
| F7 | `/interview-prep` page `|| "ir-1-spouse"` (lines 516, 620) | ir-1-spouse when the IR-2 slug does not resolve | **UNSAFE** | Phase 7 |
| F8 | `getQuestionnaireConfig` | `null` | Safe (no questionnaire until Phase 5) | Phase 5 adds IR-2 |
| F9 | `ReminderEngine.STEP2_DOC_CONFIGS` | no config -> skip | Safe | Phase 6 adds IR-2 |
| F10 | `resolveCategorySlug` (interview) | `null` | Safe (but see F7) | Phase 7 |
| F11 | `DocumentChecklistEngine.getDocumentDefinitions` | generic docs only; IR-1 nikah / MRC block is `IR1`-only | Safe | Phase 4 adds IR-2 docs |
| F12 | Vault `generateRequiredDocuments` | `applicableVisas` excludes IR-1-only docs; Required tab near empty | Safe but empty (B11) | Phase 4 |
| F13 | `getJourneyHrefByType` | `""` (no navigation) | Safe but dead end (B3) | Phase 0 |
| F14 | Page router `resolveJourneyData` | `null` | Safe but dead end (B4) | Phase 0 |
| F15 | `journeyProgressService` config map | `null` (no counts) | Safe but incomplete (B5) | Phase 2 |
| F16 | Webhook / verify-session `visa_category || "ir1"` | only when metadata is missing | Acceptable (IR-2 sessions always carry metadata) | n/a, covered by a test |
| F17 | `stepFeatureMap.ts` uses IR-1 numbering for every category | same mismatch IR-5 already has | Existing behavior, not IR-2-specific | Note only; revisit with Phase 8 |

**Rule for every phase:** no new code path may default an unknown or IR-2 category to IR-1.
Unknown means "nothing" (null / skip / no navigation), never "spouse".

**Launch gate:** IR-2 cannot be enabled on production while F4-F7 are open. The fallback suite
(5.4 group E) turns each `it.todo` into a passing test as its phase closes it.

### 5.4 Regression test definitions

Run red against today's code first (to prove the risk), then green after the fix.

**A. Stripe mapping, unit** (`__tests__/stripe/subscriptionCleanup.test.ts`)
1. `"IR-2 / CR-2"`, `"IR-2"`, `"ir2"`, `"CR-2"`, `"ir2_candidate-2"` -> `IR2`.
2. IR-1 / CR-1 / IR-5 / `ir5_candidate-2` mappings unchanged.
3. `"F-2A"`, `"K-1 / K-2"` keep the legacy `IR1` default.
4. IR-2 upgrade cancels only the old IR-2 plan; live IR-1 and IR-5 plans survive.
5. First IR-2 purchase (no upgrade hint) cancels nothing, IR-1 plan survives.
6. IR-1 upgrade never cancels an IR-2 plan.
7. IR-2 primary upgrade keeps other children's add-candidate plans.

**B. Stripe checkout, route** (`__tests__/stripe/checkout.test.ts`; add a spy on the
journey-row `ilike` lookup)
1. IR-2 purchase without `candidateId` reads `journey_type` `IR2`, never `IR1`.
2. With `candidateId: "candidate-2"` it reads `ir2_candidate2`.
3. IR-2 Basic -> Premium `action: "upgrade"` is allowed while an IR-1 Executive plan is live.
4. A live IR-2 Premium plan does not block buying IR-1 Basic.
5. Same-tier duplicate inside IR-2 is still rejected.
6. With `NEXT_PUBLIC_ENABLE_IR2=false` (via `jest.isolateModules`): IR-2 plan purchase returns
   400 `CATEGORY_NOT_AVAILABLE`; an IR-1 purchase in the same module still returns 200.
7. Existing IR-1 / IR-5 suites pass unchanged.

**C. Provisioning** (new `__tests__/candidate/candidate-provisioning.test.ts`; mock
`journeyService.createJourneyFromConfig` and `DocumentDatabaseStorage`, chainable Supabase fake
keyed by `journey_type`)
1. First IR-2 purchase seeds `data/visa-category/ir-2.json` with `journey_type` `IR2`.
2. Empty roster -> candidate-1 `{ relation: "Child", visaCategory: "IR-2" }`.
3. IR-2 add-candidate with a paid primary seeds `ir2_candidate2` from `ir-2.json`, roster gets a
   `Child` candidate-2 with the purchased tier.
4. `"CR-2"` input seeds `ir-2.json` with `journey_type` `IR2`.
5. Regression: IR-1 -> `ir-1.json` / `IR1` / Spouse / emerald.
6. Regression: IR-5 -> `ir-5.json` / `IR5` / Other / purple; IR-5 add-candidate -> `ir5_candidate2`.
7. Regression: an existing primary journey is re-tiered, never re-seeded.

**D. Config resolver** (new `__tests__/journey/journeyConfig.test.ts`)
1. `IR2`, `ir2_candidate-2`, `"IR-2 / CR-2"`, `CR-2` -> `ir-2`.
2. `IR1`, `CR-1` -> `ir-1`; `IR5`, `ir5_candidate-2` -> `ir-5`.
3. `ConfigLoader.loadJourneyJSON("data/visa-category/ir-2.json")` has `chapters` (after Phase 0).

**E. No IR-1 fallback suite** (new `__tests__/ir2/no-ir1-fallback.test.ts`), one test per row
of 5.3. Rows already safe are real assertions from day one (F8-F14). Open rows start as
`it.todo` with the phase that closes them in the name. Examples:
- `getQuestionnaireConfig("IR2")` is not the IR-1 config.
- `resolveCategorySlug` for `IR2`, `ir2-journey`, `ir2_candidate-2` is never `ir-1-spouse`.
- `DocumentChecklistEngine` definitions for `IR2` contain no `nikah-nama` / `marriage-cert`.
- `generateRequiredDocuments({ visaCategory: "IR-2" })` returns no spouse-only document.
- `getJourneyHrefByType("IR-2")` is the IR-2 route, never `/visa-category/ir1-journey`.
- (Phase 5) `resolveCaseStrengthProfile("IR2")` is not `IR1_PROFILE`; IR-2 eligibility risks never
  produce a marriage / spouse flag.
- (Phase 2) `usesIr5StepLayout("IR2")` is true.
- (Phase 7) interview prep for an IR-2 journey resolves `ir-2-child`.

**F. Launch gate** (Phase 7): `ir-2.json` `content_review.status === "approved"` is required
before production enablement; every 5.3 row is closed.

### 5.5 Per-phase report format

After every phase: files changed, tests run (command + pass/fail counts, including the full
`__tests__/stripe` and `__tests__/candidate` suites as IR-1 / IR-5 regression),
`tsc --noEmit` result, what was render-checked (and what could not be, e.g. when the :3000 dev
server is not running; a second dev server is never started in the repo), open blockers, and
any legal claim added (each must be marked pending review).

---

## Phase 0: Feature flag + routing skeleton

Goal: close the money / data risks from section 5 first, then make
`/visa-category/ir2-journey` open the engine dashboard behind the flag.

**Step 0a (first commit, before anything user-visible):**
- `journeyTypeForVisaCategory` fix + checkout `CATEGORY_NOT_AVAILABLE` gate (5.1).
- `lib/journey/journeyConfig.ts` resolver; use it in the provisioner (both sites), `initialize`
  and `sync-steps`; IR-2 candidate-1 default `Child` (5.2).
- `IR2_ENABLED` flag (needed by the gate).
- Test groups A, B, C, D (red first, then green) + the safe rows of group E.

**Step 0b (routing):**

1. `lib/feature-flags.ts`: add `IR2_ENABLED` (env `NEXT_PUBLIC_ENABLE_IR2`), same doc comment
   pattern as IR-5.
2. `lib/constants/routes.ts`: `ROUTES.IR2_JOURNEY = "/visa-category/ir2-journey"`,
   `ir2journeyHref`, and `getJourneyHrefByType`: `if (base === "IR-2" || base === "CR-2") return
   ROUTES.IR2_JOURNEY` (fixes B3; AddCandidateModal/switcher/reminders navigate correctly).
3. `[visa-journey]/page.tsx`: import `ir2Data`, add `"ir-2"` to `JOURNEY_DATA_MAP`,
   `resolveJourneyData` (`ir2` / `cr2` prefixes), `journeyMapping["ir2-journey"] = "ir-2"`, and
   the same flag redirect block IR-5 has (`isIr2Route && !IR2_ENABLED` -> ir1-journey).
   Renders through `RoadmapLayoutEngine` automatically once the JSON has `chapters[]`.
4. `JourneyEnvironmentContext.tsx`: `SLUG_TO_DATA_KEY` gets `"ir2-journey"` and `"ir-2"` (keep the
   two slug maps in sync, as PROJECT_KNOWLEDGE 4.1 requires).
5. `lib/supabase/middleware.ts`: add `/visa-category/ir2-journey` to `PRIVATE_PREFIXES` (B15).
6. `AddCandidateModal`: hide the `Child` relation while `!IR2_ENABLED` (today it is shown in
   production and creates a candidate with no route).
7. `data/visa-category/ir-2.json`: a chapters-schema **skeleton**, not a blind copy of IR-5
   (a blind copy would show IR-5 parent legal claims, e.g. parent-petition eligibility, under
   the IR-2 name, which breaks D6). Built by a one-off script from the IR-5 structure:
   - **Reused as-is** (no parent-specific wording, pure USCIS / NVC mechanics): `step_1_3`,
     `step_1_5` .. `step_1_9`, `step_1_11` .. `step_1_13`, `step_1_15`, `step_1_16`,
     `step_1_18`, `step_1_20` .. `step_1_22`, `step_1_24`, `step_2_1`, `step_2_2`, `step_3_7`,
     plus `uscis_tutorial_steps`, `household_tutorial_steps`, `submission_tutorial_steps`.
   - **Only the `who` label changes** (child beneficiary / parent or guardian for a minor):
     `step_2_3`, `step_2_10`, `step_3_1` .. `step_3_3`, `step_3_5`, `step_3_10` .. `step_3_13`.
   - **Parent-specific content removed, structure kept, filled in Phase 1** (keys, `step_type`,
     `visible_when`, `dependencies`, `display_order` stay; text comes from the IR-2 draft where it
     maps): `step_1_1` (quest, risk signals), `step_1_2` (document items), `step_1_4`,
     `step_1_10`, `step_1_17`, `step_1_19`, `step_1_23`, `step_1_25`, `step_2_4` .. `step_2_9`,
     `step_2_11`, `step_2_12`, `step_3_4`, `step_3_6`, `step_3_8`, `step_3_9`,
     `inline_guide_data`, `household_guide_content`, `documents`.
   - Top-level `content_review: { status: "pending_legal_review" }` (D6) and the dashboard
     notice.
   - Before removing `tool_data` from a step, check `StepView` / `ActionStepRenderer` for
     unguarded reads (one found: `currentStep.tool_data.disclaimer` at `StepView.tsx:4247`,
     guarded by the `&&` on the line before, so safe).
   - The old draft is kept as `docs/ir2-content-draft.json` during Phase 1, deleted at the end.

Exit check: test groups A-D green; group E safe rows green; `ir2-journey` renders all 3 chapters
with the review notice, filing-method and notice branches toggle, no console errors;
`tsc --noEmit` clean; full IR-1 and IR-5 Stripe / candidate suites unchanged.

---

## Phase 1: Convert ir-2.json to the chapters schema

The heaviest phase (content). Work chapter by chapter; each chapter is its own commit.

### 1.1 Top-level fields

`journey_type: "IR2"`, `journey_name: "IR-2 Child Visa Journey"`, `journey_description`,
`total_estimated_months` (verify; IR-2 is an immediate relative, similar to IR-5),
`documents[]` (from the draft's 19 + IR-5 financial ones), `uscis_tutorial_steps` /
`household_tutorial_steps` / `submission_tutorial_steps` (reuse IR-5 as-is; wording swap only),
`inline_guide_data` and `household_guide_content` (rewrite the parent-specific entries, see 1.3).

### 1.2 Step mapping (draft id -> IR-5 key)

| Key | IR-5 step | IR-2 content source (draft) | What changes |
|---|---|---|---|
| step_1_1 | Determine Eligibility | I-01, I-02 | Quest: petitioner citizenship, child DOB -> `childAgeBand`, marital status, `child_relationship_type` (bio_mother / bio_father_married / bio_father_unmarried / stepchild / adopted), stepchild marriage date, CR-2 hint. Route F-2A/F-3 cases away. |
| step_1_2 | Gather Required Documents | I-03(a/b/c), I-04 | New `document_items`: child birth cert (Union Council + NADRA CRC), parents' nikah nama, legitimation / bona fide father evidence, stepparent marriage (before 18) + prior marriage terminations, adoption decree + custody/residence, custody order / other-parent consent, name change, translations, secondary evidence. |
| step_1_3 | Review Filing Methods | - | Reuse, wording only. |
| step_1_4 | Fill Form I-130 | I-05 | "One I-130 per child"; Part 1 relationship = child; Smart Form Filler relation default `Child` (already in MultiStepForm). |
| step_1_5 .. step_1_9 | Online filing | I-06, I-07 | Reuse IR-5 tutorial + tool_data; wording. |
| step_1_10 .. step_1_13 | Paper filing | I-06, I-07 | Reuse; check fee amount and lockbox copy. |
| step_1_15, step_1_16 | Receipt + tracking | I-08 | Reuse as-is. |
| step_1_18 .. step_1_25 | Notice branches | I-09 | Reuse; RFE examples become child-specific (DNA test request is common for biological-father cases). |
| step_1_17 | Approval | I-10 | Reuse. |
| step_2_1, step_2_2 | CEAC + NVC fees | II-01, II-02, II-03 | Reuse. |
| step_2_3 | DS-260 | II-04 | Parent completes and signs for a minor; child's own answers if 18+. |
| step_2_4 | Civil documents | II-05 | Child passport, birth cert, CRC/FRC, PCC only if 16+, photos; reuse IR-5 doc UI. |
| step_2_5 .. step_2_7 | I-864, financial, household | II-06 | Reuse; add INA 320 exemption note. |
| step_2_8 .. step_2_12 | Submit, review, DQ, scheduling, appointment | II-07, III-01 | Reuse. |
| step_3_1, step_3_4 | Medical | III-02, III-03, III-04 | Age-based vaccination + TB copy. |
| step_3_2 | Polio | - | Reuse (applies to children too). |
| step_3_3 | Police certificate | - | `visible_when: { "childAgeBand": ["16_17", "18_20"] }`. |
| step_3_5 .. step_3_7 | Courier, originals, readiness | III-05 | Add custody / consent originals. |
| step_3_8 .. step_3_10 | Interview prep, attend, outcome | III-06 | Parent attends with a minor; link interview prep `ir-2-child`. |
| step_3_11, 3_11b, 3_12, 3_13 | Issuance + 221(g) | IV-01, IV-02, III-07 | Reuse. |
| (chapter_4) | - | IV-03, IV-04, V-01 .. V-07 | Phase 8. |

### 1.3 Fields to rewrite, not copy

- `who`: "Parent beneficiary" -> "Child beneficiary" (and "Petitioner (U.S. citizen parent)").
- `inline_guide_data`: drop parent-only entries (`doc_parent_identity_match`,
  `doc_parent_marriage_history`, `doc_stepparent_prior_marriages` wording), add
  `doc_child_birth_cert`, `doc_child_crc`, `doc_legitimation`, `doc_custody_consent`; keep the
  generic ones (`doc_citizenship`, `doc_translations`, `doc_passport_photos`, `doc_name_change`,
  `doc_secondary_relationship`, `doc_record_unavailability`, adoption ones).
- `household_guide_content`: reuse.
- `risk_signals` / `quest_data` on step_1_1: new (age-out, marriage, adoption, stepchild date).
- Keep `document_items[].id` stable once chosen: the vault map, evidence-gap map, reminders and
  questionnaire all reference them.

### 1.4 Copy rules

Plain ASCII only (no em/en dash, curly quotes, ellipsis char), Urdu fields (`*_ur`) where IR-5 has
them, citations on every legal claim.

Exit check: a script that diffs the step-key list of `ir-2.json` against `ir-5.json` (must be
identical for chapters 1-3), JSON validity, and a manual walk of every `visible_when` branch.

---

## Phase 2: Engine + dashboard wiring

1. New `lib/journey/journeyLayout.ts` with `usesIr5StepLayout()` (section 2).
2. `StepView.tsx`: `isIr5Journey` -> `usesIr5StepLayout(data.journey_type)` for the milestone map
   and `isUscisAccountStep` (B6). Audit the other 5 "parent" strings in StepView and make them
   read from the JSON / a category label instead of literal "parent".
3. `DashboardView.tsx`: `visaCategoryNames["ir2-journey"] = "IR-2 Child"`; check its 13
   hardcoded step keys still make sense for a child.
4. `EmbeddedToolContainer.tsx`: the `IR5` default only applies when `journey_type` is missing;
   IR-2 JSON always has it, so just confirm `IR2 -> "IR-2"` / `ir2-journey` (B7).
5. `HouseholdBuilder` / `HouseholdMemberTool` (7 + 4 "parent" mentions): make labels
   category-aware (beneficiary label from the JSON or `getBeneficiaryLabel(category)`).
6. `config-loader.ts`: IR2 in `extractCaseDataKeys` (shared keys + `child_relationship_type`,
   `childAgeBand`, `child_date_of_birth`, `child_marital_status`) and `extractVisaCategoryFromType`
   (B8).
7. `journeyProgressService.ts`: `ir2: { config: ir2Config, getActiveSteps: getAllActiveStepsEngine }`
   (B5).
8. `useWizard` / `journeys/initialize`: no code change expected (generic); verify that
   `initialize` seeds `IR2` from `data/visa-category/ir-2.json` via the same path it uses for IR5,
   and that `syncStepsBackground` inserts the IR-2 steps.
9. Bidirectional sync: add the new child keys to `syncCaseDataToProfile()` /
   `syncProfileToCaseData()` mapping into the active `CandidateProfile` (child DOB, marital
   status), so the form filler and vault see them (CLAUDE.md "state sync is bidirectional").
10. `lib/profile/profileSectionRegistry.ts`: add `IR2` to the relevant sections (B16).

Exit check: create an IR-2 journey locally (dev tier toggle), complete steps across all three
chapters, refresh, progress persists; My Journeys shows correct counts.

---

## Phase 3: Purchase, provisioning, multi-candidate

1. B1 and B2 are already fixed in Phase 0 step 0a (section 5). This phase builds on them.
2. Checkout `isMultiCandidateCategory(...) || selectedJourneyType === "IR5"`: already true for
   IR-2 via `isMultiCandidateCategory`; drop the redundant IR5 literal after the refactor.
3. CR-2 (D1): checkout and provisioning treat a CR-2 purchase as the IR-2 journey; the
   CR-2-specific legal differences live in JSON branches + case-strength rules, never in billing.
4. Webhook + verify-session: no IR-5 literals; they call the provisioner, so they inherit the fix.
   Add a webhook test: IR-2 add-candidate purchase provisions `ir2_candidate-2` with its own tier.
5. `PlanContext`: `journeyTiers` is keyed by `getBaseVisaCategory`, so `IR-2` resolves by itself;
   add an IR-2 case to `__tests__/candidate/candidate-entitlements.test.ts` (IR-5 premium + IR-2
   unpurchased -> locked).
6. **Pricing page (B9)**: generalize the IR-5 multi-candidate block to "any multi-candidate
   category" (see Generalization refactors). Add `"IR-2 / CR-2"` to `AVAILABLE_VISA_IDS` behind
   `IR2_ENABLED`. Beneficiary step copy: "How many children?" vs "How many parents?" from a label
   map. Upgrade vs Add candidate works the same.
7. **My Journeys (B10)**: generalize `isIr5` / `ir5_${id}` to `${baseKey}_${id}` for any
   multi-candidate category; add the `ir2` journey card meta (name, route, image, code) and the
   sort order entry. `CandidateProfileLauncherModal` filters by visa category already; verify
   "Add" deep-links `/pricing?visa=IR-2 / CR-2&action=add_candidate`.
8. `AddCandidateModal` Child option: navigates via `getJourneyHrefByType("IR-2")` (fixed in
   Phase 0); hide it when `!IR2_ENABLED`.
9. `app/api/candidate/create/route.ts`: confirm it lazily inserts `ir2_candidate-N` rows (comment
   says non-IR-1 categories allow multiple rows; test it).
10. Portal wallet `Walletswitcher` already lists IR-2; verify candidate scoping.

Exit check: Stripe test mode: buy IR-2 Premium for 2 children on an account that already owns
IR-1, both IR-2 journeys provisioned with IR-2 steps, IR-1 plan untouched, switcher shows 3
journeys, cancel the IR-2 sub -> only IR-2 rows drop to free.

---

## Phase 4: Document vault + checklist

1. `document-definitions.ts` (B11): add `"IR-2"` to `applicableVisas` of every doc that applies
   (petitioner citizenship, financial / I-864 set, beneficiary passport, birth cert, PCC, medical,
   photos, translations, name change, court records ...) and add the child-only definitions
   (child birth certificate, NADRA CRC / B-Form, FRC, legitimation evidence, custody order /
   other-parent consent, stepparent marriage, adoption decree + custody/residence). Mark
   petitioner docs shareable (they already are by the candidate-sharing rule) so one petitioner
   upload serves every child journey and the IR-1 / IR-5 journeys.
2. `personalization-engine.ts`: an `ir2Map` of display names next to `ir5Map`, plus conditional
   docs by `child_relationship_type` and age band (PCC hidden under 16).
3. `flag-registry.ts`: uncomment / fill the IR-2 entry.
4. Vault page / `useInitDocumentVault`: confirm `journeyTypeToVisaCategory("ir2...") === "IR-2"`
   (exact canonical string, see the vault gotcha in PROJECT_KNOWLEDGE 27).
5. `ConfigurationWizard` / `LiveConfigPanel` already list IR-2; verify the wizard questions make
   sense for a child (sponsor structure etc.).
6. `document-checklist/engine.ts` (B13): IR-2 block (child birth cert, CRC, custody docs; PCC only
   16+), using `usesIr5StepLayout` for `source_steps`.
7. OCR: child birth certificate uses the existing `birth` parser; `registry.ts` target for the
   child = beneficiary (already the default). No new parser.

Exit check: fresh IR-2 journey -> vault Required tab is non-empty and child-specific; a
petitioner passport uploaded on IR-1 is offered for sharing to IR-2; a child's passport is not.

---

## Phase 5: Case strength, evidence gap, questionnaire

Follow the IR-5 Strategy pattern exactly (`lib/case-strength/categories/ir5.ts` is the template).

1. `lib/case-strength/categories/ir2.ts`:
   - `IR2_STEP_CHECKERS` = `COMMON_STEP_CHECKERS` + overrides only where the relationship shows
     up (same five keys IR-5 overrides: `step_1_4`, `step_1_9`, `step_1_10`, `step_2_3`, `step_3_7`,
     plus `step_1_11..13` remaps exactly like IR-5).
   - `IR2_BASELINE_FIELDS`: petitioner DOB, child DOB, child marital status (I-130 vs DS-260).
   - `detectIr2EligibilityRisks`: age-out risk (DOB near 21 and I-130 not filed: critical), child
     married (critical, F-3), stepchild marriage after the 18th birthday (critical), adoption
     after 16 / under 2 years custody or residence (critical), Pakistani guardianship presented as
     adoption (critical), biological father + unmarried parents without legitimation evidence
     (warning), CR-2 timing note (advisory).
   - Relationship signal: no-op like IR-5 (no marriage scoring, big age gap is normal).
   - `caseScore: { model: "weighted" }`, `DEFAULT_DOCUMENT_ESCALATION`, `COMMON_LOOK_AHEAD`.
   - Register in `categories/index.ts` (`CASE_STRENGTH_PROFILES`) so IR-2 stops falling back to
     IR-1 (B12). `consistency-intelligence.ts` category normalizer: add the IR-2 rule.
2. Evidence gap (`lib/journey/evidence-gap/engine.ts`): `IR2_EVIDENCE_REQUIREMENTS` = `IDENTITY`
   + `FAMILY_INTEGRATION` (reuse IR-5's choice: financial / immigration history are NVC-stage),
   and add the new `document_items` ids to the doc -> category map.
3. Document questionnaire: `lib/questionnaire/ir2-questionnaire.ts` modeled on
   `ir5-questionnaire.ts` (Q1 relationship type -> conditional docs; age band; custody), register
   `"ir-2"` in `lib/questionnaire/index.ts`.
4. `EligibilityRiskBanner` / `CaseHealthOverview`: pick up IR-2 through the profile; check for any
   IR-5 literal.

Exit check: new `__tests__/case-strength/categories.test.ts` IR-2 block (resolve profile, each
risk fires, no spouse risk ever fires on IR-2), `__tests__/questionnaire/ir2-doc-questionnaire.test.ts`
mirroring the IR-5 one, fresh-journey gate still shows "Building Your Case" (not a fake score).

---

## Phase 6: Reminders, notifications, tools

1. `ReminderEngine.ts`: `"ir-2"` doc config (citizenship, child birth cert, child passport,
   relationship evidence, custody docs) instead of falling back to IR-1 nikah nama (B12).
2. `UnifiedReminderEngine` / `reminderRegistry.ts`: step-keyed rules already match IR-5 numbering;
   add an IR-2 age-out reminder (child turning 21 soon and I-130 not submitted).
3. CEAC tracking, receipt registration, USCIS case status: generic; verify candidate tagging.
4. Toolbox (`journey-app-groups.ts`): same Tools / Guides / Services; add adoption, FRC, birth
   certificate and step-parent guides to the IR-2 Guides group where relevant. Sponsorship
   calculator, 221g planner, DQ recording, photo booth unchanged. `DqRecordingTool` (both copies)
   and `221g CombinedIntakeForm`: add IR-2 to their category dropdowns (the 221g one has IR-2
   commented out).
5. Services (medical, PCC, consultation, translation): generic + journey-tagged; verify
   `services-status?scope=journey` with `journey_slug = ir2-journey`. PCC tool should respect the
   16+ rule in its copy.
6. Smart form filler (B17): add `IR2` to the `journeys` arrays of I-130, I-864 (+A/EZ), DS-260,
   G-1450 ... and to the category dropdown behind `IR2_ENABLED`; `lib/formConfig/candidateScope.ts`
   check; MultiStepForm already defaults relation to `Child` for IR-2.

---

## Phase 7: Interview prep, marketing, launch

1. Interview prep: register `ir-2-child` in `data/interview-categories/index.ts`,
   `category-loader.getActiveCategories` (behind `IR2_ENABLED`), `JOURNEY_CATEGORY_MAP`
   (`IR2: "ir-2-child"`) and the fuzzy matcher. Review the existing question bank (25 KB vs IR-5's
   105 KB): bring it to IR-5 parity (variations, minor-specific questions answered by the parent,
   `hasMockInterview`). Fix its config description ("children of US citizens and permanent
   residents" is wrong for IR-2).
2. Explore / marketing: `visa-category/data/journeys.ts` add `"ir-2"` to `JOURNEY_SLUGS` + detail
   content + hero image; `ExploreJourneys` IR-2 card links to the journey (flag-gated like IR-5);
   navigation menu, footer, sitemap already have IR-2 entries, re-point them.
3. Pricing launch: flip IR-2 into `AVAILABLE_VISA_IDS` (only after D5 product approval is
   recorded).
4. Visa eligibility / Path Finder: result for IR-2 links to `ir2-journey`.
5. Launch gate, all required: legal review approved (`content_review.status === "approved"`,
   reviewer + date filled), D5 pricing approved, every 5.3 fallback row closed (group E has no
   `it.todo` left), test group F green, full IR-1 / IR-5 regression walk done.
6. Launch: set `NEXT_PUBLIC_ENABLE_IR2=true` on production.
6. Update `docs/PROJECT_KNOWLEDGE.md` (category list, `JOURNEY_DATA_MAP`, case-strength registry,
   flags, Stripe journey typing) in the same change, per CLAUDE.md.

---

## Phase 8 (optional): Chapter 4, visa to arrival

Draft stages IV and V have real IR-2 value (USCIS immigrant fee, travel with a minor, CBP, I-94,
green card vs automatic citizenship under INA 320, SSN, school enrollment, U.S. passport / N-600).

Before adding `chapter_4`:
- check `RoadmapLayoutEngine`, `DashboardView`, `ProgressTree`, case-strength frontier logic and
  `journey-lock.ts` with 4 chapters;
- `hardLockRules.ts` has no `step_4_*` entries, so chapter 4 is locked only for free; decide
  tiers there (the only file allowed to hold that rule);
- `stepFeatureMap.ts` entries for `step_4_*`.

This could later be back-ported to IR-5 / IR-1, so build it generically.

---

## Generalization refactors (remove `ir5` literals)

IR-2 is the second multi-candidate category, so this is the moment to stop branching on IR-5.
Do these as part of the phase that touches each file, not as a big-bang refactor:

| Literal today | Replace with |
|---|---|
| `journey_type === "IR5"` for step numbering | `usesIr5StepLayout()` |
| `isIr5`, `journeyTiers.ir5`, `ir5Action`, `parentCount` (pricing) | `isMultiCandidateCategory(visa)`, `journeyTiers[baseKey]`, `candidateAction`, `beneficiaryCount` + a label map (parents / children) |
| `` `ir5_${cand.id}` `` (My Journeys customizations / tiers) | `` `${baseKey}_${cand.id}` `` via one helper next to `getCandidateJourneyKey` |
| `isIr5 ? "ir-5.json" : "ir-1.json"` (provisioning) | `journeyConfigPathFor(category)` |
| `includes("5") ? "IR5" : "IR1"` (Stripe) | `getBaseVisaCategory` based mapping |
| `IR5_ENABLED && j.id === "ir5"` (marketing lists) | a small `isJourneyEnabled(category)` in `lib/feature-flags.ts` |

Each replacement keeps IR-5 behavior identical; existing IR-5 tests are the regression net.

---

## Testing plan

| Layer | What |
|---|---|
| JSON | step-key parity script vs `ir-5.json`; every `visible_when` key is one the helper understands; `document_items` ids unique |
| Unit (Jest) | `journeyHelpers` (IR-2 age-band + relationship branches), `categories.test.ts` IR-2 block, `ir2-doc-questionnaire.test.ts`, `candidate-sync` / `candidate-tools` IR-2 cases, `candidate-entitlements` IR-2, `subscriptionCleanup` / `checkout` / `webhook` IR-2 cases, `service-request-directory` IR-2 tagging, `profile-section-registry` IR2 |
| Types | `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit` after every phase (build hides errors) |
| Render | open every IR-2 step in the running dev server on :3000 (do not start a second dev server); Jest + tsc miss render crashes |
| Payments | Stripe test mode: new IR-2, add child, upgrade, cancel, alongside an owned IR-1 and IR-5 |
| Regression | full IR-1 and IR-5 walk after Phases 2, 3 and 5 (shared files change) |

---

## File change map

| Phase | Files |
|---|---|
| 0a | `lib/stripe/subscriptionCleanup.ts`, `app/api/stripe/checkout/route.ts`, new `lib/journey/journeyConfig.ts`, `lib/candidate/candidateProvisioningService.ts`, `app/api/journeys/initialize/route.ts`, `app/api/journeys/[id]/sync-steps/route.ts`, `lib/feature-flags.ts`, tests: `__tests__/stripe/{subscriptionCleanup,checkout}.test.ts`, new `__tests__/candidate/candidate-provisioning.test.ts`, new `__tests__/journey/journeyConfig.test.ts`, new `__tests__/ir2/no-ir1-fallback.test.ts` |
| 0b | `lib/constants/routes.ts`, `[visa-journey]/page.tsx`, `app/context/JourneyEnvironmentContext.tsx`, `lib/supabase/middleware.ts`, `AddCandidateModal.tsx`, `RoadmapLayoutEngine.tsx` (review notice), `data/visa-category/ir-2.json` (skeleton), `docs/ir2-content-draft.json` (temporary) |
| 1 | `data/visa-category/ir-2.json` (+ temporary `docs/ir2-content-draft.json`) |
| 2 | new `lib/journey/journeyLayout.ts`, `journey-engine/StepView.tsx`, `DashboardView.tsx`, `EmbeddedToolContainer.tsx`, `components/HouseholdBuilder.tsx`, `HouseholdMemberTool.tsx`, `lib/journey/config-loader.ts`, `journeyProgressService.ts`, profile sync helpers, `lib/profile/profileSectionRegistry.ts` |
| 3 | `lib/stripe/subscriptionCleanup.ts`, `app/api/stripe/checkout/route.ts`, `lib/candidate/candidateProvisioningService.ts`, `app/(main)/pricing/page.tsx` + `data/pricing.ts`, `app/(main)/my-journeys/page.tsx` + `CandidateProfileLauncherModal.tsx`, `AddCandidateModal.tsx`, tests under `__tests__/stripe`, `__tests__/candidate` |
| 4 | `lib/document-vault/{document-definitions,personalization-engine,flag-registry,journey-mapping}.ts`, `lib/journey/document-checklist/engine.ts` |
| 5 | new `lib/case-strength/categories/ir2.ts`, `categories/index.ts`, `consistency-intelligence.ts`, `lib/journey/evidence-gap/{engine,types,index}.ts`, new `lib/questionnaire/ir2-questionnaire.ts`, `lib/questionnaire/index.ts`, tests |
| 6 | `lib/reminders/ReminderEngine.ts`, `lib/notifications/reminderRegistry.ts`, `lib/constants/journey-app-groups.ts`, `DqRecordingTool.tsx` (x2), `221g-action-planner/components/CombinedIntakeForm.tsx`, `visa-forms/page.tsx`, `lib/formConfig/candidateScope.ts` |
| 7 | `data/interview-categories/{index.ts,ir-2-child/*}`, `lib/interview-prep/{journey-category-map,category-loader}.ts`, `visa-category/data/journeys.ts`, `ExploreJourneys.tsx`, pricing, `docs/PROJECT_KNOWLEDGE.md` |
| 8 | `ir-2.json` chapter_4, `lib/entitlements/{hardLockRules,stepFeatureMap}.ts`, engine components |

---

## Risks and gotchas

- **Do not hand-roll a new JSON from the draft.** Copy IR-5 and rewrite; otherwise every
  step-keyed map silently misses IR-2.
- **Stripe B1 is a money bug**, not cosmetic, and it is reachable today because checkout does not
  restrict `visaCategory` on the server. Step 0a fixes it first, together with B2.
- **A mis-seeded journey cannot be cleaned by the app**: step sync never deletes. If any IR-2 row
  was created before step 0a (check `journeys` where `journey_type ilike 'ir2%'`), it needs a
  one-off cleanup decided with the team, not an automatic fix.
- **URL stays authoritative** (PROJECT_KNOWLEDGE 4.7): do not add any redirect that follows the
  active candidate's `visaCategory`. A new Child candidate defaults correctly to IR-2, but do not
  rely on it.
- **Vault `visaCategory` must be exactly `"IR-2"`** or the Required tab collapses to zero docs.
- **Never fall back to IR-1 silently** for IR-2 in case strength / questionnaire / reminders:
  a child must never see nikah nama or marriage-bona-fide alerts.
- **Two `journeyHelpers.ts` copies**: IR-2 renders on the engine, so only the engine copy matters,
  but any new `visible_when` semantics go into both.
- **Hard-lock rules** stay in `hardLockRules.ts` only; IR-2 reuses the same step keys, so tier
  locks match IR-5 automatically (confirm business is happy with that).
- **Legal copy**: age-out, adoption from Pakistan, INA 320 and the I-864 exemption are the places
  a wrong sentence hurts a real family; each needs a citation and a reviewer.
- Keep `docs/PROJECT_KNOWLEDGE.md` updated in the same change as each architectural step.

### Suggested order of work

Phase 0 -> 1 (chapter 1 first, then 2, then 3) -> 2 -> 3 (B1 first) -> 4 -> 5 -> 6 -> 7 -> launch,
Phase 8 after launch. Phases 4, 5 and 6 can run in parallel once Phase 2 is merged, because they
touch different files.

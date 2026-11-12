# Case Strength Analysis (CSA) - Multi-Category

**Version:** 2.0 | **Updated:** 2026-11-12 | **Status:** Describes the code as built
**Code:** `lib/case-strength/*` (engine + `categories/*`), `lib/journey/evidence-gap/*`,
`app/components/case-health/*`, CSA widgets in `app/components/journey-{engine,spouse}/components/*`
**Sources for rules:** USCIS.gov, travel.state.gov, NVC/CEAC documentation, `data/visa-category/*.json`

> Version 1.1 of this file was an IR-1-only strategy plan. Section 0 lists where that plan and
> the shipped code differ. Sections 2-4 are the part to read before touching CSA for a new
> visa category.

---

## 0. What changed since v1.1

| v1.1 said | The code does |
| --- | --- |
| IR-1/CR-1 only | Category-scalable: one `CaseStrengthProfile` per visa category, resolved from the journey's `journey_type` (section 2). Shipped: IR-1/CR-1, IR-5. IR-2 is pending (IR-2 plan Phase 5). |
| "No numeric scoring anywhere" | A weighted **Case Health** score exists (Evidence 40 / Consistency 30 / Completeness 20 / Risk 10, section 5.6). Both IR-1 and IR-5 use it. Per-step checks are still advisory only (`critical` / `warning` / `info`, no numbers). |
| Per-chapter completeness % tiers and progress rings (v1.1 sections 3.1, 7.1, 7.2) | Not built. Completeness only feeds the weighted score; the dashboard shows the score ring, the alert stream and the evidence card. |
| Engine files `engine.ts`, `completeness.ts`, `evidence.ts`, `recommendations.ts`, `constants.ts` | Do not exist. Real layout in section 2.3. |
| Components in `components/case-strength/*` | Do not exist. Real components in section 2.4. |
| Free tier sees completeness + top 2 recommendations | `case_strength` entitlement: Premium and Executive = full; Free and Basic = locked, buyable add-on (`lib/entitlements/config.ts`). |
| Chapter 3: 3.7 = Prepare for Interview, 3.8 = Attend Interview, ... | A "Review Document Readiness" step was inserted as 3.7, so Prepare for Interview = 3.8, Attend = 3.9, Outcome = 3.10, Visa issuance = 3.11, 221(g) submit = 3.12 (section 7). |
| Unknown journey type -> IR-1 rules | Unknown or unregistered category -> `GENERIC_PROFILE` (common checks only), never spouse rules (section 2.2). |

---

## 1. What CSA is

A real-time **advisory** engine that reviews a user's case as they move through the roadmap,
across three pillars:

| Pillar | Measures |
| --- | --- |
| **Completeness** | Required steps and documents for the user's filing path |
| **Consistency** | The same facts (dates of birth, marriage date, history) match across I-130, DS-260, I-864 and civil documents |
| **Evidence quality** | Strength of the relationship evidence, financial adequacy (I-864, 125% guideline), freshness, translations |

Plus **risk detection** (red flags from the eligibility quest and form data).

USCIS publishes no case-strength formula. Every weight and tier here is the tool's own design,
built on published RFE / 221(g) / denial patterns. It is not legal advice (section 10).

---

## 2. Architecture: category profiles

### 2.1 The pattern

Everything that differs between visa categories lives in **one object per category**, a
`CaseStrengthProfile` (`lib/case-strength/categories/types.ts`). The engines are shared and
read only from the profile; they never import a category's internals.

```
journey_type ("IR1", "ir5_candidate-2", "IR-2", ...)
        |
        v
resolveCaseStrengthProfile()            lib/case-strength/categories/index.ts
        |   base category via getBaseVisaCategory()
        |   registered? -> that profile     not registered / unknown? -> GENERIC_PROFILE
        v
CaseStrengthProfile
  stepCheckers, stepRefs, baselineFields, detectEligibilityRisks,
  consistency, evidence, strengthSignals, caseScore, documentEscalation, lookAhead
        |
        v
shared engines (step checks, alert gating, evidence gap, consistency, score, reminders)
        |
        v
UI: DashboardView (both renderers), StepView inline checks, EligibilityRiskBanner,
    PreSubmissionSnapshot, CaseHealthOverview, ReminderEngine, CaseStrengthEngine
```

### 2.2 Resolver rules

`resolveCaseStrengthProfile(journeyType)`:

- Matches by **base visa category** (`getBaseVisaCategory` in `lib/candidate/candidateSyncService.ts`).
  `IR5`, `ir-5`, `IR-5`, `ir_5` and candidate keys like `ir5_candidate-2` all give the IR-5
  profile; `CR1` / `CR-1` give the IR-1 profile. (Before v2.0 a candidate key such as
  `ir5_candidate-2` fell through to IR-1, so candidate-2+ reminders and the server
  `CaseStrengthEngine` ran spouse rules on a parent case.)
- Unknown, missing, or a category with no registered profile -> **`GENERIC_PROFILE`**
  (`categories/generic.ts`). It carries only what is true for every family category: no step
  checkers, no eligibility risks, no look-ahead, date-of-birth consistency only, common
  Phase 2 questions, passports-only evidence, neutral relationship signal, weighted score.
- `findCaseStrengthProfile(journeyType)` returns the registered profile or `null`;
  `hasCaseStrengthProfile(journeyType)` is the boolean form. Use them when a UI should hide a
  CSA surface for an unregistered category instead of showing the generic view.

### 2.3 Files

| File | Role |
| --- | --- |
| `categories/types.ts` | `CaseStrengthProfile` contract (every field documented) |
| `categories/index.ts` | Registry `CASE_STRENGTH_PROFILES` + resolver. The only file that lists categories |
| `categories/ir1.ts` | IR-1/CR-1 spouse profile |
| `categories/ir5.ts` | IR-5 parent profile (template for new family categories) |
| `categories/generic.ts` | Fallback for unregistered categories |
| `step-checkers.ts` | `IR1_STEP_CHECKERS`, `COMMON_STEP_CHECKERS` (IR-1 minus the 5 category-specific keys), `COMMON_LOOK_AHEAD`, shared disclosure helpers, `runStepChecks` |
| `eligibility-quest-detector.ts` | IR-1 eligibility risks, `StepRefs`, common risk patterns |
| `risk-detector.ts` | Red flags from form data (marriage duration, age gap, ...) |
| `consistency.ts` | Cross-form field diff (`compareFields`, `BASELINE_FIELDS`) |
| `consistency-intelligence.ts` | Phase 1 (category-agnostic) + Phase 2 questionnaire checks |
| `civil-docs.ts`, `evidence-classifier.ts`, `doc-scoring.ts` | Civil-document analysis, REQUIRED vs SUPPORTING evidence, per-document scoring |
| `aggregate-issues.ts` | Per-chapter issue lists for the dashboard |
| `alert-gating.ts` | `buildAlertGateContext`, frontier gating, 3-stage document escalation, fresh-journey gates |
| `case-narrative.ts` | `CASE_SCORE_WEIGHTS`, weighted score, status copy |
| `validators.ts` | Receipt-number format, USCIS upload limits |
| `lib/journey/evidence-gap/*` | `EvidenceGapEngine` + per-category evidence requirements |
| `lib/journey/CaseStrengthEngine.ts` | Legacy server-side numeric scorer (uses the profile's relationship signal) |
| `lib/reminders/ReminderEngine.ts` | Document-driven reminders (uses the profile) |

### 2.4 UI

- `app/components/case-health/CaseHealthCalculation.tsx`: score explainer, shared by both
  dashboards, reads `CASE_SCORE_WEIGHTS` so the shown math cannot drift.
- `journey-engine/components/*` (IR-5 and every chapters-schema journey):
  `CaseHealthOverview`, `Chapter1HealthPanel`, `StepHealthInline`, `EligibilityRiskBanner`,
  `PreSubmissionSnapshot`, `ConsistencyBaselineCapture`, `EvidenceStrengthMeter`,
  `EvidenceQuestionnaireModal`, `DocCaseStrengthMeter`, `FileQualityPreCheck`, `JourneyRiskCard`.
- `journey-spouse/components/*`: parallel copies for the IR-1/CR-1 dashboard. The spouse copies
  of `EligibilityRiskBanner` / `PreSubmissionSnapshot` are IR-1-only and do not call the resolver.

---

## 3. Adding a visa category (playbook)

Example: a new family category `XX-9` with `data/visa-category/xx-9.json`.

1. **Journey first.** The JSON (chapters schema) and the dashboard wiring
   (`JOURNEY_DATA_MAP` + slug maps) exist. Until step 3 is done the journey already gets
   `GENERIC_PROFILE`, so nothing spouse-specific can leak into it.
2. **Map the step layout.** List the JSON's `step_key` -> step name and compare with
   `ir-1.json` / `ir-5.json`. Checkers are keyed by `step_key`, and keys are **positional**
   (section 6). Note every step whose key means something different from IR-1.
3. **Create `lib/case-strength/categories/xx9.ts`** using `ir5.ts` as the template:
   - `stepCheckers`: start from `COMMON_STEP_CHECKERS`, drop the keys whose meaning differs,
     re-point shared checkers by meaning (`step_1_5: COMMON_STEP_CHECKERS.step_1_6`), and add
     your own functions for the 5 category-specific steps (relationship baseline, blockers,
     review & submit, DS-260 cross-check, interview prep). Write a comment table of
     `step_key -> step name -> checker`, as in `ir5.ts`.
   - `stepRefs`: chapter/step labels used inside advice text, matching your JSON numbering.
   - `baselineFields`: the facts compared I-130 vs DS-260 (dates of birth always; marriage
     date only for spouse categories; e.g. marital status for a child).
   - `detectEligibilityRisks`: map YOUR eligibility quest screen ids and answer polarity. Do
     not reuse another category's detector: screen ids and "yes" meaning differ (IR-1 `q5s5`
     "yes" = income concern, IR-5 `q5s5` "yes" = sponsorship is fine).
   - `consistency`: `COMMON_PHASE2_QUESTIONS` + `runCommonPhase2Checks` unless the category
     has a marriage (then the spouse set).
   - `evidence`: add `XX9_EVIDENCE_REQUIREMENTS` (+ questionnaire) in
     `lib/journey/evidence-gap/{engine,types}.ts`; map any new document ids to a category.
   - `strengthSignals.relationship`: spouse signal only for marriages; otherwise a no-op (a
     big parent/child age gap is normal and must not be penalized).
   - `caseScore: { model: "weighted" }`, `documentEscalation: DEFAULT_DOCUMENT_ESCALATION`,
     `lookAhead: COMMON_LOOK_AHEAD` (only if your Affidavit of Support / joint sponsor / fresh
     PCC steps use the same keys as IR-1, else your own list).
   - `journeyTypes`: at least one spelling of the category (matching is by base category).
4. **Register** it in `CASE_STRENGTH_PROFILES` (`categories/index.ts`). Nothing else in the
   engine changes.
5. **Check UI widgets placed by step key.** Some engine `StepView` widgets are still placed by
   literal key (section 9). Confirm they land on the right step for your layout.
6. **Tests.**
   - `__tests__/case-strength/category-contract.test.ts` runs on every chapters-schema JSON
     automatically. It fails if the journey has no profile and is not listed in
     `AWAITING_PROFILE`, or if a profile has a checker / look-ahead key missing from the JSON.
     Remove your category from `AWAITING_PROFILE` when you register it.
   - Add a block to `__tests__/case-strength/categories.test.ts`: resolver spellings (incl. a
     candidate key), each eligibility risk fires, no spouse risk ever fires (if not a spouse
     category), the remapped steps point at the intended checkers.
7. **Docs.** Add the category to section 7 here and to section 4.5 of `docs/PROJECT_KNOWLEDGE.md`.

---

## 4. Profile reference

| Field | Purpose | IR-1 / CR-1 | IR-5 | Generic |
| --- | --- | --- | --- | --- |
| `stepCheckers` | Inline advisory checks per `step_key` | `IR1_STEP_CHECKERS` | COMMON + 5 overrides + chapter-1 remap | none |
| `stepRefs` | Step labels in advice text | Step 4 I-130, Step 5 I-130A, Step 10 Review | Step 4 I-130, Step 9 Review (no I-130A) | neutral wording |
| `baselineFields` | I-130 vs DS-260 diff | marriage date + both DOBs | both DOBs | both DOBs |
| `detectEligibilityRisks` | Quest answers -> risk flags | spouse + common patterns | IR-5 q5 screens (own polarity) | none |
| `consistency` | Phase 2 questions + runner | marriage history + common | common only | common only |
| `evidence` | Evidence-gap categories | 7 categories (incl. bona fide marriage) | IDENTITY + FAMILY_INTEGRATION | IDENTITY (passports) |
| `strengthSignals.relationship` | Legacy numeric scorer signal | marriage length, children, age-gap flag | no-op | no-op |
| `caseScore` | Headline score model | weighted | weighted | weighted |
| `documentEscalation` | Missing-doc 3-stage lifecycle | default | default | default |
| `lookAhead` | Deadline items surfaced one chapter early | `COMMON_LOOK_AHEAD` | `COMMON_LOOK_AHEAD` | none |

IR-5 evidence deliberately omits FINANCIAL and IMMIGRATION_HISTORY: those are NVC / consular
documents, not filing-stage proof.

---

## 5. Shared engines (category-agnostic)

### 5.1 Step checks
`runStepChecks(stepKey, ctx, profile.stepCheckers)` returns `StepCheck[]`
(`level: critical | warning | info`, `title`, `hint`, optional `resolved`). Inputs: wizard
state (metadata, completed steps), uploaded documents, eligibility answers, the JSON step.
Shown inline by `StepHealthInline` and aggregated per chapter by `aggregate-issues.ts`.
Outcome-gated steps (3.11+) only surface checks when visible for the recorded outcome.

### 5.2 Alert gating
`buildAlertGateContext` (the one wrapper every dashboard uses) wires the profile's
`lookAhead`, `documentEscalation` and the target filing date. `gateAlertIssues` filters by the
journey **frontier** (first uncompleted step): issues ahead are suppressed, active steps get a
grace window, steps behind escalate.

### 5.3 Document escalation
A missing required document moves to-gather -> due-soon -> critical, relative to the filing
deadline when known (`DEFAULT_DOCUMENT_ESCALATION`: 7 / 21 days on the clock, 3 / 14 days when
behind, filing 30 / 7 days).

### 5.4 Evidence gap
`EvidenceGapEngine(profile.evidence.requirements)` scores each category
STRONG / MODERATE / WEAK / MISSING from vault uploads, autofill, case data and the evidence
questionnaire. Its `userProvided` view counts only real uploads, so autofill cannot inflate
the score.

### 5.5 Consistency
Phase 1 (timeline, medical, financial, ...) is shared. Phase 2 is the optional questionnaire;
the profile decides which questions are shown and which runner executes, so a finding never
appears for a question that was not asked. The cross-form diff compares
`profile.baselineFields`. Names are not auto-compared (spelling variants like
Muhammad/Mohammad would raise false alarms).

### 5.6 Case Health score
`computeWeightedCaseScore` (`case-narrative.ts`):

```
score = 0.4 * evidence + 0.3 * consistency + 0.2 * completeness + 0.1 * (100 - riskPenalty)
riskPenalty = sum of RISK_SEVERITY_PENALTY (critical 100, warning 40, advisory 15), capped at 100
```

Evidence and completeness use the user-provided evidence view. Weights live only in
`CASE_SCORE_WEIGHTS`. Fresh-journey gates: `isMeaningfullyStarted` gates the alert stream;
`isCaseHealthScorable` (a completed step + a real evidence signal, `hasUserEvidenceSignal`)
gates the numeric ring, so a brand-new journey shows "Building Your Case", not a fake ~50%.

### 5.7 Risk detection

| Risk | Source | Categories |
| --- | --- | --- |
| Past visa refusal / fraud, criminal history, unlawful presence | Eligibility quest | all family (per-category screen ids) |
| Income below 125% of the poverty guideline | Affidavit of Support calculator | all family |
| Marriage < 6 months, never met in person, age gap > 15 years, prior petition for another spouse | Quest + forms | spouse only |
| Missing prior-marriage termination proof | Civil-doc checklist | spouse only |
| Police certificate freshness | PCC step | all (Pakistan) |

Poverty-guideline numbers are not copied here; the source of truth is
`lib/tools/sponsorship/povertyGuidelines.ts`.

---

## 6. The step-key rule

Step checkers, look-ahead rules, a few `actionableStepKey`s and some UI widgets are keyed by
`step_key`. Step keys are positional within each JSON, so the same key can mean different
steps in different categories:

| key | IR-1 | IR-5 / IR-2 |
| --- | --- | --- |
| step_1_5 | Fill Form I-130A | Create USCIS Account |
| step_1_6 | Create USCIS Account | Start Form I-130 on USCIS |
| step_1_7 | Start Form I-130 on USCIS | Upload Forms & Evidence |
| step_1_8 | Upload Forms & Evidence | Pay Filing Fee |
| step_1_9 | Pay Filing Fee | Review & Submit |
| step_1_10 | Review & Submit | Print Hard Copy |
| step_1_11..14 | paper path (4 steps) | step_1_10..13 (one fewer) |

Chapters 2 and 3 currently share keys across IR-1, IR-5 and IR-2. Inserting a step in one
JSON shifts every later key, so the person adding the step must update that category's checker
keys, `COMMON_LOOK_AHEAD` and tests in the same change. The contract test catches keys that
disappear, not keys that silently change meaning, so always re-check the step names.

---

## 7. Check maps per category

### 7.1 IR-1 / CR-1 (`IR1_STEP_CHECKERS`)

| Step | Check |
| --- | --- |
| 1.3 Review Filing Methods | Filing method chosen |
| 1.4 Fill I-130 | Marriage date + both DOBs captured (baseline); eligibility red flags |
| 1.5 Fill I-130A | Beneficiary current country; multi-country history -> extra PCCs |
| 1.6 Create USCIS Account | myUSCIS account confirmed (online) / mailing address (paper) |
| 1.7 Start I-130 | Payment method ready |
| 1.8 Upload | Files over 12 MB or wrong format (critical) |
| 1.9 Pay Filing Fee | Unresolved eligibility blockers |
| 1.10 Review & Submit | Key dates captured; no unresolved critical issues |
| 1.12 / 1.13 / 1.14 (paper) | Payment method saved; packet checklist; mailing + tracking saved |
| 1.15 / 1.16 / 1.17 | Receipt number format |
| 2.2 Pay NVC Fees | Save fee status |
| 2.3 DS-260 | 3 key dates vs I-130 (critical on mismatch); disclose everything told to USCIS |
| 2.4 Civil Documents | Missing required / conditional civil docs (critical); translations; reciprocity schedule |
| 2.5 Affidavit of Support | Income shortfall in dollars (warning) -> joint sponsor |
| 2.6 Financial Documents | Each sponsor's most recent tax year |
| 2.7 Joint Sponsor | Add one when income is short |
| 2.8 Review & Submit to NVC | DS-260 done, civil docs complete, income gap resolved |
| 2.10 / 2.12 | Record DQ date / interview date |
| 3.1 Schedule Medical | Book early; warning once an interview date exists without an exam |
| 3.2 Polio Certificate | Get it before the medical |
| 3.3 Fresh PCC | Apply for a fresh one (warning), then track until held |
| 3.4 Attend Medical | Never open the sealed envelope |
| 3.6 Gather Originals | Required original groups (read from the step's checklist); originals match filed forms |
| 3.8 Prepare for Interview | Answers must match DS-260; be ready to explain declared issues |
| 3.9 Attend Interview | Originals gathered, prep done, no electronics, arrive early |
| 3.10 Confirm Outcome | Record the outcome |
| 3.11 Track Visa Issuance | Verify visa details on arrival (approved path) |
| 3.12 Submit 221(g) Documents | Submit exactly what was requested |

No check by design: 1.1, 1.2 (handled by risk banner / evidence engine), 1.11, 1.18-1.25 (USCIS
notice branches), 2.1, 2.9, 2.11, 3.5, 3.7, 3.11b, 3.13 (sign-in, waiting, or how-to steps).

### 7.2 IR-5 (`IR5_STEP_CHECKERS`)

Same as IR-1 except:

| IR-5 step | Check |
| --- | --- |
| 1.4 Fill I-130 | Both DOBs captured; prove the parent-child link (petitioner's birth certificate naming the parent) |
| 1.5 Create USCIS Account | IR-1's 1.6 check |
| 1.6 Start I-130, 1.8 Pay Filing Fee, 1.10 Print Hard Copy | none |
| 1.7 Upload | IR-1's 1.8 file-quality check |
| 1.9 Review & Submit | Both DOBs captured; no unresolved critical issues (IR-5 risk detector) |
| 1.11 / 1.12 / 1.13 (paper) | IR-1's 1.12 / 1.13 / 1.14 |
| 2.3 DS-260 | DOB cross-check (no marriage date); IR-5 disclosures |
| 3.8 Prepare for Interview | Parent-relationship wording; IR-5 interview disclosures |

### 7.3 IR-2 / CR-2

No profile yet: resolves to `GENERIC_PROFILE` (no step checks, no risks). The profile is Phase 5
of `docs/ir2-implementation-plan.md` (age-out, child marital status, stepchild / adoption rules)
and follows section 3. The IR-2 step layout matches IR-5 (no I-130A).

---

## 8. Entitlements

`case_strength` in `lib/entitlements/config.ts`: Premium and Executive = full; Free and Basic =
locked with a buyable add-on. Inside a journey, gate through `useJourneyPlan` (journey tier),
not the account tier.

---

## 9. Known gaps and next steps

1. **Engine `StepView` widgets placed by literal key.** `FileQualityPreCheck` renders on
   `step_1_8` and `PreSubmissionSnapshot` on `step_1_10`. In the engine dashboard (IR-5, IR-2)
   those keys are Pay Filing Fee and Print Hard Copy; the matching steps are `step_1_7` and
   `step_1_9`. Only the USCIS-account widget is already layout-aware (`isUscisAccountStep`).
2. **`PreSubmissionSnapshot` (engine copy) always shows a "Marriage date" row**, also on IR-5.
   It should read the rows from `profile.baselineFields`.
3. **Semantic check ids (recommended next refactor).** Binding by positional key is the main
   scalability cost (section 6). Proposal: each JSON step declares `"csa_check": "<id>"`
   (e.g. `uscis_account`, `file_upload_quality`, `review_submit_gate`); a shared library maps
   ids to checkers; each profile's `stepCheckers` is built from its JSON at load time, and only
   category-specific ids need new code. The same id would place UI widgets (gap 1). Checkers
   that call `done("step_x_y")` internally would need the id-to-key lookup too.
4. **IR-1 checker naming.** IR-1's 1.7 (Start I-130) carries the payment check and 1.9 (Pay
   Filing Fee) the blockers check; the content still fits the position but the in-code comments
   say otherwise.
5. **IR-2 profile** (section 7.3).

---

## 10. Legal disclaimer

> [!CAUTION]
> The Case Strength Analysis is an **advisory self-assessment tool**. It does not constitute
> legal advice, does not guarantee any immigration outcome, and should not be relied upon as a
> substitute for consultation with a qualified immigration attorney. USCIS adjudication
> decisions are made case by case and may consider factors this tool does not capture.

This disclaimer must appear on every Case Strength view.

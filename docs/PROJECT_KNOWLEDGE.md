# Rahvana — Project Knowledge Document

> **Purpose of this file.** A single source of truth describing how the entire Rahvana
> platform works, so an LLM (or a new senior engineer) can reason about the system
> without reading every source file. Read this first; only open files when you need
> exact line-level detail. Section 30 is a condensed mental model for low-token recall.
>
> **Keep this file alive.** Whenever a change alters architecture, a source of truth, a
> core data flow, the DB schema, or a critical rule, update this doc in the same change
> so it never drifts from the code.

---

## 1. Project Overview

**Rahvana** (internal codename **Arachnie**) is a **U.S. immigration journey
platform** focused primarily on the **IR-1 / CR-1 spouse visa** path for applicants in
Pakistan, now expanding to **IR-5 (parent)** and adjacent support for IR-2 and several
student visas (F-1, UK, Canada, Australia, Germany, China, Italy).

It does three big things:

1. **Guides a couple through the entire immigration journey** — from filing the I-130
   petition with USCIS, through National Visa Center (NVC) processing, to the consular
   interview and visa issuance — as an interactive, stateful, step-by-step roadmap.
2. **Automates the painful mechanical work** — auto-fills USCIS PDF forms from a single
   profile, extracts data from documents via OCR/vision AI, compresses/generates PDFs,
   makes passport photos, scores "case strength," and predicts timelines.
3. **Sells expert + tooling services** — tiered subscriptions plus one-off add-ons
   (consultations, police-certificate filing, document translation, mock interviews),
   monetized through Stripe.

**Primary users**

- **Beneficiary** (the immigrating spouse/parent, usually in Pakistan) and **Petitioner /
  Sponsor** (the U.S. citizen). The product models both roles explicitly.
- **Admins** — review consultations, translations, police-verification requests, visa
  cases, reviews, and guide feedback through an admin dashboard.

**High-level architecture**

```
                ┌──────────────────────────────────────────────┐
                │   Next.js 15 App Router (React 19, TS)        │
                │   - UI route groups: (auth) (main) (tools)    │
                │   - app/api/* route handlers (BFF layer)      │
                │   - lib/* business logic + engines            │
                │   - React Context for global state            │
                └───────────┬───────────────────┬──────────────┘
                            │                    │
            ┌───────────────▼──────┐   ┌─────────▼───────────────┐
            │  Supabase            │   │  Python FastAPI backend  │
            │  - Postgres + RLS    │   │  - PDF fill / generate   │
            │  - Auth (+MFA, OAuth)│   │  - PDF compress          │
            │  - Storage (files)   │   │  - rembg passport photo  │
            │  - Realtime          │   │  - Gemini vision OCR     │
            └──────────────────────┘   │  - visa-bulletin checker │
                                        └──────────────────────────┘
   External: Stripe (payments), Resend (email), EasyPost (courier tracking),
             Google Gemini (AI/OCR), USCIS Torch API (live case status),
             Google Analytics 4, Google Sheets (feedback), OCR.space (free OCR),
             Upstash Redis (distributed rate limiting).
```

**Overall workflow.** A user signs up -> completes a profile / eligibility
questionnaire -> a **journey** is created from the per-category JSON in
`data/visa-category/*.json` (chapters -> steps). As they progress, the wizard syncs
state to Supabase, unlocks dependent steps, gates premium features by plan tier, and
fires reminders. Tools (form-filler, document vault, case-strength, interview-prep)
read/write the same central profile + case data.

---

## 2. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend framework** | Next.js 15 (App Router) + React 19 | File-based routing, server + client components, route handlers act as a BFF |
| **Language** | TypeScript (strict) | Type safety across a large domain model |
| **Styling** | TailwindCSS 4, shadcn-ui (Radix primitives), tailwind-merge, CVA | Utility-first + accessible component primitives |
| **Animation** | Framer Motion / `motion`, GSAP, AOS, canvas-confetti | Marketing polish + journey celebration UX |
| **Client state** | Zustand (stores), React Context (global), SWR (server cache) | Lightweight stores for PDF/vault/progress-tree; Context for profile/plan/auth |
| **Forms** | React Hook Form + Zod | Validation for forms + questionnaires |
| **Auth + DB + Storage** | Supabase (Postgres, Auth w/ MFA + Google OAuth, Storage, Realtime, RLS) | Single managed backend for data, identity, files |
| **Payments** | Stripe (subscriptions, one-time add-ons, webhooks, billing portal) | Tiered monetization |
| **Email** | Resend | Transactional email (confirmations, notifications, security alerts) |
| **AI** | Google Gemini (`@google/generative-ai`) + Gemini via OpenAI-compatible endpoint | OCR/vision extraction, AI coaching, chat |
| **Python backend** | FastAPI + Uvicorn | CPU/AI-heavy work: PDF fill/generate/compress, rembg, vision OCR |
| **PDF (frontend)** | pdf-lib, pdfjs-dist, pdfmake, jspdf, react-pdf, pdfkit | In-browser PDF view/edit/generate |
| **PDF/image (backend)** | PyMuPDF (fitz), reportlab, pikepdf, Pillow, OpenCV, rembg, MODNet | Form fill, generation, compression, background removal |
| **OCR** | OCR.space (fast first pass, small images), Gemini Vision (always-run, authoritative) | Document data extraction |
| **Courier tracking** | EasyPost | Track document shipments to USCIS/NVC |
| **Live case status** | USCIS Torch API (OAuth) | Real-time USCIS receipt-status lookup |
| **Rate limiting** | Upstash Redis (optional, fails open to in-memory) | Distributed auth/endpoint throttling |
| **Analytics** | Google Analytics 4 Data API | Admin analytics dashboard |
| **Feedback sink** | Google Sheets API | Appends user feedback to a sheet |
| **Deployment** | Vercel (Next.js), Render (FastAPI backend) | `vercel.json`, `runtime.txt` (python-3.10.14) |

Build uses **Turbopack** (`next build --turbopack`). Note: `next.config.mjs` sets
`eslint.ignoreDuringBuilds` and `typescript.ignoreBuildErrors` to **true** — type/lint
errors do **not** fail the build (run `npx tsc --noEmit` manually to check types).

---

## 3. Folder Structure

| Folder | Purpose |
|---|---|
| `app/` | Next.js App Router. Route groups `(auth)`, `(main)`, `(tools)`; `app/api/*` route handlers (~149 `route.ts` across ~41 groups); `app/components/*` (feature components, incl. `journey-engine/`, `journey-spouse/`, `case-health/`); `app/context/*` (global providers); `app/translations/*` (i18n JSON). |
| `components/` | Shared/reusable UI: `ui/` (shadcn primitives), `magicui/`, `pricing/`, `resources/`, `tools/`, `chat/`. |
| `lib/` | **The business-logic core.** Engines and services: journey, entitlements, autoFill, case-strength, ir1-engine, document-vault, document-ocr, notifications/reminders, ceac-tracking, security, guides, plan, usage, supabase clients, stripe, email, etc. |
| `data/` | Static domain config. **`visa-category/*.json`** = the live journey source of truth (ir-1, ir-2, ir-5, f-1, and per-country student journeys). `roadmap.ts` = **legacy** old-schema data used only by home/marketing pages. Also `interview-categories/*`, `visa-checker/*`, and many guide/data JSON files. |
| `types/` | Shared TypeScript types (`profile.ts` = MasterProfile, `journey-support.ts`, `roadmap.ts`, `notifications.ts`, etc.). |
| `backend/` | Python FastAPI service: `app/api/v1/*` endpoints, `app/services/*`, `app/core/form_configs/*` (USCIS form field maps), `data/` (visa bulletin + `iv_data.json`), `modnet/` (git submodule, background-removal model). |
| `supabase/` | `migrations/*` SQL (~73 files) — the database schema, RLS policies, triggers. |
| `actions/` | Next.js server actions (where used). |
| `scripts/` | Maintenance/dev scripts. |
| `__tests__/` | Jest tests (case-strength, consultation, stripe). |
| `public/` | Static assets, videos, sample docs. |
| `middleware.ts` | Root middleware -> auth/session, admin gate, crawler + body-size guards. |
| `milestones.config.ts` | Root milestone definitions for case timeline tracking. |

**Two component locations** (important): top-level `components/` (mostly shadcn
primitives + a few shared tool widgets) **and** `app/components/` (feature-specific
components). When adding UI, check both.

---

## 4. Module-by-Module Deep Explanation

### 4.1 Journey Engine (`lib/journey/*` + `data/visa-category/*.json`) — the heart of the product

**Why it exists:** the entire app is a stateful, conditional, multi-actor checklist.
This module turns per-category JSON config into live, per-user database rows and manages
progression.

**Source of truth = `data/visa-category/*.json` (NOT `data/roadmap.ts`).** Each file
(e.g. `ir-1.json`, `ir-5.json`, `f-1.json`) is keyed by `chapter_key` / `step_key` with
top-level `{ journey_type, journey_name, chapters[], documents }`. Each chapter has
`{ chapter_key, chapter_number, steps[] }`; each step carries `who`
(petitioner/beneficiary/both), `where`, `dependencies`, `visible_when`, `actions`,
`quest_data`, `risk_signals`, `relevant_tools`, `display_order`, `is_required`, etc.
Filing-method branching is expressed via `visible_when.filingMethod` (plus a legacy
`branch`), not a top-level `filingType` step field.

> `data/roadmap.ts` is a **legacy** old-schema artifact (top-level `stages` with
> `id`/`name`, no `visible_when`) read only by the home/marketing components
> (`app/components/home-page/Wizard.tsx`, `home-page/Dashboard.tsx`,
> `visa-category/components/ExploreJourneys.tsx`). Do not treat it as the journey source
> of truth. A separate legacy static list `lib/steps.ts` (`immigrationSteps[]` HTML) is
> also marketing-only.

**Two distinct pipelines**

- **JSON -> DB rows (server seeding, the "engine"):**
  - `lib/journey/config-loader.ts` — `ConfigLoader.loadJourneyJSON()` reads
    `data/visa-category/<type>.json`; `transformChaptersInput()`, `transformStepsInput()`,
    `extractCaseDataKeys()`. Comment in-file: "JSON file is the source of truth, database
    is the storage layer."
  - `lib/journey/service.ts` — composes the engines/services:
    - **ProgressCalculationService** — cascades completion *up*: step -> chapter -> journey.
    - **ConditionalLogicEngine** — evaluates `visible_when` JSONB against `case_data`.
      **Never short-circuit this** (see CLAUDE.md).
    - **StepCompletionEngine** — marks steps complete, unlocks dependents, handles
      "skipped but persistent" optional steps (e.g., police certificate stays visible).
    - **CaseDataValidationEngine** — validates case data against rules/completeness.
    - **JourneyService / StepService** — high-level CRUD; `createJourneyFromConfig(filePath)`
      seeds journey/chapters/steps DB rows.
  - `lib/journey/data-access.ts` — raw Supabase CRUD for journeys/chapters/steps.
  - Entry point: `app/api/journeys/initialize/route.ts` — a **single combined load**
    (returns `{journey, steps, case_data}`), 30s server cache, and an `after()`
    background `syncStepsBackground` that inserts any steps missing from the JSON. Also
    `app/api/journeys/create-from-config`.
- **JSON -> visible steps (client rendering):**
  - `getActiveStepsForStage(...)` lives at
    **`app/components/journey-engine/journeyHelpers.ts`** (with a parallel copy at
    `app/components/journey-spouse/journeyHelpers.ts`). It filters `chapter.steps` by
    `visible_when` + `filingMethod` + legacy `branch`, and sorts by
    `display_order`/`step_number`. **There is no `lib/journeyHelpers.ts`.**

**Dashboard routing (which visa renders which UI).** Single entry component
`app/(tools)/(visa)/visa-category/[visa-journey]/page.tsx`:

- `ir-1` / `cr-1` -> **`RoadmapLayoutSpouse`** (`app/components/journey-spouse/`) — the
  dedicated legacy spouse UI (internally "V2").
- Any JSON with a `chapters[]` array (IR-5 today, future categories) ->
  **`RoadmapLayoutEngine`** (`app/components/journey-engine/`) — the generic
  chapters-schema renderer (internally "V3"; still types data as `RoadmapDataV3`).
- Old `stages`-schema journeys (student visas f-1, germany, ...) -> inline **legacy
  `Wizard`** fallback in the same page file (uses `ProgressTree`/`StepDetail`/`DocumentVault`).
- IR-5 is production-gated by `IR5_ENABLED` (`lib/feature-flags.ts`); on prod, `ir-5`
  redirects to `ir1-journey`.

**Other journey files**

- `lib/journey/CaseStrengthEngine.ts` — legacy scorer (superseded as the headline scorer
  by `lib/case-strength/*`; see 4.5).
- `lib/journey/evidence-gap/engine.ts` — see 4.5.
- `lib/journey/NurtureService.ts` — engagement/nurture messaging.

### 4.2 Wizard state hook (`app/(main)/dashboard/hooks/useWizard.ts`)

The **client-side single source of truth** for the active journey. `WizardState` tracks
`currentStage`, `currentStep`, `scenarioType`, `completedSteps` (Set), `collapsedSteps`,
`role`, `filingType` (`online|paper|both`), `documentChecklist`, `docUploads`, `notes`,
`started`, `answers`, `metadata` (case data), `unresolvedTasks`, `backendId`, `stepMap`
(step_key -> DB uuid), and `stepTimestamps`. Key actions: `toggleComplete`,
`updateMetadata`, `updateAnswers`, `setStage`, `setCurrentStep`, `setRole`,
`setFilingType`, `setScenario`, `uploadDocument`, `resetProgress`, `startJourney`.

API touchpoints: `POST /api/journeys/initialize` (single combined fetch/create),
`PATCH /api/journeys/{id}` (save position; `DELETE` for reset),
`POST/PATCH /api/steps/{uuid}?action=complete` (complete/uncomplete + started_at),
`POST /api/case_data` (batch upsert), `POST /api/documents/upload`. Uses **optimistic
updates** + background sync. DB rows are authoritative for progress; the passed-in JSON
only seeds initial stage/step position. It also **bidirectionally syncs with the profile**
(`syncCaseDataToProfile` / `syncProfileToCaseData`).

### 4.3 Entitlements / plan gating (`lib/entitlements/*`)

**Why:** every feature is gated by plan tier. Hard-lock rules live **only** here.

- Tiers: `PlanTier = "free" | "basic" | "premium" | "executive"`.
  - **free** — not a real product tier; shows locked previews to drive signup. Locked to
    only the first step of Chapter 1.
  - **basic** ($349/yr, $29/mo) — roadmap structure only.
  - **premium** ($699/yr, $58/mo) — guided journey: guides, vault, tracking, most tools.
  - **executive** ($1099/yr, $92/mo) — full suite: adds 221g planner, mock interview,
    expert support, services.
- `config.ts` — master `ENTITLEMENTS` table (~33 active feature keys) mapping features ->
  per-tier `FeatureState` (**8 states**: `full | list_only | save_only | locked_upgrade |
  locked_buy | limited | executive_only | preview`) + add-on catalog + `TIER_PRICES`.
- `hardLockRules.ts` — **critical.** `getStepLockStatus(stepId, tier, chapterIdx, localIdx)`
  returns `{isLocked, requiredPlan, reason}`: free tier is locked past ch1/step1, then
  `HARD_LOCK_RULES` (a per-step map of *denied* tiers) applies. `step_3_11`/`step_3_12`
  are executive-only (221g).
- `helpers.ts` — `getEffectiveEntitlement`, `canUse`, `isLocked`, `lockHint`, `upgradeCTA`,
  `tierPrice`.
- `stepFeatureMap.ts` — maps journey steps to feature keys.
- `routeFeatureMap.ts` — **currently commented out.** Gating strategy shifted from
  route-level walls to **result-level locking** (`ResultGate`): tools are enterable, the
  lock hits at the final output/result step.
- `resourceLinks.ts` — maps feature keys -> sales-page slugs -> demo tool routes (fixes
  add-on id mismatches).

Note `DB_TIER_MAP` in `PlanContext`: DB historically used `core/plus/pro`, mapped to
`basic/premium/executive`. On load, `PlanContext` POSTs `/api/plan/reconcile` before
reading the tier (defensive, fail-open payment reconciliation). Add-ons come from
`profile_details.purchased_addons`. Time-based lock `lib/journey-lock.ts`
(`JOURNEY_LOCK_DAYS = 14`) locks a journey 14 days after `metadata.ceacIssuedAt`
(distinct from entitlement gating).

### 4.4 Auto-fill (`lib/autoFill/*`)

Bidirectional mapping between the **MasterProfile** and any USCIS form.

- `mapper.ts` — central `FIELD_MAPPINGS` registry (large; handles nested paths + special
  cases like income/gender/visa-type normalization); `autoFillForm()` (profile -> form)
  and `mapFormToProfile(form, overrides)` (form -> profile), plus legacy wrappers
  `mapProfileToGenericForm`, `mapProfileToVisaChecker`.
- `useAutoFill.ts` — React hook consuming `UserProfileContext`; returns `autoFilledData`,
  `saveFormData()`, `onFieldChange()` for live sync.
- `journeyProfileBridge.ts` — bridges journey case data <-> master profile.
- `formOverrides.ts` — per-form overrides (e.g., I-130 Part 1 name = sponsor).

### 4.5 Case strength & scoring (`lib/case-strength/*`) — category-scalable

Scores case strength grounded in USCIS policy + practitioner patterns, now **scalable
across visa categories via a profile/Strategy pattern** (no longer IR-1-only).

- **Category registry:** `categories/index.ts` — `CASE_STRENGTH_PROFILES = [IR1_PROFILE,
  IR5_PROFILE]`; `resolveCaseStrengthProfile(journeyType)` normalizes the type and
  **falls back to `IR1_PROFILE`** for unknown/missing. A `CaseStrengthProfile`
  (`categories/types.ts`) bundles `stepCheckers`, `stepRefs`, `baselineFields`,
  `detectEligibilityRisks`, `consistency`, `evidence` (EvidenceGapConfig),
  `strengthSignals.relationship`, and optional `caseScore`, `documentEscalation`,
  `lookAhead`. Adding a category = one new `categories/<slug>.ts` + registry entry.
- **Shared core:** `COMMON_STEP_CHECKERS` (`step-checkers.ts`) = IR-1 checkers minus 5
  category-specific keys (`step_1_4, step_1_9, step_1_10, step_2_3, step_3_7`). IR-5
  (`categories/ir5.ts`) reuses COMMON and overrides only those 5.
- **Weighted Case Health score:** `CASE_SCORE_WEIGHTS` in `case-narrative.ts` =
  **Evidence 0.4 / Consistency 0.3 / Completeness 0.2 / Risk 0.1** (single tuning point).
  `computeWeightedCaseScore` applies risk as inverted "risk health"
  (`100 - riskPenalty`), so a clean case can reach 100. `RISK_SEVERITY_PENALTY`: critical
  100 / warning 40 / advisory 15 (capped). **Both IR-1 and IR-5 profiles opt in**
  (`caseScore: { model: "weighted" }`); the legacy 50/50 `computeOverallCaseScore` runs
  only when a profile omits `caseScore` (neither shipped profile does). *In-code comments
  saying "IR-5 only" are stale.*
- **Shared explainer component:** `app/components/case-health/CaseHealthCalculation.tsx`
  is rendered by **both** dashboards (spouse V2 + engine V3) and imports
  `CASE_SCORE_WEIGHTS`, so the displayed math cannot drift from the model.
- Other submodules: `risk-detector`, `eligibility-quest-detector`, `evidence-classifier`
  (REQUIRED vs SUPPORTING), `civil-docs` (Pakistani docs: nikah nama, NADRA MRC),
  `consistency` + `consistency-intelligence` (cross-document name/DOB matching),
  `doc-scoring`, `aggregate-issues`, `case-narrative`, `alert-gating`, `validators`.

**Evidence gap (`lib/journey/evidence-gap/engine.ts`).** Injectable: the constructor
takes a category requirement set. `IR1_EVIDENCE_REQUIREMENTS` = all 7 categories
(incl. bona-fide-marriage evidence); `IR5_EVIDENCE_REQUIREMENTS` = **only `IDENTITY` +
`FAMILY_INTEGRATION`** (FINANCIAL/IMMIGRATION_HISTORY are deliberately omitted as
NVC/consular-stage docs). Inputs: `vaultDocuments` (only `UPLOADED`), `journeyDocuments`
(autofill), `caseData`, `questionnaireResponses`. Outputs: per-category `assessments`
(STRONG/MODERATE/WEAK/MISSING), `recommendations`, `overallScore` (60% required
completion + 40% weighted supporting), and a crucial **`userProvided`** autofill-free
sub-view (counts vault-source items only) that feeds the weighted evidence/completeness
ingredients so autofill can't inflate the score.

**Alert gating (`lib/case-strength/alert-gating.ts`).** `buildAlertGateContext` is the
profile-aware wrapper every dashboard uses — it wires `lookAheadRules` (<- profile),
`documentEscalation` (<- profile), and `targetFilingDate` (<- metadata) so V2/V3 can't
drift. `gateAlertIssues` filters issues against the journey **frontier** (first
uncompleted step) with AHEAD suppression, an ACTIVE grace window, and BEHIND escalation.
Missing-doc issues run a 3-stage lifecycle `computeDocumentStage` (to-gather -> due-soon
-> critical), deadline-relative when a target filing date is known. Fresh-journey gating:
`hasUserEvidenceSignal` (shared definition) requires a real upload/answer;
`isMeaningfullyStarted` gates the alert stream, `isCaseHealthScorable`
(completed step + evidence signal) gates the numeric score/ring — stopping a brand-new
journey from showing a misleading ~50%. `getWeightedCaseHealthStatus` shows a calm
"Building Your Case" for low-but-clean cases instead of a red alarm.

### 4.6 IR-1 timeline engine (`lib/ir1-engine/*`) + narrative (`lib/narrative/*`)

Estimates remaining timeline by phase (USCIS -> NVC -> consulate), detects the current
stage (16 sub-stages), suppresses estimates when not meaningful (post-interview), and
produces stage-aware human-readable copy via `narrativeEngine`. Backed by
`milestones.config.ts`.

### 4.7 Document vault (`lib/document-vault/*`) + OCR (`lib/document-ocr/*`)

**Vault:** catalog of 40+ document types in `document-definitions.ts` (`ALL_DOCUMENTS`),
personalization by visa type / sponsor structure / country
(`personalization-engine.ts`), expiration tracking, Zustand store (`store.ts`), client +
server storage clients (`storage-client.ts`, `storage-server.ts`, `storage-database.ts`),
`journey-mapping.ts`, `flag-registry.ts`, and `useInitDocumentVault.ts` (prefetch on
dashboard mount). Vault files are AES-256-GCM encrypted with a **per-user** key
(`file-encryption.ts`, `SHA-256(PORTAL_WALLET_SECRET + ":" + userId)`, `RVLT` magic
header) — this per-user derivation is unique to vault files (see 23).

**OCR pipeline (`document-ocr/extractPipeline.ts`).** Note the real order (NOT a
"fallback"):

1. **OCR.space** runs only as a cheap first pass for **images under ~1 MB**; PDFs and
   large files skip it entirely.
2. **Gemini Vision runs ALWAYS** (via the Python backend) and, by default, **overwrites**
   the text-parse values — except keys in `trustedTextKeys` (MRZ fields, CNIC number),
   where the text parse wins.

Typed parsers exist for 5 doc types: `passport`, `cnic`, `birth`, `marriage`, `divorce`
(`registry.ts` `OcrDocType`), each wired to `app/api/documents/extract-*`. `registry.ts`
also routes OCR targets (`self` / `sponsor` / `beneficiary`) — the account holder maps to
BENEFICIARY, petitioner docs to `MasterProfile.sponsor.*`.

### 4.8 Reminders, notifications & CEAC (`lib/notifications/*`, `lib/reminders/*`, `lib/ceac-tracking/*`)

There are **two distinct reminder engines** (do not conflate):

- `lib/notifications/UnifiedReminderEngine.ts` — schedules reminders on step completion
  (`scheduleForStep`) and metadata change (`scheduleForMetadata`), driven by
  `reminderRegistry.ts` (`REMINDER_REGISTRY`, `getRemindersForStep`, `getCeacGroups`, ...).
- `lib/reminders/ReminderEngine.ts` — auto-generates in-app reminders (IR-1/CR-1/IR-5)
  derived from case-strength `computeDocumentStage`/`alert-gating` via
  `generateReminders(journeyId)`.

`lib/ceac-tracking/*` runs a state machine (`stateMachine.ts` `VALID_TRANSITIONS`:
at_nvc -> in_transit -> ready -> ap|issued|refused, with `refused -> issued` 221g
recovery) and schedules check reminders (`CeacReminderEngine.ts`, `recurringJobRunner.ts`).
Cron routes drive recurring jobs: `app/api/cron/ceac-reminders` (EasyCron, `x-cron-secret`),
`app/api/cron/update-tracking` (EasyPost trackers, `X-CRON-SECRET`), and
`app/api/cron/security-scan` (audit-log sweep, `Authorization: Bearer <CRON_SECRET>`).

### 4.9 Python backend (`backend/`)

FastAPI app (`backend/main.py`) registering routers under `/api/v1`: `remove_bg`, `pdf`,
`visa_checker` (prefix `/api/v1/visa-checker`), `compress`, `document_vision`. Plus
`/` and `/health`. **WhatsApp is wired but commented out** (import + registration).

- `remove_bg.py` — `/remove-bg`, `/passport-photo` (rembg/remove.bg + OpenCV face-center crop).
- `compress.py` — `/compress` (PyMuPDF + pikepdf image recompression, parallel).
- `pdf_routes.py` — `/fill-pdf` routes by `formId` to `DS260GeneratorService` /
  `PoliceLetterGeneratorService` / `AuthorityLetterGeneratorService`, else
  `PDFFillerService`; `/debug-pdf-fields/{form_id}`.
- `document_vision.py` — `/documents/vision-extract` (always returns 200); delegates to
  `services/document_ocr/vision_extractor.py`, which uses the **OpenAI Agents SDK**
  driving **Gemini `gemini-2.5-flash`** via the OpenAI-compatible endpoint, returning
  canonical MasterProfile dot-path keys.
- `visa_checker.py` — `/visa-checker/check` (visa-bulletin cutoff logic).

`app/core/form_configs/*.py` map frontend field keys -> PDF AcroForm field paths for
**10 forms: I-130, I-130A, I-129F, I-693, I-864, I-864A, I-864EZ, I-912, DS-260, and
I-485** (Adjustment of Status). `app/services/*` hold the generators/fillers +
`document_ocr/vision_extractor.py`. A WhatsApp assistant package
(`whatsapp_assistant/*`) exists but is disabled in `main.py`.

---

## 5. Important Files

| File | Why it matters |
|---|---|
| `data/visa-category/*.json` | **Source of truth** for live journeys (ir-1/ir-5/f-1/...), keyed `chapter_key`/`step_key` with `who`/`visible_when`/`dependencies`. Never hardcode stage/step IDs. |
| `data/roadmap.ts` | **Legacy** old-schema data; home/marketing pages only. Not the live journey. |
| `app/components/journey-{engine,spouse}/journeyHelpers.ts` | `getActiveStepsForStage(...)` — **always** use to filter steps; never inline. (No `lib/journeyHelpers.ts` exists.) |
| `lib/journey/config-loader.ts` + `service.ts` | JSON -> DB seeding + journey engines. |
| `app/(tools)/(visa)/visa-category/[visa-journey]/page.tsx` | Dashboard router: IR-1/CR-1 -> `RoadmapLayoutSpouse`, chapters-schema -> `RoadmapLayoutEngine`, stages-schema -> legacy `Wizard`. |
| `lib/entitlements/config.ts` + `hardLockRules.ts` | All feature/step gating. |
| `lib/case-strength/categories/*` + `case-narrative.ts` + `alert-gating.ts` | Category profiles, weighted score, alert gating. |
| `lib/autoFill/mapper.ts` | Profile <-> form field registry. |
| `app/(main)/dashboard/hooks/useWizard.ts` | Client journey state + Supabase sync. |
| `app/context/*` | Global providers: Auth, Plan, UserProfile, Language. |
| `lib/supabase/{client,server,middleware,admin}.ts` | Supabase clients. |
| `middleware.ts` + `lib/supabase/middleware.ts` | Route protection, admin gate, crawler/body-size guards. |
| `lib/security/*` | Rate limiting, audit log, alerting, upload validation. |
| `types/profile.ts` | `MasterProfile` — top level IS the beneficiary; nested sponsor/relationship/etc. |
| `backend/main.py`, `backend/app/services/*`, `backend/app/core/form_configs/*` | FastAPI routers, generators/fillers, 10 form field maps (incl. I-485). |

---

## 6. Request Flow (example: completing a journey step)

```
User clicks "Mark complete" in dashboard
  |  useWizard.toggleComplete(stepKey)  -> optimistic local state update
  |  POST /api/steps/{uuid}?action=complete
  |  route handler -> StepService.completeStep()  (lib/journey/service.ts)
  |  data-access UPDATE steps row (status=completed)
  |  background: ProgressCalculationService recalcs chapter + journey %
  |  StepCompletionEngine unlocks dependent steps
  |  ReminderEngine / UnifiedReminderEngine schedule next-step reminders
  |  Supabase triggers cascade progress; updated_at touched
  |  response -> useWizard reconciles -> UI re-renders progress bar + Case Health
```

Auth gate runs first in `middleware.ts` (`updateSession`) on every non-static request.

---

## 7. Data Flow (example: uploading a document)

```
User uploads file in Document Vault
  |  POST /api/documents/upload  (magic-byte + size validation via lib/security)
  |  (PDF > 4MB) -> Python /api/v1/compress
  |  AES-256-GCM encrypt (per-user key = PORTAL_WALLET_SECRET + userId) -> Supabase Storage
  |  metadata row written (journey_documents / vault tables)
  |  OCR: extract-* route -> OCR.space (small images) + Gemini Vision (always) -> profile keys
  |  autoFillForm() pre-fills MasterProfile via UserProfileContext.updateProfile()
  |  EvidenceGapEngine + weighted Case Health re-score the case
  |  UI shows updated checklist %, risk flags, recommendations
```

Sensitive case fields are encrypted at the API layer; `case_data` writes also **auto-sync
into `user_profiles.profile_details`** so tools share one profile.

---

## 8. State Management

- **Global (React Context, in `app/context/`):**
  - **AuthContext** — Supabase user/session/profile, `isAdmin`, MFA state
    (`mfaPending`), sign-in/out (via `/api/auth/login`, not direct Supabase), OAuth.
  - **PlanContext** — real vs effective tier (dev override), purchased add-ons, and the
    entitlement helpers. Maps DB `core/plus/pro` -> tiers; POSTs `/api/plan/reconcile` on load.
  - **UserProfileContext** — loads `MasterProfile` once ("fill once, use everywhere"),
    optimistic merge + debounced save to `/api/profile/complete` (server-side encryption).
  - **LanguageContext** — `en` / `ur` i18n with `t()`/`tRaw()`, persisted to localStorage.
- **Server cache:** SWR for reads; 30s cache on `journeys/initialize`.
- **Client stores (Zustand):** document vault (`lib/document-vault/store.ts`), PDF editor
  (`usePDFStore`), progress tree (`lib/progress-tree-store.ts`), guides nav-guard.
- **Journey state:** `useWizard` (optimistic local + Supabase) is authoritative for the
  active journey.
- **Form drafts:** localStorage + backend (`visa_forms_draft` table) for multi-step forms.

---

## 9. Authentication Flow

- **Provider:** Supabase Auth (email/password + Google OAuth + TOTP MFA).
- **Signup:** `/api/auth/signup` (strong password rules, disposable-email blocking,
  enumeration-safe responses, constant-time email compare, email confirmation w/ 24h
  token via Resend) -> confirm at `/api/auth/confirm-email`. Rate-limited.
- **Login:** client `signIn` (AuthContext) routes through **`/api/auth/login`** (not
  direct Supabase) to enable throttling + audit. **Progressive rate limiting**: IP-based
  (`checkRateLimitRedis`, 10 attempts / 5 min) + email/account **progressive lockout**
  (`checkLoginLockout` / `recordFailedLogin` / `resetLoginAttempts`, escalating windows
  5->30 attempts). 429 responses carry `Retry-After`. If MFA enrolled, challenge via
  `/api/auth/mfa/verify-login`. OAuth returns through `/api/auth/callback`.
- **Sessions:** cookie-based; `middleware.ts` -> `lib/supabase/middleware.updateSession`
  runs on every request, refreshes the session, protects routes, and enforces admin
  access via **email whitelist (`ADMIN_EMAILS`) AND DB `role === "admin"`** (both
  required), with audit logging of admin access.
- **MFA:** enroll/verify/disable under `/api/auth/mfa/*`; UI in
  `app/components/auth/MFASetup.tsx`.
- **Authorization:** RLS at the DB level (own-row); admin routes double-check whitelist + role.

---

## 10. Database Architecture (Supabase Postgres)

Schema lives entirely in `supabase/migrations/*` (~73 files; never edit RLS in the
dashboard — always a migration). The journey core was added in four `20260403_*`
migrations (`create_{journeys,chapters,steps,case_data}_table.sql`).

**Core journey tables**

| Table | Purpose | Key columns |
|---|---|---|
| `journeys` | One per user immigration case | `user_id`, `journey_type` (IR1/IR5/...), `filing_method`, `sponsor_structure`, `current_chapter_id`, `current_step_id`, `status`, `completion_percentage` |
| `chapters` | Stage subdivisions of a journey | `journey_id`, `chapter_key`, `chapter_number`, `status`, `display_order`, `is_visible`, `visible_when` (JSONB) |
| `steps` | Granular action items | `chapter_id`, `step_key`, `step_type`, `tool_integration`, `dependencies` (JSONB), `visible_when` (JSONB), `status`, `substatus`, `is_required`, `metadata` |
| `case_data` | Flexible key-value case facts | `journey_id`, `data_key`, `data_value` (JSONB), `source`, `is_verified`, `version`, `previous_value` (audit) |

**Supporting journey tables** — `journey_documents` (+ `journey_id` on documents),
`tool_sessions`, `journey_portal_records` (**no passwords**), `journey_appointments`,
`journey_reminders`.

**Other domains** (by migration): `receipt_records`, `payments` + subscription fields,
`user_profiles` (+ `profile_details` JSONB, trigger on signup), guides architecture
(`guides`, `user_guides`, `user_guide_steps`, `user_guide_files`, `guide_feedback`),
consultation bookings, applicants, appointments, document vault tables + secured storage,
translation documents, profiles/roles, `visa_security` questions, interview-prep
(sessions/answers/results/progress), risk flags, visa-checker sessions/answers, CEAC
(`ceac_case_status`, `ceac_scheduled_notifications`, reminder types), notifications
(`notifications`, `app_notifications`, scheduled), `feature_usage`, `visa_forms_draft`,
`tool_reviews`, `user_quick_access`, and **`audit_logs`** (security trail; drives
`cron/security-scan`). Recent migrations (`20260715_fix_rls_security_gaps`,
`20260731_*`, `20260717/18_*`) harden RLS/constraints/columns.

> **Rate limiting is NOT a DB table** — it is code-only (in-memory + optional Upstash
> Redis). Big "combined"/"run_all" files exist
> (`20260403_HASHIR_ALL_TABLES_COMBINED.sql`, `20260228_31_run_all_migrations.sql`) — be
> careful about apply order and duplication.

**Cross-cutting DB patterns:** RLS on every user table (own-row), GIN indexes on JSONB,
triggers that cascade step -> chapter -> journey progress and auto-touch `updated_at`,
reminder-flag resets on appointment reschedule.

---

## 11. API Architecture (Next.js route handlers under `app/api/`)

The Next.js API layer is a **Backend-for-Frontend** (~149 handlers across ~41 groups): it
authenticates, enforces entitlements, encrypts sensitive data, talks to
Supabase/Stripe/Gemini/EasyPost/Resend/USCIS/Sheets, and proxies CPU/AI work to the
Python backend. Highlights:

| Group | Notable endpoints | Talks to |
|---|---|---|
| `auth/*` | login (rate-limited), signup, callback, confirm-email, forgot/reset-password, `mfa/*`, check-admin | Supabase Auth, Resend, Redis |
| `stripe/*` | `checkout`, `verify-session` (idempotent self-heal & source of truth), `webhook`, `portal` | Stripe |
| `plan/*` | `plan/reconcile` (never-downgrade tier self-heal) | Supabase |
| `journeys|chapters|steps|case_data` | journey CRUD, `journeys/initialize` (combined load + bg step-sync), `case_data/validate` | Supabase, journey engines |
| `journey/*` | `journey/marriage-check` (singular; distinct from `journeys`) | Supabase |
| `documents/*` | upload (validate + encrypt + compress), download/preview/export, `config`, `mark-read`, `extract-{passport,cnic,birth,marriage,divorce}` | Supabase Storage, Python, Gemini |
| `upload/*` | generic authenticated file upload tied to an appointment | Supabase Storage |
| `profile/*` | get/save with field encryption, `complete`, `merge` | Supabase |
| `portal-wallet/*` | encrypted NVC/USCIS/courier credentials, one-time `reveal` | Supabase (AES-256-GCM) |
| `visa-security/*` | user CEAC/portal security-question CRUD | Supabase |
| `receipt/*` | I-797 register/ocr/journey/lookup (stores into `case_data`) | Supabase, `lib/register-receipt` |
| `uscis-case-status/*` | live USCIS **Torch API** OAuth case-status lookup | USCIS Torch API |
| `iv-status/*` | "documentarily complete" lookup from `backend/data/iv_data.json` | static data |
| `guides/*` | guides wizard (start/save/progress/upload/my-guides) + admin feedback triage | Supabase |
| `quick-access/*` | dashboard "quick access" tile CRUD (`user_quick_access`) | Supabase |
| `user-dashboard/*` | `services-status` (PCC/consult/translation), `analytics` aggregation | Supabase |
| `visa-forms/[formCode]/*` | save/resume multi-step form drafts (`visa_forms_draft`) | Supabase |
| `consultation`, `book-appointment`, `document-translation/*`, `police-verification/*` | service bookings + admin workflows + payments | Supabase, Resend, Stripe |
| `interview-prep/*`, `visa-checker/*` | sessions, answers, AI coaching (`ai-improve`) | Supabase, Gemini |
| `ceac/status`, `easypost/*`, `cron/*` | case-status state machine, courier tracking + webhooks, scheduled jobs (`ceac-reminders`, `update-tracking`, `security-scan`) | Supabase, EasyPost |
| `chat` | proxies to Python `ask-whatsapp` | Python backend |
| `create-pdf`, `convert-pdf` | PDF generation/conversion | Python backend |
| `admin/*` | appointments, police, translations, reviews, visa-cases, guide feedback, announce-feature | Supabase, Resend |
| `dev/*` | dev-only debug (`debug-reminders`, `seed-notifications`); hard-404 in production | Supabase |
| `analytics`, `notifications`, `feature-usage`, `feedback`, `reviews` | GA4 + app telemetry/feedback (feedback also -> Google Sheets) | GA4, Supabase, Sheets |
| `v1/journeys/[id]/*`, `v2/ir1-estimate` | RESTful journey-scoped resources; IR-1 estimate | Supabase, ir1-engine |

**Conventions:** auth via Supabase session; admin via whitelist + DB role; webhooks
verified by HMAC signature (Stripe, EasyPost) and made idempotent via event IDs; cron via
shared secret (header style varies: `x-cron-secret` vs `Authorization: Bearer`); localized
error codes (`E.*` / `msg()` from `lib/errors`).

---

## 12. Business Logic — where it actually lives

**In `lib/`, not in components or route handlers.** Route handlers are thin. The real
domain logic:

- Journey progression & visibility -> `lib/journey/service.ts` + `config-loader.ts`
- Feature/step gating -> `lib/entitlements/*`
- Form auto-fill -> `lib/autoFill/*`
- Case scoring & evidence gaps -> `lib/case-strength/*` (profiles + weighted score),
  `lib/journey/evidence-gap/*`
- Timeline/stage -> `lib/ir1-engine/*`, `lib/narrative/*`, `milestones.config.ts`
- Reminders -> `lib/notifications/*`, `lib/reminders/*`, `lib/ceac-tracking/*`
- Security -> `lib/security/*` (rate limiting, audit, alerting, upload validation)
- Heavy PDF/AI -> Python `backend/app/services/*`

Components consume these via hooks/contexts; they should not re-implement domain rules.

---

## 13. Services

- **`lib/services/*`** — `DataValidationService`, `ToolIntegrationService`,
  `consultationService`/`consultationVisibility`, `paymentService`.
- **Journey services** — `JourneyService`, `StepService`, `CaseDataValidationEngine`
  (`lib/journey/service.ts`).
- **Stripe** — `lib/stripe/{config,utils}.ts`. **Plan** — `lib/plan/reconcile.ts`.
- **Email/notify** — `lib/email/resend.ts`; `lib/notifications.ts` (root `"use server"`
  file: Resend email + in-app notification creation from `NOTIFICATION_TEMPLATES`).
- **Reviews** — `lib/reviews/data-access.ts` (service-role writes to `tool_reviews`).
- **Guides** — `lib/guides/*` (wizard session hooks + nav-guard store).
- **Python services** — `pdf_filler`, `ds260_generator`, `police_letter_generator`,
  `authority_letter_generator`, `document_ocr/vision_extractor`, `whatsapp_assistant/*` (disabled).

---

## 14. Utilities

- `lib/constants/countries.ts`, `lib/errors/*` (localized errors), `lib/formConfig/*`
  (frontend form definitions for **10 forms incl. I-485**), `lib/register-receipt/*`
  (I-797 parsing/validation: `isValidReceiptNumber`, `normalizeReceipt`),
  `lib/hooks/*` (`useIR1Status`, `useHideOnFooter`), `lib/usage/*` (feature-usage quotas:
  `checkFeatureUsage`, `useFeatureAccess`), `lib/plan/reconcile.ts`,
  `lib/feature-flags.ts` (`IR5_ENABLED`), `lib/journey-lock.ts` (14-day CEAC lock),
  `lib/policy-data.ts` (legal/policy page content; **no `lib/policies/` dir exists**),
  `lib/analytics.ts` (GA4 wrapper), `lib/googleSheets.ts` (feedback append),
  `lib/validation/*`.
- UI utils: `cn()` (clsx + tailwind-merge), shared modals/inputs in `app/components/shared/*`.

---

## 15. Components (Frontend)

**shadcn primitives:** `components/ui/*` + custom extras (LanguageToggle, spinner, lamp,
lens, compare, confetti).

**Feature components (`app/components/`):**

- **Journey dashboards:** `journey-spouse/*` (`RoadmapLayoutSpouse`, IR-1/CR-1 "V2" UI)
  and `journey-engine/*` (`RoadmapLayoutEngine`, `DashboardView`, generic chapters-schema
  "V3" UI); shared `case-health/*` (`CaseHealthCalculation`, `CaseHealthOverview`).
- **Entitlements/monetization:** `LockedFeature`, `PageGate`, `UpgradeModal`, `ResultGate`
  (result-level lock), `StepEntitlementBanner`, `PlanTierDevToggle`.
- **Journey visualization:** `progress-tree/ProgressTree`, `IR-pathway-roadmap/*`,
  confetti on finish.
- **PDF:** `pdf-editor/*` (draggable text/shapes/signature), `pdf-tools/PdfConverter`.
- **Documents:** `document-vault/*` (`DocumentWizard`, `DocumentUploadModal` w/ OCR
  auto-fill, `DocumentCard`, `DocumentPreviewModal`, notification center),
  `document-translation/*`.
- **Forms & questionnaire:** `forms/auto-visaform-filling/MultiStepForm`,
  `questionnaire/DocumentQuestionnaire`.
- **Interview prep:** `InterviewModeTabs` (prep/rapid/mock).
- **Guides:** guides wizard components + admin feedback triage.
- **Layout:** `layout/*` (`ClientHeader`, `Footer`, `MegaMenu`, `ClientWidgets`).
- **Shared:** `AuthRequiredModal`, `CountryAutoComplete`, `ConfirmationModal`,
  `MFAPromptModal`, `ToastProvider`, `UrduKeyboard`, `DataTable`.
- **Chat:** `FloatingChatWidget` -> `ChatInterface`.

Pattern: shadcn primitives at the base, thin custom wrappers, composition over
inheritance, i18n via `useLanguage().t()`, gating via `usePlan()`.

---

## 16. Custom Hooks

- `app/(main)/dashboard/hooks/useWizard.ts` — journey state + Supabase sync (most important).
- `lib/autoFill/useAutoFill.ts` — profile-driven form auto-fill + live save.
- `lib/hooks/useIR1Status.ts`, `useHideOnFooter.ts`.
- `lib/document-vault/useInitDocumentVault.ts` — vault prefetch on dashboard mount.
- `lib/guides/*` — guide session/save/step/upload/feedback hooks.
- `lib/usage/useFeatureAccess.ts` — quota-aware feature access.
- `lib/interview-prep/useQuestionSpeech.ts`, `useVoiceEngine.ts` — TTS + speech-to-text.
- Context consumers: `useAuth`, `usePlan`, `useUserProfile`, `useLanguage`, `useToast`.
- Stores expose hooks: `useDocumentVaultStore`, `usePDFStore`.

---

## 17. Middleware

`middleware.ts` (root) matches all non-static routes and:
- calls `lib/supabase/middleware.updateSession(request)` — refreshes the Supabase session,
  redirects unauthenticated users from protected routes and authenticated users from auth
  pages, and enforces admin-only access (email whitelist **AND** DB role, audit-logged).
- enforces **API body-size limits** (`assertMiddlewareBodySize`).
- injects **`X-Robots-Tag: noindex, nofollow`** on a hardcoded `PRIVATE_PREFIXES` list
  (crawler guard).

Security HTTP headers (X-Frame-Options DENY, nosniff, HSTS, Referrer-Policy,
Permissions-Policy, XSS) are applied globally via `next.config.mjs` `headers()`.

---

## 18. Configuration

- **Env (`.env.local`):** Supabase URL/anon/service-role keys, `STRIPE_*` + webhook
  secret, `RESEND_*`, `GEMINI_API_KEY`, `EASYPOST_*`, `USCIS_*` (Torch API), GA4 creds,
  `GOOGLE_SERVICE_ACCOUNT_JSON` (Sheets), `UPSTASH_REDIS_*` (optional), `ADMIN_EMAILS`,
  `SECURITY_ALERT_EMAIL`, `PORTAL_WALLET_SECRET` / profile encryption key,
  `NEXT_PUBLIC_API_URL` (Python backend), `NEXT_PUBLIC_ENABLE_IR5` /
  `NEXT_PUBLIC_ENVIRONMENT` (IR-5 flag), `CRON_SECRET`. Backend `.env`:
  `GEMINI_API_KEY`/`GEMINI_KEY`, `REMOVE_BG_API_KEY` (optional), `SUPABASE_*`,
  `CORS_ORIGINS`.
- **Build/runtime:** `next.config.mjs` (headers, image remote patterns, `canvas` aliased
  off for pdfjs, **eslint+ts errors ignored at build**, `outputFileTracingIncludes` to
  bundle `data/**` into API routes), `tsconfig.json` (`@/*` -> root), `vercel.json`,
  `runtime.txt` (python-3.10.14), `tailwind.config.ts`, `components.json`, `jest.config.ts`.

---

## 19. External Integrations

| Service | Use | Auth/Config |
|---|---|---|
| **Supabase** | DB, Auth (+MFA, OAuth), Storage, Realtime, RLS | URL + anon/service-role keys |
| **Stripe** | Subscriptions, add-ons, billing portal, webhooks | secret key + webhook signing secret; `verify-session` is the source of truth |
| **Google Gemini** | Vision OCR (always-run), AI coaching, chat | API key; backend uses OpenAI-compatible endpoint w/ `gemini-2.5-flash` |
| **OCR.space** | Fast OCR first pass for small (<1MB) images | API key |
| **USCIS Torch API** | Live receipt case-status lookup | OAuth (sandbox/prod), in-memory token cache |
| **EasyPost** | Courier shipment tracking + webhooks | API key; HMAC-verified webhooks |
| **Resend** | Transactional email + security alerts | API key |
| **Upstash Redis** | Distributed rate limiting (optional) | REST URL + token; fails open to in-memory |
| **Google Analytics 4** | Admin analytics | service-account credentials |
| **Google Sheets** | Feedback append | `GOOGLE_SERVICE_ACCOUNT_JSON` |
| **remove.bg / rembg / MODNet** | Passport-photo background removal | remove.bg key optional; rembg local fallback |
| **Geoapify** | Country/address autocomplete | client key |

---

## 20. Design Patterns

- **Backend-for-Frontend (BFF):** `app/api/*` mediates all external calls.
- **Service / Engine layer:** `lib/journey/service.ts` engines, `lib/services/*`.
- **Strategy / registry:** case-strength `categories/*` profiles
  (`resolveCaseStrengthProfile`), `FIELD_MAPPINGS`, reminder registry, evidence
  requirements, form configs.
- **Config-driven behavior:** `visible_when`/`dependencies` JSONB drive UI; entitlement
  table drives gating.
- **State machine:** CEAC tracking, milestone progression.
- **Provider/Context + observer:** React Contexts; Supabase Realtime.
- **Optimistic UI + reconcile:** `useWizard`, profile updates.
- **Singleton:** browser Supabase client.
- **Fallback chain / fail-open:** OCR.space + Gemini Vision (vision authoritative); Redis
  rate limiter fails open to in-memory; `plan/reconcile` fails open.

---

## 21. Application Lifecycle

1. **Frontend boot:** root `app/layout.tsx` mounts providers (Auth -> Plan -> UserProfile
   -> Language -> Toast).
2. **Request:** `middleware.ts` refreshes session + guards routes + crawler/body guards.
3. **Auth resolves:** AuthContext loads user; PlanContext loads tier (after
   `/api/plan/reconcile`); UserProfileContext loads MasterProfile once.
4. **Journey:** dashboard resolves the visa slug -> renderer, calls `useWizard` ->
   `journeys/initialize` (create-from-config if new).
5. **Interaction:** optimistic updates -> API -> engines -> Supabase (+ triggers) -> reminders.
6. **Background:** cron routes run CEAC reminders, tracking updates, security scans.
7. **Backend boot:** FastAPI registers routers + CORS; stateless per-request work.

---

## 22. Error Handling Strategy

- Centralized localized errors in `lib/errors` (`E.*` IDs + `msg()`).
- API routes return appropriate HTTP codes with error codes; 429 + `Retry-After` on rate
  limits.
- Webhooks always return 200 (Stripe/EasyPost) and rely on idempotent reconciliation;
  `stripe/verify-session` self-heals missed activations.
- Vision OCR endpoint **never throws** — returns `ok:false` so the frontend keeps the
  prior result.
- Python backend offloads CPU work to thread pools and falls back gracefully.

---

## 23. Security

- **AuthZ:** Supabase RLS (own-row) on every user table; admin = email whitelist **AND**
  DB role, audit-logged in middleware.
- **Rate limiting (`lib/security/*`):** IP-based (`rate-limit-redis.ts`, Upstash, fails
  open to in-memory) + progressive per-account lockout (`rate-limit.ts`, escalating
  windows) on login/signup/confirm-email.
- **Audit + alerting:** `audit-log.ts` (service-role writes to `audit_logs`),
  `alerting.ts` (`runSecurityScan` scans for brute-force/spray thresholds, emails
  `SECURITY_ALERT_EMAIL` / first `ADMIN_EMAILS`; also driven daily by `cron/security-scan`).
- **Upload hardening:** `upload-limits.ts` (55MB global cap + per-profile MIME/size),
  `file-content.ts` (magic-byte validation), `request-body.ts` (body-size), `sanitize.ts`
  (DOMPurify), `safeRedirect.ts` (open-redirect guard).
- **Encryption at rest (two schemes — do not conflate):**
  - **Portal-wallet + profile fields:** `lib/encryption.ts`, AES-256-GCM, format
    `gcm:<iv>:<tag>:<cipher>`, key = **global** `SHA-256(PORTAL_WALLET_SECRET)` (NOT
    per-user), legacy CryptoJS fallback.
  - **Document Vault files:** `lib/document-vault/file-encryption.ts`, AES-256-GCM,
    **per-user** key `SHA-256(PORTAL_WALLET_SECRET + ":" + userId)`, `RVLT` binary header.
- **MFA:** TOTP enroll/verify/disable.
- **Webhooks:** HMAC signature verification (Stripe, EasyPost) + event-ID idempotency.
- **Crawler/headers:** `X-Robots-Tag` on private prefixes + HSTS, X-Frame-Options DENY,
  nosniff, Referrer-Policy, Permissions-Policy.
- **Input hardening:** strong password rules, disposable-email blocking, Zod validation,
  enumeration-safe auth responses.
- Portal references store **no passwords** in `journey_portal_records`.

---

## 24. Performance Optimizations

- **Optimistic updates** + background recalculation (journey progress).
- **Single combined `journeys/initialize`** (one round-trip, 30s server cache, background
  step-sync) instead of many calls.
- **Profile centralization** ("fill once, use everywhere"); **debounced saves**; **SWR**.
- **Vault prefetch** on dashboard mount (`useInitDocumentVault`).
- **DB:** GIN indexes on JSONB, partial indexes for reminder queries, trigger-based cascades.
- **PDF compression** offloaded to a parallel thread pool in Python.
- **Code splitting / lazy load** (Next.js route-level; pdf.js on demand).
- **Auto-compress** large uploads before storage; image resize before OCR.

---

## 25. Important Relationships (dependency map)

```
UI components (app/components, components)
        | use hooks/contexts
        v
React Contexts (Auth . Plan . UserProfile . Language)  <- lib/entitlements, types/profile
        |
useWizard / useAutoFill / tool hooks
        | fetch
        v
app/api/* route handlers (BFF: auth, validate, encrypt, rate-limit)
        | delegate
        v
lib/* engines & services (journey, case-strength/categories, ir1-engine, reminders,
                          autoFill, security)
        | data-access
        v
Supabase (Postgres + RLS + triggers, Auth, Storage, Realtime)
        ^
        +-- Python FastAPI backend (PDF fill/generate/compress, vision OCR, passport photo)
External: Stripe . Resend . EasyPost . Gemini . USCIS . GA4 . Sheets . OCR.space . Upstash
```

---

## 26. Critical Development Rules

1. **`visible_when` must be fully evaluated — never short-circuit.** Use
   `getActiveStepsForStage()` in `app/components/journey-engine/journeyHelpers.ts` (spouse
   copy in `journey-spouse/`); never filter steps inline. New conditions -> update the
   helper first, then the JSON.
2. **Live journey source of truth is `data/visa-category/*.json`, NOT `data/roadmap.ts`.**
   Step visibility, `who`, filing branching, and stage order come from the per-category
   JSON (keyed `chapter_key`/`step_key`). `roadmap.ts` / `lib/steps.ts` are legacy
   marketing-only. Do not hardcode stage/step IDs anywhere.
3. **Plan tiers gate everything.** Hard-lock rules live **only** in
   `lib/entitlements/hardLockRules.ts`. Never add feature-access logic elsewhere.
4. **State sync is bidirectional.** `useWizard` <-> Supabase, and profile <-> case data
   via `syncCaseDataToProfile()` / `syncProfileToCaseData()`. Change journey shape ->
   update both.
5. **Never edit RLS in the dashboard.** All policy changes go through `supabase/migrations/`.
6. **Case-strength is category-scalable.** Add a category via `categories/<slug>.ts` +
   registry; reuse `COMMON_STEP_CHECKERS`; keep displayed math bound to `CASE_SCORE_WEIGHTS`.
7. Keep domain logic in `lib/`; route handlers thin; components presentational.
8. Encrypt sensitive data at the API layer; never store passwords in portal records.

---

## 27. Developer Notes (pitfalls & tight coupling)

- **Builds hide type/lint errors** (`ignoreBuildErrors`/`ignoreDuringBuilds`). Run
  `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`.
- **`data/roadmap.ts` is a trap** — it is legacy and NOT the live journey. So is
  `lib/steps.ts`. The live source is `data/visa-category/*.json`.
- **`lib/journeyHelpers.ts` does not exist** — `getActiveStepsForStage` lives under
  `app/components/journey-{engine,spouse}/journeyHelpers.ts` (two parallel copies).
- **Two dashboard renderers** — `journey-spouse` (IR-1/CR-1) and `journey-engine`
  (chapters-schema, IR-5+). Editing one does not change the other; shared logic must go
  into `lib/case-strength/*` + `app/components/case-health/*`.
- **Two encryption schemes** — global key for portal-wallet/profile fields
  (`lib/encryption.ts`), per-user key for vault files
  (`document-vault/file-encryption.ts`). Don't assume per-user everywhere.
- **Two reminder engines** — `notifications/UnifiedReminderEngine` (registry) vs
  `reminders/ReminderEngine` (case-strength/document-driven). They are separate.
- **In-code "IR-5 only" comments on the weighted score are stale** — IR-1 also uses the
  weighted model now (`categories/ir1.ts` `caseScore: { model: "weighted" }`).
- **Two component roots** (`components/` and `app/components/`).
- **Two+ profile representations** — flat encrypted columns, `profile_details` JSONB,
  `case_data` rows that auto-sync into it. Changing one can desync others.
- **DB tier naming drift** — DB may use `core/plus/pro`; `PlanContext.DB_TIER_MAP`
  normalizes to `basic/premium/executive`.
- **`ROUTE_FEATURE_MAP` is commented out** — gating is result-level now, not route-level.
- **IR-5 is flag-gated** (`IR5_ENABLED`); hidden on production by default.
- **Rate limiting is code/in-memory (+ optional Redis), not a DB table.**
- **`canvas` is aliased away** for pdfjs. **WhatsApp assistant is disabled** in
  `backend/main.py`. **MODNet** is a git submodule.
- **Stripe truth = `verify-session`**, not the webhook.
- **`outputFileTracingIncludes`** bundles `data/**` into API routes (routes read
  `data/visa-category/*.json` at runtime).
- Migrations include big "combined"/"run_all" files — mind apply order and duplication.

---

## 28. Architecture Summary

Rahvana is a **Next.js 15 + Supabase + Python FastAPI** immigration platform. The frontend
serves marketing/auth/tool/dashboard routes and uses `app/api/*` as a **BFF** that
authenticates, rate-limits, enforces plan entitlements, encrypts sensitive data, and
brokers calls to Supabase, Stripe, Gemini, EasyPost, USCIS, Resend, Sheets, and the Python
backend. **Domain logic lives in `lib/`** — most importantly the **journey engine**
(`lib/journey/config-loader.ts` + `service.ts`) which turns the per-category
`data/visa-category/*.json` (chapters -> steps with `who` / `visible_when` /
`dependencies`) into per-user Supabase rows, cascades progress, and evaluates conditional
visibility. Dashboards route by visa slug to `RoadmapLayoutSpouse` (IR-1/CR-1) or the
generic `RoadmapLayoutEngine` (IR-5+). **Entitlements** (`lib/entitlements/*`) gate every
feature/step by tier (free/basic/premium/executive). A **central `MasterProfile`** feeds
**auto-fill** (`lib/autoFill/*`) into USCIS forms (filled/generated by the Python backend,
10 forms incl. I-485), while **case-strength** (category profiles + a weighted Case Health
score), **evidence-gap**, **IR-1 timeline**, and **reminder** engines provide guidance.
State is optimistic-then-synced via `useWizard`, with bidirectional profile<->case-data
sync. Supabase enforces security via RLS + triggers; sensitive data is AES-256-GCM
encrypted; a `lib/security/*` suite adds rate limiting, audit logging, and alerting.

---

## 29. File Importance Ranking

**Critical (must understand the system)**
- `data/visa-category/*.json`, `app/components/journey-{engine,spouse}/journeyHelpers.ts`,
  `lib/journey/config-loader.ts`, `lib/journey/service.ts`
- `app/(tools)/(visa)/visa-category/[visa-journey]/page.tsx` (dashboard router)
- `lib/entitlements/config.ts`, `lib/entitlements/hardLockRules.ts`
- `app/(main)/dashboard/hooks/useWizard.ts`
- `app/context/{AuthContext,PlanContext,UserProfileContext}.tsx`
- `types/profile.ts`, `lib/autoFill/mapper.ts`
- `lib/case-strength/categories/*`, `case-narrative.ts`, `alert-gating.ts`
- `supabase/migrations/20260403_*` (journey core), `lib/supabase/middleware.ts`, `middleware.ts`
- `backend/main.py`, `backend/app/services/pdf_filler.py`, `backend/app/core/form_configs/*`

**Important (feature development)**
- `lib/journey/evidence-gap/engine.ts`, `app/components/case-health/*`, `lib/ir1-engine/*`,
  `milestones.config.ts`, `lib/narrative/*`
- `lib/notifications/*`, `lib/reminders/*`, `lib/ceac-tracking/*`
- `lib/security/*`, `lib/document-vault/*`, `lib/document-ocr/*`, `lib/formConfig/*`, `lib/stripe/*`
- `app/api/{stripe,journeys,steps,case_data,documents,profile,guides,uscis-case-status}/*`
- `app/components/entitlements/*`, `app/components/forms/*`, `app/components/document-vault/*`
- `lib/feature-flags.ts`, `lib/journey-lock.ts`, `lib/plan/reconcile.ts`, `lib/usage/*`
- `data/interview-categories/*`, `data/visa-checker/*`, `types/journey-support.ts`

**Secondary (helpful)**
- `components/ui/*` (shadcn), `app/components/shared/*`, `app/components/layout/*`
- `lib/constants/*`, `lib/errors/*`, `lib/policy-data.ts`, `app/translations/*`
- Marketing/legacy (`data/roadmap.ts`, `lib/steps.ts`), `backend/scripts/*`, `__tests__/*`

**Ignore**
- `node_modules/`, `.next/`, `.swc/`, `backend/.venv/`, `backend/__pycache__/`,
  `backend/modnet/` internals, `*.log`, `tsconfig.tsbuildinfo`, `package-lock.json`,
  `uploads/`, generated PDFs/artifacts.

---

## 30. Token-Optimized Summary (condensed mental model)

**What it is.** Rahvana/Arachnie = a U.S. **IR-1/CR-1 spouse-visa journey platform** for
Pakistani applicants, expanding to **IR-5 (parent)** and student visas. Stack:
**Next.js 15 App Router + React 19 + TypeScript + Tailwind/shadcn + Zustand** frontend;
**Supabase** (Postgres + RLS + Auth/MFA/OAuth + Storage + Realtime); **Python FastAPI**
backend for PDF + AI work; **Stripe / Resend / Gemini / EasyPost / USCIS / GA4 / Sheets /
OCR.space / Upstash** integrations. Deployed on Vercel + Render.

**Shape.** `app/` has route groups `(auth)`, `(main)`, `(tools)`, `admin/`, and
**`app/api/*` (~149 handlers, ~41 groups) acting as a BFF**. Domain logic is in **`lib/`**.
Live journey config is in **`data/visa-category/*.json`**. DB schema is in
**`supabase/migrations/`** (~73 files). Shared types in **`types/`**.

**Core model.** `data/visa-category/*.json` is the **source of truth**: journey ->
chapters -> **steps**, each step carrying `who` (petitioner/beneficiary/both),
`visible_when` (JSONB), `dependencies`, and filing branching via
`visible_when.filingMethod`. `lib/journey/config-loader.ts` + `service.ts` seed these into
Supabase rows (`journeys`/`chapters`/`steps`/`case_data`) with ProgressCalculation,
ConditionalLogic, StepCompletion, Validation engines. **Always filter steps via
`getActiveStepsForStage()` in `app/components/journey-{engine,spouse}/journeyHelpers.ts` —
never inline. `data/roadmap.ts` + `lib/steps.ts` are legacy marketing-only.** Dashboards
route by slug: IR-1/CR-1 -> `RoadmapLayoutSpouse`, chapters-schema (IR-5+) ->
`RoadmapLayoutEngine`, old stages-schema -> legacy `Wizard`.

**State.** Global React Contexts: **Auth**, **Plan** (tier + entitlements; DB
`core/plus/pro` -> `basic/premium/executive`; reconcile on load), **UserProfile** (one
`MasterProfile`, top level IS the beneficiary, nested sponsor/relationship/etc.),
**Language**. Active journey driven by **`useWizard.ts`** (optimistic local <-> Supabase,
single combined `journeys/initialize`). Profile and journey `case_data` sync
bidirectionally and mirror into `user_profiles.profile_details`.

**Monetization/gating.** Tiers `free|basic|premium|executive`. All access logic in
`lib/entitlements/*` — `config.ts` (feature -> 8-state table + add-ons + prices) and
`hardLockRules.ts` (per-step locks). Route-level gating (`ROUTE_FEATURE_MAP`) is commented
out; gating is now **result-level** (`ResultGate`). Payments: Stripe `checkout` ->
`webhook` (always 200) -> **`verify-session` is the source of truth**; `plan/reconcile`
self-heals (never downgrades).

**Auto-fill + forms.** `lib/autoFill/mapper.ts` maps `MasterProfile` <-> USCIS forms. The
**Python backend** fills/generates **10 forms (I-130/130A/129F/693/864/864A/864EZ/912/
DS-260/I-485)** via `app/core/form_configs/*`, plus PDF compression, passport-photo bg
removal, visa-bulletin checker, and **Gemini Vision OCR** (via
`vision_extractor.py`, OpenAI Agents SDK + `gemini-2.5-flash`). OCR chain:
OCR.space (small images, first pass) + **Gemini Vision (always-run, authoritative,
overwrites text except MRZ/CNIC)**; vision endpoint never throws.

**Guidance engines.** `lib/case-strength/*` is category-scalable via `categories/*`
profiles (`resolveCaseStrengthProfile`, IR-1 default + IR-5), `COMMON_STEP_CHECKERS`, a
**weighted Case Health score** (`CASE_SCORE_WEIGHTS` = Evidence 40 / Consistency 30 /
Completeness 20 / Risk 10, both IR-1 + IR-5), a shared `CaseHealthCalculation` explainer,
`alert-gating.ts` (`buildAlertGateContext`, frontier gating, 3-stage doc escalation,
`hasUserEvidenceSignal` fresh-journey suppression), and `evidence-gap/engine.ts`
(injectable requirements: IR-1 = 7 categories, IR-5 = IDENTITY + FAMILY_INTEGRATION only,
autofill-free `userProvided` view). `ir1-engine/*` + `milestones.config.ts` + `narrative/*`
handle stage/timeline. **Two reminder engines**: `notifications/UnifiedReminderEngine`
(registry) and `reminders/ReminderEngine` (document-driven); `ceac-tracking` state machine
+ `cron/*`.

**Security.** RLS (own-row) on every user table; admin = `ADMIN_EMAILS` whitelist **AND**
DB role (audit-logged). `lib/security/*` adds **rate limiting** (Upstash Redis fail-open +
progressive account lockout), **audit logging** (`audit_logs`), **alerting**
(`runSecurityScan` + `cron/security-scan`), and upload hardening (magic-byte + size).
**Two encryption schemes**: global key `SHA-256(PORTAL_WALLET_SECRET)` for
portal-wallet/profile fields (`gcm:` prefix), per-user key for vault files (`RVLT` header).
Webhooks HMAC-verified + idempotent. `middleware.ts` adds `X-Robots-Tag` + body-size guards.

**Gotchas.** Builds **ignore TS/ESLint errors** (run `tsc --noEmit`). `data/roadmap.ts` +
`lib/steps.ts` are legacy traps. No `lib/journeyHelpers.ts`. Two dashboard renderers, two
encryption schemes, two reminder engines. "IR-5 only" score comments are stale (IR-1 uses
weighted too). IR-5 is flag-gated. Rate limiting is code, not a DB table. Two component
roots, two+ profile representations. Don't hardcode stage/step IDs — read
`data/visa-category/*.json`. Keep domain logic in `lib/`, route handlers thin, components
presentational.

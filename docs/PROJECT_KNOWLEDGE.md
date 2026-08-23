# Rahvana — Project Knowledge Document

> **Purpose of this file.** A single source of truth describing how the entire Rahvana
> platform works, so an LLM (or a new senior engineer) can reason about the system
> without reading every source file. Read this first; only open files when you need
> exact line-level detail. Section 30 is a condensed mental model for low-token recall.

---

## 1. Project Overview

**Rahvana** (internal codename **Arachnie**) is a **U.S. immigration journey
platform** focused primarily on the **IR-1 / CR-1 spouse visa** path for applicants in
Pakistan (with adjacent support for K-1, IR-2, IR-5, and several student visas).

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

- **Beneficiary** (the immigrating spouse, usually in Pakistan) and **Petitioner /
  Sponsor** (the U.S. citizen). The product models both roles explicitly.
- **Admins** — review consultations, translations, police-verification requests, visa
  cases, and reviews through an admin dashboard.

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
             Google Gemini (AI/OCR), Google Analytics 4, OCR.space (free OCR).
```

**Overall workflow.** A user signs up → completes a profile / eligibility
questionnaire → a **journey** is created from `data/roadmap.ts` (stages → chapters →
steps). As they progress, the wizard syncs state to Supabase, unlocks dependent steps,
gates premium features by plan tier, and fires reminders. Tools (form-filler, document
vault, case-strength, interview-prep) read/write the same central profile + case data.

---

## 2. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend framework** | Next.js 15 (App Router) + React 19 | File-based routing, server + client components, route handlers act as a BFF |
| **Language** | TypeScript (strict) | Type safety across a large domain model |
| **Styling** | TailwindCSS 4, shadcn-ui (Radix primitives), tailwind-merge, CVA | Utility-first + accessible component primitives |
| **Animation** | Framer Motion / `motion`, GSAP, AOS, canvas-confetti | Marketing polish + journey celebration UX |
| **Client state** | Zustand (stores), React Context (global), SWR (server cache) | Lightweight stores for PDF/vault; Context for profile/plan/auth |
| **Forms** | React Hook Form + Zod | Validation for forms + questionnaires |
| **Auth + DB + Storage** | Supabase (Postgres, Auth w/ MFA + Google OAuth, Storage, Realtime, RLS) | Single managed backend for data, identity, files |
| **Payments** | Stripe (subscriptions, one-time add-ons, webhooks, billing portal) | Tiered monetization |
| **Email** | Resend | Transactional email (confirmations, notifications) |
| **AI** | Google Gemini (`@google/generative-ai`) + Gemini via OpenAI-compatible endpoint | OCR/vision extraction, AI coaching, chat |
| **Python backend** | FastAPI + Uvicorn | CPU/AI-heavy work: PDF fill/generate/compress, rembg, vision OCR |
| **PDF (frontend)** | pdf-lib, pdfjs-dist, pdfmake, jspdf, react-pdf, pdfkit | In-browser PDF view/edit/generate |
| **PDF/image (backend)** | PyMuPDF (fitz), reportlab, pikepdf, Pillow, OpenCV, rembg, MODNet | Form fill, generation, compression, background removal |
| **OCR** | Tesseract.js (client), OCR.space (free), Gemini Vision (fallback for Urdu/non-Latin) | Document data extraction |
| **Courier tracking** | EasyPost | Track document shipments to USCIS/NVC |
| **Analytics** | Google Analytics 4 Data API | Admin analytics dashboard |
| **Deployment** | Vercel (Next.js), Render (FastAPI backend) | `vercel.json`, `runtime.txt` (python-3.10.14) |

Build uses **Turbopack** (`next build --turbopack`). Note: `next.config.mjs` sets
`eslint.ignoreDuringBuilds` and `typescript.ignoreBuildErrors` to **true** — type/lint
errors do **not** fail the build (run `npx tsc --noEmit` manually to check types).

---

## 3. Folder Structure

| Folder | Purpose |
|---|---|
| `app/` | Next.js App Router. Route groups `(auth)`, `(main)`, `(tools)`; `app/api/*` route handlers; `app/components/*` (feature components); `app/context/*` (global providers); `app/translations/*` (i18n JSON). |
| `components/` | Shared/reusable UI: `ui/` (shadcn primitives), `magicui/`, `pricing/`, `resources/`, `tools/`, `chat/`. |
| `lib/` | **The business-logic core.** Engines and services: journey, entitlements, autoFill, case-strength, ir1-engine, document-vault, document-ocr, notifications/reminders, ceac-tracking, supabase clients, stripe, email, etc. |
| `data/` | Static domain config: `roadmap.ts` (IR-1 journey source of truth), `interview-categories/*`, `visa-checker/*`, `visa-category/*`. |
| `types/` | Shared TypeScript types (`profile.ts`, `journey-support.ts`, `roadmap.ts`, etc.). |
| `backend/` | Python FastAPI service: `app/api/v1/*` endpoints, `app/services/*`, `app/core/form_configs/*` (USCIS form field maps), `data/` (visa bulletin JSON), `modnet/` (git submodule, background-removal model). |
| `supabase/` | `migrations/*` SQL — the database schema, RLS policies, triggers. |
| `actions/` | Next.js server actions (where used). |
| `scripts/` | Maintenance/dev scripts. |
| `__tests__/` | Jest tests (case-strength, consultation, stripe). |
| `public/` | Static assets, videos, sample docs. |
| `middleware.ts` | Root middleware → delegates to `lib/supabase/middleware` for auth/session. |
| `milestones.config.ts` | Root milestone definitions for case timeline tracking. |

**Two component locations** (important): top-level `components/` (mostly shadcn
primitives + a few shared tool widgets) **and** `app/components/` (feature-specific
components). When adding UI, check both.

---

## 4. Module-by-Module Deep Explanation

### 4.1 Journey Engine (`lib/journey/*`) — the heart of the product

**Why it exists:** the entire app is a stateful, conditional, multi-actor checklist.
This module turns the static `data/roadmap.ts` config into live, per-user database rows
and manages progression.

**Key files**

- `lib/journey/service.ts` — composes six engines/services:
  - **ProgressCalculationService** — cascades completion *up*: step → chapter → journey,
    auto-completing a chapter/journey at 100%.
  - **ConditionalLogicEngine** — evaluates `visible_when` JSONB against `case_data` to
    decide chapter/step visibility. **Never short-circuit this** (see CLAUDE.md).
  - **StepCompletionEngine** — marks steps complete, unlocks dependents, handles
    "skipped but persistent" optional steps (e.g., police certificate stays visible).
  - **CaseDataValidationEngine** — validates case data against rules/completeness.
  - **JourneyService / StepService** — high-level CRUD: create journey from config, get
    details with visibility + dependencies, complete/skip/uncomplete.
- `lib/journey/data-access.ts` — raw Supabase CRUD for journeys/chapters/steps.
- `lib/journey/config-loader.ts` — loads a journey config and transforms it into DB rows
  + initial case-data keys.
- `lib/journey/types.ts` — `Journey`, `Chapter`, `Step`, `CaseData`, visibility/dependency results.
- `lib/journey/CaseStrengthEngine.ts` — scores case strength from docs/financial/relationship signals.
- `lib/journey/evidence-gap/engine.ts` — analyzes vault + journey docs + case data against
  IR-1/CR-1 evidence requirements → categories, missing docs, prioritized recommendations, 0–100 score.
- `lib/journey/NurtureService.ts` — engagement/nurture messaging.

**Data flow:** API routes (`app/api/journeys|chapters|steps|case_data`) → `JourneyService`/
`StepService` → `data-access` → Supabase. Completing a step triggers background progress
recalculation and reminder scheduling.

### 4.2 Wizard state hook (`app/(main)/dashboard/hooks/useWizard.ts`)

The **client-side single source of truth** for the active journey. Tracks `currentStage`,
`currentStep`, `completedSteps`, `metadata` (case data), `stepMap` (step_key → UUID), and
`filingType`. Key actions: `toggleComplete(stepKey)`, `updateMetadata(data)`,
`setStage(idx)`, `setCurrentStep(idx)`.

API touchpoints: `POST /api/journeys/initialize` (fetch/create), `PATCH /api/journeys/{id}`
(save position), `POST /api/steps/{id}?action=complete`, `POST /api/case_data` (batch
upsert). Uses **optimistic updates** + background sync. It also **bidirectionally syncs
with the profile** (CLAUDE.md: `syncCaseDataToProfile` / `syncProfileToCaseData` — changing
journey state shape means updating both directions).

### 4.3 Entitlements / plan gating (`lib/entitlements/*`)

**Why:** every feature is gated by plan tier. Hard-lock rules live **only** here.

- Tiers: `PlanTier = "free" | "basic" | "premium" | "executive"`.
  - **free** — not a real product tier; shows locked previews to drive signup.
  - **basic** — roadmap structure only (no guides/vault/tracking).
  - **premium** — guided journey: guides, vault, tracking, most tools.
  - **executive** — full suite: adds 221g planner, mock interview, expert support, services.
- `config.ts` — master entitlement table mapping 30+ features → per-tier `FeatureState`
  (`full | list_only | save_only | locked_upgrade | locked_buy | limited | executive_only |
  preview`) + an add-on catalog.
- `hardLockRules.ts` — **critical.** `getStepLockStatus()` decides if a specific journey
  step is accessible for a tier; `getModalFeatureForTier()` maps required plan → feature hint.
- `helpers.ts` — `getEffectiveEntitlement`, `canUse`, `isLocked`, `lockHint`, `upgradeCTA`, `tierPrice`.
- `routeFeatureMap.ts` / `stepFeatureMap.ts` — map routes and journey steps to feature keys.

Note `DB_TIER_MAP` in `PlanContext`: DB historically used `core/plus/pro`, mapped to
`basic/premium/executive`.

### 4.4 Auto-fill (`lib/autoFill/*`)

Bidirectional mapping between the **MasterProfile** and any USCIS form.

- `mapper.ts` — central `FIELD_MAPPINGS` registry (480+ field variations); `autoFillForm()`
  (profile → form) and `mapFormToProfile()` (form → profile). Handles nested paths and
  special cases (income normalization, gender/visa-type normalization).
- `useAutoFill.ts` — React hook consuming `UserProfileContext`; returns `autoFilledData`,
  `saveFormData()`, `onFieldChange()` for live sync.
- `journeyProfileBridge.ts` — bridges journey case data ↔ master profile.
- `formOverrides.ts` — per-form overrides (e.g., I-130 Part 1 name = sponsor, not account holder).

### 4.5 Case strength (`lib/case-strength/*`)

Scores IR-1/CR-1 case strength grounded in USCIS policy + practitioner patterns. Submodules:
`risk-detector`, `evidence-classifier` (REQUIRED vs SUPPORTING), `civil-docs` (Pakistani
docs: nikah nama, NADRA MRC), `consistency` + `consistency-intelligence` (cross-document
name/DOB matching with severity grades), `doc-scoring`, `step-checkers`, `aggregate-issues`,
`case-narrative` (English narrative + health status + 0–100 overall score).

### 4.6 IR-1 timeline engine (`lib/ir1-engine/*`) + narrative (`lib/narrative/*`)

Estimates remaining timeline by phase (USCIS → NVC → consulate), detects the current stage
(16 sub-stages), suppresses estimates when not meaningful (post-interview), and produces
stage-aware human-readable copy via `narrativeEngine`. Backed by `milestones.config.ts`.

### 4.7 Document vault (`lib/document-vault/*`) + OCR (`lib/document-ocr/*`)

Vault: catalog of 40+ document types, personalization by visa type / sponsor structure /
country, expiration tracking, Zustand store (`store.ts`), client + server storage clients.
OCR pipeline: image → OCR (OCR.space) → typed parser (passport/cnic/birth/marriage/divorce)
→ cross-check → auto-fill profile. Falls back to **Gemini Vision** (via the Python backend)
for non-Latin/Urdu docs.

### 4.8 Reminders & notifications (`lib/notifications/*`, `lib/reminders/*`, `lib/ceac-tracking/*`)

`UnifiedReminderEngine` schedules reminders on step completion and metadata changes (with
suppression based on stage/completed steps). `reminderRegistry.ts` defines triggers/delays.
`ceac-tracking` runs a state machine over CEAC statuses and schedules check reminders.
Cron routes (`app/api/cron/ceac-reminders`, `app/api/cron/update-tracking`) drive recurring jobs.

### 4.9 Python backend (`backend/`)

FastAPI app (`backend/main.py`) registering routers under `/api/v1`:

- `remove_bg.py` — `/remove-bg`, `/passport-photo` (rembg/remove.bg + OpenCV face-center crop).
- `compress.py` — `/compress` (PyMuPDF + pikepdf image recompression, parallel).
- `pdf_routes.py` — `/fill-pdf` (fills USCIS templates via `PDFFillerService`, or generates
  DS-260 / police / authority letters from scratch); `/debug-pdf-fields/{form_id}`.
- `document_vision.py` — `/documents/vision-extract` (Gemini Vision OCR fallback; always 200).
- `visa_checker.py` — `/visa-checker/check` (visa-bulletin cutoff logic from `data/visa-checker-dates.json`).

`app/core/form_configs/*.py` map frontend field keys → PDF AcroForm field paths for
I-130, I-130A, I-129F, I-693, I-864/A/EZ, I-912, DS-260. `app/services/*` hold the
generators/fillers + `document_ocr/vision_extractor.py` (Gemini 2.5 Flash via
OpenAI-compatible endpoint, returns canonical MasterProfile dot-path keys). A WhatsApp
assistant exists but is currently disabled in `main.py`.

---

## 5. Important Files

| File | Why it matters |
|---|---|
| `data/roadmap.ts` | **Source of truth** for the IR-1 journey (stages/chapters/steps, `who`, `filingType`, `visible_when`). Never hardcode stage/step IDs elsewhere. |
| `lib/journeyHelpers.ts` | `getActiveStepsForStage(stage, filingType, metadata)` — **always** use this to filter steps; never filter inline. |
| `lib/journey/service.ts` | Journey engines (progress, conditional logic, completion, validation). |
| `lib/entitlements/config.ts` + `hardLockRules.ts` | All feature/step gating. |
| `lib/autoFill/mapper.ts` | Profile ↔ form field registry. |
| `app/(main)/dashboard/hooks/useWizard.ts` | Client journey state + Supabase sync. |
| `app/context/*` | Global providers: Auth, Plan, UserProfile, Language. |
| `lib/supabase/{client,server,middleware,admin}.ts` | Supabase clients for browser/server/middleware/service-role. |
| `middleware.ts` | Route protection entry point. |
| `milestones.config.ts` | 13 ordered milestones + progress/delay detection. |
| `types/profile.ts` | `MasterProfile` — the central applicant+sponsor+relationship model. |
| `next.config.mjs` | Security headers, `canvas` aliasing, build error suppression. |
| `backend/main.py` | FastAPI router registration + CORS. |

---

## 6. Request Flow (example: completing a journey step)

```
User clicks "Mark complete" in dashboard
  ↓  useWizard.toggleComplete(stepKey)  → optimistic local state update
  ↓  POST /api/steps/{id}?action=complete
  ↓  route handler → StepService.completeStep()  (lib/journey/service.ts)
  ↓  data-access UPDATE steps row (status=completed)
  ↓  background: ProgressCalculationService recalcs chapter + journey %
  ↓  StepCompletionEngine unlocks dependent steps
  ↓  UnifiedReminderEngine schedules next-step reminders
  ↓  Supabase triggers cascade progress; updated_at touched
  ↓  response → useWizard reconciles → UI re-renders progress bar
```

Auth gate runs first in `middleware.ts` (`updateSession`) on every non-static request.

---

## 7. Data Flow (example: uploading a document)

```
User uploads file in Document Vault
  ↓  POST /api/documents/upload
  ↓  (PDF > 4MB) → Python /api/v1/compress
  ↓  AES-256-GCM encrypt (key = PORTAL_WALLET_SECRET + userId) → Supabase Storage
  ↓  metadata row written (journey_documents / vault tables)
  ↓  OCR: extract-* route → Gemini Vision → canonical profile keys
  ↓  autoFillForm() pre-fills MasterProfile via UserProfileContext.updateProfile()
  ↓  EvidenceGapEngine + CaseStrengthEngine re-score the case
  ↓  UI shows updated checklist %, risk flags, recommendations
```

Sensitive case fields are encrypted at the API layer; `case_data` writes also **auto-sync
into `user_profiles.profile_details`** so tools share one profile.

---

## 8. State Management

- **Global (React Context, in `app/context/`):**
  - **AuthContext** — Supabase user/session/profile, `isAdmin`, MFA state, sign-in/out, OAuth.
  - **PlanContext** — real vs effective tier (with dev override), purchased add-ons, and the
    entitlement helpers (`canUse`, `isLocked`, `lockHint`, …). Maps DB `core/plus/pro` → tiers.
  - **UserProfileContext** — loads `MasterProfile` once ("fill once, use everywhere"),
    optimistic merge + debounced save to `/api/profile/complete` (server-side encryption).
    Eliminates 15+ duplicate profile fetches.
  - **LanguageContext** — `en` / `ur` i18n with `t()`/`tRaw()`, persisted to localStorage,
    backed by `app/translations/{en,ur}.json`.
- **Server cache:** SWR for data fetching where used.
- **Client stores (Zustand):** document vault (`lib/document-vault/store.ts`), PDF editor
  (`usePDFStore`), journey/roadmap demo stores.
- **Journey state:** `useWizard` (optimistic local + Supabase) is authoritative for the active journey.
- **Form drafts:** localStorage + backend (`visa_forms_draft` table) for multi-step forms.

---

## 9. Authentication Flow

- **Provider:** Supabase Auth (email/password + Google OAuth + TOTP MFA).
- **Signup:** `/api/auth/signup` (strong password rules, disposable-email blocking, email
  confirmation w/ 24h token via Resend) → confirm at `/api/auth/confirm-email`.
- **Login:** client `signIn` (AuthContext) → if MFA enrolled, challenge via
  `/api/auth/mfa/verify-login`. OAuth returns through `/api/auth/callback`.
- **Sessions:** cookie-based; **`middleware.ts` → `lib/supabase/middleware.updateSession`**
  runs on every request (matcher excludes static assets/images), refreshes the session,
  protects routes, and enforces admin access via an email whitelist (`ADMIN_EMAILS`) + DB role.
- **MFA:** enroll/verify/disable under `/api/auth/mfa/*`; UI in `app/components/auth/MFASetup.tsx`.
- **Authorization:** RLS at the DB level (own-row access); admin routes double-check whitelist + role.

---

## 10. Database Architecture (Supabase Postgres)

Schema lives entirely in `supabase/migrations/*` (never edit RLS in the dashboard — always a
migration). The journey core was added in the `20260403_*` migrations.

**Core journey tables**

| Table | Purpose | Key columns |
|---|---|---|
| `journeys` | One per user immigration case | `user_id`, `journey_type` (IR1/IR2/…), `filing_method`, `sponsor_structure`, `current_chapter_id`, `current_step_id`, `status`, `completion_percentage` |
| `chapters` | Stage subdivisions of a journey | `journey_id`, `chapter_key`, `chapter_number`, `status`, `display_order`, `is_visible`, `visible_when` (JSONB) |
| `steps` | Granular action items | `chapter_id`, `step_key`, `step_type`, `tool_integration`, `dependencies` (JSONB), `visible_when` (JSONB), `status`, `substatus`, `is_required` |
| `case_data` | Flexible key-value case facts | `journey_id`, `data_key`, `data_value` (JSONB), `source`, `is_verified`, `version`, `previous_value` (audit) |

**Supporting journey tables** (`journey_documents`, `tool_sessions`, `journey_portal_records`,
`journey_appointments`, `journey_reminders`) — documents/upload status, save-and-resume tool
state, portal references (**no passwords** — those go in encrypted portal_wallet), medical/
interview appointments with 14d/7d/1d reminder flags, and deduplicated in-app reminders.

**Other domains** (by migration): `receipt_records`, `payments` + subscription fields,
`user_profiles` (+ `profile_details` JSONB, trigger to create on signup), guides architecture
+ feedback, consultation bookings, applicants, appointments, document vault tables + secured
storage, translation documents, profiles/roles, visa security questions, interview-prep
(sessions/answers/results/progress), risk flags, visa-checker case sessions/answers, CEAC
tracking + reminder types, scheduled + user notifications, feature usage, visa-forms drafts,
tool reviews, and payment columns on appointments/police-verification/translations.

**Cross-cutting DB patterns:** RLS on every user table (own-row), GIN indexes on JSONB
(`dependencies`, `visible_when`), triggers that cascade step → chapter → journey progress and
auto-touch `updated_at`, and reminder-flag resets on appointment reschedule.

---

## 11. API Architecture (Next.js route handlers under `app/api/`)

The Next.js API layer is a **Backend-for-Frontend**: it authenticates, enforces
entitlements, encrypts sensitive data, talks to Supabase/Stripe/Gemini/EasyPost/Resend, and
proxies CPU/AI work to the Python backend. Highlights:

| Group | Notable endpoints | Talks to |
|---|---|---|
| `auth/*` | signup, callback, confirm-email, forgot/reset-password, `mfa/*`, check-admin | Supabase Auth, Resend |
| `stripe/*` | `checkout`, `verify-session` (idempotent self-heal & source of truth), `webhook`, `portal` | Stripe |
| `journeys|chapters|steps|case_data` | journey CRUD, `journeys/initialize`, `case_data/validate` | Supabase, journey engines |
| `documents/*` | upload (encrypt + compress), download/preview/export, `extract-{passport,cnic,birth,marriage,divorce}` | Supabase Storage, Python compress, Gemini |
| `profile/*` | get/save with field encryption, `complete`, `merge` | Supabase |
| `portal-wallet/*` | encrypted NVC/USCIS/courier credentials, one-time `reveal` | Supabase (AES-256-GCM) |
| `consultation`, `book-appointment`, `document-translation/*`, `police-verification/*` | service bookings + admin workflows + payments | Supabase, Resend, Stripe |
| `interview-prep/*`, `visa-checker/*` | sessions, answers, AI coaching (`ai-improve`) | Supabase, Gemini |
| `ceac/status`, `easypost/*`, `cron/*` | case-status state machine, courier tracking + webhooks, scheduled jobs | Supabase, EasyPost, CeacReminderEngine |
| `chat` | proxies to Python `ask-whatsapp` | Python backend |
| `create-pdf`, `convert-pdf` | PDF generation/conversion | Python backend |
| `admin/*` | appointments, police, translations, reviews, visa-cases, announce-feature | Supabase, Resend |
| `analytics`, `notifications`, `feature-usage`, `feedback`, `reviews` | GA4 + app telemetry/feedback | GA4, Supabase |
| `v1/journeys/[id]/*`, `v2/ir1-estimate` | RESTful journey-scoped resources; IR-1 estimate | Supabase, ir1-engine |

**Conventions:** auth via Supabase session; admin via whitelist + role; webhooks verified by
HMAC signature (Stripe, EasyPost) and made idempotent via event IDs; localized error codes
(`E.*` / `msg()` from `lib/errors`).

---

## 12. Business Logic — where it actually lives

**In `lib/`, not in components or route handlers.** Route handlers are thin: they auth,
validate, and delegate. The real domain logic is:

- Journey progression & visibility → `lib/journey/service.ts`
- Feature/step gating → `lib/entitlements/*`
- Form auto-fill → `lib/autoFill/*`
- Case scoring & evidence gaps → `lib/case-strength/*`, `lib/journey/evidence-gap/*`
- Timeline/stage → `lib/ir1-engine/*`, `lib/narrative/*`, `milestones.config.ts`
- Reminders → `lib/notifications/*`, `lib/reminders/*`, `lib/ceac-tracking/*`
- Heavy PDF/AI → Python `backend/app/services/*`

Components consume these via hooks/contexts; they should not re-implement domain rules.

---

## 13. Services

- **`lib/services/*`** — `DataValidationService`, `ToolIntegrationService` (tool-to-tool data
  bridges), `consultationService`, `paymentService`.
- **Journey services** — `JourneyService`, `StepService`, `CaseDataValidationEngine` (`lib/journey/service.ts`).
- **Stripe** — `lib/stripe/{config,utils}.ts` (price IDs, checkout helpers).
- **Email** — `lib/email/resend.ts` (templated transactional email).
- **Python services** — `pdf_filler`, `ds260_generator`, `police_letter_generator`,
  `authority_letter_generator`, `document_ocr/vision_extractor`, `whatsapp_assistant/*`.

Each takes structured input (profile/case data/form data), produces structured output
(updated rows, scores, PDFs, extracted fields), and depends on Supabase or an external API.

---

## 14. Utilities

- `lib/constants/countries.ts`, `lib/errors/{errorIds,messages.en,index}.ts` (localized errors),
  `lib/formConfig/*` (frontend form definitions for I-130/864/DS-260/etc.),
  `lib/register-receipt/*` (I-797 parsing/validation), `lib/hooks/*`
  (`useIR1Status`, `useHideOnFooter`), `lib/usage/*` (feature-usage quotas),
  `lib/plan/reconcile.ts` (plan/add-on reconciliation after webhook delays).
- UI utils: `cn()` (clsx + tailwind-merge), shared modals/inputs in `app/components/shared/*`.

---

## 15. Components (Frontend)

**shadcn primitives:** `components/ui/*` (button, dialog, input, select, table, etc.) + custom
extras (LanguageToggle, spinner, lamp, lens, compare, confetti).

**Feature components (`app/components/`):**

- **Entitlements/monetization:** `LockedFeature` (overlay/replace/hide), `PageGate`
  (full-page lock), `UpgradeModal` (tier + add-on purchase), `ResultGate`,
  `StepEntitlementBanner`, `PlanTierDevToggle`.
- **Journey visualization:** `progress-tree/ProgressTree`, `IR-pathway-roadmap/*`
  (`RoadmapView`, `IslandCard`, `StepDialog`, `CompletionDialog`, confetti on finish).
- **PDF:** `pdf-editor/*` (thumbnails, draggable text/shapes/signature, signature tool with
  draw/type/upload), `pdf-tools/PdfConverter`.
- **Documents:** `document-vault/*` (`DocumentWizard`, `DocumentUploadModal` w/ OCR auto-fill,
  `DocumentCard`, `DocumentTableView`, `DocumentPreviewModal`, `ConfigurationWizard`,
  notification center), `document-translation/*`.
- **Forms & questionnaire:** `forms/auto-visaform-filling/MultiStepForm` (draft autosave,
  entitlement-gated preview, review page), `questionnaire/DocumentQuestionnaire` (conditional
  visibility).
- **Interview prep:** `InterviewModeTabs` (prep/rapid/mock), country select, dynamic question steps.
- **Layout:** `layout/*` (`ClientHeader`, `Footer`/`TranslatableFooter`, `MegaMenu`, `ClientWidgets`).
- **Shared:** `AuthRequiredModal`, `CountryAutoComplete` (Geoapify), `ConfirmationModal`,
  `MFAPromptModal`, `ToastProvider`, `UrduKeyboard`, `DataTable`, etc.
- **Chat:** `FloatingChatWidget` → `ChatInterface` (proxies to Python AI).

Pattern: shadcn primitives at the base, thin custom wrappers, composition over inheritance,
i18n via `useLanguage().t()`, gating via `usePlan()`.

---

## 16. Custom Hooks

- `app/(main)/dashboard/hooks/useWizard.ts` — journey state + Supabase sync (most important).
- `lib/autoFill/useAutoFill.ts` — profile-driven form auto-fill + live save.
- `lib/hooks/useIR1Status.ts` — IR-1 case status; `useHideOnFooter.ts` — UI.
- `lib/interview-prep/useQuestionSpeech.ts`, `useVoiceEngine.ts` — TTS + speech-to-text.
- Context consumers: `useAuth`, `usePlan`, `useUserProfile`, `useLanguage`, `useToast`.
- Stores expose hooks: `useDocumentVaultStore`, `usePDFStore`.

---

## 17. Middleware

`middleware.ts` (root) matches all non-static routes and calls
`lib/supabase/middleware.updateSession(request)`, which: refreshes the Supabase session
cookie, redirects unauthenticated users away from protected routes, redirects authenticated
users away from auth pages, and enforces admin-only access (email whitelist + DB role).
Security HTTP headers (X-Frame-Options DENY, nosniff, HSTS, Referrer-Policy, Permissions-
Policy, XSS) are applied globally via `next.config.mjs` `headers()`.

---

## 18. Configuration

- **Env (`.env.local`):** Supabase URL/anon/service-role keys, `STRIPE_*` + webhook secret,
  `RESEND_*`, `GEMINI_API_KEY`, `EASYPOST_*`, GA4 credentials, `ADMIN_EMAILS`,
  `PORTAL_WALLET_SECRET` / profile encryption key, `NEXT_PUBLIC_API_URL` (Python backend),
  `CRON_SECRET`. Backend `.env`: `GEMINI_API_KEY`/`GEMINI_KEY`, `REMOVE_BG_API_KEY` (optional),
  `SUPABASE_*`, `CORS_ORIGINS`.
- **Build/runtime:** `next.config.mjs` (headers, image remote patterns for unsplash/supabase,
  `canvas` aliased off for pdfjs, **eslint+ts errors ignored at build**,
  `outputFileTracingIncludes` to bundle `data/**` into API routes), `tsconfig.json`
  (`@/*` → root), `vercel.json`, `runtime.txt` (python-3.10.14), `tailwind.config.ts`,
  `components.json` (shadcn), `jest.config.ts`.

---

## 19. External Integrations

| Service | Use | Auth/Config |
|---|---|---|
| **Supabase** | DB, Auth (+MFA, OAuth), Storage, Realtime, RLS | URL + anon/service-role keys |
| **Stripe** | Subscriptions, add-ons, billing portal, webhooks | secret key + webhook signing secret; `verify-session` is the source of truth |
| **Google Gemini** | Vision OCR (Urdu/non-Latin fallback), AI coaching, chat | API key; backend uses OpenAI-compatible endpoint w/ `gemini-2.5-flash` |
| **OCR.space** | Free primary OCR (Latin docs) | API key |
| **EasyPost** | Courier shipment tracking + webhooks | API key; HMAC-verified webhooks |
| **Resend** | Transactional email | API key |
| **Google Analytics 4** | Admin analytics | service-account credentials |
| **remove.bg / rembg / MODNet** | Passport-photo background removal | remove.bg key optional; rembg local fallback |
| **Geoapify** | Country/address autocomplete | client key |

---

## 20. Design Patterns

- **Backend-for-Frontend (BFF):** `app/api/*` mediates all external calls.
- **Service / Engine layer:** `lib/journey/service.ts` engines, `lib/services/*`.
- **Data-access layer:** `lib/journey/data-access.ts` (separates SQL from logic).
- **Registry pattern:** `FIELD_MAPPINGS`, reminder registry, evidence requirements, form configs.
- **State machine:** CEAC tracking, milestone progression.
- **Strategy/Config-driven behavior:** `visible_when`/`dependencies` JSONB drive UI; entitlement table drives gating.
- **Provider/Context + observer:** React Contexts; Supabase Realtime broadcasts.
- **Optimistic UI + reconcile:** `useWizard`, profile updates.
- **Singleton:** browser Supabase client (avoids multi-tab localStorage deadlock).
- **Adapter/Fallback chain:** OCR.space → Gemini Vision; remove.bg → rembg.

---

## 21. Application Lifecycle

1. **Frontend boot:** root `app/layout.tsx` mounts providers (Auth → Plan → UserProfile →
   Language → Toast), header/footer/widgets.
2. **Request:** `middleware.ts` refreshes session + guards routes.
3. **Auth resolves:** AuthContext loads user; PlanContext loads tier; UserProfileContext
   loads MasterProfile once.
4. **Journey:** dashboard calls `useWizard` → `journeys/initialize` (create-from-config if new).
5. **Interaction:** optimistic updates → API → engines → Supabase (+ triggers) → reminders.
6. **Background:** cron routes run CEAC reminders + tracking updates.
7. **Backend boot:** FastAPI registers routers + CORS; stateless per-request work.

---

## 22. Error Handling Strategy

- Centralized localized errors in `lib/errors` (`E.*` IDs + `msg()` → `messages.en.ts`).
- API routes return appropriate HTTP codes (400/401/403/404/422/500) with error codes.
- Webhooks always return 200 (Stripe/EasyPost) and rely on idempotent reconciliation;
  `stripe/verify-session` self-heals missed webhook activations.
- Vision OCR endpoint **never throws** — returns `ok:false` so the frontend keeps the prior result.
- Python backend offloads CPU work to thread pools and falls back gracefully (e.g., returns
  original PDF if compression doesn't help).

---

## 23. Security

- **AuthZ:** Supabase RLS (own-row) on every user table; admin = email whitelist + DB role.
- **Encryption at rest:** AES-256-GCM for sensitive fields (SSN, CNIC, passport, portal
  credentials, uploaded files) with per-user keys derived from a server secret + userId;
  ciphertext marked with a `gcm:` prefix. Decrypt only on authorized read.
- **MFA:** TOTP enroll/verify/disable.
- **Webhooks:** HMAC signature verification (Stripe, EasyPost) + event-ID idempotency.
- **Headers:** HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy.
- **Input hardening:** strong password rules, disposable-email blocking, Zod validation.
- **Secrets:** env-only; service-role key used server-side only.
- Portal references intentionally store **no passwords** in `journey_portal_records`
  (credentials go to the encrypted portal-wallet flow).

---

## 24. Performance Optimizations

- **Optimistic updates** + background recalculation (journey progress).
- **Profile centralization** ("fill once, use everywhere") removes 15+ duplicate fetches.
- **Debounced saves** in UserProfileContext; **SWR** caching for reads.
- **DB:** indexes (incl. GIN on JSONB), partial indexes for reminder queries, trigger-based
  cascades instead of N round-trips.
- **PDF compression** offloaded to a parallel thread pool in Python; image draft-decode downscaling.
- **Code splitting / lazy load** (Next.js route-level; pdf.js loaded on demand).
- **Auto-compress** large uploads before storage; image resize before OCR.

---

## 25. Important Relationships (dependency map)

```
UI components (app/components, components)
        │ use hooks/contexts
        ▼
React Contexts (Auth · Plan · UserProfile · Language)  ◄── lib/entitlements, types/profile
        │
useWizard / useAutoFill / tool hooks
        │ fetch
        ▼
app/api/* route handlers (BFF: auth, validate, encrypt)
        │ delegate
        ▼
lib/* engines & services (journey, case-strength, ir1-engine, reminders, autoFill)
        │ data-access
        ▼
Supabase (Postgres + RLS + triggers, Auth, Storage, Realtime)
        ▲
        └── Python FastAPI backend (PDF fill/generate/compress, vision OCR, passport photo)
External: Stripe · Resend · EasyPost · Gemini · GA4 · OCR.space
```

---

## 26. Critical Development Rules

1. **`visible_when` must be fully evaluated — never short-circuit.** Use
   `getActiveStepsForStage()` in `lib/journeyHelpers.ts`; never filter steps inline.
   New conditions → update `journeyHelpers.ts` first, then the data file.
2. **Plan tiers gate everything.** Hard-lock rules live **only** in
   `lib/entitlements/hardLockRules.ts`. Never add feature-access logic elsewhere; never show
   premium features to free users without checking entitlements.
3. **State sync is bidirectional.** `useWizard` ↔ Supabase, and profile ↔ case data via
   `syncCaseDataToProfile()` / `syncProfileToCaseData()`. Change journey shape → update both.
4. **`data/roadmap.ts` is the source of truth.** Step visibility, `who`, `filingType`, stage
   order all come from it. Do not hardcode stage/step IDs anywhere else.
5. **Never edit RLS in the dashboard.** All policy changes go through `supabase/migrations/`.
6. Keep domain logic in `lib/`; keep route handlers thin; keep components presentational.
7. Encrypt sensitive data at the API layer; never store passwords in portal records.

---

## 27. Developer Notes (pitfalls & tight coupling)

- **Builds hide type/lint errors** (`ignoreBuildErrors`/`ignoreDuringBuilds`). A green
  deploy doesn't mean type-clean — run `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`.
- **Two component roots** (`components/` and `app/components/`) — search both.
- **Two profile representations** — flat encrypted columns *and* `profile_details` JSONB on
  `user_profiles`, plus `case_data` rows that auto-sync into it. Changing one can desync others.
- **DB tier naming drift** — DB may use `core/plus/pro`; `PlanContext.DB_TIER_MAP` normalizes
  to `basic/premium/executive`. Don't assume DB strings equal `PlanTier`.
- **`canvas` is aliased away** (false in webpack, mock in turbopack) for pdfjs — don't rely on
  native canvas server-side.
- **WhatsApp assistant is wired but disabled** in `backend/main.py`.
- **MODNet** is a git submodule (`.gitmodules`); rembg/remove.bg are the active path.
- **Stripe truth = `verify-session`**, not the webhook; webhooks always 200 and reconcile.
- **`outputFileTracingIncludes`** bundles `data/**` into API routes — needed because routes
  read `data/roadmap.ts` / interview categories at runtime.
- Migrations are dated and include big "combined"/"run_all" files
  (`20260403_HASHIR_ALL_TABLES_COMBINED.sql`, `20260228_31_run_all_migrations.sql`) — be careful
  about apply order and duplication.

---

## 28. Architecture Summary

Rahvana is a **Next.js 15 + Supabase + Python FastAPI** immigration platform. The frontend
serves marketing/auth/tool/dashboard routes and uses `app/api/*` as a **BFF** that
authenticates, enforces plan entitlements, encrypts sensitive data, and brokers calls to
Supabase, Stripe, Gemini, EasyPost, Resend, and the Python backend. **Domain logic lives in
`lib/`** — most importantly the **journey engine** (`lib/journey/service.ts`) which turns the
static `data/roadmap.ts` (stages → chapters → steps with `who` / `filingType` / `visible_when`
/ `dependencies`) into per-user Supabase rows, cascades progress, and evaluates conditional
visibility. **Entitlements** (`lib/entitlements/*`) gate every feature/step by tier
(free/basic/premium/executive). A **central `MasterProfile`** (UserProfileContext) feeds
**auto-fill** (`lib/autoFill/*`) into USCIS forms (filled/generated by the Python backend),
while **case-strength**, **evidence-gap**, **IR-1 timeline**, and **reminder** engines provide
guidance. State is optimistic-then-synced via `useWizard`, with bidirectional profile↔case-data
sync. Supabase enforces security via RLS + triggers; sensitive data is AES-256-GCM encrypted.

---

## 29. File Importance Ranking

**Critical (must understand the system)**
- `data/roadmap.ts`, `lib/journeyHelpers.ts`, `lib/journey/service.ts`
- `lib/entitlements/config.ts`, `lib/entitlements/hardLockRules.ts`
- `app/(main)/dashboard/hooks/useWizard.ts`
- `app/context/{AuthContext,PlanContext,UserProfileContext}.tsx`
- `types/profile.ts`, `lib/autoFill/mapper.ts`
- `supabase/migrations/20260403_*` (journey core), `lib/supabase/middleware.ts`, `middleware.ts`
- `backend/main.py`, `backend/app/services/pdf_filler.py`, `backend/app/core/form_configs/*`

**Important (feature development)**
- `lib/case-strength/*`, `lib/journey/evidence-gap/engine.ts`, `lib/ir1-engine/*`,
  `milestones.config.ts`, `lib/narrative/*`
- `lib/notifications/*`, `lib/reminders/*`, `lib/ceac-tracking/*`
- `lib/document-vault/*`, `lib/document-ocr/*`, `lib/formConfig/*`, `lib/stripe/*`
- `app/api/{stripe,journeys,steps,case_data,documents,profile}/*`
- `app/components/entitlements/*`, `app/components/forms/*`, `app/components/document-vault/*`
- `data/interview-categories/*`, `data/visa-checker/*`, `types/journey-support.ts`

**Secondary (helpful)**
- `components/ui/*` (shadcn), `app/components/shared/*`, `app/components/layout/*`
- `lib/constants/*`, `lib/errors/*`, `app/translations/*`
- Marketing/legal pages, `backend/scripts/*`, `__tests__/*`

**Ignore**
- `node_modules/`, `.next/`, `.swc/`, `backend/.venv/`, `backend/__pycache__/`,
  `backend/modnet/` internals, `*.log`, `tsconfig.tsbuildinfo`, `package-lock.json`,
  `uploads/`, generated PDFs/artifacts.

---

## 30. Token-Optimized Summary (condensed mental model)

**What it is.** Rahvana/Arachnie = a U.S. **IR-1/CR-1 spouse-visa journey platform** for
Pakistani applicants. Stack: **Next.js 15 App Router + React 19 + TypeScript + Tailwind/shadcn
+ Zustand** frontend; **Supabase** (Postgres + RLS + Auth/MFA/OAuth + Storage + Realtime);
**Python FastAPI** backend for PDF + AI work; **Stripe / Resend / Gemini / EasyPost / GA4 /
OCR.space** integrations. Deployed on Vercel (frontend) + Render (backend).

**Shape.** `app/` has route groups `(auth)`, `(main)` (dashboard, profile, pricing,
my-journeys), `(tools)` (case-strength, interview-prep, document-vault, document-translation,
roadmap, etc.), `admin/`, and **`app/api/*` route handlers acting as a BFF**. Domain logic is
in **`lib/`**. Static journey config is in **`data/`**. DB schema is in
**`supabase/migrations/`**. Shared types in **`types/`**.

**Core model.** `data/roadmap.ts` is the **source of truth**: a journey = stages → chapters →
**steps**, each step carrying `who` (petitioner/beneficiary/both), `filingType`
(online/paper/both), `visible_when` (JSONB condition), and `dependencies`. The **journey
engine** (`lib/journey/service.ts`) instantiates this into Supabase rows
(`journeys`/`chapters`/`steps`/`case_data`) and provides ProgressCalculation,
ConditionalLogic, StepCompletion, and Validation engines. **Always filter steps via
`getActiveStepsForStage()` in `lib/journeyHelpers.ts` — never inline, never short-circuit
`visible_when`.**

**State.** Global React Contexts: **Auth** (Supabase session, isAdmin, MFA), **Plan**
(tier + entitlement helpers; DB `core/plus/pro` → `basic/premium/executive`), **UserProfile**
(loads one `MasterProfile`, optimistic merge + debounced encrypted save — "fill once, use
everywhere"), **Language** (en/ur i18n). The active journey is driven by
**`useWizard.ts`** (optimistic local state ⇄ Supabase). Profile and journey **case_data sync
bidirectionally** (`syncCaseDataToProfile` / `syncProfileToCaseData`), and `case_data` writes
auto-mirror into `user_profiles.profile_details`. Zustand stores back the document vault and
PDF editor.

**Monetization/gating.** Tiers `free|basic|premium|executive`. **All** access logic lives in
`lib/entitlements/*` — `config.ts` (feature→tier table + add-ons) and `hardLockRules.ts`
(per-step locks). UI gates via `usePlan()` + `LockedFeature`/`PageGate`/`UpgradeModal`.
Payments: Stripe `checkout` → `webhook` (always 200) → **`verify-session` is the source of
truth** (idempotent self-heal); `lib/plan/reconcile.ts` fixes missed activations.

**Auto-fill + forms.** `lib/autoFill/mapper.ts` maps `MasterProfile` ⇄ USCIS forms via a
480+ entry registry (+ `formOverrides`). Forms are filled/generated by the **Python backend**
(`pdf_filler.py`, `ds260_generator.py`, letter generators) using
`app/core/form_configs/*` (field-key → PDF AcroForm path maps for I-130/130A/129F/693/864/
864A/864EZ/912/DS-260). The backend also does PDF compression, passport-photo background
removal (rembg/remove.bg/MODNet), the visa-bulletin checker, and **Gemini Vision OCR**
(fallback for Urdu/non-Latin docs; the OCR chain is OCR.space → Gemini Vision, and the vision
endpoint never throws — returns `ok:false`).

**Guidance engines.** `lib/case-strength/*` (risk flags, evidence classification, Pakistani
civil-doc + cross-document consistency checks, 0–100 score + narrative),
`lib/journey/evidence-gap/engine.ts` (missing-doc analysis), `lib/ir1-engine/*` +
`milestones.config.ts` + `lib/narrative/*` (stage detection across ~16 sub-stages, remaining-
timeline estimate, human copy), and `lib/notifications`/`lib/reminders`/`lib/ceac-tracking`
(reminder scheduling + CEAC state machine, driven by `app/api/cron/*`).

**Security.** Supabase RLS (own-row) on every user table; admin = `ADMIN_EMAILS` whitelist +
DB role, enforced in `middleware.ts` → `lib/supabase/middleware.updateSession`. Sensitive
fields/files/portal credentials are **AES-256-GCM** encrypted (per-user key = server secret +
userId, `gcm:` prefix), decrypted only on authorized reads. Webhooks are HMAC-verified +
idempotent. Security headers set in `next.config.mjs`. Portal records store **no passwords**.

**Gotchas.** Builds **ignore TS/ESLint errors** (run `tsc --noEmit` yourself). **Two
component roots** (`components/` + `app/components/`). **Two+ profile representations** (flat
encrypted columns, `profile_details` JSONB, `case_data`) that must stay in sync. `canvas` is
aliased away for pdfjs. RLS changes **must** be migrations. Don't hardcode stage/step IDs —
read `data/roadmap.ts`. Keep domain logic in `lib/`, route handlers thin, components
presentational.

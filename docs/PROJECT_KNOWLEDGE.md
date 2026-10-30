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
3. **Sells expert + tooling services** - tiered journey subscriptions through Stripe, plus
   standalone tools, guides and services paid with Rahvana wallet credits (consultations,
   police-certificate filing, document translation, mock interviews).

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
| **Frontend framework** | Next.js 15.5 (App Router) + React 19.1 | File-based routing, server + client components, route handlers act as a BFF |
| **Language** | TypeScript (strict) | Type safety across a large domain model |
| **Styling** | TailwindCSS 4.1, shadcn-ui (Radix primitives), tailwind-merge, CVA | Utility-first + accessible component primitives |
| **Animation** | Framer Motion / `motion`, GSAP, AOS, canvas-confetti | Marketing polish + journey celebration UX |
| **Client state** | Zustand 5 (stores), React Context (global), SWR (server cache) | Lightweight stores for PDF/vault/progress-tree; Context for profile/plan/auth |
| **Forms** | React Hook Form + Zod 4 | Validation for forms + questionnaires |
| **Auth + DB + Storage** | Supabase (Postgres, Auth w/ MFA + Google OAuth, Storage, Realtime, RLS) | Single managed backend for data, identity, files |
| **Payments** | Stripe (`stripe` v20; subscriptions, one-time add-ons, webhooks, billing portal) | Tiered monetization |
| **Email** | Resend | Transactional email (confirmations, notifications, security alerts) |
| **AI** | Google Gemini (`@google/generative-ai` on the frontend; the Python backend reaches Gemini via the OpenAI-compatible endpoint) | OCR/vision extraction, AI coaching, chat |
| **Python backend** | FastAPI + Uvicorn | CPU/AI-heavy work: PDF fill/generate/compress, rembg, vision OCR |
| **PDF (frontend)** | pdf-lib, pdfjs-dist (6.x, worker copied by `postinstall` -> `scripts/copy-pdf-worker.mjs`), pdfmake, jspdf, pdfkit | In-browser PDF view/edit/generate |
| **PDF/image (backend)** | PyMuPDF (fitz), reportlab, pikepdf, Pillow, OpenCV, rembg, MODNet | Form fill, generation, compression, background removal |
| **OCR** | OCR.space (fast first pass, small images), Gemini Vision (always-run, authoritative) | Document data extraction |
| **Courier tracking** | EasyPost | Track document shipments to USCIS/NVC |
| **Live case status** | USCIS Torch API (OAuth) | Real-time USCIS receipt-status lookup |
| **Rate limiting / locks** | Upstash Redis via its REST API (no `@upstash/*` package; optional, fails open to in-memory) | Distributed auth/endpoint throttling + the Stripe per-user checkout lock |
| **Analytics** | Google Analytics 4 Data API (`@google-analytics/data`), gtag, `@vercel/analytics` | Admin analytics dashboard + page analytics |
| **Icons** | lucide-react (primary), react-icons (e.g. TikTok) | `react-icons` is in `package.json`; a missing local install breaks the build (`npm install`) |
| **Feedback sink** | Google Sheets API | Appends user feedback to a sheet |
| **Deployment** | Vercel (Next.js), Render (FastAPI backend) | `vercel.json`, `runtime.txt` (python-3.10.14) |
| **Testing** | Jest 30 (`__tests__/`) | `npm test`, plus `test:security`, `security:deps`, `security:audit` scripts |

Build uses **Turbopack** (`next build --turbopack`). Note: `next.config.mjs` sets
`eslint.ignoreDuringBuilds` and `typescript.ignoreBuildErrors` to **true** — type/lint
errors do **not** fail the build (run `npx tsc --noEmit` manually to check types).

---

## 3. Folder Structure

| Folder | Purpose |
|---|---|
| `app/` | Next.js App Router. Route groups `(auth)`, `(main)`, `(tools)` (with nested `(tools)/(visa)` and `(tools)/(courier-registration)`), plus `admin/` and `book-consultation/`; `app/api/*` route handlers (~165 `route.ts` across ~45 groups); `app/components/*` (feature components, incl. `journey-engine/`, `journey-spouse/`, `case-health/`, `candidate/`, `payment/`, `followup/`, `visa-checker/`, `chat/`, `seo/`, `Contact/`; `journey-v3/` is a leftover holding only `RegisterReceiptStep.tsx`); `app/context/*` (global providers); `app/constants/`, `app/routes/ProtectedRoute.tsx`; `app/translations/*` (i18n JSON). |
| `components/` | Shared/reusable UI: `ui/` (shadcn primitives), `magicui/`, `pricing/`, `resources/`, `tools/`, `chat/`, `blog/`, `policy/`, `seo/`. |
| `lib/` | **The business-logic core.** Engines and services: journey, entitlements, autoFill, case-strength, ir1-engine, document-vault, document-ocr, notifications/reminders, ceac-tracking, security, guides, plan, usage, supabase clients, stripe, payments, email, interview-prep, questionnaire, visa-checker, profile, api (route guards), easypost, blog, policies, etc. (see 14). |
| `data/` | Static domain config. **`visa-category/*.json`** = the live journey source of truth (`ir-1`, `ir-2`, `ir-5`, `f-1`, and student journeys for australia, canada, china, germany, italy, uk). `roadmap.ts` = **legacy** old-schema data used only by home/marketing pages. Also `interview-categories/*`, `visa-checker/*`, and many guide/data JSON files. |
| `types/` | Shared TypeScript types (`profile.ts` = MasterProfile, `journey-support.ts`, `roadmap.ts`, `notifications.ts`, etc.). |
| `backend/` | Python FastAPI service: `app/api/v1/*` endpoints, `app/services/*`, `app/core/form_configs/*` (USCIS form field maps), `data/` (visa bulletin + `iv_data.json`), `modnet/` (git submodule, background-removal model). |
| `supabase/` | `migrations/*` SQL (~97 files) — the database schema, RLS policies, triggers. |
| `actions/` | Next.js server actions (currently only `chat-actions.ts`). |
| `scripts/` | Maintenance/dev scripts (incl. `copy-pdf-worker.mjs`, run on `postinstall`). `scratch/` holds one-off guide-registration `.mjs` scripts. |
| `__tests__/` | Jest tests: `case-strength/`, `consultation/`, `stripe/`, `candidate/`, `interview-prep/`, `questionnaire/`, `security/`, plus root tests (`candidate-sharing`, `journeyHelpers`, `profile-section-registry`, `resources-entitlement`, `sponsorship-poverty-guidelines`) and `setup.ts`. |
| `public/` | Static assets, videos, sample docs. |
| `middleware.ts` | Root middleware -> auth/session, admin gate, crawler + body-size guards. |

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
`app/(tools)/(visa)/visa-category/[visa-journey]/page.tsx`. It does NOT load JSON
dynamically: it statically imports the journeys it serves through **`JOURNEY_DATA_MAP`**
(today `ir-1`, `ir-5`, `f-1`, `germany-student-journey`) and maps URL slugs to data keys
(`ir1-journey`->`ir-1`, `ir5-journey`->`ir-5`, `f1`->`f-1`,
`germany-student`->`germany-student-journey`). If `isJourneySlug(slug)` matches a
marketing slug it renders `JourneyDetailPage` first. **Adding a category = a JSON file +
a `JOURNEY_DATA_MAP` entry + the slug map in `JourneyEnvironmentContext` (see below);
the two slug maps must stay in sync.** Pages are wrapped by `[visa-journey]/layout.tsx` ->
`JourneyLayoutClient.tsx`, which provides the `JourneyEnvironmentProvider`. Renderers:

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
- `lib/journey/journeyProgressService.ts` — `listUserJourneys`, `calculateActiveProgressFromSteps`
  (My Journeys progress; totals come from the JSON, see 27).
- `lib/journey/document-checklist/{engine,exportChecklistPDF,types}.ts` —
  `DocumentChecklistEngine`, served by `app/api/journeys/[id]/document-checklist/route.ts`
  (per-journey document checklist + PDF export; backs the `journey_documents` expiry/category
  columns, see 10).

**Journey environment + tool mode (journey vs standalone).**
- `app/context/JourneyEnvironmentContext.tsx` (+ `lib/hooks/useJourneyEnvironment.ts`) exposes
  `isInsideJourney`, `journeySlug`, `journeyDataKey`, `journeyCategory`, `candidateId` so any
  component (incl. `SiteHeader`, `EmbeddedToolContainer`) knows whether it runs inside a
  journey. Its `SLUG_TO_DATA_KEY` duplicates the slug map in `page.tsx`.
- `types/tool-mode.ts` + `lib/hooks/useResolveToolMode.ts` resolve a tool's mode:
  explicit `mode` prop > auto-detect from the journey environment > `standalone`.
- **Smart form filler** (`MultiStepForm`) uses it. *Journey mode:* draft key =
  `getCandidateJourneyKey(category, candidateId)`, candidate pre-fill + sibling-candidate draft
  inheritance, not tier-gated. *Standalone mode:* draft key `"standalone"`, no candidate data,
  gated by `plan.canUse("smart_form_filler")`; `api/visa-forms/[formCode]/progress` never falls
  back to the legacy `global` draft for standalone.

**Journey toolbox (app groups).** `types/app-groups.ts` + `lib/constants/journey-app-groups.ts`
define `JOURNEY_APP_GROUPS`: **Tools** (221g planner, interview prep, sponsorship calculator,
DQ check, photo booth, PDF toolkit, snap & sign, smart form filler), **Guides** (7 guides),
**Services** (consultation, PCC Sindh, medical booking, translation). Each item has a
`componentKey`; `TOOL_FEATURE_MAP` maps it to an entitlement feature key. `AppGroupGrid`
(in `journey-engine/`) is rendered by BOTH dashboards' `DashboardView`; clicking a group opens
`AppGroupModal` (portal, search, lock state from `useJourneyPlan`; locked items open
`UpgradeModal`). Launching an item renders it via
`app/components/journey-engine/EmbeddedToolContainer.tsx` (imported by both
`RoadmapLayoutEngine` and `RoadmapLayoutSpouse`) with `mode="journey"` and a `journeyContext`
(slug, category, `candidateId`, `backendId`, `subscriptionTier`), or a `LockedToolGate` when the
journey's tier lacks the feature (the breadcrumb label for a launched item comes from
`getAppGroupItemLabel`). **Items that are real pages (every Guide, plus the PCC filing service)
mount the actual page instead of a summary card:** they take the SAME launch path as tools
(`onLaunchTool` -> `activeToolKey` -> `EmbeddedToolContainer`), which resolves the route via
`OVERLAY_PAGE_ROUTES` / `getOverlayPageRoute()` (`lib/constants/journey-app-groups.ts`) and mounts
that page through `app/components/shared/GuidePageOverlay.tsx` with the journey tier. The URL
never changes. **For a guide (`!isTool`) that overlay renders a full-screen shell portalled to
`<body>` (`z-[9998]`): one slim 64px bar with a single close button and nothing else** - the site
header, the journey nav and the guide's own fixed `WizardHeader` are all out of view (the body
wrapper applies `[&_header.fixed]:!hidden` and zeroes the guide root's `pt-26`), and no progress
bar is added because each guide already shows its own `Step n of m`. Closing (button or Esc)
returns to the journey dashboard. Tool/form routes keep the older floating-close overlay, so a
tool that draws its own shell never ends up with two close buttons. **Guides are preloaded on both
axes**, because a guide blocks on two things a tool does not: its JS chunk and its saved progress
(`GET /api/guides/progress`, which every guide page gates behind a full-page spinner).
`preloadGuidePage(href, candidateId)` warms both - the chunk via `GUIDE_PRELOADERS`, the progress
via `preloadGuideSession()` (`lib/guides/useGuideSession.ts`) - and `AppGroupGrid` calls it on
folder hover/focus while `AppGroupModal` calls it again when the folder opens. `useGuideSession`
keeps a module-level snapshot cache (`progressCache`, 60s freshness): a warm snapshot seeds its
state and starts `loading` at `false`, so the guide renders on its first frame; local writes keep
the snapshot honest (`patchGuideSessionCache` from `saveStep`/`startSession`/`useGuideSave`), a
snapshot with no server session still falls back to this device's `localStorage` copy, and a stale
snapshot revalidates silently. The guide `loading` state of the dynamic import is likewise a blank
surface, not a spinner. Adding a guide to the toolbox = an `AppGroup` item + a `TOOL_FEATURE_MAP` entry + an
`OVERLAY_PAGE_ROUTES` entry + a `GUIDE_PRELOADERS` entry (its feature key must match the guide
page's own `PageGate`).

**Cross-journey service request directory.** The Services folder in `AppGroupModal` has a
"My Requests (all journeys)" link that opens `journey-engine/AllServiceRequestsModal.tsx`: every
Consultation / Medical / PCC / Translation request on the account (`services-status?scope=all`
via `lib/hooks/useServiceRequestDirectory.ts`), grouped by WHERE it was filed, with a detail view
and a jump to the owning journey (sets the active candidate + pushes `getJourneyHrefByType`). The
where-resolution lives in `lib/services/serviceRequestDirectory.ts` (tested in
`__tests__/service-request-directory.test.ts`) because each table tags origin differently:
Medical/PCC use `source` + `journey_slug` (authoritative category) + a candidate tag
(`candidate_id` / `metadata.candidate_id` / `[Candidate: x]` in `admin_notes`); Translation has only
`metadata.candidate_id` (category comes from that candidate's `visaCategory`); Consultation uses
`source` + `journey_slug` when journey-scoped (with candidate from `candidate_id` / `admin_notes`).
When accessed for the journey, account-wide requests (`kind: 'account'`) are excluded by default.
Untagged legacy rows resolve to `candidate-1`, matching `services-status`.

**Journey-embedded services (Medical / PCC / Consultation).** All three are tier-gated services
launched from the Services folder or from their roadmap step card, and they share one pattern:
- **UI shell:** `components/tools/JourneyServiceModule.tsx` (service tiles, lock banner, summary
  card shown only once a request exists). Tools: `MedicalAppointmentTool`, `PccFilingTool` /
  `PccFilingModule`, and **`components/tools/BookConsultationTool.tsx`** (the whole booking UI now
  lives here; `app/book-consultation/page.tsx` is a thin `Suspense` wrapper around it, so the
  standalone page and the journey use the same component). `EmbeddedToolContainer` imports
  `BookConsultationTool` statically (not `React.lazy`) so it opens with no loading flash.
- **Chrome:** `ToolModeProps.embedded` (`types/tool-mode.ts`). `false` = full-screen overlay with its
  own sticky top bar (StepView overlay mounts, e.g. spouse UI); `true` = rendered inline in the
  engine's `roadmap-main` region using the `RoadmapLayoutEngine` breadcrumb for back/close
  (passed by `EmbeddedToolContainer`).
- **Step auto-complete:** when a step card launches a tool, `RoadmapLayoutEngine.launchTool(key,
  autoCompleteStepKey)` passes `autoCompleteStepKey` to `EmbeddedToolContainer`, so finishing the
  service also ticks off that roadmap step.
- **Status sync:** `lib/journey/useJourneyServiceStatus.ts` reads `services-status?scope=journey`
  and reconciles server rows into journey metadata (medical, PCC, consultation records; the active
  consultation = earliest upcoming non-cancelled slot, else latest usable row).
- **One active request per journey** (`lib/journey/toolModeGuards.ts`): Medical locks until the
  appointment date passes (date-only, midnight compare); PCC locks while pending and for
  `PCC_LOCK_MONTHS = 4` after receipt (`pccRenewalDate`), a deliberate 2-month margin inside the
  real `PCC_VALIDITY_MONTHS = 6` (`pccExpiryDate`); Consultation (`isConsultationRequestLocked`)
  compares the full slot timestamp and never locks on cancelled/rejected sessions.
- **Origin tagging:** journey launches write `source: "journey"` + `journey_slug` + `candidate_id`
  on the row (`app/api/consultation/route.ts` forwards them for consultations), which is how
  `services-status` separates journey requests from standalone / My Resources ones.
- **Payment is decided on the server, never by the client** (all four services). A journey
  request (`source: "journey"`, plus `journey_id` / `journey_category` / candidate) is stored as
  `payment_status: paid` only after `lib/journey/journeyServiceAccess.ts`
  (`verifyJourneyServiceAccess`) finds an owned, active journey whose tier + add-ons include the
  feature (`document_translation`, `medical_booking`, `pcc_filing`, `expert_consultation`), else
  404/403 before anything is saved. Every other request is an unpaid draft (`pending`, and
  `awaiting_payment = true` for Medical / PCC) until `/api/wallet/deduct-service` charges it. The
  client's `payment_status` / `awaitingPayment` / `userId` are ignored. All booking routes
  (`book-appointment`, `police-verification/apply`, `consultation`, translation upload) require a
  session; PCC files under the session user. Journey UIs show no checkout step.
  `20261023_04_guard_service_payment_fields.sql` pins `payment_status` / `payment_id` /
  `awaiting_payment` on all four tables for `authenticated` / `anon` writes (an INSERT is unpaid,
  an UPDATE keeps the stored values), so a user's own-row write access can't mark a request paid.
- **Included counts are enforced on the server.** A plan can include a NUMBER of a service
  (Executive: 2 consultations; on lower tiers each legacy service add-on = 1 request of that
  service). After saving a journey request the route calls `spendJourneyServiceUse`
  (`lib/journey/journeyServiceAccess.ts` -> `lib/usage/consumeFeatureCredit.ts`), which spends one
  use through `increment_feature_usage_atomic` on the same counters `/api/feature-usage` uses (plan
  pool on `<feature>`, add-on pool on `<feature>:addon`); `full` access (Executive medical / PCC /
  translation) is unlimited. No use left = the row just saved is deleted and the route answers 403
  `SERVICE_LIMIT_REACHED`. Saving first means a failed save never costs a use. The counters are per
  user, not per journey (same as Photo Booth), and a use is not given back when an admin cancels.
- **Consultation routes:** `GET /api/consultation` = own bookings (by `user_id`, plus pre-login
  rows with the same email) or every booking for an admin; `PUT` = admin, except a user accepting
  one of the alternative slots proposed on their own booking; slot POST / PUT / DELETE and
  `consultation/upload` need admin / a session. A booking holds its slot unless cancelled,
  `failed`, or an unpaid draft older than 15 minutes (`slots/route.ts holdsSlot`).

**My Journeys (`app/(main)/my-journeys/page.tsx`).** Lists journeys via `listUserJourneys`
(which now also returns the journey `status`). Opening an IR-5 journey shows
`components/CandidateProfileLauncherModal.tsx` (candidates filtered by visa category; picking one
sets the active candidate and pushes the journey route; "Add" goes to
`/pricing?visa=...&action=add_candidate`, unlike `AddCandidateModal`). Other categories navigate
directly. Multi-candidate journey cards show a beneficiary-profile count.
**Journey + candidate customization:** users can rename a journey card and set a cover image
(stored in `MasterProfile.journeyCustomizations[<journey key>] = { name, image, updatedAt }`, saved
via `updateProfile(..., { immediate: true })`), and rename / set an avatar for a candidate
(`CandidateProfile.customName` / `avatarUrl`, plus optional `journeyName` / `journeyImage`).
`CandidateContext` treats a `customName` as authoritative: it is used as the label and is never
overwritten by the generic "Candidate N" default-name normalization. Images go through
`lib/journey/imageUploadHelper.ts` (client-side canvas resize to 1200px, then
`POST /api/journey/upload-image`: auth required, JPEG/PNG/WebP/GIF, 5MB cap) into the
`document-vault` storage bucket at `journey-media/<userId>/<entity>_<id>_<ts>.<ext>` (NOT
encrypted, unlike vault files). They are served back through `GET /api/journey/media?path=...`,
which requires a session and only serves paths inside the caller's own
`journey-media/<userId>/` folder (it downloads with the service-role client, so that ownership
check is the only guard; `..` is rejected and responses are `Cache-Control: private`).

### 4.2 Wizard state hook (`app/(main)/dashboard/hooks/useWizard.ts`)

The **client-side single source of truth** for the active journey. `WizardState` tracks
`currentStage`, `currentStep`, `scenarioType`, `completedSteps` (Set), `collapsedSteps`,
`role`, `filingType` (`online|paper|both`), `documentChecklist`, `docUploads`, `notes`,
`started`, `answers`, `metadata` (case data), `unresolvedTasks`, `backendId`, `stepMap`
(step_key -> DB uuid), `stepTimestamps`, and `subscriptionTier` (filled from
`journey.subscription_tier`; drives per-journey gating via `useJourneyPlan`). It accepts a
`candidateId` option so each candidate loads its own journey row. Key actions: `toggleComplete`,
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
- `config.ts` — master `ENTITLEMENTS` table (~31 active feature keys) mapping features ->
  per-tier `FeatureState` (**8 states**: `full | list_only | save_only | locked_upgrade |
  locked_buy | limited | executive_only | preview`) + add-on catalog + `TIER_PRICES`.
- `hardLockRules.ts` — **critical.** `getStepLockStatus(stepId, tier, chapterIdx, localIdx)`
  returns `{isLocked, requiredPlan, reason}`: free tier is locked past ch1/step1, then
  `HARD_LOCK_RULES` (a per-step map of *denied* tiers) applies. `step_3_12` is
  executive-only (denies free/basic/premium); `step_3_11` denies only free.
- `helpers.ts` — `getEffectiveEntitlement`, `canUse`, `isLocked`, `lockHint`, `upgradeCTA`,
  `tierPrice`.
- `stepFeatureMap.ts` — maps journey steps to feature keys.
- `routeFeatureMap.ts` — **currently commented out.** Gating strategy shifted from
  route-level walls to **result-level locking** (`ResultGate`): tools are enterable, the
  lock hits at the final output/result step.
- `resourceLinks.ts` — maps feature keys -> sales-page slugs -> demo tool routes (fixes
  add-on id mismatches).

Note `DB_TIER_MAP` in `PlanContext`: DB historically used `core/plus/pro`, mapped to
`basic/premium/executive`. `PlanContext` POSTs `/api/plan/reconcile` before reading
the tier (defensive, fail-open payment reconciliation), but this is **throttled** to
once per 24h per user via a `plan_reconciled_at_<userId>` localStorage cooldown; it is
forced only when `refresh()` is called (e.g. after checkout on the payment-success
page). This avoids a `payments` read + Stripe call on every page load (a Disk IO
source). Add-ons come from
`profile_details.purchased_addons`. Time-based lock `lib/journey-lock.ts`
(`JOURNEY_LOCK_DAYS = 14`) locks a journey 14 days after `metadata.ceacIssuedAt`
(distinct from entitlement gating).

**Per-journey (per-category) tier resolution.** Entitlements resolve against the **active
journey's category**, not just the account. `PlanContext` reads BOTH
`user_profiles.subscription_tier` (`accountTier`) AND every `journeys.subscription_tier` in
parallel, building a `journeyTiers` map keyed by base category
(`getBaseVisaCategory(journey_type)` -> tier), and exposes it. The effective `realTier` for the
active journey is: for candidate 2+ (`activeJourneyKey` like `ir5_candidate2`) ONLY that
candidate's own journey row, else `free` (it never borrows candidate-1's tier); otherwise the
`journeyTiers[activeCategory]` entry, which is the best PRIMARY row of the category (candidate
rows are excluded from it); else, if ANY journey has an
explicit tier, an **unpurchased category resolves to `free`** (so an IR-1 candidate added on an
IR-5-purchased account stays free/preview until IR-1 is bought - the existing Stripe flow, no
new billing); else the legacy `accountTier` (single-journey / pre-`subscription_tier`-column
accounts are never regressed). The active category comes from
`candidateCtx.activeCandidate.visaCategory` / `activeJourneyBase`; `maxActiveJourneyTier` stays
the account summary. This is the existing per-journey `journeys.subscription_tier` column
(`20260917` migration) that `stripe/verify-session` already writes - no new entitlement or
payment architecture. **Inside the journey dashboards, gating goes through
`useJourneyPlan(state)` (`app/context/useJourneyPlan.ts`, used by ~24 files)**, which evaluates
every entitlement against that journey's own `state.subscriptionTier` rather than the account
tier; use it (not raw `usePlan()`) for anything rendered inside a journey. Verified by `__tests__/candidate/candidate-entitlements.test.ts` (IR-5
premium + IR-1 unpurchased -> locked; buy IR-1 -> unlocks; no journey tiers -> account
fallback). One caveat to watch: if a paying account's active candidate is a stale DEFAULTED
category (e.g. an IR-1 account whose `profile.visaType` is unset defaults the candidate to
IR-5), the active category can be wrong; the defaulted-fallback neutralization in
`CandidateContext` mitigates this but relies on the profile carrying the real category.

**Multi-candidate purchases + auto-provisioning.** `MULTI_CANDIDATE_VISA_CATEGORIES` /
`isMultiCandidateCategory()` (`lib/candidate/candidateSyncService.ts`: IR-5, IR-2, CR-2, F-4) is the
single switch for "this category can hold several beneficiaries"; pricing, checkout, provisioning
and My Journeys all branch on it (do not add new `includes("ir5")` checks). The pricing page
(`app/(main)/pricing/page.tsx`) has a beneficiary step: for IR-5 the user picks a parent count, and
an account that already owns IR-5 chooses **Upgrade** (existing candidates, count forced to 1) vs
**Add candidate** (`?action=add_candidate`, also deep-linked from My Journeys). Checkout
(`app/api/stripe/checkout`) receives `{ visaCategory, candidateCount, action }`: for
multi-candidate categories the same-tier/downgrade guard and proration-upgrade path apply ONLY
when `action === "upgrade"`; otherwise the purchase is an add-candidate purchase (any tier allowed),
tagged `action` / `is_add_candidate` + `candidate_count` in session and subscription metadata.
That tag is what keeps the post-payment cleanup from cancelling it (or being cancelled by a later
primary upgrade), see 27 "One live plan per JOURNEY". On confirmation BOTH `verify-session` and the webhook call
**`provisionCandidateJourneysAndVaults()`** (`lib/candidate/candidateProvisioningService.ts`), which
replaced the old inline "find-or-insert one IR1/IR5 journey row" code. It (1) ensures the primary
journey exists (seeded from `data/visa-category/ir-1.json` / `ir-5.json` via
`createJourneyFromConfig`, raw insert as fallback) and stamps its `subscription_tier` /
`stripe_subscription_id` - except on an add-candidate purchase against an already-paid primary,
which leaves the primary's tier alone; (2) initializes candidate-1's vault; (3) appends
candidate-2+ to `profile_details.candidates` with their suffixed `journeys` rows (each carrying the
purchased tier) and isolated vaults; (4) saves the roster. Non-multi categories always provision
exactly one candidate. `verify-session` re-reads `profile_details` after provisioning before writing
the account summary, so it does not clobber the roster the provisioner just saved.

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
produces stage-aware human-readable copy via `narrativeEngine`. Files:
`lib/ir1-engine/{ir1Service,timelineEstimator,caseTypes.config,policyFlags,milestones.config}.ts`
(**`milestones.config.ts` lives in `lib/ir1-engine/`, not the repo root**), and
`lib/narrative/{narrativeEngine,apTracking}.ts` (`apTracking` = administrative-processing tracking).

### 4.7 Document vault (`lib/document-vault/*`) + OCR (`lib/document-ocr/*`)

**Vault:** catalog of 40+ document types in `document-definitions.ts` (`ALL_DOCUMENTS`),
personalization by visa type / sponsor structure / country
(`personalization-engine.ts`), expiration tracking (`expiration-tracker.ts`), Zustand store
(`store.ts`), client + server storage clients (`storage-client.ts`, `storage-server.ts`,
`storage-database.ts`), `documents.ts`, `file-utils.ts`, `journey-mapping.ts`,
`flag-registry.ts`, `candidate-sharing.ts` (cross-journey share rules, below), and
`useInitDocumentVault.ts` (prefetch on dashboard mount).

**Multi-candidate (IR-5 / IR-2).** A single petitioner can sponsor several beneficiaries
(IR-5 = Mother + Father; IR-2 = multiple children). This is modeled as **one journey per
candidate**, coordinated by a central `CandidateContext` (`app/context/CandidateContext.tsx`,
provided in `app/layout.tsx`). Candidates live on the `MasterProfile`
(`profile.candidates: CandidateProfile[]` + `activeCandidateId`; see `types/candidate.ts`),
and each candidate maps to a distinct `journey_type` via
`getCandidateJourneyKey(baseType, candidateId)` in `lib/candidate/candidateSyncService.ts`
(`ir5` for candidate-1, `ir5_candidate-2` for candidate-2, ...), so the existing
`UNIQUE(user_id, journey_type)` constraint holds without a schema change. Sponsor/petitioner
data is auto-shared across candidates (`SHARED_PETITIONER_FIELDS`) while beneficiary data is
isolated (`CANDIDATE_SPECIFIC_FIELDS`). The vault, roadmap, tools and forms all scope by the
active candidate's journey (via `useCandidate()` + `journey_id`); the vault therefore reuses
the existing per-`journey_id` scoping (no `candidate_id` column on documents). Other tables
DID gain a `candidate_id` (guides, notifications, appointments, CEAC status, portal wallet;
see 10). **Tools are journey-aware:**
case-status (`uscis_case_history` tags `_candidateId`/`_candidateName`), interview-prep, the
221g planner and the Sponsorship (I-864) calculator all resolve the active journey/candidate
from context so their state/results switch with the candidate (shared petitioner inputs stay
shared). **Candidate persistence (this was a real bug - do not regress).** Candidate roster
writes do NOT ride the debounced full-profile save. That path could drop
`profile_details.candidates` when a racing profile save serialized stale local state, so a
newly added candidate vanished on refresh. Instead `CandidateContext.addCandidate` /
`updateCandidate` call **`POST /api/candidate/create`** - a server-side read-modify-write that
upserts the candidate into `profile_details.candidates` (authoritative merge, never trusts a
whole client blob) and lazily inserts the candidate's suffixed `journeys` row for
candidate-2+. The in-context `updateProfile(..., { localOnly: true })` then updates local state
ONLY (no `/api/profile/complete` POST), and a **user-scoped** `localStorage` roster cache
(`rahvana_candidates_roster_<userId>`) bridges the pre-profile-load window. The cache key is
keyed by user id on purpose: a bare global key leaked one account's roster to another user on a
shared browser. `POST /api/profile/complete` and `/api/profile/merge` now do an explicit
update-if-exists / insert-if-missing (not a blind `upsert`, which was part of the drop). **Candidate deletion** is `POST /api/candidate/delete`: it removes the candidate from
`profile_details.candidates`, resets `activeCandidateId`, and cleans up that candidate's
`user_guides` and **its suffixed `journeys` rows** (so a deleted candidate does not leave an
orphaned journey that would keep the switcher's 2+ gate satisfied); candidate-1 (the base
journey) can never be deleted. `CandidateContext` also
exposes the canonical scope of the active journey: **`activeJourneyBase`** (e.g. "IR-1",
"IR-5") and **`activeJourneyKey`** (the `journey_type` key, `getCandidateJourneyKey(active
candidate.visaCategory, id)`), derived from the active candidate's own `visaCategory` (not an
ambient `journey_type`). UI: `CandidateSwitcherTray` (switch / add / rename) is a
**whole-journey feature rendered in the global `SiteHeader` profile dropdown** (one account,
multiple beneficiary journeys), NOT a vault-only widget. The switcher is **category-agnostic**
(decision 2): it shows only when the account genuinely has **2+ candidates/journeys** -
`isMultiCandidate` (candidate roster length > 1) OR `dedupeJourneysByType(fetchUserJourneysCached()).length >= 2`.
IR-1 is a normal candidate/journey here, no longer isolated. A **single-candidate account
shows NO switcher tray** (just its normal profile); "+ Add Candidate" stays reachable from a
dropdown entry rendered in that same profile menu (opens `AddCandidateModal`), so a
single-journey user can still start a second candidate. Counting real candidates/journeys
(never the defaulted `activeCandidate.visaCategory`) avoids the old leak where a defaulted
IR-5 candidate showed the tray for IR-1 users. The header bar also shows a small
**active-candidate badge** (same 2+ gate) so the active beneficiary is visible without opening
the tray; clicking it opens the tray.
`AddCandidateModal` is **category-agnostic** (Phase 4): it offers every relation - Mother /
Father / Stepparent / Adoptive Parent (IR-5), Child (IR-2), and **Spouse (IR-1)** - deriving
the visa category via `getVisaCategoryForRelation`. The only cardinality rule is USCIS's "one
spouse at a time": a second Spouse is blocked (Spouse hidden once one exists, and
`CandidateContext.addCandidate` throws) but this never blocks displaying/switching the one
spouse. A cross-category candidate's journey row + config are created lazily by `initialize`
on the URL that the switcher navigates to (URL base is authoritative for the category,
`candidate_id` selects within it; deliberately NOT candidate-authoritative, because a defaulted
candidate's `visaCategory` can be a stale IR-5 and would mislabel IR-1 accounts). **The journey
page (`[visa-journey]/page.tsx`) must NOT auto-redirect the URL to follow the active candidate's
`visaCategory`** - it did once, and because the primary candidate's category DEFAULTS to `IR-5`
when `profile.visaType` is unset (`getDefaultCandidatesForVisa`), that redirect bounced the user
off `ir1-journey` to `ir5-journey` and made it impossible to switch back to IR-1 (regression: "IR-1
auto-jumps to IR-5"). Navigation on an explicit switch is owned solely by `CandidateSwitcherTray`;
`AddCandidateModal` navigates to the new candidate's journey after an add (both push the URL from
the chosen category via `getJourneyHrefByType`). Keep the URL authoritative on the page. Full
design: `docs/multi-candidate-desciption.md`. **Cross-candidate document
sharing** (e.g. a petitioner doc used for both parents, OR the petitioner's passport reused on
both an IR-1 and an IR-5 journey) rides the existing **cross-journey** share
(`shareWithJourneyIds`). The rule is **category-AGNOSTIC**: both upload modals offer **every
other journey on the account, across categories** (IR-1 is a normal share target now, NOT
isolated). Which specific document is offered to a given target is decided by two rules:
(1) `isDocumentShareableAcrossCandidates` (`lib/document-vault/candidate-sharing.ts`:
petitioner/joint-sponsor/household docs shareable by default, any BENEFICIARY doc
person-specific, explicit `shareableAcrossCandidates` override on a `DocumentDefinition`) - so
only genuinely-same petitioner/sponsor documents are ever offered, and person-specific docs
(passport, CNIC, birth, medical) are never offered to any other journey; and
(2) `isDocumentApplicableToJourney` - the doc must apply to the TARGET journey's visa category.
The share targets are **checked by DEFAULT (opt-out)** so a shared petitioner document is not
re-uploaded per category; the user can untick any target (the multi-upload modal remembers
manual unticks via `manuallyUncheckedIds`). **The upload route re-enforces both rules
server-side** (`app/api/documents/upload/route.ts`): it looks up the user's own journeys
(RLS-scoped) and drops any `shareWithJourneyIds` entry that is not the user's journey, is not a
shareable doc, or does not apply to the target category - the client list is never trusted.
`DELETE /api/documents/[id]` reference-counts `storage_path` before removing the blob so
deleting one shared copy never orphans the file for the other journey.
Vault files are AES-256-GCM encrypted with a **per-user** key
(`file-encryption.ts`, `SHA-256(PORTAL_WALLET_SECRET + ":" + userId)`, `RVLT` magic
header) — this per-user derivation is unique to vault files (see 23).

**OCR pipeline (`document-ocr/extractPipeline.ts`).** Note the real order (NOT a
"fallback"):

1. **OCR.space** (`ocrSpace.ts`) runs only as a cheap first pass for **images under 1 MiB**;
   PDFs and larger files skip it entirely.
2. **Gemini Vision runs ALWAYS** (`visionFallback.ts` `callVisionFallback`, via the Python
   backend; the "fallback" name is historical) and, by default, **overwrites** the
   text-parse values — except keys in `trustedTextKeys` (MRZ fields, CNIC number), where the
   text parse wins.
3. `crossCheck.ts` compares freshly extracted passport fields against the stored profile;
   `clientImage.ts` prepares images client-side.

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
**13 forms: I-130, I-130A, I-129F, I-693, I-864, I-864A, I-864EZ, I-912, DS-260,
I-485** (Adjustment of Status)**, G-1450** (Authorization for Credit Card
Transactions)**, G-1650** (Authorization for ACH Transactions)**, and G-1651**
(Exemption for Paper Fee Payment). `app/services/*` hold the generators/fillers +
`document_ocr/vision_extractor.py`. A WhatsApp assistant package
(`whatsapp_assistant/*`) and router file (`app/api/v1/whatsapp.py`) exist on disk but are not
registered in `main.py`.

---

## 5. Important Files

| File | Why it matters |
|---|---|
| `data/visa-category/*.json` | **Source of truth** for live journeys (ir-1/ir-5/f-1/...), keyed `chapter_key`/`step_key` with `who`/`visible_when`/`dependencies`. Never hardcode stage/step IDs. |
| `data/roadmap.ts` | **Legacy** old-schema data; home/marketing pages only. Not the live journey. |
| `app/components/journey-{engine,spouse}/journeyHelpers.ts` | `getActiveStepsForStage(...)` — **always** use to filter steps; never inline. (No `lib/journeyHelpers.ts` exists.) |
| `lib/journey/config-loader.ts` + `service.ts` | JSON -> DB seeding + journey engines. |
| `app/(tools)/(visa)/visa-category/[visa-journey]/page.tsx` | Dashboard router: `JOURNEY_DATA_MAP` + slug map; IR-1/CR-1 -> `RoadmapLayoutSpouse`, chapters-schema -> `RoadmapLayoutEngine`, stages-schema -> legacy `Wizard`. |
| `app/context/JourneyEnvironmentContext.tsx` + `lib/hooks/useResolveToolMode.ts` | Inside-journey detection + journey/standalone tool mode (drafts, gating). |
| `app/context/CandidateContext.tsx` + `app/context/useJourneyPlan.ts` | Active candidate/journey scope + per-journey entitlements. |
| `lib/constants/journey-app-groups.ts` | Journey toolbox (Tools/Guides/Services) + `TOOL_FEATURE_MAP`. |
| `lib/entitlements/config.ts` + `hardLockRules.ts` | All feature/step gating. |
| `lib/case-strength/categories/*` + `case-narrative.ts` + `alert-gating.ts` | Category profiles, weighted score, alert gating. |
| `lib/autoFill/mapper.ts` | Profile <-> form field registry. |
| `app/(main)/dashboard/hooks/useWizard.ts` | Client journey state + Supabase sync. |
| `app/context/*` | Global providers: Auth, Plan, UserProfile, Language. |
| `lib/supabase/{client,server,middleware,admin}.ts` | Supabase clients. |
| `middleware.ts` + `lib/supabase/middleware.ts` | Route protection, admin gate, crawler/body-size guards. |
| `lib/security/*` | Rate limiting, audit log, alerting, upload validation. |
| `types/profile.ts` | `MasterProfile` — top level IS the beneficiary; nested sponsor/relationship/etc. |
| `backend/main.py`, `backend/app/services/*`, `backend/app/core/form_configs/*` | FastAPI routers, generators/fillers, 13 form field maps (incl. I-485, G-1450, G-1650, G-1651). |

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

- **Global (React Context, in `app/context/`).** Actual nesting in `app/layout.tsx`:
  **Toast -> Auth -> UserProfile -> Candidate -> Plan -> QuickAccess -> Wallet -> Language**, wrapping
  `ClientHeader`, `ToolsGuard{children}`, `ClientWidgets`, `Footer` (`PlanTierDevToggle` renders
  inside Plan). `ModalScrollLock` sits outside the providers (see 27).
  - **CandidateContext** — candidate roster, active candidate, `activeJourneyBase` /
    `activeJourneyKey` (see 4.7). Sits ABOVE Plan because Plan resolves the tier per active
    category.
  - **QuickAccessContext** — dashboard quick-access tiles (`/api/quick-access`).
  - **WalletContext** (`useWallet()`) — Rahvana Wallet display state for STANDALONE use:
    `balance`, `unlocks`, `isUnlocked(id, type?)`, `refreshWallet`, `launchResource`, and
    `openTopup({amount?, returnUrl?})`, which renders `app/components/wallet/WalletTopupModal`
    (packs 10/25/50/100 + custom $5-$1000). Loads `/api/wallet` on sign-in (keyed on user id),
    re-reads on tab focus at most once per 60s and after a top-up on the payment-success page.
    Fetch helpers live in `lib/wallet/client.ts`. The balance is display-only: the server
    re-checks every launch. Never use it to gate journey tools (those follow `useJourneyPlan`).
  - **JourneyEnvironmentContext** — NOT global: provided per journey page by
    `[visa-journey]/JourneyLayoutClient.tsx` (see 4.1).
  - `useJourneyPlan.ts` — hook (not a provider) for per-journey entitlements (see 4.3).
  - **AuthContext** — Supabase user/session/profile, `isAdmin`, MFA state
    (`mfaPending`), sign-in/out (via `/api/auth/login`, not direct Supabase), OAuth.
  - **PlanContext** — real vs effective tier (dev override), purchased add-ons, and the
    entitlement helpers. Maps DB `core/plus/pro` -> tiers; POSTs `/api/plan/reconcile`
    (throttled to once/24h per user via localStorage; forced on `refresh()`).
  - **UserProfileContext** — loads `MasterProfile` once ("fill once, use everywhere"),
    optimistic merge + debounced save to `/api/profile/complete` (server-side encryption).
  - **LanguageContext** — `en` / `ur` i18n with `t()`/`tRaw()`, persisted to localStorage.
- **Server cache:** SWR for reads; 30s cache on `journeys/initialize`.
- **Client stores (Zustand):** document vault (`lib/document-vault/store.ts`), PDF editor
  (`usePDFStore`) + a roadmap `useStore` (both in `lib/store.ts`), progress tree
  (`lib/progress-tree-store.ts`), guides nav-guard (`lib/guides/navigationGuardStore.ts`).
- **Journey state:** `useWizard` (optimistic local + Supabase) is authoritative for the
  active journey.
- **Form drafts:** localStorage + backend (`visa_forms_draft` table) for multi-step forms,
  **scoped by tool mode** (see 4.1 "Journey environment + tool mode"). In journey mode the
  draft key is `getCandidateJourneyKey(category, candidateId)` (localStorage backup key,
  hydration key and `visa-forms/[formCode]/progress` reads/writes are all journey-keyed) and
  reads fall back to a legacy `"global"` draft when no journey-specific one exists. In
  standalone mode the key is `"standalone"` with no `global` fallback. The form's
  beneficiary fields are also overridden from the active `CandidateProfile`
  (`fullName`/`name`/`dateOfBirth`/`placeOfBirth`/`passportNumber`/`cnic`) so each candidate's
  form pre-fills the right person.

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
  5->30 attempts; lockout is used ONLY by the login route). 429 responses carry
  `Retry-After`. If MFA enrolled, challenge via `/api/auth/mfa/verify-login`. OAuth returns
  through `/api/auth/callback`.
- **Other auth routes:** `change-password`, `forgot-password`, `reset-password`, `signout`,
  `delete-account` (writes an exit survey to `account_deletion_feedback`), `admin/logout`.
  IP rate limiting (Redis) also covers `change-password`, `forgot-password`,
  `reset-password`, `mfa/enroll`, `mfa/verify-login`. Password rules live in
  `lib/security/password.ts` (`STRONG_PASSWORD_REGEX`, `PASSWORD_REQUIREMENTS`).
- **Sessions:** cookie-based; `middleware.ts` -> `lib/supabase/middleware.updateSession`
  runs on every request, refreshes the session, protects routes, and enforces admin
  access via **email whitelist (`ADMIN_EMAILS`) AND DB `role === "admin"`** (both
  required). Only MUTATING admin requests (POST/PUT/PATCH/DELETE) are audit-logged; GETs are
  skipped to save Disk IO. Logged-in users hitting auth pages are redirected to `/admin`
  (whitelisted) or `/user-dashboard`. Note: `ADMIN_EMAILS` falls back to a hardcoded address
  in `lib/supabase/middleware.ts` when the env var is unset - always set it in prod.
- **MFA:** enroll/verify/disable under `/api/auth/mfa/*`; UI in
  `app/components/auth/MFASetup.tsx`.
- **Authorization:** RLS at the DB level (own-row); admin routes double-check whitelist + role.

---

## 10. Database Architecture (Supabase Postgres)

Schema lives entirely in `supabase/migrations/*` (~97 files; never edit RLS in the
dashboard — always a migration). The journey core was added in four `20260403_*`
migrations (`create_{journeys,chapters,steps,case_data}_table.sql`).

**Core journey tables**

| Table | Purpose | Key columns |
|---|---|---|
| `journeys` | One per user immigration case (one per candidate) | `user_id`, `journey_type` (IR1/IR5/`ir5_candidate-2`...), `filing_method`, `sponsor_structure`, `current_chapter_id`, `current_step_id`, `status`, `completion_percentage`, `subscription_tier` (default `free`), `stripe_subscription_id` |
| `chapters` | Stage subdivisions of a journey | `journey_id`, `chapter_key`, `chapter_number`, `status`, `display_order`, `is_visible`, `visible_when` (JSONB) |
| `steps` | Granular action items | `chapter_id`, `step_key`, `step_type`, `tool_integration`, `dependencies` (JSONB), `visible_when` (JSONB), `status`, `substatus`, `is_required`, `metadata` |
| `case_data` | Flexible key-value case facts | `journey_id`, `data_key`, `data_value` (JSONB), `source`, `is_verified`, `version`, `previous_value` (audit) |

> **Multi-candidate (IR-5/IR-2).** Each candidate is a separate `journeys` row with its own
> `journey_type` (`ir5`, `ir5_candidate-2`, ...); documents stay scoped by the existing
> `journey_id`. Candidate rosters live on `user_profiles.profile_details`
> (`profile.candidates`), not in a dedicated table. Later migrations DID add `candidate_id`
> to: `user_guides` (default `candidate-1`, unique constraint now per candidate, `20260919`);
> `app_notifications`, `notifications`, `appointments` (+ `candidate_name`/`candidate_role`),
> `scheduled_notifications`, `ceac_case_status` (`20260922`); `portal_wallet_credentials`
> (`20260924`). See 4.7 and `docs/multi-candidate-desciption.md`.

**Supporting journey tables** — `journey_documents` (+ `journey_id` on documents; checklist
columns `expiry_date`, `expiration_warning_days`, `is_expirable`, `expiration_status`,
`source_step_key`, `document_category` from `20260910_add_document_checklist`),
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
`tool_reviews`, `user_quick_access`, **`audit_logs`** (security trail; drives
`cron/security-scan`), `uscis_case_history` (saved USCIS status lookups, own-row RLS),
`account_deletion_feedback` (exit survey, insert-own only), and blog tables
`blog_subscribers` + `blog_broadcast_logs` (service-role only) and `blog_comments`
(threaded + moderated; public reads approved, authors edit own, admins full).
`payments.stripe_subscription_id` was added in `20260910`.

**Recent additions.**
- `20261006_add_consultation_source` - `consultation_bookings` gains `source` (default
  `'standalone'`), `journey_slug`, `candidate_id` (+ partial index on `source`), matching the
  origin tags Medical/PCC already had (see 4.1 "Journey-embedded services").
- `20261009_add_quick_access_scope` - `user_quick_access` gains `scope_type`
  (`'account'` default | `'journey'`) + `journey_id` (FK -> `journeys`, cascade delete) with a
  CHECK tying them together; the old `user_quick_access_unique` constraint is dropped in favor
  of two partial unique indexes (`(user_id, item_id)` for account scope,
  `(user_id, journey_id, item_id)` for journey scope). **Schema only so far:** no app code reads
  or writes `scope_type` yet, so every existing favorite is account-scoped.
- **Rahvana Wallet (in progress, plan: `docs/rahvana-credit-wallet-system-implementation-plan.md`).**
  `20261013_*` adds `user_wallets` (one per user, `balance >= 0`), `credit_transactions` (signed
  ledger, before/after balances, unique `stripe_session_id` + `idempotency_key`),
  `standalone_unlocked_resources` (unique per user/type/resource), RPCs
  `deduct_wallet_credits_atomic` / `credit_wallet_topup_atomic` / `record_unlocked_resource_usage` /
  `get_monthly_wallet_statement`. (The original one-time backfill `20261013_05` and its clean-ups
  `20261014_02` / `20261022_01` were folded into `20261023_02` below and deleted.)
  `20261014_01_harden_wallet_rpcs.sql` makes **all four RPCs service_role only** (they take
  `p_user_id`, so an `authenticated` grant let users mint credits / unlock for free), validates
  amounts > 0, and takes the wallet row lock BEFORE the idempotency / already-unlocked checks.
  `20261014_03_wallet_topup_refunds.sql` adds `reverse_wallet_topup_atomic` (service_role only):
  on a refunded top-up it takes credits back in proportion to Stripe's cumulative
  `amount_refunded / amount_captured` (idempotent, out-of-order safe), never below zero; credits
  already spent are recorded as `shortfall` in the refund row's metadata.
  `20261015_01_block_service_unlocks.sql` makes the deduct RPC refuse `resource_type = 'service'`
  (`SERVICE_NOT_UNLOCKABLE`): services are paid per booking and must never become a permanent
  unlock; per-booking service deduction will be a separate RPC (plan Phase 6).
  Users only SELECT their own rows; every write goes through an RPC from a server route.
  Journey plans are untouched: journey tools never spend credits. **Entitlement split (decided
  Oct 2026):** journey-embedded tools follow the journey plan (`useJourneyPlan`); STANDALONE
  tools/guides cost credits unless the user already owns standalone access (wallet unlock or a
  permanent legacy add-on). The account plan tier does NOT grant free standalone launches.
  A per-category Interview Prep purchase (`interview-prep:<slug>`) stays per-category (catalog
  `legacyAddonMatches` never maps it to the whole tool).
  **Phase 7 (legacy add-ons).** `20261023_02_sync_legacy_addon_unlocks.sql` replaces the one-time
  backfill with `legacy_addon_unlock_map()` (the catalog's `legacyAddonId` + `legacyGrantsUnlock`
  items plus `civil-guid`; `__tests__/wallet/legacyBackfill.test.ts` fails on drift) and
  `sync_legacy_addon_unlocks(user | NULL)` (service_role only, idempotent, never touches existing
  rows), run for everyone and re-run by a `user_profiles` trigger whenever `purchased_addons`
  changes. It deletes every backfilled row (no `transaction_id`) the map does not grant to that
  user's add-ons (photo / service rows, guides stored as 'tool', the whole interview-prep tool for a
  per-category purchase, retired ids), then re-syncs. Access still also comes from the live
  `purchased_addons` read in `resolveUnlockedItems`, so the rows are a mirror, not the only source.
  **`purchased_addons` and the other Stripe-written keys in `profile_details`
  (`lib/profile/serverOwnedKeys.ts`) are server-owned:** `/api/profile/complete` keeps the stored
  values whatever the client sends, and `20261023_01_protect_server_owned_profile_keys.sql` makes
  `guard_user_profile_billing` restore them on any `authenticated` write. Before this, a signed-in
  user could write their own add-on ledger (every add-on free) and a stale profile save could erase
  a purchase. Keep the SQL key list and the TS list in sync (tested).

**Security hardening.** `20260731_*`, `20260717/18_*`, and
`20260921_security_hardening_batch1`: triggers `guard_profile_role` (blocks self-setting
`profiles.role`) and `guard_user_profile_billing` (blocks self-upgrading the tier), revoked
anon writes on `profiles`/`user_profiles` and authenticated writes on `feature_usage`,
tightened policies on `police_verification_requests`, `app_notifications`,
`interview_categories`.

**Removed migration files (Oct 2026).** Deleting a file never changes a database it already ran
on (there is no Supabase CLI migration tracking; files are applied by hand), so these were dropped
as dead weight: the empty `20260715_fix_rls_security_gaps`, the psql-only
`20260228_31_run_all_migrations` helper, `20260403_HASHIR_ALL_TABLES_COMBINED` (a second copy of
the four `20260403_0x_*` tables with different constraint names; the split files are the
definition), the one-user data patch `20260915_set_user_plan_free`,
`20260228_23_create_user_journey_progress` (a legacy table no code reads or writes; it still
exists on databases that ran it), and the wallet backfill trio above.

> **Rate limiting is NOT a DB table** - it is code-only (in-memory + optional Upstash Redis).

**Cross-cutting DB patterns:** RLS on every user table (own-row), GIN indexes on JSONB,
triggers that cascade step -> chapter -> journey progress and auto-touch `updated_at`,
reminder-flag resets on appointment reschedule.

---

## 11. API Architecture (Next.js route handlers under `app/api/`)

The Next.js API layer is a **Backend-for-Frontend** (~165 handlers across ~45 groups): it
authenticates, enforces entitlements, encrypts sensitive data, talks to
Supabase/Stripe/Gemini/EasyPost/Resend/USCIS/Sheets, and proxies CPU/AI work to the
Python backend. Highlights:

| Group | Notable endpoints | Talks to |
|---|---|---|
| `auth/*` | login (rate-limited + lockout), signup, callback, confirm-email, forgot/reset/change-password, signout, delete-account, `mfa/*`, check-admin | Supabase Auth, Resend, Redis |
| `stripe/*` | `checkout` (takes `visaCategory` / `candidateCount` / `action`, or `productType: "wallet_topup"` + whole-dollar `amount` + `returnUrl`), `verify-session` (idempotent self-heal & source of truth), `webhook`, `portal`; both confirm paths call `provisionCandidateJourneysAndVaults` (see 4.3) and, for top-ups, `applyWalletTopup` (`lib/wallet/topup.ts`) | Stripe |
| `plan/*` | `plan/reconcile` (never-downgrade tier self-heal) | Supabase |
| `wallet/*` | `wallet` (GET balance + resources usable without paying), `wallet/launch-tool` (POST `{resourceType, resourceId, idempotencyKey?}`; unlocks a tool/guide at the `lib/wallet/catalog.ts` price, 402 + `deficit` / `topupAmount` when short), `wallet/transactions` (paginated own ledger, max 50/page). All auth-required, service-role after auth, filtered by the session user | Supabase |
| `journeys|chapters|steps|case_data` | journey CRUD, `journeys/initialize` (combined load + bg step-sync), `journeys/[id]/document-checklist` (`DocumentChecklistEngine`), `case_data/validate` | Supabase, journey engines |
| `candidate/*` | `candidate/create` (server-side upsert candidate into `profile_details.candidates` + lazy-insert its suffixed `journeys` row; the authoritative save path so candidates survive refresh), `candidate/delete` (remove candidate from `profile_details.candidates` + cleanup its `user_guides` and suffixed `journeys` rows; candidate-1 protected) | Supabase |
| `journey/*` | `journey/marriage-check` (singular; distinct from `journeys`), `journey/upload-image` (journey cover / candidate avatar upload, auth + 5MB image cap), `journey/media` (owner-only: session required, path must be the caller's `journey-media/<userId>/`, see 4.1) | Supabase, Storage |
| `documents/*` | upload (validate + encrypt + compress), download/preview/export, `config`, `mark-read`, `extract-{passport,cnic,birth,marriage,divorce}` | Supabase Storage, Python, Gemini |
| `upload/*` | generic authenticated file upload tied to an appointment | Supabase Storage |
| `profile/*` | get/save with field encryption, `complete`, `merge` | Supabase |
| `portal-wallet/*` | encrypted NVC/USCIS/courier credentials, one-time `reveal` | Supabase (AES-256-GCM) |
| `visa-security/*` | user CEAC/portal security-question CRUD | Supabase |
| `receipt/*` | I-797 register/ocr/journey/lookup (stores into `case_data`) | Supabase, `lib/register-receipt` |
| `uscis-case-status/*` | live USCIS **Torch API** OAuth case-status lookup | USCIS Torch API |
| `uscis-case-history` | GET/DELETE the user's saved lookups (`uscis_case_history`, candidate-tagged) | Supabase |
| `blog/*` | `comments`, `comments/[id]`, `subscribe`, `unsubscribe` | Supabase, Resend |
| `account-deletion-feedback` | POST exit survey | Supabase |
| `iv-status/*` | "documentarily complete" lookup from `backend/data/iv_data.json` | static data |
| `guides/*` | guides wizard (start/save/progress/upload/my-guides) + admin feedback triage | Supabase |
| `quick-access/*` | dashboard "quick access" tile CRUD (`user_quick_access`) | Supabase |
| `user-dashboard/*` | `services-status` (PCC/medical/consult/translation, all four now filtered by origin + candidate; `scope=journey` = journey-tagged rows, default = standalone/My Resources, `scope=all` = every row unfiltered for the cross-journey request directory), `analytics` aggregation | Supabase |
| `visa-forms/[formCode]/*` | save/resume multi-step form drafts (`visa_forms_draft`) | Supabase |
| `consultation`, `book-appointment`, `document-translation/*`, `police-verification/*` | service bookings + admin workflows + payments | Supabase, Resend, Stripe |
| `interview-prep/*`, `visa-checker/*` | sessions, answers, AI coaching (`ai-improve`) | Supabase, Gemini |
| `ceac/status`, `easypost/*`, `cron/*` | case-status state machine, courier tracking + webhooks, scheduled jobs (`ceac-reminders`, `update-tracking`, `security-scan`) | Supabase, EasyPost |
| `chat` | proxies to Python `ask-whatsapp` | Python backend |
| `create-pdf`, `convert-pdf` | PDF generation/conversion | Python backend |
| `admin/*` | `appointments`, `police-verifications`, `reviews`, `visa-cases`, guide feedback, `announce-feature`, `announce-blog`, `blog-comments`, `audit-logs`, `account-deletion-feedback`, `logout` (translation admin lives under `document-translation/*`) | Supabase, Resend |
| `dev/*` | dev-only debug (`debug-reminders`, `seed-notifications`); hard-404 in production | Supabase |
| `analytics`, `notifications`, `feature-usage`, `feedback`, `reviews` | GA4 + app telemetry/feedback (feedback also -> Google Sheets). `feature-usage` resolves the tier server-side from `scope` (`lib/usage/resolveUsageTier.ts`: `journey` = owned journey's tier, `standalone` = no plan + legacy add-on pools, wallet unlock = unlimited, default = account tier); a client `tier` is ignored | GA4, Supabase, Sheets |
| `v1/journeys/[id]/*`, `v2/ir1-estimate` | RESTful journey-scoped resources; IR-1 estimate | Supabase, ir1-engine |

**Conventions:** auth via Supabase session; shared guards in `lib/api/authGuards.ts` (required
before any service-role call that bypasses RLS) + `lib/api/journey-auth.ts`; errors sanitized
via `lib/api/safeError.ts`; admin via whitelist + DB role; webhooks
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
- Timeline/stage -> `lib/ir1-engine/*` (incl. `milestones.config.ts`), `lib/narrative/*`
- Interview prep -> `lib/interview-prep/*`; questionnaires -> `lib/questionnaire/*`;
  visa-checker scoring -> `lib/visa-checker/*`; profile schema/validation -> `lib/profile/*`
- Document checklist -> `lib/journey/document-checklist/*`
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
- **Stripe** — `lib/stripe/{config,utils}.ts`, `checkoutLock.ts` (per-user Redis checkout
  lock), `subscriptionCleanup.ts` (`cancelSupersededSubscriptions` journey-scoped upgrade cleanup,
  `journeyTypeForVisaCategory`, `isAddCandidateSubscription`, `LIVE_SUB_STATUSES`,
  `resolveSubscriptionTier`, `isRahvanaJourneySubscription`). **Plan** —
  `lib/plan/reconcile.ts`. **Payments** — `lib/payments/addon-purchase-ledger.ts`
  (idempotency ledger of processed add-on checkout sessions in `profile_details`).
- **No more dollar add-ons (Oct 2026).** The pricing page sells journey plans only; its
  Tools / Guides / Services tabs and the `/resources/[slug]` pages quote credit prices and link to
  each resource's own page (credit unlock or per-booking payment). `UpgradeModal` offers "upgrade"
  or "use it on its own with credits" (a link to the standalone page), never a dollar add-on.
  `/api/stripe/checkout` refuses any `addons` (400 `ADDONS_DISCONTINUED`). Add-ons bought before
  this keep working: the webhook / verify-session still record paid add-on sessions,
  `purchased_addons` still grants journey access and legacy unlocks.
- **Wallet** - `lib/wallet/topup.ts`: top-up packs (10/25/50/100), `WALLET_MIN_TOPUP = 5` (an
  exact deficit below it is lifted to it), whole credits only, max 1000. `applyWalletTopup` is
  called by BOTH the webhook (`checkout.session.completed` + `async_payment_succeeded`) and
  verify-session; it requires `payment_status === "paid"`, derives credits from Stripe's
  pre-tax `amount_subtotal` (refusing a mismatch with `metadata.credits`) and calls
  `credit_wallet_topup_atomic` keyed by session id, so double delivery credits once. A
  transient RPC failure in the webhook throws `WalletWebhookRetryableError`, the ONLY case where
  the webhook answers 500 (so Stripe retries; there may be no success-page visit to self-heal).
  `charge.refunded` on a top-up calls `applyWalletRefund` (credits first if the top-up never
  landed, then reverses). verify-session credits for anyone holding the session id but returns
  the amount / balance / tier only to the signed-in buyer. The
  `payments` row is stored as `product_type = "consultation"` (`original_product_type:
  wallet_topup`), never `journey_plan`, which `reconcileUserPlan` reads for tier self-heal.
  `lib/wallet/catalog.ts` is the server-authoritative price list (`WALLET_CATALOG`, mirrors the
  pricing-page `ADDONS`; `__tests__/wallet/catalog.test.ts` fails on drift). `resolveUnlockedItems`
  decides free standalone access: an active `standalone_unlocked_resources` row OR a legacy
  `purchased_addons` entry that grants permanent access (`legacyGrantsUnlock`; `civil-guid` =
  every guide, `interview-prep:*` = interview prep). Consumables (photo, every service) never
  grant unlimited access from a legacy purchase. **Services are `launchable: false`**: the unlock
  RPC refuses them; they are paid per booking through `lib/wallet/serviceBooking.ts`
  (`deductServiceBooking`, `/api/wallet/deduct-service`). It requires the caller's own unpaid
  booking id (`referenceId`), derives the idempotency key from it
  (`service_booking:<user>:<service>:<booking>`), returns success without charging for an
  already-paid booking, marks the row paid after the charge (a failed update is a 500
  `BOOKING_UPDATE_FAILED`; a retry replays the charge and finishes it) and only then notifies
  admins. `deduct_service_credits_atomic` (`20261023_03`) requires the reference, treats an
  existing charge for (user, service, booking) as the replay, refuses a key reused for another
  booking, and keeps caller metadata from overwriting `reference_id` (unique index backstop). The
  booking tools check the balance before creating a draft and reuse the same draft on a retry
  (`pendingDraftRef`), so a retry never books or charges twice. `CreditLaunchModal` never charges
  for a service: services cards go straight to the booking form.
  **Webhook retries:** `applyWalletTopup` / `applyWalletRefund` return `rpc_failed` (webhook 500,
  Stripe retries) only for transient errors (`isTransientRpcError`: no SQLSTATE, or class 08 / 40 /
  53 / 57); data errors are `rpc_rejected` (logged, 200).
  `lib/wallet/launch.ts` (`launchResource`) skips the charge for owned items, namespaces the
  client idempotency key as `launch:<user>:<type>:<id>:<key>` (the ledger index is global), and
  maps `INSUFFICIENT_CREDITS` to 402 with `topupAmountForDeficit`. `lib/wallet/state.ts`
  (`loadWalletState`) reads balance + unlocks + add-ons for one user.
- **Candidates** — `lib/candidate/candidateSyncService.ts` (journey keys, base category,
  `isMultiCandidateCategory`, shared vs candidate-specific fields) and
  `lib/candidate/candidateProvisioningService.ts` (`provisionCandidateJourneysAndVaults`:
  post-payment journey + roster + vault provisioning, see 4.3).
- **Journey services UI logic** — `lib/journey/toolModeGuards.ts` (one-active-request locks),
  `lib/journey/useJourneyServiceStatus.ts`, `lib/journey/imageUploadHelper.ts` (see 4.1).
- **EasyPost** — `lib/easypost/{client,tracker}.ts`.
- **Email/notify** — `lib/email/resend.ts`; `lib/notifications.ts` (root `"use server"`
  file: Resend email + in-app notification creation from `NOTIFICATION_TEMPLATES`).
- **Reviews** — `lib/reviews/data-access.ts` (service-role writes to `tool_reviews`).
- **Guides** — `lib/guides/*` (wizard session hooks + nav-guard store).
- **Python services** — `pdf_filler`, `ds260_generator`, `police_letter_generator`,
  `authority_letter_generator`, `document_ocr/vision_extractor`, `whatsapp_assistant/*` (disabled).

---

## 14. Utilities

- `lib/constants/countries.ts`, `lib/errors/*` (localized errors), `lib/formConfig/*`
  (frontend form definitions for **13 forms incl. I-485, G-1450, G-1650, G-1651**), `lib/register-receipt/*`
  (I-797 parsing/validation: `isValidReceiptNumber`, `normalizeReceipt`),
  `lib/hooks/*` (`useIR1Status`, `useHideOnFooter`), `lib/usage/*` (feature-usage quotas:
  `checkFeatureUsage`, `useFeatureAccess`), `lib/plan/reconcile.ts`,
  `lib/feature-flags.ts` (`IR5_ENABLED`), `lib/journey-lock.ts` (14-day CEAC lock),
  `lib/policy-data.ts` + `lib/policies/{acceptable-use,cookie-policy,privacy-policy,terms}-data.tsx`
  (legal/policy page content), `lib/analytics.ts` (GA4 wrapper), `lib/googleSheets.ts`
  (feedback append), `lib/validation/*`.
- `lib/api/*` — route helpers: `authGuards.ts`, `journey-auth.ts`, `journey-engine.ts`,
  `register.ts`, `safeError.ts` (see 11).
- `lib/interview-prep/*` — full interview engine (question selection, round engine, rule and
  category loaders, `purchase-validation`, `journey-category-map`, analytics) + speech hooks.
- `lib/questionnaire/*` — questionnaire engine + `ir1-questionnaire.ts`, `ir5-questionnaire.ts`.
- `lib/visa-checker/*` — eligibility scoring (`engine`, `scoring-rules`, `scoring-config`,
  `improvements`).
- `lib/profile/*` — profile `schema`, `validation`, `helpers`, `profileSectionRegistry`.
- `lib/blog/*` (comments, time helpers), `lib/pdfjs/client.ts` (pdf.js loader), and root
  helpers `lib/imageProcessor.ts`, `pdf-operations.ts`, `pdf-utils.ts`, `store.ts`,
  `supabaseClient.ts`.
- `lib/tools/sponsorship/povertyGuidelines.ts` — **authoritative** I-864 poverty data +
  threshold logic for the Sponsorship (Affidavit of Support) Calculator. State-aware across
  the **three** I-864P jurisdictions (`contiguous` = 48 states + DC + territories, `AK`, `HI`;
  only Alaska/Hawaii differ). `resolveJurisdiction(state)` maps a state code/name (fallback
  `contiguous`); `getSponsorshipThreshold(size, level, jurisdiction)`. The three duplicated
  `SponsorshipCalculatorTool.tsx` copies (`components/tools/`, `journey-engine/components/`,
  `journey-spouse/components/`) import from here. Sponsor state comes from
  `profile.sponsor.address.state`: the journey `StepView`s pass it in (`lockState` = shown
  read-only), while the standalone `/affidavit-support-calculator` page requires a selector.
- UI utils: `cn()` (clsx + tailwind-merge), shared modals/inputs in `app/components/shared/*`.

---

## 15. Components (Frontend)

**shadcn primitives:** `components/ui/*` + custom extras (LanguageToggle, spinner, lamp,
lens, compare, confetti).

**Feature components (`app/components/`):**

- **Journey dashboards:** `journey-spouse/*` (`RoadmapLayoutSpouse`, IR-1/CR-1 "V2" UI)
  and `journey-engine/*` (`RoadmapLayoutEngine`, `DashboardView`, generic chapters-schema
  "V3" UI); shared `case-health/*` (`CaseHealthCalculation`, `CaseHealthOverview`).
  Shared by both dashboards: `journey-engine/AppGroupGrid` + `AppGroupModal` (journey
  toolbox) and `journey-engine/EmbeddedToolContainer` (in-journey tool host, see 4.1).
- **Candidates:** `candidate/AddCandidateModal`, `CandidateSwitcherTray` (in `SiteHeader`),
  My Journeys `CandidateProfileLauncherModal`.
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
- **Shared:** `ModalScrollLock` (global modal scroll lock, see 27), `AuthRequiredModal`, `CountryAutoComplete`, `ConfirmationModal`,
  `MFAPromptModal`, `ToastProvider`, `UrduKeyboard`, `DataTable`.
- **Chat:** `FloatingChatWidget` -> `ChatInterface`.
- **Wallet:** `wallet/WalletBalancePill` (SiteHeader, signed-in only, opens the top-up modal),
  `wallet/WalletTopupModal` (rendered by `WalletProvider`, portalled to `<body>`),
  `wallet/CreditLaunchModal` (Phase 5: confirm + deduct for a standalone tool/guide, or an
  exact-deficit / pack top-up straight to Stripe when short). The `/tools` and `/guides` cards
  show a dual CTA (Preview + Launch N credits) when an item is plan-locked, has a catalog price
  (`lib/wallet/resourceMapping.ts` maps page ids to catalog ids) and is not wallet-unlocked.
  **Phase 6 enforcement (tools done; guides/services owned by another developer).** Rule:
  journey-embedded tools follow the journey plan; STANDALONE priced tools need a wallet unlock
  (credits, or a permanent legacy add-on reported by `/api/wallet`) even for plan holders.
  - `ResultGate standaloneToolId` (pass only when `!isJourney`) ignores the plan tier: the result
    opens for a wallet unlock or `standaloneGranted` (access the caller verified, e.g. a legacy
    per-category Interview Prep purchase); the lock card offers "Unlock for N credits"
    (`CreditLaunchModal onLaunched` unlocks in place). Without the prop the plan rule is unchanged.
    The teammate's `resolveStandaloneAccess` (guides) still lets a plan open; tools do not use it.
  - Non-`ResultGate` gates use `useStandaloneToolUnlock(id | null)` (`null` in journey mode, so a
    journey never reads wallet unlocks). `/tools` cards: a priced tool is owned only when
    wallet-unlocked.
  - **Photo Booth:** journey = journey tier (Executive unlimited); standalone = wallet unlock
    unlimited, else only legacy purchased photo credits. Usage goes through `/api/feature-usage`
    with a `scope` (below).
  - **Smart Form Filler:** every PDF (preview, download, vault save) goes through
    `POST /api/visa-forms/[formCode]/pdf`, which decides full vs page 1 server-side
    (`lib/forms/smartFormAccess.ts`: journey = owned journey's tier + account add-ons, like
    `useJourneyPlan`; standalone = wallet unlock / legacy "smart") and proxies to the Python
    `/fill-pdf` with `X-Internal-Token: PDF_FILL_INTERNAL_TOKEN` only for a full fill. The backend
    refuses a full USCIS form fill without that token (page-1 previews and the public
    police/authority letters stay open). **The gate is only active once `PDF_FILL_INTERNAL_TOKEN`
    is set on BOTH the Next.js server and the backend**; until then the backend logs a warning
    and allows full fills. `MultiStepForm` journey access = `canUse("smart_form_filler",
    journeyTier, addons)` (Basic journeys get the page-1 demo), standalone = wallet unlock.
  - **Interview Prep:** `POST /api/interview-prep` with `source: "journey"` calls
    `validateJourneySessionCreation` (owned journey via `resolveOwnedJourney`, journey still
    active, `basic_interview_prep` on the journey tier + add-ons) and creates a `source =
    journey` session (`createJourneyInterviewSession`); it used to create a paid tool session.
    Standalone sessions (`validateToolSessionCreation`) ignore the plan: a credit unlock or the
    bare `interview-prep` add-on = unlimited, every category; a per-category purchase
    (`interview-prep:<slug>`) keeps its per-category session count. `/api/interview-prep/categories
    ?scope=journey` skips wallet data. Client: `ResultPage isStandalone` + `standaloneGranted`
    (category purchase) -> free demo without access, full with it; Rapid Fire / Mock take
    `isStandalone` / `standaloneFull`.
  - `lib/journey/resolveOwnedJourney.ts` is the shared ownership check: journey row id, or a
    slug/category + candidate matched on canonical identity, always filtered by `user_id`.
  - `WalletContext.isLoading` stays true until the first fetch for the signed-in user settles.

Pattern: shadcn primitives at the base, thin custom wrappers, composition over
inheritance, i18n via `useLanguage().t()`, gating via `usePlan()`.

---

## 16. Custom Hooks

- `app/(main)/dashboard/hooks/useWizard.ts` — journey state + Supabase sync (most important).
- `lib/autoFill/useAutoFill.ts` — profile-driven form auto-fill + live save.
- `lib/hooks/useIR1Status.ts`, `useHideOnFooter.ts`, `useJourneyEnvironment.ts`,
  `useResolveToolMode.ts` (journey vs standalone, see 4.1).
- `app/context/useJourneyPlan.ts` — per-journey entitlements (see 4.3).
- `lib/document-vault/useInitDocumentVault.ts` — vault prefetch on dashboard mount.
- `lib/guides/*` — guide session/save/step/upload/feedback hooks, `useWizardSession`,
  `useNavigationGuard`, `useHideIntro`.
- `lib/usage/useFeatureAccess.ts` — quota-aware feature access.
- `lib/interview-prep/useQuestionSpeech.ts`, `useVoiceEngine.ts` — TTS + speech-to-text.
- Context consumers: `useAuth`, `usePlan`, `useUserProfile`, `useCandidate`,
  `useQuickAccess`, `useLanguage`, `useToast`.
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
  `NEXT_PUBLIC_ENVIRONMENT` (IR-5 flag), `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`,
  `NEXT_PUBLIC_SITE_URL`, `EMAIL_FROM`, `OCR_SPACE_API_KEY`, `NEXT_PUBLIC_PROPERTY_ID` (GA4),
  `PYTHON_API_URL`, `COMPRESSION_API_URL`, `PDF_FILL_INTERNAL_TOKEN` (shared secret, set on the
  Next.js server AND the backend: gates full Smart Form Filler PDFs, see 15), `USCIS_ENV` / `USCIS_CLIENT_ID` /
  `USCIS_CLIENT_SECRET`, `TOOL_WEBHOOK_SECRET`, `EASYPOST_WEBHOOK_SECRET`, `GOOGLE_SHEET_ID`,
  `NEXT_PUBLIC_GEOAPIFY_API_KEY`, and ~30 Stripe price IDs (`STRIPE_*_PRICE_ID`,
  `STRIPE_ADDON_*`, legacy `STRIPE_PRICE_ID_PRO` / `STRIPE_PRICE_ID_PLUS`). Backend `.env`:
  `GEMINI_API_KEY`/`GEMINI_KEY`, `REMOVE_BG_API_KEY` (optional), `SUPABASE_*`,
  `CORS_ORIGINS`.
- **Build/runtime:** `next.config.mjs` (security headers incl. a Content-Security-Policy,
  image remote patterns, `canvas` aliased to `false` for webpack and to `lib/mock-canvas.js`
  for Turbopack (pdfjs), **eslint+ts errors ignored at build**, `outputFileTracingIncludes` to
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

1. **Frontend boot:** root `app/layout.tsx` mounts `ModalScrollLock`, then providers
   (Toast -> Auth -> UserProfile -> Candidate -> Plan -> QuickAccess -> Wallet -> Language).
2. **Request:** `middleware.ts` refreshes session + guards routes + crawler/body guards.
3. **Auth resolves:** AuthContext loads user; UserProfileContext loads MasterProfile once;
   CandidateContext resolves the roster + active candidate; PlanContext loads account +
   per-journey tiers (reconcile throttled, see 4.3).
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
- Webhooks always return 200 (Stripe/EasyPost) and rely on idempotent reconciliation; the one
  exception is a wallet top-up / refund whose RPC failed transiently (500, so Stripe retries);
  `stripe/verify-session` self-heals missed activations.
- Vision OCR endpoint **never throws** — returns `ok:false` so the frontend keeps the
  prior result.
- Python backend offloads CPU work to thread pools and falls back gracefully.

---

## 23. Security

- **AuthZ:** Supabase RLS (own-row) on every user table; admin = email whitelist **AND**
  DB role (mutating admin requests audit-logged in middleware). DB triggers
  `guard_profile_role` / `guard_user_profile_billing` block self-promotion to admin and
  self-upgrading the plan tier (see 10). Service-role routes must pass `lib/api/authGuards.ts`.
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
- **Input hardening:** strong password rules (`lib/security/password.ts`), disposable-email blocking, Zod validation,
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
React Contexts (Auth . UserProfile . Candidate . Plan . QuickAccess . Language;
                per-journey: JourneyEnvironment + useJourneyPlan)  <- lib/entitlements, types/profile
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
- **My Journeys step counts come from the JSON, not DB `steps` rows.** The per-user DB
  `steps` rows drift from `data/visa-category/*.json`: `syncStepsBackground`
  (`app/api/journeys/initialize`) only INSERTS steps new in the JSON, never DELETES steps
  removed from it, so removed steps linger as stale rows. `lib/journey/journeyProgressService.ts`
  (`calculateActiveProgressFromSteps`) therefore derives the total from the JSON via
  `getAllActiveSteps` (same visibility rules as the dashboard) and only reads DB `status`
  for which active steps are completed. Do NOT switch this back to counting DB rows /
  hardcoded per-filing-method totals (the historical bug: IR-1 over-counted from stale
  rows, IR-5 under-counted from un-seeded rows).
- **Vault `config.visaCategory` must be the EXACT canonical form (`"IR-1"`, `"IR-5"`, not
  `"IR1"`/`"ir-1"`).** The personalization engine (`lib/document-vault/personalization-engine.ts`)
  matches `doc.applicableVisas.includes(visaCategory)` by exact string; a non-canonical value
  silently collapses the required/optional list to ~zero docs (symptom: "IR-1 required
  documents not showing" in the vault's Required tab). The vault page
  (`app/(tools)/document-vault/page.tsx`) therefore canonicalizes via
  `journeyTypeToVisaCategory(...)` for BOTH the active journey type and the candidate fallback
  before writing config. Never feed a raw candidate `visaCategory` straight into vault config.
- **`dedupeJourneysByType` / `isSameJourneyType` key on canonical identity** (base category +
  candidate number, `lib/document-vault/journey-mapping.ts`), NOT the raw normalized
  `journey_type`. This collapses variant rows of the same journey (`ir5` / `ir5-journey` /
  `IR-5`) into one while keeping distinct candidates (`ir5` vs `ir5_candidate-2`) apart. It
  drives the cross-share list, the vault card grid, and the SiteHeader switcher's 2+ gate;
  before this, variant rows rendered the same category twice in the upload modal's
  "Cross-share this document" list.
- **Vault document delete is optimistic via the store** (`useDocumentVaultStore.deleteDocument`),
  which removes the row from state and refreshes statuses/notifications in place. Do NOT delete
  by re-running `initialize(userId)` (it re-fetches the whole vault and feels like a page
  refresh).
- **Modal scroll lock is global.** `app/components/shared/ModalScrollLock.tsx` (mounted once in
  `app/layout.tsx`) locks `<html>` scroll whenever a visible, interactive, full-viewport
  `.fixed` element with z-index > 0 is on screen (detected via MutationObserver, so nested
  modals can't unlock early). New modals need no per-component `body.style.overflow` code;
  just keep the overlay `fixed inset-0` with a positive z-index, and make card max-height +
  overlay padding fit within `100dvh` or the overlay itself will scroll slightly.
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
- **One live plan per JOURNEY (Stripe is the source of truth).** A customer can legitimately
  hold several Rahvana subscriptions: one per journey (IR-1 and IR-5 are bought separately) plus
  one per IR-5 candidate added through an add-candidate purchase. Every subscription is tagged in
  `subscription_data.metadata` with `tier`, `visa_category`, `candidate_count`, `action` /
  `is_add_candidate`. **Checkout** lists the customer's live Stripe subs
  (`active/trialing/past_due/unpaid`), keeps only the selected journey's plan(s)
  (`journeyTypeForVisaCategory` from `lib/stripe/subscriptionCleanup.ts`, shared with cleanup;
  add-candidate plans excluded unless the journey row points at one) and blocks same-tier /
  downgrade against those even when the DB is stale - so an IR-5 plan never blocks buying IR-1,
  and a candidate-2 Executive plan never makes a candidate-1 Basic -> Premium upgrade look like a
  downgrade. **Upgrade cleanup:** after payment is confirmed, BOTH `verify-session` and the webhook
  call `cancelSupersededSubscriptions({ customerId, keepSubId, visaCategory, isAddCandidate,
  oldSubscriptionId })` (idempotent; whichever runs first wins). It cancels only the upgrade's
  `old_subscription_id` plus any other live plan tagged with the SAME journey that is not an
  add-candidate plan (desync duplicates); an add-candidate purchase cancels nothing, plans for
  other journeys and untagged legacy subs (unless they are the upgrade hint) are never touched.
  So Basic -> Premium on IR-1 retires the IR-1 Basic plan and nothing else. Do NOT reintroduce an
  account-wide "cancel every other sub" cleanup: it cancelled the IR-5 plan when IR-1 was bought
  and the primary IR-5 plan on every add-candidate purchase (fixed Oct 2026; covered by
  `__tests__/stripe/{subscriptionCleanup,webhook,checkout}.test.ts`). **Ordering is load-bearing:**
  the old sub is cancelled ONLY after the new payment is confirmed and after the DB points at the
  new sub, so (a) a failed checkout never removes the user's existing plan and (b) the
  `customer.subscription.deleted` guard skips the downgrade, so upgrades never reset tier or
  journey progress (journey rows are independent of tier anyway). **Genuine cancellation**
  (`customer.subscription.deleted` in the webhook) revokes per journey: every `journeys` row whose
  `stripe_subscription_id` is the cancelled sub drops to `free` (several rows for an IR-5 purchase
  covering multiple candidates), and the matching candidates in `profile_details.candidates` get
  `tier: "free"` too - required, because `PlanContext` keys journey tiers per CATEGORY and only
  the candidate's own `tier` stops candidate 2 inheriting candidate 1's IR-5 tier. An upgrade's
  retired plan matches no row (the journey was already repointed), so it changes nothing. The
  account summary (`user_profiles.subscription_tier` + `profile_details.stripe_subscription_id`) is
  only touched when the cancelled sub is the one it points at, and then falls back to the best
  remaining journey plan instead of `free`. Legacy accounts whose journey rows were never stamped
  with a sub id: when their current plan is cancelled, their unstamped paid journeys are revoked.
  Covered by the "per-journey plans" block in `__tests__/stripe/webhook.test.ts`. The existing
  Stripe customer is resolved (search by metadata/email) BEFORE the live-sub guard runs, so a DB
  desync with no stored customer id can't bypass the guard; a customer-lookup error on a
  subscription purchase FAILS CLOSED (503). The per-user checkout lock
  (`lib/stripe/checkoutLock.ts`) uses a random ownership token + compare-and-delete release so it
  can't delete another request's lock; it stays fail-open on a Redis error (cleanup is the
  backstop).
- **`outputFileTracingIncludes`** bundles `data/**` into API routes (routes read
  `data/visa-category/*.json` at runtime).
- Migrations are applied by hand in filename order (no CLI tracking); a removed file only
  matters for a fresh database.

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
13 forms incl. I-485, G-1450, G-1650, G-1651), while **case-strength** (category profiles + a weighted Case Health
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
- `app/context/{AuthContext,PlanContext,UserProfileContext,CandidateContext,JourneyEnvironmentContext}.tsx`,
  `app/context/useJourneyPlan.ts`
- `types/profile.ts`, `lib/autoFill/mapper.ts`
- `lib/case-strength/categories/*`, `case-narrative.ts`, `alert-gating.ts`
- `supabase/migrations/20260403_*` (journey core), `lib/supabase/middleware.ts`, `middleware.ts`
- `backend/main.py`, `backend/app/services/pdf_filler.py`, `backend/app/core/form_configs/*`

**Important (feature development)**
- `lib/journey/evidence-gap/engine.ts`, `app/components/case-health/*`, `lib/ir1-engine/*`,
  `lib/ir1-engine/milestones.config.ts`, `lib/narrative/*`
- `lib/notifications/*`, `lib/reminders/*`, `lib/ceac-tracking/*`
- `lib/security/*`, `lib/document-vault/*`, `lib/document-ocr/*`, `lib/formConfig/*`, `lib/stripe/*`
- `app/api/{stripe,journeys,steps,case_data,documents,profile,guides,uscis-case-status}/*`
- `app/components/entitlements/*`, `app/components/forms/*`, `app/components/document-vault/*`
- `lib/feature-flags.ts`, `lib/journey-lock.ts`, `lib/plan/reconcile.ts`, `lib/usage/*`
- `data/interview-categories/*`, `data/visa-checker/*`, `types/journey-support.ts`
- `lib/constants/journey-app-groups.ts`, `app/components/journey-engine/{AppGroupGrid,AppGroupModal,EmbeddedToolContainer}.tsx`,
  `lib/hooks/useResolveToolMode.ts`, `lib/journey/document-checklist/*`, `lib/api/authGuards.ts`,
  `lib/interview-prep/*`, `lib/questionnaire/*`, `lib/stripe/{checkoutLock,subscriptionCleanup}.ts`

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
**`app/api/*` (~165 handlers, ~45 groups) acting as a BFF**. Domain logic is in **`lib/`**.
Live journey config is in **`data/visa-category/*.json`**. DB schema is in
**`supabase/migrations/`** (~97 files). Shared types in **`types/`**.

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

**State.** Global React Contexts (nesting: Toast > Auth > UserProfile > Candidate > Plan >
QuickAccess > Wallet > Language): **Candidate** (multi-candidate roster, one journey per candidate,
active journey scope), **Auth**, **Plan** (tier + entitlements; per-journey tier via
`useJourneyPlan` inside dashboards; DB
`core/plus/pro` -> `basic/premium/executive`; reconcile throttled to once/24h per user),
**UserProfile** (one
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
**Python backend** fills/generates **13 forms (I-130/130A/129F/693/864/864A/864EZ/912/
DS-260/I-485/G-1450/G-1650/G-1651)** via `app/core/form_configs/*`, plus PDF compression, passport-photo bg
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
autofill-free `userProvided` view). `ir1-engine/*` (incl. `milestones.config.ts`) + `narrative/*`
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

**Journey shell.** `JourneyEnvironmentContext` + `useResolveToolMode` decide journey vs
standalone mode for every tool (smart form filler drafts/gating differ by mode). Both
dashboards share the app-groups toolbox (`AppGroupGrid`/`AppGroupModal`) and
`EmbeddedToolContainer`. New categories need a `JOURNEY_DATA_MAP` entry + slug maps.
Medical / PCC / Consultation run as journey-embedded services (`JourneyServiceModule`, one
active request per journey via `toolModeGuards`, rows tagged `source`/`journey_slug`/`candidate_id`).
Multi-candidate purchases (`isMultiCandidateCategory`, pricing `action=add_candidate|upgrade`) are
provisioned after payment by `provisionCandidateJourneysAndVaults` (journeys + roster + vaults).

**Gotchas.** Builds **ignore TS/ESLint errors** (run `tsc --noEmit`). Modal page-scroll is
locked globally by `ModalScrollLock` (no per-modal body locks). `data/roadmap.ts` +
`lib/steps.ts` are legacy traps. No `lib/journeyHelpers.ts`. Two dashboard renderers, two
encryption schemes, two reminder engines. "IR-5 only" score comments are stale (IR-1 uses
weighted too). IR-5 is flag-gated. Rate limiting is code, not a DB table. Two component
roots, two+ profile representations. Don't hardcode stage/step IDs — read
`data/visa-category/*.json`. Keep domain logic in `lib/`, route handlers thin, components
presentational.

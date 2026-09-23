# Plan: Unified Candidate/Journey Architecture + Cross-Journey Document Sharing

Status: PROPOSAL (planning only, no code changed). Date: 2026-09-22.
Supersedes the earlier "cross-journey sharing + Add Candidate rename" draft in this file.
Grounded in a 4-part repository audit (document model, roster/category gates, journey
creation + entitlements, per-module active-journey resolution). Plain ASCII.

---

## 0. Decisions locked by the user (2026-09-22) - these override the earlier Open Questions

1. **New-category candidate uses the EXISTING entitlement system - no new payment/entitlement
   architecture.** Adding a candidate for an unpurchased category creates the candidate +
   journey, but it exposes ONLY the free/preview functionality the current entitlement system
   already permits; premium/full features stay LOCKED until that category is purchased. Do NOT
   grant a free full journey and do NOT bypass entitlements. (Consequence, see section 7A:
   entitlement must resolve per the ACTIVE journey's category using the EXISTING per-journey
   `journeys.subscription_tier` data, not a single account-wide unlock.)
2. **Switcher visibility: only when 2+ candidates/journeys exist.** With a single candidate,
   show NO switcher - just the candidate's normal identity/badge. The global switcher appears
   at 2+. ("+ Add Candidate" must stay reachable at 1 candidate - see section 6.)
3. **IR-2 is OUT OF SCOPE.** No IR-2 roadmap/route work in this plan. Focus is IR-1 + IR-5.
   Existing IR-2 behavior is left untouched; do not add an IR-2 route.
4. **Forms isolation is IN SCOPE now** (not deferred). Forms/drafts must be scoped by the
   active journey (journey_id / journey key), never `"global"`, so IR-5 Mother (journey A) and
   IR-1 Spouse (journey B) keep separate forms and never overwrite/read each other's drafts.
5. **Unknown visa category must be EXPLICIT unknown - never silently IR-5.** Change
   `getBaseVisaCategory` so unknown/empty input returns an explicit unknown value; do not mask
   mis-mapped journeys as IR-5.
6. **Tools are journey-specific.** Switching candidate switches each journey-aware tool's
   state/data to that journey. Shared petitioner INPUTS stay shared, but per-journey tool
   sessions/outputs are scoped to the active journey.

---

## 1. Executive summary

We want ONE account-level model: `Account -> Candidate(person) -> Journey(workflow) ->
visa category(config)`, with ONE global switcher that lists candidates across ALL visa
categories (IR-1, IR-5, IR-2, ...), ONE "Add Candidate" flow, and full journey-context
switching (roadmap, forms, documents, tools, guides, progress) driven by the active journey
- never by visa-category-specific switching logic.

**The most important audit finding: the DATA layer already supports this.** `journeys` has
`UNIQUE(user_id, journey_type)` and encodes candidate identity inside `journey_type`
(`getCandidateJourneyKey`), and `getDefaultCandidatesForVisa` already seeds an IR-1 account
with a `candidate-1` (relation Spouse) roster entry. **No DB migration is required.** The
IR-1 exclusion and the "IR-5-only switcher" live almost entirely in UI visibility gates and
a few category literals - plus three genuine data-isolation gaps (forms, interview-prep, a
stale-candidate cache bug). Generalizing is mostly deleting category allowlists and honoring
`candidate.visaCategory` where code currently reads the ambient dashboard `journey_type`.

---

## 2. Current architecture findings (from the audit, with file refs)

### 2.1 Identity primitives
- `CandidateContext` (`app/context/CandidateContext.tsx`): `activeCandidateId`,
  `activeCandidate` (`.id/.visaCategory/.relation/.fullName/.isPrimary`), `isMultiCandidate`,
  `setActiveCandidateId` (L173). Category-agnostic at the data layer.
- `lib/candidate/candidateSyncService.ts`: `getBaseVisaCategory` (L241, **defaults to IR-5**
  on unknown input), `getCandidateJourneyKey` (L265, candidate-1 -> base, others ->
  `base_candidateN`), `getVisaCategoryForRelation` (L170, Mother/Father->IR-5, Spouse->IR-1,
  Child->IR-2), `getDefaultCandidatesForVisa` (L86, seeds per category incl. IR-1 Spouse).
- **Three inconsistent journey-identity shapes coexist**: `journey_type` string (`ir5`),
  journey UUID (`journey.id`/`backendId`), and `candidateId` string. There is no single
  switch signal today.

### 2.2 Data model / journeys
- `supabase/migrations/20260403_create_journeys_table.sql`: `UNIQUE(user_id, journey_type)`
  (L41). No `candidate_id` column (that exists only on guides tables,
  `20260919_candidate_guides.sql`). `subscription_tier`/`stripe_subscription_id` added by
  `20260917_add_per_journey_subscription_tier.sql`.
- `POST /api/journeys/initialize` (`route.ts:76,85,108-135`): body `{ journey_type,
  candidate_id }`; `effectiveJourneyType = getCandidateJourneyKey(journey_type,
  candidate_id)`; find-or-create by normalized `journey_type`; **creates the row lazily and
  free** (`subscription_tier:"free"`), config path derived from
  `getBaseVisaCategory(journey_type)`. No purchase check here.
- `useWizard` (`app/(main)/dashboard/hooks/useWizard.ts`): posts `{ journey_type: journeyId,
  candidate_id: effectiveCandidateId }`; returns `backendId = journey.id` (UUID) used for all
  subsequent step/case_data writes.

### 2.3 Entitlements / purchase
- Gating is **per base category (IR1 vs IR5), account-scoped, NOT per candidate**.
  `stripe/checkout` collapses any category to `IR1|IR5` (`route.ts:30-32`) and tags the sub
  with `metadata.visa_category`. `verify-session` writes the tier onto the base journey row
  and **rolls the max tier up into `user_profiles.subscription_tier`** (L122-127), which is
  what `PlanContext` reads. So **a user can already hold an IR-1 sub AND an IR-5 sub**, and
  extra candidates within a purchased category inherit account-level entitlement.
- **Per-candidate purchase does not exist**; candidate-scoped rows (`ir5_candidate2`) stay
  `subscription_tier:"free"` on their own row but feature access resolves from the
  account-level tier.

### 2.4 Roster / switcher category gates (the exclusions to generalize)
- `SiteHeader.tsx:503-522`: `hasCandidateJourney` = some journey base in `["IR-5","IR-2"]`;
  `showCandidateSwitcher = hasCandidateJourney`. **Master gate that hides the switcher and
  badge from IR-1.**
- `document-vault/page.tsx:231-243`: `isCandidateJourney = base==="IR-5"||"IR-2"` and
  `journeyRoadmapHref` only ir5/ir1 - **IR-1 excluded, IR-2 has no route**.
- `AddCandidateModal.tsx:39-42,89-108`: Spouse absent from options; only parents (IR-5) /
  child (IR-2) addable. `CandidateContext.addCandidate:206-212` throws on Spouse.
- `ActiveCandidateBadge.tsx:32-39`: visibility gated on IR-5/IR-2 string match.
- `lib/constants/routes.ts:18-23` `getJourneyHrefByType`: ir5->IR5 route, ir1/cr1->IR1
  route, **everything else (incl. IR-2) falls through to the IR-1 route**.
- Dashboard router `visa-category/[visa-journey]/page.tsx:104-114`: URL auto-redirect handles
  **only IR-1<->IR-5/CR-1**, no IR-2, no generic candidate-visa->slug.

### 2.5 Per-module active-journey resolution (isolation status)
| Module | Identity used | Switches on candidate change? | Note |
|---|---|---|---|
| Dashboard router | journey_type string | partial (IR1<->IR5 only) | hardcoded redirect |
| useWizard | (journey_type + candidate_id) -> UUID | load: yes; **actions memo: no (stale)** | L283 vs L695 |
| Document Vault | journey UUID | yes (dedicated effect L527) | isCandidateJourney IR5/IR2 only |
| Forms / MultiStepForm | **none - `journey_key="global"`** | **NO** | 2nd candidate overwrites same draft |
| autoFill / bridge | user MasterProfile | no (shared) | petitioner-shared by design; beneficiary form fields at risk |
| interview-prep | journey UUID from URL/localStorage | no | not candidate-aware |
| 221g / affidavit / case-strength | user MasterProfile (global) | no | global tools |
| Guides | candidateId string | **yes (cleanest model)** | no category assumption |
| SiteHeader switcher/badge | user journeys, base in {IR5,IR2} | shows/hides | IR-1 excluded |

### 2.6 Document model / sharing (marriage certs)
- `DocumentRole = PETITIONER | BENEFICIARY | JOINT_SPONSOR | HOUSEHOLD_MEMBER`
  (`types.ts:19`). Sharing rule `isDocumentShareableAcrossCandidates`
  (`candidate-sharing.ts:30`): shareable iff every role is a SHARED role
  (PETITIONER/JOINT_SPONSOR/HOUSEHOLD), unless explicit `shareableAcrossCandidates` override;
  any BENEFICIARY role -> not shareable. Applicability `isDocumentApplicableToJourney`
  (`journey-mapping.ts:480`): `applicableVisas` + `requiredWhen.visaCategories` +
  RELATIONSHIP-category spouse gate.
- Marriage certs (verbatim from the audit):
  - `parent-mrc` (:2986) the parent-beneficiary's OWN marriage: roles [BENEFICIARY],
    applicableVisas [IR-5], NOT shareable.
  - `parents-marriage-cert` (:3034) the petitioner's parents' (mother+father) marriage:
    roles [BENEFICIARY, PETITIONER], applicableVisas [IR-5], **`shareableAcrossCandidates:
    true`** (:3048) - correctly shareable between the two IR-5 parent journeys.
  - `nadra-mrc`/`nikah-nama` (IR-1 spouse): roles [BENEFICIARY], applicableVisas
    **FAMILY_VISAS (includes IR-5)**, requiredWhen [IR-1,CR-1], category CIVIL. Kept out of
    IR-5 ONLY by `requiredWhen` - fragile.
  - Only ONE explicit `shareableAcrossCandidates: true` in the whole file
    (parents-marriage-cert); none set false.

---

## 3. Problems with the current architecture

1. **IR-1 is second-class in navigation.** It has a roster entry in data but the UI gates
   hide it, so a user with IR-1 + IR-5 cannot see one unified switcher.
2. **Category literals drive switching** (SiteHeader allowlist, vault `isCandidateJourney`,
   ActiveCandidateBadge, routes map). Adding a category means editing allowlists.
3. **Add Candidate is category-locked** (parents/child only) and, worse, `initialize`/
   `useWizard` derive the journey key/config from the ambient dashboard `journey_type`, not
   the candidate's own `visaCategory` - so a cross-category candidate could not get a correct
   independent journey even if the modal allowed it.
4. **Real data-isolation gaps**: forms drafts are global (`journey_key="global"`), so a 2nd
   candidate overwrites the first's form draft; interview-prep is not candidate-aware;
   `useWizard`'s actions memo omits `effectiveCandidateId` (stale cache-bust after switch).
5. **Document sharing is capped to same base category**, blocking the petitioner's own
   documents (passport, tax, I-864) from being reused across IR-5 and IR-1 even though the
   petitioner is one person.
6. **`getBaseVisaCategory` defaults to IR-5** on unknown input, masking mis-mapped journeys.

---

## 4. Target architecture

```
ACCOUNT
  +-- Candidate A -> Journey A (journey_type ir1)         -> IR-1 config
  +-- Candidate B -> Journey B (journey_type ir5)         -> IR-5 config
  +-- Candidate C -> Journey C (journey_type ir5_candidate2) -> IR-5 config
```
(IR-2 is out of scope for this plan - decision 3 - so it is not shown here.)
- CANDIDATE = person/beneficiary; JOURNEY = that person's complete workflow; VISA CATEGORY =
  the journey's configuration. Category configures the journey; it does NOT define switching.
- ONE global switcher lists ALL candidates. ONE "+ Add Candidate" flow. The **active journey
  key** (candidate.visaCategory + candidateId -> `getCandidateJourneyKey`) is the canonical
  scope for roadmap, forms, documents, tools, progress.

### 4.1 Context decision (spec 23)
**Keep `CandidateContext`, generalize it; do not rewrite into a new JourneyContext.** The
data layer is already category-agnostic, so a rewrite is unjustified risk. Add a single
derived value the whole app can consume:
- `activeJourneyKey` = `getCandidateJourneyKey(activeCandidate.visaCategory, activeCandidateId)`
- `activeJourneyBase` = `getBaseVisaCategory(activeCandidate.visaCategory)`
Expose these from `useCandidate()` so modules stop re-deriving identity three different ways.
This is the single switch signal. (A thin `useActiveJourney()` alias may wrap it for
readability, but it reads from the same context - not a parallel store.)

---

## 5. Unified Candidate/Journey model (data)

- **No migration.** `UNIQUE(user_id, journey_type)` + candidate-scoped `journey_type` already
  gives every candidate (any category) an independent row with its own chapters/steps/
  case_data/documents. `profile.candidates[]` already holds `visaCategory` per candidate and
  already seeds an IR-1 Spouse candidate.
- The ONLY data-shape change is behavioral, not schema: derive journey key/config from
  `candidate.visaCategory` (not ambient `journey_type`) so a cross-category candidate maps to
  the right config JSON and the right `journeys` row.

---

## 6. Global switcher design (spec 15)

- **Location: keep it in the global `SiteHeader` profile dropdown** (already there), plus the
  inline header active-candidate badge. It is already app-wide; we only remove the IR-5/IR-2
  gate. No new location needed.
- **Display**: "My Candidates" list, each row = relation icon + name-or-label + visa category
  chip (e.g. "Spouse - IR-1", "Mother - IR-5", "Father - IR-5"). Active candidate highlighted
  (checkmark + colored ring, as today). "+ Add Candidate" at the bottom.
- **Gate change (decision 2)**: `showCandidateSwitcher` becomes "the account has **2+**
  candidates/journeys", NOT "base in {IR-5,IR-2}". IR-1 appears exactly like any other
  candidate once there are 2+. The gate must count real candidates/journeys, not defaulted
  ones (keep the `resolvedUserId`-keyed fetch; do not regress the auth re-ref fix).
- **One-candidate account (decision 2)**: show NO switcher tray - only the candidate's normal
  identity/badge in the header. "+ Add Candidate" must remain reachable: place it in the
  profile dropdown (and/or a small menu off the badge), NOT only inside the (now hidden)
  switcher tray, so a single-journey user can still start a second candidate. This is the one
  UX detail decision 2 forces - the Add entry point moves out of the switcher-only location.
- **Switch flow**: clicking a candidate calls `setActiveCandidateId`, which updates
  `activeJourneyKey`; modules re-scope off that; the router navigates to that candidate's
  roadmap route via `getJourneyHrefByType` (IR-1 + IR-5 only; unknown = explicit guard, no
  IR-1 fallback; IR-2 out of scope). Loading state: reuse the existing wizard load spinner;
  the switch is optimistic with reconcile.

---

## 7. Add Candidate flow (spec 3, 22)

- **Keep the name "+ Add Candidate"** (adding a person; the journey is the system's result).
- **Make it category-agnostic**: add IR-1 to the addable relations by removing the hard
  exclusion of Spouse, deriving the visa category via `getVisaCategoryForRelation` (Spouse->
  IR-1, parents->IR-5). The existing IR-2 Child option is left as-is (decision 3: IR-2 out of
  scope, not removed, not expanded). Keep the cardinality rule "**only one Spouse can be
  sponsored at a time**" - it must block adding a SECOND spouse, never block
  displaying/switching to the one spouse candidate.
- **Journey creation on add**: after `addCandidate` writes `profile.candidates`, the new
  candidate's journey row is created lazily by `initialize` when its dashboard mounts - which
  works ONLY once `initialize`/`useWizard` key off `candidate.visaCategory` (see 5, 10). For a
  SAME-category candidate this already works and inherits the account/category entitlement.
- **Cross-category add uses the EXISTING entitlement system (decision 1).** Adding a candidate
  of a NEW category (e.g. IR-1 on an IR-5-only account) creates the candidate + a free journey
  row (lazy `initialize`), and that journey exposes ONLY the free/preview functionality the
  current entitlement system already permits. Premium/full features stay LOCKED until that
  category is purchased through the EXISTING `stripe/checkout` flow. No new payment or
  entitlement architecture. No free full journey. See 7A for the resolution mechanism.

### 7A. Per-journey entitlement resolution (required for decision 1 to actually hold)

Audit fact: `stripe/verify-session` writes the purchased tier onto the specific base journey
row (`journeys.subscription_tier`, added by `20260917_add_per_journey_subscription_tier.sql`)
AND rolls the max tier up into account-level `user_profiles.subscription_tier`, which is what
`PlanContext` reads today. If entitlement keeps resolving from that account-wide max, a user
who bought IR-5 premium would ALSO unlock IR-1 - which violates decision 1.

Therefore entitlement for the active journey must resolve from the ACTIVE journey's own
category tier (the EXISTING per-journey `journeys.subscription_tier` data), not the account
max. This uses existing columns and the existing Stripe writes - it is NOT new payment
architecture; it is resolving the tier the correct (per-category) way.

Concrete steps:
- VERIFY FIRST how `PlanContext`/`lib/entitlements/*` resolves the tier today (account-level
  `user_profiles.subscription_tier` vs any per-journey read). This determines the size of the
  change.
- Make the effective tier for the active journey = the tier attached to that journey's
  category (from the journey row / the category's subscription), falling back to free/preview.
  Purchased categories already have their row tier set by verify-session; unpurchased
  categories resolve to free/preview -> premium features locked by the normal entitlement
  table.
- Keep SHARED petitioner data available regardless (it is not premium-gated content); only
  premium FEATURES lock. Do not double-charge or re-architect billing.
- This is the single most product-sensitive change; treat it as its own workstream with the
  entitlement tests in section 20 (buy IR-5 -> IR-1 still locked; buy IR-1 -> IR-1 unlocks).

---

## 8. IR-1 + IR-5 behavior (spec 7)

Both appear in ONE switcher as ordinary candidates. Switching IR-1 <-> IR-5 changes the
entire journey context via `activeJourneyKey`. No "enter IR-5 section to reach IR-1". The
dashboard router's auto-redirect is generalized from the hardcoded IR1<->IR5 pair to
"navigate to `getJourneyHrefByType(activeCandidate.visaCategory)` whenever the slug and the
active candidate's category differ".

## 9. IR-5 Mother + Father behavior (spec 6)

Two independent candidate journeys (`ir5` and `ir5_candidate2`), each with its own
beneficiary forms/documents/roadmap/progress/tools state. They MAY share petitioner-side
docs and the one `parents-marriage-cert` (see 12/13). Being both IR-5 does NOT merge them -
distinct `journey_type` => distinct rows (already true today).

---

## 10. Forms isolation (spec 18) - REQUIRED, higher-risk workstream

- **Problem**: `MultiStepForm.tsx:157` hardcodes `draftJourneyKey="global"`; the
  `visa_forms_draft` table is queried/written with `journey_key="global"`
  (`app/api/visa-forms/[formCode]/progress/route.ts`), and localStorage backups key on
  `(formCode, userId)` only. So Mother's DS-260 draft overwrites Father's.
- **Fix (no schema change; `visa_forms_draft` already has a `journey_key` column)**: set
  `draftJourneyKey = activeJourneyKey` (from the generalized context) instead of "global",
  in both the client (`MultiStepForm`, `buildDraftStorageKey`) and the API body/query. Reads
  fall back to the legacy `"global"` row when no candidate-scoped row exists (backward
  compatible - existing single-journey users keep their draft).
- **Keep shared**: petitioner-level autofill from `MasterProfile` stays shared (correct - one
  petitioner). Only the per-form DRAFT + generated PDFs become journey-scoped. Distinguish
  clearly in code comments: SHARED petitioner data vs JOURNEY-SPECIFIC beneficiary form data.
- `initialize`/`useWizard` must also honor `candidate.visaCategory` so form/journey keys are
  consistent for a cross-category candidate.

## 11. Document isolation (spec 5)

Documents are already scoped by `journey_id`; the vault switches correctly on candidate
change. Generalize only the `isCandidateJourney` IR-5/IR-2 gate so the vault treats IR-1 as a
normal candidate journey too. Beneficiary docs stay isolated by journey_id + the sharing rule
(12).

## 12. Cross-journey document sharing (spec 8-13) - unified rule

Replace the same-base-category restriction with an ownership/applicability rule (this is
STRICTLY more correct, not just more permissive):

A target journey `T` is an eligible share target for document `def` iff ALL hold:
1. `T` is owned by the current user,
2. `T.id != activeJourneyId`,
3. `isDocumentApplicableToJourney(def.id, def.name, T.journey_type)` (applicable to that
   category), and
4. `isDocumentShareableAcrossCandidates(def)` (petitioner-side / explicitly flagged; any
   BENEFICIARY role => not shareable).

- **No `getBaseVisaCategory` equality gate.** It is redundant: petitioner docs (no
  `applicableVisas` restriction) become eligible for every journey incl. IR-1; beneficiary
  docs are blocked everywhere by rule 4; `parents-marriage-cert` (applicableVisas [IR-5],
  shareable:true) is offered only to IR-5 siblings because rule 3 blocks IR-1. Nothing wrong
  leaks.
- **Default CHECKED (opt-out)** for eligible targets in both upload modals; beneficiary docs
  have zero eligible targets, so nothing irrelevant is shown. Respect manual unchecks per
  session (`MultipleDocumentUploadModal` already has `manuallyUncheckedIds`; add the same to
  the single modal).
- **Dedupe by `journey_type`** and keep the candidate-identity pill (already implemented) so
  two IR-5 siblings are distinguishable; an IR-1 target shows no pill (single beneficiary, no
  ambiguity).
- **Storage**: sharing already writes one blob + one extra metadata row per target journey;
  delete is ref-counted on `storage_path`. Unchanged.

## 13. Marriage certificate handling (spec 10) - verified verdict

- **Do NOT blanket-flag all beneficiary marriage certs shareable.** Two sponsored IR-5
  parents are not necessarily married to each other (divorced parents, mother + step-father,
  etc.), so `parent-mrc` (each parent's OWN marriage) is genuinely person-specific in the
  general case; auto-sharing it would leak a mother's marriage-to-someone-else certificate to
  the father's journey. **Keep `parent-mrc` non-shareable.**
- The correct shared vehicle already exists and is correctly modeled: **`parents-marriage-cert`
  = the petitioner's mother+father marriage, `shareableAcrossCandidates: true`, applicableVisas
  [IR-5]** - offered between the two IR-5 parent journeys only. Keep as-is.
- **IR-1 spouse marriage evidence** (`nadra-mrc`, `nikah-nama`) is isolated from unrelated
  IR-5 journeys today, but only via `requiredWhen`; `applicableVisas` over-broadly lists all
  FAMILY_VISAS. **Targeted hardening (recommended): set `applicableVisas` on `nadra-mrc` and
  `nikah-nama` to `[IR-1, CR-1]`** so applicability alone keeps them out of IR-5 (defense in
  depth), independent of `requiredWhen`. This is a data-definition tweak, not a rule change,
  and it directly protects the new cross-category sharing from leaking spouse marriage docs
  into IR-5.
- Net: the existing role/applicability model is correct for marriage certs after the one
  `applicableVisas` tightening; no new sharing rule is needed beyond section 12.

## 14. Petitioner shared data (spec 14)

`SHARED_PETITIONER_FIELDS` (income, sponsor, tax, household, address, employment) already
auto-sync across candidates via the profile; `CANDIDATE_SPECIFIC_FIELDS` stay isolated. This
is correct and unchanged. Petitioner DOCUMENTS become shareable across categories via section
12. Clearly label in code: SHARED petitioner profile/doc vs JOURNEY-SPECIFIC beneficiary data.

## 15. Tools (spec 19) - journey-specific (decision 6)

All journey-aware tools switch their state/data with the active journey. Shared petitioner
INPUTS stay shared (one petitioner profile), but each tool's per-journey SESSION/OUTPUT is
scoped to the active journey.
- `interview-prep` (`app/(tools)/interview-prep/page.tsx:329-373`): stop keying only on a URL
  `?journey_id=` / `localStorage interviewPrepJourneyId`; resolve the active journey from the
  candidate context so a candidate switch re-scopes it (align with the vault pattern). Its
  server tables are already `journey_id`-scoped, so this is mainly wiring the active journey
  in.
- `221g-action-planner`, `affidavit-support-calculator`, `visa-case-strength-checker`
  (currently global, reading `MasterProfile` only): make their SAVED state/output
  journey-scoped. Where the tool's saved artifact lives on the profile (e.g.
  `profile.actionPlanner`, `profile.caseStrength` are in `CANDIDATE_SPECIFIC_FIELDS`), it is
  already per-candidate via the profile isolation - VERIFY each tool actually reads the
  active-candidate-scoped slice rather than a single global field, and re-scope the ones that
  do not. Petitioner-side inputs (income, household for the affidavit) remain shared; the
  RESULT/session is per journey.
- Size note: this is a broader sweep than a single file; enumerate each journey-aware tool,
  confirm its current scope, and re-scope those that are global. Genuinely account-global
  utilities (PDF converter, passport-photo) need no change.

## 16. Roadmap / guides (spec 20)

- Guides are already `candidateId`-scoped and switch correctly - the model to emulate. No
  change beyond letting IR-1 candidates flow through (they already can).
- Roadmap/step completion is per journey row (via `backendId`), already isolated. Fix the
  `useWizard` actions-memo stale-candidate bug (L695 deps omit `effectiveCandidateId`) so
  cache invalidation uses the current candidate after a switch.

## 17. Server-side security (spec 13, 17)

- `POST /api/documents/upload`: stop trusting `shareWithJourneyIds`. Server loads each target
  journey for the user and drops any that fail: owned-by-user, != active journey, applicable,
  shareable. One authoritative helper shared client+server: add
  `canShareDocumentToJourney(def, targetJourneyType)` = applicability && shareable. If an
  import cycle appears (`candidate-sharing` <- `journey-mapping` <- `candidateSyncService`),
  put the combined helper in a dependency-safe module or inject the applicability predicate;
  never duplicate a slightly different rule.
- `DELETE /api/documents/[id]`: keep the user-scoped `storage_path` ref-count. Verify no
  cross-user references and no orphaned/duplicate blobs under the new wider sharing.

## 18. Data model (spec 16, 27)

**No DB migration required.** `journeys` (`UNIQUE(user_id, journey_type)`),
`profile.candidates` JSON, `candidate.visaCategory`, and candidate-scoped `journey_type`
already model Candidate -> Journey for every category. Do not add a `candidate_id` column to
`journeys`. The only optional data-definition edits are documents (section 13
`applicableVisas` tightening) - not schema.

---

## 19. Exact file-by-file changes

### MODIFY - switcher/roster generalization
- `app/components/layout/SiteHeader.tsx` (L494-522, 1718, 1816): change
  `hasCandidateJourney`/`showCandidateSwitcher` from the `["IR-5","IR-2"]` allowlist to
  "account has **2+** real candidates/journeys" (decision 2). Keep the `resolvedUserId`-keyed
  effect (do not regress the auth re-ref fix). Ensure "+ Add Candidate" is reachable at 1
  candidate (profile dropdown / badge menu), since the switcher tray is hidden then.
- `app/components/candidate/ActiveCandidateBadge.tsx` (L32-39): drop the IR-5/IR-2 string
  gate; the badge shows the active candidate for any category (incl. IR-1), even with a single
  candidate. (Note: SiteHeader also renders an inline badge; pick ONE badge source to avoid
  duplicates.)
- `app/(tools)/document-vault/page.tsx` (L231-243): generalize `isCandidateJourney` so IR-1 is
  a normal candidate journey too (IR-1 + IR-5 scope; IR-2 out of scope per decision 3).
- `lib/constants/routes.ts` (L18-23) `getJourneyHrefByType`: it already maps IR-1 and IR-5
  correctly; **no IR-2 route work (decision 3)**. Only replace the "unknown -> IR-1" silent
  fallback with an explicit no-op/guard so an unknown category never mis-navigates to IR-1.
- `app/(tools)/(visa)/visa-category/[visa-journey]/page.tsx` (L104-125): generalize the
  URL auto-redirect so IR-1 <-> IR-5 both work via
  `getJourneyHrefByType(activeCandidate.visaCategory)` when slug != active category; keep
  `IR5_ENABLED` gating but stop hardcoding IR-1 as the universal fallback. (IR-2 untouched.)

### MODIFY - Add Candidate category-agnostic
- `app/components/candidate/AddCandidateModal.tsx` (L39-42, 50-54, 89-108): offer relations
  for all supported categories (incl. Spouse) driven by `getVisaCategoryForRelation`; keep the
  single-Spouse cardinality (block adding a 2nd spouse only).
- `app/context/CandidateContext.tsx` (L206-212): keep the "one spouse" guard but ensure it
  blocks only ADDING a second spouse; expose `activeJourneyKey`/`activeJourneyBase` derived
  values; neutralize the hardcoded IR-5/"Mother" empty-state fallback object (L306-321).
- `app/components/candidate/CandidateSwitcherTray.tsx` (L116-118, 128-133, 282-289): generalize
  `isIr5/isIr2` add-button labels to "+ Add Candidate"; generalize roadmap-route detection.

### MODIFY - journey key/config honor candidate.visaCategory
- `app/(main)/dashboard/hooks/useWizard.ts`: pass/derive `journey_type` from the active
  candidate's `visaCategory` (not just the URL slug) when scoping `initialize`; add
  `effectiveCandidateId` to the actions memo deps (L695) to fix the stale cache-bust.
- `app/api/journeys/initialize/route.ts` (L85, config path): when a candidate's category
  differs from the posted base, derive `effectiveJourneyType` and `configType` from the
  candidate's category so a cross-category candidate gets the correct row + config.

### MODIFY - forms isolation
- `app/components/forms/auto-visaform-filling/MultiStepForm.tsx` (L157, buildDraftStorageKey
  L54-57, hydration L219): `draftJourneyKey = activeJourneyKey`; scope localStorage backup by
  journey key.
- `app/api/visa-forms/[formCode]/progress/route.ts` (L42/88/117 and body L672/748): use the
  posted journey key; read with fallback to legacy `"global"`.

### MODIFY - tools
- `app/(tools)/interview-prep/page.tsx` (L329-373): resolve the active journey from context
  (candidate switch aware) rather than URL/localStorage only.

### MODIFY - document sharing rule + server enforcement
- `lib/document-vault/candidate-sharing.ts`: add `canShareDocumentToJourney(def,
  targetJourneyType)` (applicability + shareable); keep `isDocumentShareableAcrossCandidates`.
- `app/components/document-vault/DocumentUploadModal.tsx` + `MultipleDocumentUploadModal.tsx`:
  drop the same-base gate; use `canShareDocumentToJourney`; default-check eligible targets;
  keep dedupe + candidate pill (already present).
- `app/api/documents/upload/route.ts` (L419-445): filter `shareWithJourneyIds` server-side
  through `canShareDocumentToJourney` + user ownership before writing shared rows.

### MODIFY - document definitions (targeted hardening)
- `lib/document-vault/document-definitions.ts`: set `applicableVisas: [IR-1, CR-1]` on
  `nadra-mrc` and `nikah-nama`. Do NOT change `parent-mrc` or `parents-marriage-cert`.

### MODIFY - unknown category explicit (decision 5, REQUIRED)
- `lib/candidate/candidateSyncService.ts` (L241): `getBaseVisaCategory` must return an EXPLICIT
  unknown value for unknown/empty input instead of silently defaulting to IR-5. Because this
  has a wide blast radius (many callers currently rely on the IR-5 fallback), the required
  steps are: (a) enumerate every caller, (b) give each a correct local fallback/guard for the
  unknown value, (c) then flip the default. Ship this carefully with tests; a naive flip would
  regress callers that assumed IR-5.

### CREATE
- Tests: `__tests__/candidate/candidate-sharing.test.ts` (extend) and a new
  `__tests__/candidate/unified-switching.test.ts` (context-level switching + key derivation).
- Optionally `lib/candidate/activeJourney.ts` (or a `useActiveJourney` hook) if the derived
  values do not fit cleanly on `CandidateContext`.

### MUST NOT CHANGE
- `journeys` schema / any migration (no `candidate_id` column).
- Ref-counted delete logic; one-blob storage.
- `SHARED_PETITIONER_FIELDS` / `CANDIDATE_SPECIFIC_FIELDS` split.
- `getVisaCategoryForRelation`, `getDefaultCandidatesForVisa`, `getCandidateJourneyKey` core
  logic (consume, do not rewrite).
- The `resolvedUserId`-keyed SiteHeader effect shape (auth re-ref fix must survive).

---

## 20. Tests (spec 25)

A. Switching: IR-1<->IR-5, IR-5 Mother<->Father, IR-2<->IR-5, multi-category account - active
   journey key + navigation resolve correctly.
B. Isolation: forms draft, documents, roadmap progress, tools scope isolated per candidate
   (2nd candidate does not overwrite the first's form draft after the fix).
C. Shared petitioner docs: petitioner passport IR-5->IR-1, IR-1->IR-5, Mother->Father all
   offered + default-checked.
D. Beneficiary docs: beneficiary passport/CNIC/medical/police never cross-share (zero
   targets).
E. Marriage cert: `parents-marriage-cert` shareable Mother<->Father only (not to IR-1);
   `parent-mrc` never auto-shared; `nadra-mrc`/`nikah-nama` never applicable to IR-5.
F. Security: foreign/other-user/invalid/non-applicable/beneficiary target rejected server-side.
G. UI: switcher lists all categories incl. IR-1; active highlighted; Add Candidate works
   (incl. one-spouse guard); default sharing checked; manual uncheck respected; switching
   refreshes full journey context.
- Run `npx jest __tests__/candidate/` and `NODE_OPTIONS=--max-old-space-size=8192 npx tsc
  --noEmit` (ignore pre-existing `.next/types/validator.ts` route errors).

## 21. Backward compatibility (spec 24)

- Existing IR-1 user: keeps working; now also sees the switcher/badge (one candidate).
- Existing IR-5 single/two-parent users: unchanged; two parents already isolated.
- Existing IR-1 + IR-5 user: both now appear in one switcher (previously IR-1 was hidden).
- Existing form drafts (`journey_key="global"`): still readable via the legacy fallback; new
  writes are journey-scoped. No data rewrite.
- Existing document shares: unchanged (same storage/ref-count mechanism).
- No destructive data changes; no migration.

## 22. Risks

- **Widening the switcher to IR-1** could surprise single-journey users; mitigate with the
  one-candidate display rule and keeping it in the profile dropdown.
- **Forms draft re-key** is the highest-risk change (touches save/resume + PDF generation);
  do it behind the legacy fallback and test save/resume across a candidate switch.
- **Honoring candidate.visaCategory in initialize/useWizard** touches the core journey load
  path; regression risk on the existing single-journey flow - cover with the wizard load
  tests and manual walk-through.
- **Per-journey entitlement resolution (decision 1, Phase 5)** is the most product-sensitive
  change: mis-wiring it could either over-lock a paid journey or leak premium to an unpurchased
  category. Verify current resolution first; cover with the buy-IR5 / buy-IR1 entitlement
  tests; ship behind careful review.
- **Client/server sharing-rule drift** - mitigated by one shared helper.
- **`getBaseVisaCategory` unknown change (decision 5)** has wide blast radius - must audit all
  callers and add guards BEFORE flipping the default, or callers that assumed IR-5 regress.
- **Forms draft re-key** touches save/resume + PDF generation; ship behind the legacy
  `"global"` read fallback and test save/resume across a candidate switch.

## 23. Rollout / implementation order (updated for locked decisions)

1. **Phase 1 (low risk, high value): document sharing.** Shared `canShareDocumentToJourney`,
   drop same-base gate, default-check eligible targets, server enforcement, marriage-cert
   `applicableVisas` tightening (`nadra-mrc`/`nikah-nama` -> [IR-1,CR-1]), tests.
   Self-contained; ships independently.
2. **Phase 2: switcher/badge generalization + `activeJourneyKey`.** SiteHeader gate -> "2+
   candidates" (decision 2), ActiveCandidateBadge shows any category, vault
   `isCandidateJourney` includes IR-1, `getJourneyHrefByType` unknown-guard (no IR-1
   fallback; no IR-2 work), router redirect generic IR-1<->IR-5. Move "+ Add Candidate" to a
   location reachable at 1 candidate. Expose `activeJourneyKey`/`activeJourneyBase` from
   `CandidateContext`. UI-only.
3. **Phase 3: unknown-category explicit (decision 5).** Audit `getBaseVisaCategory` callers,
   add local guards, then flip the default off IR-5. Tests. (Do before/with Phase 4-5 since
   later phases rely on correct category resolution.)
4. **Phase 4: Add Candidate category-agnostic + honor candidate.visaCategory.** Allow Spouse
   (keep one-spouse cardinality); make `initialize`/`useWizard` derive journey key/config from
   `candidate.visaCategory`; fix the useWizard actions-memo stale-candidate bug.
5. **Phase 5: per-journey entitlement resolution (decision 1) - product-sensitive.** Verify
   current `PlanContext`/entitlement resolution, then resolve the active journey's tier from
   the EXISTING per-journey `journeys.subscription_tier` so an unpurchased category stays
   locked to free/preview. Entitlement tests (buy IR-5 -> IR-1 still locked; buy IR-1 ->
   unlocks). No new billing code.
6. **Phase 6: data + tool isolation (decision 4 + 6).** Forms draft re-key by active journey
   (client + `visa-forms` API, legacy `"global"` fallback on read); interview-prep candidate
   awareness; re-scope 221g/affidavit/case-strength saved state per active journey (shared
   petitioner inputs stay shared).
7. **Phase 7: docs (`multi-candidate-desciption.md`) + full regression + backward-compat
   verification.**

## 24. Open questions / verification items (decisions 1-6 are locked in section 0)

Remaining items are verifications to do DURING implementation, not blocking decisions:
1. **Entitlement resolution (Phase 5)**: confirm exactly how `PlanContext` +
   `lib/entitlements/*` compute the effective tier today (account-level
   `user_profiles.subscription_tier` vs per-journey). This sizes the decision-1 change; the
   direction is fixed (per active journey's category), only the mechanism needs confirming.
2. **"+ Add Candidate" entry point at 1 candidate**: confirm the preferred spot (profile
   dropdown vs a badge menu) - plan assumes the profile dropdown.
3. **Tool re-scope inventory (Phase 6)**: enumerate each journey-aware tool and confirm which
   already read a candidate-scoped profile slice vs a single global field, so only the truly
   global ones are re-scoped.
4. **`getBaseVisaCategory` unknown value**: pick the explicit sentinel (e.g. `"UNKNOWN"` vs
   `null`) and confirm it satisfies the type `VisaCategory` callers, or widen the return type.
```

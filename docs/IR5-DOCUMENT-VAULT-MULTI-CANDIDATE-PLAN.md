# IR-5 Document Vault - Multi-Candidate Support - Implementation Plan

> Status: APPROVED PLAN (pre-implementation). No code has been changed yet.
> Follow this document during implementation. Do not improvise outside it.
> If reality diverges from this plan, update this file first, then code.

---

## Implementation Status (updated during build)

SHIPPED (Steps 1-13, 15, 16):
- Migration `supabase/migrations/20260917_01_ir5_candidate_support.sql` (documents.candidate_id
  + indexes, document_vault_config.candidates).
- Types (`types.ts`): `candidateId`, `candidates`, `shareableAcrossCandidates`, `VaultCandidate`,
  plus derived `isShared` / `sharedCandidateLabels`.
- Lib `candidate-sharing.ts`: relevance rule + roster helpers + `getCandidateShareTargets`.
- `storage-database.ts`: candidate mapping + filters + `getDocumentsByStoragePath`.
- Config route: `candidates` passthrough.
- Upload route: `candidateId` + `shareWithCandidateIds` (roster-validated, reuses storage_path).
- List route: candidate filter + legacy-null-belongs-to-first-candidate + isShared annotation.
- Delete route: `scope=candidate|all` + storage_path ref-count guard (also fixes the
  pre-existing cross-journey orphan bug).
- Store: `currentCandidateId`, `candidates`, `setCandidate`, threaded `candidateId`,
  `deleteDocument(id, scope)`.
- `ShareTargetSelector.tsx` extracted; single-doc upload modal uses it for journeys AND
  candidates; opt-in default.
- Vault page: candidate switcher + "Add parent" (capped) + shared-aware 3-way delete dialog.
- Doc-definition override: `parents-marriage-cert` -> shareableAcrossCandidates: true.
- Unit tests `__tests__/candidate-sharing.test.ts` (17 passing). tsc clean (only the
  pre-existing unrelated @types/dompurify error remains).

DELIBERATE DEVIATIONS FROM PLAN:
- Step 11: implemented the share-target logic as a PURE selector `getCandidateShareTargets`
  in `candidate-sharing.ts` instead of a separate hook file (simpler, testable, keeps logic
  in lib). No behavior difference.
- Step 12 (bulk `MultipleDocumentUploadModal`): candidate-SCOPED (uploads carry candidateId)
  but per-document candidate cross-share UI is DEFERRED. Users can cross-share individual
  documents from the single-document upload modal.

DEFERRED (optional follow-ups, not required by the task):
- Step 14: the cosmetic "Shared" badge on `DocumentTableView` / `DocumentCard` rows. The
  shared state is already surfaced where it matters (the delete dialog). Left out to avoid
  destabilizing the large table component; `isShared`/`sharedCandidateLabels` are already on
  each document if we add the badge later.
- Per-document candidate cross-share in the bulk modal (see above).
- Fine-tuning which specific petitioner FINANCIAL docs are offered for sharing (currently
  all petitioner-role docs are offered; opt-in default makes over-offering low-harm).

---

## 0. Decision Record (locked)

- **Chosen model: Option A** - a "candidate" is a **sub-scope inside ONE IR-5 journey**
  (Candidate 1 / Candidate 2 / ... = the two parents). We do NOT create a second IR-5
  journey per user, and we do NOT touch the `journeys` table or its
  `UNIQUE(user_id, journey_type)` constraint.
- **Scope: Document Vault only.** The rest of IR-5 (journey steps, `case_data`,
  case-strength, form autofill) stays single-beneficiary for now. The candidate concept
  lives entirely inside the vault (documents + vault config + vault UI).
- **Sharing model: reference by shared `storage_path`, not physical file copy.** A file
  shared across candidates is represented as multiple `documents` rows that point at the
  SAME encrypted blob. Deletion is made safe by reference-counting `storage_path`.
- **Relevance: metadata/role driven.** Only documents that logically belong to the shared
  U.S.-citizen petitioner (or joint sponsor / household member) are offered for
  cross-candidate sharing. Each parent's own identity/civil docs are candidate-specific
  and never trigger the prompt.
- **Scalability: split by layer (locked clarification).**
  - **Data model + reusable sharing logic = N-candidate capable.** `candidate_id` is a
    string id; the roster is an array; no query, migration, or `lib` helper assumes exactly
    two candidates. This is what future categories (e.g. IR-2, multiple children) will reuse.
  - **IR-5 UX / business flow = exactly 2 candidates (Parent 1, Parent 2).** The IR-5 vault
    UI caps "Add parent" at 2 and shows a simple 2-candidate switcher. Do NOT over-engineer
    the IR-5 UI for 3+ candidates. The N-capability is in the data/lib layer only.
- **Cross-candidate share default = unchecked / opt-in.** The user must explicitly choose to
  share a document with the other candidate.

---

## 1. Current Architecture (verified facts, with file refs)

The vault is a **flat, journey-scoped, one-row-per-file model. There is NO association /
junction table today.**

- **DB `documents`** (`supabase/migrations/20260228_19_create_document_vault_tables.sql`,
  `20260717_add_journey_id_to_documents.sql`):
  `id TEXT PK`, `user_id` (FK), `document_def_id TEXT` (string key into `ALL_DOCUMENTS`,
  not a FK), `journey_id` (FK journeys, nullable), `storage_path`, filenames, `version`,
  `status`, `uploaded_by` (role), `expiration_date`, `notes`, compressed-* columns.
  One document = one row = one journey. **No person/candidate column.**
- **Physical file:** `document-vault/{userId}/{documentId}/{filename}` in Supabase Storage,
  AES-256-GCM encrypted with a **per-user** key (`lib/document-vault/file-encryption.ts`).
- **DB `document_vault_config`:** one row per `(user_id, journey_id)`
  (`20260731_01_update_vault_config_constraints.sql`). Holds `visa_category`,
  `scenario_flags` JSONB, single `petitioner_name` / `beneficiary_name` /
  `joint_sponsor_name`, `dynamic_documents` JSONB.
- **Server storage layer:** `lib/document-vault/storage-database.ts`
  (`DocumentDatabaseStorage`) - maps rows <-> `UploadedDocument`; all reads filter by
  `user_id` and optionally `journey_id`.
- **Client state:** `lib/document-vault/store.ts` (Zustand), scoped by
  `currentJourneyId`. Reads via `/api/documents/config` and `/api/documents/list`.
- **Required-doc generation:** `lib/document-vault/personalization-engine.ts`
  (`generateRequiredDocuments`) filters `ALL_DOCUMENTS` by `applicableVisas` +
  `scenario_flags`.
- **Vault page:** `app/(tools)/document-vault/page.tsx` - owns the journey folder-picker
  (`userJourneys.length > 1` -> grid at ~`:846`), the delete `ConfirmationModal`
  (`handleDelete`/`confirmDelete` ~`:629-670`), and wires `onDelete`/`onUpload` into
  `DocumentTableView` / `DocumentCard`.

## 2. Existing "IR-1 sharing" (what it really is)

The reactive "you already uploaded this, use here too?" prompt **does not exist**. What
exists is a proactive, pre-checked **"Cross-share this document"** block that shares an
upload across the user's OTHER journeys of a DIFFERENT type (e.g. IR-1 + F-1):

- UI block: `DocumentUploadModal.tsx:904-969` (bulk copy in `MultipleDocumentUploadModal.tsx`).
  `otherJourneys` built at `:133-139`, excludes active + same-type (`isSameJourneyType`),
  filtered by `isDocumentApplicableToJourney(...)`.
- Post: `shareWithJourneyIds` (`:413-415`).
- Server: `app/api/documents/upload/route.ts:418-445` inserts a NEW row per target journey
  by spreading the original, **reusing the same `storage_path`** (N rows -> 1 blob). No
  ref-count, no link column, no join table.
- Relevance: `lib/document-vault/journey-mapping.ts:isDocumentApplicableToJourney`
  (`:395-446`) - visa-category granularity only.

**Latent bug we must fix:** DELETE (`app/api/documents/[id]/route.ts:42-90`) blindly
removes the blob at `storage_path` + the single row, with no awareness that other rows
share that `storage_path`. Deleting the "original" orphans the shared copies.
`store.deleteDocument` (`store.ts:334-361`) has no shared-doc handling.

## 3. Why NOT a join table (design note for future-me)

A `document_candidates(document_id, candidate_id)` join table would be the textbook
"association" answer, but it forces every read path (list, config, store, stats,
personalization) to become join-aware, which is a large surface change for a
vault-scoped feature. Instead we **reuse the pattern the codebase already uses for
sharing** (multiple rows sharing one `storage_path`) and add a single `candidate_id`
column. The "association" identity IS the row; the "shared physical file" identity is the
`storage_path`. Reference counting is a cheap `count(*) where storage_path = ?` query.
This fixes the existing cross-journey delete bug at the same time. If we ever need
per-file shared metadata sync (one edit reflects everywhere), revisit the join table then.

---

## 4. Data Model Changes (Option A)

### 4.1 Migration `supabase/migrations/2026XXXX_ir5_candidate_support.sql` (additive, backward-safe)

```sql
-- documents: which candidate (parent) this row belongs to. NULL = legacy / single-candidate.
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS candidate_id TEXT;

CREATE INDEX IF NOT EXISTS idx_documents_journey_candidate
  ON public.documents(journey_id, candidate_id);

-- vault config: the candidate roster for this journey. Empty/absent = single-candidate.
ALTER TABLE public.document_vault_config
  ADD COLUMN IF NOT EXISTS candidates JSONB DEFAULT '[]'::jsonb;
```

- No `NOT NULL`, no constraint changes, no data backfill required. Existing IR-1 and
  single-parent IR-5 rows keep `candidate_id = NULL` and behave exactly as today.
- RLS unchanged (still `auth.uid() = user_id`; candidate is not a security boundary,
  it is a within-user sub-scope).

### 4.2 Candidate roster shape (stored in `document_vault_config.candidates`)

```ts
interface VaultCandidate {
  id: string;      // stable id, e.g. "candidate_1", "candidate_2"
  label: string;   // display label, e.g. "Parent 1", "Parent 2"
  name?: string;   // optional real name for filename/UX
}
```
- IR-5 journeys seed `[{ id: "candidate_1", label: "Parent 1" }]` on first config save.
- "Add second parent" appends `{ id: "candidate_2", label: "Parent 2" }`.
- Non-IR-5 journeys leave `candidates` empty -> vault is single-candidate (unchanged).

### 4.3 Type changes (`lib/document-vault/types.ts`)

- `UploadedDocument`: add `candidateId?: string | null;`
- `DocumentVaultConfig`: add `candidates?: VaultCandidate[];`
- `DocumentDefinition`: add `shareableAcrossCandidates?: boolean;`
  (explicit override; see 5 for the default rule)
- Add and export `interface VaultCandidate` (above).

---

## 5. Relevant Document Logic (which docs are shareable across candidates)

Business logic lives in **lib**, never in the modal. Add
`lib/document-vault/candidate-sharing.ts`:

```ts
// A document is shareable across candidates when it belongs to the shared U.S.-citizen
// petitioner / joint sponsor / household member (identical for every parent's case),
// NOT to an individual parent. Default is derived from roles; an explicit flag overrides.
export function isDocumentShareableAcrossCandidates(def: DocumentDefinition): boolean {
  if (def.shareableAcrossCandidates === true) return true;
  if (def.shareableAcrossCandidates === false) return false;
  const roles = def.roles ?? [];
  if (roles.length === 0) return false;
  const sharedRoles = ["PETITIONER", "JOINT_SPONSOR", "HOUSEHOLD_MEMBER"];
  // shared only if EVERY role is a shared role and BENEFICIARY is not involved
  return roles.every((r) => sharedRoles.includes(r));
}
```

- **Automatically shareable** (petitioner / sponsor / household docs): petitioner
  citizenship proof, petitioner birth certificate, I-864 + tax / W-2 / pay stubs,
  joint-sponsor and household-member docs, petitioner U.S. passport, etc.
- **Automatically candidate-specific** (any BENEFICIARY role): each parent's passport,
  CNIC, birth certificate, marriage/nikah, divorce, police certificate, medical, photos.
- **Override knob:** set `shareableAcrossCandidates: true|false` on a specific
  `DocumentDefinition` in `document-definitions.ts` when the role heuristic is wrong
  (e.g. "parents' marriage certificate" that documents BOTH parents may be marked
  `true` explicitly). This keeps the rule config-driven and extensible without editing UI.
- The upload modal only shows the cross-candidate prompt when
  `isDocumentShareableAcrossCandidates(def) === true` AND the journey has >1 candidate.

**Action item during impl:** audit IR-5 doc definitions and set explicit overrides only
where the role-based default is wrong. Do not hardcode a name list in the UI.

---

## 6. Proposed Upload Flow (step by step)

1. User is in the vault for an IR-5 journey, active candidate = Candidate 1
   (`store.currentCandidateId`).
2. User opens the upload modal for a document type `def`.
3. Modal computes share targets via a new hook `useCandidateShareTargets(def)`:
   - returns `[]` unless `isDocumentShareableAcrossCandidates(def)` and
     `config.candidates.length > 1`.
   - otherwise returns the OTHER candidates (all candidates except the active one).
4. If targets exist, the modal renders the existing "Cross-share this document" block,
   relabelled for candidates (reused component `ShareTargetSelector`), listing the other
   candidates with checkboxes. Copy (ASCII only): `Also use this document for:` and each
   row shows the candidate label. **Default: unchecked (opt-in) - LOCKED.** The user must
   explicitly tick a candidate to share. (The journey-share block defaults checked; the
   candidate block intentionally does not, because sharing a wrong doc across parents is a
   real error.)
5. On submit, modal posts (multipart) to `/api/documents/upload`:
   - existing fields + `candidateId` (active candidate)
   - `shareWithCandidateIds` = JSON array of selected other candidate ids
   - existing `shareWithJourneyIds` still supported (cross-journey), independent.
6. Server (`upload/route.ts`):
   - saves the primary row with `candidate_id = candidateId`.
   - for each id in `shareWithCandidateIds`: insert a NEW row (new `id`, per-candidate
     `version`) spreading the primary, with `candidate_id = thatId` and the SAME
     `storage_path` (mirrors the existing journey-share block at `:418-445`). No new blob.
   - guard: ignore candidate ids not in the journey's roster (validate against config).
7. Response -> `store.reloadDocuments(journeyId, candidateId)` refreshes the active
   candidate's list. Other candidate's rows appear when the user switches candidate.

## 7. Proposed Delete Flow (step by step, shared-safe)

1. User clicks delete on a document under Candidate 1. `page.tsx:handleDelete` runs.
2. The vault already knows this row's `storage_path` (documents carry it). We compute
   whether it is shared: a doc is "shared" if another row (any candidate in this journey,
   or any journey) references the same `storage_path`. Expose this via the list payload
   (add a derived `sharedCandidateLabels?: string[]` / `isShared` to each doc in
   `/api/documents/list`) so the client does not need an extra round-trip.
3. If NOT shared: existing single "Delete Document? This cannot be undone." confirm.
4. If shared: `ConfirmationModal` shows a distinct choice (ASCII copy):
   - Title: `This document is used for more than one candidate`
   - Body: `It is also used for: <labels>. Remove it only from <active label>, or delete
     the file for everyone?`
   - Two actions: `Remove from <active label> only` and `Delete for all candidates`.
5. Client calls `DELETE /api/documents/[id]?scope=candidate` (default) or `?scope=all`.
6. Server (`[id]/route.ts` DELETE):
   - Look up the row (owner-checked).
   - `scope=candidate`: delete ONLY this row. Then remove the blob ONLY IF no remaining
     row references this `storage_path` (ref-count query
     `storage-database.getDocumentsByStoragePath`). Otherwise keep the blob.
   - `scope=all`: find all rows in THIS journey sharing this `storage_path`, delete them
     all, then remove the blob if no rows outside this journey still reference it.
   - Backward-compat / bug fix: even for a plain single delete, ALWAYS ref-count
     `storage_path` before removing the blob (this fixes the existing cross-journey
     orphan bug without changing observable single-doc behavior).
7. `store.deleteDocument(id, scope)` updates local state; refresh statuses + notifications.

## 8. Candidate management (vault-only UX)

- Add a lightweight candidate switcher + manager in the vault, mirroring the existing
  journey folder-picker pattern (`page.tsx:846`). Shown ONLY when the active journey is
  IR-5 (or generally when `config.candidates.length >= 1`).
- Controls: switch active candidate; "Add parent" (append `candidate_N`); rename; remove.
- **IR-5 cap:** the UI allows at most 2 candidates for IR-5 (hide/disable "Add parent"
  once 2 exist). The cap is a UI/business rule only - the data model and lib helpers stay
  N-capable so future categories (IR-2 etc.) can raise it without a schema or logic change.
  Keep the cap as a single named constant (e.g. `getMaxCandidates(journeyType)`), not a
  magic number scattered in the component.
- Persisted in `document_vault_config.candidates` via the existing
  `POST /api/documents/config` (thread `candidates` through the config route + store).
- Removing a candidate: delete that candidate's candidate-specific rows (their
  `candidate_id`), and for shared rows remove only that candidate's row (blob kept via
  ref-count if others reference it). Confirm before removing a candidate that has docs.

---

## 9. Modal Strategy (extend, do not fork)

- **Extend** `DocumentUploadModal.tsx` and `MultipleDocumentUploadModal.tsx`. Do NOT
  create an IR-5-specific modal.
- Extract the existing cross-share block (`:904-969`) into a reusable presentational
  component `app/components/document-vault/ShareTargetSelector.tsx`
  (`{ title, targets, selectedIds, onToggle }`). Feed it journey targets (existing) OR
  candidate targets (new) - same UI, no duplicated markup.
- Put the "what are my share targets" logic in a hook
  `lib/document-vault/useCandidateShareTargets.ts` (or extend an existing hook) so the
  modal stays presentational. Business rule (`isDocumentShareableAcrossCandidates`) lives
  in `candidate-sharing.ts`.
- Net: one modal, two kinds of share targets (journeys + candidates), each gated by its
  own relevance rule.

## 10. Frontend Changes (components / hooks / state)

- `lib/document-vault/store.ts`:
  - add `currentCandidateId: string | null` + `candidates: VaultCandidate[]` to state.
  - `setCandidate(id)`; thread `candidateId` into `initialize`, `reloadDocuments`,
    `/api/documents/list` + `/api/documents/config` calls.
  - `deleteDocument(id, scope?: "candidate" | "all")` - pass scope to the API.
  - `getStats()` - when candidate-scoped, count within the active candidate's docs.
- `app/(tools)/document-vault/page.tsx`:
  - render candidate switcher/manager for IR-5; set `activeCandidateId`.
  - upgrade `confirmDelete` to the shared-aware 3-way flow (7 above).
  - pass `activeCandidateId` into upload modals (like `activeJourneyId` today).
- `DocumentUploadModal.tsx` / `MultipleDocumentUploadModal.tsx`: use `ShareTargetSelector`
  + `useCandidateShareTargets`; post `candidateId` + `shareWithCandidateIds`.
- `DocumentTableView.tsx` / `DocumentCard.tsx`: show a small "Shared" badge on rows whose
  `storage_path` is shared with another candidate (data from list payload). No structural
  change to delete wiring (still `onDelete(id)`; page decides the scope prompt).

## 11. Backend / API / Data-layer Changes (checklist)

- Migration (4.1).
- `types.ts` (4.3) + export `VaultCandidate`.
- `lib/document-vault/candidate-sharing.ts` (5) - relevance rule + candidate helpers.
- `storage-database.ts`:
  - map `candidate_id` in `mapDatabaseToDocument` / `mapDocumentToDatabase`.
  - `getAllDocuments` / `getDocumentsByDefId` accept optional `candidateId` filter.
  - map `candidates` in `saveVaultConfig` / `mapDatabaseToConfig`.
  - add `getDocumentsByStoragePath(storagePath, userId)` for ref-count.
- `app/api/documents/upload/route.ts`: read `candidateId` + `shareWithCandidateIds`;
  validate ids against roster; set `candidate_id`; add candidate-share loop (mirror the
  journey-share loop, reuse `storage_path`).
- `app/api/documents/list/route.ts`: accept `candidateId`; when present, filter by it;
  add derived `isShared` / `sharedCandidateLabels` per doc (compute from same-journey rows
  sharing `storage_path`).
- `app/api/documents/[id]/route.ts` DELETE: add `scope` param; ref-count `storage_path`
  before blob removal; implement `candidate` vs `all`.
- `app/api/documents/config/route.ts`: pass `candidates` through GET/POST.
- `store.ts` + page + modals + table/card (10).

## 12. Backward Compatibility (how IR-1 stays untouched)

- All new DB columns are nullable / defaulted; no backfill.
- `candidateId` is only ever sent by the client for multi-candidate IR-5 journeys.
  When absent, list/upload/delete behave exactly as today (unfiltered by candidate).
- IR-1 (and single-parent IR-5) never render the candidate switcher and never send
  `shareWithCandidateIds`, so their code paths are byte-for-byte the current behavior.
- The only change to an existing path is the DELETE blob ref-count guard, which is
  strictly safer (it can only PREVENT an orphaning delete, never change a correct one).
- Existing cross-journey sharing (`shareWithJourneyIds`) is left as-is and now also
  benefits from the ref-count-safe delete.

## 13. Edge Cases to Handle

1. Partial share failure (some candidate rows saved, one fails): best-effort like the
   existing journey-share loop; log + continue; primary upload still succeeds; surface a
   non-blocking warning.
2. Delete "from this candidate only" on a shared doc: other candidate's row + blob remain;
   verify download still works for the other candidate afterward.
3. Delete "for all": all same-`storage_path` rows in the journey removed; blob removed.
4. Remove a candidate that owns docs: prompt; remove candidate-specific rows; drop that
   candidate's shared associations (ref-count keeps blobs used by others).
5. Duplicate rapid clicks: keep existing `isDeletingIds` guard; keep upload version safety
   (`getNextVersionNumber`) - now scoped per `(journey, candidate, def)`.
6. Candidate switched while a modal is open: capture `candidateId` at modal open, not at
   submit.
7. Two candidates with identical names: never key on name; always key on `candidate_id`.
8. More than two candidates (N): roster is an array, `candidate_id` is a string; no
   two-candidate assumptions in queries or UI.
9. Stale frontend state after switch: `reloadDocuments(journeyId, candidateId)` on switch;
   store's `currentCandidateId` gates which rows render.
10. Encryption: per-user key; shared rows reuse `storage_path` under the same user, so
    decryption is unaffected. Never re-encrypt on share.
11. A shareable doc uploaded BEFORE a second candidate existed: it simply has no share
    rows; user can re-open and share later, or we offer a "use for Parent 2" action on the
    card (optional, phase 2).
12. Version numbering: `getNextVersionNumber` must be computed per candidate scope so
    Parent 2's first copy is v1 under Parent 2 (matches the journey-share precedent).

## 14. Testing Plan (checklist)

Regression (must stay green):
- [ ] IR-1: upload, delete, cross-journey share unchanged.
- [ ] IR-1 delete of a cross-journey-shared doc no longer orphans the other journey's file
      (bug fix verification).

IR-5 single candidate:
- [ ] Behaves exactly like today; no candidate UI shown.

IR-5 two candidates:
- [ ] Candidate switcher appears; per-candidate lists are isolated.
- [ ] Shareable doc (e.g. petitioner I-864 / citizenship proof): prompt shown; sharing to
      Parent 2 creates a Parent-2 row with the SAME `storage_path` (one blob).
- [ ] Candidate-specific doc (passport / CNIC / birth / police): NO prompt.
- [ ] Delete shared "from Parent 1 only": Parent 2 still sees the doc; download works;
      blob intact.
- [ ] Delete shared "for all candidates": both rows gone; blob removed.
- [ ] Delete candidate-specific doc: only that row/blob removed.
- [ ] Upload cancellation: no rows created.
- [ ] Upload error / partial share failure: primary saved, warning surfaced, no crash.
- [ ] Refresh / reload: candidate associations persist; switcher restores.
- [ ] Duplicate delete clicks / duplicate upload clicks: no double rows, no crash.
- [ ] Remove a candidate: candidate-specific docs removed, shared blobs preserved when
      still referenced.

Type/build:
- [ ] `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` clean (builds hide TS errors).
- [ ] Render the vault for IR-5 two-candidate and confirm no hook-order / render crash
      (Jest + tsc do not catch these).

## 15. Ordered Implementation Steps

1. **Migration** (`supabase/migrations/2026XXXX_ir5_candidate_support.sql`) - add
   `documents.candidate_id` + index, `document_vault_config.candidates` JSONB. *Why:*
   foundation; additive + safe. *Reuse:* follows existing migration style.
2. **Types** (`lib/document-vault/types.ts`) - `UploadedDocument.candidateId`,
   `DocumentVaultConfig.candidates`, `DocumentDefinition.shareableAcrossCandidates`,
   export `VaultCandidate`. *Why:* typed contract for everything below.
3. **Relevance lib** (`lib/document-vault/candidate-sharing.ts`) -
   `isDocumentShareableAcrossCandidates` + candidate helpers (validate id against roster,
   next-candidate list). *Why:* business rule out of UI; single source of truth.
4. **Storage layer** (`storage-database.ts`) - map `candidate_id` + `candidates`; add
   `candidateId` filters; add `getDocumentsByStoragePath`. *Why:* data access for all
   routes. *Reuse:* existing mapper methods.
5. **Config route** (`app/api/documents/config/route.ts`) - pass `candidates` through
   GET/POST. *Why:* persist + read the roster.
6. **Upload route** (`app/api/documents/upload/route.ts`) - `candidateId` +
   `shareWithCandidateIds`; set `candidate_id`; candidate-share loop reusing `storage_path`.
   *Why:* create candidate-scoped + shared rows. *Reuse:* mirror the journey-share loop
   (`:418-445`).
7. **List route** (`app/api/documents/list/route.ts`) - `candidateId` filter + derived
   `isShared`/`sharedCandidateLabels`. *Why:* per-candidate lists + shared badge/delete UX.
8. **Delete route** (`app/api/documents/[id]/route.ts`) - `scope` param + `storage_path`
   ref-count guard + candidate/all logic. *Why:* safe shared delete + fix existing bug.
9. **Store** (`lib/document-vault/store.ts`) - `currentCandidateId`, `candidates`,
   `setCandidate`, thread `candidateId`, `deleteDocument(id, scope)`, candidate-scoped
   `getStats`. *Why:* client state for candidate scoping.
10. **ShareTargetSelector** (`app/components/document-vault/ShareTargetSelector.tsx`) -
    extract the existing cross-share block into a reusable presentational component.
    *Why:* reuse for journeys + candidates; no forked modal.
11. **Share-targets hook** (`lib/document-vault/useCandidateShareTargets.ts`). *Why:* keep
    modal presentational.
12. **Upload modals** (`DocumentUploadModal.tsx`, `MultipleDocumentUploadModal.tsx`) - use
    `ShareTargetSelector` + hook; post `candidateId` + `shareWithCandidateIds`. *Why:*
    the cross-candidate prompt.
13. **Vault page** (`app/(tools)/document-vault/page.tsx`) - candidate switcher/manager;
    pass `activeCandidateId`; upgrade `confirmDelete` to shared-aware 3-way flow. *Why:*
    candidate selection + safe delete UX.
14. **Table/Card** (`DocumentTableView.tsx`, `DocumentCard.tsx`) - "Shared" badge from
    list payload. *Why:* make sharing visible.
15. **Doc-definition audit** (`document-definitions.ts`) - set explicit
    `shareableAcrossCandidates` overrides only where the role heuristic is wrong for IR-5.
    *Why:* correctness of the relevance rule.
16. **Tests** - add/adjust vault tests per section 14; run `tsc --noEmit`; render-check.
17. **Docs** - update `docs/PROJECT_KNOWLEDGE.md` (vault section) + CLAUDE.md notes AFTER
    implementation lands (per the "keep docs alive" rule). Update THIS file if anything
    diverged.

---

## 16. Guardrails while implementing

- Do not touch the `journeys` table or `UNIQUE(user_id, journey_type)`.
- Do not create a second IR-5 journey per user.
- Do not fork the upload modal; extend + extract.
- Do not put candidate ids or sharing rules inside components; keep them in `lib`.
- Keep all user-facing copy plain ASCII (no em/en dash, curly quotes, ellipsis char).
- Never re-encrypt or copy the physical blob when sharing; reuse `storage_path`.
- Never remove a blob without a `storage_path` ref-count check.
- Preserve all existing IR-1 behavior; new code paths are gated on candidate presence.
- Run `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` before calling anything done.
```

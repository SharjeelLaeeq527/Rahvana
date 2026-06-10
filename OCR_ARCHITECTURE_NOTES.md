# OCR + Auto-Fill + Profile — Architecture Notes

> Purpose: reference map of the modules that power document OCR, profile storage,
> auto-fill, and the journey step widgets. Used as the basis for the
> **mismatch-detection** feature. (Roman-Urdu friendly: yeh file batati hai konsa
> kaam kahan hota hai.)

---

## Module 1 — OCR extraction pipeline (`lib/document-ocr/`)

**Purpose:** Turn an uploaded document image → clean canonical profile fields.

| File | Purpose |
|------|---------|
| `registry.ts` | Source of truth for *which* vault docs are OCR-eligible. `getOcrConfig(defId)` → `{ docType, target }`. `getOcrDocTypeMeta(docType)` → `{ endpoint, fields[] }`. Field descriptors (`{key,label}`) drive the confirm-panel UI. docTypes: `passport`, `marriage`. targets: `self`, `beneficiary`. |
| `passportParser.ts` | `parsePassportText(raw)` → `{ fields, confidence, warnings, source }`. MRZ-first, label fallback. 8 fields (name.first/last, dateOfBirth, sex, nationality, passportNumber, passportExpiry, passportCountry). |
| `marriageParser.ts` | `parseMarriageText(raw)` → marriage date (+ place city). Label scan forward up to 18 lines (NADRA MRC is tabular), single-date fallback for blank-paper case. Keys: `relationship.marriageDate`, `relationship.marriagePlace.city/country`. |
| `crossCheck.ts` | **Mismatch detection core.** `crossCheckPassport(extracted, stored)` → `{ matches, mismatches, newFields }`. Normalizes dates/sex/text before comparing so formatting differences are NOT false mismatches. (Generalized with `crossCheckFields()` for any docType.) |
| `clientImage.ts` | `resizeImageIfNeeded(file)` — client-side downscale so files fit OCR.space free 1 MB limit before upload. |

**Vault doc → OCR mapping** (in `registry.ts`):
- `passport-petitioner` → passport/self · `passport-beneficiary` → passport/beneficiary
- `citizenship-proof-petitioner` → passport/self
- `nikah-nama`, `nadra-mrc` → marriage/self

---

## Module 2 — Extraction API routes (`app/api/documents/`)

**Purpose:** Auth + call OCR.space (free, engine 2, eng) + run the parser.

- `extract-passport/route.ts` → `{ docType:"passport", fields, confidence, source, warnings }`
- `extract-marriage/route.ts` → `{ docType:"marriage", fields, confidence, source, warnings }`
- Both: auth check, 1 MB limit (413 if over), OCR.space POST, parser, JSON back. No DB writes.

---

## Module 3 — Profile storage & read (`app/api/profile/`, `types/profile.ts`, `lib/encryption.ts`)

**Purpose:** Persist confirmed fields into `user_profiles.profile_details` (JSONB) and read them back decrypted.

- `types/profile.ts` — `MasterProfile` shape. Keys are dot-paths. Self fields top-level; spouse under `beneficiary.*`; marriage under `relationship.*`.
- `merge/route.ts` (**POST**, write) — body `{ fields: {dotPath:value}, target }`. `ALLOWED_PATHS` allow-list; `SENSITIVE_KEYS` (passport*) encrypted with `gcm:` **only for self**; `BENEFICIARY_PATH_MAP` prefixes `beneficiary.` when target=beneficiary. Deep-merges, never clobbers. Returns `{ success, saved[] }`.
- `route.ts` (**GET**, read) — decrypts `gcm:`-prefixed sensitive keys, returns `{ profile:{ profile_details }, profileCompleted }`.
- `lib/encryption.ts` — AES-256-GCM, format `gcm:<iv>:<tag>:<ct>`, key from `PORTAL_WALLET_SECRET`.

**Encryption note:** self passport fields encrypted at rest; beneficiary passport fields never encrypted. GET decrypts before client sees them → in-memory profile is plaintext (safe to compare).

---

## Module 4 — Client profile cache (`app/context/UserProfileContext.tsx`)

**Purpose:** One in-memory, decrypted `MasterProfile` for the whole app.

- `useUserProfile()` → `{ profile, isProfileLoading, updateProfile(partial,{silent,immediate}), saveProfile(), refreshProfile() }`.
- Loads via GET on auth; `updateProfile` does optimistic merge + debounced save (POST `/api/profile/complete`).
- **This is where mismatch detection reads "stored" values from — no extra fetch needed.**

---

## Module 5 — Auto-fill (`lib/autoFill/`)

**Purpose:** Push profile values into form fields and back.

- `mapper.ts` — `FIELD_MAPPINGS` (profile dot-path → form field-name variants), `autoFillForm()`, `mapFormToProfile()`, `getNestedProperty`/`setNestedProperty`. `relationship.marriageDate` → `marriage_date`/`date_of_marriage`/`wedding_date`.
- `formOverrides.ts` — per-form disambiguation (e.g. I-130A & DS-260 force `beneficiary.*`). `firstProfileValue(profile, paths[])`.
- `useAutoFill.ts` — hook wrapping it for forms (`MultiStepForm`).
- `journeyProfileBridge.ts` — `syncCaseDataToProfile`/`syncProfileToCaseData` between journey metadata and profile.

---

## Module 6 — Upload modals (`app/components/document-vault/`)

**Purpose:** Where the user actually uploads + confirms OCR. **Mismatch UI lives here.**

- `DocumentUploadModal.tsx` — single-file upload. Used by marriage docs + single passport slots. After upload, `runOcr` → confirm panel (`OCR_FIELD_ORDER`, `ocrFields`, `ocrConfidence`, `ocrWarnings`) → `handleSaveOcr` POSTs `/api/profile/merge`. docType-aware via registry. Has `useUserProfile()`.
- `MultipleDocumentUploadModal.tsx` — bulk upload (passport/citizenship-proof). Same OCR confirm flow; hardcoded passport endpoint + field order; optimistic `updateProfile` after save.

---

## Module 7 — Journey step widgets (`app/(tools)/(visa)/visa-category/ir-category/[visa-journey]/components/v2/`)

**Purpose:** Read profile values as defaults inside journey steps; detect form-to-form drift.

- `StepView.tsx` — gets `const { profile } = useUserProfile()`. IIFEs derive baselines: step_1_4 (I-130) `ConsistencyBaselineCapture`, step_2_3 (DS-260) `Ds260BaselineCapture`, step_1_5 (I-130A) `BeneficiaryResidenceCapture`. Reads `prof?.relationship?.marriageDate`, `prof?.dateOfBirth`, `prof?.beneficiary?.dateOfBirth`.
- `Ds260BaselineCapture.tsx` — compares I-130 baseline vs DS-260 baseline (`compareBaselines`) → flags critical mismatches (marriage_date, petitioner_dob, beneficiary_dob).
- `journeyHelpers.ts` — `getActiveStepsForStage()` (always use for step filtering).

---

## End-to-end data flow

```
upload → /api/documents/extract-* (OCR.space) → parser → {fields, confidence}
      → confirm panel (editable)  ← [NEW] crossCheck vs in-memory profile → mismatch banner
      → /api/profile/merge (allow-list + encrypt) → profile_details JSONB
      → UserProfileContext (decrypted in memory)
      → autoFill forms (mapper) + journey step widgets (StepView IIFE)
```

## Where mismatch detection plugs in (this feature)
1. `crossCheck.ts` — generalize to `crossCheckFields(extracted, stored, fields[])` (any docType).
2. `DocumentUploadModal.tsx` / `MultipleDocumentUploadModal.tsx` — in the confirm panel, read stored values from `useUserProfile().profile` (prefix `beneficiary.` when target=beneficiary), run cross-check, show a non-blocking red banner + highlight conflicting inputs. User edits → live re-check → save.

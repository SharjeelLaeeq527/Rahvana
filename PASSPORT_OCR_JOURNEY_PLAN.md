# Passport OCR — Journey Auto-Fill Plan (CORRECTED v2)

> Pehla approach GHALAT tha (DocActionModal ka "Read Guide" box hata kar "Scan & Auto-Fill"
> + alag modal se DOBARA upload). Wo **revert** kar diya. Niche sahi approach hai.
> Cost = $0 (OCR.space free key already configured).

---

## Asal maqsad (user ne clarify kiya)
1. User document **pehle se hi upload karta hai** (e.g. beneficiary passport step). OCR **usi upload par**
   chale — koi doosra upload nahi, "Read Guide" box bhi intact rahe.
2. Ch.1 Step 4 (Fill I-130) ka **"Save key dates for consistency checking"** widget
   (`ConsistencyBaselineCapture`) — Marriage date, Petitioner DOB, Beneficiary DOB — abhi user
   **khud manually** bharta hai. Ye OCR se **auto-fill** ho.

---

## Architecture (code se confirmed)
- **Upload flow**: `DocActionModal` (Upload card) → `openUploadModal(defId)` → `DocumentUploadModal`
  jahan `selectedFile` (File object) client-side mojood hota hai, `/api/documents/upload` pe jaata hai.
  **OCR ka sahi hook yahi hai** (`onUploadComplete` se pehle/baad, usi File par).
- **Profile mapping** (`journeyProfileBridge.ts` + `types/profile.ts`):
  - Petitioner (logged-in US citizen) = top-level `MasterProfile` (`dateOfBirth`, `name`, `passportNumber`, …)
  - Beneficiary (spouse) = `beneficiary.dateOfBirth`, `beneficiary.name`
  - Marriage date = `relationship.marriageDate`
- **Baseline widget** `ConsistencyBaselineCapture` (StepView ~L1987): `baseline` prop wizard
  `metadata.consistencyBaseline` se aata hai, `onSave` → `actions.updateMetadata`.
  Pre-fill ke liye profile se default values bharni hain jab baseline khali ho.
- **Doc detection**: `mapDocumentNameToId(item.title)` → `passport-petitioner` / `passport-beneficiary`
  (photos = `passport-photos`, excluded). roadmap.ts source of truth — koi id hardcode nahi.

---

## Data flow (CORRECTED)
```
DocumentUploadModal: user file select → "Upload Document" → /api/documents/upload (success)
        ▼  (agar documentDef.id OCR-eligible: passport-petitioner | passport-beneficiary)
USI selectedFile par OCR  →  POST /api/documents/extract-passport (OCR.space, free)
        ▼
Inline confirm panel (editable fields + low-confidence/mismatch warnings)
        ▼
Confirm  →  POST /api/profile/merge { fields, target: "self" | "beneficiary" }
        ▼
profile_details updated (sensitive fields gcm: encrypted)
        ▼
ConsistencyBaselineCapture profile se pre-fill (Petitioner/Beneficiary DOB + Marriage date)
   + baaki forms autoFill (FIELD_MAPPINGS pehle se wired)
```

---

## Tasks (v2)

### Task 1 — OCR-eligible doc registry  (NEW `lib/document-ocr/registry.ts`) ✅ DONE
- [x] `OCR_DOCS: Record<vaultDefId, { docType: "passport"; target: "self" | "beneficiary" }>`
  - `passport-petitioner` → `{ docType:"passport", target:"self" }`
  - `passport-beneficiary` → `{ docType:"passport", target:"beneficiary" }`
- [x] Helper `getOcrConfig(defId)` → config | null. (Phase 3 mein aur docs yahin add honge.)

### Task 2 — `/api/profile/merge` ko target-aware banao ✅ DONE
- [x] Optional `target: "self" | "beneficiary"` accept karta hai.
  - `self` → existing behavior (top-level allow-list, gcm: encrypt).
  - `beneficiary` → `BENEFICIARY_PATH_MAP`: name.first/last + dateOfBirth → `beneficiary.*` (no encrypt).
- [x] Backward-compatible: target absent → "self".

### Task 3 — `DocumentUploadModal` mein inline OCR (no double upload) ✅ DONE
- [x] Upload success ke baad `getOcrConfig(documentDef.id)` check; eligible ho to USI `selectedFile`
  par `resizeImageIfNeeded` (NEW `lib/document-ocr/clientImage.ts`) → `/api/documents/extract-passport`.
- [x] "Reading your document…" → inline confirm panel (editable fields + low-confidence + warnings).
  Nothing saved without confirm. Skip button bhi.
- [x] Confirm → `/api/profile/merge` with target → `refreshProfile()` + success toast.
- [x] OCR fail/skip → upload safe (non-blocking, info toast). Tier: upload already gated; OCR bonus
  uske andar (koi naya feature key nahi).

### Task 4 — `ConsistencyBaselineCapture` profile se pre-fill ✅ DONE
- [x] StepView step_1_4: derived baseline = saved metadata ∪ profile defaults
  (petitioner ← `profile.dateOfBirth`, beneficiary ← `profile.beneficiary?.dateOfBirth`,
  marriage ← `profile.relationship?.marriageDate`).
- [x] Component mein `useEffect` se async-loaded profile values seed hoti hain bina user input clobber kiye.
- [x] User edit kar sakta hai; "Save baseline" → metadata (existing behavior).

### Task 5 — Verify ✅ DONE (automated) / ⏳ manual pending
- [x] eslint touched files — 0 NEW errors (DocActionModal ke 3 `any` + 1 unused = pre-existing baseline).
- [x] `tsc --noEmit` — touched files par 0 errors.
- [ ] Manual: beneficiary passport upload → OCR → confirm → Ch.1 Step 4 baseline mein Beneficiary DOB
  auto-filled. Petitioner passport → Petitioner DOB. Marriage cert (Phase 3) → Marriage date.

---

## Reuse (chhede bina)
- `/api/documents/extract-passport`, `lib/document-ocr/*` (parser, crossCheck)
- `lib/autoFill/mapper.ts` (FIELD_MAPPINGS), `journeyProfileBridge.ts`
- `lib/document-vault/journey-mapping.ts` (`mapDocumentNameToId`)
- `PassportOcrTool` field-confirm UI (extract a small shared piece if helpful)
- `app/(tools)/(visa)/passport-ocr/page.tsx` standalone tool — as-is (Phase 1, tested)

## Phase 3 (baad mein, "agey") — aur docs
- Birth certificate → DOB/parents; Marriage/Nikah cert → marriage date/place; CNIC; I-797 receipt.
- Har naya doc = registry entry + parser. UI/flow reuse.
- Urdu/handwritten ke liye Gemini Vision fallback.

## Reverted (galat tha)
- DocActionModal: "Scan & Auto-Fill" card + onScanPassport prop — HATA diya, "Read Guide" wapas.
- StepView: PassportOcrModal wiring, passportOcrOpen state, useUserProfile import — HATA diya.
- `components/tools/PassportOcrModal.tsx` ab orphaned (standalone tool still uses PassportOcrTool).

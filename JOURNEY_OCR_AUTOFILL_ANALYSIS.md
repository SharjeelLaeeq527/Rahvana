# Journey OCR + Auto-Fill — Poora Analysis

> **Goal:** User ko har step pe apni info dobara manually na bharni pare. Jab koi document
> upload ho (jaise Ch.1 Step 2 "Gather Required Documents"), us se saari info **extract** ho,
> **confirm** mange, **profile** mein save ho, aur **har journey step + form** mein autofill ho —
> sab aapas mein connected. Yeh confirm-and-save behaviour **har OCR-eligible document** pe ho,
> sirf passport pe nahi.

---

## 1. System abhi kaise "connected" hai (foundation)

```
Document upload  →  OCR parser  →  fields  →  CONFIRM panel  →  profile (MasterProfile)
                                                                      │
                          ┌───────────────────────────────────────────┼───────────────┐
                          ▼                                           ▼               ▼
                  autoFillForm (mapper)                       step widgets        case_data
                  → I-130 / I-130A / DS-260 / I-864            (baseline captures)  (journey KV)
```

Teen "jod" (layers) hain — agar inn mein se koi missing ho to autofill toot-ta hai:

| Layer | File | Kaam |
|-------|------|------|
| **Extract** | `lib/document-ocr/*` (parsers) + `registry.ts` | Doc se fields nikalna |
| **Confirm + Save** | dono upload modals + `app/api/profile/merge/route.ts` | User confirm kare, profile mein likha jaye |
| **Autofill** | `lib/autoFill/mapper.ts` (+ form overrides) | Profile → forms; step widgets profile parhte hain |
| **Sync** | `lib/autoFill/journeyProfileBridge.ts` | case_data ↔ profile |

**Confirm panel pehle se generic hai** — dono modals (`DocumentUploadModal`, `MultipleDocumentUploadModal`)
registry dekh kar panel dikha dete hain. Yani naya document add karna = (a) parser likho, (b) registry mein
entry daalo `{docType, target}`. Baqi UI khud chalta hai.

---

## 2. Field universe — journey ko kaun se fields chahiye (baar baar)

Yeh wo fields hain jo multiple forms/steps maangte hain (sabse zyada manual-entry burden):

### Petitioner (self / US citizen)
`name`, `dateOfBirth`, `sex`, `nationality`, `placeOfBirth`, `currentAddress`, `phone`, `email`,
`ssn`, `alienNumber`, `passportNumber/Expiry/Country`, `citizenshipStatus`, `annualIncome`,
`employer/occupation`

### Beneficiary (Pakistani spouse)
`name`, `dateOfBirth`, `sex`, `nationality`, `placeOfBirth`, `countryOfResidence`, `address`,
`maritalStatus`, `passportNumber`, `alienNumber/ssn` (agar ho), `cnic`

### Relationship
`marriageDate`, `marriagePlace`, `relationship.type`

### Parents (father + mother) — **I-130A, DS-260 dono maangte hain**
`name`, `dateOfBirth`, `placeOfBirth`, `countryOfResidence`

---

## 3. Document → kaun se fields extract ho sakte hain

> OCR-friendly = English/structured (free OCR kaafi). AI-vision = Urdu/scanned (Gemini Phase 2).

| Document | Kis ka | Extractable fields | OCR readiness | Abhi? |
|----------|--------|--------------------|---------------|-------|
| **U.S. Passport** (proof-of-citizenship / passport-petitioner) | Petitioner | name, DOB, sex, nationality, passport#, expiry, issuing country | ✅ MRZ | ✅ **DONE** |
| **Beneficiary Passport** | Beneficiary | name, DOB, sex, nationality, passport#, expiry, country | ✅ MRZ | ✅ **DONE** |
| **U.S. Birth Certificate** | Petitioner | name, DOB, **place of birth**, **parents' names** | ✅ English labels | ❌ |
| **Beneficiary Birth Certificate** | Beneficiary | name, DOB, place of birth, parents' names | ⚠️ NADRA bilingual | ❌ |
| **CNIC** | Beneficiary | name, CNIC#, DOB, sex, father's name, address | ⚠️ bilingual (front English) | ❌ |
| **NADRA Marriage Certificate (MRC)** | Beneficiary/Relationship | both spouse names, **marriage date**, place, reg# | ⚠️ bilingual | ❌ |
| **Nikah Nama** | Beneficiary/Relationship | groom/bride name, marriage date, wali, serial# | ❌ Urdu (AI vision) | ❌ |
| **Police Certificate** | Beneficiary | name, issue date | ✅/⚠️ | ❌ (low value) |
| **Naturalization Cert (N-550/N-560)** | Petitioner | name, naturalization date, cert# | ✅ English | ❌ |

> Note: exact vault `id`s implementation ke waqt `document-definitions.ts` se verify honge (kuch doc
> categories dynamic hain). Yeh list field-coverage ka naqsha hai.

---

## 4. Abhi kya kaam karta hai (current coverage)

- **OCR**: sirf **passport** parser. Registered: `passport-petitioner`, `passport-beneficiary`,
  `citizenship-proof-petitioner` (sab passport docType).
- **Confirm + save**: passport fields → profile. Self: name, DOB, sex, nationality, passport#/expiry/country.
  Beneficiary: name, DOB, nationality (ab nayi add ki).
- **Autofill (mapper)**: profile → forms via `FIELD_MAPPINGS`. Petitioner-side I-130/DS-260 mostly theek.
- **Step widgets**: `ConsistencyBaselineCapture` (Step 4) petitioner+beneficiary DOB profile se parhta hai ✅;
  `BeneficiaryResidenceCapture` (Step 5) `beneficiary.countryOfResidence` parhta hai.
- **Sync**: `case_data ↔ profile` ka achha bridge (interview/NVC/approval dates waghaira).

---

## 5. Asal masle (gaps) — yahi "autofill nahi hoti" ki wajah

### A. Structural mapping bug (sabse ahem)
`FIELD_MAPPINGS` global hai, lekin **ek hi field key ka matlab har form pe alag insaan** hai:
- **I-130** pe `p1_*`/`pt1_*` = **petitioner**
- **I-130A** pe `p1_*` = **beneficiary** (form ka title: "Information About You (Spouse Beneficiary)")
- **DS-260** pe `S01-*` = **beneficiary (applicant)**

Global mapper `p1_given_name`/`S01-*` ko **self (petitioner)** se jod-ta hai → I-130A aur DS-260 pe
beneficiary ke fields ya khaali rehte hain ya **ghalat (petitioner ki info)** bhar jate hain.
**Fix:** per-form override layer (form ke hisab se key → beneficiary/parent path).

### B. DS-260 mein missing mappings
`nationality (S01-Q010)`, `passport# (S01-Q012)`, issuing country, issue/expiry — `FIELD_MAPPINGS` mein
**mapped hi nahi**. Yani passport se extract karne ke baad bhi DS-260 mein nahi aate.

### C. Beneficiary profile bohat chhoti hai
`beneficiary = { name, dateOfBirth, countryOfResidence, nationality }`. Forms beneficiary ki
`placeOfBirth, sex, address, maritalStatus, parents` bhi maangte hain — inke liye jagah hi nahi.

### D. Parents (father/mother) ka koi source nahi
I-130A + DS-260 dono father/mother (name, DOB, place of birth) maangte hain. **Na OCR, na case_data** —
har baar manual. (Birth certificate se parents' names extract ho sakte hain.)

### E. Sirf passport OCR
Birth certificate, CNIC, marriage cert, nikah nama — koi parser nahi. To `placeOfBirth`,
`relationship.marriageDate`, `cnic` jaise fields kabhi auto nahi aate.

### F. `passportIssueDate` ALLOWED_PATHS mein nahi (chhota)

---

## 6. Recommended roadmap (phased)

### ✅ Phase 0 — DONE (is session mein)
- Petitioner passport OCR → self profile; confirm panel har identity-type pe; adaptive text.
- Beneficiary OCR ab `nationality` bhi save karta hai.
- `MultipleDocumentUploadModal` (Proof of U.S. Citizenship) mein OCR + optimistic profile update.
- `portal-wallet` 500 fix; profile refetch transient-error pe blank na ho.

### 🔜 Phase A — OCR-friendly, high value (chhota, kam risk)
1. **Form-aware autofill overrides** (`lib/autoFill/formOverrides.ts`): I-130A `p1_*` + DS-260 `S01-*`
   → `beneficiary.*` / `father.*` / `mother.*`. Global mapper chheда nahi jayega (I-130 safe).
2. **DS-260 missing mappings** add karein (nationality, passport#, issuing country, expiry).
3. **Beneficiary profile expand**: `sex`, `placeOfBirth`, `address`, `maritalStatus`, `passportNumber`
   add karein type + `BENEFICIARY_PATH_MAP` mein.
4. **U.S./English Birth Certificate parser** → name, DOB, place of birth, parents' names →
   registry mein add (confirm panel khud chalega). Petitioner `placeOfBirth` + `father/mother` bharega.

### 🔜 Phase B — bilingual / AI vision (Gemini)
5. **NADRA MRC + Nikah Nama** parser (Urdu) → `relationship.marriageDate`, `marriagePlace`, spouse names.
6. **CNIC** parser (bilingual) → beneficiary `cnic`, DOB, sex, father's name, address.

### 🔜 Phase C — completeness (mostly forms/case_data, OCR nahi)
7. Address / employment / financial — `journeyProfileBridge` + form save-back se. Documents flags (15) sync.

---

## 7. "Har document pe confirm panel" — kaise

Acha news: panel **pehle se generic** hai. Naya document OCR-eligible banane ke liye:
1. Us doc ka **parser** likho (`lib/document-ocr/<doc>Parser.ts`) jo `{fields, confidence, warnings}` de.
2. `extract-*` route ya generic extract route us parser ko call kare.
3. `registry.ts` mein doc id → `{docType, target}` add karo.
4. `merge` route ke ALLOWED_PATHS / target-map mein wo fields allow karo.

Iske baad **dono upload modals** us doc pe automatically confirm panel dikha denge — koi UI change nahi.

---

## 8. Ek nazar — coverage matrix

| Profile section | OCR | case_data | Status |
|-----------------|-----|-----------|--------|
| name, DOB, sex, nationality, passport (self) | ✅ | partial | **Good** |
| beneficiary name/DOB/nationality | ✅ | partial | **Good (chhota)** |
| placeOfBirth (dono) | ❌ | ❌ | **Gap → birth cert parser** |
| parents (father/mother) | ❌ | ❌ | **Critical gap → birth cert / forms** |
| relationship.marriageDate/place | ❌ | ❌ | **Gap → MRC/Nikah (AI)** |
| beneficiary placeOfBirth/sex/address/marital | ❌ (type missing) | ❌ | **Gap → expand type** |
| address / employment / financial | ❌ | partial | **Forms/case_data** |
| visa/interview/approval dates | n/a | ✅ | **Good** |

---

*Yeh analysis hai — implement Phase A se shuru karne ki tajweez hai (form-aware overrides + DS-260 mappings
+ beneficiary expand + birth-cert parser). Confirm karein to shuru karun.*

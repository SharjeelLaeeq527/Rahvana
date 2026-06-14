# OCR Fields — Master List

*Which fields we read from documents, and which forms each one fills.*
*Reviewed directly against the real forms: DS‑260, I‑130, I‑130A, I‑864.*

---

## How to read this

- ✅ = this form has this field (one extracted value fills all the ✅ columns).
- A field is **worth reading by OCR only if 2+ forms use it** — otherwise it stays a normal typed answer inside one form.
- **NEW** = found during this review; not extracted today, should be added.
- Everything below is **shared identity data** → saved once in the **Profile**, then auto-fills every form.

---

## 1. The person applying (Beneficiary) — from Passport / CNIC / Birth Certificate

| # | Field | Read from | DS‑260 | I‑130 | I‑130A | I‑864 |
|---|-------|-----------|:---:|:---:|:---:|:---:|
| 1 | Family / Last name | Passport, CNIC | ✅ | ✅ | ✅ | ✅ |
| 2 | Given / First name | Passport, CNIC | ✅ | ✅ | ✅ | ✅ |
| 3 | Middle name | Passport | ✅ | ✅ | ✅ | ✅ |
| 4 | **Full name in native script (Urdu)** **NEW** | CNIC / Nikah (Urdu) | ✅ | — | — | — |
| 5 | Other names / aliases | (rarely on docs) | ✅ | ✅ | ✅ | — |
| 6 | Sex | Passport, CNIC | ✅ | ✅ | ✅ | — |
| 7 | Date of birth | Passport, CNIC, Birth cert | ✅ | ✅ | ✅ | ✅ |
| 8 | City/Town of birth | Birth cert, Passport | ✅ | ✅ | — | ✅ |
| 9 | **State/Province of birth** **NEW** | Birth cert | ✅ | — | — | ✅ |
| 10 | Country of birth | Passport, Birth cert | ✅ | ✅ | ✅ | ✅ |
| 11 | Nationality | Passport | ✅ | — | — | — |
| 12 | National ID number (CNIC) | CNIC | ✅ | — | — | — |
| 13 | Passport number | Passport | ✅ | ✅ | — | — |
| 14 | **Passport book number** **NEW** (optional) | Passport | ✅ | — | — | — |
| 15 | Passport issuing country | Passport | ✅ | ✅ | — | — |
| 16 | **Passport place of issue (city)** **NEW** | Passport | ✅ | — | — | — |
| 17 | **Passport issue date** **NEW** | Passport | ✅ | — | — | — |
| 18 | Passport expiry date | Passport | ✅ | ✅ | — | — |

> Note: passport **issue date / place of issue / book number** are printed on the photo page (not in the machine-readable bottom lines), so we read them from the visible text.

---

## 2. Marriage — from Nikah Nama / NADRA MRC / Divorce decree

| # | Field | Read from | DS‑260 | I‑130 | I‑130A | I‑864 |
|---|-------|-----------|:---:|:---:|:---:|:---:|
| 19 | Marriage date | Nikah, NADRA MRC | ✅ | ✅ | — | — |
| 20 | **Marriage place — city** **NEW** | Nikah | — | ✅ | — | — |
| 21 | **Marriage place — province/country** **NEW** | Nikah | — | ✅ | — | — |
| 22 | **Marriage registration number** **NEW** (record only) | NADRA MRC / Union Council | — | — | — | — |
| 23 | Number of marriages (derived) | — | — | ✅ | — | — |
| 24 | **Prior spouse's name** **NEW** | Divorce decree / death cert | — | ✅ | — | — |
| 25 | **Prior marriage end date** **NEW** | Divorce decree / death cert | — | ✅ | — | — |

> Fields 24–25 also power the **"first marriage" warning** (user says "first marriage = Yes" but a divorce decree shows a previous one → flag for review).
> Witnesses are **not** read (no form needs them).

---

## 3. Parents — from Birth Certificate / Family Registration (FRC)

| # | Field | Read from | DS‑260 | I‑130 | I‑130A | I‑864 |
|---|-------|-----------|:---:|:---:|:---:|:---:|
| 26 | Father's full name | Birth cert, FRC | ✅ | ✅ | ✅ | — |
| 27 | **Father's date of birth** **NEW** | FRC (if present) | ✅ | ✅ | ✅ | — |
| 28 | **Father's country of residence** **NEW** | (rarely on docs) | — | ✅ | ✅ | — |
| 29 | Mother's full name | Birth cert, FRC | ✅ | ✅ | ✅ | — |
| 30 | **Mother's date of birth** **NEW** | FRC (if present) | ✅ | ✅ | ✅ | — |
| 31 | **Mother's country of residence** **NEW** | (rarely on docs) | — | ✅ | ✅ | — |
| 32 | Parent's sex (auto: father=male, mother=female) | derived | — | ✅ | ✅ | — |

> Parents' **birthplaces** (I‑130/I‑130A also ask) are almost never on Pakistani documents — leave as a typed answer.

---

## 4. The U.S. sponsor (Petitioner) — from Petitioner Passport / Citizenship proof

| # | Field | Read from | DS‑260 | I‑130 | I‑130A | I‑864 |
|---|-------|-----------|:---:|:---:|:---:|:---:|
| 33 | Sponsor family / given / middle name | US passport | — | ✅ | — | ✅ |
| 34 | Sponsor date of birth | US passport | — | ✅ | — | ✅ |
| 35 | Sponsor place of birth (city/country) | US passport | — | ✅ | — | ✅ |
| 36 | Sponsor sex | US passport | — | ✅ | — | — |
| 37 | **Sponsor citizenship cert number + date** **NEW** | Naturalization cert | — | ✅ | — | — |

> Sponsor SSN and US addresses stay typed (not on the passport).

---

## 5. Saved later only inside one form (NOT via OCR)

These appear in only one form, so they stay normal typed answers — reading them by OCR adds no value:

- **Interview letter** → interview date / time / location / case number (auto-fills the interview step only).
- **Police certificate** → issue date only (to check the 6-month freshness rule).
- **Financial docs** (tax transcript, W‑2, pay stub) → I‑864 income — *separate decision, see roadmap file.*
- Travel history, US visa history, security/background questions, employment history details.

---

## 6. Summary — what to ADD to extraction

Currently we mostly read basic identity (name, DOB, passport no, expiry). After reviewing the real forms, we should **also** read:

1. **Urdu / native-script name** (from CNIC or Nikah) → DS‑260 needs it.
2. **Passport issue date + place of issue + book number** → DS‑260.
3. **State/Province of birth** → DS‑260, I‑864.
4. **Marriage place (city + province/country)** → I‑130.
5. **Prior spouse name + marriage end date** (divorce/death cert) → I‑130 + powers the warning.
6. **Parents' dates of birth** (if on FRC) → DS‑260, I‑130, I‑130A.
7. **Sponsor citizenship certificate number + date** (naturalization cert) → I‑130.

Everything in this list is used by **2 or more forms** → it belongs in the **Profile** (one save, fills all forms). The profile stays small (~45 facts); the hundreds of form-only questions stay inside each form.

---

*Scope: IR‑1 spouse visa only (DS‑260, I‑130, I‑130A, I‑864).*

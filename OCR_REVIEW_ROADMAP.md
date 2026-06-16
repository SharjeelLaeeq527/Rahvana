# Smart Document Review — Plan

*One-page overview for review. Non-technical.*

---

## The goal (in one line)

When a user uploads a document, the app **reads it, fills the right fields automatically, warns if anything clashes with what they entered earlier, and — once they confirm — updates that info everywhere.**

---

## The problem today

The app collects the same person's info in three places that have **drifted apart**:

1. What we **read** from documents (OCR)
2. What we **save** in the profile
3. What the **forms** (I‑130, I‑130A, DS‑260, I‑864) actually need

Result: some needed fields are never read (e.g. parents' birthplace, passport issue date), and **clashing answers are not caught** (user says one thing in a step, the document says another).

---

## How information flows (the fix)

```
Document upload  →  App reads it  →  Review window (all fields, editable)
                                          │
                            warns on any clash (see below)
                                          │
                              User confirms & saves
                                          │
                    Saved once in the Profile (one shared place)
                                          │
        Auto-fills every form + updates earlier journey steps
```

**Key idea:** the **Profile is the single bridge.** We only keep ~40 shared "identity facts" there (one set per person). The hundreds of form-only questions stay inside each form — so the profile stays small, and one confirmed answer fills every form.

---

## What each document fills

| Document | What we read from it |
|----------|----------------------|
| **Beneficiary passport** | Name, date of birth, sex, nationality, passport number, **issue date**, **place of issue**, **book number**, expiry, issuing country |
| **Petitioner passport / citizenship proof** | Sponsor's name, date of birth, place of birth, sex, nationality, **citizenship certificate number + date** (from naturalization cert) |
| **Beneficiary CNIC** | Name, **name in Urdu (native script)**, date of birth, CNIC number (cross-check + DS‑260 National ID) |
| **Birth certificate** | Birthplace (city/**state/province**/country), **father's name, mother's name** |
| **Family Registration (FRC)** | Father's & mother's name, **parents' dates of birth** |
| **Marriage certificate / Nikah Nama** | Marriage date, **marriage place (city + province/country)**, **registration number**. *(Witnesses are **not** read.)* |

### Beyond identity — also worth reading

These documents appear later in the journey and carry useful non-identity info:

| Document | What we read from it | Why it matters |
|----------|----------------------|----------------|
| **Divorce decree / death certificate** (previous marriage) | Former spouse's name, marriage date, end date, how it ended, country | Fills the prior-marriage section **and** powers the key warning below (catches "this is my first marriage" when it wasn't) |
| **Interview letter** (from embassy) | Interview date, time, location, case number | Auto-fills the interview step and the case details |
| **Police certificate** | Issue date | Lets the app tell the user if it's still fresh or needs renewing (6-month rule) |

**Not read as text (only marked as "provided"):** relationship photos, chat/communication records, sealed medical envelope, passport photos.

---

## The smart warning (the most important part)

The app checks each read value against **both** what's already saved **and** earlier answers in the journey steps.

**Example:**
- Earlier step: *"Is this your first marriage?" → **Yes.***
- User uploads a document that shows a **previous marriage**.
- The app immediately flags:
  > ⚠️ *This document suggests a previous marriage, but earlier you said this is your first. Please review — is this correct?*
- The user reviews, fixes the right answer, and clicks **Confirm & Save**.
- That confirmed answer then **overwrites the earlier step too**, so nothing stays out of sync.

Three outcomes shown per field: 🟢 **Matches** · ⚪ **New** · 🔴 **Clash (please review)**.

---

## What gets saved where

| Type of info | Saved where | Why |
|--------------|-------------|-----|
| Shared identity (name, DOB, passport, parents, marriage) | **Profile** (once) | Reused by every form |
| Form-only questions (income, social media, travel history) | **Inside each form** | Only one form needs them |
| Witnesses | **Not saved** | No form requires them |

---

## Plan of work

1. **Widen the upload window** so all fields are visible at once.
2. **Read the missing fields** (the NEW fields found in the form review): native-script Urdu name; passport issue date / place of issue / book number; state/province of birth; marriage place (city + province/country) + registration number; prior spouse's name + marriage-end date; parents' dates of birth; sponsor's citizenship certificate number + date. *(Full field-by-field list in `OCR_FIELDS_MASTER_LIST.md`.)*
3. **Add the smart warning** — compare against the profile **and** earlier journey steps.
4. **Confirm & Save updates everywhere** — profile, all forms, and earlier steps.
5. **Test** end-to-end with sample documents.

---

## Needs your decision

- **Reading financial documents** (tax transcripts, W‑2, pay stubs, employment letter) to **auto-fill the I‑864 income section.** High value, but more work (formats vary, sensitive data). **In scope or later?**

## Not included (kept simple on purpose)

- Reading witnesses from documents
- Auto-completing journey steps (user always confirms manually)

---

*Scope: IR‑1 spouse visa forms only (I‑130, I‑130A, DS‑260, I‑864).*

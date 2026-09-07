# Payment Forms Rollout - G-1450, G-1650, G-1651

**Date:** 4 September 2026
**Area:** Auto Form Filler (USCIS PDF forms)
**Status:** Done, tested, and documented

---

## What this is about

The platform has an **auto form filler**. The idea is simple: a user fills in their
information once, and the system automatically fills the official USCIS immigration PDF
forms for them, so they do not have to type the same details into every form by hand.

This work added **three payment / signature forms** to that auto-filler and fixed several
issues found along the way.

---

## What was there before

- The auto form filler already supported **10 forms** (I-130, I-130A, I-129F, I-693,
  I-864, I-864A, I-864EZ, I-912, DS-260, I-485).
- Three important forms were **not connected** to the auto-filler:
  - **G-1450** - Authorization for Credit Card Transactions
  - **G-1650** - Authorization for ACH Transactions (bank account)
  - **G-1651** - Exemption for Paper Fee Payment
- Because they were not connected, these forms could not be auto-filled. One of them
  (G-1450) actually returned an error when the system tried to open it.

### How the flow works (background)

For any form to be auto-filled, three layers must line up:

1. **Backend field map** (`backend/app/core/form_configs/<form>_config.py`) - maps each
   friendly field key to the real field inside the PDF.
2. **Backend registration** (`backend/app/services/pdf_filler.py`) - tells the system the
   form exists and where its PDF is.
3. **Frontend form definition** (`lib/formConfig/<form>.ts` + `index.ts`) - the on-screen
   form (labels, fields, dropdowns) that the user actually fills.

The contract between them: the frontend sends `{ fieldKey: value }`, and the backend map
turns each `fieldKey` into the correct spot in the PDF.

---

## What was done

### 1. G-1450 - Credit Card Authorization

Used when someone pays their USCIS filing fee with a credit or debit card.

- **Connected it to the auto-filler.** It was returning an error before because it was not
  registered and the system could not locate its PDF file. Fixed both.
- **Mapped all 28 fillable fields:** card holder name, billing address, card number, CVV,
  expiration date, payment amount, and signature. (The auto-generated barcode is left
  alone on purpose - it is not a field anyone fills.)
- **Found and fixed two labeling mistakes:**
  - The "Apartment / Suite / Floor" checkboxes were mapped in the wrong order (Apt and Ste
    were swapped). Verified the correct order by the label positions on the actual page.
  - The **CVV** box was being treated as a "card number" box. In the PDF, USCIS named it
    `CreditCardNumber_4[1]`, but on the page it clearly sits under the **CVV Code** label.
    It is now mapped correctly as CVV.

### 2. G-1651 - Exemption for Paper Fee Payment

Used when someone wants to pay by check or money order instead of electronically.

- **Connected it to the auto-filler.** This form only needs a **signature** and a **date**;
  both are mapped.
- **Added a helpful note in the form's popup (modal):** "This form needs a handwritten
  signature. Print the form, sign it by hand, then capture your signature with our Snap and
  Sign tool," together with a button that opens the **Snap & Sign** tool directly.
  - This was built as a reusable flag (`requiresHandSign`), so any other hand-sign form can
    show the same note just by turning the flag on.

### 3. G-1650 - ACH (Bank Account) Authorization

Used when someone pays their fee directly from a US bank account.

- **Connected it to the auto-filler.** Mapped all **16 fillable fields:** applicant name,
  bank account holder name, account holder type (business / personal), account type
  (checking / savings), bank name, routing number, account number, business name, payment
  amount, and signature.
- **Verified the checkbox meanings by their on-page labels** (the internal field order was
  misleading): Business vs Personal, and Checking vs Savings. USCIS had even named the
  checking/savings checkbox group "CreditCardType" internally, which is misleading - the
  labels on the page are Checking and Savings.
- **Fixed a deeper engine problem.** This form is built in a way where two different
  people's name fields (the applicant and the bank account holder) share the same internal
  name (both end in `GivenName`, `MiddleName`, `FamilyName`). The old fill logic would let
  one person's name **overwrite the other**, so both name blocks ended up with the same
  name. The fill engine now prefers an **exact match first**, and only falls back to the
  looser match when no exact match exists. Both names now fill correctly and separately.
- **Re-tested the other 9 existing forms** after this engine change to make sure nothing
  broke. They all still fill correctly, including the ones that copy a name across multiple
  pages (I-130, I-130A, I-485).

---

## The result

- The auto form filler now supports **13 forms** (up from 10).
- Every new form was **tested** by filling it with sample data and reading the values back
  from the generated PDF to confirm each value landed in the correct place.
- The **G-1650 name-overwrite fix** also makes the whole engine safer for any future form
  that has this same structure.
- Internal documentation (`docs/PROJECT_KNOWLEDGE.md`) was updated to reflect 13 forms.

---

## Files changed

**Backend**
- `backend/app/core/form_configs/g1450_config.py` - new field map (G-1450)
- `backend/app/core/form_configs/g1650_config.py` - new field map (G-1650)
- `backend/app/core/form_configs/g1651_config.py` - new field map (G-1651)
- `backend/app/services/pdf_filler.py` - registered the 3 forms, generalized PDF-file
  lookup for "G" forms, and added the exact-match-first fix

**Frontend**
- `lib/formConfig/g1450.ts`, `lib/formConfig/g1650.ts`, `lib/formConfig/g1651.ts` - new
  on-screen form definitions
- `lib/formConfig/index.ts` - registered the 3 forms
- `app/(tools)/(visa)/visa-forms/page.tsx` - added the "print and hand-sign with Snap &
  Sign" note (shown for G-1651)

**Docs**
- `docs/PROJECT_KNOWLEDGE.md` - form count updated from 10 to 13

---

## Business value

- Users no longer fill these payment forms by hand - this **saves time and reduces
  mistakes**.
- The product is **more complete**, since more of the required forms are now covered.
- The hand-signature form gives users **clear guidance** (Snap & Sign) instead of leaving
  them unsure what to do.

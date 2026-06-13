// lib/autoFill/formOverrides.ts
//
// PER-FORM field overrides for auto-fill.
//
// The global FIELD_MAPPINGS in mapper.ts maps each form field key to ONE profile
// path. But the same field-key prefix refers to DIFFERENT PEOPLE on different forms:
//   - Form I-130   Part 1 (`pt1_*` / plain)  → the PETITIONER (self)
//   - Form I-130A  Part 1 (`p1_*`)           → the SPOUSE BENEFICIARY
//   - Form DS-260  Section 1 (`S01-*`)       → the BENEFICIARY (visa applicant)
//
// A single global map can't disambiguate, so the global mapper ends up routing
// I-130A / DS-260 beneficiary fields to the petitioner's profile (wrong person) or
// leaving them blank. These per-form overrides take precedence: for the listed form
// field keys we read ONLY the given profile path(s) (first non-empty wins) and apply
// the result AUTHORITATIVELY — even an empty result is written, so a wrong-person
// value from the global map is cleared rather than left to leak.
//
// Keyed by NORMALIZED formCode (lowercase, alphanumerics only — same normalization
// as lib/formConfig getFormConfig).

export const FORM_FIELD_OVERRIDES: Record<string, Record<string, string[]>> = {
  // ── Form I-130 — Part 1 "Information About You" = the SPONSOR (US petitioner) ──
  // The account holder is the BENEFICIARY, so the top-level profile is the WRONG
  // person for these fields. They read only from the sponsor.* section.
  i130: {
    family_name: ["sponsor.name.last"],
    given_name: ["sponsor.name.first"],
    middle_name: ["sponsor.name.middle"],
    date_of_birth: ["sponsor.dateOfBirth"],
    city_of_birth: ["sponsor.placeOfBirth.city"],
    country_of_birth: ["sponsor.placeOfBirth.country"],
    sex: ["sponsor.sex"],
    ssn: ["sponsor.ssn"],
    a_number: ["sponsor.alienNumber"],
    uscis_account: ["sponsor.uscisAccountNumber"],
    current_street: ["sponsor.address.street"],
    current_city: ["sponsor.address.city"],
    current_state: ["sponsor.address.state"],
    current_zip: ["sponsor.address.zipCode"],
    current_country: ["sponsor.address.country"],
  },

  // ── Form I-130A — "Information About You" = the spouse BENEFICIARY ──
  // The account holder IS the beneficiary (visa applicant) — see
  // project_account_holder_is_beneficiary. Their own data (incl. parents from the
  // birth-cert OCR) lives on the TOP-LEVEL profile, so each field falls back to the
  // top-level path when beneficiary.* is empty.
  i130a: {
    p1_family_name: ["beneficiary.name.last", "name.last"],
    p1_given_name: ["beneficiary.name.first", "name.first"],
    p1_middle_name: ["beneficiary.name.middle", "name.middle"],
    // Current country of residence; fall back to nationality when residence unknown.
    p1_addr1_country: ["beneficiary.countryOfResidence", "beneficiary.nationality"],
    // The parents on I-130A are the BENEFICIARY's parents = the account holder's
    // parents (top-level father.*/mother.*, filled by the birth-certificate OCR).
    p1_parent1_family_name: ["beneficiary.father.name.last", "father.name.last"],
    p1_parent1_given_name: ["beneficiary.father.name.first", "father.name.first"],
    p1_parent1_dob: ["beneficiary.father.dateOfBirth", "father.dateOfBirth"],
    p1_parent2_family_name: ["beneficiary.mother.name.last", "mother.name.last"],
    p1_parent2_given_name: ["beneficiary.mother.name.first", "mother.name.first"],
    p1_parent2_dob: ["beneficiary.mother.dateOfBirth", "mother.dateOfBirth"],
  },

  // ── Form DS-260 — Section 1 is about the BENEFICIARY (visa applicant) ──
  // The visa applicant is the account holder, so fall back to the top-level
  // profile (where the passport/CNIC/birth-cert OCR saves) when beneficiary.* is empty.
  ds260: {
    "S01-Q001_FamilyName": ["beneficiary.name.last", "name.last"],
    "S01-Q001_GivenName": ["beneficiary.name.first", "name.first"],
    "S01-Q001_MiddleName": ["beneficiary.name.middle", "name.middle"],
    "S01-Q004": ["beneficiary.sex", "sex"], // Sex
    "S01-Q006": ["beneficiary.dateOfBirth", "dateOfBirth"], // Date of birth
    "S01-Q007": ["beneficiary.placeOfBirth.city", "placeOfBirth.city"], // City of birth
    "S01-Q008": ["beneficiary.placeOfBirth.state", "placeOfBirth.state"], // State/province of birth
    "S01-Q009": ["beneficiary.placeOfBirth.country", "placeOfBirth.country"], // Country of birth
    "S01-Q010": ["beneficiary.nationality", "nationality"], // Nationality
    "S01-Q012": ["beneficiary.passportNumber", "passportNumber"], // Passport number
    "S01-Q013": ["beneficiary.passportCountry", "beneficiary.nationality", "passportCountry", "nationality"], // Issuing country
    "S01-Q014": ["beneficiary.passportIssueDate", "passportIssueDate"], // Issue date
    "S01-Q015": ["beneficiary.passportExpiry", "passportExpiry"], // Expiry date
  },
};

/** Returns the override map for a given formCode (empty object if none). */
export function getFormFieldOverrides(formCode: string): Record<string, string[]> {
  const normalized = (formCode || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return FORM_FIELD_OVERRIDES[normalized] || {};
}

/** First non-empty value from the profile for the given dot-paths (else ""). */
export function firstProfileValue(
  profile: Record<string, unknown> | null | undefined,
  paths: string[]
): string {
  if (!profile) return "";
  for (const path of paths) {
    let cur: unknown = profile;
    for (const key of path.split(".")) {
      if (cur && typeof cur === "object") {
        cur = (cur as Record<string, unknown>)[key];
      } else {
        cur = undefined;
        break;
      }
    }
    if (cur !== undefined && cur !== null && String(cur).trim() !== "") return String(cur);
  }
  return "";
}

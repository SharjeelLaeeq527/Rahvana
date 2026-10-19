// lib/formConfig/candidateScope.ts
// ============================================================================
// Multi-Candidate Smart Pre-Fill & Caution Highlighting Engine
// Classifies form fields across all 13+ USCIS & DOS visa forms.
// ============================================================================

import type { Field, FieldCandidateScope } from "./types";

export interface CriticalFieldMeta {
  isCritical: boolean;
  category?: "identity" | "dob" | "passport" | "legal" | "status" | "relationship" | "contact" | "family" | "general";
  title?: string;
  reason?: string;
  isCandidateSwitchWarning?: boolean;
  badgeText?: string;
}

export interface CriticalFieldContext {
  fullName?: string;
  relation?: string;
  visaCategory?: string;
  isFirstCandidate?: boolean;
  candidateLabel?: string;
  sectionTitle?: string;
}

/**
 * Universal classifier that determines whether a field is shared across candidates
 * (e.g. Petitioner address/SSN) or distinct per beneficiary (e.g. DOB/Passport).
 */
export function getFieldCandidateScope(
  formCode: string,
  field: Field,
  sectionTitle?: string
): FieldCandidateScope {
  // 1. Explicit override on field definition
  if (field.candidateScope) {
    return field.candidateScope;
  }

  const key = (field.key || "").toLowerCase();
  const pdfKey = (field.pdfKey || "").toLowerCase();
  const label = (field.label || "").toLowerCase();
  const section = (field.section || sectionTitle || "").toLowerCase();
  const fCode = formCode.toLowerCase().replace(/[^a-z0-9]/g, "");

  // ── Form-Specific Heuristics ──────────────────────────────────────────────

  // Fee Payment Forms (G-1450, G-1650, G-1651): Almost exclusively payer/petitioner
  if (["g1450", "g1650", "g1651"].includes(fCode)) {
    if (key.includes("applicant_name") || label.includes("applicant name") || label.includes("beneficiary")) {
      return "candidate_distinct";
    }
    return "shared_petitioner";
  }

  // I-130 (Petition for Alien Relative)
  if (fCode === "i130") {
    // Part 1: Relationship to Petitioner -> Specific to this beneficiary
    if (
      section.includes("part 1") ||
      section.includes("relationship") ||
      key.includes("pt1_") ||
      key.includes("relationship")
    ) {
      return "candidate_distinct";
    }

    // Part 4: Information About Beneficiary & All Beneficiary Specific Sections
    if (
      section.includes("part 4") ||
      section.includes("beneficiary") ||
      section.includes("contact") ||
      section.includes("address where your relative") ||
      section.includes("address abroad") ||
      section.includes("current physical address") ||
      key.includes("beneficiary") ||
      key.includes("daytimephone") ||
      key.includes("mobilephone") ||
      key.includes("email") ||
      key.includes("foreign") ||
      key.includes("future") ||
      key.includes("currentstreet") ||
      key.includes("currentcity") ||
      key.includes("currentstate") ||
      key.includes("currentzip") ||
      key.includes("currentcountry") ||
      key.includes("pt4_") ||
      key.includes("p4_") ||
      pdfKey.includes("pt4") ||
      label.includes("beneficiary") ||
      label.includes("relative")
    ) {
      return "candidate_distinct";
    }

    // Part 2: Information About You (Petitioner) -> Shared
    // Part 3: Biographic Information / Physical Characteristics (Petitioner) -> Shared
    // Part 5: Other Information (Petitioner's Prior Petitions) -> Shared
    // Part 6, 7, 8: Petitioner Statement, Interpreter, Preparer -> Shared
    return "shared_petitioner";
  }

  // ── Form I-864 / I-864EZ / I-864A (Affidavit of Support) ──────────────────
  if (["i864", "i864ez", "i864a"].includes(fCode)) {
    // Principal Immigrant & Sponsored Immigrant sections -> Distinct
    if (
      section.includes("principal immigrant") ||
      section.includes("sponsored immigrant") ||
      section.includes("immigrant info") ||
      section.includes("immigrants sponsored") ||
      section.includes("part 3. information about the principal immigrant") ||
      section.includes("part 4. information about the immigrants you are sponsoring") ||
      key.includes("immigrant") ||
      key.includes("beneficiary") ||
      key.includes("p2_immigrant") ||
      key.includes("p3_immigrant")
    ) {
      return "candidate_distinct";
    }
    // Sponsor info, Household size, Employment, Tax returns, Assets, Contract -> Shared
    return "shared_petitioner";
  }

  // ── Form DS-260 (Online Immigrant Visa Application) ───────────────────────
  if (fCode === "ds260") {
    // Section 5: Petitioner Information -> Shared
    if (section.includes("petitioner") || section.includes("section 5") || key.includes("petitioner_") || label.includes("petitioner")) {
      return "shared_petitioner";
    }
    // Section 8: Preparer Information -> Shared
    if (section.includes("section 8") || section.includes("preparer")) {
      return "shared_petitioner";
    }
    // Section 1: U.S. Address Information -> Shared family destination
    if (
      section.includes("u.s. address") ||
      (section.includes("address") && (key.includes("us_") || label.includes("in the united states") || label.includes("u.s. address")))
    ) {
      return "shared_household";
    }
    // Sections 1, 2, 3, 4, 6, 7 (Personal, Family, Travel, Work/Education, Security, SSN) -> Distinct
    return "candidate_distinct";
  }

  // ── Form I-130A (Supplemental Info for Spouse Beneficiary) ────────────────
  if (fCode === "i130a") {
    // Entire form is dedicated to the Spouse Beneficiary
    return "candidate_distinct";
  }

  // ── Form I-485 (Adjustment of Status) & I-693 (Medical) ───────────────────
  if (["i485", "i693"].includes(fCode)) {
    if (key.includes("petitioner") || key.includes("sponsor_") || label.includes("petitioner") || section.includes("civil surgeon")) {
      return "shared_petitioner";
    }
    if (key.includes("us_address") || label.includes("u.s. address")) {
      return "shared_household";
    }
    // Applicant is the adjusting beneficiary
    return "candidate_distinct";
  }

  // ── Form I-129F (Petition for Alien Fiancé(e)) ─────────────────────────────
  if (fCode === "i129f") {
    // Part 2: Beneficiary Info & Part 4: Relationship -> Distinct
    if (
      section.includes("part 2") ||
      section.includes("beneficiary") ||
      key.includes("beneficiary") ||
      key.includes("p2_")
    ) {
      return "candidate_distinct";
    }
    // Part 1 (Petitioner), Part 3 (Other Info), Part 4 (Petitioner Biographics), Part 5, 6, 7 -> Shared
    return "shared_petitioner";
  }

  // ── Form I-912 (Fee Waiver) ───────────────────────────────────────────────
  if (fCode === "i912") {
    if (section.includes("part 2") || section.includes("part 3") || section.includes("requestor") || section.includes("applications")) {
      return "candidate_distinct";
    }
    if (section.includes("household") || section.includes("benefits") || section.includes("income") || section.includes("hardship")) {
      return "shared_household";
    }
    return "candidate_distinct";
  }

  // ── Universal Pattern Classification ──────────────────────────────────────

  // Explicit Distinct Beneficiary Keys
  const distinctKeywords = [
    "beneficiary",
    "applicant",
    "immigrant",
    "ds260",
    "passport",
    "medical",
    "vaccine",
    "exam",
    "native_alphabet",
    "alien_registration",
    "arn",
    "i94",
    "ssn_beneficiary",
  ];

  if (distinctKeywords.some((w) => key.includes(w) || pdfKey.includes(w) || label.includes(w))) {
    return "candidate_distinct";
  }

  // Distinct Personal Attributes
  if (
    key.includes("dob") ||
    key.includes("date_of_birth") ||
    key.includes("birth_date") ||
    key.includes("birth_city") ||
    key.includes("birth_country") ||
    key.includes("gender") ||
    key.includes("sex") ||
    key.includes("marital_status")
  ) {
    if (section.includes("petitioner") || section.includes("sponsor") || key.includes("petitioner") || key.includes("sponsor") || section.includes("your information")) {
      return "shared_petitioner";
    }
    return "candidate_distinct";
  }

  // Shared Petitioner Keywords
  const petitionerKeywords = [
    "petitioner",
    "sponsor",
    "joint_sponsor",
    "tax_year",
    "w2",
    "adjusted_gross_income",
    "petitioner_address",
    "sponsor_address",
    "sponsor_ssn",
    "petitioner_ssn",
    "filing_status",
  ];

  if (petitionerKeywords.some((w) => key.includes(w) || pdfKey.includes(w) || section.includes(w) || label.includes(w))) {
    return "shared_petitioner";
  }

  // Shared Household / Mailing Keywords
  const householdKeywords = [
    "us_address",
    "mailing_address",
    "household_size",
    "intended_us_address",
    "delivery_address",
  ];

  if (householdKeywords.some((w) => key.includes(w) || label.includes(w))) {
    return "shared_household";
  }

  // Default: if in a petitioner context -> shared_petitioner; otherwise -> candidate_distinct
  if (section.includes("petitioner") || section.includes("sponsor") || section.includes("part 2") || section.includes("part 3")) {
    return "shared_petitioner";
  }

  return "candidate_distinct";
}

/**
 * Identifies high-risk / critical audit fields and generates dynamic, context-aware caution messages
 * tailored for Candidate 1 (first-time filing) vs Candidate 2+ (subsequent candidate switch).
 */
export function isFieldCritical(
  formCode: string,
  field: Field,
  context?: CriticalFieldContext
): CriticalFieldMeta {
  const scope = getFieldCandidateScope(formCode, field, context?.sectionTitle);
  const isCandidateDistinct = scope === "candidate_distinct";
  const isFirstCandidate = context?.isFirstCandidate ?? true;
  const name = context?.fullName || context?.candidateLabel || "Beneficiary";
  const relation = context?.relation ? ` (${context.relation})` : "";
  const badgeLabel = `For ${name}`;

  // 1. Explicit reason override on field
  if (field.criticalReason) {
    return {
      isCritical: true,
      category: "general",
      title: field.label || "Important Detail",
      reason: isFirstCandidate
        ? `${field.criticalReason} — Must match ${name}'s official government records character-for-character.`
        : `Please ensure this detail is verified specifically for ${name}.`,
      badgeText: badgeLabel,
    };
  }

  const key = (field.key || "").toLowerCase();
  const label = (field.label || "").toLowerCase();

  // ── 1. Date of Birth ──────────────────────────────────────────────────────
  if (
    key.includes("dob") ||
    key.includes("date_of_birth") ||
    key.includes("birth_date") ||
    label.includes("date of birth") ||
    label.includes("born on")
  ) {
    return {
      isCritical: true,
      category: "dob",
      title: "Date of Birth",
      reason: isFirstCandidate
        ? `Enter ${name}'s exact date of birth (YYYY-MM-DD) from their official birth certificate or passport.`
        : `Verify ${name}'s date of birth from their official civil documents.`,
      badgeText: badgeLabel,
    };
  }

  // ── 2. Full Legal Name / Aliases / Native Alphabet ─────────────────────────
  if (
    (key.includes("name") || label.includes("name")) &&
    (label.includes("given name") ||
      label.includes("family name") ||
      label.includes("first name") ||
      label.includes("last name") ||
      label.includes("middle name") ||
      label.includes("surname") ||
      label.includes("legal name") ||
      label.includes("native alphabet") ||
      label.includes("other names") ||
      key.includes("givenname") ||
      key.includes("familyname") ||
      key.includes("first_name") ||
      key.includes("last_name") ||
      key.includes("middle_name") ||
      key.includes("native_alphabet"))
  ) {
    return {
      isCritical: true,
      category: "identity",
      title: "Full Legal Name",
      reason: isFirstCandidate
        ? `Enter ${name}'s exact legal name as printed on their passport or national civil registry.`
        : `Please ensure this is ${name}'s full legal name.`,
      badgeText: badgeLabel,
    };
  }

  // ── 3. Passport & Travel Documents ────────────────────────────────────────
  if (key.includes("passport") || label.includes("passport") || key.includes("travel_doc") || label.includes("travel document")) {
    return {
      isCritical: true,
      category: "passport",
      title: "Passport Details",
      reason: isFirstCandidate
        ? `Verify passport booklet number and expiry date match ${name}'s current government passport.`
        : `Enter ${name}'s distinct passport booklet number and expiration date.`,
      badgeText: badgeLabel,
    };
  }

  // ── 4. Alien Registration Number (A-Number) / USCIS Account # ─────────────
  if (
    key.includes("alien_registration") ||
    key.includes("arn") ||
    key.includes("a_number") ||
    key.includes("uscis_num") ||
    label.includes("alien registration") ||
    label.includes("a-number")
  ) {
    return {
      isCritical: true,
      category: "status",
      title: "Alien Registration # (A-Number)",
      reason: isFirstCandidate
        ? `Only enter if ${name} has previously been assigned an A-Number by USCIS (leave blank if none).`
        : `Only enter an A-Number if previously assigned specifically to ${name}.`,
      badgeText: badgeLabel,
    };
  }

  // ── 5. Place / Country of Birth & Citizenship ─────────────────────────────
  if (
    key.includes("birth_country") ||
    key.includes("country_of_birth") ||
    key.includes("birth_city") ||
    key.includes("birth_province") ||
    key.includes("citizenship") ||
    key.includes("nationality") ||
    label.includes("country of birth") ||
    label.includes("city of birth") ||
    label.includes("country of citizenship")
  ) {
    return {
      isCritical: true,
      category: "identity",
      title: "Place of Birth & Citizenship",
      reason: isFirstCandidate
        ? `Must match ${name}'s official birth certificate and passport place of origin.`
        : `Confirm ${name}'s specific city, province, and country of birth.`,
      badgeText: badgeLabel,
    };
  }

  // ── 6. Marital Status & History ───────────────────────────────────────────
  if (
    key.includes("marital_status") ||
    key.includes("marital") ||
    key.includes("marriage") ||
    label.includes("marital status") ||
    label.includes("marital") ||
    label.includes("married")
  ) {
    return {
      isCritical: true,
      category: "legal",
      title: "Marital Status & History",
      reason: isFirstCandidate
        ? `Accurately declare ${name}'s current marital status and any prior marriage history.`
        : `Declare ${name}'s individual marital status and marriage history.`,
      badgeText: badgeLabel,
    };
  }

  // ── 7. Relationship to Petitioner (e.g. I-130 Part 1) ─────────────────────
  if (key.includes("relationship") || label.includes("relationship") || label.includes("who do you want to bring")) {
    return {
      isCritical: true,
      category: "relationship",
      title: "Relationship to Petitioner",
      reason: isFirstCandidate
        ? `Specify the exact legal family relationship between Petitioner and ${name}${relation}.`
        : `Select the specific relationship for ${name}${relation}.`,
      badgeText: badgeLabel,
    };
  }

  // ── 8. Beneficiary Contact Information (Phone, Mobile, Email) ─────────────
  if (
    key.includes("phone") ||
    key.includes("mobile") ||
    key.includes("email") ||
    label.includes("phone number") ||
    label.includes("mobile") ||
    label.includes("email address") ||
    (context?.sectionTitle || "").toLowerCase().includes("contact")
  ) {
    return {
      isCritical: true,
      category: "contact",
      title: "Beneficiary Contact Details",
      reason: isFirstCandidate
        ? `Enter ${name}'s direct personal phone and email address for official consular notifications.`
        : `Provide ${name}'s distinct personal contact details (do not reuse petitioner details).`,
      badgeText: badgeLabel,
    };
  }

  // ── 9. Beneficiary Physical Address & Address Abroad ──────────────────────
  if (
    key.includes("street") ||
    key.includes("city") ||
    key.includes("province") ||
    key.includes("postalcode") ||
    label.includes("street address") ||
    label.includes("current address") ||
    label.includes("address abroad") ||
    (context?.sectionTitle || "").toLowerCase().includes("physical address") ||
    (context?.sectionTitle || "").toLowerCase().includes("address abroad")
  ) {
    return {
      isCritical: true,
      category: "contact",
      title: "Beneficiary Address Details",
      reason: isFirstCandidate
        ? `Enter ${name}'s current official residential address.`
        : `Provide ${name}'s distinct residential address abroad or in the U.S.`,
      badgeText: badgeLabel,
    };
  }

  // ── 10. Beneficiary-Distinct Fallback (All other beneficiary fields) ───────
  if (isCandidateDistinct) {
    return {
      isCritical: true,
      category: "general",
      title: "Beneficiary Information",
      reason: isFirstCandidate
        ? `Provide official, accurate information for ${name}.`
        : `Ensure this information applies specifically to ${name}.`,
      badgeText: badgeLabel,
    };
  }

  return { isCritical: false };
}

/**
 * Takes Candidate 1's filled draft and extracts inheritable fields for Candidate 2.
 *
 * @param options.sameJourney - When true (same visa journey type, e.g. both IR-5), ALL fields
 *   are cloned as a starting point. candidate_distinct fields are still returned in distinctKeys
 *   so FormStep can show caution badges — the user sees everything pre-filled but knows exactly
 *   which fields to verify/correct for this specific candidate.
 */
export function extractInheritableCandidateData(
  formCode: string,
  fields: Field[],
  sourceData: Record<string, string>,
  targetCandidateProfile?: {
    fullName?: string;
    name?: { first?: string; middle?: string; last?: string };
    dateOfBirth?: string;
    placeOfBirth?: string | { city?: string; state?: string; country?: string };
    passportNumber?: string;
    cnic?: string;
  },
  options?: { sameJourney?: boolean }
): {
  inheritedData: Record<string, string>;
  inheritedKeys: string[];
  distinctKeys: string[];
} {
  const inheritedData: Record<string, string> = {};
  const inheritedKeys: string[] = [];
  const distinctKeys: string[] = [];
  const sameJourney = options?.sameJourney ?? false;

  const walkFields = (items: Field[]) => {
    items.forEach((f) => {
      const scope = getFieldCandidateScope(formCode, f);
      const val = sourceData[f.key];
      const isDistinct = scope === "candidate_distinct";

      if (!isDistinct || sameJourney) {
        // Shared fields are always inherited.
        // Distinct fields are also inherited in same-journey mode (full clone).
        if (val !== undefined && val !== "") {
          inheritedData[f.key] = val;
          inheritedKeys.push(f.key);
        }
        // Handle options pdfKey / checkboxes
        if (f.options) {
          f.options.forEach((opt) => {
            const optKey = opt.pdfKey || opt.value;
            if (sourceData[optKey] !== undefined && sourceData[optKey] !== "") {
              inheritedData[optKey] = sourceData[optKey];
            }
          });
        }
      }

      // Always track distinct keys so FormStep can show caution badges regardless of mode.
      if (isDistinct) {
        distinctKeys.push(f.key);
      }

      if (f.subQuestions && f.subQuestions.length > 0) {
        walkFields(f.subQuestions as Field[]);
      }
    });
  };

  walkFields(fields);

  // In sameJourney mode (e.g. IR-5 candidate 1 <-> candidate 2), ensure every answered key is cloned
  if (sameJourney) {
    Object.entries(sourceData).forEach(([k, v]) => {
      if (typeof v === "string" && v.trim() !== "" && !inheritedData[k]) {
        inheritedData[k] = v;
        if (!inheritedKeys.includes(k)) inheritedKeys.push(k);
      }
    });
  }

  return {
    inheritedData,
    inheritedKeys,
    distinctKeys,
  };
}


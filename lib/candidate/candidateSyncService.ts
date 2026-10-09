// lib/candidate/candidateSyncService.ts
// ============================================================================
// Multi-Candidate Synchronization & Profile Isolation Engine
//
// Governs the separation between:
// 1. Shared Petitioner/Sponsor Data (auto-synced across all candidates)
// 2. Candidate-Specific Beneficiary Data (isolated per candidate journey)
// ============================================================================

import type { MasterProfile } from "@/types/profile";
import type {
  CandidateProfile,
  CandidateRelation,
  CandidateTier,
} from "@/types/candidate";
import type { VisaCategory } from "@/lib/document-vault/types";

/**
 * Fields that belong to the Petitioner / U.S. Sponsor.
 * These are shared and synchronized across all candidate petitions.
 */
export const SHARED_PETITIONER_FIELDS: ReadonlyArray<string> = [
  "sponsor",
  "citizenshipStatus",
  "naturalizationInfo",
  "annualIncome",
  "financialProfile",
  "householdSize",
  "sponsorStatus",
  "isMilitary",
  "taxDependents",
  "hasPreviousSponsorship",
  "previousSponsoredCount",
  "intendedUSState",
  "currentAddress",
  "mailingAddress",
  "addressHistory",
  "employer",
  "occupation",
  "jobTitle",
  "industrySector",
  "employerType",
  "employmentHistory",
];

/**
 * Fields that belong to a single specific Beneficiary (Candidate).
 * These must remain isolated to prevent cross-candidate data leakage.
 */
export const CANDIDATE_SPECIFIC_FIELDS: ReadonlyArray<string> = [
  "beneficiary",
  "dateOfBirth",
  "placeOfBirth",
  "passportNumber",
  "passportIssueDate",
  "passportPlaceOfIssue",
  "passportBookNumber",
  "passportExpiry",
  "passportCountry",
  "cnic",
  "nativeFullName",
  "sex",
  "nationality",
  "maritalStatus",
  "caseNumber",
  "receiptNumber",
  "priorityDate",
  "approvalDate",
  "dqDate",
  "dqPost",
  "interviewDate",
  "interviewLocation",
  "interviewOutcome",
  "outcome221gSubtype",
  "medicalDate",
  "medicalTime",
  "medicalClinic",
  "pccDate",
  "actionPlanner",
  "caseStrength",
];

/**
 * Generates default candidate profiles for a visa category.
 */
export function getDefaultCandidatesForVisa(
  visaCategory: string = "IR-1",
  userTier: CandidateTier = "free",
  bothParents: boolean = false
): CandidateProfile[] {
  const normCategory = visaCategory.toUpperCase();
  const now = new Date().toISOString();

  if (normCategory.includes("IR-5") || normCategory.includes("IR5")) {
    // The primary parent is NOT assumed to be Mother/Father - the petitioner may be
    // sponsoring a step-parent or adoptive parent. Keep it generic ("Candidate 1") with
    // an unspecified relation; the user picks the exact relation only when they choose to.
    const primary: CandidateProfile = {
      id: "candidate-1",
      label: "Candidate 1",
      relation: "Other",
      fullName: "",
      visaCategory: "IR-5",
      tier: userTier,
      isPrimary: true,
      isPreview: false,
      createdAt: now,
      colorTag: "purple",
    };

    if (bothParents) {
      const secondParent: CandidateProfile = {
        id: "candidate-2",
        label: "Candidate 2",
        relation: "Other",
        fullName: "",
        visaCategory: "IR-5",
        tier: userTier,
        isPrimary: false,
        isPreview: false,
        createdAt: now,
        colorTag: "teal",
      };
      return [primary, secondParent];
    }

    return [primary];
  }

  if (normCategory.includes("IR-2") || normCategory.includes("IR2")) {
    return [
      {
        id: "candidate-1",
        label: "Candidate 1",
        relation: "Child",
        fullName: "",
        visaCategory: "IR-2",
        tier: userTier,
        isPrimary: true,
        isPreview: false,
        createdAt: now,
        colorTag: "blue",
      },
    ];
  }

  // Default for IR-1, CR-1, etc.
  return [
    {
      id: "candidate-1",
      label: "Candidate 1",
      relation: "Spouse",
      fullName: "",
      visaCategory: visaCategory || "IR-1",
      tier: userTier,
      isPrimary: true,
      isPreview: false,
      createdAt: now,
      colorTag: "emerald",
    },
  ];
}

/**
 * Maps a candidate relation to its official Visa Category.
 * - Mother, Father, Stepparent, AdoptiveParent -> IR-5 (Parent)
 * - Spouse -> IR-1 (Spouse)
 * - Child -> IR-2 (Child)
 */
export function getVisaCategoryForRelation(
  relation: CandidateRelation,
  fallbackVisa?: string
): string {
  switch (relation) {
    case "Mother":
    case "Father":
    case "Stepparent":
    case "AdoptiveParent":
      return "IR-5";
    case "Spouse":
      return "IR-1";
    case "Child":
      return "IR-2";
    default:
      return fallbackVisa || "IR-1";
  }
}

/**
 * Creates a new candidate profile (e.g. adding 2nd parent for free preview or multi-petition).
 */
export function createNewCandidate(
  existingCandidates: CandidateProfile[],
  params: {
    relation: CandidateRelation;
    fullName?: string;
    visaCategory?: string;
    tier?: CandidateTier;
    isPreview?: boolean;
  }
): CandidateProfile {
  const nextNum = existingCandidates.length + 1;
  const relation = params.relation;

  const colorTags: Array<CandidateProfile["colorTag"]> = [
    "teal",
    "purple",
    "blue",
    "amber",
    "rose",
    "emerald",
  ];
  const colorTag = colorTags[(nextNum - 1) % colorTags.length] || "teal";

  // Automatically determine the exact Visa Category from relation unless explicitly specified
  const visaCategory =
    params.visaCategory ||
    getVisaCategoryForRelation(relation, existingCandidates[0]?.visaCategory || "IR-5");

  return {
    id: `candidate-${nextNum}`,
    // Generic, numbered label. The user-chosen relation is stored on `relation` and shown
    // separately; the actual name (if any) goes in `fullName` when the user enters it.
    label: `Candidate ${nextNum}`,
    relation,
    fullName: params.fullName || "",
    visaCategory,
    tier: params.tier || "free",
    isPrimary: existingCandidates.length === 0,
    // No per-candidate preview: added candidates are full, equal beneficiaries.
    isPreview: params.isPreview ?? false,
    createdAt: new Date().toISOString(),
    colorTag,
  };
}

/**
 * Explicit "could not resolve a visa category" sentinel (decision 5). `getBaseVisaCategory`
 * returns this for empty/null/unresolvable input instead of silently defaulting to IR-5, so a
 * mis-mapped or missing `journey_type` surfaces as UNKNOWN rather than masquerading as a real
 * parent journey. Callers that need a concrete category must guard against it explicitly.
 * (Cast once here, matching the existing `as VisaCategory` style in this file.)
 */
export const UNKNOWN_VISA_CATEGORY = "UNKNOWN" as VisaCategory;

/**
 * Extracts base visa category ("IR-5", "IR-1", "IR-2", "CR-1", etc.)
 * from any raw journey type, candidate key, or compound string.
 * Returns UNKNOWN_VISA_CATEGORY when the input is empty/null or cleans to nothing - it does
 * NOT default to IR-5 (decision 5, explicit unknown).
 */
export function getBaseVisaCategory(journeyTypeOrVisa?: string | null): VisaCategory {
  if (!journeyTypeOrVisa) return UNKNOWN_VISA_CATEGORY;
  const cleaned = journeyTypeOrVisa.split("_")[0].split(":")[0].trim();
  const normalized = cleaned.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normalized.startsWith("ir5")) return "IR-5";
  if (normalized.startsWith("ir1")) return "IR-1";
  if (normalized.startsWith("ir2")) return "IR-2";
  if (normalized.startsWith("cr1")) return "CR-1";
  if (normalized.startsWith("cr2")) return "CR-2";
  if (normalized === "f1") return "F-1 Student Visa";

  if (/^[a-zA-Z]+[0-9]+$/.test(cleaned)) {
    const formatted = cleaned.replace(/^([a-zA-Z]+)([0-9]+)$/, "$1-$2").toUpperCase();
    return formatted as VisaCategory;
  }
  return (cleaned.toUpperCase() as VisaCategory) || UNKNOWN_VISA_CATEGORY;
}

/**
 * Set of visa categories that support multiple beneficiaries/candidates.
 * - IR-5: Multiple parents (Mother, Father, Stepparents, Adoptive parents)
 * - IR-2 / CR-2: Multiple children
 * - F-4: Multiple siblings
 */
export const MULTI_CANDIDATE_VISA_CATEGORIES: ReadonlySet<string> = new Set([
  "IR-5",
  "IR-2",
  "CR-2",
  "F-4",
]);

/**
 * Checks whether a given visa category or journey type supports multiple candidates/beneficiaries.
 */
export function isMultiCandidateCategory(journeyTypeOrVisa?: string | null): boolean {
  if (!journeyTypeOrVisa) return false;
  const base = getBaseVisaCategory(journeyTypeOrVisa);
  if (MULTI_CANDIDATE_VISA_CATEGORIES.has(base)) return true;
  const norm = String(journeyTypeOrVisa).toLowerCase().replace(/[^a-z0-9]/g, "");
  return (
    norm.includes("ir5") ||
    norm.includes("ir2") ||
    norm.includes("cr2") ||
    norm.includes("f4")
  );
}

/**
 * Derives the database journey type key for a candidate.
 * Candidate 1 maps to the base root (e.g. "ir5", "ir1"),
 * while subsequent candidates map to "ir5_candidate2", "ir5_candidate3", etc.
 * Fully idempotent even if passed an already candidate-scoped key.
 */
export function getCandidateJourneyKey(baseJourneyType: string, candidateId?: string | null): string {
  const baseVisa = getBaseVisaCategory(baseJourneyType);
  const normalizedBase = baseVisa.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!candidateId || candidateId === "candidate-1") {
    return normalizedBase;
  }
  const cleanCandId = candidateId.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${normalizedBase}_${cleanCandId}`;
}

/** Alias for getCandidateJourneyKey */
export const getJourneyKeyForCandidate = getCandidateJourneyKey;

/**
 * Synchronizes shared petitioner / sponsor fields across the profile.
 * When sponsor data is updated, ensures it is consistently available.
 */
export function syncSponsorDataAcrossCandidates(profile: MasterProfile): MasterProfile {
  if (!profile.candidates || profile.candidates.length <= 1) {
    return profile;
  }

  return {
    ...profile,
    candidateSync: {
      autoSyncSponsor: true,
      lastSyncedAt: new Date().toISOString(),
    },
  };
}

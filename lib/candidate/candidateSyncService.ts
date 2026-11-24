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
import {
  candidateIdNumber,
  nextCandidateId,
  nextCategorySlot,
} from "./candidateKeys";

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

const COLOR_TAGS: Array<NonNullable<CandidateProfile["colorTag"]>> = [
  "teal",
  "purple",
  "blue",
  "amber",
  "rose",
  "emerald",
];

/**
 * Builds a new candidate. Server-side only (candidate/create, provisioning): the id is
 * one above the highest id ever issued (`highWater`), never `length + 1`, and the slot
 * is the lowest free slot in the category pool that no leftover data still occupies
 * (`blockedKeys`). Tier is always "free" here; only Stripe provisioning raises it.
 */
export function createNewCandidate(
  existingCandidates: CandidateProfile[],
  params: {
    relation: CandidateRelation;
    fullName?: string;
    visaCategory?: string;
    /** Highest candidate id number ever issued on this account. */
    highWater?: number;
    /** Canonical journey keys whose slot may not be reused yet. */
    blockedKeys?: ReadonlySet<string>;
    /** Force a slot (provisioning adopting a purchased base journey). */
    categorySlot?: number;
  }
): CandidateProfile {
  // The account's first candidate is always candidate-1: it owns legacy rows that carry
  // no candidate tag (and DB defaults of 'candidate-1').
  const id =
    existingCandidates.length === 0
      ? "candidate-1"
      : nextCandidateId(existingCandidates, params.highWater ?? 0);
  const idNum = candidateIdNumber(id) ?? 1;
  const relation = params.relation;

  // Automatically determine the exact Visa Category from relation unless explicitly specified
  const visaCategory =
    params.visaCategory ||
    getVisaCategoryForRelation(relation, existingCandidates[0]?.visaCategory || "IR-5");

  const categorySlot =
    params.categorySlot ??
    nextCategorySlot(existingCandidates, visaCategory, params.blockedKeys ?? new Set());

  return {
    id,
    categorySlot,
    // Generic label numbered inside the category. The relation is stored on `relation`
    // and the name (if any) in `fullName`.
    label: `Candidate ${categorySlot}`,
    relation,
    fullName: params.fullName || "",
    visaCategory,
    tier: "free",
    isPrimary: existingCandidates.length === 0,
    isPreview: false,
    createdAt: new Date().toISOString(),
    colorTag: COLOR_TAGS[(idNum - 1) % COLOR_TAGS.length] || "teal",
  };
}

// Base-category parsing lives in ./visaCategory so pure key helpers (./candidateKeys) and
// journeyConfig can use it without an import cycle. Re-exported here for existing importers.
export { UNKNOWN_VISA_CATEGORY, getBaseVisaCategory } from "./visaCategory";
import { getBaseVisaCategory } from "./visaCategory";

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
 * LEGACY id-based journey key: "candidate-N" -> `<base>_candidateN`. Correct only for
 * candidates without a `categorySlot` (pre-slot rosters). Anything holding the candidate
 * object must use getJourneyKeyForCandidate (./candidateKeys); anything holding only an id
 * plus the roster must use resolveCandidateJourneyKey.
 * @deprecated use getJourneyKeyForCandidate / resolveCandidateJourneyKey
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

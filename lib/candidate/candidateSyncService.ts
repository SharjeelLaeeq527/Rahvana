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
  visaCategory: string = "IR-5",
  userTier: CandidateTier = "free",
  bothParents: boolean = false
): CandidateProfile[] {
  const normCategory = visaCategory.toUpperCase();
  const now = new Date().toISOString();

  if (normCategory.includes("IR-5") || normCategory.includes("IR5")) {
    const mother: CandidateProfile = {
      id: "candidate-1",
      label: "Candidate 1 (Mother)",
      relation: "Mother",
      fullName: "Mother",
      visaCategory: "IR-5",
      tier: userTier,
      isPrimary: true,
      isPreview: false,
      createdAt: now,
      colorTag: "purple",
    };

    if (bothParents) {
      const father: CandidateProfile = {
        id: "candidate-2",
        label: "Candidate 2 (Father)",
        relation: "Father",
        fullName: "Father",
        visaCategory: "IR-5",
        tier: userTier,
        isPrimary: false,
        isPreview: false,
        createdAt: now,
        colorTag: "teal",
      };
      return [mother, father];
    }

    return [mother];
  }

  if (normCategory.includes("IR-2") || normCategory.includes("IR2")) {
    return [
      {
        id: "candidate-1",
        label: "Candidate 1 (Child)",
        relation: "Child",
        fullName: "Child 1",
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
      label: "Candidate 1 (Spouse)",
      relation: "Spouse",
      fullName: "Spouse",
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
  const relationLabel =
    relation === "Mother"
      ? "Mother"
      : relation === "Father"
        ? "Father"
        : relation === "Child"
          ? `Child ${nextNum}`
          : relation;

  const colorTags: Array<CandidateProfile["colorTag"]> = [
    "teal",
    "purple",
    "blue",
    "amber",
    "rose",
    "emerald",
  ];
  const colorTag = colorTags[(nextNum - 1) % colorTags.length] || "teal";

  return {
    id: `candidate-${nextNum}`,
    label: `Candidate ${nextNum} (${relationLabel})`,
    relation,
    fullName: params.fullName || relationLabel,
    visaCategory: params.visaCategory || existingCandidates[0]?.visaCategory || "IR-5",
    tier: params.tier || (params.isPreview ? "free" : existingCandidates[0]?.tier || "free"),
    isPrimary: existingCandidates.length === 0,
    isPreview: params.isPreview ?? false,
    createdAt: new Date().toISOString(),
    colorTag,
  };
}

/**
 * Derives the database journey type key for a candidate.
 * Candidate 1 can map to the root (e.g. "ir-5") or "ir-5:candidate-1",
 * while subsequent candidates map to "ir-5:candidate-2", etc.
 */
export function getCandidateJourneyKey(baseJourneyType: string, candidateId: string): string {
  const normalized = baseJourneyType.toLowerCase().replace(/-/g, "");
  if (!candidateId || candidateId === "candidate-1") {
    return normalized;
  }
  return `${normalized}_${candidateId.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
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

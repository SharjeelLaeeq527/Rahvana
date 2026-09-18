/**
 * Journey → Profile Bridge
 * ============================================================================
 * Maps data from journey roadmap sources (case_data, quest answers, tool outputs)
 * back into the user's MasterProfile so it becomes available for auto-fill.
 *
 * This bridges the two data silos:
 *   - case_data (journey-scoped KV pairs)
 *   - profile_details (user-scoped MasterProfile)
 *
 * Flow: Journey answer → Bridge mapping → MasterProfile delta → updateProfile()
 * ============================================================================
 */

import type { MasterProfile } from "@/types/profile";

// ─────────────────────────────────────────────────────────────────────────────
// CASE DATA → PROFILE MAP
// Maps case_data keys (from the journey `case_data` table) to MasterProfile paths
// ─────────────────────────────────────────────────────────────────────────────

const CASE_DATA_TO_PROFILE: Record<string, string> = {
  // Filing & Visa
  filing_method: "visaType",
  visa_category: "visaCategory",

  // Beneficiary
  beneficiary_age: "beneficiary.dateOfBirth", // Note: age needs conversion
  beneficiary_country_of_residence: "beneficiary.countryOfResidence",
  beneficiary_relationship: "relationship.type",

  // Sponsor
  sponsor_type: "sponsorStatus",
  employer_state: "intendedUSState",

  // Documents / Readiness flags
  has_birth_certificate: "documents.hasBirthCertificate",
  has_police_certificate: "documents.hasPoliceCertificate",
  has_passport: "documents.hasPassport",
  has_medical_record: "documents.hasMedicalRecord",

  // Interview Metadata (Chapter 2 Step II-12 / Chapter 3)
  interviewDate: "interviewDate",
  interview_date: "interviewDate",
  consulateLocation: "interviewLocation",
  caseStatus: "caseStatus",
  ceacStatus: "caseStatus",

  // NVC Registration (Chapter 2 Step II-01)
  nvcCaseNum: "caseNumber",
  nvcInvoice: "nvcInvoice",
  embassyCity: "interviewLocation",
  beneficiaryName: "fullName",
  passportNumber: "passportNumber",
  surname: "surname",

  // USCIS Approval (Chapter 1 Step I-10 — nested approvalDetails handled separately)
  // These are flattened keys that may also appear directly:
  approvalDate: "approvalDate",
  priorityDate: "priorityDate",

  // Documentary Qualification (Chapter 2 Step II-10)
  dqDate: "dqDate",
  dqPost: "dqPost",
  dqCategory: "visaCategory",
  post: "dqPost", // alias used by DqRecordingTool

  // Interview Outcome (Chapter 3 Step III-06)
  interviewOutcome: "interviewOutcome",
  outcome221gSubtype: "outcome221gSubtype",

  // Medical Exam (Chapter 3 Step III-01/04)
  med_date: "medicalDate",
  med_time: "medicalTime",
  med_clinic: "medicalClinic",

  // Police Certificate (Chapter 3 Step III-02)
  pcc_date: "pccDate",
};

// ─────────────────────────────────────────────────────────────────────────────
// QUEST ANSWER → PROFILE MAP
// Maps journey quest question IDs to MasterProfile paths
// These are the question IDs from the eligibility questionnaire and
// document questionnaire (ir1-questionnaire.ts)
// ─────────────────────────────────────────────────────────────────────────────

const QUEST_ANSWER_TO_PROFILE: Record<string, string> = {
  // Eligibility Quest answers (from QuestRenderer state.answers)
  // q1 → Petitioner citizenship status
  petitionerStatus: "citizenshipStatus",

  // q3 → Marriage info
  prior_marriage_petitioner: "relationship.type",
  has_children: "numberOfChildren",

  // q5 → Criminal history
  criminal_history: "immigrationHistory.criminalRecord",

  // q8 → Military
  military_service: "immigrationHistory.priorMilitaryService",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Set nested value on profile object
// ─────────────────────────────────────────────────────────────────────────────

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const keys = path.split(".");
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] == null || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sync case_data entries to MasterProfile.
 * Call this when journey case data is updated (e.g., filing_method changes).
 *
 * @param caseData - Record of case_data key-value pairs
 * @param existingProfile - Current profile to merge into
 * @returns Partial MasterProfile with extracted values
 */
// These fields are specific to a single visa case/beneficiary, so they must never be auto-filled
// or shared across different journeys of the same user profile.
export const BENEFICIARY_SPECIFIC_KEYS = new Set([
  "nvcCaseNum",
  "nvcInvoice",
  "passportNumber",
  "surname",
  "beneficiaryName",
  "cnic",
  "nativeFullName",
  "dateOfBirth",
  "date_of_birth",
  "dob",
  "med_date",
  "med_time",
  "med_clinic",
  "interviewDate",
  "interview_date",
  "consulateLocation",
  "embassyCity",
  "dqDate",
  "dqPost",
  "post",
  "interviewOutcome",
  "outcome221gSubtype",
  "pcc_date",
  "receiptNumber",
  "receiptNum",
  "approvalDate",
  "priorityDate",
]);

/**
 * Sync case_data entries to MasterProfile.
 * Call this when journey case data is updated (e.g., filing_method changes).
 *
 * @param caseData - Record of case_data key-value pairs
 * @param existingProfile - Current profile to merge into
 * @param journeyId - Optional ID of the specific journey to isolate beneficiary data
 * @returns Partial MasterProfile with extracted values
 */
export function syncCaseDataToProfile(
  caseData: Record<string, unknown>,
  existingProfile: Partial<MasterProfile> = {},
  journeyId?: string
): Partial<MasterProfile> {
  const delta: Record<string, unknown> = {};

  // Nested metadata objects that need flattening before mapping.
  // e.g. approvalDetails: { receiptNumber, approvalDate, priorityDate }
  const NESTED_OBJECT_MAPS: Record<string, Record<string, string>> = {
    approvalDetails: {
      receiptNumber: "receiptNumber",
      approvalDate: "approvalDate",
      priorityDate: "priorityDate",
    },
  };

  for (const [caseKey, caseValue] of Object.entries(caseData)) {
    if (caseValue === undefined || caseValue === null || caseValue === "") continue;

    // Handle nested object metadata (e.g. approvalDetails.receiptNumber)
    if (NESTED_OBJECT_MAPS[caseKey] && typeof caseValue === "object" && !Array.isArray(caseValue)) {
      const subMap = NESTED_OBJECT_MAPS[caseKey];
      for (const [subKey, profilePath] of Object.entries(subMap)) {
        const subValue = (caseValue as Record<string, unknown>)[subKey];
        if (subValue !== undefined && subValue !== null && subValue !== "") {
          if (journeyId && BENEFICIARY_SPECIFIC_KEYS.has(subKey)) {
            setNestedValue(delta, `journeys.${journeyId}.${profilePath}`, subValue);
          } else {
            setNestedValue(delta, profilePath, subValue);
          }
        }
      }
      continue;
    }

    const profilePath = CASE_DATA_TO_PROFILE[caseKey];
    if (profilePath) {
      if (journeyId && BENEFICIARY_SPECIFIC_KEYS.has(caseKey)) {
        setNestedValue(delta, `journeys.${journeyId}.${profilePath}`, caseValue);
      } else {
        setNestedValue(delta, profilePath, caseValue);
      }
    }
  }

  return delta as Partial<MasterProfile>;
}

/**
 * Sync quest answers to MasterProfile.
 * Call this when user completes a quest step.
 *
 * @param questAnswers - Record of quest answer key-value pairs
 * @param existingProfile - Current profile to merge into
 * @returns Partial MasterProfile with extracted values
 */
export function syncQuestAnswersToProfile(
  questAnswers: Record<string, unknown>,
  existingProfile: Partial<MasterProfile> = {}
): Partial<MasterProfile> {
  const delta: Record<string, unknown> = {};

  for (const [questionId, answer] of Object.entries(questAnswers)) {
    if (answer === undefined || answer === null || answer === "") continue;

    const profilePath = QUEST_ANSWER_TO_PROFILE[questionId];
    if (profilePath) {
      // Special value transformations
      let transformedValue: unknown = answer;

      // Convert yes/no strings to booleans for boolean profile fields
      if (typeof answer === "string") {
        if (answer.toLowerCase() === "yes") transformedValue = true;
        else if (answer.toLowerCase() === "no") transformedValue = false;
      }

      // Citizenship status mapping
      if (questionId === "petitionerStatus") {
        if (answer === "US_CITIZEN") transformedValue = "USCitizen";
        else if (answer === "LPR") transformedValue = "LPR";
        else transformedValue = "Other";
      }

      setNestedValue(delta, profilePath, transformedValue);
    }
  }

  return delta as Partial<MasterProfile>;
}

/**
 * Sync tool output data to MasterProfile.
 * Called when a tool session is completed (tool_output contains results).
 *
 * @param toolKey - The tool identifier (e.g., "affidavit_calculator", "case_strength_checker")
 * @param toolOutput - The tool's output data
 * @returns Partial MasterProfile delta
 */
export function syncToolOutputToProfile(
  toolKey: string,
  toolOutput: Record<string, unknown>
): Partial<MasterProfile> {
  const delta: Record<string, unknown> = {};

  switch (toolKey) {
    case "affidavit_calculator":
      // Extract household size, income, sponsor structure
      if (toolOutput.householdSize) delta.householdSize = toolOutput.householdSize;
      if (toolOutput.annualIncome) delta.annualIncome = String(toolOutput.annualIncome);
      if (toolOutput.sponsorStructure) {
        // This is journey-specific, but we can also set the profile flag
        if (toolOutput.sponsorStructure === "joint_sponsor") {
          setNestedValue(delta, "financialProfile.jointSponsorAvailable", true);
        }
      }
      break;

    case "case_strength_checker":
      // Already handled by mapFormToProfile in the tool itself
      break;

    case "visa_eligibility":
      // Already handled by the tool itself (saves visaEligibility section)
      break;

    default:
      // For unknown tools, try generic field mapping via mapFormToProfile
      // (handled by the calling code)
      break;
  }

  return delta as Partial<MasterProfile>;
}

/**
 * Helper: Get nested value from profile object
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  const keys = path.split(".");
  let current: any = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = current[key];
  }
  return current;
}

/**
 * Sync MasterProfile standard fields back to case_data format.
 * Call this to pre-fill/merge profile data into the journey roadmap metadata.
 *
 * @param profile - The user's MasterProfile
 * @param existingCaseData - Current journey case_data
 * @param journeyId - Optional ID of the specific journey to isolate beneficiary data
 * @returns Partial case_data delta
 */
export function syncProfileToCaseData(
  profile: Partial<MasterProfile>,
  existingCaseData: Record<string, unknown> = {},
  journeyId?: string
): Record<string, unknown> {
  const delta: Record<string, unknown> = {};

  for (const [caseKey, profilePath] of Object.entries(CASE_DATA_TO_PROFILE)) {
    let resolvedPath = profilePath;
    if (journeyId && BENEFICIARY_SPECIFIC_KEYS.has(caseKey)) {
      resolvedPath = `journeys.${journeyId}.${profilePath}`;
    }

    const profileValue = getNestedValue(profile as Record<string, any>, resolvedPath);
    if (profileValue === undefined || profileValue === null || profileValue === "") continue;

    // Convert booleans back to expected strings or keep as is
    let finalValue = profileValue;
    if (typeof profileValue === "boolean") {
      const current = existingCaseData[caseKey];
      if (typeof current === "string") {
        finalValue = String(profileValue);
      }
    }

    if (existingCaseData[caseKey] !== finalValue) {
      delta[caseKey] = finalValue;
    }
  }

  // Handle special interviewSaved flag
  const resolvedInterviewPath = journeyId ? `journeys.${journeyId}.interviewDate` : "interviewDate";
  const hasInterviewDate = getNestedValue(profile as Record<string, any>, resolvedInterviewPath);
  if (hasInterviewDate && existingCaseData.interviewSaved !== true) {
    delta.interviewSaved = true;
  }

  return delta;
}


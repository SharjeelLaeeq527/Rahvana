/**
 * Journey-mode pre-fill and save shape for the CSPA age-out checker.
 *
 * Journey mode reads only the ACTIVE journey's own data (its metadata and the active
 * candidate's date of birth); standalone mode never calls this, so nothing from a journey
 * leaks into the standalone tool and nothing standalone is written to a journey.
 */

import type { CspaInput, CspaMaritalStatus, CspaRelationship, CspaResult } from "./ageOut";

/** Journey metadata key the checker saves to (one per journey row, so one per candidate). */
export const CSPA_METADATA_KEY = "cspaCheck";

/** Where the IR-2 eligibility quest keeps its answers (QuestRenderer: `questAnswers_<suite id>`). */
const QUEST_ANSWERS_KEY = "questAnswers_eligibility-suite";

export interface CspaJourneyRecord {
  input: CspaInput;
  status: CspaResult["status"];
  freezeDate: string | null;
  twentyFirstBirthday: string | null;
  savedAt: string;
}

const RELATIONSHIP_FROM_QUEST: Record<string, CspaRelationship> = {
  bio_mother: "biological",
  bio_father_married: "biological",
  bio_father_unmarried: "biological",
  stepchild: "stepchild",
  adopted: "adopted",
};

const MARITAL_FROM_QUEST: Record<string, CspaMaritalStatus> = {
  never_married: "never_married",
  married: "married",
  previously_married: "previously_married",
};

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Builds the starting input for the journey checker: a saved check wins; otherwise the
 * candidate's date of birth plus the relationship / marital answers from the eligibility quest.
 */
export function cspaInputFromJourney(
  metadata: Record<string, unknown> | null | undefined,
  candidateDateOfBirth?: string | null
): Partial<CspaInput> {
  const saved = metadata?.[CSPA_METADATA_KEY] as CspaJourneyRecord | undefined;
  if (saved?.input && isIsoDate(saved.input.dateOfBirth)) return saved.input;

  const quest = metadata?.[QUEST_ANSWERS_KEY] as
    | Record<string, Record<string, string | string[]>>
    | undefined;
  const child = quest?.q2 ?? {};
  const relationship = RELATIONSHIP_FROM_QUEST[String(child.q2s1 ?? "")];
  const maritalStatus = MARITAL_FROM_QUEST[String(child.q2s3 ?? "")];

  const prefill: Partial<CspaInput> = {};
  if (isIsoDate(candidateDateOfBirth)) prefill.dateOfBirth = candidateDateOfBirth;
  if (relationship) prefill.relationship = relationship;
  if (maritalStatus) prefill.maritalStatus = maritalStatus;
  return prefill;
}

export function toCspaJourneyRecord(input: CspaInput, result: CspaResult): CspaJourneyRecord {
  return {
    input,
    status: result.status,
    freezeDate: result.freezeDate,
    twentyFirstBirthday: result.twentyFirstBirthday,
    savedAt: new Date().toISOString(),
  };
}

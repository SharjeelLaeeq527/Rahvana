/**
 * Journey-driven checklist visibility.
 *
 * Rows do not restate eligibility rules - they name the step that owns the rule
 * (`gated_by_steps`), so a step and its documents move together. Condition semantics
 * match evaluateStepVisibility (lib/journey/service.ts) and isStepActiveForJourney
 * (lib/journey/journeyProgressService.ts).
 *
 * Missing case data is "unknown", not "not required": the row stays listed but loses
 * its hard requirement. Never hide a document on a guess.
 */

import { createClient } from "@/lib/supabase/server";
import type { CandidateProfile } from "@/types/candidate";

export type VisibilityOutcome = "visible" | "hidden" | "unknown";

/** Inline definition shape used by engine.ts. */
export interface ChecklistDocumentDefinition {
  document_key: string;
  title: string;
  subtitle?: string;
  icon?: string;
  is_required?: boolean;
  is_expirable?: boolean;
  expiry_date?: string;
  source_steps?: string[];
  category?: string;
  notes?: string;
  help_url?: string;
  tags?: string[];
  /** Journey steps whose visible_when also gates this row (AND semantics). */
  gated_by_steps?: string[];
  /** Same shape as a step's visible_when, evaluated against case_data. */
  visible_when?: Record<string, unknown>;
}

export interface JourneyVisibility {
  /** case_data map, enriched with derived facts */
  caseData: Record<string, unknown>;
  filingMethod: string;
  knownStepKeys: Set<string>;
  /** step_key -> outcome from its seeded visible_when */
  stepStatus: Record<string, VisibilityOutcome>;
  /** false if steps / case_data could not be read; nothing is hidden then */
  gatingApplied: boolean;
  childAgeBand: string | null;
}

/** Bands used by ir-2.json visible_when: under_14 | 14_15 | 16_17 | 18_20. */
export function computeChildAgeBand(
  dateOfBirth?: string | null,
  now: Date = new Date()
): string | null {
  if (!dateOfBirth) return null;

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  let age = now.getFullYear() - dob.getFullYear();
  const monthDelta = now.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  if (age < 0) return null;

  if (age < 14) return "under_14";
  if (age < 16) return "14_15";
  if (age < 18) return "16_17";
  if (age < 21) return "18_20";
  return "21_plus";
}

/** Evaluates a visible_when object. "hidden" only when a captured fact fails a condition. */
export function matchConditions(
  visibleWhen: Record<string, unknown>,
  caseData: Record<string, unknown>,
  filingMethod: string
): VisibilityOutcome {
  let sawUnknown = false;

  for (const [key, expectedValue] of Object.entries(visibleWhen)) {
    const actualValue =
      key === "filingMethod" || key === "filing_method" ? filingMethod : caseData[key];

    if (actualValue === undefined || actualValue === null || actualValue === "") {
      // fact not captured yet
      sawUnknown = true;
      continue;
    }

    if (Array.isArray(expectedValue)) {
      if (!expectedValue.includes(actualValue)) return "hidden";
      continue;
    }

    if (typeof expectedValue === "boolean") {
      // expected false means "hide when true", as in service.ts
      if (expectedValue !== (actualValue === true)) return "hidden";
      continue;
    }

    if (actualValue !== expectedValue) return "hidden";
  }

  return sawUnknown ? "unknown" : "visible";
}

/** "ir2_candidate2" / "ir2_candidate-2" -> 2; base journeys have no suffix. */
const CANDIDATE_SUFFIX = /candidate[-_]?(\d+)/i;

function pickCandidateForJourney(
  candidates: CandidateProfile[],
  journeyType: string,
  activeCandidateId?: string | null
): CandidateProfile | null {
  if (!candidates.length) return null;

  const journeyMatch = CANDIDATE_SUFFIX.exec(journeyType || "");
  if (journeyMatch) {
    const numbered = candidates.find((candidate) => {
      const candidateMatch = CANDIDATE_SUFFIX.exec(candidate.id || "");
      return candidateMatch ? candidateMatch[1] === journeyMatch[1] : false;
    });
    if (numbered) return numbered;
  }

  // No suffix means the base journey, which belongs to the primary candidate.
  return (
    candidates.find((candidate) => candidate.isPrimary) ||
    candidates.find((candidate) => candidate.id === activeCandidateId) ||
    candidates[0]
  );
}

const DOB_CASE_DATA_KEYS = [
  "child_date_of_birth",
  "beneficiary_date_of_birth",
  "child_dob",
  "dob",
];

async function resolveChildAgeBand(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  journeyType: string,
  caseData: Record<string, unknown>
): Promise<string | null> {
  for (const key of DOB_CASE_DATA_KEYS) {
    const value = caseData[key];
    const band = computeChildAgeBand(typeof value === "string" ? value : null);
    if (band) return band;
  }

  // Otherwise fall back to the candidate roster, which holds the child's DOB.
  const { data: profileRow } = await supabase
    .from("user_profiles")
    .select("profile_details")
    .eq("id", userId)
    .maybeSingle();

  const profileDetails = (profileRow?.profile_details || {}) as Record<string, unknown>;
  const candidates = Array.isArray(profileDetails.candidates)
    ? (profileDetails.candidates as CandidateProfile[])
    : [];

  const candidate = pickCandidateForJourney(
    candidates,
    journeyType,
    typeof profileDetails.activeCandidateId === "string"
      ? profileDetails.activeCandidateId
      : null
  );

  return computeChildAgeBand(candidate?.dateOfBirth);
}

/** Loads this journey's step conditions, case facts and derived age band. */
export async function resolveJourneyVisibility(
  journeyId: string,
  userId: string,
  journeyType: string
): Promise<JourneyVisibility> {
  const supabase = await createClient();

  const [
    { data: stepRows, error: stepsError },
    { data: caseRows, error: caseDataError },
    { data: journeyRow },
  ] = await Promise.all([
    supabase
      .from("steps")
      .select("step_key, visible_when, chapters!inner(journey_id)")
      .eq("chapters.journey_id", journeyId),
    supabase.from("case_data").select("data_key, data_value").eq("journey_id", journeyId),
    supabase.from("journeys").select("filing_method").eq("id", journeyId).maybeSingle(),
  ]);

  const caseData: Record<string, unknown> = {};
  for (const row of caseRows ?? []) {
    if (row?.data_key) caseData[row.data_key] = row.data_value;
  }

  if (!caseData.childAgeBand) {
    caseData.childAgeBand = await resolveChildAgeBand(supabase, userId, journeyType, caseData);
  }

  const filingMethod =
    typeof journeyRow?.filing_method === "string" && journeyRow.filing_method
      ? journeyRow.filing_method
      : "online";

  const knownStepKeys = new Set<string>();
  const stepStatus: Record<string, VisibilityOutcome> = {};

  for (const row of stepRows ?? []) {
    const stepKey = row?.step_key;
    if (!stepKey) continue;

    knownStepKeys.add(stepKey);

    const visibleWhen = (row.visible_when || {}) as Record<string, unknown>;
    stepStatus[stepKey] =
      Object.keys(visibleWhen).length === 0
        ? "visible"
        : matchConditions(visibleWhen, caseData, filingMethod);
  }

  // Any read failure means we cannot trust the gating, so nothing is hidden.
  const gatingApplied = !stepsError && !caseDataError && knownStepKeys.size > 0;

  return {
    caseData,
    filingMethod,
    knownStepKeys,
    stepStatus,
    gatingApplied,
    childAgeBand: (caseData.childAgeBand as string | null) ?? null,
  };
}

/** Should this row show, and is it still a hard requirement? */
export function evaluateDocumentVisibility(
  def: ChecklistDocumentDefinition,
  visibility: JourneyVisibility
): { include: boolean; confirmedRequired: boolean } {
  if (!visibility.gatingApplied) {
    return { include: true, confirmedRequired: true };
  }

  let confirmedRequired = true;

  if (def.visible_when && Object.keys(def.visible_when).length > 0) {
    const outcome = matchConditions(
      def.visible_when,
      visibility.caseData,
      visibility.filingMethod
    );
    if (outcome === "hidden") return { include: false, confirmedRequired: false };
    if (outcome === "unknown") confirmedRequired = false;
  }

  // A step absent from this journey has no opinion, so shared rows never disappear
  // because another journey branched.
  for (const stepKey of def.gated_by_steps ?? []) {
    if (!visibility.knownStepKeys.has(stepKey)) continue;

    const outcome = visibility.stepStatus[stepKey] ?? "visible";
    if (outcome === "hidden") return { include: false, confirmedRequired: false };
    if (outcome === "unknown") confirmedRequired = false;
  }

  return { include: true, confirmedRequired };
}

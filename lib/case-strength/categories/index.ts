/**
 * Case-strength category registry + resolver.
 *
 * This is the ONE place that knows every supported visa category. The UI calls
 * `resolveCaseStrengthProfile(journey_type)` and gets back the right profile —
 * it never imports `IR1_STEP_CHECKERS` (or any category's internals) directly.
 *
 * To add a category: create `categories/<slug>.ts` exporting a
 * `CaseStrengthProfile`, then add it to `CASE_STRENGTH_PROFILES` below. Nothing
 * else in the engine changes. Full checklist: docs/case_strength_analysis.md §3.
 *
 * Matching is by BASE visa category (`getBaseVisaCategory`), so every spelling
 * of a journey resolves the same way: "IR5", "ir-5", "IR-5", and candidate keys
 * like "ir5_candidate-2" all map to the IR-5 profile. A category with no
 * registered profile gets `GENERIC_PROFILE` (common checks only), NEVER the
 * spouse (IR-1) profile.
 */

import { getBaseVisaCategory, UNKNOWN_VISA_CATEGORY } from "@/lib/candidate/candidateSyncService";
import type { CaseStrengthProfile } from "./types";
import { IR1_PROFILE } from "./ir1";
import { IR5_PROFILE } from "./ir5";
import { IR2_PROFILE } from "./ir2";
import { GENERIC_PROFILE } from "./generic";

export type { CaseStrengthProfile } from "./types";
export { IR1_PROFILE } from "./ir1";
export {
  IR5_PROFILE,
  IR5_STEP_CHECKERS,
  IR5_STEP_REFS,
  IR5_BASELINE_FIELDS,
  detectIr5EligibilityRisks,
} from "./ir5";
export {
  IR2_PROFILE,
  IR2_STEP_CHECKERS,
  IR2_STEP_REFS,
  IR2_BASELINE_FIELDS,
  detectIr2EligibilityRisks,
} from "./ir2";
export { GENERIC_PROFILE, GENERIC_BASELINE_FIELDS } from "./generic";

/** All registered category profiles. Order matters only for iteration/dev UI. */
export const CASE_STRENGTH_PROFILES: CaseStrengthProfile[] = [
  IR1_PROFILE,
  IR5_PROFILE,
  IR2_PROFILE,
];

/** The registered profile for a journey, or null when its category has none. */
export function findCaseStrengthProfile(
  journeyType?: string | null
): CaseStrengthProfile | null {
  if (!journeyType) return null;
  // "ir_5" / "IR 5" -> "ir5" first: getBaseVisaCategory treats "_" as the
  // candidate-suffix separator ("ir5_candidate-2"), so a separator inside the
  // category itself must be collapsed before it splits.
  const base = getBaseVisaCategory(journeyType.trim().replace(/^([A-Za-z]+)[_\s]+(\d)/, "$1$2"));
  if (base === UNKNOWN_VISA_CATEGORY) return null;
  return (
    CASE_STRENGTH_PROFILES.find((p) =>
      p.journeyTypes.some((t) => getBaseVisaCategory(t) === base)
    ) ?? null
  );
}

/** True when the journey's category has its own case-strength profile. */
export function hasCaseStrengthProfile(journeyType?: string | null): boolean {
  return findCaseStrengthProfile(journeyType) !== null;
}

/**
 * Resolve the case-strength profile for a journey.
 *
 * @param journeyType the journey's `journey_type` (e.g. "IR1", "ir-5",
 *   "ir5_candidate-2"), or a visa category ("IR-5", "CR-1").
 * @returns the matching profile, or `GENERIC_PROFILE` when the category is
 *   unknown or has no profile yet. Never silently returns the IR-1 profile for
 *   a non-spouse journey.
 */
export function resolveCaseStrengthProfile(
  journeyType?: string | null
): CaseStrengthProfile {
  return findCaseStrengthProfile(journeyType) ?? GENERIC_PROFILE;
}

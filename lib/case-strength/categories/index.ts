/**
 * Case-strength category registry + resolver.
 *
 * This is the ONE place that knows every supported visa category. The UI calls
 * `resolveCaseStrengthProfile(journey_type)` and gets back the right profile —
 * it never imports `IR1_STEP_CHECKERS` (or any category's internals) directly.
 *
 * To add a category later: create `categories/<slug>.ts` exporting a
 * `CaseStrengthProfile`, then add it to `PROFILES` below. Nothing else changes.
 */

import type { CaseStrengthProfile } from "./types";
import { IR1_PROFILE } from "./ir1";
import { IR5_PROFILE } from "./ir5";

export type { CaseStrengthProfile } from "./types";
export { IR1_PROFILE } from "./ir1";
export {
  IR5_PROFILE,
  IR5_STEP_CHECKERS,
  IR5_STEP_REFS,
  IR5_BASELINE_FIELDS,
  detectIr5EligibilityRisks,
} from "./ir5";

/** All registered category profiles. Order matters only for iteration/dev UI. */
export const CASE_STRENGTH_PROFILES: CaseStrengthProfile[] = [IR1_PROFILE, IR5_PROFILE];

/** Normalize a journey_type for tolerant matching: "IR-1"/"ir_1"/"IR1" → "ir-1". */
function normalize(t: string): string {
  return t.trim().toLowerCase().replace(/[_\s]+/g, "-");
}

/**
 * Resolve the case-strength profile for a journey.
 *
 * @param journeyType the journey's `journey_type` (e.g. "IR1", "ir-5").
 * @returns the matching profile, or the IR-1 profile as a safe default so that
 *   an unknown/missing type behaves exactly as the engine did before this layer.
 */
export function resolveCaseStrengthProfile(
  journeyType?: string | null
): CaseStrengthProfile {
  if (journeyType) {
    const norm = normalize(journeyType);
    const found = CASE_STRENGTH_PROFILES.find((p) =>
      p.journeyTypes.some((t) => normalize(t) === norm)
    );
    if (found) return found;
  }
  return IR1_PROFILE;
}

/**
 * IR-1 / CR-1 (spouse of U.S. citizen) case-strength profile.
 *
 * This profile simply bundles the pieces that already existed for IR-1 into the
 * new `CaseStrengthProfile` shape — no behavior changes. It is also the default
 * profile the resolver falls back to for unknown journey types, which preserves
 * today's behavior exactly.
 */

import { IR1_STEP_CHECKERS, COMMON_LOOK_AHEAD } from "../step-checkers";
import { IR1_STEP_REFS, detectRiskFlagsFromEligibilityQuest } from "../eligibility-quest-detector";
import { BASELINE_FIELDS } from "../consistency";
import { PHASE2_QUESTIONS, runPhase2Checks } from "../consistency-intelligence";
import { DEFAULT_DOCUMENT_ESCALATION } from "../alert-gating";
// Import from the UI-free submodules (not the barrel, which also re-exports the
// React EvidenceGapCard) so the profile graph stays server/test friendly.
import { IR1_EVIDENCE_REQUIREMENTS } from "@/lib/journey/evidence-gap/engine";
import { EVIDENCE_QUESTIONNAIRE } from "@/lib/journey/evidence-gap/types";
import type {
  CaseStrengthProfile,
  RelationshipStrengthSignal,
  StrengthSignalContribution,
} from "./types";

/**
 * IR-1 relationship signal — a verbatim port of the original CaseStrengthEngine
 * SIGNAL 3 (relationship) + SIGNAL 4 (age gap) so spouse scoring is unchanged:
 *   - +10 for shared children
 *   - +5 for a marriage ≥ 2 years ("long-term stability")
 *   - −5 + SHORT_MARRIAGE flag for a marriage < 6 months
 *   - −5 + HIGH_AGE_GAP flag when the spouses' age gap exceeds 15 years
 */
export const spouseRelationshipSignal: RelationshipStrengthSignal = ({
  hasChildrenTogether,
  marriageYears,
  ageGapYears,
}) => {
  let scoreDelta = 0;
  const positiveSignals: string[] = [];
  const riskFlags: StrengthSignalContribution["riskFlags"] = [];

  if (hasChildrenTogether) {
    scoreDelta += 10;
    positiveSignals.push("Strong relationship evidence (children together documented).");
  }

  if (marriageYears >= 2) {
    scoreDelta += 5;
    positiveSignals.push(
      `Long-term marriage stability (> ${Math.floor(marriageYears)} years documented).`
    );
  } else if (marriageYears < 0.5 && marriageYears > 0) {
    riskFlags.push({
      code: "SHORT_MARRIAGE",
      severity: "MEDIUM",
      message:
        "Short marriage duration (< 6 months) may trigger additional relationship scrutiny.",
    });
    scoreDelta -= 5;
  }

  if (ageGapYears !== null && ageGapYears > 15) {
    riskFlags.push({
      code: "HIGH_AGE_GAP",
      severity: "MEDIUM",
      message: `Large age gap (${ageGapYears} years) between sponsor and beneficiary may trigger requests for additional bona-fide evidence.`,
    });
    scoreDelta -= 5;
  }

  return { scoreDelta, positiveSignals, riskFlags };
};

export const IR1_PROFILE: CaseStrengthProfile = {
  id: "ir-1",
  label: "IR-1 / CR-1, Spouse of U.S. Citizen",
  journeyTypes: ["IR1", "IR-1", "CR1", "CR-1", "ir-1"],
  stepCheckers: IR1_STEP_CHECKERS,
  stepRefs: IR1_STEP_REFS,
  baselineFields: BASELINE_FIELDS,
  detectEligibilityRisks: detectRiskFlagsFromEligibilityQuest,
  // Spouse case: show BOTH marriage-history and common questions, and run the
  // full (spouse + common) Phase 2 checker. This is the default everywhere.
  consistency: {
    phase2Questions: PHASE2_QUESTIONS,
    runPhase2Checks,
  },
  // Spouse case: full evidence set (bona-fide-marriage categories + marriage
  // certificates) and the full questionnaire. This is the default everywhere.
  evidence: {
    requirements: IR1_EVIDENCE_REQUIREMENTS,
    questionnaire: EVIDENCE_QUESTIONNAIRE,
  },
  // Spouse numeric scoring: marriage duration, shared children, age-gap flag.
  strengthSignals: {
    relationship: spouseRelationshipSignal,
  },
  // ──────────────────────────────────────────────────────────────────────────
  // OPT-IN: Weighted score model (4-ingredient: Evidence 40 / Consistency 30 /
  // Completeness 20 / Risk 10). This replaces the legacy 50/50 blend. User-
  // provided-only evidence (no auto-fill) is used. Fixes the fake ~50% floor
  // (Consistency=100 on empty), the honest score, and calm band-based phrasing.
  caseScore: { model: "weighted" },
  // ──────────────────────────────────────────────────────────────────────────
  // OPT-IN: Document-checklist 3-stage escalation (to-gather → due-soon →
  // critical). Missing docs now escalate gradually, not instant-red. Deadline-
  // relative when target filing date is known, fixed-days fallback otherwise.
  documentEscalation: DEFAULT_DOCUMENT_ESCALATION,
  // Deadline-driven early-warnings (joint sponsor, fresh PCC) — shared family set.
  lookAhead: COMMON_LOOK_AHEAD,
};

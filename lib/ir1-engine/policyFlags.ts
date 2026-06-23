// ─────────────────────────────────────────────────────────────────────────────
// IR-1 Engine · Active Policy Flags
// Pakistan-focused · June 2026
//
// Policy flags represent active government actions that override the engine's
// normal timeline math and narrative copy. They are checked in:
//   - timelineEstimator.ts (VISA_ISSUANCE_MONTHS override)
//   - narrativeEngine.ts (post-interview stage copy)
//
// IMPORTANT: A policy flag is not a soft caveat. When active, it MUST:
//   1. Override any numeric estimate that depends on the affected stages.
//   2. Surface a prominent, specific notice in the narrative — not a footnote.
//   3. Be the FIRST thing shown for affected stages, before any estimate.
//
// UPDATE PROCESS:
//   When a flag's status changes (lifted, extended, modified), update:
//     active: true → false (or vice versa)
//     liftedDate: null → "YYYY-MM-DD"
//     note: update to reflect current status
//   Do NOT delete lifted flags — they are permanent audit history.
// ─────────────────────────────────────────────────────────────────────────────

export type PolicyFlagId = "PAKISTAN_IV_PAUSE";

export type PolicyFlagSeverity =
  | "blocking" // visa CANNOT be issued; estimate is undefined
  | "severe" // major delay; estimate is unreliable
  | "caution"; // notable delay; estimate degrades confidence

export interface PolicyFlag {
  id: PolicyFlagId;
  active: boolean;
  since: string; // ISO date the flag became active
  liftedDate: string | null; // ISO date if lifted; null while active
  severity: PolicyFlagSeverity;
  // Which stage IDs have their normal behavior overridden
  affectedStages: string[];
  // What specifically is blocked/delayed
  headline: string;
  // Detailed explanation for UI display
  detail: string;
  // Source URL for the policy
  sourceUrl: string;
  // For blocking flags: what replaces the normal visa issuance estimate
  visaIssuanceOverride: null | "indefinite" | number; // number = months estimate
}

export const POLICY_FLAGS: Record<PolicyFlagId, PolicyFlag> = {
  // ── Pakistan Immigrant Visa Issuance Pause ────────────────────────────────
  // Effective January 21, 2026: DOS paused IV issuance for nationals of
  // Pakistan (and ~74 other countries), citing elevated public benefits risk.
  //
  // What this means in practice:
  //   - USCIS petition processing continues normally.
  //   - NVC processing continues normally.
  //   - Consular interviews continue to be scheduled and held.
  //   - After a successful interview, the consular officer MAY tell the
  //     applicant they would have been approved — but mandatory Administrative
  //     Processing (AP) is triggered and no visa is physically issued.
  //   - The AP has no published timeline. The pause is described as "indefinite."
  //   - At least one confirmed VJ case (Mar 2026 interview, Islamabad) received
  //     this exact outcome: CO said "you would have gotten it" + mandatory AP.
  //
  // What this does NOT affect:
  //   - Non-immigrant visas (B-1/B-2, F-1, H-1B, etc.)
  //   - Cases already in AP from before the pause
  //   - USCIS internal processing
  //
  // Engine impact:
  //   - VISA_ISSUANCE_MONTHS must be treated as indefinite, not 0.5.
  //   - Stages INTERVIEW_SCHEDULED, INTERVIEW_ATTENDED, INTERVIEW_OUTCOME
  //     must surface this flag prominently.
  //   - Confidence degrades to "very_low" for any end-to-end estimate that
  //     includes the visa issuance step.
  //
  // SOURCE: pk.usembassy.gov/visas/ + DOS Federal Register Jan 20 2026
  PAKISTAN_IV_PAUSE: {
    id: "PAKISTAN_IV_PAUSE",
    active: true,
    since: "2026-01-21",
    liftedDate: null,
    severity: "blocking",
    affectedStages: [
      "INTERVIEW_SCHEDULED",
      "INTERVIEW_ATTENDED",
      "INTERVIEW_OUTCOME",
      "VISA_ISSUED",
    ],
    headline: "U.S. immigrant visa issuances for Pakistan are currently paused.",
    detail:
      "The U.S. Department of State paused immigrant visa issuances for Pakistani nationals " +
      "effective January 21, 2026. Interviews are still being held and USCIS/NVC processing " +
      "continues, but no immigrant visas are being physically issued at the end of the process. " +
      "Applicants who complete a successful interview are placed into indefinite Administrative " +
      "Processing rather than receiving a visa stamp. The pause has no published end date.",
    sourceUrl: "https://pk.usembassy.gov/visas/",
    visaIssuanceOverride: "indefinite",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the flag if it is currently active, otherwise null. */
export function getActiveFlag(id: PolicyFlagId): PolicyFlag | null {
  const flag = POLICY_FLAGS[id];
  return flag?.active ? flag : null;
}

/** Returns all currently active flags. */
export function getActivePolicyFlags(): PolicyFlag[] {
  return Object.values(POLICY_FLAGS).filter((f) => f.active);
}

/**
 * Returns true if ANY active policy flag affects the given stage.
 * Used by the narrative engine to gate post-interview copy.
 */
export function stageAffectedByPolicy(stageId: string): PolicyFlag | null {
  return getActivePolicyFlags().find((f) => f.affectedStages.includes(stageId)) ?? null;
}

/**
 * Check if a scheduling hold is active.
 * A scheduling hold prevents DQ'd cases from being forwarded to the embassy.
 */
export function isSchedulingHoldActive(): boolean {
  return getActivePolicyFlags().some(
    (f) => f.affectedStages.includes("DQ") && f.severity === "blocking"
  );
}

/**
 * Stage-specific policy impact for narrative messaging.
 * Returns impact description if the stage is affected by an active policy.
 */
export interface StageImpact {
  kind: "scheduling_hold" | "visa_issuance_pause";
  description: string;
}

export function getStageImpact(stageId: string): StageImpact | null {
  const flag = stageAffectedByPolicy(stageId);
  if (!flag) return null;

  if (stageId === "DQ" || stageId === "INTERVIEW_WAIT") {
    return {
      kind: "scheduling_hold",
      description:
        "NVC may be pausing transfers of DQ cases to the embassy while the visa issuance pause is in effect.",
    };
  }

  if (
    ["INTERVIEW_SCHEDULED", "INTERVIEW_ATTENDED", "INTERVIEW_OUTCOME", "VISA_ISSUED"].includes(
      stageId
    )
  ) {
    return {
      kind: "visa_issuance_pause",
      description: "No immigrant visas are being issued at this time.",
    };
  }

  return null;
}

/**
 * The effective visa issuance months given active flags.
 * Returns null when any active blocking flag makes issuance indefinite.
 * Returns the numeric override if a flag provides a specific estimate.
 * Returns the defaultMonths if no flag affects issuance.
 */
export function effectiveVisaIssuanceMonths(defaultMonths: number): number | null {
  for (const flag of getActivePolicyFlags()) {
    if (flag.severity === "blocking") {
      if (flag.visaIssuanceOverride === "indefinite") return null;
      if (typeof flag.visaIssuanceOverride === "number") return flag.visaIssuanceOverride;
    }
  }
  return defaultMonths;
}

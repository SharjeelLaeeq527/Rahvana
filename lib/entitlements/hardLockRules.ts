import { PlanTier } from "./config";

/**
 * Hard lock rules for specific steps based on plan tier.
 * Keys are step_key or step.id.
 * Values are arrays of tiers that are NOT allowed to access the step.
 */
export const HARD_LOCK_RULES: Record<string, PlanTier[]> = {
  step_1_16: ["free", "basic"],
  step_2_1: ["free"],
  step_2_2: ["free"],
  step_2_3: ["free"],
  step_2_4: ["free"],
  step_2_5: ["free"],
  step_2_6: ["free", "basic"],
  step_2_7: ["free"],
  step_2_8: ["free"],
  step_2_9: ["free"],
  step_2_10: ["free"],
  step_2_11: ["free"],
  step_2_12: ["free"],
  step_3_1: ["free", "basic"],
  step_3_2: ["free", "basic"],
  step_3_3: ["free"],
  step_3_4: ["free"],
  step_3_5: ["free"],
  step_3_6: ["free"],
  step_3_7: ["free"],
  step_3_8: ["free"],
  step_3_9: ["free"],
  step_3_10: ["free"],
  step_3_11: ["free", "basic", "premium"],
  step_3_12: ["free"],
};

export interface StepLockStatus {
  isLocked: boolean;
  requiredPlan: PlanTier | null;
  reason: "free" | "tier" | null;
}

/**
 * Shared logic to determine if a step is locked for a given user tier.
 * Matches the logic in ChapterView and now StepView.
 */
export function getStepLockStatus(
  stepId: string,
  tier: PlanTier,
  chapterIdx: number,
  localIdx: number
): StepLockStatus {
  const isFreeTier = tier === "free";
  const isChapter1 = chapterIdx === 0;

  // Free tier restriction — only first step of Chapter 1 accessible
  if (isFreeTier && isChapter1 && localIdx > 0) {
    return {
      isLocked: true,
      requiredPlan: "basic" as PlanTier,
      reason: "free",
    };
  }

  // Hard lock rules (specific tiers can't access specific steps)
  const restrictedTiers = HARD_LOCK_RULES[stepId];
  if (restrictedTiers && restrictedTiers.includes(tier)) {
    // Find the minimum required tier to access this step
    const allTiers: PlanTier[] = ["free", "basic", "premium", "executive"];
    const requiredPlan =
      (allTiers.find((t) => !restrictedTiers.includes(t)) as PlanTier) || "premium";
    return { isLocked: true, requiredPlan, reason: "tier" };
  }

  return { isLocked: false, requiredPlan: null, reason: null };
}

/**
 * Helper function to determine which feature to use for the UpgradeModal based on the required tier.
 */
export function getModalFeatureForTier(requiredPlan: PlanTier): string {
  if (requiredPlan === "basic") return "checklist_engine"; // Defaults to basic tier
  if (requiredPlan === "premium") return "document_vault"; // Defaults to premium tier
  if (requiredPlan === "executive") return "pcc_filing"; // Defaults to executive tier
  return "step_guides";
}

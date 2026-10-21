/**
 * lib/pricing/upgradeScheduleService.ts
 *
 * Implements the 12-month dynamic upgrade schedule and pricing model.
 *
 * When a user upgrades their plan mid-cycle (e.g. Month 4 of 12):
 *  1. Total new 12-month commitment = Remaining Current Plan Amount + Plan Difference Amount
 *  2. From the upgrade date, a fresh 12-month commitment schedule starts.
 *  3. This total commitment is divided evenly over the new 12 months:
 *     New Monthly Payment = Total Upgrade Commitment / 12
 */

import type { PlanData } from "@/app/(main)/pricing/data/pricing";

export const TIER_RANK: Record<string, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  executive: 3,
};

export interface SubscriptionCycleInfo {
  /** When the current plan was purchased or started */
  startDate: Date | null;
  /** Number of months already consumed in the current 12-month cycle (0 to 11) */
  monthsElapsed: number;
  /** Number of months remaining in the current 12-month cycle (1 to 12) */
  monthsRemaining: number;
  /** Fraction of cycle completed (0.0 to 1.0) */
  cycleProgress: number;
}

export interface UpgradeScheduleResult {
  currentTier: string;
  targetTier: string;
  monthsElapsed: number;
  monthsRemaining: number;
  currentPlanMonthly: number;
  currentPlanAnnual: number;
  targetPlanMonthly: number;
  targetPlanAnnual: number;
  /** Unpaid/remaining portion on the current plan commitment (monthsRemaining × curMonthly) */
  remainingCurrentAmount: number;
  /** Difference between target tier annual and current tier annual */
  planDifferenceAmount: number;
  /** Total amount the user will pay over the new 12-month commitment */
  totalNewCommitment: number;
  /** New monthly rate divided across the fresh 12-month schedule */
  newMonthlyRate: number;
  /** Standard retail monthly rate for the target plan */
  standardTargetMonthlyRate: number;
  /** Monthly discount vs paying the full target retail rate */
  monthlySavings: number;
  /** Net savings vs purchasing target plan at full retail */
  totalSavingsVsFullRetail: number;
}

/**
 * Calculates months elapsed and remaining given a subscription start date.
 */
export function calculateSubscriptionCycle(
  startDateInput?: string | Date | null,
  nowInput: Date = new Date()
): SubscriptionCycleInfo {
  if (!startDateInput) {
    return {
      startDate: null,
      monthsElapsed: 0,
      monthsRemaining: 12,
      cycleProgress: 0,
    };
  }

  const start = typeof startDateInput === "string" ? new Date(startDateInput) : startDateInput;
  if (!start || isNaN(start.getTime())) {
    return {
      startDate: null,
      monthsElapsed: 0,
      monthsRemaining: 12,
      cycleProgress: 0,
    };
  }

  const now = nowInput;
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) {
    months = Math.max(0, months - 1);
  }

  // Bound within 0 to 11 months elapsed
  const monthsElapsed = Math.min(11, Math.max(0, months));
  const monthsRemaining = Math.max(1, 12 - monthsElapsed);

  return {
    startDate: start,
    monthsElapsed,
    monthsRemaining,
    cycleProgress: Math.min(1, monthsElapsed / 12),
  };
}

export interface CalculateUpgradeScheduleParams {
  currentPlan: Pick<PlanData, "id" | "annualPrice" | "monthlyPrice">;
  targetPlan: Pick<PlanData, "id" | "annualPrice" | "monthlyPrice">;
  /** Number of months already consumed (0..11) */
  monthsElapsed?: number;
  /** Explicit months remaining (1..12). If omitted, derived from monthsElapsed */
  monthsRemaining?: number;
}

/**
 * Calculates the new 12-month upgrade schedule and per-month payment.
 */
export function calculateUpgradeSchedule({
  currentPlan,
  targetPlan,
  monthsElapsed: inputMonthsElapsed = 0,
  monthsRemaining: inputMonthsRemaining,
}: CalculateUpgradeScheduleParams): UpgradeScheduleResult | null {
  const curRank = TIER_RANK[currentPlan.id.toLowerCase()] ?? 0;
  const targetRank = TIER_RANK[targetPlan.id.toLowerCase()] ?? 0;

  // Cannot upgrade to same or lower tier
  if (targetRank <= curRank || curRank === 0) {
    return null;
  }

  const monthsElapsed = Math.min(11, Math.max(0, inputMonthsElapsed));
  const monthsRemaining =
    typeof inputMonthsRemaining === "number"
      ? Math.min(12, Math.max(1, inputMonthsRemaining))
      : Math.max(1, 12 - monthsElapsed);

  const curMonthly = currentPlan.monthlyPrice;
  const curAnnual = currentPlan.annualPrice;
  const targetAnnual = targetPlan.annualPrice;
  const targetMonthly = targetPlan.monthlyPrice;

  // 1. Remaining current plan amount
  const remainingCurrentAmount = Math.round(monthsRemaining * curMonthly * 100) / 100;

  // 2. Plan difference amount
  const planDifferenceAmount = Math.max(0, targetAnnual - curAnnual);

  // 3. New 12-month commitment total
  const totalNewCommitment = Math.round((remainingCurrentAmount + planDifferenceAmount) * 100) / 100;

  // 4. Per-month amount across the fresh 12-month schedule
  const newMonthlyRate = Math.round((totalNewCommitment / 12) * 100) / 100;

  const monthlySavings = Math.round(Math.max(0, targetMonthly - newMonthlyRate) * 100) / 100;
  const totalSavingsVsFullRetail = Math.round(Math.max(0, targetAnnual - totalNewCommitment) * 100) / 100;

  return {
    currentTier: currentPlan.id,
    targetTier: targetPlan.id,
    monthsElapsed,
    monthsRemaining,
    currentPlanMonthly: curMonthly,
    currentPlanAnnual: curAnnual,
    targetPlanMonthly: targetMonthly,
    targetPlanAnnual: targetAnnual,
    remainingCurrentAmount,
    planDifferenceAmount,
    totalNewCommitment,
    newMonthlyRate,
    standardTargetMonthlyRate: targetMonthly,
    monthlySavings,
    totalSavingsVsFullRetail,
  };
}

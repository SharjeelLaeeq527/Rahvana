"use client";

import React, { useState } from "react";
import { Lock, ArrowRight } from "lucide-react";
import { usePlan, normalizePlanTier } from "@/app/context/PlanContext";
import type { PlanTier } from "@/lib/entitlements/config";
import {
  canUse,
  upgradeCTA,
  lockHint,
  getEffectiveEntitlement,
} from "@/lib/entitlements/helpers";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { Loader } from "@/components/ui/spinner";

interface ResultGateProps {
  /** The entitlement feature key (must exist in ENTITLEMENTS config). */
  feature: string;
  /** The result content to render — blurred when locked. */
  children: React.ReactNode;
  /** Optional override for the lock-card heading. */
  title?: string;
  /** Optional override for the lock-card description. */
  description?: string;
  /**
   * How strongly to blur the content underneath.
   * @default "md"
   */
  blurStrength?: "sm" | "md" | "lg";
  /**
   * Min height of the wrapper so the overlay card has room to breathe.
   * @default "300px"
   */
  minHeight?: string;
  /**
   * Optional custom override to force the gate into a locked/blurred state.
   */
  isLocked?: boolean;
  /**
   * Optional explicit plan tier override (e.g. from Journey plan tier).
   */
  planTier?: PlanTier | string;
}

/**
 * ResultGate — wraps the final result/output of a tool.
 *
 * Behaviour:
 *  - Plan loading  → shows a centered spinner (prevents unlock-flicker)
 *  - User CAN use  → renders children unchanged
 *  - User CANNOT   → renders children blurred + a floating upgrade card on top
 *
 * The upgrade card reuses the same tier-color palette as PageGate and opens
 * the shared UpgradeModal when the user clicks the CTA.
 */
export function ResultGate({
  feature,
  children,
  title,
  description,
  blurStrength = "md",
  minHeight = "300px",
  isLocked,
  planTier,
}: ResultGateProps) {
  const plan = usePlan();
  const [showModal, setShowModal] = useState(false);

  /* ── Loading state ─────────────────────────────────────────────────────── */
  if (plan.isLoading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight }}
      >
        <Loader size="md" text="Verifying access..." />
      </div>
    );
  }

  const effectivePlanTier = planTier ? normalizePlanTier(planTier) : plan.tier;

  // Accessible evaluation:
  // 1. If isLocked is explicitly false -> unlocked
  // 2. If isLocked is explicitly true -> locked
  // 3. Otherwise, check if the effective tier canUse the feature
  const isAccessible = isLocked === false || (isLocked === undefined && canUse(feature, effectivePlanTier, plan.purchasedAddons));

  /* ── Accessible — render normally ───────────────────────────────────────── */
  if (isAccessible && isLocked !== true) return <>{children}</>;

  /* ── Locked — blur children + floating upgrade card ─────────────────────── */
  const blurClass =
    blurStrength === "sm"
      ? "blur-sm"
      : blurStrength === "lg"
        ? "blur-lg"
        : "blur-md";

  const cta = upgradeCTA(feature, effectivePlanTier, plan.purchasedAddons) || "Upgrade to Unlock";
  const hint =
    lockHint(feature, effectivePlanTier, plan.purchasedAddons) || "Upgrade your plan to view your results.";
  const targetTier = getEffectiveEntitlement(feature, effectivePlanTier, plan.purchasedAddons)?.upgradeTarget;

  /* Tier-aware color palette (matches PageGate.tsx) */
  const tierColors =
    targetTier === "executive"
      ? {
          icon: "text-[#9a6f00]",
          bg: "bg-[#fdf6e3] border-[#e8c96a]",
          btn: "bg-[#0c1b33] hover:bg-[#1a2b4a]",
        }
      : targetTier === "premium"
        ? {
            icon: "text-[#5a5a6e]",
            bg: "bg-[#f0f0f0] border-[#c0c0cc]",
            btn: "bg-primary hover:bg-primary/90",
          }
        : {
            icon: "text-[#2d7a7a]",
            bg: "bg-[#e8f4f4] border-[#a8d4d4]",
            btn: "bg-primary hover:bg-primary/90",
          };

  const tierIconClass =
    targetTier === "executive"
      ? "plan-icon--executive"
      : targetTier === "premium"
        ? "plan-icon--premium"
        : targetTier === "basic"
          ? "plan-icon--basic"
          : null;

  return (
    <div className="relative" style={{ minHeight }}>
      {/* UpgradeModal (rendered at root so it can portal above everything) */}
      {showModal && (
        <UpgradeModal
          feature={feature}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Blurred, non-interactive children */}
      <div
        className={`${blurClass} opacity-40 pointer-events-none select-none`}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Floating upgrade card */}
      <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
        <div className="w-full max-w-sm bg-white border border-[#d0e4f7] rounded-[20px] shadow-[0_20px_60px_rgba(12,27,51,0.12)] p-7 text-center animate-in zoom-in-95 duration-400">
          {/* Tier icon badge */}
          <div className="flex justify-center mb-5">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${tierColors.bg}`}
            >
              {tierIconClass ? (
                <span
                  className={`plan-icon ${tierIconClass}`}
                  style={{ width: 40, height: 40 }}
                />
              ) : (
                <Lock
                  size={28}
                  strokeWidth={2}
                  className={tierColors.icon}
                />
              )}
            </div>
          </div>

          {/* "Access Restricted" pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border mb-4 shadow-sm bg-slate-50 text-slate-500 border-slate-200">
            <Lock size={11} strokeWidth={2.5} />
            <span>Results Locked</span>
          </div>

          {/* Title */}
          <h2 className="text-xl font-black text-[#0c1b33] mb-2 leading-tight">
            {title || "Upgrade to View Results"}
          </h2>

          {/* Description */}
          <p className="text-[13px] text-[#6b8097] leading-relaxed mb-3">
            {description ||
              "You've completed all steps, upgrade your plan to unlock your personalised results."}
          </p>

          {/* Hint */}
          <p className="text-[11px] text-[#9aa5b1] mb-5">{hint}</p>

          {/* CTA */}
          <button
            onClick={() => setShowModal(true)}
            className={`w-full py-3 rounded-xl text-[14px] font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 group ${tierColors.btn}`}
          >
            {cta}
            <ArrowRight
              size={15}
              strokeWidth={2.5}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
        </div>
      </div>
    </div>
  );
}

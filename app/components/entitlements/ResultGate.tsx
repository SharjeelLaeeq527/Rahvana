"use client";

import React, { useState } from "react";
import { Lock, ArrowRight, Coins } from "lucide-react";
import { usePlan } from "@/app/context/PlanContext";
import { CreditLaunchModal } from "@/app/components/wallet/CreditLaunchModal";
import { useStandaloneToolUnlock } from "@/lib/wallet/useStandaloneToolUnlock";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { Loader } from "@/components/ui/spinner";
import {
  canUse as canUseForTier,
  lockHint as lockHintForTier,
  upgradeCTA as upgradeCTAForTier,
  getEffectiveEntitlement,
} from "@/lib/entitlements/helpers";
import { normalizePlanTier, type PlanTier } from "@/lib/entitlements/config";

interface ResultGateProps {
  /** The entitlement feature key (must exist in ENTITLEMENTS config). */
  feature: string;
  /** The result content to render — blurred when locked. */
  children: React.ReactNode;
  /** Optional override for the lock-card heading. */
  title?: string;
  /** Optional override for the lock-card description. */
  description?: string;
  /** Optional override for the small value line under the description. */
  hint?: string;
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
   * Explicit plan tier to evaluate entitlement against — e.g. a journey's
   * Executive tier that differs from the account plan. When provided it
   * overrides the account-derived `usePlan().tier`, so journey results unlock
   * correctly. Omit to fall back to the account plan.
   */
  planTier?: PlanTier | string | null;
  /**
   * Wallet catalog id of the tool (e.g. "sponsorship-calculator"). Pass it ONLY
   * in standalone mode. Standalone tools are paid with credits even by plan
   * holders, so the plan tier is ignored: the result opens for a wallet unlock
   * (or `standaloneGranted`), and the lock card offers a credit unlock. Leave it
   * undefined in journey mode so journey results follow the journey plan alone.
   */
  standaloneToolId?: string;
  /**
   * Standalone only: access the caller already verified outside the wallet,
   * e.g. a legacy per-category Interview Prep purchase or a paid photo credit.
   */
  standaloneGranted?: boolean;
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
  hint: hintOverride,
  blurStrength = "md",
  minHeight = "300px",
  isLocked,
  planTier,
  standaloneToolId,
  standaloneGranted = false,
}: ResultGateProps) {
  const plan = usePlan();
  const wallet = useStandaloneToolUnlock(standaloneToolId);
  const [showModal, setShowModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  // Evaluate entitlement against the caller-provided tier (e.g. a journey's
  // Executive tier) when present, otherwise the account-derived plan tier.
  const tier = planTier != null ? normalizePlanTier(planTier) : plan.tier;
  const addons = plan.purchasedAddons;

  // A priced standalone tool ignores the plan: only a wallet unlock (or access
  // the caller verified) opens it. Everything else keeps the plan rule.
  const isStandalone = !!wallet.item;
  const standaloneOpen = wallet.unlocked || standaloneGranted;
  const planAllowed =
    !isStandalone && !plan.isLoading && canUseForTier(feature, tier, addons) && !isLocked;
  const creditItem =
    isStandalone && !standaloneOpen && wallet.item?.launchable ? wallet.item : null;
  const checking = isStandalone
    ? wallet.loading && !standaloneOpen
    : plan.isLoading;

  /* ── Loading state ─────────────────────────────────────────────────────── */
  if (checking) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight }}>
        <Loader size="md" text="Verifying access..." />
      </div>
    );
  }

  /* ── Accessible — render normally ───────────────────────────────────────── */
  if (planAllowed || (isStandalone && standaloneOpen)) return <>{children}</>;

  /* ── Locked — blur children + floating upgrade card ─────────────────────── */
  const blurClass =
    blurStrength === "sm" ? "blur-sm" : blurStrength === "lg" ? "blur-lg" : "blur-md";

  const cta = upgradeCTAForTier(feature, tier, addons) || "Upgrade to Unlock";
  const hint =
    hintOverride ||
    lockHintForTier(feature, tier, addons) ||
    "Upgrade your plan to view your results.";
  const ent = getEffectiveEntitlement(feature, tier, addons);
  const targetTier = ent?.upgradeTarget;
  // Only mention a one-time add-on when the feature actually has one.
  const canBuyAddon = (ent?.state === "locked_buy" || ent?.state === "limited") && !!ent?.addon;

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
      {showModal && <UpgradeModal feature={feature} onClose={() => setShowModal(false)} />}
      {showCreditModal && creditItem && (
        <CreditLaunchModal
          item={creditItem}
          onClose={() => setShowCreditModal(false)}
          onLaunched={() => setShowCreditModal(false)}
        />
      )}

      {/* Blurred, non-interactive children */}
      <div className={`${blurClass} pointer-events-none opacity-40 select-none`} aria-hidden="true">
        {children}
      </div>

      {/* Floating upgrade card */}
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
        <div className="animate-in zoom-in-95 w-full max-w-sm rounded-[20px] border border-[#d0e4f7] bg-white p-7 text-center shadow-[0_20px_60px_rgba(12,27,51,0.12)] duration-400">
          {/* Tier icon badge */}
          <div className="mb-5 flex justify-center">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${tierColors.bg}`}
            >
              {tierIconClass ? (
                <span className={`plan-icon ${tierIconClass}`} style={{ width: 40, height: 40 }} />
              ) : (
                <Lock size={28} strokeWidth={2} className={tierColors.icon} />
              )}
            </div>
          </div>

          {/* "Results ready" pill — reward framing, not punishment */}
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold tracking-widest text-slate-500 uppercase shadow-sm">
            <Lock size={11} strokeWidth={2.5} />
            <span>Results Ready</span>
          </div>

          {/* Title */}
          <h2 className="mb-2 text-xl leading-tight font-black text-[#0c1b33]">
            {title || "Unlock Your Results with a Plan Upgrade"}
          </h2>

          {/* Description */}
          <p className="mb-3 text-[13px] leading-relaxed text-[#6b8097]">
            {creditItem
              ? `Unlock ${creditItem.name} for ${creditItem.credits} credits and use it as often as you like.`
              : description ||
                "You've completed every step. Your personalised results are waiting. Upgrading your plan unlocks them instantly, plus every tool behind them."}
          </p>

          {/* Hint */}
          {!creditItem && <p className="mb-5 text-[11px] text-[#9aa5b1]">{hint}</p>}

          {/* CTA */}
          {creditItem ? (
            <>
              <button
                onClick={() => setShowCreditModal(true)}
                className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d7377] py-3 text-[14px] font-bold text-white shadow-md transition-colors hover:bg-[#0a5c5f]"
              >
                <Coins size={15} strokeWidth={2.5} />
                {`Unlock for ${creditItem.credits} credits`}
              </button>
              <p className="mt-3 text-[11px] text-[#9aa5b1]">
                Tools inside your journey use your journey plan instead.
              </p>
            </>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className={`group flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white shadow-md transition-all ${tierColors.btn}`}
            >
              {cta}
              <ArrowRight
                size={15}
                strokeWidth={2.5}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          )}

          {canBuyAddon && !creditItem && (
            <p className="mt-3 text-[11px] text-[#9aa5b1]">
              Just need this result? A one-time add-on is also available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

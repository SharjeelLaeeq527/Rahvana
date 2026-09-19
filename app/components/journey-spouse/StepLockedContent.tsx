"use client";

import React, { useState } from "react";
import { Lock, ArrowRight } from "lucide-react";
import { JourneyPlanState, useJourneyPlan } from "@/app/context/useJourneyPlan";
import { STEP_PRIMARY_FEATURE } from "@/lib/entitlements/stepFeatureMap";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { Loader } from "@/components/ui/spinner";

type TierKey = "basic" | "premium" | "executive";

// Colors aligned with UpgradeModal & StepEntitlementBanner:
// basic     → slate-teal icon   → teal-mint tones
// premium   → silver/chrome icon → periwinkle-grey / silver tones
// executive → gold icon          → amber-cream tones
const TIER_THEME: Record<
  TierKey,
  {
    bg: string;
    border: string;
    circleBg: string;
    circleBorder: string;
    iconColor: string;
    ctaBtn: string;
    ctaBtnHover: string;
    ctaText: string;
    ctaTextHover: string;
    titleColor: string;
    overlayBorder: string;
  }
> = {
  basic: {
    bg: "bg-[#e4f4f2]",
    border: "border-[#98d0ca]",
    circleBg: "bg-[#b8e4de]",
    circleBorder: "border-[#78c8c0]",
    iconColor: "text-[#1e8880]",
    ctaBtn: "bg-[#4aada4]",
    ctaBtnHover: "hover:bg-[#3a9d94]",
    ctaText: "text-[#1e8880]",
    ctaTextHover: "hover:text-[#0e6860]",
    titleColor: "text-[#072c2a]",
    overlayBorder: "border-[#98d0ca]",
  },
  premium: {
    bg: "bg-[#eeeeF8]",
    border: "border-[#c0c0dc]",
    circleBg: "bg-[#dcdcf0]",
    circleBorder: "border-[#a8a8cc]",
    iconColor: "text-[#585878]",
    ctaBtn: "bg-[#8888a8]",
    ctaBtnHover: "hover:bg-[#787898]",
    ctaText: "text-[#585878]",
    ctaTextHover: "hover:text-[#383858]",
    titleColor: "text-[#181830]",
    overlayBorder: "border-[#c0c0dc]",
  },
  executive: {
    bg: "bg-[#fdf4d8]",
    border: "border-[#e4cc88]",
    circleBg: "bg-[#f0e0a0]",
    circleBorder: "border-[#d0b060]",
    iconColor: "text-[#8a6810]",
    ctaBtn: "bg-[#b89030]",
    ctaBtnHover: "hover:bg-[#a88020]",
    ctaText: "text-[#8a6810]",
    ctaTextHover: "hover:text-[#6a4800]",
    titleColor: "text-[#3a2800]",
    overlayBorder: "border-[#e4cc88]",
  },
};

interface StepLockedContentProps {
  /**
   * The step_key from the roadmap (e.g., "step_1_6").
   * Feature gating is resolved via STEP_PRIMARY_FEATURE.
   */
  stepKey: string;
  /**
   * The content to render when the user has access.
   */
  children: React.ReactNode;
  /**
   * Display mode when locked:
   * - "overlay"  — blurred preview with lock badge on top (default)
   * - "replace"  — replaces content with a compact locked card
   * - "hide"     — renders nothing
   */
  mode?: "overlay" | "replace" | "hide";
  /**
   * Optional override for the lock message.
   */
  lockMessage?: string;
  className?: string;
  state: JourneyPlanState;
}

export function StepLockedContent({
  stepKey,
  children,
  mode = "overlay",
  lockMessage,
  className,
  state,
}: StepLockedContentProps) {
  const plan = useJourneyPlan(state);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const featureKey = STEP_PRIMARY_FEATURE[stepKey] ?? null;

  // If plan is loading, show a small loader to prevent flickers of locked state
  if (plan.isLoading) {
    if (mode === "hide") return null;
    return (
      <div className={`flex items-center justify-center p-6 ${className ?? ""}`}>
        <Loader size="sm" />
      </div>
    );
  }

  // No gating or user has access → render children directly
  if (!featureKey || plan.canUse(featureKey)) {
    return <>{children}</>;
  }

  const hint = lockMessage || plan.lockHint(featureKey);
  const cta = plan.upgradeCTA(featureKey);
  const targetTier = plan.entitlement(featureKey)?.upgradeTarget as TierKey | null;
  const tierIconClass = targetTier ? `plan-icon--${targetTier}` : null;
  const theme = targetTier ? TIER_THEME[targetTier] : TIER_THEME.premium;

  // ── Hidden mode ───────────────────────────────────────────────────────────
  if (mode === "hide") return null;

  // ── Replace mode — compact locked card ────────────────────────────────────
  if (mode === "replace") {
    return (
      <>
        {showUpgrade && <UpgradeModal feature={featureKey} onClose={() => setShowUpgrade(false)} />}
        <div
          className={`
            rounded-2xl border-[1.5px] border-dashed
            ${theme.border} ${theme.bg}
            px-5 py-4 flex items-center gap-4
            ${className ?? ""}
          `}
        >
          {/* Circular icon */}
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center shrink-0 border
              ${theme.circleBg} ${theme.circleBorder}
            `}
          >
            {tierIconClass ? (
              <span
                className={`plan-icon ${tierIconClass}`}
                style={{ width: 22, height: 22 }}
                aria-hidden="true"
              />
            ) : (
              <Lock size={16} className={theme.iconColor} strokeWidth={2.2} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className={`text-[13px] font-semibold mb-0.5 truncate ${theme.titleColor}`}>
              {hint || "Upgrade to unlock"}
            </p>
            {cta && (
              <button
                onClick={() => setShowUpgrade(true)}
                className={`
                  text-[12px] font-bold transition-colors
                  inline-flex items-center gap-1 group mt-0.5
                  ${theme.ctaText} ${theme.ctaTextHover}
                `}
              >
                {cta}
                <ArrowRight
                  size={11}
                  strokeWidth={2.5}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Overlay mode (default) — blurred children with lock overlay ───────────
  return (
    <>
      {showUpgrade && <UpgradeModal feature={featureKey} onClose={() => setShowUpgrade(false)} />}
      <div className={`relative ${className ?? ""}`}>
        {/* Blurred / dimmed children */}
        <div className="pointer-events-none select-none opacity-55">{children}</div>

        {/* Lock overlay card */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl">
          <div
            className={`
              bg-white/95 backdrop-blur-sm rounded-2xl
              border ${theme.overlayBorder}
              px-6 py-4 flex flex-col items-center gap-2.5
              shadow-[0_8px_30px_rgba(12,27,51,0.08)]
              max-w-[260px] text-center
            `}
          >
            {/* Circular icon */}
            <div
              className={`
                w-11 h-11 rounded-full flex items-center justify-center border
                ${theme.circleBg} ${theme.circleBorder}
              `}
            >
              {tierIconClass ? (
                <span
                  className={`plan-icon ${tierIconClass}`}
                  style={{ width: 24, height: 24 }}
                  aria-hidden="true"
                />
              ) : (
                <Lock size={18} className={theme.iconColor} strokeWidth={2.2} />
              )}
            </div>

            <p className={`text-[12.5px] font-semibold leading-snug ${theme.titleColor}`}>
              {hint || "Upgrade to unlock"}
            </p>

            {cta && (
              <button
                onClick={() => setShowUpgrade(true)}
                className={`
                  text-[12px] font-bold text-white rounded-full
                  px-4 py-1.5 mt-0.5 transition-colors
                  ${theme.ctaBtn} ${theme.ctaBtnHover}
                `}
              >
                {cta}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

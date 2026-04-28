"use client";

import React, { useState } from "react";
import { Lock, Crown, Zap, ArrowRight } from "lucide-react";
import { usePlan } from "@/app/context/PlanContext";
import { STEP_PRIMARY_FEATURE } from "@/lib/entitlements/stepFeatureMap";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";

// ── Theme per lock-icon type ────────────────────────────────────────────────
const ICON_THEME = {
  lock:   { bg: "bg-[#f4f7fb]",   border: "border-[#c8d9ee]",  icon: "text-[#2f6fd4]", badge: "bg-[#e8f1fb] text-[#2f6fd4]"  },
  zap:    { bg: "bg-[#fef8e8]",   border: "border-[#f0d98a]",  icon: "text-[#b38600]", badge: "bg-[#fffbec] text-[#b38600]"  },
  crown:  { bg: "bg-[#fdf6ec]",   border: "border-[#f0c878]",  icon: "text-[#a06000]", badge: "bg-[#fef3d8] text-[#a06000]"  },
} as const;

// Feature → icon mapping (consistent with StepEntitlementBanner)
const FEATURE_ICON: Record<string, keyof typeof ICON_THEME> = {
  step_guides:       "lock",
  tracker_reminders: "zap",
  document_vault:    "lock",
  smart_form_filler: "zap",
  sponsorship_calc:  "zap",
  photo_booth:       "lock",
  medical_booking:   "lock",
  polio_certificate: "crown",
  action_221g:       "crown",
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
}

/**
 * Journey-specific wrapper that gates content based on the step's
 * primary feature in stepFeatureMap.ts.
 *
 * Usage:
 *   <StepLockedContent stepKey="step_1_6">
 *     <button onClick={() => setIsTutorialOpen(true)}>Read Guide</button>
 *   </StepLockedContent>
 */
export function StepLockedContent({
  stepKey,
  children,
  mode = "overlay",
  lockMessage,
  className,
}: StepLockedContentProps) {
  const plan = usePlan();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const featureKey = STEP_PRIMARY_FEATURE[stepKey] ?? null;

  // No gating or user has access → render children directly
  if (!featureKey || plan.canUse(featureKey)) {
    return <>{children}</>;
  }

  const hint = lockMessage || plan.lockHint(featureKey);
  const cta = plan.upgradeCTA(featureKey);
  const iconType = FEATURE_ICON[featureKey] ?? "lock";
  const theme = ICON_THEME[iconType];

  const IconEl =
    iconType === "crown" ? Crown :
    iconType === "zap"   ? Zap   :
    Lock;

  // ── Hidden mode ───────────────────────────────────────────────────────────
  if (mode === "hide") return null;

  // ── Replace mode — compact locked card ────────────────────────────────────
  if (mode === "replace") {
    return (
      <>
        {showUpgrade && (
          <UpgradeModal feature={featureKey} onClose={() => setShowUpgrade(false)} />
        )}
        <div
          className={`rounded-[14px] border-[1.5px] border-dashed ${theme.border} ${theme.bg} px-5 py-4 flex items-center gap-4 ${className ?? ""}`}
        >
          <div className={`w-9 h-9 rounded-full ${theme.bg} flex items-center justify-center shrink-0 border ${theme.border}`}>
            <IconEl size={16} className={theme.icon} strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#0c1b33] mb-0.5 truncate">
              {hint || "Upgrade to unlock"}
            </p>
            {cta && (
              <button
                onClick={() => setShowUpgrade(true)}
                className="text-[12px] font-bold text-[#2f6fd4] hover:text-[#1a4fa0] transition-colors inline-flex items-center gap-1 group mt-0.5"
              >
                {cta}
                <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Overlay mode (default) — blurred children with lock overlay ────────────
  return (
    <>
      {showUpgrade && (
        <UpgradeModal feature={featureKey} onClose={() => setShowUpgrade(false)} />
      )}
      <div className={`relative ${className ?? ""}`}>
        {/* Blurred / dimmed children */}
        <div className="pointer-events-none select-none opacity-25 blur-[2px]">
          {children}
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[14px]">
          <div className="bg-white/95 backdrop-blur-sm border border-[#d0e4f7] rounded-2xl px-6 py-4 flex flex-col items-center gap-2 shadow-[0_8px_30px_rgba(12,27,51,0.08)] max-w-[260px] text-center">
            <div className={`w-10 h-10 rounded-full ${theme.bg} border ${theme.border} flex items-center justify-center`}>
              <IconEl size={18} className={theme.icon} strokeWidth={2.2} />
            </div>
            <p className="text-[12.5px] font-semibold text-[#0c1b33] leading-snug">
              {hint || "Upgrade to unlock"}
            </p>
            {cta && (
              <button
                onClick={() => setShowUpgrade(true)}
                className="text-[12px] font-bold text-white bg-[#2f6fd4] hover:bg-[#1a4fa0] transition-colors rounded-full px-4 py-1.5 mt-0.5"
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

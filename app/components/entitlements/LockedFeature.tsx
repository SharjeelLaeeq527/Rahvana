"use client";

import React from "react";
import { Lock, Sparkles } from "lucide-react";
import { usePlan } from "@/app/context/PlanContext";

interface LockedFeatureProps {
  /** The feature key from ENTITLEMENTS config. */
  feature: string;
  /** Content to render when user has access. */
  children: React.ReactNode;
  /**
   * What to show when locked.
   * - "overlay"  (default) — renders children dimmed with a lock badge on top
   * - "replace"  — replaces children entirely with a compact locked card
   * - "hide"     — renders nothing (for features that should be invisible when locked)
   */
  mode?: "overlay" | "replace" | "hide";
  /** Called when the user clicks the upgrade CTA. */
  onUpgradeClick?: () => void;
  className?: string;
}

export function LockedFeature({
  feature,
  children,
  mode = "overlay",
  onUpgradeClick,
  className,
}: LockedFeatureProps) {
  const plan = usePlan();

  // Fully accessible — render normally
  if (plan.canUse(feature)) return <>{children}</>;

  // Hidden entirely
  if (plan.isHidden(feature) || mode === "hide") return null;

  const hint = plan.lockHint(feature);
  const cta = plan.upgradeCTA(feature);

  if (mode === "replace") {
    return (
      <div
        className={`rounded-xl border border-dashed border-[#c9b8d8] bg-[#faf8fd] px-4 py-3 flex items-center gap-3 ${className ?? ""}`}
      >
        <div className="w-7 h-7 rounded-full bg-[#ede8f5] flex items-center justify-center shrink-0">
          <Lock size={14} className="text-[#7c5e8a]" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-semibold text-[#4a3b5c] truncate">{hint || "Upgrade to unlock"}</p>
        </div>
        {cta && onUpgradeClick && (
          <button
            onClick={onUpgradeClick}
            className="shrink-0 text-[11.5px] font-bold text-[#7c5e8a] hover:text-[#5a3f70] transition-colors"
          >
            {cta} →
          </button>
        )}
      </div>
    );
  }

  // overlay mode (default)
  return (
    <div className={`relative ${className ?? ""}`}>
      <div className="pointer-events-none select-none opacity-30 blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl">
        <div className="bg-white/90 backdrop-blur-sm border border-[#c9b8d8] rounded-2xl px-5 py-3 flex flex-col items-center gap-1.5 shadow-lg max-w-[220px] text-center">
          <div className="w-8 h-8 rounded-full bg-[#ede8f5] flex items-center justify-center">
            <Lock size={15} className="text-[#7c5e8a]" strokeWidth={2.5} />
          </div>
          <p className="text-[11.5px] font-semibold text-[#4a3b5c] leading-snug">
            {hint || "Upgrade to unlock"}
          </p>
          {cta && onUpgradeClick && (
            <button
              onClick={onUpgradeClick}
              className="text-[11px] font-bold text-white bg-[#7c5e8a] hover:bg-[#5a3f70] transition-colors rounded-full px-3 py-1"
            >
              {cta}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Inline lock badge — a small pill indicating a feature is locked. */
export function LockBadge({
  feature,
  onClick,
  className,
}: {
  feature: string;
  onClick?: () => void;
  className?: string;
}) {
  const plan = usePlan();
  if (!plan.isLocked(feature) && plan.canUse(feature)) return null;

  const cta = plan.upgradeCTA(feature);

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#ede8f5] text-[#7c5e8a] border border-[#c9b8d8] hover:bg-[#ddd0ea] transition-colors ${className ?? ""}`}
    >
      <Lock size={10} strokeWidth={2.5} />
      {cta ?? "Upgrade"}
    </button>
  );
}

/** Small "preview" chip for free-tier teaser content. */
export function PreviewChip({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200 ${className ?? ""}`}
    >
      <Sparkles size={10} strokeWidth={2.5} />
      Preview
    </span>
  );
}
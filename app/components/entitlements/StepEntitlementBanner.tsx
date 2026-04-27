"use client";

import React, { useState } from "react";
import { Lock, Crown, Zap, ShieldCheck, ArrowRight, X } from "lucide-react";
import { usePlan } from "@/app/context/PlanContext";
import { UpgradeModal } from "./UpgradeModal";
import { STEP_PRIMARY_FEATURE } from "@/lib/entitlements/stepFeatureMap";

// ── Human-readable labels per feature key ────────────────────────────────────
const FEATURE_LABELS: Record<string, { title: string; what: string; icon: "lock" | "crown" | "zap" | "shield" }> = {
  step_guides: {
    title: "Step-by-Step Guides Locked",
    what: "Guides, document upload buttons, and the document vault are not included in your current plan. You can still view the checklist and save manual entries.",
    icon: "lock",
  },
  tracker_reminders: {
    title: "Tracking & Reminders Locked",
    what: "You can save data manually in this step, but automated tracking, reminders, and case-status monitoring require a higher plan.",
    icon: "zap",
  },
  document_vault: {
    title: "Document Vault Upload Locked",
    what: "Manual data entry is available. Uploading documents, auto-extracting info, and storing files in the vault require Premium or higher.",
    icon: "lock",
  },
  smart_form_filler: {
    title: "Smart Form Filler Locked",
    what: "The Smart Form Filler is not included in your current plan. You can still download the blank form PDF and fill it manually.",
    icon: "zap",
  },
  sponsorship_calc: {
    title: "Sponsorship Calculator Locked",
    what: "The Sponsorship Calculator and financial document guides require a higher plan or a one-time add-on purchase.",
    icon: "zap",
  },
  photo_booth: {
    title: "Photo Booth Locked",
    what: "The Photo Booth tool for taking compliant passport photos is not included in your current plan. You can purchase credits as an add-on.",
    icon: "lock",
  },
  medical_booking: {
    title: "Medical Appointment Booking Locked",
    what: "Rahvana's medical booking service and the full scheduling guide require Premium or higher. You can still save your appointment details manually.",
    icon: "shield",
  },
  polio_certificate: {
    title: "Polio Certificate Guide — Executive Only",
    what: "The step-by-step Polio Certificate guide and Rahvana-assisted submission are only available on the Executive plan.",
    icon: "crown",
  },
  action_221g: {
    title: "221(g) Action Planner — Executive Only",
    what: "The 221(g) Action Planner, follow-up step guidance, and post-interview tracking are exclusively available on the Executive plan.",
    icon: "crown",
  },
};

// ── Tier color themes ─────────────────────────────────────────────────────────
const TIER_THEME = {
  lock:   { bg: "bg-[#f4f7fb]",   border: "border-[#c8d9ee]",  icon: "text-[#2f6fd4]", badge: "bg-[#e8f1fb] text-[#2f6fd4]"  },
  zap:    { bg: "bg-[#fef8e8]",   border: "border-[#f0d98a]",  icon: "text-[#b38600]", badge: "bg-[#fffbec] text-[#b38600]"  },
  crown:  { bg: "bg-[#fdf6ec]",   border: "border-[#f0c878]",  icon: "text-[#a06000]", badge: "bg-[#fef3d8] text-[#a06000]"  },
  shield: { bg: "bg-[#f0fdf4]",   border: "border-[#a8d9be]",  icon: "text-[#15744f]", badge: "bg-[#e8f5ef] text-[#15744f]"  },
};

interface StepEntitlementBannerProps {
  stepKey: string;
  /** Collapsed by default — show full banner on open */
  defaultOpen?: boolean;
}

export function StepEntitlementBanner({
  stepKey,
  defaultOpen = true,
}: StepEntitlementBannerProps) {
  const plan = usePlan();
  const [dismissed, setDismissed] = useState(false);
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);

  // Look up the primary feature for this step
  const featureKey = STEP_PRIMARY_FEATURE[stepKey];

  // Nothing to show if step has no gating or feature is accessible
  if (!featureKey || dismissed) return null;
  if (plan.canUse(featureKey)) return null;

  const meta = FEATURE_LABELS[featureKey] ?? {
    title: "Feature Locked",
    what: "This feature is not included in your current plan.",
    icon: "lock" as const,
  };

  const theme = TIER_THEME[meta.icon];
  const cta = plan.upgradeCTA(featureKey);
  const hint = plan.lockHint(featureKey);

  const IconEl =
    meta.icon === "crown"  ? Crown :
    meta.icon === "zap"    ? Zap :
    meta.icon === "shield" ? ShieldCheck :
    Lock;

  return (
    <>
      {upgradeModalFeature && (
        <UpgradeModal
          feature={upgradeModalFeature}
          onClose={() => setUpgradeModalFeature(null)}
        />
      )}

      <div
        className={`
          relative flex items-start gap-3 rounded-[14px] border px-4 py-3 mb-6
          animate-in fade-in slide-in-from-top-2 duration-300
          ${theme.bg} ${theme.border}
        `}
        role="status"
      >
        {/* Icon */}
        <div className={`mt-0.5 shrink-0 ${theme.icon}`}>
          <IconEl size={16} strokeWidth={2.2} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-[12.5px] font-bold text-[#0c1b33]">
              {meta.title}
            </span>
            {hint && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.badge}`}>
                {hint}
              </span>
            )}
          </div>
          <p className="text-[12px] text-[#4a5568] leading-[1.6]">
            {meta.what}
          </p>
          {cta && (
            <button
              onClick={() => setUpgradeModalFeature(featureKey)}
              className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-bold text-[#2f6fd4] hover:text-[#1a4fa0] transition-colors group"
            >
              {cta}
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 mt-0.5 text-[#9aa5b1] hover:text-[#4a5568] transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </>
  );
}

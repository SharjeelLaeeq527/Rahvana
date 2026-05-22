"use client";

import React, { useState } from "react";
import { Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { usePlan } from "@/app/context/PlanContext";
import { UpgradeModal } from "./UpgradeModal";
import { STEP_PRIMARY_FEATURE } from "@/lib/entitlements/stepFeatureMap";

// ── Human-readable labels per feature key ────────────────────────────────────
const FEATURE_LABELS: Record<
  string,
  { title: string; what: string; icon: "lock" | "crown" | "zap" | "shield" }
> = {
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

// ── Per-tier visual theme — aligned with UpgradeModal palette ─────────────────
// basic:     slate-teal icon  → teal-mint tones
// premium:   silver icon      → periwinkle-grey tones
// executive: gold icon        → amber-cream tones
// fallback:  lock             → cool slate-blue tones
const TIER_THEME: Record<
  string,
  {
    banner: string; // banner background
    border: string; // banner border
    iconCircle: string; // circular icon wrapper bg
    iconCircleBorder: string;
    iconColor: string; // icon / plan-icon tint
    badge: string; // hint pill classes
    ctaColor: string; // CTA link color
    ctaHover: string;
    titleColor: string;
    descColor: string;
  }
> = {
  basic: {
    banner: "bg-[#e4f4f2]",
    border: "border-[#98d0ca]",
    iconCircle: "bg-[#b8e4de]",
    iconCircleBorder: "border-[#78c8c0]",
    iconColor: "text-[#1e8880]",
    badge: "bg-[#b8e4de] text-[#0f4040] border-[#78c8c0]",
    ctaColor: "text-[#1e8880]",
    ctaHover: "hover:text-[#0e6860]",
    titleColor: "text-[#072c2a]",
    descColor: "text-[#2d6a64]",
  },
  premium: {
    banner: "bg-[#eeeeF8]",
    border: "border-[#c0c0dc]",
    iconCircle: "bg-[#dcdcf0]",
    iconCircleBorder: "border-[#a8a8cc]",
    iconColor: "text-[#585878]",
    badge: "bg-[#dcdcf0] text-[#282848] border-[#a8a8cc]",
    ctaColor: "text-[#585878]",
    ctaHover: "hover:text-[#383858]",
    titleColor: "text-[#181830]",
    descColor: "text-[#484868]",
  },
  executive: {
    banner: "bg-[#fdf4d8]",
    border: "border-[#e4cc88]",
    iconCircle: "bg-[#f0e0a0]",
    iconCircleBorder: "border-[#d0b060]",
    iconColor: "text-[#8a6810]",
    badge: "bg-[#f0e0a0] text-[#5a3808] border-[#d0b060]",
    ctaColor: "text-[#8a6810]",
    ctaHover: "hover:text-[#6a4800]",
    titleColor: "text-[#3a2800]",
    descColor: "text-[#7a5818]",
  },
  // Default / lock fallback
  lock: {
    banner: "bg-[#f0f4f8]",
    border: "border-[#c0d0e0]",
    iconCircle: "bg-[#dce8f4]",
    iconCircleBorder: "border-[#a8c0d8]",
    iconColor: "text-[#5a7a96]",
    badge: "bg-[#dce8f4] text-[#2a4a64] border-[#a8c0d8]",
    ctaColor: "text-[#5a7a96]",
    ctaHover: "hover:text-[#3a5a76]",
    titleColor: "text-[#0c1b2e]",
    descColor: "text-[#4a6070]",
  },
};

interface StepEntitlementBannerProps {
  stepKey: string;
  defaultOpen?: boolean;
}

export function StepEntitlementBanner({ stepKey, defaultOpen = true }: StepEntitlementBannerProps) {
  const plan = usePlan();
  const [dismissed, setDismissed] = useState(false);
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);

  const featureKey = STEP_PRIMARY_FEATURE[stepKey];

  if (!featureKey || dismissed) return null;
  if (plan.canUse(featureKey)) return null;

  const meta = FEATURE_LABELS[featureKey] ?? {
    title: "Feature Locked",
    what: "This feature is not included in your current plan.",
    icon: "lock" as const,
  };

  const cta = plan.upgradeCTA(featureKey);
  const hint = plan.lockHint(featureKey);
  const targetTier = plan.entitlement(featureKey)?.upgradeTarget;

  // Pick theme — fall back to "lock"
  const theme = TIER_THEME[targetTier as keyof typeof TIER_THEME] ?? TIER_THEME.lock;

  const tierIconClass =
    targetTier === "executive"
      ? "plan-icon--executive"
      : targetTier === "premium"
        ? "plan-icon--premium"
        : targetTier === "basic"
          ? "plan-icon--basic"
          : null;

  const IconEl = meta.icon === "shield" ? ShieldCheck : Lock;

  return (
    <>
      {upgradeModalFeature && (
        <UpgradeModal feature={upgradeModalFeature} onClose={() => setUpgradeModalFeature(null)} />
      )}

      <div
        className={`
          relative flex items-start gap-3.5 rounded-2xl border px-4 py-3.5 mb-6
          animate-in fade-in slide-in-from-top-2 duration-300
          ${theme.banner} ${theme.border}
        `}
        role="status"
      >
        {/* Circular icon wrapper */}
        <div
          className={`
            shrink-0 mt-0.5
            w-9 h-9 rounded-full border flex items-center justify-center
            ${theme.iconCircle} ${theme.iconCircleBorder}
          `}
        >
          {tierIconClass ? (
            <span className={`plan-icon ${tierIconClass}`} style={{ width: 22, height: 22 }} />
          ) : (
            <IconEl size={15} strokeWidth={2.3} className={theme.iconColor} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[12.5px] font-bold leading-snug ${theme.titleColor}`}>
              {meta.title}
            </span>
            {hint && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.badge}`}
              >
                {hint}
              </span>
            )}
          </div>

          {/* Description */}
          <p className={`text-[12px] leading-[1.65] ${theme.descColor}`}>{meta.what}</p>

          {/* CTA */}
          {cta && (
            <button
              onClick={() => setUpgradeModalFeature(featureKey)}
              className={`
                mt-2 inline-flex items-center gap-1
                text-[11.5px] font-bold transition-colors group
                ${theme.ctaColor} ${theme.ctaHover}
              `}
            >
              {cta}
              <ArrowRight
                size={12}
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

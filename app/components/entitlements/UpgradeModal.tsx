"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { X, Check, Zap, ShoppingCart, Loader2, BookOpen, Mic } from "lucide-react";
import { usePlan } from "@/app/context/PlanContext";
import { useAuth } from "@/app/context/AuthContext";
import { useCandidate } from "@/app/context/CandidateContext";
import { getDetailsHref } from "@/lib/entitlements/resourceLinks";
import {
  getEntitlement,
  TIER_NAMES,
  TIER_PRICES,
  TIER_ORDER,
  ENTITLEMENTS,
  PlanTier,
} from "@/lib/entitlements/config";
import { useToast } from "@/app/components/shared/ToastProvider";

interface UpgradeModalProps {
  feature: string;
  onClose: () => void;
  onConfirm?: (action: "upgrade" | "addon", target?: PlanTier | string) => void;
  /** When set, shows interview-prep-specific feature breakdown before the general tier list */
  interviewMode?: "prep" | "rapid" | "mock";
}

const INTERVIEW_MODE_FEATURES: Record<
  "prep" | "rapid" | "mock",
  { label: string; icon: typeof BookOpen; color: string; features: string[] }
> = {
  prep: {
    label: "Prep Mode",
    icon: BookOpen,
    color: "#0d7377",
    features: [
      "Full Interview Question Bank",
      "Prep Mode (full access)",
      "AI Answer Builder (core feature)",
      "Improve clarity & structure",
      "Make answers interview-ready",
      "Save & edit answers anytime",
    ],
  },
  rapid: {
    label: "Rapid Fire",
    icon: Zap,
    color: "#6b5b7b",
    features: [
      "Rapid Fire Mode",
      "Timed questions (pressure simulation)",
      "Fast recall training",
      "Adaptive practice flow",
      "Smart summaries after sessions",
      "Performance review insights",
      "Confidence-building repetition",
    ],
  },
  mock: {
    label: "Mock Interview",
    icon: Mic,
    color: "#9e4a5a",
    features: [
      "Mock Interview Mode (full simulation)",
      "Voice-based interview experience",
      "Speech-to-Text (STT)",
      "Text-to-Speech (TTS)",
      "Real-time interview flow (no UI hints)",
      "Performance analytics",
      "Interview behavior feedback",
    ],
  },
};

const TIER_HIGHLIGHTS: Record<PlanTier, string[]> = {
  free: [],
  basic: [
    "Full roadmap, all steps & chapters visible",
    "Checklist engine for your case",
    "Portal wallet (save credentials securely)",
    // "Visa bulletin monitor",
    "PDF toolkit, DQ status check",
    "Basic interview prep",
  ],
  premium: [
    "Everything in Basic",
    "Step-by-step guides in every step",
    "Document vault, upload & auto-extract",
    "Tracker & reminders (DQ, interview, case status)",
    "Smart Form Filler (I-130 / I-130A)",
    "Case Strength Analyzer",
    "Sponsorship Calculator",
    "Rapid Fire interview prep",
    "Medical appointment booking via Rahvana",
    "Civil document guides",
  ],
  executive: [
    "Everything in Premium",
    "221(g) Action Planner",
    "Mock interview sessions",
    // "Expert case review, 2 sessions included",
    "Expert consultation calls, 2 sessions included",
    "PCC filing assistance (Sindh only)",
    "Document translation, unlimited",
  ],
};

// Complementary pastel palettes matched to each icon's actual color:
// Free      → dark teal outline icon   → pale seafoam header, deep teal text
// Basic     → muted slate-teal icon    → soft teal-mint header, deep teal text
// Premium   → silver/chrome icon       → soft periwinkle-grey header, slate text
// Executive → warm gold icon           → soft amber-cream header, deep amber text
const TIER_STYLE: Record<
  PlanTier,
  {
    header: string;
    button: string;
    buttonHover: string;
    pillActiveBg: string;
    pillActiveText: string;
    pillActiveRing: string;
    check: string;
    featureBg: string;
    featureRing: string;
    featureText: string;
    priceText: string;
    iconClass: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    headerLabel: string;
    headerTitle: string;
    headerPrice: string;
    headerSub: string;
  }
> = {
  free: {
    header: "from-[#d0ece8] to-[#a8d8d0]",
    button: "from-[#6aada4] to-[#3d8e86]",
    buttonHover: "hover:from-[#5a9d94] hover:to-[#2d7e76]",
    pillActiveBg: "#cce8e4",
    pillActiveText: "#1e5e58",
    pillActiveRing: "#8eccc6",
    check: "text-[#3d8e86]",
    featureBg: "bg-[#eaf6f4]",
    featureRing: "ring-[#aad8d2]",
    featureText: "text-[#1e5e58]",
    priceText: "text-[#1e5e58]",
    iconClass: "plan-icon--free",
    badgeBg: "bg-[#eaf6f4]",
    badgeBorder: "border-[#aad8d2]",
    badgeText: "text-[#1e5e58]",
    headerLabel: "text-[#2d706a]/55",
    headerTitle: "text-[#0f3a36]",
    headerPrice: "text-[#0f3a36]",
    headerSub: "text-[#2d706a]/45",
  },
  basic: {
    header: "from-[#b8dcd8] to-[#8ac4bc]",
    button: "from-[#4aada4] to-[#1e8880]",
    buttonHover: "hover:from-[#3a9d94] hover:to-[#0e7870]",
    pillActiveBg: "#b8e4de",
    pillActiveText: "#0f4040",
    pillActiveRing: "#78c8c0",
    check: "text-[#1e8880]",
    featureBg: "bg-[#e4f4f2]",
    featureRing: "ring-[#98d0ca]",
    featureText: "text-[#0f4040]",
    priceText: "text-[#0f4040]",
    iconClass: "plan-icon--basic",
    badgeBg: "bg-[#e4f4f2]",
    badgeBorder: "border-[#98d0ca]",
    badgeText: "text-[#0f4040]",
    headerLabel: "text-[#186058]/55",
    headerTitle: "text-[#072c2a]",
    headerPrice: "text-[#072c2a]",
    headerSub: "text-[#186058]/45",
  },
  premium: {
    header: "from-[#e5e8ff] to-[#aeb9ff]",
    button: "from-[#8a97ff] to-[#5d6fe8]",
    buttonHover: "hover:from-[#7a88f7] hover:to-[#4f62d8]",
    pillActiveBg: "#e6e9ff",
    pillActiveText: "#24327f",
    pillActiveRing: "#b8c0ff",
    check: "text-[#5d6fe8]",
    featureBg: "bg-[#f2f4ff]",
    featureRing: "ring-[#d8ddff]",
    featureText: "text-[#24327f]",
    priceText: "text-[#24327f]",
    iconClass: "plan-icon--premium",
    badgeBg: "bg-[#f2f4ff]",
    badgeBorder: "border-[#d8ddff]",
    badgeText: "text-[#24327f]",
    headerLabel: "text-[#4152a4]/55",
    headerTitle: "text-[#1a2a66]",
    headerPrice: "text-[#1a2a66]",
    headerSub: "text-[#4152a4]/45",
  },
  executive: {
    header: "from-[#f0dea0] to-[#d8b860]",
    button: "from-[#b89030] to-[#8a6810]",
    buttonHover: "hover:from-[#a88020] hover:to-[#7a5808]",
    pillActiveBg: "#f0e0a0",
    pillActiveText: "#5a3808",
    pillActiveRing: "#d0b060",
    check: "text-[#8a6810]",
    featureBg: "bg-[#fdf4d8]",
    featureRing: "ring-[#e4cc88]",
    featureText: "text-[#5a3808]",
    priceText: "text-[#5a3808]",
    iconClass: "plan-icon--executive",
    badgeBg: "bg-[#fdf4d8]",
    badgeBorder: "border-[#e4cc88]",
    badgeText: "text-[#5a3808]",
    headerLabel: "text-[#7a5818]/55",
    headerTitle: "text-[#3a2800]",
    headerPrice: "text-[#3a2800]",
    headerSub: "text-[#7a5818]/45",
  },
};

const scrollbarHideStyle: React.CSSProperties = {
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};

/**
 * Per-resource "why the plan is worth it" pitches, keyed by add-on id.
 * Rendered after "Recommended: Upgrade to {Plan} —" so the modal explains the
 * plan's ongoing value instead of just stating the resource is included.
 * Keep each pitch short (it sits in the header) and benefit-focused.
 */
const UPGRADE_PITCH: Record<string, string> = {
  smart: "fill unlimited eligible forms across your case, not just this one.",
  "interview-prep": "unlock Prep, Rapid Fire, and Mock with the full question bank.",
  "221g": "turn a 221(g) notice into a complete recovery plan with expert-backed tools.",
  medical: "get this appointment plus the advanced tools you'll need throughout your journey.",
  translate: "translate every document your case needs, whenever a new requirement comes up.",
  photo: "keep photo credits ready for retakes and new filings.",
  sponsor: "re-check your sponsorship anytime your income or household changes.",
  "doc-review": "get expert reviews included plus the tools to act on the feedback.",
  consultation: "get consultation sessions included plus every tool to prepare for them.",
  pcc: "get guided PCC filing plus the document tools around it.",
  "civil-guid": "unlock every civil document guide plus the tools that organize them.",
  "pdf-tool-kit": "handle every PDF task in your case, not just this one.",
};

/**
 * Per-resource opportunity cost — what stays unavailable when buying only the
 * resource. Honest limitations only: one-time resources (e.g. medical booking)
 * must NOT get artificial urgency or implied recurring usage.
 */
const MISSING_OUT: Record<string, string> = {
  smart:
    "You'll get this form only — additional forms may each need a separate purchase. Higher plans include unlimited eligible forms.",
  "interview-prep":
    "Covers this interview prep, one time. Plans add timed drills, mock sessions, and the rest of your toolkit.",
  "221g":
    "One planner for this refusal. Translation, sponsorship calculator, and document tools remain locked.",
  medical:
    "Books this appointment only. No plan tools are added — this purchase simply unlocks this resource.",
  translate:
    "Covers one document. Most cases need several — each extra document is another purchase.",
  photo: "2 credits, one time. Later retakes and new applications each require another purchase.",
  sponsor:
    "One calculation. Income and household facts change during the journey — plans include re-checks.",
  "doc-review":
    "One review, one time. Expert sessions and the tools to act on the feedback stay unavailable.",
  consultation:
    "One session, one time. Interview prep tools and every other plan benefit stay unavailable.",
  pcc: "Support for this one filing request. Other Executive tools remain locked.",
  "civil-guid":
    "This guide only. Other civil document guides and the tools that use them remain locked.",
  "pdf-tool-kit":
    "One-time toolkit access. Basic and above includes the PDF toolkit for every case document.",
};

export function UpgradeModal({ feature, onClose, onConfirm, interviewMode }: UpgradeModalProps) {
  const { showToast } = useToast();
  const { tier: currentTier } = usePlan();
  const { activeCandidate } = useCandidate();
  const e = getEntitlement(feature, currentTier);
  const detailsHref = getDetailsHref(feature);

  const upgradeTiers = TIER_ORDER.filter(
    (t) => t !== "free" && TIER_ORDER.indexOf(t) > TIER_ORDER.indexOf(currentTier)
  ) as PlanTier[];

  const fullUpgradeTiers = upgradeTiers.filter((t) => {
    const state = ENTITLEMENTS[feature]?.[t]?.state;
    return state === "full" || state === "limited";
  });

  const defaultTier: PlanTier =
    currentTier === "free" && fullUpgradeTiers.includes("premium")
      ? "premium"
      : (fullUpgradeTiers[0] ?? upgradeTiers[0] ?? "basic");
  const [selectedTier, setSelectedTier] = useState<PlanTier>(defaultTier);
  const [interviewTab, setInterviewTab] = useState<"prep" | "rapid" | "mock">(
    interviewMode ?? "prep"
  );
  // ── Separate loading states for each button ──
  const [isAddonProcessing, setIsAddonProcessing] = useState(false);
  const [isUpgradeProcessing, setIsUpgradeProcessing] = useState(false);
  const { user } = useAuth();

  const handleCheckout = async (
    action: "upgrade" | "addon",
    target: string,
    setProcessing: (v: boolean) => void
  ) => {
    if (onConfirm) {
      onConfirm(action, target as PlanTier);
      onClose();
      return;
    }

    if (!user) {
      showToast("Please sign in to continue with checkout.", "error");
      return;
    }

    setProcessing(true);

    try {
      const isUpgrade = action === "upgrade" && currentTier !== "free";

      const payload = {
        isUpgrade,
        currentTier: currentTier !== "free" ? currentTier : undefined,
        productTier: action === "upgrade" ? target : undefined,
        addons: action === "addon" ? [target] : undefined,
        visaCategory: activeCandidate?.visaCategory || undefined,
      };

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Handle non-JSON responses safely.
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        showToast(
          data?.error || data?.message || "We couldn't start checkout. Please try again.",
          "error"
        );
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      // Past-due / recovery: redirect to the billing portal if requested.
      if (data?.portal) {
        try {
          const portalRes = await fetch("/api/stripe/portal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id }),
          });

          const portalData = await portalRes.json().catch(() => null);

          if (!portalRes.ok || !portalData?.url) {
            showToast(
              portalData?.error ||
                portalData?.message ||
                "We couldn't open your billing portal. Please try again.",
              "error"
            );
            return;
          }

          window.location.href = portalData.url;
          return;
        } catch {
          showToast(
            "Unable to connect to the billing portal. Please check your connection and try again.",
            "error"
          );
          return;
        }
      }

      showToast(
        data?.error ||
          data?.message ||
          "Checkout couldn't be started because no payment link was returned.",
        "error"
      );
    } catch (error) {
      console.error("[Checkout] Error:", error);

      showToast(
        "Something went wrong while starting checkout. Please check your internet connection and try again.",
        "error"
      );
    } finally {
      setProcessing(false);
    }
  };

  React.useEffect(() => {
    if (upgradeTiers.length === 0) {
      onClose();
    }
  }, [upgradeTiers.length, onClose]);

  if (upgradeTiers.length === 0) {
    return null;
  }

  const canBuyAddon = (e.state === "locked_buy" || e.state === "limited") && !!e.addon;
  const showInclusionSection = fullUpgradeTiers.length > 0;

  // ─── Shared card wrapper ──────────────────────────────────────────────────
  const cardCls = [
    "relative bg-white shadow-2xl flex flex-col overflow-hidden",
    "animate-in fade-in zoom-in-95 duration-200",
    "w-full rounded-t-3xl",
    "sm:rounded-3xl sm:w-[440px] sm:max-w-[calc(100vw-2rem)]",
    "max-h-[92dvh] sm:max-h-[88dvh]",
    "z-[10000] pointer-events-auto",
  ].join(" ");

  // Transparent PNG — rendered directly, no white box wrapper needed.
  const TierIcon = ({ tier, size = 56 }: { tier: PlanTier; size?: number }) => (
    <span
      className={`plan-icon ${TIER_STYLE[tier].iconClass} block shrink-0`}
      style={{ width: size, height: size }}
    />
  );

  // ─── Upgrade Button ───────────────────────────────────────────────────────
  const UpgradeButton = ({
    tier,
    price,
    onClick,
    fullWidth = true,
  }: {
    tier: PlanTier;
    price?: { monthly: number; annual: number } | null;
    onClick: () => void;
    fullWidth?: boolean;
  }) => {
    const s = TIER_STYLE[tier];
    return (
      <button
        onClick={onClick}
        className={` ${fullWidth ? "w-full" : ""} relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r px-5 py-3.5 ${s.button} ${s.buttonHover} group text-[13.5px] font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.98]`}
      >
        {/* Shimmer sweep */}
        <span className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-700 group-hover:translate-x-[100%]" />

        {/* Icon directly on button — transparent PNG, no wrapper */}
        <TierIcon tier={tier} size={32} />

        <span className="flex flex-1 flex-col items-start leading-tight">
          <span>Upgrade to {TIER_NAMES[tier]}</span>
          {price && (
            <span className="text-[11px] font-normal text-white/70">
              ${price.monthly}/mo · ${price.annual} total
            </span>
          )}
        </span>

        <Zap size={15} strokeWidth={2.5} className="shrink-0 opacity-60" />
      </button>
    );
  };

  // ─── Add-on purchase layout ───────────────────────────────────────────────
  if (canBuyAddon && e.addon) {
    const addon = e.addon;
    const planStyle = TIER_STYLE[selectedTier];
    const planPrice = TIER_PRICES[selectedTier];

    // Tier-aware badge: which plans actually include this feature
    // (e.g. "Executive Feature", "Premium & Executive Feature").
    const featureBadge =
      fullUpgradeTiers.length > 0
        ? `${fullUpgradeTiers.map((t) => TIER_NAMES[t]).join(" & ")} Feature`
        : "Paid Feature";

    const modal = (
      <div
        className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4"
        style={{ zIndex: 2147483000 }}
      >
        <div
          className="pointer-events-auto absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className={cardCls}>
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/10 transition-colors hover:bg-black/20"
          >
            <X size={14} strokeWidth={2.5} className="text-primary/70" />
          </button>

          {/* Light primary header */}
          <div className="from-primary/20 to-primary/20 border-primary/30 shrink-0 border-b bg-gradient-to-br px-5 pt-6 pb-5">
            <div className="mb-3 flex items-center gap-4">
              <div>
                <p className="text-primary/80 mb-0.5 text-[10px] font-bold tracking-widest uppercase">
                  {featureBadge}
                </p>
                <h2 className="text-primary text-[18px] leading-tight font-extrabold tracking-tight">
                  {addon.name}
                </h2>
              </div>
            </div>
            <p className="text-primary/80 text-[12px] font-medium">
              {/* Upgrade-first framing: explain why the plan helps, not just that the resource is included */}
              {`Recommended: Upgrade to ${TIER_NAMES[selectedTier]} — ${
                UPGRADE_PITCH[addon.id] ??
                `get ${addon.name} plus the tools you'll need throughout your journey.`
              }`}
            </p>
          </div>

          {/* Scrollable body */}
          <div
            className="flex flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4"
            style={scrollbarHideStyle}
          >
            {/* ── Interview-prep-specific mode breakdown ── */}
            {interviewMode && (
              <div className="rounded-2xl border border-slate-200/60 bg-slate-50 p-4">
                <p className="mb-2.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Interview Prep Features
                </p>
                <div className="mb-3 flex gap-1 rounded-xl bg-white p-1 ring-1 ring-slate-200/60">
                  {(["prep", "rapid", "mock"] as const).map((mode) => {
                    const cfg = INTERVIEW_MODE_FEATURES[mode];
                    const Icon = cfg.icon;
                    const isActive = interviewTab === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setInterviewTab(mode)}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[10.5px] font-bold transition-all ${
                          isActive
                            ? "text-white shadow-sm"
                            : "bg-transparent text-slate-500 hover:text-slate-700"
                        }`}
                        style={isActive ? { backgroundColor: cfg.color } : {}}
                      >
                        <Icon size={12} strokeWidth={2.5} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
                <ul className="flex flex-col gap-1.5">
                  {INTERVIEW_MODE_FEATURES[interviewTab].features.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-[11.5px] leading-snug text-slate-600"
                    >
                      <Check
                        size={12}
                        strokeWidth={2.5}
                        className="mt-0.5 shrink-0"
                        style={{ color: INTERVIEW_MODE_FEATURES[interviewTab].color }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Included in plan (recommended path) ── */}
            {showInclusionSection && (
              <div
                className={`relative rounded-2xl ${planStyle.featureBg} ring-2 ${planStyle.featureRing} p-4 pt-6`}
              >
                {/* Recommended badge — signals the advisable path at a glance */}
                <span
                  className={`absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${planStyle.button} px-3 py-1 text-[9.5px] font-black tracking-wider text-white uppercase shadow-sm`}
                >
                  <Zap size={10} strokeWidth={3} /> Recommended · Best Value
                </span>
                {fullUpgradeTiers.length > 1 && (
                  <div className="mb-3 flex gap-0.5 rounded-xl bg-black/5 p-0.5">
                    {fullUpgradeTiers.map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTier(t)}
                        style={
                          selectedTier === t
                            ? {
                                backgroundColor: TIER_STYLE[t].pillActiveBg,
                                color: TIER_STYLE[t].pillActiveText,
                                outline: `1px solid ${TIER_STYLE[t].pillActiveRing}`,
                              }
                            : {}
                        }
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10.5px] font-bold transition-all ${
                          selectedTier === t
                            ? "shadow-sm"
                            : "text-neutral-500 hover:text-neutral-700"
                        }`}
                      >
                        {TIER_NAMES[t]}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mb-3 flex flex-col">
                  <div className="mb-2 flex items-center gap-1">
                    <TierIcon tier={selectedTier} size={54} />

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[10px] font-bold tracking-widest uppercase ${planStyle.featureText} mb-1`}
                      >
                        {TIER_NAMES[selectedTier]} Plan
                      </p>

                      {/* Explicitly tie the feature they came for to this plan */}
                      <p className="mb-1 text-[11px] font-semibold text-[#3a4f63]">
                        ✓ Includes {addon.name} — plus every tool below
                      </p>

                      {planPrice && (
                        <div className="flex flex-wrap items-baseline gap-1">
                          <span
                            className={`text-[26px] font-black ${planStyle.priceText} leading-none`}
                          >
                            ${planPrice.monthly}
                          </span>
                          <span className="text-[12px] font-medium text-neutral-500">/mo</span>
                          <span className="text-[11px] text-neutral-400">
                            · ${planPrice.annual} total
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <ul className="mt-1 flex flex-col gap-1.5 pl-3">
                    {TIER_HIGHLIGHTS[selectedTier].slice(0, 4).map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-1.5 text-[11.5px] leading-snug text-[#3a4f63]"
                      >
                        <Check
                          size={12}
                          strokeWidth={2.5}
                          className={`${planStyle.check} mt-0.5 shrink-0`}
                        />
                        {item}
                      </li>
                    ))}
                    {TIER_HIGHLIGHTS[selectedTier].length > 4 && (
                      <li className="pl-[18px] text-[11px] text-neutral-400">
                        + {TIER_HIGHLIGHTS[selectedTier].length - 4} more features
                      </li>
                    )}
                  </ul>
                </div>

                <button
                  disabled={isAddonProcessing || isUpgradeProcessing}
                  onClick={() => handleCheckout("upgrade", selectedTier, setIsUpgradeProcessing)}
                  className={`w-full rounded-xl bg-gradient-to-r py-2.5 ${planStyle.button} ${planStyle.buttonHover} flex items-center justify-center gap-2 text-[13px] font-bold text-white shadow-sm transition-colors disabled:opacity-60`}
                >
                  {isUpgradeProcessing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Zap size={14} strokeWidth={2.5} />
                  )}
                  {isUpgradeProcessing
                    ? "Redirecting to payment..."
                    : `Upgrade to ${TIER_NAMES[selectedTier]}`}
                  {!isUpgradeProcessing && planPrice && (
                    <span className="font-normal text-white/80">· ${planPrice.monthly}/mo</span>
                  )}
                </button>
              </div>
            )}

            {/* Divider */}
            {showInclusionSection && (
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-neutral-200" />
                <span className="text-[11px] font-semibold text-neutral-400">
                  Just need this resource?
                </span>
                <div className="flex-1 border-t border-neutral-200" />
              </div>
            )}

            {/* Buy individually — intentionally neutral: it must not borrow any
                plan tier's palette (previously executive gold), so the two
                purchase paths read as primary vs secondary at a glance. */}
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
              <p className="mb-2 text-[10px] font-bold tracking-widest text-neutral-500 uppercase">
                Buying this tool only?
              </p>
              <div className="mb-1 flex items-baseline gap-1.5">
                <span className="text-[28px] leading-none font-black text-neutral-800">
                  ${addon.price}
                </span>
                {addon.unit && (
                  <span className="text-[12px] font-medium text-neutral-500 opacity-70">
                    · {addon.unit}
                  </span>
                )}
              </div>
              <p className="mb-3 text-[11px] leading-snug text-neutral-500">
                {MISSING_OUT[addon.id] ??
                  `Get ${addon.name} only. Your other ${TIER_NAMES[selectedTier]} tools and benefits remain locked.`}
              </p>

              <button
                disabled={isAddonProcessing || isUpgradeProcessing}
                onClick={() => handleCheckout("addon", addon.id, setIsAddonProcessing)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-700 py-2.5 text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-neutral-600 active:bg-neutral-800 disabled:opacity-60"
              >
                {isAddonProcessing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ShoppingCart size={14} strokeWidth={2.5} />
                )}
                {isAddonProcessing
                  ? "Redirecting to payment..."
                  : `Get ${addon.name} Only · $${addon.price}`}
              </button>
            </div>

            {detailsHref && (
              <Link
                href={detailsHref}
                onClick={onClose}
                className="text-primary hover:text-primary/80 text-center text-[12px] font-semibold underline underline-offset-2"
              >
                See details & reviews
              </Link>
            )}

            <p
              className="text-center text-[11px] text-neutral-400"
              style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
            >
              Secure checkout powered by Stripe
            </p>
          </div>
        </div>
      </div>
    );

    if (typeof document !== "undefined") {
      return createPortal(modal, document.body);
    }
    return null;
  }

  // ─── Upgrade-only layout ──────────────────────────────────────────────────
  const tabTiers = fullUpgradeTiers.length > 0 ? fullUpgradeTiers : upgradeTiers;
  const price = TIER_PRICES[selectedTier];
  const style = TIER_STYLE[selectedTier];

  const modal = (
    <div
      className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4"
      style={{ zIndex: 2147483000 }}
    >
      {/* Backdrop */}
      <div
        className="pointer-events-auto absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className={cardCls}>
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/10 transition-colors hover:bg-black/20"
        >
          <X size={14} strokeWidth={2.5} className={style.headerTitle} />
        </button>

        {/* Pastel gradient header — transparent PNG sits directly on it */}
        <div
          className={`shrink-0 bg-gradient-to-br ${style.header} px-5 pt-6 pb-5 transition-colors duration-300`}
        >
          <div className="mb-1 flex items-center gap-4">
            {/* No white box — icon renders on pastel bg naturally */}
            <TierIcon tier={selectedTier} size={76} />
            <div>
              <p
                className={`text-[10px] font-bold tracking-widest uppercase ${style.headerLabel} mb-0.5`}
              >
                {currentTier === "free" ? "Choose a plan" : "Upgrade your plan"}
              </p>
              <h2
                className={`text-[20px] leading-tight font-extrabold tracking-tight ${style.headerTitle}`}
              >
                {TIER_NAMES[selectedTier]}
              </h2>
              {price && (
                <div className="mt-0.5 flex flex-wrap items-baseline gap-1">
                  <span className={`text-[22px] leading-none font-black ${style.headerPrice}`}>
                    ${price.monthly}
                  </span>
                  <span className={`text-[11px] font-medium ${style.headerSub}`}>/mo</span>
                  <span className={`text-[11px] font-medium ${style.headerSub}`}>
                    · ${price.annual} total
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div
          className="flex flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4"
          style={scrollbarHideStyle}
        >
          {/* Tier tabs */}
          {tabTiers.length > 1 && (
            <div className="flex gap-1 rounded-2xl bg-neutral-100 p-1">
              {tabTiers.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTier(t)}
                  style={
                    selectedTier === t
                      ? {
                          backgroundColor: TIER_STYLE[t].pillActiveBg,
                          color: TIER_STYLE[t].pillActiveText,
                          outline: `1px solid ${TIER_STYLE[t].pillActiveRing}`,
                        }
                      : {}
                  }
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[11.5px] font-bold transition-all ${
                    selectedTier === t ? "shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {/* Icon flush in tab — zero extra padding/wrapper */}
                  <TierIcon tier={t} size={18} />
                  {TIER_NAMES[t]}
                </button>
              ))}
            </div>
          )}

          {/* Feature highlights */}
          {/* ── Interview-prep-specific mode breakdown ── */}
          {interviewMode && (
            <div className="rounded-2xl border border-slate-200/60 bg-slate-50 p-4">
              <p className="mb-2.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Interview Prep Features
              </p>
              <div className="mb-3 flex gap-1 rounded-xl bg-white p-1 ring-1 ring-slate-200/60">
                {(["prep", "rapid", "mock"] as const).map((mode) => {
                  const cfg = INTERVIEW_MODE_FEATURES[mode];
                  const Icon = cfg.icon;
                  const isActive = interviewTab === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setInterviewTab(mode)}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[10.5px] font-bold transition-all ${
                        isActive
                          ? "text-white shadow-sm"
                          : "bg-transparent text-slate-500 hover:text-slate-700"
                      }`}
                      style={isActive ? { backgroundColor: cfg.color } : {}}
                    >
                      <Icon size={12} strokeWidth={2.5} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
              <ul className="flex flex-col gap-1.5">
                {INTERVIEW_MODE_FEATURES[interviewTab].features.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-[11.5px] leading-snug text-slate-600"
                  >
                    <Check
                      size={12}
                      strokeWidth={2.5}
                      className="mt-0.5 shrink-0"
                      style={{ color: INTERVIEW_MODE_FEATURES[interviewTab].color }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Divider ── */}
          {interviewMode && (
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-neutral-200" />
              <span className="text-[11px] font-semibold text-neutral-400">
                What you get with your plan
              </span>
              <div className="flex-1 border-t border-neutral-200" />
            </div>
          )}

          {/* ── General plan highlights ── */}
          <ul className="flex flex-col gap-1.5">
            {TIER_HIGHLIGHTS[selectedTier].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-[12px] leading-snug text-[#3a4f63]"
              >
                <Check size={13} strokeWidth={2.5} className={`${style.check} mt-0.5 shrink-0`} />
                {item}
              </li>
            ))}
          </ul>

          {/* Upgrade CTA */}
          <button
            disabled={isUpgradeProcessing}
            onClick={() => handleCheckout("upgrade", selectedTier, setIsUpgradeProcessing)}
            className={`w-full rounded-2xl bg-gradient-to-r py-3 ${style.button} ${style.buttonHover} flex items-center justify-center gap-2 text-[13.5px] font-bold text-white shadow-md transition-colors active:opacity-90 disabled:opacity-60`}
          >
            {isUpgradeProcessing && <Loader2 size={14} className="animate-spin" />}
            {isUpgradeProcessing
              ? "Redirecting to payment..."
              : `Upgrade to ${TIER_NAMES[selectedTier]}`}
          </button>

          {detailsHref && (
            <Link
              href={detailsHref}
              onClick={onClose}
              className="text-primary hover:text-primary/80 text-center text-[12px] font-semibold underline underline-offset-2"
            >
              See details & reviews
            </Link>
          )}

          {/* FIX: replaced pb-safe (non-existent utility) with inline env() style */}
          <p
            className="text-center text-[11px] text-neutral-400"
            style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
          >
            Billed monthly · No cancellation after grace period
          </p>
        </div>
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(modal, document.body);
  }

  return null;
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { X, Check, Zap, ShoppingCart, Loader2, BookOpen, Mic } from "lucide-react";
import { usePlan } from "@/app/context/PlanContext";
import { useAuth } from "@/app/context/AuthContext";
import { getDetailsHref } from "@/lib/entitlements/resourceLinks";
import {
  getEntitlement,
  TIER_NAMES,
  TIER_PRICES,
  TIER_ORDER,
  ENTITLEMENTS,
  PlanTier,
} from "@/lib/entitlements/config";

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
    "PDF toolkit, Snap & Sign, DQ status check",
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
    "Expert case review, 2 sessions included",
    "Expert consultation calls, 2 sessions included",
    "PCC filing assistance (Sindh only)",
    "Document translation, 2 documents included",
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

export function UpgradeModal({ feature, onClose, onConfirm, interviewMode }: UpgradeModalProps) {
  const { tier: currentTier } = usePlan();
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
      console.error("Checkout: no user logged in");
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
      };

      console.log("[Checkout] Sending payload:", JSON.stringify(payload));

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("[Checkout] API response:", data);

      if (data.url) {
        window.location.href = data.url;
      } else if (data?.portal) {
        // Past-due / recovery: send the user to the billing portal to fix their
        // existing plan instead of buying a duplicate subscription.
        try {
          const portalRes = await fetch("/api/stripe/portal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user?.id }),
          });
          const portalData = await portalRes.json();
          if (portalData?.url) {
            window.location.href = portalData.url;
            return;
          }
        } catch (portalErr) {
          console.error("[Checkout] Portal redirect failed:", portalErr);
        }
        setProcessing(false);
      } else {
        console.error("[Checkout] No URL in response:", data);
        setProcessing(false);
      }
    } catch (error) {
      console.error("[Checkout] Error:", error);
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
      className={`plan-icon ${TIER_STYLE[tier].iconClass} shrink-0 block`}
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
        className={`
          ${fullWidth ? "w-full" : ""}
          relative overflow-hidden
          flex items-center gap-3
          px-5 py-3.5 rounded-2xl
          bg-gradient-to-r ${s.button} ${s.buttonHover}
          text-white font-bold text-[13.5px]
          shadow-md hover:shadow-lg
          active:scale-[0.98]
          transition-all duration-200
          group
        `}
      >
        {/* Shimmer sweep */}
        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />

        {/* Icon directly on button — transparent PNG, no wrapper */}
        <TierIcon tier={tier} size={32} />

        <span className="flex flex-col items-start leading-tight flex-1">
          <span>Upgrade to {TIER_NAMES[tier]}</span>
          {price && (
            <span className="text-[11px] font-normal text-white/70">
              ${price.monthly}/mo · ${price.annual} total
            </span>
          )}
        </span>

        <Zap size={15} strokeWidth={2.5} className="opacity-60 shrink-0" />
      </button>
    );
  };

  // ─── Add-on purchase layout ───────────────────────────────────────────────
  if (canBuyAddon && e.addon) {
    const addon = e.addon;
    const planStyle = TIER_STYLE[selectedTier];
    const planPrice = TIER_PRICES[selectedTier];
    const addonStyle = TIER_STYLE["executive"];

    const modal = (
      <div
        className="fixed inset-0 flex items-end sm:items-center justify-center sm:p-4"
        style={{ zIndex: 2147483647 }}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
          onClick={onClose}
        />

        <div className={cardCls}>
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-10 w-7 h-7 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
          >
            <X size={14} strokeWidth={2.5} className="text-[#3a2800]" />
          </button>

          {/* Light primary header */}
          <div className="shrink-0 bg-gradient-to-br from-primary/20 to-primary/20 px-5 pt-6 pb-5 border-b border-primary/30">
            <div className="flex items-center gap-4 mb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-0.5">
                  Paid Feature
                </p>
                <h2 className="text-[18px] font-extrabold tracking-tight leading-tight text-primary">
                  {addon.name}
                </h2>
              </div>
            </div>
            <p className="text-[12px] font-medium text-primary/80">
              Get it included with a plan upgrade, or buy once
            </p>
          </div>

          {/* Scrollable body */}
          <div
            className="overflow-y-auto overscroll-contain flex-1 px-4 py-4 flex flex-col gap-3"
            style={scrollbarHideStyle}
          >
            {/* ── Interview-prep-specific mode breakdown ── */}
            {interviewMode && (
              <div className="rounded-2xl bg-slate-50 border border-slate-200/60 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">
                  Interview Prep Features
                </p>
                <div className="flex gap-1 bg-white rounded-xl p-1 mb-3 ring-1 ring-slate-200/60">
                  {(["prep", "rapid", "mock"] as const).map((mode) => {
                    const cfg = INTERVIEW_MODE_FEATURES[mode];
                    const Icon = cfg.icon;
                    const isActive = interviewTab === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setInterviewTab(mode)}
                        className={`flex-1 py-2 rounded-lg text-[10.5px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                          isActive
                            ? "shadow-sm text-white"
                            : "text-slate-500 hover:text-slate-700 bg-transparent"
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
                      className="flex items-start gap-2 text-[11.5px] text-slate-600 leading-snug"
                    >
                      <Check
                        size={12}
                        strokeWidth={2.5}
                        className="shrink-0 mt-0.5"
                        style={{ color: INTERVIEW_MODE_FEATURES[interviewTab].color }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Included in plan ── */}
            {showInclusionSection && (
              <div
                className={`rounded-2xl ${planStyle.featureBg} ring-1 ${planStyle.featureRing} p-4`}
              >
                {fullUpgradeTiers.length > 1 && (
                  <div className="flex gap-0.5 bg-black/5 rounded-xl p-0.5 mb-3">
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
                        className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-bold transition-all flex items-center justify-center gap-1.5 ${
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

                <div className="flex flex-col mb-3">
                  <div className="flex items-center gap-1 mb-2">
                    <TierIcon tier={selectedTier} size={54} />

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[10px] font-bold uppercase tracking-widest ${planStyle.featureText} mb-1`}
                      >
                        {TIER_NAMES[selectedTier]} Plan
                      </p>

                      {planPrice && (
                        <div className="flex items-baseline gap-1 flex-wrap">
                          <span
                            className={`text-[26px] font-black ${planStyle.priceText} leading-none`}
                          >
                            ${planPrice.monthly}
                          </span>
                          <span className="text-[12px] text-neutral-500 font-medium">/mo</span>
                          <span className="text-[11px] text-neutral-400">
                            · ${planPrice.annual} total
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <ul className="flex flex-col gap-1.5 mt-1 pl-3">
                    {TIER_HIGHLIGHTS[selectedTier].slice(0, 4).map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-1.5 text-[11.5px] text-[#3a4f63] leading-snug"
                      >
                        <Check
                          size={12}
                          strokeWidth={2.5}
                          className={`${planStyle.check} shrink-0 mt-0.5`}
                        />
                        {item}
                      </li>
                    ))}
                    {TIER_HIGHLIGHTS[selectedTier].length > 4 && (
                      <li className="text-[11px] text-neutral-400 pl-[18px]">
                        + {TIER_HIGHLIGHTS[selectedTier].length - 4} more features
                      </li>
                    )}
                  </ul>
                </div>

                <button
                  disabled={isAddonProcessing || isUpgradeProcessing}
                  onClick={() => handleCheckout("upgrade", selectedTier, setIsUpgradeProcessing)}
                  className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${planStyle.button} ${planStyle.buttonHover} text-white text-[13px] disabled:opacity-60 font-bold transition-colors flex items-center justify-center gap-2 shadow-sm`}
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
                <span className="text-[11px] text-neutral-400 font-semibold">
                  or buy once
                </span>
                <div className="flex-1 border-t border-neutral-200" />
              </div>
            )}

            {/* Buy individually */}
            <div
              className={`rounded-2xl ${addonStyle.featureBg} border ${addonStyle.badgeBorder} p-4`}
            >
              <p
                className={`text-[10px] font-bold uppercase tracking-widest ${addonStyle.badgeText} mb-2`}
              >
                Buy Once
              </p>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className={`text-[28px] font-black ${addonStyle.priceText} leading-none`}>
                  ${addon.price}
                </span>
                {addon.unit && (
                  <span className={`text-[12px] ${addonStyle.badgeText} opacity-60 font-medium`}>
                    · {addon.unit}
                  </span>
                )}
              </div>
              <p className={`text-[11px] ${addonStyle.badgeText} opacity-50 mb-3`}>
                One-time purchase · No subscription required
              </p>

              <button
                disabled={isAddonProcessing || isUpgradeProcessing}
                onClick={() => handleCheckout("addon", addon.id, setIsAddonProcessing)}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 disabled:opacity-60 text-white text-[13px] font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {isAddonProcessing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ShoppingCart size={14} strokeWidth={2.5} />
                )}
                {isAddonProcessing
                  ? "Redirecting to payment..."
                  : `Buy ${addon.name} · $${addon.price}`}
              </button>
            </div>

            {detailsHref && (
              <Link
                href={detailsHref}
                onClick={onClose}
                className="text-center text-[12px] font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
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
      className="fixed inset-0 flex items-end sm:items-center justify-center sm:p-4"
      style={{ zIndex: 2147483647 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />

      <div className={cardCls}>
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 w-7 h-7 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
        >
          <X size={14} strokeWidth={2.5} className={style.headerTitle} />
        </button>

        {/* Pastel gradient header — transparent PNG sits directly on it */}
        <div
          className={`shrink-0 bg-gradient-to-br ${style.header} px-5 pt-6 pb-5 transition-colors duration-300`}
        >
          <div className="flex items-center gap-4 mb-1">
            {/* No white box — icon renders on pastel bg naturally */}
            <TierIcon tier={selectedTier} size={76} />
            <div>
              <p
                className={`text-[10px] font-bold uppercase tracking-widest ${style.headerLabel} mb-0.5`}
              >
                {currentTier === "free" ? "Choose a plan" : "Upgrade your plan"}
              </p>
              <h2
                className={`text-[20px] font-extrabold tracking-tight leading-tight ${style.headerTitle}`}
              >
                {TIER_NAMES[selectedTier]}
              </h2>
              {price && (
                <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
                  <span className={`text-[22px] font-black leading-none ${style.headerPrice}`}>
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
          className="overflow-y-auto overscroll-contain flex-1 px-4 py-4 flex flex-col gap-3"
          style={scrollbarHideStyle}
        >
          {/* Tier tabs */}
          {tabTiers.length > 1 && (
            <div className="flex gap-1 bg-neutral-100 rounded-2xl p-1">
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
                  className={`flex-1 py-2 rounded-xl text-[11.5px] font-bold transition-all flex items-center justify-center gap-1.5 ${
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
            <div className="rounded-2xl bg-slate-50 border border-slate-200/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">
                Interview Prep Features
              </p>
              <div className="flex gap-1 bg-white rounded-xl p-1 mb-3 ring-1 ring-slate-200/60">
                {(["prep", "rapid", "mock"] as const).map((mode) => {
                  const cfg = INTERVIEW_MODE_FEATURES[mode];
                  const Icon = cfg.icon;
                  const isActive = interviewTab === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setInterviewTab(mode)}
                      className={`flex-1 py-2 rounded-lg text-[10.5px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isActive
                          ? "shadow-sm text-white"
                          : "text-slate-500 hover:text-slate-700 bg-transparent"
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
                    className="flex items-start gap-2 text-[11.5px] text-slate-600 leading-snug"
                  >
                    <Check
                      size={12}
                      strokeWidth={2.5}
                      className="shrink-0 mt-0.5"
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
              <span className="text-[11px] text-neutral-400 font-semibold">
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
                className="flex items-start gap-2 text-[12px] text-[#3a4f63] leading-snug"
              >
                <Check size={13} strokeWidth={2.5} className={`${style.check} shrink-0 mt-0.5`} />
                {item}
              </li>
            ))}
          </ul>

          {/* Upgrade CTA */}
          <button
            disabled={isUpgradeProcessing}
            onClick={() => handleCheckout("upgrade", selectedTier, setIsUpgradeProcessing)}
            className={`w-full py-3 rounded-2xl bg-gradient-to-r ${style.button} ${style.buttonHover} text-white text-[13.5px] font-bold disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-md active:opacity-90`}
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
              className="text-center text-[12px] font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
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

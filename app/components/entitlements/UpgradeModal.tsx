"use client";

import React, { useState } from "react";
import { X, Check, Crown, Zap, ShoppingCart } from "lucide-react";
import { usePlan } from "@/app/context/PlanContext";
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
}

const TIER_HIGHLIGHTS: Record<PlanTier, string[]> = {
  free: [],
  basic: [
    "Full roadmap — all steps & chapters visible",
    "Checklist engine for your case",
    "Portal wallet (save credentials securely)",
    "Visa bulletin monitor",
    "PDF toolkit, Snap & Sign, DQ status check",
    "Basic interview prep",
  ],
  premium: [
    "Everything in Basic",
    "Step-by-step guides in every step",
    "Document vault — upload & auto-extract",
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
    "Expert document review — 2 sessions included",
    "Expert consultation calls — 2 sessions included",
    "PCC filing assistance (Sindh only)",
    "Document translation — 2 documents included",
  ],
};

const TIER_STYLE: Record<PlanTier, {
  header: string;
  button: string;
  pill: string;
  check: string;
  ring: string;
  bg: string;
  text: string;
}> = {
  free: {
    header: "from-neutral-500 to-neutral-700",
    button: "bg-neutral-700 hover:bg-neutral-600",
    pill:   "bg-neutral-100 text-neutral-700",
    check:  "text-neutral-500",
    ring:   "ring-neutral-300",
    bg:     "bg-neutral-50",
    text:   "text-neutral-700",
  },
  basic: {
    header: "from-sky-700 to-sky-900",
    button: "bg-sky-700 hover:bg-sky-600",
    pill:   "bg-sky-50 text-sky-700 ring-sky-200",
    check:  "text-sky-600",
    ring:   "ring-sky-200",
    bg:     "bg-sky-50",
    text:   "text-sky-700",
  },
  premium: {
    header: "from-violet-700 to-violet-900",
    button: "bg-violet-700 hover:bg-violet-600",
    pill:   "bg-violet-50 text-violet-700 ring-violet-200",
    check:  "text-violet-600",
    ring:   "ring-violet-200",
    bg:     "bg-violet-50",
    text:   "text-violet-700",
  },
  executive: {
    header: "from-amber-600 to-amber-800",
    button: "bg-amber-600 hover:bg-amber-500",
    pill:   "bg-amber-50 text-amber-700 ring-amber-200",
    check:  "text-amber-600",
    ring:   "ring-amber-200",
    bg:     "bg-amber-50",
    text:   "text-amber-700",
  },
};

/** Hides the scrollbar visually while keeping scroll functionality */
const scrollbarHideStyle: React.CSSProperties = {
  scrollbarWidth: "none",        /* Firefox */
  msOverflowStyle: "none",       /* IE / Edge legacy */
};

export function UpgradeModal({ feature, onClose, onConfirm }: UpgradeModalProps) {
  const { tier: currentTier } = usePlan();
  const e = getEntitlement(feature, currentTier);

  const upgradeTiers = TIER_ORDER.filter(
    (t) => t !== "free" && TIER_ORDER.indexOf(t) > TIER_ORDER.indexOf(currentTier),
  ) as PlanTier[];

  const fullUpgradeTiers = upgradeTiers.filter((t) => {
    const state = ENTITLEMENTS[feature]?.[t]?.state;
    return state === "full" || state === "limited";
  });

  const defaultTier: PlanTier = fullUpgradeTiers[0] ?? upgradeTiers[0] ?? "basic";
  const [selectedTier, setSelectedTier] = useState<PlanTier>(defaultTier);

  if (upgradeTiers.length === 0) {
    onClose();
    return null;
  }

  const canBuyAddon = e.state === "locked_buy" && !!e.addon;
  const showInclusionSection = fullUpgradeTiers.length > 0;

  // ─── Shared card wrapper ──────────────────────────────────────────────────
  // • On mobile  : anchored to bottom, full-width, max 92dvh, rounded top only
  // • On sm+     : centred, max-w-[440px], fully rounded, max 88dvh
  const cardCls = [
    "relative bg-white shadow-2xl flex flex-col overflow-hidden",
    "animate-in fade-in zoom-in-95 duration-200",
    // Mobile: slide-up sheet
    "w-full rounded-t-3xl",
    // sm+: floating card
    "sm:rounded-3xl sm:w-[440px] sm:max-w-[calc(100vw-2rem)]",
    // Height: fills available space but never exceeds viewport
    "max-h-[92dvh] sm:max-h-[88dvh]",
  ].join(" ");

  // ─── Add-on purchase layout ───────────────────────────────────────────────
  if (canBuyAddon && e.addon) {
    const addon = e.addon;
    const planStyle = TIER_STYLE[selectedTier];
    const planPrice = TIER_PRICES[selectedTier];

    return (
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className={cardCls}>
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-10 w-7 h-7 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors"
          >
            <X size={14} strokeWidth={2.5} className="text-white" />
          </button>

          {/* Gold header — never scrolls */}
          <div className="shrink-0 bg-gradient-to-br from-yellow-600 to-amber-700 px-5 pt-6 pb-4 text-white">
            <div className="w-8 h-8 rounded-2xl bg-white/20 flex items-center justify-center mb-2.5">
              <Crown size={15} strokeWidth={2.5} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-0.5">
              Premium Feature
            </p>
            <h2 className="text-[19px] font-extrabold tracking-tight leading-tight">
              {addon.name}
            </h2>
            <p className="text-[12px] text-white/70 mt-1">
              Buy once, or get it included with a plan upgrade
            </p>
          </div>

          {/* Scrollable body — scrollbar hidden */}
          <div
            className="overflow-y-auto overscroll-contain flex-1 px-4 py-4 flex flex-col gap-3"
            style={scrollbarHideStyle}
          >
            {/* Buy individually */}
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">
                Buy Once
              </p>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-[28px] font-black text-amber-700 leading-none">
                  ${addon.price}
                </span>
                {addon.unit && (
                  <span className="text-[12px] text-amber-600 font-medium">
                    · {addon.unit}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-amber-700/70 mb-3">
                One-time purchase · No subscription required
              </p>
              <button
                onClick={() => { onConfirm?.("addon", addon.id); onClose(); }}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[13px] font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <ShoppingCart size={14} strokeWidth={2.5} />
                Buy {addon.name} · ${addon.price}
              </button>
            </div>

            {/* Divider */}
            {showInclusionSection && (
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-neutral-200" />
                <span className="text-[11px] text-neutral-400 font-semibold">or get it included</span>
                <div className="flex-1 border-t border-neutral-200" />
              </div>
            )}

            {/* Included in plan */}
            {showInclusionSection && (
              <div className={`rounded-2xl ${planStyle.bg} ring-1 ${planStyle.ring} p-4`}>
                {fullUpgradeTiers.length > 1 && (
                  <div className="flex gap-0.5 bg-black/5 rounded-xl p-0.5 mb-3">
                    {fullUpgradeTiers.map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTier(t)}
                        className={`flex-1 py-1 rounded-lg text-[10.5px] font-bold transition-all ${
                          selectedTier === t
                            ? "bg-white shadow-sm text-neutral-800"
                            : "text-neutral-500 hover:text-neutral-700"
                        }`}
                      >
                        {TIER_NAMES[t]}
                      </button>
                    ))}
                  </div>
                )}

                <p className={`text-[10px] font-bold uppercase tracking-widest ${planStyle.text} mb-1`}>
                  {TIER_NAMES[selectedTier]} Plan
                </p>

                {planPrice && (
                  <div className="mb-3">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-[26px] font-black ${planStyle.text} leading-none`}>
                        ${planPrice.monthly}
                      </span>
                      <span className="text-[12px] text-neutral-500 font-medium">/mo</span>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">${planPrice.annual} total</div>
                  </div>
                )}

                <ul className="flex flex-col gap-1.5 mb-3">
                  {TIER_HIGHLIGHTS[selectedTier].slice(0, 4).map((item) => (
                    <li key={item} className="flex items-start gap-1.5 text-[11.5px] text-[#3a4f63] leading-snug">
                      <Check size={12} strokeWidth={2.5} className={`${planStyle.check} shrink-0 mt-0.5`} />
                      {item}
                    </li>
                  ))}
                  {TIER_HIGHLIGHTS[selectedTier].length > 4 && (
                    <li className="text-[11px] text-neutral-400 pl-[18px]">
                      + {TIER_HIGHLIGHTS[selectedTier].length - 4} more features
                    </li>
                  )}
                </ul>

                <button
                  onClick={() => { onConfirm?.("upgrade", selectedTier); onClose(); }}
                  className={`w-full py-2.5 rounded-xl text-white text-[13px] font-bold transition-colors flex items-center justify-center gap-2 shadow-sm ${planStyle.button}`}
                >
                  <Zap size={14} strokeWidth={2.5} />
                  Upgrade to {TIER_NAMES[selectedTier]}
                  {planPrice && (
                    <span className="font-normal text-white/80">· ${planPrice.monthly}/mo</span>
                  )}
                </button>
              </div>
            )}

            {/* Safe-area bottom padding for mobile home bar */}
            <p className="text-center text-[11px] text-neutral-400 pb-safe pb-2">
              Billed monthly · No cancellation after grace period
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Upgrade-only layout ──────────────────────────────────────────────────
  const tabTiers = fullUpgradeTiers.length > 0 ? fullUpgradeTiers : upgradeTiers;
  const price = TIER_PRICES[selectedTier];
  const style = TIER_STYLE[selectedTier];

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className={cardCls}>
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 w-7 h-7 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors"
        >
          <X size={14} strokeWidth={2.5} className="text-white" />
        </button>

        {/* Gradient header — never scrolls */}
        <div
          className={`shrink-0 bg-gradient-to-br ${style.header} px-5 pt-6 pb-4 text-white transition-colors duration-300`}
        >
          <div className="w-8 h-8 rounded-2xl bg-white/20 flex items-center justify-center mb-2.5">
            <Crown size={15} strokeWidth={2.5} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-0.5">
            {currentTier === "free" ? "Choose a plan" : "Upgrade your plan"}
          </p>
          <h2 className="text-[19px] font-extrabold tracking-tight leading-tight">
            {TIER_NAMES[selectedTier]}
          </h2>
          {price && (
            <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
              <span className="text-[28px] font-black leading-none">${price.monthly}</span>
              <span className="text-[12px] text-white/70 font-medium">/mo</span>
              <span className="text-[11px] text-white/50 font-medium">· ${price.annual} total</span>
            </div>
          )}
        </div>

        {/* Scrollable body — scrollbar hidden */}
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
                  className={`flex-1 py-1.5 rounded-xl text-[11.5px] font-bold transition-all ring-1 ring-transparent ${
                    selectedTier === t
                      ? `${TIER_STYLE[t].pill} ring-1 shadow-sm`
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {TIER_NAMES[t]}
                </button>
              ))}
            </div>
          )}

          {/* Feature highlights */}
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
            onClick={() => { onConfirm?.("upgrade", selectedTier); onClose(); }}
            className={`w-full py-3 rounded-2xl text-white text-[13.5px] font-bold transition-colors flex items-center justify-center gap-2 shadow-md ${style.button}`}
          >
            <Crown size={14} strokeWidth={2.5} />
            Upgrade to {TIER_NAMES[selectedTier]}
          </button>

          {/* Safe-area bottom padding for mobile home bar */}
          <p className="text-center text-[11px] text-neutral-400 pb-safe pb-2">
            Billed monthly · No cancellation after grace period
          </p>
        </div>
      </div>
    </div>
  );
}
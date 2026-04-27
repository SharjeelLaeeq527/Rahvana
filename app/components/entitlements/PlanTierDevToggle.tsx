"use client";

import React, { useState } from "react";
import { usePlan } from "@/app/context/PlanContext";
import { PlanTier, TIER_ORDER, TIER_NAMES } from "@/lib/entitlements/config";

const TIER_COLORS: Record<PlanTier, { bg: string; text: string; ring: string; dot: string }> = {
  free:      { bg: "bg-neutral-800",   text: "text-neutral-200", ring: "ring-neutral-600",  dot: "bg-neutral-400"  },
  basic:     { bg: "bg-sky-900",       text: "text-sky-200",     ring: "ring-sky-600",      dot: "bg-sky-400"      },
  premium:   { bg: "bg-violet-900",    text: "text-violet-200",  ring: "ring-violet-500",   dot: "bg-violet-400"   },
  executive: { bg: "bg-amber-900",     text: "text-amber-200",   ring: "ring-amber-500",    dot: "bg-amber-400"    },
};

export function PlanTierDevToggle() {
  const { tier, realTier, devOverride, setDevOverride } = usePlan();
  const [expanded, setExpanded] = useState(false);

  const colors = TIER_COLORS[tier];
  const isOverriding = devOverride !== null;

  function selectTier(t: PlanTier) {
    setDevOverride(t === realTier ? null : t);
    setExpanded(false);
  }

  function clearOverride(e: React.MouseEvent) {
    e.stopPropagation();
    setDevOverride(null);
    setExpanded(false);
  }

  return (
    <div className="fixed bottom-5 left-5 z-[200] flex flex-col items-start gap-1.5 select-none">
      {/* Tier picker */}
      {expanded && (
        <div className="flex flex-col gap-1 bg-[#181c25] border border-white/10 rounded-2xl p-2 shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-150">
          <div className="text-[9.5px] font-black uppercase tracking-widest text-white/30 px-2 pb-1">
            Dev — preview as tier
          </div>
          {TIER_ORDER.map((t) => {
            const c = TIER_COLORS[t];
            const active = tier === t;
            return (
              <button
                key={t}
                onClick={() => selectTier(t)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all
                  ${active
                    ? `${c.bg} ${c.text} ring-1 ${c.ring}`
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
              >
                <span className={`w-2 h-2 rounded-full ${active ? c.dot : "bg-white/20"}`} />
                {TIER_NAMES[t]}
                {t === realTier && (
                  <span className="ml-auto text-[9px] opacity-50 font-medium">real</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Pill trigger */}
      <button
        onClick={() => setExpanded((x) => !x)}
        className={`flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-full font-bold text-[11.5px] shadow-lg transition-all ring-1
          ${colors.bg} ${colors.text} ${colors.ring}
          hover:brightness-110 active:scale-95`}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot} ${isOverriding ? "animate-pulse" : ""}`} />
        {TIER_NAMES[tier]}
        {isOverriding && (
          <>
            <span className="opacity-40 text-[9px] font-medium">override</span>
            <span
              role="button"
              onClick={clearOverride}
              className="ml-0.5 opacity-50 hover:opacity-100 text-[10px] leading-none transition-opacity"
              title="Reset to real tier"
            >
              ✕
            </span>
          </>
        )}
      </button>
    </div>
  );
}
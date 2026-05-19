"use client";

import React, { useState } from "react";
import { ShieldAlert, AlertTriangle, Info, ChevronDown } from "lucide-react";
import { detectRiskFlagsFromEligibilityQuest } from "@/lib/case-strength";
import type { RiskFlag } from "@/lib/case-strength";

interface EligibilityRiskBannerProps {
  answers: Record<string, Record<string, string | string[]> | undefined> | null | undefined;
  /** If true, renders as a compact side-panel card (narrower, no disclaimer footer) */
  compact?: boolean;
}

const SEV: Record<
  RiskFlag["severity"],
  {
    dot: string;
    rowBg: string;
    rowBorder: string;
    titleColor: string;
    chipBg: string;
    chipFg: string;
    label: string;
    Icon: React.ComponentType<{ size?: number; className?: string }>;
    iconColor: string;
  }
> = {
  critical: {
    dot: "bg-red-500",
    rowBg: "#fff8f8",
    rowBorder: "#fecaca",
    titleColor: "#991b1b",
    chipBg: "#fee2e2",
    chipFg: "#7f1d1d",
    label: "Critical",
    Icon: ShieldAlert,
    iconColor: "#dc2626",
  },
  warning: {
    dot: "bg-amber-400",
    rowBg: "#fffdf5",
    rowBorder: "#fde68a",
    titleColor: "#92400e",
    chipBg: "#fef3c7",
    chipFg: "#78350f",
    label: "Warning",
    Icon: AlertTriangle,
    iconColor: "#d97706",
  },
  advisory: {
    dot: "bg-blue-400",
    rowBg: "#f8fbff",
    rowBorder: "#bfdbfe",
    titleColor: "#1e40af",
    chipBg: "#dbeafe",
    chipFg: "#1e3a8a",
    label: "Note",
    Icon: Info,
    iconColor: "#3b82f6",
  },
};

function FlagRow({ flag, defaultOpen }: { flag: RiskFlag; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const s = SEV[flag.severity];
  const Icon = s.Icon;

  return (
    <div
      className="rounded-[10px] border overflow-hidden"
      style={{ borderColor: s.rowBorder, background: s.rowBg }}
    >
      {/* Header row — always visible */}
      <button
        className="w-full flex items-center gap-3 px-3.5 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Icon size={15} style={{ color: s.iconColor }} className="shrink-0" />

        <span
          className="flex-1 text-[13px] font-semibold leading-snug"
          style={{ color: s.titleColor }}
        >
          {flag.title}
        </span>

        <span
          className="text-[9.5px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0"
          style={{ background: s.chipBg, color: s.chipFg }}
        >
          {s.label}
        </span>

        <ChevronDown
          size={14}
          className="shrink-0 transition-transform duration-200"
          style={{
            color: s.iconColor,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Expanded detail */}
      {open && (
        <div
          className="px-4 pb-3 pt-0.5 border-t"
          style={{ borderColor: s.rowBorder }}
        >
          <p
            className="text-[12px] leading-relaxed"
            style={{ color: s.titleColor, opacity: 0.85 }}
          >
            {flag.advisory}
          </p>
          <p className="text-[10.5px] text-[#a8a29e] mt-1.5 leading-snug">
            {flag.source_basis}
          </p>
        </div>
      )}
    </div>
  );
}

export function EligibilityRiskBanner({ answers, compact = false }: EligibilityRiskBannerProps) {
  const flags = detectRiskFlagsFromEligibilityQuest(answers);
  if (flags.length === 0) return null;

  const order: Record<RiskFlag["severity"], number> = { critical: 0, warning: 1, advisory: 2 };
  const sorted = [...flags].sort((a, b) => order[a.severity] - order[b.severity]);

  const criticalCount = sorted.filter((f) => f.severity === "critical").length;
  const warningCount  = sorted.filter((f) => f.severity === "warning").length;
  const advisoryCount = sorted.filter((f) => f.severity === "advisory").length;

  return (
    <div
      className={compact ? "rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden" : "mt-6 rounded-[14px] border-[1.5px] overflow-hidden"}
      style={compact ? undefined : { borderColor: "#e7e5e4" }}
      role="region"
      aria-label="Eligibility risk advisories"
    >
      {/* Header strip */}
      <div
        className={`flex items-center gap-2 ${compact ? "px-3 py-2.5" : "px-4 py-3 gap-3"}`}
        style={{ background: "#fafaf9", borderBottom: "1px solid #f0ece8" }}
      >
        <ShieldAlert size={compact ? 13 : 15} color="#991b1b" className="shrink-0" />
        <span className={`font-semibold text-[#1c1917] flex-1 ${compact ? "text-[11.5px]" : "text-[13px]"}`}>
          {flags.length} risk{flags.length === 1 ? "" : "s"}
          {!compact && " detected"}
        </span>
        <div className="flex items-center gap-1">
          {criticalCount > 0 && (
            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: SEV.critical.chipBg, color: SEV.critical.chipFg }}>
              {criticalCount}c
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: SEV.warning.chipBg, color: SEV.warning.chipFg }}>
              {warningCount}w
            </span>
          )}
          {advisoryCount > 0 && (
            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: SEV.advisory.chipBg, color: SEV.advisory.chipFg }}>
              {advisoryCount}n
            </span>
          )}
        </div>
      </div>

      {/* Flag rows — collapsed by default */}
      <div className={`flex flex-col ${compact ? "gap-1.5 p-2" : "gap-2 p-3"}`} style={{ background: "#fefefe" }}>
        {sorted.map((flag) => (
          <FlagRow key={flag.id} flag={flag} defaultOpen={false} />
        ))}
      </div>

      {/* Footer disclaimer — full banner only */}
      {!compact && (
        <div className="px-4 py-2.5 border-t" style={{ borderColor: "#f0ece8", background: "#fafaf9" }}>
          <p className="text-[10.5px] text-[#a8a29e] leading-snug">
            Advisory only — not legal advice. Consult a licensed immigration attorney for case-specific guidance.
          </p>
        </div>
      )}
    </div>
  );
}

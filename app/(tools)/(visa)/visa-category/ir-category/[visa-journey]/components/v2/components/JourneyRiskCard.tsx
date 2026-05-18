"use client";

import React, { useMemo, useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  detectRiskFlags,
  detectRiskFlagsFromEligibilityQuest,
  type RiskFlag,
} from "@/lib/case-strength";

interface JourneyRiskCardProps {
  metadata: Record<string, any> | null | undefined;
  /** Called when the user clicks "Review in step" — routes to the eligibility step. */
  onOpenEligibility?: () => void;
}

const SEV: Record<
  RiskFlag["severity"],
  {
    rowBg: string;
    rowBorder: string;
    titleColor: string;
    fg: string;
    chipBg: string;
    chipFg: string;
    label: string;
    iconColor: string;
    accent: string;
    Icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
  }
> = {
  critical: { rowBg: "#fff8f8", rowBorder: "#fecaca", titleColor: "#991b1b", fg: "#7f1d1d", chipBg: "#fee2e2", chipFg: "#7f1d1d", label: "Critical", iconColor: "#dc2626", accent: "#dc2626", Icon: ShieldAlert },
  warning:  { rowBg: "#fffdf5", rowBorder: "#fde68a", titleColor: "#92400e", fg: "#78350f", chipBg: "#fef3c7", chipFg: "#78350f", label: "Warning",  iconColor: "#d97706", accent: "#f59e0b", Icon: AlertTriangle },
  advisory: { rowBg: "#f8fbff", rowBorder: "#bfdbfe", titleColor: "#1e40af", fg: "#1e3a8a", chipBg: "#dbeafe", chipFg: "#1e3a8a", label: "Note",     iconColor: "#3b82f6", accent: "#3b82f6", Icon: Info },
};

function FlagRow({ flag }: { flag: RiskFlag }) {
  const [open, setOpen] = useState(false);
  const s = SEV[flag.severity];
  const Icon = s.Icon;
  return (
    <div
      className="rounded-[10px] border overflow-hidden transition-all"
      style={{ borderColor: s.rowBorder, background: s.rowBg }}
    >
      <button
        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:brightness-[0.98] transition-all"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Icon size={14} color={s.iconColor} />
        <span className="flex-1 text-[12.5px] font-semibold leading-snug" style={{ color: s.titleColor }}>
          {flag.title}
        </span>
        <span
          className="text-[9.5px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0"
          style={{ background: s.chipBg, color: s.chipFg }}
        >
          {s.label}
        </span>
        <ChevronDown
          size={13}
          color={s.iconColor}
          className="shrink-0"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        />
      </button>
      {open && (
        <div className="px-3.5 pb-2.5 pt-0.5 border-t" style={{ borderColor: s.rowBorder }}>
          <p className="text-[11.5px] leading-relaxed" style={{ color: s.fg }}>
            {flag.advisory}
          </p>
          <p className="text-[10px] text-[#a8a29e] mt-1.5 leading-snug">
            {flag.source_basis}
          </p>
        </div>
      )}
    </div>
  );
}

export function JourneyRiskCard({ metadata, onOpenEligibility }: JourneyRiskCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Pull persisted quest answers + baselines from metadata
  const allFlags = useMemo<RiskFlag[]>(() => {
    if (!metadata) return [];

    const questAnswers = metadata["questAnswers_eligibility-suite"] as
      | Record<string, Record<string, string | string[]>>
      | undefined;
    const consistency = metadata.consistencyBaseline as
      | { marriageDate?: string; petitionerDateOfBirth?: string; beneficiaryDateOfBirth?: string }
      | undefined;

    const fromQuest = detectRiskFlagsFromEligibilityQuest(questAnswers);
    const fromDates = consistency?.marriageDate
      ? detectRiskFlags({
          marriage_date: consistency.marriageDate,
          petitioner_dob: consistency.petitionerDateOfBirth,
          beneficiary_dob: consistency.beneficiaryDateOfBirth,
        })
      : [];

    const seen = new Set<string>();
    const out: RiskFlag[] = [];
    for (const f of [...fromQuest, ...fromDates]) {
      if (!seen.has(f.id)) {
        seen.add(f.id);
        out.push(f);
      }
    }
    const order: Record<RiskFlag["severity"], number> = { critical: 0, warning: 1, advisory: 2 };
    return out.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [metadata]);

  const hasAnsweredQuest = !!metadata?.["questAnswers_eligibility-suite"];

  const criticalCount = allFlags.filter((f) => f.severity === "critical").length;
  const warningCount  = allFlags.filter((f) => f.severity === "warning").length;
  const advisoryCount = allFlags.filter((f) => f.severity === "advisory").length;

  // ─── Case A: User hasn't completed eligibility quest yet ──────────────────
  if (!hasAnsweredQuest) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-[#f0f9ff] via-white to-[#e0f2fe] border border-[#bae6fd] p-5 shadow-[0_8px_24px_rgba(56,189,248,0.08)]">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-white border border-[#bae6fd] flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles size={20} className="text-[#0284c7]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0284c7] mb-1">
              Case Strength Insights
            </div>
            <h3 className="text-[15px] font-bold text-[#0c4a6e] mb-1 leading-snug">
              Complete eligibility check to surface risks
            </h3>
            <p className="text-[12.5px] text-[#475569] leading-relaxed mb-3">
              Rahvana scans your answers for INA-level eligibility risks (prior marriages,
              criminal history, financial sponsorship, unlawful presence) and surfaces them here.
            </p>
            {onOpenEligibility && (
              <button
                onClick={onOpenEligibility}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white text-[12.5px] font-semibold transition-colors"
              >
                Start eligibility check
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Case B: Quest answered, no risks detected ─────────────────────────────
  if (allFlags.length === 0) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-[#ecfdf5] via-white to-[#d1fae5] border border-[#a7f3d0] p-5 shadow-[0_8px_24px_rgba(16,185,129,0.08)]">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-white border border-[#a7f3d0] flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck size={20} className="text-[#059669]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#059669] mb-1">
              Case Strength Insights
            </div>
            <h3 className="text-[15px] font-bold text-[#065f46] mb-1 leading-snug">
              No risk signals detected
            </h3>
            <p className="text-[12.5px] text-[#475569] leading-relaxed">
              Based on your eligibility answers, no INA-level red flags were detected.
              Keep documents organized and continue your roadmap with confidence.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Case C: Risks present — collapsible summary ───────────────────────────
  const headerAccent =
    criticalCount > 0
      ? { bg: "from-[#fff5f5] via-white to-[#fef2f2]", border: "#fecaca", iconBg: "bg-[#fee2e2]", iconColor: "#dc2626", label: "#7f1d1d" }
      : warningCount > 0
        ? { bg: "from-[#fffbeb] via-white to-[#fef3c7]", border: "#fde68a", iconBg: "bg-[#fef3c7]", iconColor: "#d97706", label: "#78350f" }
        : { bg: "from-[#f0f9ff] via-white to-[#dbeafe]", border: "#bfdbfe", iconBg: "bg-[#dbeafe]", iconColor: "#3b82f6", label: "#1e3a8a" };

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${headerAccent.bg} border overflow-hidden shadow-[0_8px_24px_rgba(15,23,42,0.06)]`}
      style={{ borderColor: headerAccent.border }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/40 transition-colors"
        aria-expanded={expanded}
      >
        <div className={`w-11 h-11 rounded-xl ${headerAccent.iconBg} border flex items-center justify-center shrink-0 shadow-sm`} style={{ borderColor: headerAccent.border }}>
          <ShieldAlert size={20} color={headerAccent.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] mb-0.5" style={{ color: headerAccent.iconColor }}>
            Case Strength Insights
          </div>
          <h3 className="text-[15px] font-bold leading-snug" style={{ color: headerAccent.label }}>
            {allFlags.length} risk signal{allFlags.length === 1 ? "" : "s"} need{allFlags.length === 1 ? "s" : ""} your attention
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: SEV.critical.chipBg, color: SEV.critical.chipFg }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {criticalCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: SEV.warning.chipBg, color: SEV.warning.chipFg }}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {warningCount} warning
              </span>
            )}
            {advisoryCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: SEV.advisory.chipBg, color: SEV.advisory.chipFg }}>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                {advisoryCount} note
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          size={18}
          className="shrink-0 transition-transform"
          style={{ color: headerAccent.iconColor, transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Expanded flag list */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 flex flex-col gap-2 bg-white/60 backdrop-blur-sm border-t" style={{ borderColor: headerAccent.border }}>
          {allFlags.map((f) => (
            <FlagRow key={f.id} flag={f} />
          ))}
          {onOpenEligibility && (
            <button
              onClick={onOpenEligibility}
              className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border text-[12px] font-semibold transition-colors hover:bg-slate-50"
              style={{ borderColor: headerAccent.border, color: headerAccent.label }}
            >
              Review answers in eligibility step
              <ArrowRight size={13} />
            </button>
          )}
          <p className="text-[10px] text-[#a8a29e] leading-snug italic text-center mt-1">
            Advisory only — not legal advice. Consult a licensed immigration attorney.
          </p>
        </div>
      )}
    </div>
  );
}

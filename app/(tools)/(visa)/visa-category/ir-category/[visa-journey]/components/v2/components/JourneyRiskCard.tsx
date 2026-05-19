"use client";

/**
 * JourneyRiskCard — Case Strength side-panel card showing INA-level risks.
 * Matches DocCaseStrengthMeter design system for visual consistency.
 *
 * Driven entirely by eligibility quest answers + consistency baseline.
 * Same collapsible header pattern, same typography, same color language.
 */

import React, { useMemo, useState } from "react";
import {
  ShieldAlert, AlertTriangle, Info, ChevronDown, ArrowRight,
  ShieldCheck, Sparkles,
} from "lucide-react";
import {
  detectRiskFlags,
  detectRiskFlagsFromEligibilityQuest,
  type RiskFlag,
} from "@/lib/case-strength";

interface JourneyRiskCardProps {
  metadata: Record<string, any> | null | undefined;
  onOpenEligibility?: () => void;
  defaultCollapsed?: boolean;
  contextLabel?: string;
}

// ─── Shared severity styling (matches DocCaseStrengthMeter palette) ──────────

const SEV: Record<
  RiskFlag["severity"],
  { rowBg: string; rowBorder: string; titleColor: string; fg: string; chipBg: string; chipFg: string; label: string; iconColor: string; Icon: React.ComponentType<{ size?: number; color?: string; className?: string }> }
> = {
  critical: { rowBg: "#fff8f8", rowBorder: "#fecaca", titleColor: "#991b1b", fg: "#7f1d1d", chipBg: "#fee2e2", chipFg: "#7f1d1d", label: "Critical", iconColor: "#dc2626", Icon: ShieldAlert },
  warning:  { rowBg: "#fffdf5", rowBorder: "#fde68a", titleColor: "#92400e", fg: "#78350f", chipBg: "#fef3c7", chipFg: "#78350f", label: "Warning",  iconColor: "#d97706", Icon: AlertTriangle },
  advisory: { rowBg: "#f8fbff", rowBorder: "#bfdbfe", titleColor: "#1e40af", fg: "#1e3a8a", chipBg: "#dbeafe", chipFg: "#1e3a8a", label: "Note",     iconColor: "#3b82f6", Icon: Info },
};

// ─── Risk indicator (mirrors DocCaseStrengthMeter's ScoreRing visual weight) ──

function RiskIndicator({ count, color, label }: { count: number; color: string; label: string }) {
  return (
    <div className="relative shrink-0 flex flex-col items-center justify-center" style={{ width: 64, height: 64 }}>
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center border-2"
        style={{ borderColor: color, background: `${color}10` }}
      >
        <span className="text-[16px] font-black leading-none" style={{ color }}>{count}</span>
      </div>
      <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  );
}

function FlagRow({ flag }: { flag: RiskFlag }) {
  const [open, setOpen] = useState(false);
  const s = SEV[flag.severity];
  const Icon = s.Icon;
  return (
    <div className="rounded-[10px] border overflow-hidden" style={{ borderColor: s.rowBorder, background: s.rowBg }}>
      <button
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:brightness-[0.98] transition-all"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Icon size={13} color={s.iconColor} />
        <span className="flex-1 text-[11.5px] font-semibold leading-snug" style={{ color: s.titleColor }}>
          {flag.title}
        </span>
        <ChevronDown
          size={12} color={s.iconColor} className="shrink-0"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        />
      </button>
      {open && (
        <div className="px-3 pb-2.5 pt-0.5 border-t" style={{ borderColor: s.rowBorder }}>
          <p className="text-[11px] leading-relaxed" style={{ color: s.fg }}>{flag.advisory}</p>
          <p className="text-[9.5px] text-[#a8a29e] mt-1.5 leading-snug">{flag.source_basis}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function JourneyRiskCard({
  metadata,
  onOpenEligibility,
  defaultCollapsed = false,
  contextLabel = "Case Strength",
}: JourneyRiskCardProps) {
  const [open, setOpen] = useState(!defaultCollapsed);

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
      if (!seen.has(f.id)) { seen.add(f.id); out.push(f); }
    }
    const order: Record<RiskFlag["severity"], number> = { critical: 0, warning: 1, advisory: 2 };
    return out.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [metadata]);

  const hasAnsweredQuest = !!metadata?.["questAnswers_eligibility-suite"];

  const criticalCount = allFlags.filter((f) => f.severity === "critical").length;
  const warningCount  = allFlags.filter((f) => f.severity === "warning").length;
  const advisoryCount = allFlags.filter((f) => f.severity === "advisory").length;

  // ── State derivation ─────────────────────────────────────────────────────
  let stateLabel: string;
  let stateColor: string;
  let stateText: string;
  let StateIcon: React.ComponentType<{ size?: number; color?: string; className?: string }>;

  if (!hasAnsweredQuest) {
    stateLabel = "Not Started";
    stateColor = "#0284c7";
    stateText  = "Complete eligibility check to surface risks";
    StateIcon  = Sparkles;
  } else if (allFlags.length === 0) {
    stateLabel = "Clean";
    stateColor = "#059669";
    stateText  = "No INA-level risks detected";
    StateIcon  = ShieldCheck;
  } else if (criticalCount > 0) {
    stateLabel = "Critical";
    stateColor = "#dc2626";
    stateText  = `${allFlags.length} risk${allFlags.length === 1 ? "" : "s"} need attention`;
    StateIcon  = ShieldAlert;
  } else if (warningCount > 0) {
    stateLabel = "Warning";
    stateColor = "#d97706";
    stateText  = `${allFlags.length} warning${allFlags.length === 1 ? "" : "s"} to review`;
    StateIcon  = AlertTriangle;
  } else {
    stateLabel = "Note";
    stateColor = "#3b82f6";
    stateText  = `${allFlags.length} advisor${allFlags.length === 1 ? "y" : "ies"}`;
    StateIcon  = Info;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

      {/* ── Compact header (always visible) — matches DocCaseStrengthMeter ─── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/60 transition-colors"
        style={{ background: open ? "white" : "#fafbfc" }}
        aria-expanded={open}
      >
        {/* Indicator — matches ScoreRing dimensions in DocCaseStrengthMeter */}
        {hasAnsweredQuest && allFlags.length > 0 ? (
          <RiskIndicator count={allFlags.length} color={stateColor} label="risks" />
        ) : (
          <div className="relative shrink-0 flex items-center justify-center" style={{ width: 64, height: 64 }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2"
              style={{ borderColor: stateColor, background: `${stateColor}10` }}>
              <StateIcon size={20} color={stateColor} />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 leading-tight">
            {contextLabel}
          </div>
          <div className="text-[13.5px] font-extrabold text-slate-900 leading-tight mt-0.5 truncate">
            INA Risk Signals
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full whitespace-nowrap"
              style={{ background: `${stateColor}15`, color: stateColor, border: `1px solid ${stateColor}33` }}
            >
              {stateLabel}
            </span>
            <span className="text-[10px] text-slate-500 truncate">{stateText}</span>
          </div>
        </div>
        <ChevronDown
          size={15}
          className="text-slate-400 shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
        />
      </button>

      {/* ── Expanded body ───────────────────────────────────────────────── */}
      {open && (
        <div className="border-t border-slate-100 p-3 flex flex-col gap-2.5 bg-[#fafbfc]">

          {/* Severity counts row — only when risks present */}
          {hasAnsweredQuest && allFlags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
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
          )}

          {/* Flag rows */}
          {hasAnsweredQuest && allFlags.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {allFlags.map((f) => <FlagRow key={f.id} flag={f} />)}
            </div>
          )}

          {/* CTA — no quest done yet */}
          {!hasAnsweredQuest && onOpenEligibility && (
            <button
              onClick={onOpenEligibility}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white text-[11.5px] font-semibold transition-colors"
            >
              Start eligibility check <ArrowRight size={12} />
            </button>
          )}

          {/* Review CTA — when risks present */}
          {hasAnsweredQuest && allFlags.length > 0 && onOpenEligibility && (
            <button
              onClick={onOpenEligibility}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-[10.5px] font-semibold text-slate-700"
            >
              Review answers <ArrowRight size={11} />
            </button>
          )}

          <p className="text-[9.5px] text-slate-400 text-center italic px-2">
            Advisory only — not legal advice.
          </p>
        </div>
      )}
    </div>
  );
}

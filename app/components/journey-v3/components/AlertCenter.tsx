"use client";

/**
 * AlertCenter — Slim left sidebar showing ONLY critical and warning issues.
 *
 * Removes informational, resolved, evidence categories, and scores from
 * the old sidebar. Shows a clean, scannable list of actionable items.
 *
 * Displays:
 * - Count summary: Critical (N) · Warnings (N)
 * - Expandable issue rows with "Go to step" CTA
 * - "All clear" state when no critical/warning issues
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircleAlert, AlertTriangle, ShieldCheck, ChevronRight, ChevronDown } from "lucide-react";
import type { AggregatedIssue } from "@/lib/case-strength/aggregate-issues";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface AlertCenterProps {
  /** All issues (will be filtered to critical + warning only) */
  issues: AggregatedIssue[];
  onOpenStep?: (chapterIdx: number, stepIdx: number) => void;
  /** Opens the Case Strength score breakdown — used by `score-drop` alerts (§6C). */
  onViewScore?: () => void;
  /** Before the user has started, show a neutral cue instead of "All clear". */
  notStarted?: boolean;
}

// ─── Severity styles ─────────────────────────────────────────────────────────────

const SEV = {
  critical: {
    accent: "#DC2626",
    rowBg: "#FEF2F2",
    expandedBg: "#FEE2E2",
    chipBg: "#FEF2F2",
    chipFg: "#DC2626",
    border: "#EF4444",
    icon: CircleAlert,
  },
  warning: {
    accent: "#D97706",
    rowBg: "#FFF7ED",
    expandedBg: "#FFEDD5",
    chipBg: "#FFF7ED",
    chipFg: "#D97706",
    border: "#F59E0B",
    icon: AlertTriangle,
  },
};

// ─── Issue Row ────────────────────────────────────────────────────────────────────

function AlertRow({
  issue,
  expanded,
  onToggle,
  onOpenStep,
  onViewScore,
}: {
  issue: AggregatedIssue;
  expanded: boolean;
  onToggle: () => void;
  onOpenStep?: () => void;
  onViewScore?: () => void;
}) {
  const isScoreDrop = issue.kind === "score-drop";
  const s = SEV[issue.level as "critical" | "warning"];
  const Icon = s.icon;
  const stepLabel = issue.stepName
    ? issue.stepName.replace(/^(Chapter\s*\d+[:\s-]*|Step\s*\d+[:\s-]*)/i, "").trim() ||
      issue.stepName
    : `Step ${issue.stepNumber}`;

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
        background: expanded ? s.expandedBg : s.rowBg,
        border: `1px solid ${s.border}`,
        boxShadow: expanded
          ? `0 2px 8px ${s.accent}15, inset 0 1px 0 rgba(255,255,255,0.6)`
          : `0 1px 3px ${s.accent}10`,
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors"
        style={{
          background: expanded ? "transparent" : undefined,
        }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border"
          style={{
            background: s.chipBg,
            borderColor: s.border,
            color: s.accent,
          }}
        >
          <Icon size={13} strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[11px] font-bold leading-snug"
            style={{ color: issue.level === "critical" ? "#991B1B" : "#92400E" }}
          >
            {issue.title}
          </p>
          <span
            className="inline-block mt-1.5 text-[8.5px] font-bold px-2 py-0.5 rounded-md border"
            style={{
              background: s.chipBg,
              color: s.chipFg,
              borderColor: `${s.border}80`,
            }}
          >
            {stepLabel}
          </span>
        </div>
        <ChevronDown
          size={12}
          className="shrink-0 mt-1 text-slate-400 transition-transform duration-200"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)" }}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0.5 space-y-2 border-t" style={{ borderColor: `${s.border}40` }}>
              {issue.hint && (
                <p className="text-[10.5px] text-slate-600 leading-relaxed pt-2">{issue.hint}</p>
              )}
              {isScoreDrop
                ? onViewScore && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewScore();
                      }}
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold rounded-lg px-2.5 py-1.5 transition-all border hover:brightness-95"
                      style={{ background: s.chipBg, color: s.chipFg, borderColor: s.border }}
                    >
                      View breakdown <ChevronRight size={10} />
                    </button>
                  )
                : onOpenStep && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenStep();
                      }}
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold rounded-lg px-2.5 py-1.5 transition-all border hover:brightness-95"
                      style={{
                        background: s.chipBg,
                        color: s.chipFg,
                        borderColor: s.border,
                      }}
                    >
                      Go to step <ChevronRight size={10} />
                    </button>
                  )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────────

export function AlertCenter({ issues, onOpenStep, onViewScore, notStarted }: AlertCenterProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // Filter to critical + warning only, exclude resolved
  const activeIssues = issues.filter(
    (i) => (i.level === "critical" || i.level === "warning") && !i.resolved
  );

  const critCount = activeIssues.filter((i) => i.level === "critical").length;
  const warnCount = activeIssues.filter((i) => i.level === "warning").length;

  // Empty state
  if (activeIssues.length === 0) {
    // Not started yet → don't imply the case was assessed and is fine. Show a
    // neutral "will populate" cue instead of "All clear".
    if (notStarted) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            <ShieldCheck size={15} className="text-slate-400" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold text-slate-500">No alerts yet</div>
            <div className="text-[9.5px] text-slate-400 mt-0.5">
              Alerts will appear here as you work through your steps.
            </div>
          </div>
        </div>
      );
    }
    // All clear state
    return (
      <div className="rounded-2xl border border-[#afdbdb]/40 bg-gradient-to-br from-[#e6f5f5]/60 to-[#f7fafa] px-4 py-4 flex items-center gap-3 shadow-sm">
        <div className="w-8 h-8 rounded-xl bg-[#e6f5f5] border border-[#afdbdb]/50 flex items-center justify-center shrink-0">
          <ShieldCheck size={15} className="text-[#0d7377]" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-extrabold text-[#0d7377]">All clear</div>
          <div className="text-[9.5px] text-[#89a4a0] mt-0.5">No critical or warning issues</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#f4f6f7] overflow-hidden shadow-md">
      {/* Header */}
      <div
        className="px-4 py-3.5 border-b border-slate-200/60"
        style={{
          background:
            critCount > 0
              ? "linear-gradient(135deg, #FEF2F2 0%, #FFF7ED 100%)"
              : "linear-gradient(135deg, #FFF7ED 0%, #FFFBEB 100%)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center border"
            style={{
              background: critCount > 0 ? "#FEF2F2" : "#FFF7ED",
              borderColor: critCount > 0 ? "#EF4444" : "#F59E0B",
              color: critCount > 0 ? "#DC2626" : "#D97706",
            }}
          >
            {critCount > 0 ? (
              <CircleAlert size={12} strokeWidth={2.5} />
            ) : (
              <AlertTriangle size={12} strokeWidth={2.5} />
            )}
          </div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
            Alert Center
          </h3>
        </div>

        {/* Severity count badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {critCount > 0 && (
            <span
              className="text-[9px] font-bold px-2.5 py-1 rounded-full border"
              style={{
                background: "#FEF2F2",
                color: "#DC2626",
                borderColor: "#EF4444",
              }}
            >
              {critCount} Critical Issue{critCount !== 1 ? "s" : ""}
            </span>
          )}
          {warnCount > 0 && (
            <span
              className="text-[9px] font-bold px-2.5 py-1 rounded-full border"
              style={{
                background: "#FFF7ED",
                color: "#D97706",
                borderColor: "#F59E0B",
              }}
            >
              {warnCount} Warning{warnCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Issue list */}
      <div className="p-2.5 space-y-2 max-h-[600px] overflow-y-auto">
        {activeIssues.map((issue, i) => (
          <AlertRow
            key={`${issue.stepKey}-${i}`}
            issue={issue}
            expanded={expandedIdx === i}
            onToggle={() => setExpandedIdx((cur) => (cur === i ? null : i))}
            onOpenStep={onOpenStep ? () => onOpenStep(issue.chapterIdx, issue.stepIdx) : undefined}
            onViewScore={onViewScore}
          />
        ))}
      </div>
    </div>
  );
}

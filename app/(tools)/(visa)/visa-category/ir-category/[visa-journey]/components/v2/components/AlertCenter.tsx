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
}

// ─── Severity styles ─────────────────────────────────────────────────────────────

const SEV = {
  critical: {
    accent: "#db8090",
    rowBg: "#fef0f3",
    expandedBg: "#fce8ed",
    chipBg: "#f9d4dc",
    chipFg: "#7a3a4a",
    icon: CircleAlert,
  },
  warning: {
    accent: "#cdadcc",
    rowBg: "#f7eef7",
    expandedBg: "#f0e3f0",
    chipBg: "#e8d4e8",
    chipFg: "#6b4566",
    icon: AlertTriangle,
  },
};

// ─── Issue Row ────────────────────────────────────────────────────────────────────

function AlertRow({
  issue,
  expanded,
  onToggle,
  onOpenStep,
}: {
  issue: AggregatedIssue;
  expanded: boolean;
  onToggle: () => void;
  onOpenStep?: () => void;
}) {
  const s = SEV[issue.level as "critical" | "warning"];
  const Icon = s.icon;
  const stepLabel = issue.stepName
    ? issue.stepName.replace(/^(Chapter\s*\d+[:\s-]*|Step\s*\d+[:\s-]*)/i, "").trim() ||
      issue.stepName
    : `Step ${issue.stepNumber}`;

  return (
    <div
      className="rounded-xl overflow-hidden transition-all shadow-sm"
      style={{
        background: expanded ? s.expandedBg : s.rowBg,
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50/50 transition-colors"
      >
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: s.chipBg }}
        >
          <Icon size={12} style={{ color: s.chipFg }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-slate-800 leading-snug">{issue.title}</p>
          <span
            className="inline-block mt-1 text-[8.5px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: s.chipBg, color: s.chipFg }}
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
            <div className="px-3 pb-3 pt-0.5 space-y-2">
              {issue.hint && (
                <p className="text-[10.5px] text-slate-500 leading-relaxed">{issue.hint}</p>
              )}
              {onOpenStep && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenStep();
                  }}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold rounded-lg px-2.5 py-1.5 transition-all hover:brightness-110"
                  style={{ background: s.chipBg, color: s.chipFg }}
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

export function AlertCenter({ issues, onOpenStep }: AlertCenterProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // Filter to critical + warning only, exclude resolved
  const activeIssues = issues.filter(
    (i) => (i.level === "critical" || i.level === "warning") && !i.resolved
  );

  const critCount = activeIssues.filter((i) => i.level === "critical").length;
  const warnCount = activeIssues.filter((i) => i.level === "warning").length;

  // All clear state
  if (activeIssues.length === 0) {
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
        className="px-4 py-3.5"
        style={{
          background:
            critCount > 0
              ? "linear-gradient(135deg, #fbe8ec 0%, #f5eef5 100%)"
              : "linear-gradient(135deg, #f5eef5 0%, #eef3f5 100%)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{
              background: critCount > 0 ? "#fbe8ec" : "#f5eef5",
            }}
          >
            {critCount > 0 ? (
              <CircleAlert size={11} className="text-[#b85a6a]" />
            ) : (
              <AlertTriangle size={11} className="text-[#8a5a86]" />
            )}
          </div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Alert Center
          </h3>
        </div>

        {/* Count chips */}
        <div className="flex items-center gap-2">
          {critCount > 0 && (
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: SEV.critical.chipBg, color: SEV.critical.chipFg }}
            >
              {critCount} Critical
            </span>
          )}
          {warnCount > 0 && (
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: SEV.warning.chipBg, color: SEV.warning.chipFg }}
            >
              {warnCount} Warning{warnCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Issue list */}
      <div className="p-2.5 space-y-2 max-h-[600px] overflow-y-auto overscroll-contain">
        {activeIssues.map((issue, i) => (
          <AlertRow
            key={`${issue.stepKey}-${i}`}
            issue={issue}
            expanded={expandedIdx === i}
            onToggle={() => setExpandedIdx((cur) => (cur === i ? null : i))}
            onOpenStep={onOpenStep ? () => onOpenStep(issue.chapterIdx, issue.stepIdx) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

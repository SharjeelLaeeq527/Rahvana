"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, AlertTriangle, CircleAlert, Info, ShieldCheck } from "lucide-react";
import type { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import type { UploadedDocument } from "@/lib/document-vault/types";
import {
  aggregateChapter1Issues,
  aggregateChapter2Issues,
  aggregateChapter3Issues,
  type AggregatedIssue,
} from "@/lib/case-strength/aggregate-issues";

interface DashboardCriticalCardProps {
  chapters: any[];
  state: WizardState;
  uploadedDocuments: UploadedDocument[];
  onOpenStep?: (chapterIdx: number, stepIdx: number) => void;
}

const LEVEL: Record<
  AggregatedIssue["level"],
  {
    circleBg: string;
    circleFg: string;
    circleBorder: string;
    activeBg: string;
    chipBg: string;
    chipFg: string;
    chipLabel: string;
    expandBg: string;
    expandBorder: string;
    accentColor: string;
  }
> = {
  critical: {
    circleBg: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
    circleFg: "#fff",
    circleBorder: "transparent",
    activeBg: "#fef2f2",
    chipBg: "#fee2e2",
    chipFg: "#7f1d1d",
    chipLabel: "Fix now",
    expandBg: "#fef7f7",
    expandBorder: "#fecaca",
    accentColor: "#dc2626",
  },
  warning: {
    circleBg: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
    circleFg: "#fff",
    circleBorder: "transparent",
    activeBg: "#fffbeb",
    chipBg: "#fef3c7",
    chipFg: "#78350f",
    chipLabel: "Check",
    expandBg: "#fefcf3",
    expandBorder: "#fde68a",
    accentColor: "#d97706",
  },
  info: {
    circleBg: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
    circleFg: "#fff",
    circleBorder: "transparent",
    activeBg: "#eff6ff",
    chipBg: "#dbeafe",
    chipFg: "#1e3a8a",
    chipLabel: "FYI",
    expandBg: "#f5f9ff",
    expandBorder: "#bfdbfe",
    accentColor: "#3b82f6",
  },
};

function IssueRow({
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
  const s = LEVEL[issue.level];
  const stepLabel = issue.stepName
    ? issue.stepName.replace(/^(Chapter\s*\d+[:\s-]*|Step\s*\d+[:\s-]*)/i, "").trim() ||
      issue.stepName
    : `Step ${issue.stepNumber}`;

  return (
    <div
      className="group w-full text-left rounded-xl transition-all overflow-visible relative cursor-pointer"
      style={{
        backgroundColor: expanded ? s.activeBg : "transparent",
        boxShadow: expanded ? `inset 0 0 0 1px ${s.expandBorder}` : "inset 0 0 0 1px transparent",
      }}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Severity circle indicator */}
        <div
          className="flex items-center justify-center rounded-lg shrink-0 text-xs font-bold"
          style={{
            width: 32,
            height: 32,
            background: s.circleBg,
            color: s.circleFg,
            boxShadow: expanded ? `0 4px 10px -2px ${s.accentColor}40` : "none",
          }}
        >
          {issue.level === "critical" ? (
            <CircleAlert className="w-4 h-4" />
          ) : issue.level === "warning" ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <Info className="w-4 h-4" />
          )}
        </div>

        {/* Label area */}
        <div className="flex-1 min-w-0">
          <p
            className="text-[12.5px] font-semibold truncate"
            style={{ color: expanded ? s.accentColor : "#374151" }}
          >
            {issue.title}
          </p>
          <p className="text-[11px] truncate">
            <span
              className="font-medium px-1 py-0.5 rounded text-[9.5px]"
              style={{ background: s.chipBg, color: s.chipFg }}
            >
              {stepLabel}
            </span>
          </p>
        </div>

        {/* Expand chevron */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="shrink-0 p-1 rounded transition-colors hover:opacity-80"
          style={{ color: s.accentColor }}
        >
          <ChevronRight
            className="w-4 h-4 transition-transform duration-200"
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0)" }}
          />
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="px-3 py-2.5 space-y-2 border-t"
          style={{ background: s.expandBg, borderColor: s.expandBorder }}
        >
          {issue.hint && (
            <p className="text-[11.5px] text-slate-600 leading-relaxed">{issue.hint}</p>
          )}
          {onOpenStep && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenStep();
              }}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold rounded-lg px-3 py-1.5 transition-all hover:brightness-110"
              style={{
                background: s.chipBg,
                color: s.chipFg,
              }}
            >
              Go to {stepLabel}
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function DashboardCriticalCard({
  chapters,
  state,
  uploadedDocuments,
  onOpenStep,
}: DashboardCriticalCardProps) {
  const issues = useMemo(() => {
    const ch1 = aggregateChapter1Issues({ chapters, state, uploadedDocuments });
    const ch2 = aggregateChapter2Issues({ chapters, state, uploadedDocuments });
    const ch3 = aggregateChapter3Issues({ chapters, state, uploadedDocuments });
    const order = { critical: 0, warning: 1, info: 2 };
    return [...ch1, ...ch2, ...ch3].sort((a, b) => {
      if (order[a.level] !== order[b.level]) return order[a.level] - order[b.level];
      return a.chapterIdx - b.chapterIdx;
    });
  }, [chapters, state, uploadedDocuments]);

  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(false); // open by default

  if (issues.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white border border-emerald-200 flex items-center justify-center shrink-0">
          <ShieldCheck size={18} className="text-emerald-600" />
        </div>
        <div className="min-w-0">
          <div className="text-[12.5px] font-extrabold text-emerald-900">All clear</div>
          <div className="text-[11px] text-emerald-700">No issues across your roadmap</div>
        </div>
      </div>
    );
  }

  const critCount = issues.filter((i) => i.level === "critical").length;
  const warnCount = issues.filter((i) => i.level === "warning").length;
  const infoCount = issues.filter((i) => i.level === "info").length;

  return (
    <div className="relative">
      {/* Animated width wrapper — shrinks on collapse like MultiStepForm sidebar */}
      <motion.div
        initial={false}
        animate={{ width: collapsed ? 24 : "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 240 }}
        style={{ minHeight: collapsed ? "calc(100vh - 200px)" : undefined }}
      >
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.97)",
            borderColor: collapsed ? "transparent" : "#e2e8f0",
            boxShadow: collapsed
              ? "none"
              : "4px 0 24px -8px rgba(15, 23, 42, 0.08), 0 4px 20px rgba(15, 23, 42, 0.06)",
          }}
        >
          {!collapsed && (
            <>
              {/* Header — 2 rows */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                {/* Row 1: icon + title + total count */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background:
                          critCount > 0
                            ? "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)"
                            : warnCount > 0
                              ? "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)"
                              : "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
                        boxShadow:
                          critCount > 0
                            ? "0 3px 8px -2px rgba(220, 38, 38, 0.35)"
                            : warnCount > 0
                              ? "0 3px 8px -2px rgba(217, 119, 6, 0.35)"
                              : "0 3px 8px -2px rgba(59, 130, 246, 0.35)",
                      }}
                    >
                      {critCount > 0 ? (
                        <CircleAlert className="w-3.5 h-3.5 text-white" />
                      ) : warnCount > 0 ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                    <h3
                      className="text-[11px] font-bold uppercase tracking-[0.14em]"
                      style={{ color: "#475569" }}
                    >
                      Needs Your Attention
                    </h3>
                    {/* Row 2: total summary (moved here for clarity) */}
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                      {issues.length} items to review
                    </p>
                  </div>
                </div>

                {/* Severity chips */}
                <div className="flex flex-wrap justify-end gap-1.5 pt-2">
                  {critCount > 0 && (
                    <span
                      className="text-[9.5px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{
                        background: LEVEL.critical.chipBg,
                        color: LEVEL.critical.chipFg,
                      }}
                    >
                      {critCount} critical
                    </span>
                  )}

                  {warnCount > 0 && (
                    <span
                      className="text-[9.5px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{
                        background: LEVEL.warning.chipBg,
                        color: LEVEL.warning.chipFg,
                      }}
                    >
                      {warnCount} warning{warnCount !== 1 ? "s" : ""}
                    </span>
                  )}

                  {infoCount > 0 && (
                    <span
                      className="text-[9.5px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{
                        background: LEVEL.info.chipBg,
                        color: LEVEL.info.chipFg,
                      }}
                    >
                      {infoCount} info{infoCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Issue list — scrollable */}
              <div className="p-2 space-y-1.5 max-h-[480px] overflow-y-auto panel-scrollbar overscroll-contain">
                {issues.map((issue, i) => (
                  <IssueRow
                    key={`${issue.stepKey}-${i}`}
                    issue={issue}
                    expanded={expandedIdx === i}
                    onToggle={() => setExpandedIdx((cur) => (cur === i ? null : i))}
                    onOpenStep={
                      onOpenStep ? () => onOpenStep(issue.chapterIdx, issue.stepIdx) : undefined
                    }
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Side drawer tab — outside motion.div so it's never clipped, animates in sync */}
      <motion.button
        onClick={() => setCollapsed((v) => !v)}
        initial={false}
        animate={{ left: collapsed ? 16 : "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 240 }}
        className="absolute top-1/2 -translate-y-1/2 -translate-x-full z-50"
        style={{
          width: 28,
          height: 64,
          background: critCount > 0 ? "#dc2626" : warnCount > 0 ? "#d97706" : "#3b82f6",
          color: "#fff",
          borderTopRightRadius: 12,
          borderBottomRightRadius: 12,
          boxShadow: "2px 2px 10px rgba(0,0,0,0.2)",
        }}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 mx-auto" />
        ) : (
          <ChevronRight className="w-4 h-4 mx-auto rotate-180" />
        )}
      </motion.button>
    </div>
  );
}

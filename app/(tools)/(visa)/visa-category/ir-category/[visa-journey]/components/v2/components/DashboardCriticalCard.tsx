"use client";

/**
 * DashboardCriticalCard — single dashboard card showing ONLY actionable items.
 *
 * Like a car's dashboard: just the warning lights, no full diagnostic readout.
 * Each row is clickable — takes the user to the exact step where they can fix it.
 *
 * Returns null when nothing to flag → keeps the dashboard clean.
 */

import React, { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CircleAlert,
  Info,
  ShieldCheck,
} from "lucide-react";
import type { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import type { UploadedDocument } from "@/lib/document-vault/types";
import {
  aggregateChapter1Issues,
  type AggregatedIssue,
} from "@/lib/case-strength/aggregate-issues";

interface DashboardCriticalCardProps {
  chapters: any[];
  state: WizardState;
  uploadedDocuments: UploadedDocument[];
  /** Called when user clicks an issue row — navigate to that step */
  onOpenStep?: (chapterIdx: number, stepIdx: number) => void;
}

const LEVEL: Record<
  AggregatedIssue["level"],
  { dot: string; iconColor: string; chipBg: string; chipFg: string; chipLabel: string }
> = {
  critical: { dot: "#dc2626", iconColor: "#dc2626", chipBg: "#fee2e2", chipFg: "#7f1d1d", chipLabel: "Fix now" },
  warning:  { dot: "#d97706", iconColor: "#d97706", chipBg: "#fef3c7", chipFg: "#78350f", chipLabel: "Check"  },
  info:     { dot: "#3b82f6", iconColor: "#3b82f6", chipBg: "#dbeafe", chipFg: "#1e3a8a", chipLabel: "FYI"    },
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
  const stepLabel = `Step ${issue.stepIdx + 1}`;

  return (
    <div className="border-b border-slate-100 last:border-0">
      <div className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50/60 transition-colors">
        <span
          className="w-2 h-2 rounded-full shrink-0 mt-1.5"
          style={{ background: s.dot }}
        />
        <div className="flex-1 min-w-0">
          <button
            onClick={onToggle}
            className="w-full flex items-start gap-2 text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="text-[9.5px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0"
                  style={{ background: s.chipBg, color: s.chipFg }}
                >
                  {stepLabel}
                </span>
                <span className="text-[12px] font-semibold text-slate-800 leading-snug">
                  {issue.title}
                </span>
              </div>
              {expanded && issue.hint && (
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                  {issue.hint}
                </p>
              )}
            </div>
            <ChevronDown
              size={12}
              className="text-slate-400 shrink-0 mt-0.5 transition-transform"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)" }}
            />
          </button>
          {expanded && onOpenStep && (
            <button
              onClick={onOpenStep}
              className="inline-flex items-center gap-1 text-[10.5px] font-bold text-blue-700 hover:text-blue-900 hover:underline mt-1.5"
            >
              Go to {stepLabel} <ChevronRight size={10} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardCriticalCard({
  chapters,
  state,
  uploadedDocuments,
  onOpenStep,
}: DashboardCriticalCardProps) {
  const issues = useMemo(
    () => aggregateChapter1Issues({ chapters, state, uploadedDocuments }),
    [chapters, state, uploadedDocuments],
  );

  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [open, setOpen] = useState(false); // card itself collapsed by default

  if (issues.length === 0) {
    // All clean — show a small confirmation card (dashboards do show "OK" sometimes)
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-3">
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
  const headerColor = critCount > 0 ? "#dc2626" : warnCount > 0 ? "#d97706" : "#3b82f6";
  const HeaderIcon  = critCount > 0 ? CircleAlert : warnCount > 0 ? AlertTriangle : Info;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Collapsible header — click to expand the whole card */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-100 transition-colors ${open ? "border-b border-slate-100 bg-slate-50" : "bg-slate-50"}`}
        aria-expanded={open}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${headerColor}15`, border: `1.5px solid ${headerColor}33` }}
        >
          <HeaderIcon size={17} color={headerColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Needs your attention
          </div>
          <div className="text-[13.5px] font-extrabold text-slate-900 leading-tight mt-0.5">
            {issues.length} item{issues.length === 1 ? "" : "s"} to review
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {critCount > 0 && (
            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: LEVEL.critical.chipBg, color: LEVEL.critical.chipFg }}>
              {critCount}c
            </span>
          )}
          {warnCount > 0 && (
            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: LEVEL.warning.chipBg, color: LEVEL.warning.chipFg }}>
              {warnCount}w
            </span>
          )}
        </div>
        <ChevronDown
          size={15}
          className="text-slate-400 shrink-0 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
        />
      </button>

      {/* Rows — only shown when card is expanded */}
      {open && (
        <div>
          {issues.map((issue, i) => (
            <IssueRow
              key={`${issue.stepKey}-${i}`}
              issue={issue}
              expanded={expandedIdx === i}
              onToggle={() => setExpandedIdx((cur) => (cur === i ? null : i))}
              onOpenStep={onOpenStep ? () => onOpenStep(issue.chapterIdx, issue.stepIdx) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

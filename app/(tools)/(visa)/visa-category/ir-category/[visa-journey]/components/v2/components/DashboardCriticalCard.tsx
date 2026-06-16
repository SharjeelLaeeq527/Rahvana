"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  AlertTriangle,
  CircleAlert,
  Info,
  ShieldCheck,
  CheckCircle2,
  X,
  ClipboardList,
  ChevronDown,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import type { UploadedDocument } from "@/lib/document-vault/types";
import {
  aggregateChapter1Issues,
  aggregateChapter2Issues,
  aggregateChapter3Issues,
  type AggregatedIssue,
} from "@/lib/case-strength/aggregate-issues";
import {
  runFullConsistencyAnalysis,
  PHASE2_QUESTIONS,
  type ConsistencyFinding,
  type Phase2Responses,
} from "@/lib/case-strength";

interface DashboardCriticalCardProps {
  chapters: any[];
  state: WizardState;
  uploadedDocuments: UploadedDocument[];
  onOpenStep?: (chapterIdx: number, stepIdx: number) => void;
  phase2Responses?: Record<string, boolean>;
  onPhase2Save?: (responses: Record<string, boolean>) => void;
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
        {/* Severity circle indicator — checkmark when resolved */}
        <div
          className="flex items-center justify-center rounded-lg shrink-0 text-xs font-bold"
          style={{
            width: 32,
            height: 32,
            background: issue.resolved
              ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
              : s.circleBg,
            color: s.circleFg,
            boxShadow: expanded
              ? `0 4px 10px -2px ${issue.resolved ? "#059669" : s.accentColor}40`
              : "none",
          }}
        >
          {issue.resolved ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : issue.level === "critical" ? (
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
            style={{
              color: issue.resolved ? "#059669" : expanded ? s.accentColor : "#374151",
            }}
          >
            {issue.title}
          </p>
          <p className="text-[11px] truncate">
            <span
              className="font-medium px-1 py-0.5 rounded text-[9.5px]"
              style={{
                background: issue.resolved ? "#d1fae5" : s.chipBg,
                color: issue.resolved ? "#065f46" : s.chipFg,
              }}
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
          style={{ color: issue.resolved ? "#059669" : s.accentColor }}
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
          style={{
            background: issue.resolved ? "#ecfdf5" : s.expandBg,
            borderColor: issue.resolved ? "#a7f3d0" : s.expandBorder,
          }}
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
              disabled={issue.resolved}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold rounded-lg px-3 py-1.5 transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
              style={{
                background: issue.resolved ? "#d1fae5" : s.chipBg,
                color: issue.resolved ? "#065f46" : s.chipFg,
              }}
            >
              {issue.resolved ? "Already addressed" : `Go to ${stepLabel}`}
              {!issue.resolved && <ChevronRight className="w-3 h-3" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Phase 2 Questionnaire Modal ──────────────────────────────────────────────

function Phase2Modal({
  isOpen,
  onClose,
  responses,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  responses: Record<string, boolean>;
  onSave: (responses: Record<string, boolean>) => void;
}) {
  const [local, setLocal] = useState<Record<string, boolean>>(responses);

  // Initialize expanded groups: expand groups with answers, or first group if none answered
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const q of PHASE2_QUESTIONS) {
      if (responses[q.id]) {
        initial.add(q.group);
      }
    }
    // If no answers yet, expand the first group by default
    if (initial.size === 0 && PHASE2_QUESTIONS.length > 0) {
      initial.add(PHASE2_QUESTIONS[0].group);
    }
    return initial;
  });

  const grouped: Record<string, (typeof PHASE2_QUESTIONS)[number][]> = {};
  for (const q of PHASE2_QUESTIONS) {
    if (!grouped[q.group]) grouped[q.group] = [];
    grouped[q.group].push(q);
  }

  const isVisible = (q: (typeof PHASE2_QUESTIONS)[number]): boolean => {
    if (!("dependsOn" in q) || !q.dependsOn) return true;
    return !!local[q.dependsOn as string];
  };

  const toggle = (id: string) => {
    setLocal((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const question = PHASE2_QUESTIONS.find((q) => q.id === id);
      if (question && !next[id]) {
        for (const child of PHASE2_QUESTIONS) {
          if ("dependsOn" in child && child.dependsOn === id) next[child.id] = false;
        }
      }
      return next;
    });
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  // Count answered questions
  const answeredCount = Object.values(local).filter(Boolean).length;
  const totalQuestions = PHASE2_QUESTIONS.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl w-[95vw] p-0 overflow-hidden border-none rounded-[28px] shadow-2xl">
        <div className="relative overflow-hidden bg-white">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

          <div className="relative">
            {/* Header */}
            <div className="px-8 pt-8 pb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <ClipboardList size={24} />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-[#0f1f38]">
                      Consistency Analysis
                    </DialogTitle>
                    <p className="text-sm text-[#6b8097] mt-0.5">
                      Answer optional questions for deeper analysis
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-[#6b8097]" />
                </button>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-[#6b8097]">
                  {answeredCount}/{totalQuestions}
                </span>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[50vh] px-8 pb-6 space-y-4">
              {Object.entries(grouped).map(([group, questions]) => {
                const visible = questions.filter(isVisible);
                if (visible.length === 0) return null;
                const groupAnswered = visible.filter((q) => local[q.id]).length;
                const isExpanded = expandedGroups.has(group);

                return (
                  <div
                    key={group}
                    className="rounded-2xl border border-[#d0e4f7]/60 bg-[#f8fbff] overflow-hidden"
                  >
                    <button
                      onClick={() => toggleGroup(group)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f0f7ff] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white border border-[#d0e4f7] flex items-center justify-center">
                          <ClipboardList className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-sm font-semibold text-[#0f1f38]">{group}</h4>
                          <p className="text-[11px] text-[#6b8097]">
                            {groupAnswered}/{visible.length} answered
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className="w-5 h-5 text-[#6b8097] transition-transform"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-4 space-y-2">
                            {visible.map((q) => (
                              <div
                                key={q.id}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                                  local[q.id]
                                    ? "bg-white border-primary/30 shadow-sm"
                                    : "bg-white/60 border-[#d0e4f7]/40 hover:border-[#d0e4f7]"
                                }`}
                              >
                                <div className="flex-1 min-w-0 mr-4">
                                  <p className="text-[13px] font-medium text-[#0f1f38]">
                                    {q.question}
                                  </p>
                                  <p className="text-[11px] text-[#6b8097] mt-1 leading-relaxed">
                                    {q.description}
                                  </p>
                                </div>
                                <button
                                  onClick={() => toggle(q.id)}
                                  className={`shrink-0 w-12 h-7 rounded-full transition-all duration-200 ${
                                    local[q.id]
                                      ? "bg-primary shadow-[0_2px_8px_rgba(13,148,136,0.3)]"
                                      : "bg-slate-200"
                                  }`}
                                >
                                  <div
                                    className={`w-5.5 h-5.5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                                      local[q.id] ? "translate-x-[22px]" : "translate-x-[3px]"
                                    }`}
                                    style={{ width: 22, height: 22 }}
                                  />
                                </button>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-[#d0e4f7]/50 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-full border border-[#d0e4f7] text-sm font-semibold text-[#6b8097] hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onSave(local);
                  onClose();
                }}
                className="flex-1 py-3 rounded-full text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-colors shadow-[0_4px_12px_rgba(13,148,136,0.25)]"
              >
                Save & Analyze
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Helper: Convert ConsistencyFinding → AggregatedIssue ─────────────────────

function findingToIssue(finding: ConsistencyFinding, chapters: any[]): AggregatedIssue {
  const levelMap: Record<string, AggregatedIssue["level"]> = {
    critical: "critical",
    warning: "warning",
    informational: "info",
  };

  // Parse actionableStepKey "step_X_Y" → chapterIdx/stepIdx
  let chapterIdx = 0;
  let stepIdx = 0;
  let stepName = finding.category.replace(/_/g, " ");
  let stepNumber = 0;

  if (finding.actionableStepKey) {
    const match = finding.actionableStepKey.match(/step_(\d+)_(\d+)/);
    if (match) {
      const chapNum = parseInt(match[1], 10) - 1; // 0-indexed
      const stepNum = parseInt(match[2], 10);

      // Look up in chapters array
      if (chapters[chapNum]?.steps) {
        chapterIdx = chapNum;
        const foundIdx = chapters[chapNum].steps.findIndex(
          (s: any) => s.step_key === finding.actionableStepKey
        );
        stepIdx = foundIdx >= 0 ? foundIdx : stepNum - 1;
        stepName = chapters[chapNum].steps[stepIdx]?.step_name ?? stepName;
        stepNumber = chapters[chapNum].steps[stepIdx]?.step_number ?? stepNum;
      }
    }
  }

  return {
    level: levelMap[finding.severity] ?? "info",
    title: finding.title,
    hint: `${finding.description}\n\nHow to resolve: ${finding.resolution}`,
    stepKey: finding.actionableStepKey ?? "unknown",
    stepName,
    stepNumber,
    chapterIdx,
    stepIdx,
    resolved: finding.resolved ?? false,
  };
}

export function DashboardCriticalCard({
  chapters,
  state,
  uploadedDocuments,
  onOpenStep,
  phase2Responses,
  onPhase2Save,
}: DashboardCriticalCardProps) {
  const [showPhase2Modal, setShowPhase2Modal] = useState(false);

  const issues = useMemo(() => {
    // Existing chapter-based issues
    const ch1 = aggregateChapter1Issues({ chapters, state, uploadedDocuments });
    const ch2 = aggregateChapter2Issues({ chapters, state, uploadedDocuments });
    const ch3 = aggregateChapter3Issues({ chapters, state, uploadedDocuments });

    // Consistency intelligence findings (Phase 1 + Phase 2)
    const eligibilityAnswers =
      (state.answers?.["eligibility-suite"] as any) ??
      (state.metadata?.["questAnswers_eligibility-suite"] as any);

    const consistencyFindings = runFullConsistencyAnalysis(
      { state, eligibilityAnswers },
      (phase2Responses as Phase2Responses) ?? null,
      uploadedDocuments
    );

    // Convert findings to AggregatedIssue format, deduplicating by stepKey+title
    // and by semantic overlap (same step + similar topic)
    const existingKeys = new Set([...ch1, ...ch2, ...ch3].map((i) => `${i.stepKey}:${i.title}`));

    // Also track step keys that have prior marriage doc findings (civil docs checker)
    const priorMarriageStepKeys = new Set(
      [...ch1, ...ch2, ...ch3]
        .filter(
          (i) =>
            i.title.toLowerCase().includes("prior marriage") ||
            i.title.toLowerCase().includes("termination")
        )
        .map((i) => i.stepKey)
    );

    const consistencyIssues = consistencyFindings
      .map((f) => findingToIssue(f, chapters))
      .filter((issue) => {
        // Skip if exact match exists
        if (existingKeys.has(`${issue.stepKey}:${issue.title}`)) return false;
        // Skip Phase 2 prior marriage termination finding if civil docs already covers it
        if (
          issue.stepKey === "step_2_4" &&
          (issue.title.toLowerCase().includes("termination") ||
            issue.title.toLowerCase().includes("prior marriage")) &&
          priorMarriageStepKeys.has("step_2_4")
        ) {
          return false;
        }
        return true;
      });

    const all = [...ch1, ...ch2, ...ch3, ...consistencyIssues];
    const order = { critical: 0, warning: 1, info: 2 };
    return all.sort((a, b) => {
      // Resolved items always at the bottom, regardless of level
      if (!!a.resolved !== !!b.resolved) return a.resolved ? 1 : -1;
      // Then sort by severity level
      if (order[a.level] !== order[b.level]) return order[a.level] - order[b.level];
      // Then by chapter
      return a.chapterIdx - b.chapterIdx;
    });
  }, [chapters, state, uploadedDocuments, phase2Responses]);

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

  // Exclude resolved items from severity counts
  const critCount = issues.filter((i) => i.level === "critical" && !i.resolved).length;
  const warnCount = issues.filter((i) => i.level === "warning" && !i.resolved).length;
  const infoCount = issues.filter((i) => i.level === "info" && !i.resolved).length;
  const resolvedCount = issues.filter((i) => i.resolved).length;

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
                      {issues.filter((i) => !i.resolved).length} items to review
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

                  {resolvedCount > 0 && (
                    <span
                      className="text-[9.5px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{
                        background: "#d1fae5",
                        color: "#065f46",
                      }}
                    >
                      {resolvedCount} addressed
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

              {/* Improve Analysis button — Phase 2 questionnaire */}
              {onPhase2Save && (
                <div className="px-2 pb-2">
                  <button
                    onClick={() => setShowPhase2Modal(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed transition-colors hover:border-solid"
                    style={{ borderColor: "#0d737740", color: "#0d7377" }}
                  >
                    <ClipboardList size={13} />
                    <span className="text-[10.5px] font-semibold">
                      {phase2Responses && Object.values(phase2Responses).some(Boolean)
                        ? "Update Analysis"
                        : "Improve Analysis"}
                    </span>
                  </button>
                </div>
              )}
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

      {/* Phase 2 Questionnaire Modal */}
      <Phase2Modal
        isOpen={showPhase2Modal}
        onClose={() => setShowPhase2Modal(false)}
        responses={phase2Responses ?? {}}
        onSave={(responses) => onPhase2Save?.(responses)}
      />
    </div>
  );
}

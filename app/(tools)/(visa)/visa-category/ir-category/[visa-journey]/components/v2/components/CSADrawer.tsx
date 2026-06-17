"use client";

/**
 * CSADrawer — Slide-out drawer for detailed CSA analysis.
 *
 * Navigation tabs:
 * - Overview (Case Summary narrative)
 * - Evidence Analysis (EvidenceGapCard inline)
 * - Consistency Analysis (Phase 2 questionnaire)
 * - Recommendations
 *
 * Renders as a fixed right-side overlay with backdrop.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  BarChart3,
  GitCompare,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import type { CaseNarrative, NarrativeBullet } from "@/lib/case-strength";
import type { EvidenceGapAnalysis } from "@/lib/journey/evidence-gap";

// ─── Types ──────────────────────────────────────────────────────────────────────

type CSATab = "overview" | "evidence" | "consistency";

export interface CSADrawerProps {
  isOpen: boolean;
  onClose: () => void;
  narrative: CaseNarrative | null;
  evidenceAnalysis: EvidenceGapAnalysis | null;
  evidenceLoading?: boolean;
  healthStatus: {
    status: "excellent" | "good" | "needs-attention" | "critical";
    label: string;
    color: string;
  } | null;
  /** Called when user wants to open the evidence questionnaire */
  onOpenEvidenceQuestionnaire?: () => void;
  evidenceAnswered?: number;
  /** Called when user wants to open the Phase 2 questionnaire */
  onOpenPhase2?: () => void;
  phase2Answered?: number;
}

// ─── Tab Config ─────────────────────────────────────────────────────────────────

const TABS: { id: CSATab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "evidence", label: "Evidence", icon: BarChart3 },
  { id: "consistency", label: "Consistency", icon: GitCompare },
];

// ─── Health badge style ──────────────────────────────────────────────────────────

const HEALTH_STYLES = {
  excellent: { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46" },
  good: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af" },
  "needs-attention": { bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
  critical: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b" },
};

// ─── Narrative Bullet Item ───────────────────────────────────────────────────────

function BulletItem({
  item,
  color,
  bgColor,
  icon,
}: {
  item: NarrativeBullet;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border px-3.5 py-3 flex gap-3"
      style={{ background: bgColor, borderColor: `${color}30` }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${color}20` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-slate-800">{item.text}</p>
        {item.detail && (
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.detail}</p>
        )}
        {item.source === "consistency" && (
          <span className="inline-block mt-1.5 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
            CI Finding
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Category Level Badge ─────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  STRONG: { bg: "#d1fae5", text: "#065f46", label: "Strong" },
  MODERATE: { bg: "#dbeafe", text: "#1e40af", label: "Moderate" },
  WEAK: { bg: "#fef3c7", text: "#92400e", label: "Weak" },
  MISSING: { bg: "#fee2e2", text: "#991b1b", label: "Missing" },
};

// ─── Main Component ──────────────────────────────────────────────────────────────

export function CSADrawer({
  isOpen,
  onClose,
  narrative,
  evidenceAnalysis,
  evidenceLoading,
  healthStatus,
  onOpenEvidenceQuestionnaire,
  evidenceAnswered = 0,
  onOpenPhase2,
  phase2Answered = 0,
}: CSADrawerProps) {
  const [activeTab, setActiveTab] = useState<CSATab>("overview");

  const healthStyle = healthStatus
    ? HEALTH_STYLES[healthStatus.status]
    : HEALTH_STYLES["needs-attention"];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — starts below the site header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 right-0 bottom-0 top-[80px] z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer — offset below the site header */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 300 }}
            className="fixed right-0 top-[80px] bottom-0 z-50 w-[calc(100%-2rem)] sm:w-full max-w-[520px] bg-white shadow-2xl flex flex-col rounded-tl-2xl"
          >
            {/* Header */}
            <div className="shrink-0 px-5 sm:px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-black text-slate-900">Case Analysis</h2>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Overview · Evidence Gap · Consistency Intelligence
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <X size={16} className="text-slate-500" />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        isActive
                          ? "bg-white text-primary shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <Icon size={11} />
                      <span className="hidden min-[400px]:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-5 space-y-5">
              {/* ─── Overview Tab ─── */}
              {activeTab === "overview" && (
                <>
                  {/* Health snapshot */}
                  {healthStatus && (
                    <div
                      className="rounded-xl border p-4"
                      style={{ background: healthStyle.bg, borderColor: healthStyle.border }}
                    >
                      <div
                        className="text-[9px] font-bold uppercase tracking-widest mb-2"
                        style={{ color: `${healthStyle.text}80` }}
                      >
                        Overall Health
                      </div>
                      <div className="text-lg font-black" style={{ color: healthStyle.text }}>
                        {healthStatus.label}
                      </div>
                    </div>
                  )}

                  {/* Executive Summary */}
                  {narrative && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                        Executive Summary
                      </div>
                      <p className="text-[12.5px] text-slate-700 leading-relaxed">
                        {narrative.executiveSummary}
                      </p>
                      <div className="mt-3 text-[9px] text-slate-400">
                        Generated {new Date(narrative.generatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {/* Strengths */}
                  {narrative && narrative.strengths.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={13} className="text-emerald-500" />
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                          Strengths ({narrative.strengths.length})
                        </h3>
                      </div>
                      <div className="space-y-1.5">
                        {narrative.strengths.map((item, i) => (
                          <BulletItem
                            key={i}
                            item={item}
                            color="#10b981"
                            bgColor="#f0fdf4"
                            icon={<CheckCircle2 size={12} className="text-emerald-500" />}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Next Steps (quick preview) */}
                  {narrative && narrative.recommendedNextSteps.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ArrowRight size={13} className="text-blue-500" />
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                          Next Steps ({narrative.recommendedNextSteps.length})
                        </h3>
                      </div>
                      <div className="space-y-1.5">
                        {narrative.recommendedNextSteps.slice(0, 3).map((item, i) => (
                          <BulletItem
                            key={i}
                            item={item}
                            color="#3b82f6"
                            bgColor="#eff6ff"
                            icon={<ArrowRight size={12} className="text-blue-500" />}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ─── Evidence Analysis Tab ─── */}
              {activeTab === "evidence" && (
                <>
                  {evidenceLoading ? (
                    <div className="text-center py-12">
                      <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto mb-3" />
                      <p className="text-sm text-slate-400">Running analysis...</p>
                    </div>
                  ) : evidenceAnalysis ? (
                    <>
                      {/* Score */}
                      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 flex items-center gap-4">
                        <div className="text-4xl font-black text-indigo-600">
                          {evidenceAnalysis.overallScore}
                        </div>
                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 mb-1">
                            Overall Evidence Score
                          </div>
                          <div className="w-32 h-2 bg-indigo-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                              style={{ width: `${evidenceAnalysis.overallScore}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Category Breakdown */}
                      <div className="space-y-2">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                          Category Breakdown
                        </h3>
                        {Object.entries(evidenceAnalysis.categories).map(([cat, assessment]) => {
                          const level = assessment.level;
                          const style = LEVEL_COLORS[level] ?? LEVEL_COLORS.MODERATE;
                          return (
                            <div
                              key={cat}
                              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white"
                            >
                              <div>
                                <div className="text-[12px] font-semibold text-slate-800 capitalize">
                                  {cat.replace(/_/g, " ")}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {assessment.items.length} item
                                  {assessment.items.length !== 1 ? "s" : ""} found
                                </div>
                              </div>
                              <span
                                className="text-[9px] font-bold uppercase px-2 py-1 rounded-full"
                                style={{ background: style.bg, color: style.text }}
                              >
                                {style.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Required Documents */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                          Required Documents
                        </h3>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{
                                width: `${evidenceAnalysis.requiredDocuments.completionPercentage}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600">
                            {evidenceAnalysis.requiredDocuments.found}/
                            {evidenceAnalysis.requiredDocuments.total}
                          </span>
                        </div>
                        {evidenceAnalysis.requiredDocuments.missing.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <div className="text-[9px] font-bold uppercase text-red-400 tracking-widest">
                              Missing ({evidenceAnalysis.requiredDocuments.missing.length})
                            </div>
                            {evidenceAnalysis.requiredDocuments.missing.slice(0, 5).map((d, i) => (
                              <div
                                key={i}
                                className="text-[11px] text-red-600 flex items-center gap-1.5"
                              >
                                <AlertCircle size={10} className="shrink-0" />
                                {d.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Improve Evidence Analysis CTA — opens evidence questionnaire */}
                      {onOpenEvidenceQuestionnaire && (
                        <div className="rounded-xl border-2 border-dashed border-indigo-300/50 p-4 bg-indigo-50/50">
                          <div className="flex items-center gap-3 mb-2">
                            <ClipboardList size={16} className="text-indigo-600" />
                            <div>
                              <div className="text-[12px] font-bold text-slate-800">
                                Improve Evidence Analysis
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {evidenceAnswered > 0
                                  ? `${evidenceAnswered} questions answered — update for deeper insights`
                                  : "Answer questions across categories for deeper evidence analysis"}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={onOpenEvidenceQuestionnaire}
                            className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-700 transition-colors"
                          >
                            {evidenceAnswered > 0 ? "Update Analysis" : "Start Questionnaire"}
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 size={32} className="text-slate-200 mx-auto mb-3" />
                      <p className="text-sm text-slate-400">No evidence analysis available yet</p>
                      <p className="text-xs text-slate-300 mt-1">
                        Upload documents to trigger analysis
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* ─── Consistency Analysis Tab ─── */}
              {activeTab === "consistency" && (
                <>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-[13px] font-bold text-slate-800 mb-2">
                      Consistency Intelligence
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Cross-references your journey data, uploaded documents, and questionnaire
                      responses to detect inconsistencies, gaps, and risks.
                    </p>
                  </div>

                  {/* Narrative attention items (from consistency source) */}
                  {narrative && (
                    <>
                      {narrative.areasRequiringAttention.filter((b) => b.source === "consistency")
                        .length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-[11px] font-bold uppercase tracking-widest text-amber-500">
                            Findings
                          </h3>
                          {narrative.areasRequiringAttention
                            .filter((b) => b.source === "consistency")
                            .map((item, i) => (
                              <BulletItem
                                key={i}
                                item={item}
                                color="#f59e0b"
                                bgColor="#fffbeb"
                                icon={<AlertCircle size={12} className="text-amber-500" />}
                              />
                            ))}
                        </div>
                      )}

                      {narrative.strengths.filter((b) => b.source === "consistency").length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-[11px] font-bold uppercase tracking-widest text-emerald-500">
                            Resolved / Clear
                          </h3>
                          {narrative.strengths
                            .filter((b) => b.source === "consistency")
                            .map((item, i) => (
                              <BulletItem
                                key={i}
                                item={item}
                                color="#10b981"
                                bgColor="#f0fdf4"
                                icon={<CheckCircle2 size={12} className="text-emerald-500" />}
                              />
                            ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Phase 2 Questionnaire CTA */}
                  {onOpenPhase2 && (
                    <div className="rounded-xl border-2 border-dashed border-primary/30 p-4 bg-primary/5">
                      <div className="flex items-center gap-3 mb-2">
                        <ClipboardList size={16} className="text-primary" />
                        <div>
                          <div className="text-[12px] font-bold text-slate-800">
                            Phase 2 Questionnaire
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {phase2Answered > 0
                              ? `${phase2Answered} questions answered — update for deeper analysis`
                              : "Answer optional questions for deeper consistency analysis"}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={onOpenPhase2}
                        className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-primary text-white text-[11px] font-bold hover:bg-primary/90 transition-colors"
                      >
                        {phase2Answered > 0 ? "Update Analysis" : "Start Questionnaire"}
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ─── End of tabs ─── */}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-3 border-t border-slate-100 bg-slate-50/50 text-center">
              <p className="text-[9px] text-slate-400">
                Analysis is based on uploaded documents and journey data · Not legal advice
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Heart,
  DollarSign,
  Home,
  Users,
  MessageCircle,
  Fingerprint,
  Globe,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Shield,
  Sparkles,
  ClipboardList,
  X,
} from "lucide-react";
import type {
  EvidenceGapAnalysis,
  EvidenceCategoryAssessment,
  CoverageLevel,
  EvidenceRecommendation,
  EvidenceCategory,
  EvidenceQuestion,
  RequiredDocumentsSummary,
} from "../types";
import { EVIDENCE_QUESTIONNAIRE } from "../types";

// ─── Category Display Configuration ─────────────────────────────────────────
const CATEGORY_DISPLAY: Record<
  string,
  { icon: React.ElementType; gradient: string; accentColor: string }
> = {
  RELATIONSHIP: {
    icon: Heart,
    gradient: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
    accentColor: "#ec4899",
  },
  FINANCIAL: {
    icon: DollarSign,
    gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
    accentColor: "#10b981",
  },
  COHABITATION: {
    icon: Home,
    gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
    accentColor: "#f59e0b",
  },
  FAMILY_INTEGRATION: {
    icon: Users,
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
    accentColor: "#8b5cf6",
  },
  COMMUNICATION: {
    icon: MessageCircle,
    gradient: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
    accentColor: "#3b82f6",
  },
  IDENTITY: {
    icon: Fingerprint,
    gradient: "linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)",
    accentColor: "#06b6d4",
  },
  IMMIGRATION_HISTORY: {
    icon: Globe,
    gradient: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
    accentColor: "#6366f1",
  },
};

// ─── Coverage Level Styles ──────────────────────────────────────────────────
const LEVEL_STYLES: Record<
  CoverageLevel,
  {
    bg: string;
    border: string;
    text: string;
    label: string;
    chipBg: string;
    chipText: string;
    progressColor: string;
  }
> = {
  STRONG: {
    bg: "#ecfdf5",
    border: "#a7f3d0",
    text: "#065f46",
    label: "Strong",
    chipBg: "#d1fae5",
    chipText: "#065f46",
    progressColor: "#10b981",
  },
  MODERATE: {
    bg: "#fffbeb",
    border: "#fde68a",
    text: "#78350f",
    label: "Moderate",
    chipBg: "#fef3c7",
    chipText: "#78350f",
    progressColor: "#f59e0b",
  },
  WEAK: {
    bg: "#fef2f2",
    border: "#fecaca",
    text: "#7f1d1d",
    label: "Weak",
    chipBg: "#fee2e2",
    chipText: "#7f1d1d",
    progressColor: "#ef4444",
  },
  MISSING: {
    bg: "#f1f5f9",
    border: "#cbd5e1",
    text: "#475569",
    label: "Missing",
    chipBg: "#e2e8f0",
    chipText: "#475569",
    progressColor: "#94a3b8",
  },
};

// ─── Helper: Calculate supporting evidence score from assessment ────────────────
function calculateSupportingScore(assessment: EvidenceCategoryAssessment): number {
  // Total supporting slots = total items - total required items expected
  const totalRequired = assessment.totalRequiredItems ?? 0;
  const supportingTotal = assessment.totalItems - totalRequired;
  if (supportingTotal <= 0) return 100;
  const supportingFound = assessment.supportingItems.length;
  return Math.min(100, Math.round((supportingFound / supportingTotal) * 100));
}

// ─── Helper: Get display count for category ──────────────────────────────────────
function getDisplayCount(assessment: EvidenceCategoryAssessment): { found: number; total: number } {
  // Show total items found (required + supporting) out of total items expected
  // Cap found at total to avoid showing more than expected
  const totalFound = assessment.requiredItems.length + assessment.supportingItems.length;
  return {
    found: Math.min(totalFound, assessment.totalItems),
    total: assessment.totalItems,
  };
}

// ─── Helper: Get overall level from score ───────────────────────────────────
function getOverallLevel(score: number): CoverageLevel {
  if (score >= 80) return "STRONG";
  if (score >= 50) return "MODERATE";
  if (score > 0) return "WEAK";
  return "MISSING";
}

// ─── Required Documents Section Component ─────────────────────────────────────
function RequiredDocumentsSection({ summary }: { summary: RequiredDocumentsSummary }) {
  const [expanded, setExpanded] = useState(false);
  const completionColor =
    summary.completionPercentage === 100
      ? "#10b981"
      : summary.completionPercentage >= 50
        ? "#f59e0b"
        : "#ef4444";

  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 36,
              height: 36,
              background: `linear-gradient(135deg, ${completionColor}20 0%, ${completionColor}40 100%)`,
              border: `2px solid ${completionColor}40`,
            }}
          >
            <FileCheck className="w-4 h-4" style={{ color: completionColor }} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-800">Required Documents</p>
            <p className="text-[10px] text-slate-500">
              {summary.found} of {summary.total} required documents found
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-[11px] font-bold px-2 py-1 rounded-full"
            style={{
              background: `${completionColor}20`,
              color: completionColor,
            }}
          >
            {summary.completionPercentage}%
          </span>
          <ChevronRight
            className="w-4 h-4 text-slate-400 transition-transform"
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0)" }}
          />
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <div className="mt-3 space-y-1.5">
            {summary.missing.length === 0 ? (
              <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-medium text-emerald-700">
                  All required documents are present!
                </span>
              </div>
            ) : (
              summary.missing.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 py-2 px-3 rounded-lg bg-amber-50/50 border border-amber-100"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-700">{item.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Category Row Component ─────────────────────────────────────────────────
function CategoryRow({
  assessment,
  expanded,
  onToggle,
}: {
  assessment: EvidenceCategoryAssessment;
  expanded: boolean;
  onToggle: () => void;
}) {
  const display = CATEGORY_DISPLAY[assessment.category];
  const levelStyle = LEVEL_STYLES[assessment.level];
  const Icon = display?.icon || FileCheck;
  const progressPct = calculateSupportingScore(assessment);
  const count = getDisplayCount(assessment);

  return (
    <div
      className="w-full text-left rounded-xl transition-all overflow-hidden cursor-pointer"
      style={{
        backgroundColor: expanded ? levelStyle.bg : "transparent",
        boxShadow: expanded
          ? `inset 0 0 0 1px ${levelStyle.border}`
          : "inset 0 0 0 1px transparent",
      }}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Category icon */}
        <div
          className="flex items-center justify-center rounded-lg shrink-0"
          style={{
            width: 32,
            height: 32,
            background: display?.gradient || "linear-gradient(135deg, #64748b 0%, #94a3b8 100%)",
            boxShadow: expanded ? `0 4px 10px -2px ${display?.accentColor}40` : "none",
          }}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>

        {/* Label and progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[12.5px] font-semibold text-slate-700 truncate">
              {assessment.label}
            </p>
            <span
              className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                background: levelStyle.chipBg,
                color: levelStyle.chipText,
              }}
            >
              {levelStyle.label}
            </span>
          </div>

          {/* Progress bar - showing supporting evidence strength */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: levelStyle.progressColor,
                }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-500">
              {count.found}/{count.total}
            </span>
          </div>
        </div>

        {/* Expand chevron */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="shrink-0 p-1 rounded transition-colors hover:opacity-80"
          style={{ color: display?.accentColor || "#64748b" }}
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
          className="px-3 py-2.5 space-y-3 border-t"
          style={{ background: levelStyle.bg, borderColor: levelStyle.border }}
        >
          {/* Current evidence */}
          {assessment.items.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                Evidence found
              </p>
              <div className="flex flex-wrap gap-1">
                {assessment.items.map((item) => (
                  <span
                    key={item.id}
                    className={`text-[10px] border px-1.5 py-0.5 rounded ${
                      item.evidenceType === "REQUIRED"
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    {item.name.replace(/_/g, " ")}
                    {item.source === "questionnaire" && (
                      <span className="ml-1 text-emerald-500">(confirmed)</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing Required */}
          {assessment.missingRequired.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-red-500 mb-1">
                Missing Required
              </p>
              <div className="flex flex-wrap gap-1">
                {assessment.missingRequired.map((gap, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-red-50 border border-red-200 text-red-700 px-1.5 py-0.5 rounded font-medium"
                  >
                    {gap.item.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing Supporting */}
          {assessment.missingSupporting.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                Could Strengthen
              </p>
              <div className="flex flex-wrap gap-1">
                {assessment.missingSupporting.slice(0, 4).map((gap, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded"
                  >
                    {gap.item.replace(/_/g, " ")}
                  </span>
                ))}
                {assessment.missingSupporting.length > 4 && (
                  <span className="text-[10px] text-slate-500">
                    +{assessment.missingSupporting.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Recommendation Card Component ──────────────────────────────────────────
function RecommendationCard({ recommendation }: { recommendation: EvidenceRecommendation }) {
  const display = CATEGORY_DISPLAY[recommendation.category];
  const borderColor =
    recommendation.priority === "HIGH"
      ? "#fecaca"
      : recommendation.priority === "MEDIUM"
        ? "#fde68a"
        : "#e2e8f0";
  const Icon = display?.icon || FileCheck;

  return (
    <div
      className="rounded-xl border p-3 transition-all"
      style={{
        backgroundColor: "white",
        borderColor: borderColor,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center rounded-lg shrink-0"
          style={{
            width: 28,
            height: 28,
            background: display?.gradient || "#64748b",
          }}
        >
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-slate-800 mb-0.5">{recommendation.title}</p>
          <p className="text-[11px] text-slate-600 leading-relaxed">{recommendation.description}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Recommendations Carousel Component ─────────────────────────────────────
function RecommendationsCarousel({
  recommendations,
}: {
  recommendations: EvidenceRecommendation[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % recommendations.length);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + recommendations.length) % recommendations.length);
  };

  if (recommendations.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          <p className="text-[11px] font-bold text-slate-700">
            Recommendations ({recommendations.length})
          </p>
        </div>
        <span className="text-[10px] text-slate-500">
          {currentIndex + 1} of {recommendations.length}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={goPrev}
          className="shrink-0 w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
          disabled={recommendations.length <= 1}
        >
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>

        {/* Card */}
        <div className="flex-1 min-w-0">
          <RecommendationCard recommendation={recommendations[currentIndex]} />
        </div>

        {/* Next button */}
        <button
          onClick={goNext}
          className="shrink-0 w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
          disabled={recommendations.length <= 1}
        >
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    </div>
  );
}

// ─── Questionnaire Modal Component ──────────────────────────────────────────
function QuestionnaireModal({
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
  const [localResponses, setLocalResponses] = useState<Record<string, boolean>>(responses);

  // Group questions by category
  const groupedQuestions: Record<string, EvidenceQuestion[]> = {};
  for (const q of EVIDENCE_QUESTIONNAIRE) {
    if (!groupedQuestions[q.group]) {
      groupedQuestions[q.group] = [];
    }
    groupedQuestions[q.group].push(q);
  }

  const handleToggle = (questionId: string) => {
    setLocalResponses((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleSave = () => {
    onSave(localResponses);
    onClose();
  };

  if (!isOpen) return null;

  // Use portal to render modal outside of component tree (avoids z-index/overflow issues)
  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" style={{ color: "#0d7377" }} />
            <h3 className="text-sm font-bold text-slate-800">Evidence Questionnaire</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh] px-5 py-4 space-y-5">
          <p className="text-xs text-slate-500">
            Answer these questions to help us understand what evidence you have, even if you
            haven&apos;t uploaded it yet.
          </p>

          {Object.entries(groupedQuestions).map(([group, questions]) => (
            <div key={group}>
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">
                {group}
              </h4>
              <div className="space-y-2">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-[12px] font-medium text-slate-700">{question.question}</p>
                      {question.description && (
                        <p className="text-[10px] text-slate-500 mt-0.5">{question.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggle(question.id)}
                      className={`shrink-0 w-12 h-6 rounded-full transition-colors ${
                        localResponses[question.id] ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          localResponses[question.id] ? "translate-x-6" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "#0d7377" }}
          >
            Save Answers
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

// ─── Main EvidenceGapCard Component ─────────────────────────────────────────
interface EvidenceGapCardProps {
  analysis: EvidenceGapAnalysis | null;
  loading?: boolean;
  onRefresh?: () => void;
  onNavigateToVault?: () => void;
  questionnaireResponses?: Record<string, boolean>;
  onQuestionnaireSave?: (responses: Record<string, boolean>) => void;
}

export function EvidenceGapCard({
  analysis,
  loading,
  onRefresh,
  onNavigateToVault,
  questionnaireResponses = {},
  onQuestionnaireSave,
}: EvidenceGapCardProps) {
  const [expandedIdx, setExpandedIdx] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  // Loading state
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-lg bg-slate-200" />
          <div className="flex-1">
            <div className="h-3 bg-slate-200 rounded w-32 mb-2" />
            <div className="h-2 bg-slate-100 rounded w-48" />
          </div>
        </div>
      </div>
    );
  }

  // No analysis state
  if (!analysis) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Shield className="w-4 h-4 text-slate-400" />
          </div>
          <div className="min-w-0">
            <div className="text-[12.5px] font-bold text-slate-700">Evidence Analysis</div>
            <div className="text-[11px] text-slate-500">Run analysis to see gaps</div>
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-3 w-full text-[11px] font-semibold text-blue-600 hover:text-blue-800 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
          >
            Run Analysis
          </button>
        )}
      </div>
    );
  }

  const overallLevel = getOverallLevel(analysis.overallScore);
  const overallStyle = LEVEL_STYLES[overallLevel];

  // Convert categories Record to array for rendering
  const categoryArray = Object.values(analysis.categories);

  // Check if there are any required documents
  const hasRequiredDocs = analysis.requiredDocuments && analysis.requiredDocuments.total > 0;

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: 32,
                  height: 32,
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                }}
              >
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-800">Evidence Analysis</p>
                <p className="text-[10px] text-slate-500">{analysis.gapSummary}</p>
              </div>
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronRight
                className="w-4 h-4 text-slate-400 transition-transform"
                style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(90deg)" }}
              />
            </button>
          </div>

          {/* Overall score bar */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${analysis.overallScore}%`,
                  backgroundColor: overallStyle.progressColor,
                }}
              />
            </div>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: overallStyle.chipBg,
                color: overallStyle.chipText,
              }}
            >
              {analysis.overallScore}%
            </span>
          </div>

          {/* Stats chips */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {analysis.stats.strongCategories > 0 && (
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {analysis.stats.strongCategories} Strong
              </span>
            )}
            {(analysis.stats.moderateCategories ?? 0) > 0 && (
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {analysis.stats.moderateCategories} Moderate
              </span>
            )}
            {analysis.stats.weakCategories > 0 && (
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                {analysis.stats.weakCategories} Weak
              </span>
            )}
            {analysis.stats.missingCategories > 0 && (
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {analysis.stats.missingCategories} Missing
              </span>
            )}
            <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {analysis.stats.totalEvidenceItems} items
            </span>
          </div>
        </div>

        {/* Collapsible content */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                {/* Required Documents Section */}
                {hasRequiredDocs && (
                  <RequiredDocumentsSection summary={analysis.requiredDocuments} />
                )}

                {/* Supporting Evidence Strength Header */}
                <div className="flex items-center gap-2 pt-1">
                  <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Supporting Evidence Strength
                  </p>
                </div>

                {/* Category rows */}
                <div className="space-y-1.5">
                  {categoryArray.map((assessment) => (
                    <CategoryRow
                      key={assessment.category}
                      assessment={assessment}
                      expanded={expandedIdx === assessment.category}
                      onToggle={() =>
                        setExpandedIdx(
                          expandedIdx === assessment.category ? null : assessment.category
                        )
                      }
                    />
                  ))}
                </div>

                {/* Questionnaire button */}
                {onQuestionnaireSave && (
                  <button
                    onClick={() => setShowQuestionnaire(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed text-[11px] font-semibold transition-colors"
                    style={{
                      borderColor: "#0d7377",
                      color: "#0d7377",
                      backgroundColor: "rgba(13, 115, 119, 0.05)",
                    }}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    Answer Questions to Improve Analysis
                  </button>
                )}

                {/* Recommendations Carousel */}
                {analysis.recommendations.length > 0 && (
                  <RecommendationsCarousel recommendations={analysis.recommendations} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Questionnaire Modal */}
      <AnimatePresence>
        {showQuestionnaire && (
          <QuestionnaireModal
            isOpen={showQuestionnaire}
            onClose={() => setShowQuestionnaire(false)}
            responses={questionnaireResponses}
            onSave={onQuestionnaireSave || (() => {})}
          />
        )}
      </AnimatePresence>
    </>
  );
}

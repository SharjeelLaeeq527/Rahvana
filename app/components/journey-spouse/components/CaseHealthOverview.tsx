"use client";

/**
 * CaseHealthOverview — Visual case health section with animated radial score.
 *
 * Displays:
 * - Animated circular progress indicator (0–100)
 * - Health label (Excellent / Good / Needs Attention / Critical)
 * - Compact metric chips: Evidence Coverage, Consistency Issues, Critical, Resolved
 * - CTA: "View Full Analysis" → opens CSA Drawer
 * - Info modal with score breakdown and disclaimer
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  CircleAlert,
  FileCheck,
  ArrowRight,
  Shield,
  Info,
  X,
  AlertCircle,
} from "lucide-react";
import { ExpandableTooltip } from "@/app/components/shared/ExpandableTooltip";
import { CaseHealthCalculation } from "@/app/components/case-health/CaseHealthCalculation";
import type { EvidenceGapAnalysis } from "@/lib/journey/evidence-gap";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface CaseHealthOverviewProps {
  evidenceAnalysis: EvidenceGapAnalysis | null;
  criticalCount: number;
  warningCount: number;
  overallScore: number; // 0–100
  /** Evidence sub-score (0–100) from EvidenceGapEngine */
  evidenceScore?: number;
  /** Consistency sub-score (0–100) — 100 minus penalties for unresolved findings */
  consistencyScore?: number;
  /**
   * Completeness sub-score (0–100) — % of required checklist items the user has
   * filled. Present only for the weighted score model. Omit → not shown.
   */
  completenessScore?: number;
  /**
   * Risk penalty (0–100, higher = more risk) from detected red flags. Present
   * only for the weighted score model. Omit → not shown.
   */
  riskPenalty?: number;
  healthLabel: string;
  healthStatus: "excellent" | "good" | "needs-attention" | "critical";
  loading?: boolean;
  /**
   * True when the user hasn't produced any signal to assess yet. Renders a
   * neutral empty state instead of a fabricated score (NN/g empty states).
   */
  notStarted?: boolean;
  onViewFullAnalysis: () => void;
  /** Compact 2–3 line case summary text (shown below metrics) */
  summaryText?: string;
}

// Color Palettes
const STATUS_COLORS = {
  excellent: {
    primary: "#3dd9df",
    ring: "#afdbdb",
    accent: "#3dd9df",
    labelBg: "rgba(61,217,223,0.15)",
    labelBorder: "rgba(61,217,223,0.3)",
  },
  good: {
    primary: "#14a0a6",
    ring: "#0d7377",
    accent: "#14a0a6",
    labelBg: "rgba(20,160,166,0.15)",
    labelBorder: "rgba(20,160,166,0.3)",
  },
  "needs-attention": {
    primary: "#F59E0B",
    ring: "#D97706",
    accent: "#FBBF24",
    labelBg: "rgba(245,158,11,0.18)",
    labelBorder: "rgba(245,158,11,0.55)",
  },
  critical: {
    primary: "#EF4444",
    ring: "#DC2626",
    accent: "#F87171",
    labelBg: "rgba(239,68,68,0.18)",
    labelBorder: "rgba(239,68,68,0.55)",
  },
};

const CASE_HEALTH_EDUCATION_KEY = "rahvana_case_health_education_dismissed";

/** Dark premium analytics surface — distinct charcoal-teal from Hero green-teal */
const ANALYSIS_PANEL = {
  shadow:
    "0 0 0 1px rgba(20,184,166,0.08), 0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.06)",
  scoreWellShadow:
    "0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)",
  border: "rgba(20,184,166,0.20)",
};

// ─── Radial Score SVG ────────────────────────────────────────────────────────────

function RadialScore({
  score,
  status,
  size = 150,
  strokeWidth = 11,
}: {
  score: number;
  status: "excellent" | "good" | "needs-attention" | "critical";
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [animatedScore, setAnimatedScore] = useState(0);
  const colors = STATUS_COLORS[status];

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Status-colored ambient glow */}
      <div
        className="absolute inset-2 rounded-full blur-xl opacity-50 pointer-events-none"
        style={{ background: colors.primary }}
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius - strokeWidth / 2}
          fill="rgba(255,255,255,0.04)"
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={strokeWidth}
        />

        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
          style={{ filter: `drop-shadow(0 0 6px ${colors.primary}60)` }}
        />
      </svg>

      <div className="absolute flex flex-col items-center justify-center">
        <motion.span
          className="text-[34px] font-black tracking-tight leading-none text-white"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {animatedScore}
        </motion.span>
        <span className="text-[9px] font-bold text-white/40 tracking-widest mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

// ─── Metric Badge ────────────────────────────────────────────────────────────────

function MetricBadge({
  icon,
  label,
  value,
  accentColor = "#5eead4",
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accentColor?: string;
  progress?: number;
}) {
  const isAnalysisCard = label === "Evidence" || label === "Consistency";

  if (isAnalysisCard) {
    return (
      <div className="w-full relative flex items-center rounded-xl border border-white/[0.10] bg-white/[0.06] overflow-hidden group transition-all duration-200 hover:bg-white/[0.09] hover:border-white/[0.14]">
        {/* LEFT SECTION */}
        <div className="flex-1 px-3 py-3 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55 mb-2">
            {label} Analysis
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress || 0}%`,
                  background: accentColor,
                }}
              />
            </div>

            <span className="text-[11px] font-bold tabular-nums" style={{ color: accentColor }}>
              {progress || 0}%
            </span>
          </div>
        </div>

        {/* CENTER DIVIDER */}
        <div className="self-stretch w-px bg-white/10" />

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-3 px-3 py-3 min-w-[140px]">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0"
            style={{
              background: `${accentColor}18`,
              borderColor: `${accentColor}30`,
              color: accentColor,
            }}
          >
            {icon}
          </div>

          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/40">
              Status
            </div>
            <div className="text-[11px] font-semibold text-white/90">{value}</div>
          </div>
        </div>
      </div>
    );
  }

  // Critical card stays existing style
  return (
    <div className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/[0.10] bg-white/[0.06] group transition-all duration-200 hover:bg-white/[0.09] hover:border-white/[0.14]">
      <div
        className="relative w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
        style={{
          background: `${accentColor}18`,
          borderColor: `${accentColor}30`,
          color: accentColor,
        }}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/45">
          {label}
        </div>
        <div className="text-[11px] font-semibold text-white/90 mt-0.5">{value}</div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────────

export function CaseHealthOverview({
  evidenceAnalysis,
  criticalCount,
  warningCount,
  overallScore,
  evidenceScore,
  consistencyScore,
  completenessScore,
  riskPenalty,
  healthLabel,
  healthStatus,
  loading,
  notStarted,
  onViewFullAnalysis,
  summaryText,
}: CaseHealthOverviewProps) {
  const colors = STATUS_COLORS[healthStatus];

  // ── Info modal & first-visit education tooltip ──
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showEducationTooltip, setShowEducationTooltip] = useState(false);
  const infoButtonRef = useRef<HTMLButtonElement>(null);

  const dismissEducationTooltip = useCallback(() => {
    setShowEducationTooltip(false);
    try {
      localStorage.setItem(CASE_HEALTH_EDUCATION_KEY, "1");
    } catch {
      /* storage unavailable */
    }
  }, []);

  const openInfoModal = useCallback(() => {
    dismissEducationTooltip();
    setShowInfoModal(true);
  }, [dismissEducationTooltip]);

  useEffect(() => {
    if (loading) return;
    try {
      if (localStorage.getItem(CASE_HEALTH_EDUCATION_KEY)) return;
    } catch {
      return;
    }

    const showTimer = window.setTimeout(() => setShowEducationTooltip(true), 2500);
    return () => window.clearTimeout(showTimer);
  }, [loading]);

  useEffect(() => {
    if (!showEducationTooltip) return;

    const hideTimer = window.setTimeout(() => dismissEducationTooltip(), 7000);
    return () => window.clearTimeout(hideTimer);
  }, [showEducationTooltip, dismissEducationTooltip]);

  // Derive score-based status for pie chart color
  // <50 = weak (red), 50-80 = moderate (yellow), >80 = good (green)
  const scoreStatus: "excellent" | "good" | "needs-attention" | "critical" =
    overallScore > 80 ? "excellent" : overallScore >= 50 ? "needs-attention" : "critical";

  // Evidence coverage: count strong categories
  const stats = evidenceAnalysis?.stats;
  const strongCats = stats?.strongCategories ?? 0;
  const totalCats = 7; // 7 evidence categories

  // Evidence coverage display
  const coverageValue = evidenceAnalysis ? `${strongCats} / ${totalCats} Strong` : "";

  if (loading) {
    return (
      <div
        className="relative rounded-2xl overflow-hidden border bg-gradient-to-br from-[#121f22] via-[#162629] to-[#1a2e32]"
        style={{ borderColor: ANALYSIS_PANEL.border, boxShadow: ANALYSIS_PANEL.shadow }}
      >
        <div className="relative z-10 p-7 animate-pulse">
          <div className="flex items-center gap-5">
            <div className="w-[118px] h-[118px] rounded-full bg-white/8" />
            <div className="flex-1 min-w-0 space-y-3">
              <div className="w-36 max-w-full h-5 bg-white/10 rounded" />
              <div className="w-52 max-w-full h-3 bg-white/8 rounded" />
              <div className="w-28 max-w-full h-3 bg-white/8 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state — nothing to assess yet ──
  // Show a neutral "not started" panel instead of a fabricated score. No number,
  // no red critical/warning; just status + a learning cue (NN/g empty states,
  // and no "false precision" from a near-empty case).
  if (notStarted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative rounded-2xl overflow-hidden"
        style={{ boxShadow: ANALYSIS_PANEL.shadow }}
      >
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden border bg-gradient-to-br from-[#121f22] via-[#162629] to-[#1a2e32]"
          style={{ borderColor: ANALYSIS_PANEL.border }}
        >
          <div
            className="absolute inset-0 opacity-[0.25]"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(20,184,166,0.12) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#14b8a6]/80 via-[#0d7377]/50 to-transparent" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.08] border border-white/[0.10]">
                <Shield size={16} className="text-[#5eead4]" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#5eead4]/70">
                  Case Analysis
                </p>
                <h3 className="text-[15px] font-bold text-white tracking-tight leading-tight">
                  Case Health Overview
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold tracking-wide text-white/50 border-white/15 bg-white/[0.04]">
              Not started
            </div>
          </div>

          {/* Body — muted dashed dial + learning cue */}
          <div className="px-5 py-6 flex items-center gap-5">
            <div className="shrink-0 w-[104px] h-[104px] rounded-full flex flex-col items-center justify-center border-2 border-dashed border-white/15 bg-white/[0.03]">
              <span className="text-[34px] font-black leading-none text-white/35">, </span>
              <span className="text-[9px] font-bold text-white/30 tracking-widest mt-0.5">
                / 100
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white/80">
                We&apos;ll assess your case health as you go
              </p>
              <p className="text-[12px] text-white/45 mt-1.5 leading-relaxed">
                Complete your first step or upload a document, and your evidence,
                consistency, and critical-issue analysis will appear here, based on what
                your case actually shows.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative rounded-2xl overflow-hidden"
      style={{ boxShadow: ANALYSIS_PANEL.shadow }}
    >
      {/* Clipped background layers — charcoal-teal */}
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden border bg-gradient-to-br from-[#121f22] via-[#162629] to-[#1a2e32]"
        style={{ borderColor: ANALYSIS_PANEL.border }}
      >
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(20,184,166,0.12) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="absolute top-0 left-0 w-72 h-72 bg-[#14b8a6]/[0.07] rounded-full -translate-x-1/3 -translate-y-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-56 h-56 bg-black/20 rounded-full translate-x-1/4 translate-y-1/4 blur-2xl pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(145deg, rgba(20,184,166,0.05) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)",
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#14b8a6]/80 via-[#0d7377]/50 to-transparent" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.08] border border-white/[0.10] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <Shield size={16} className="text-[#5eead4]" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#5eead4]/70">
                Case Analysis
              </p>
              <h3 className="text-[15px] font-bold text-white tracking-tight leading-tight">
                Case Health Overview
              </h3>
            </div>
          </div>

          {/* Health label chip */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-[10px] font-bold tracking-wide"
            style={{
              background: colors.labelBg,
              borderColor: colors.labelBorder,
              color: colors.primary,
              boxShadow: `0 0 12px ${colors.primary}15`,
            }}
          >
            <span className="relative flex h-2 w-2">
              <motion.span
                className="absolute inline-flex h-full w-full rounded-full opacity-60"
                style={{ background: colors.primary }}
                animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ background: colors.primary }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </span>
            {healthStatus === "excellent" || healthStatus === "good" ? (
              <CheckCircle2 size={11} style={{ color: colors.primary }} />
            ) : (
              <AlertTriangle size={11} style={{ color: colors.primary }} />
            )}
            {healthLabel}
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 pt-5">
        <div className="flex flex-col md:flex-row md:items-start gap-5">
            {/* Score pedestal — dark focal well, hero of this card */}
            <div className="shrink-0 flex flex-col items-center gap-3 md:items-center">
              <div
                className="relative rounded-full p-[3px] bg-gradient-to-br from-slate-600/80 via-slate-700 to-slate-900"
                style={{ boxShadow: ANALYSIS_PANEL.scoreWellShadow }}
              >
                <div className="rounded-full bg-gradient-to-br from-[#0f172a] to-[#020617] p-1">
                  <RadialScore
                    score={overallScore}
                    status={scoreStatus}
                    size={104}
                    strokeWidth={8}
                  />
                </div>
              </div>

              {/* Label + info — tooltip drops below, clear of dial */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-white/45 tracking-wide uppercase">
                  Case Health
                </span>
                <div className="relative group/tooltip">
                  <button
                    ref={infoButtonRef}
                    onClick={openInfoModal}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white/40 hover:text-[#5eead4] hover:bg-white/10 transition-all cursor-pointer ring-1 ring-white/10 hover:ring-[#5eead4]/40"
                    aria-label="How is Case Health calculated?"
                  >
                    <Info size={12} strokeWidth={2.5} />
                  </button>

                  {/* First-visit education callout — below icon, away from radial dial */}
                  <AnimatePresence>
                    {showEducationTooltip && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="absolute top-full left-1/2 -translate-x-[40%] mt-2 w-56 sm:w-64 p-3 sm:p-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white text-xs rounded-xl z-100 shadow-2xl border border-gray-700 pointer-events-auto"
                      >
                        <button
                          onClick={dismissEducationTooltip}
                          className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
                          aria-label="Dismiss tip"
                        >
                          <X size={11} />
                        </button>
                        <div className="font-semibold text-xs sm:text-sm pr-5">
                          Case Health Methodology
                        </div>
                        <div className="text-[10px] sm:text-[11px] opacity-80 mt-1 leading-relaxed">
                          A composite readiness score derived from evidence coverage and information
                          consistency across your case.
                        </div>
                        <button
                          onClick={openInfoModal}
                          className="mt-2.5 text-[10px] sm:text-[11px] font-semibold text-teal-300 hover:text-teal-200 transition-colors inline-flex items-center gap-1"
                        >
                          View score breakdown
                          <ArrowRight size={10} />
                        </button>
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-900" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Metrics — glass rows on dark surface */}
            <div className="w-full md:flex-1 min-w-0 flex flex-col gap-2 pt-0 md:pt-1">
              <MetricBadge
                icon={<FileCheck size={13} />}
                label="Evidence"
                value={coverageValue}
                progress={evidenceScore}
                accentColor="#5eead4"
              />

              <MetricBadge
                icon={<AlertTriangle size={13} />}
                label="Consistency"
                value={
                  warningCount > 0
                    ? `${warningCount} Warning${warningCount !== 1 ? "s" : ""}`
                    : "All Clear"
                }
                progress={consistencyScore}
                accentColor={warningCount > 0 ? "#FBBF24" : "#5eead4"}
              />

              <MetricBadge
                icon={<CircleAlert size={13} />}
                label="Critical"
                value={criticalCount > 0 ? `${criticalCount} Critical` : "All Clear"}
                accentColor={criticalCount > 0 ? "#F87171" : "#5eead4"}
              />
            </div>
          </div>

          {summaryText && (
            <div className="mt-4 pt-3 border-t border-white/[0.08]">
              <p className="text-[12px] text-white/45 leading-relaxed font-medium">{summaryText}</p>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-white/[0.08]">
            <button
              onClick={onViewFullAnalysis}
              className="group w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold transition-all active:scale-[0.98] border border-white/[0.12] bg-white/[0.08] text-white hover:bg-white/[0.12] hover:border-white/[0.18] shadow-[0_4px_14px_rgba(0,0,0,0.2)]"
            >
              View Full Analysis
              <ArrowRight
                size={13}
                className="group-hover:translate-x-1 transition-transform"
                strokeWidth={2.5}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Info Modal ── */}
      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 z-[200] flex items-center mt-24 justify-center p-4 md:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfoModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 20 }}
              transition={{ duration: 0.22 }}
              className="relative w-full max-w-3xl max-h-[80vh] bg-card rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Close */}
              <button
                onClick={() => setShowInfoModal(false)}
                className="absolute top-5 right-5 z-20 w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
              >
                <X size={16} />
              </button>

              {/* Header */}
              <div className="px-8 pt-8 pb-6 border-b border-border bg-gradient-to-b from-[#0d7377]/5 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#0d7377]/10 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-[#0d7377]" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-foreground">
                      Understanding Case Health
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Learn how Rahvana calculates your case health score.
                    </p>
                  </div>
                </div>
              </div>

              {/* Scrollable Content — shared explainer (single source of truth) */}
              <CaseHealthCalculation
                overallScore={overallScore}
                evidenceScore={evidenceScore}
                consistencyScore={consistencyScore}
                completenessScore={completenessScore}
                riskPenalty={riskPenalty}
              />

              {/* Footer */}
              <div className="border-t border-border p-6 bg-background">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="w-full py-4 rounded-2xl bg-[#0d7377] hover:bg-[#0a5f62] text-white font-semibold transition-all shadow-md"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

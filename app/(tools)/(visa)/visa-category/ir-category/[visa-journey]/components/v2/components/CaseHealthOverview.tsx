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

import React, { useEffect, useState } from "react";
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
  healthLabel: string;
  healthStatus: "excellent" | "good" | "needs-attention" | "critical";
  loading?: boolean;
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
    primary: "#d4a5d3",
    ring: "#cdadcc",
    accent: "#d4a5d3",
    labelBg: "rgba(212,165,211,0.15)",
    labelBorder: "rgba(212,165,211,0.3)",
  },
  critical: {
    primary: "#f0929e",
    ring: "#db8090",
    accent: "#f0929e",
    labelBg: "rgba(240,146,158,0.15)",
    labelBorder: "rgba(240,146,158,0.3)",
  },
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
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative"
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Inner fill — subtle depth against dark bg */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius - strokeWidth / 2}
          fill="rgba(255,255,255,0.03)"
        />

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />

        {/* Progress arc */}
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
          style={{ filter: `drop-shadow(0 0 4px ${colors.primary}50)` }}
        />
      </svg>

      {/* Score text */}
      <div className="absolute flex flex-col items-center justify-center">
        <motion.span
          className="text-[36px] font-black tracking-tight leading-none text-white"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {animatedScore}
        </motion.span>
        <span className="text-[9px] font-bold text-white/30 tracking-widest mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

// ─── Metric Badge ────────────────────────────────────────────────────────────────

function MetricBadge({
  icon,
  label,
  value,
  accentColor = "#3dd9df",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accentColor?: string;
}) {
  return (
    <div className="relative flex items-center gap-2 px-2.5 py-2 rounded-xl overflow-hidden group">
      {/* Subtle glass background */}
      <div
        className="absolute inset-0 rounded-xl"
        style={{ background: "rgba(255,255,255,0.05)" }}
      />
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `${accentColor}08` }}
      />
      <div
        className="relative w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${accentColor}18`, color: accentColor }}
      >
        {icon}
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="text-[8px] font-bold uppercase tracking-[0.12em] text-white/35">
          {label}
        </div>
        <div className="text-[11px] font-bold text-white/90 mt-0.5">{value}</div>
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
  healthLabel,
  healthStatus,
  loading,
  onViewFullAnalysis,
  summaryText,
}: CaseHealthOverviewProps) {
  const colors = STATUS_COLORS[healthStatus];

  // ── Info modal state ──
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Derive score-based status for pie chart color
  // <50 = weak (red), 50-80 = moderate (yellow), >80 = good (green)
  const scoreStatus: "excellent" | "good" | "needs-attention" | "critical" =
    overallScore > 80 ? "excellent" : overallScore >= 50 ? "needs-attention" : "critical";

  // Evidence coverage: count strong categories
  const stats = evidenceAnalysis?.stats;
  const strongCats = stats?.strongCategories ?? 0;
  const totalCats = 7; // 7 evidence categories

  // Evidence coverage display
  const coverageValue = evidenceAnalysis ? `${strongCats} / ${totalCats} Strong` : "—";

  if (loading) {
    return (
      <div className="relative rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(13,115,119,0.12),0_4px_16px_rgba(0,0,0,0.06)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f8084] via-[#0b6b70] to-[#085a5f]" />
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#afdbdb] via-[#89a4a0] to-transparent opacity-60" />
        <div className="relative z-10 p-7 animate-pulse">
          <div className="flex items-center gap-5">
            <div className="w-[110px] h-[110px] rounded-full bg-white/8" />
            <div className="flex-1 space-y-3">
              <div className="w-36 h-5 bg-white/10 rounded" />
              <div className="w-52 h-3 bg-white/8 rounded" />
              <div className="w-28 h-3 bg-white/8 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        boxShadow: `0 0 40px -8px ${colors.primary}25, 0 8px 32px rgba(13,115,119,0.14), 0 4px 16px rgba(0,0,0,0.08)`,
      }}
    >
      {/* Ocean teal gradient — cyan-shifted, lighter, distinct from Hero's green-teal */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f8084] via-[#0b6b70] to-[#085a5f]" />

      {/* Decorative orbs — brand palette colors */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#afdbdb]/[0.06] rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#89a4a0]/[0.08] rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl pointer-events-none" />

      {/* Top accent line — #afdbdb → #89a4a0 shimmer */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(to right, #afdbdb, #89a4a0, transparent)`,
          opacity: 0.6,
        }}
      />

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.08] border border-white/[0.08]">
              <Shield size={16} className="text-white/80" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-white tracking-tight">Case Overview</h3>
              <p className="text-[10px] text-white/40 font-semibold tracking-wide mt-0.5">
                Evidence & Consistency Analysis
              </p>
            </div>
          </div>

          {/* Health label chip */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wide"
            style={{
              background: colors.labelBg,
              borderColor: colors.labelBorder,
              color: colors.primary,
            }}
          >
            {/* Pulsing dot */}
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ background: colors.primary }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            {healthStatus === "excellent" || healthStatus === "good" ? (
              <CheckCircle2 size={11} style={{ color: colors.primary }} />
            ) : (
              <AlertTriangle size={11} style={{ color: colors.primary }} />
            )}
            {healthLabel}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-gradient-to-r from-white/[0.06] via-white/[0.10] to-white/[0.06]" />

        {/* Body */}
        <div className="px-5 pb-5 pt-4">
          <div className="flex items-center gap-5">
            {/* Score section */}
            <div className="shrink-0 flex flex-col items-center gap-2 relative">
              <RadialScore score={overallScore} status={scoreStatus} size={110} strokeWidth={9} />
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-white/40 tracking-wide uppercase">
                  Case Health
                </span>
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-white/35 hover:text-white/90 hover:bg-white/10 transition-all cursor-pointer"
                  aria-label="How is Case Health calculated?"
                >
                  <Info size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Metrics section */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <MetricBadge
                icon={<FileCheck size={12} />}
                label="Evidence"
                value={coverageValue}
                accentColor="#3dd9df"
              />
              <MetricBadge
                icon={<AlertTriangle size={12} />}
                label="Consistency"
                value={
                  warningCount > 0
                    ? `${warningCount} Warning${warningCount !== 1 ? "s" : ""}`
                    : "All Clear"
                }
                accentColor={warningCount > 0 ? "#d4a5d3" : "#3dd9df"}
              />
              <MetricBadge
                icon={<CircleAlert size={12} />}
                label="Critical"
                value={criticalCount > 0 ? `${criticalCount} Critical` : "All Clear"}
                accentColor={criticalCount > 0 ? "#f0929e" : "#3dd9df"}
              />
            </div>
          </div>

          {/* Summary text */}
          {summaryText && (
            <div className="mt-4 pt-3 border-t border-white/[0.06]">
              <p className="text-[12px] text-white/45 leading-relaxed font-medium">{summaryText}</p>
            </div>
          )}

          {/* CTA Button — more prominent */}
          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <button
              onClick={onViewFullAnalysis}
              className="group w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold transition-all hover:shadow-lg hover:shadow-black/10 active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.05))`,
                color: "white",
                border: `1px solid rgba(255,255,255,0.12)`,
              }}
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

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
                {/* Score Cards */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                    Your Score Breakdown
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Case Health */}
                    <div className="rounded-2xl border border-[#0d7377]/15 bg-[#0d7377]/5 p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Shield size={16} className="text-[#0d7377]" />
                        <span className="text-sm font-semibold text-slate-700">Case Health</span>
                      </div>

                      <div className="text-4xl font-black text-[#0d7377]">{overallScore}</div>

                      <div className="text-xs text-slate-500 mt-1">Overall Score</div>
                    </div>

                    {/* Evidence */}
                    <div className="rounded-2xl border border-[#cfe8e9] bg-[#f8fcfc] p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <FileCheck size={16} className="text-[#0d7377]" />
                        <span className="text-sm font-semibold text-slate-700">
                          Evidence Analysis
                        </span>
                      </div>

                      <div className="text-4xl font-black text-slate-800">
                        {evidenceScore ?? "—"}
                      </div>

                      <div className="text-xs text-slate-500 mt-1">Document Strength</div>
                    </div>

                    {/* Consistency */}
                    <div className="rounded-2xl border border-[#e4d7e9] bg-[#faf8fc] p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 size={16} className="text-[#9a6b96]" />
                        <span className="text-sm font-semibold text-slate-700">
                          Consistency Analysis
                        </span>
                      </div>

                      <div className="text-4xl font-black text-slate-800">
                        {consistencyScore ?? "—"}
                      </div>

                      <div className="text-xs text-slate-500 mt-1">Information Accuracy</div>
                    </div>
                  </div>
                </div>

                {/* Calculation */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                    How It&apos;s Calculated
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Your Case Health score is built from two equally-weighted analyses. Each one
                    examines a different dimension of your case, and together they produce a single
                    0–100 score that reflects your overall readiness.
                  </p>

                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl border border-border bg-muted/30">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#0d7377] mt-2 shrink-0" />

                        <div>
                          <h4 className="font-semibold text-foreground text-sm">
                            Evidence Analysis (50%)
                          </h4>

                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            Evaluates the strength, completeness, and relevance of documents and
                            supporting evidence available within your Rahvana case journey.
                          </p>

                          <div className="mt-3 space-y-1.5">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <FileCheck size={11} className="text-[#0d7377] shrink-0" />
                              <span>Checks which required documents are uploaded vs. missing</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <FileCheck size={11} className="text-[#0d7377] shrink-0" />
                              <span>
                                Assesses document relevance and coverage for your visa category
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <FileCheck size={11} className="text-[#0d7377] shrink-0" />
                              <span>Scores evidence strength from incomplete to comprehensive</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-border bg-muted/30">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#9a6b96] mt-2 shrink-0" />

                        <div>
                          <h4 className="font-semibold text-foreground text-sm">
                            Consistency Analysis (50%)
                          </h4>

                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            Reviews dates, personal details, relationships, timelines, and
                            information entered throughout your journey to identify inconsistencies
                            and potential issues.
                          </p>

                          <div className="mt-3 space-y-1.5">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CheckCircle2 size={11} className="text-[#9a6b96] shrink-0" />
                              <span>Cross-checks dates and timelines across all entered data</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CheckCircle2 size={11} className="text-[#9a6b96] shrink-0" />
                              <span>Detects conflicting personal details or relationship info</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CheckCircle2 size={11} className="text-[#9a6b96] shrink-0" />
                              <span>
                                Flags contradictions between documents and questionnaire answers
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Formula visual */}
                  <div className="mt-4 p-3.5 rounded-xl border border-border bg-muted/20">
                    <div className="flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground">
                      <span className="px-3.5 py-1.5 rounded-full bg-[#0d7377] text-[#e8fbfb] border border-[#afdbdb]/20 font-semibold text-xs tracking-[0.01em] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#afdbdb]/40 hover:shadow-[0_6px_20px_rgba(13,115,119,0.30)]">
                        Evidence × 50%
                      </span>

                      {/* Plus */}
                      <div
                        className="
      w-7 h-7
      rounded-full
      flex items-center justify-center
      bg-white/[0.04]
      border border-white/[0.08]
      text-[#89a4a0]
      font-bold
      text-sm
      backdrop-blur-sm
    "
                      >
                        +
                      </div>

                      {/* Consistency */}
                      <span
                        className="
      px-3.5 py-1.5
      rounded-full
      bg-[#cdadcc]
      text-[#452f45]
      border border-white/10
      font-semibold
      text-xs
      tracking-[0.01em]
      transition-all duration-300
      hover:-translate-y-0.5
      hover:shadow-[0_6px_20px_rgba(205,173,204,0.30)]
    "
                      >
                        Consistency × 50%
                      </span>

                      {/* Equals */}
                      <div
                        className="
      w-8 h-8
      rounded-full
      flex items-center justify-center
      bg-white/[0.05]
      border border-white/[0.10]
      text-[#89a4a0]
      font-bold
      text-sm
      backdrop-blur-sm
    "
                      >
                        =
                      </div>

                      {/* Result */}
                      <span
                        className="
      px-4 py-1.5
      rounded-full
      bg-gradient-to-r
      from-[#0d7377]
      to-[#89a4a0]
      text-white
      border border-white/10
      font-bold
      text-xs
      tracking-[0.02em]
      shadow-[0_8px_24px_rgba(13,115,119,0.25)]
      transition-all duration-300
      hover:-translate-y-0.5
      hover:shadow-[0_10px_28px_rgba(13,115,119,0.35)]
    "
                      >
                        Case Health
                      </span>
                    </div>
                  </div>
                </div>

                {/* What the Score Helps With */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                    What This Score Helps Identify
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      "Missing supporting evidence",
                      "Incomplete documentation",
                      "Potential inconsistencies",
                      "Case preparation gaps",
                      "Timeline discrepancies",
                      "Areas needing attention before submission",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 p-3 rounded-xl bg-muted/30"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0d7377]" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disclaimer */}
                <ExpandableTooltip
                  icon={<AlertCircle size={12} />}
                  title="Important Disclaimer"
                  message="Case Health reflects Rahvana’s analysis of your evidence and case data. It is intended for guidance only and does not predict approval or constitute legal advice."
                  defaultOpen={true}
                />
              </div>

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

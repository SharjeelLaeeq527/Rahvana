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

// ─── Color Palettes ─────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  excellent: { primary: "#0d7377", secondary: "#e6f5f5", text: "#063e40", ring: "#afdbdb" },
  good: { primary: "#0d7377", secondary: "#e6f5f5", text: "#095c5f", ring: "#0d7377" },
  "needs-attention": { primary: "#cdadcc", secondary: "#f5eef5", text: "#6b4566", ring: "#cdadcc" },
  critical: { primary: "#db8090", secondary: "#fbe8ec", text: "#7a3a4a", ring: "#db8090" },
};

// ─── Radial Score SVG ────────────────────────────────────────────────────────────

function RadialScore({
  score,
  status,
  size = 140,
  strokeWidth = 10,
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

  // Animate score on mount
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
      {/* Glow */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-30"
        style={{ background: colors.primary }}
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative"
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.secondary}
          strokeWidth={strokeWidth}
          opacity={0.5}
        />
        {/* Progress */}
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
        />
      </svg>

      {/* Score text */}
      <div className="absolute flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-black leading-none"
          style={{ color: colors.primary }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {animatedScore}
        </motion.span>
        <span className="text-[10px] font-bold text-slate-400 mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

// ─── Metric Badge ────────────────────────────────────────────────────────────────

function MetricBadge({
  icon,
  label,
  value,
  color = "#64748b",
  bgColor = "#f1f5f9",
  borderColor = "#e2e8f0",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
  bgColor?: string;
  borderColor?: string;
}) {
  return (
    <div
      className="flex items-center gap-2 px-2.5 py-2 rounded-xl border"
      style={{ background: bgColor, borderColor }}
    >
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}20`, color }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div
          className="text-[8px] font-bold uppercase tracking-widest"
          style={{ color: "#64748b" }}
        >
          {label}
        </div>
        <div className="text-[11px] font-bold" style={{ color }}>
          {value}
        </div>
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
  const scoreColors = STATUS_COLORS[scoreStatus];

  // Evidence coverage: count strong categories
  const stats = evidenceAnalysis?.stats;
  const strongCats = stats?.strongCategories ?? 0;
  const totalCats = 7; // 7 evidence categories

  // Evidence coverage display
  const coverageValue = evidenceAnalysis ? `${strongCats} / ${totalCats} Strong` : "—";

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-[140px] h-[140px] rounded-full bg-slate-100" />
          <div className="flex-1 space-y-3">
            <div className="w-32 h-4 bg-slate-100 rounded" />
            <div className="w-48 h-3 bg-slate-100 rounded" />
            <div className="w-24 h-3 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: 0.1 }}
  className="rounded-2xl shadow-sm"
  style={{
    background: "rgba(13,115,119,0.04)",
    border: "1px solid rgba(13,115,119,0.12)",
  }}
>
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${colors.primary}15` }}
          >
            <Shield size={16} style={{ color: colors.primary }} />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">Case Overview</h3>
            <p className="text-[10px] text-slate-500 font-medium">
              Based on evidence coverage & consistency analysis
            </p>
          </div>
        </div>

        {/* Health label chip */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold"
          style={{
            background: colors.secondary,
            borderColor: `${colors.primary}40`,
            color: colors.text,
          }}
        >
          {healthStatus === "excellent" || healthStatus === "good" ? (
            <CheckCircle2 size={11} style={{ color: colors.primary }} />
          ) : (
            <AlertTriangle size={11} style={{ color: colors.primary }} />
          )}
          {healthLabel}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Radial Score + Metrics in one flex row */}
        <div className="flex items-center gap-5">
          {/* Radial Score */}
          <div className="shrink-0 flex flex-col items-center gap-1.5 relative">
            <RadialScore score={overallScore} status={scoreStatus} size={110} strokeWidth={9} />
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-semibold text-slate-400">Case Health</span>
              <button
                onClick={() => setShowInfoModal(true)}
                className="w-4 h-4 rounded-full flex items-center justify-center text-slate-600 hover:text-[#0d7377] hover:bg-[#0d7377]/8 transition-all cursor-pointer"
                aria-label="How is Case Health calculated?"
              >
                <Info size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {/* Evidence Coverage */}
            <MetricBadge
              icon={<FileCheck size={12} />}
              label="Evidence"
              value={coverageValue}
              color="#0d7377"
              bgColor="#f7fafa"
              borderColor="#e0eded"
            />

            {/* Consistency Warnings */}
            <MetricBadge
              icon={<AlertTriangle size={12} />}
              label="Consistency"
              value={
                warningCount > 0
                  ? `${warningCount} Warning${warningCount !== 1 ? "s" : ""}`
                  : "None"
              }
              color={warningCount > 0 ? "#9a6b96" : "#0d7377"}
              bgColor={warningCount > 0 ? "#f9f3f9" : "#f7fafa"}
              borderColor={warningCount > 0 ? "#e8d4e7" : "#e0eded"}
            />

            {/* Critical Issues */}
            <MetricBadge
              icon={<CircleAlert size={12} />}
              label="Critical"
              value={criticalCount > 0 ? `${criticalCount} Critical` : "None"}
              color={criticalCount > 0 ? "#db8090" : "#0d7377"}
              bgColor={criticalCount > 0 ? "#fdf0f3" : "#f7fafa"}
              borderColor={criticalCount > 0 ? "#f0c8d0" : "#e0eded"}
            />
          </div>
        </div>

        {/* Compact Summary */}
        {summaryText && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 leading-relaxed">{summaryText}</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={onViewFullAnalysis}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold transition-all hover:shadow-sm active:scale-[0.99] bg-[#0d7377]/8 text-[#0d7377] border border-[#0d7377]/20"
          >
            View Full Analysis
            <ArrowRight size={13} />
          </button>
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

                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl border border-border bg-muted/30">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#0d7377] mt-2 shrink-0" />

                        <div>
                          <h4 className="font-semibold text-foreground text-sm">
                            Evidence Analysis (60%)
                          </h4>

                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            Evaluates the strength, completeness, and relevance of documents and
                            supporting evidence available within your Rahvana case profile.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-border bg-muted/30">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#9a6b96] mt-2 shrink-0" />

                        <div>
                          <h4 className="font-semibold text-foreground text-sm">
                            Consistency Analysis (40%)
                          </h4>

                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            Reviews dates, personal details, relationships, timelines, and
                            information entered throughout your journey to identify inconsistencies
                            and potential issues.
                          </p>
                        </div>
                      </div>
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
                  message="The Case Health score is generated using Rahvana's internal analysis of your case information, supporting evidence, and consistency checks completed throughout your immigration journey. This score is intended to help identify documentation gaps, missing evidence, and potential inconsistencies that may require attention before submission. It is NOT a prediction of visa approval, does not guarantee any immigration outcome, and should not be considered legal advice. Final decisions regarding petitions, applications, and visas are made solely by USCIS, the National Visa Center (NVC), U.S. Consulates, and other relevant government authorities."
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

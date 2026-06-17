"use client";

/**
 * CaseHealthOverview — Visual case health section with animated radial score.
 *
 * Displays:
 * - Animated circular progress indicator (0–100)
 * - Health label (Excellent / Good / Needs Attention / Critical)
 * - Compact metric chips: Evidence Coverage, Consistency Issues, Critical, Resolved
 * - CTA: "View Full Analysis" → opens CSA Drawer
 */

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  CircleAlert,
  FileCheck,
  ArrowRight,
  Shield,
} from "lucide-react";
import type { EvidenceGapAnalysis } from "@/lib/journey/evidence-gap";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface CaseHealthOverviewProps {
  evidenceAnalysis: EvidenceGapAnalysis | null;
  criticalCount: number;
  warningCount: number;
  overallScore: number; // 0–100
  healthLabel: string;
  healthStatus: "excellent" | "good" | "needs-attention" | "critical";
  loading?: boolean;
  onViewFullAnalysis: () => void;
  /** Compact 2–3 line case summary text (shown below metrics) */
  summaryText?: string;
}

// ─── Color Palettes ─────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  excellent: { primary: "#10b981", secondary: "#d1fae5", text: "#065f46", ring: "#34d399" },
  good: { primary: "#3b82f6", secondary: "#dbeafe", text: "#1e40af", ring: "#60a5fa" },
  "needs-attention": { primary: "#f59e0b", secondary: "#fef3c7", text: "#92400e", ring: "#fbbf24" },
  critical: { primary: "#ef4444", secondary: "#fee2e2", text: "#991b1b", ring: "#f87171" },
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
          style={{ color: `${color}99` }}
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
  healthLabel,
  healthStatus,
  loading,
  onViewFullAnalysis,
  summaryText,
}: CaseHealthOverviewProps) {
  const colors = STATUS_COLORS[healthStatus];

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
      className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${colors.primary}20` }}
          >
            <Shield size={14} style={{ color: colors.primary }} />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-slate-900">Case Health</h3>
            <p className="text-[9px] text-slate-500 font-medium">
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
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <RadialScore score={overallScore} status={healthStatus} size={110} strokeWidth={9} />
            <span className="text-[9px] font-semibold text-slate-400">Case Score</span>
          </div>

          {/* Metrics */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {/* Evidence Coverage */}
            <MetricBadge
              icon={<FileCheck size={12} />}
              label="Evidence"
              value={coverageValue}
              color="#6366f1"
              bgColor="#f0f0ff"
              borderColor="#e0e0ff"
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
              color={warningCount > 0 ? "#f59e0b" : "#10b981"}
              bgColor={warningCount > 0 ? "#fffbeb" : "#f0fdf4"}
              borderColor={warningCount > 0 ? "#fde68a" : "#bbf7d0"}
            />

            {/* Critical Issues */}
            <MetricBadge
              icon={<CircleAlert size={12} />}
              label="Critical"
              value={criticalCount > 0 ? `${criticalCount} Critical` : "None"}
              color={criticalCount > 0 ? "#ef4444" : "#10b981"}
              bgColor={criticalCount > 0 ? "#fef2f2" : "#f0fdf4"}
              borderColor={criticalCount > 0 ? "#fecaca" : "#bbf7d0"}
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
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold transition-all hover:shadow-sm active:scale-[0.99]"
            style={{
              background: `${colors.primary}10`,
              color: colors.primary,
              border: `1.5px solid ${colors.primary}30`,
            }}
          >
            View Full Analysis
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

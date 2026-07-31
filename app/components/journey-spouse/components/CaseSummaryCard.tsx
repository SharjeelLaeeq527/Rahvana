"use client";

/**
 * CaseSummaryCard — Compact health snapshot for the dashboard.
 *
 * Shows 2–3 lines max: executive summary truncated + health badge + CTA.
 * Full detailed narrative is now in the CSADrawer.
 * This component does NOT perform new analysis — it presents existing findings.
 */

import React from "react";
import { motion } from "framer-motion";
import { FileText, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import type { CaseNarrative } from "@/lib/case-strength";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CaseSummaryCardProps {
  /** The generated case narrative */
  narrative: CaseNarrative | null;
  /** Case health status for the header badge */
  healthStatus?: {
    status: "excellent" | "good" | "needs-attention" | "critical";
    label: string;
    color: string;
  };
  /** Whether the narrative is loading */
  loading?: boolean;
  /** CTA handler — opens the CSA drawer */
  onViewAnalysis?: () => void;
}

// ─── Health Status Styles ────────────────────────────────────────────────────────

const HEALTH_STYLES = {
  excellent: { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46", icon: CheckCircle2 },
  good: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", icon: CheckCircle2 },
  "needs-attention": { bg: "#fffbeb", border: "#fde68a", text: "#92400e", icon: AlertCircle },
  critical: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: AlertCircle },
};

// ─── Main Component ──────────────────────────────────────────────────────────────

export function CaseSummaryCard({
  narrative,
  healthStatus,
  loading = false,
  onViewAnalysis,
}: CaseSummaryCardProps) {
  const healthStyle = healthStatus
    ? HEALTH_STYLES[healthStatus.status]
    : HEALTH_STYLES["needs-attention"];
  const HealthIcon = healthStyle.icon;

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-slate-200" />
          <div className="w-24 h-4 rounded bg-slate-200" />
        </div>
        <div className="w-full h-3 rounded bg-slate-100" />
      </div>
    );
  }

  if (!narrative) return null;

  // Truncate executive summary to ~2 lines (approx 180 chars)
  const summary = narrative.executiveSummary;
  const truncated = summary.length > 180 ? summary.slice(0, 180).trim() + "..." : summary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
    >
      <div className="px-4 py-3 flex items-start gap-3">
        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
          <FileText className="w-4 h-4 text-indigo-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="text-[12px] font-bold text-slate-900">Case Summary</h3>
            {healthStatus && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold"
                style={{ background: healthStyle.bg, borderColor: healthStyle.border }}
              >
                <HealthIcon className="w-2.5 h-2.5" style={{ color: healthStyle.text }} />
                <span style={{ color: healthStyle.text }}>{healthStatus.label}</span>
              </div>
            )}
          </div>

          {/* 2–3 line executive summary */}
          <p className="text-[11px] text-slate-600 leading-relaxed">{truncated}</p>
        </div>

        {/* CTA */}
        {onViewAnalysis && (
          <button
            onClick={onViewAnalysis}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-primary hover:bg-primary/5 border border-primary/20 transition-all"
          >
            View Analysis
            <ArrowRight size={11} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

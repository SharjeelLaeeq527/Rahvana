"use client";

/**
 * CaseSummaryCard — Dynamic Case Narrative component.
 *
 * Displays a human-readable summary of the case state by consuming
 * existing CSA outputs (Evidence Gap Analysis + Consistency Intelligence).
 *
 * This component does NOT perform new analysis — it presents a narrative
 * interpretation of existing findings.
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";
import type { CaseNarrative, NarrativeBullet } from "@/lib/case-strength";

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
  /** Default collapsed state */
  defaultCollapsed?: boolean;
}

// ─── Health Status Styles ──────────────────────────────────────────────────────

const HEALTH_STYLES = {
  excellent: {
    bg: "#ecfdf5",
    border: "#a7f3d0",
    text: "#065f46",
    iconBg: "#d1fae5",
    icon: CheckCircle2,
  },
  good: {
    bg: "#eff6ff",
    border: "#bfdbfe",
    text: "#1e40af",
    iconBg: "#dbeafe",
    icon: CheckCircle2,
  },
  "needs-attention": {
    bg: "#fffbeb",
    border: "#fde68a",
    text: "#92400e",
    iconBg: "#fef3c7",
    icon: AlertCircle,
  },
  critical: {
    bg: "#fef2f2",
    border: "#fecaca",
    text: "#991b1b",
    iconBg: "#fee2e2",
    icon: AlertCircle,
  },
};

// ─── Section Styles ────────────────────────────────────────────────────────────

const SECTION_STYLES = {
  strengths: {
    icon: TrendingUp,
    iconColor: "#10b981",
    iconBg: "#d1fae5",
    title: "Strengths",
    borderColor: "#a7f3d0",
    bgColor: "#f0fdf4",
  },
  attention: {
    icon: AlertCircle,
    iconColor: "#f59e0b",
    iconBg: "#fef3c7",
    title: "Areas Requiring Attention",
    borderColor: "#fde68a",
    bgColor: "#fffbeb",
  },
  steps: {
    icon: ArrowRight,
    iconColor: "#3b82f6",
    iconBg: "#dbeafe",
    title: "Recommended Next Steps",
    borderColor: "#bfdbfe",
    bgColor: "#eff6ff",
  },
};

// ─── Main Component ────────────────────────────────────────────────────────────

export function CaseSummaryCard({
  narrative,
  healthStatus,
  loading = false,
  defaultCollapsed = false,
}: CaseSummaryCardProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [activeSection, setActiveSection] = useState<
    "executive" | "strengths" | "attention" | "steps"
  >("executive");

  // Health badge styles
  const healthStyle = healthStatus
    ? HEALTH_STYLES[healthStatus.status]
    : HEALTH_STYLES["needs-attention"];
  const HealthIcon = healthStyle.icon;

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-slate-200 animate-pulse" />
          <div className="w-24 h-4 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="w-full h-3 rounded bg-slate-100 animate-pulse" />
          <div className="w-4/5 h-3 rounded bg-slate-100 animate-pulse" />
          <div className="w-3/5 h-3 rounded bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!narrative) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Case Summary</h3>
              <p className="text-[10px] text-slate-500">AI-generated overview of your case</p>
            </div>
          </div>

          {/* Health Badge */}
          {healthStatus && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
              style={{
                background: healthStyle.bg,
                borderColor: healthStyle.border,
              }}
            >
              <HealthIcon className="w-3 h-3" style={{ color: healthStyle.text }} />
              <span className="text-[10px] font-semibold" style={{ color: healthStyle.text }}>
                {healthStatus.label}
              </span>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mt-2 w-full flex items-center justify-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 transition-colors"
        >
          <span>{collapsed ? "Show summary" : "Hide summary"}</span>
          <ChevronDown
            className="w-3.5 h-3.5 transition-transform"
            style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0)" }}
          />
        </button>
      </div>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Executive Summary */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="text-[12px] text-slate-700 leading-relaxed">
                {narrative.executiveSummary}
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-100">
              <TabButton
                active={activeSection === "strengths"}
                onClick={() => setActiveSection("strengths")}
                label="Strengths"
                count={narrative.strengths.length}
                color="#10b981"
              />
              <TabButton
                active={activeSection === "attention"}
                onClick={() => setActiveSection("attention")}
                label="Attention"
                count={narrative.areasRequiringAttention.length}
                color="#f59e0b"
              />
              <TabButton
                active={activeSection === "steps"}
                onClick={() => setActiveSection("steps")}
                label="Next Steps"
                count={narrative.recommendedNextSteps.length}
                color="#3b82f6"
              />
            </div>

            {/* Section Content */}
            <div className="p-3">
              {activeSection === "strengths" && (
                <BulletList
                  items={narrative.strengths}
                  style={SECTION_STYLES.strengths}
                  emptyMessage="No strengths identified yet. Continue building your case documentation."
                />
              )}
              {activeSection === "attention" && (
                <BulletList
                  items={narrative.areasRequiringAttention}
                  style={SECTION_STYLES.attention}
                  emptyMessage="No areas requiring attention. Your case documentation appears complete."
                />
              )}
              {activeSection === "steps" && (
                <BulletList
                  items={narrative.recommendedNextSteps}
                  style={SECTION_STYLES.steps}
                  emptyMessage="No specific next steps identified. Continue following your journey timeline."
                />
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/30">
              <p className="text-[9px] text-slate-400 text-center">
                Generated {new Date(narrative.generatedAt).toLocaleDateString()} · Based on Evidence
                Gap Analysis and Consistency Intelligence
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  label,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 px-3 text-[11px] font-medium transition-all relative ${
        active ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
      }`}
    >
      <div className="flex items-center justify-center gap-1.5">
        <span>{label}</span>
        {count > 0 && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{
              background: active ? `${color}20` : "#f1f5f9",
              color: active ? color : "#64748b",
            }}
          >
            {count}
          </span>
        )}
      </div>
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{ background: color }}
        />
      )}
    </button>
  );
}

function BulletList({
  items,
  style,
  emptyMessage,
}: {
  items: NarrativeBullet[];
  style: (typeof SECTION_STYLES)[keyof typeof SECTION_STYLES];
  emptyMessage: string;
}) {
  const Icon = style.icon;

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 py-3 px-2">
        <Info className="w-4 h-4 text-slate-400" />
        <p className="text-[11px] text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
      {items.map((item, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="rounded-lg border px-3 py-2"
          style={{
            borderColor: style.borderColor,
            background: style.bgColor,
          }}
        >
          <div className="flex items-start gap-2">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: style.iconBg }}
            >
              <Icon className="w-3 h-3" style={{ color: style.iconColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-slate-800">{item.text}</p>
              {item.detail && (
                <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">{item.detail}</p>
              )}
            </div>
            {item.source === "consistency" && (
              <span className="text-[8px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">
                CI
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

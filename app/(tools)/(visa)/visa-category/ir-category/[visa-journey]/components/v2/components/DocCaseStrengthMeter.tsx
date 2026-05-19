"use client";

/**
 * DocCaseStrengthMeter — Universal Case Strength Tool.
 * Drives off any step's document_items + state. Same component, any category.
 *
 * Three industry-standard dimensions:
 *   • Completeness     — required documents marked complete
 *   • Evidence Quality — done docs backed by upload + review/notes
 *   • Consistency      — eligibility answers align with documents
 *
 * Content shown comes from JSON document_items + computed state only —
 * no hardcoded category-specific text.
 */

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ExternalLink,
  Shield,
  FileText,
  Layers,
} from "lucide-react";
import type { UploadedDocument } from "@/lib/document-vault/types";
import { computeCaseStrength, type DocItem, type ScoringResult } from "@/lib/case-strength/doc-scoring";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DocCaseStrengthMeterProps {
  documentItems: DocItem[] | undefined | null;
  uploadedDocuments: UploadedDocument[];
  documentChecklist: Record<string, boolean> | undefined;
  docReviewStatus: Record<string, string> | undefined;
  docUploads: Record<string, unknown> | undefined;
  notes: Record<string, string> | undefined;
  /** Quest answers (eligibility-suite) — used for consistency checks */
  eligibilityAnswers?: Record<string, Record<string, string | string[]> | undefined> | null;
  /** Optional context for the side panel header — e.g. "Chapter 1 · Step 2" */
  contextLabel?: string;
  /** Optional step name shown as the card title */
  stepName?: string;
  /** Optional `relevantTools` from JSON (rendered as Guides & Tools section) */
  relevantTools?: Array<{ label: string; href: string; type?: string }>;
  /** Optional `pakistanSpecific` text from JSON (rendered verbatim — JSON-only content) */
  pakistanSpecificText?: string;
  /** If true, card starts collapsed (dashboard mode) */
  defaultCollapsed?: boolean;
  /** Compat: existing call sites may still pass `hasPriorMarriage` — ignored (derived from eligibilityAnswers) */
  hasPriorMarriage?: boolean;
}

// ─── Shared CollapsibleSection ────────────────────────────────────────────────

function CollapsibleSection({
  title,
  right,
  defaultOpen = true,
  children,
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left ${open ? "border-b border-slate-200" : ""}`}
        aria-expanded={open}
      >
        <span className="flex-1 text-[11.5px] font-bold uppercase tracking-wider text-slate-600">{title}</span>
        {right && <span className="text-[10.5px] text-slate-400">{right}</span>}
        <ChevronDown
          size={13}
          className="text-slate-400 shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
        />
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

// ─── Dimension bar ────────────────────────────────────────────────────────────

function DimensionBar({
  label, pct, color, hint,
}: { label: string; pct: number; color: string; hint?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[11.5px] font-semibold text-slate-700">{label}</span>
        <span className="text-[11.5px] font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-100">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      {hint && <div className="text-[10.5px] text-slate-400 mt-1 leading-snug">{hint}</div>}
    </div>
  );
}

// ─── Score ring (compact) ─────────────────────────────────────────────────────

function ScoreRing({ pct, color }: { pct: number; color: string }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const fill = (pct / 100) * circ;
  return (
    <div className="relative shrink-0" style={{ width: 64, height: 64 }}>
      <svg width={64} height={64} viewBox="0 0 64 64">
        <circle cx={32} cy={32} r={r} fill="none" stroke="#f1f5f9" strokeWidth={6} />
        <circle
          cx={32} cy={32} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
          transform="rotate(-90 32 32)"
          style={{ transition: "stroke-dasharray 0.7s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[13px] font-black leading-none" style={{ color }}>{pct}</span>
        <span className="text-[7.5px] text-slate-400 font-bold leading-none">/100</span>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function DocCaseStrengthMeter({
  documentItems,
  uploadedDocuments,
  documentChecklist,
  docReviewStatus,
  docUploads,
  notes,
  eligibilityAnswers,
  contextLabel = "Document Readiness",
  stepName,
  relevantTools,
  pakistanSpecificText,
  defaultCollapsed = false,
}: DocCaseStrengthMeterProps) {
  const [open, setOpen] = useState(!defaultCollapsed);

  const result: ScoringResult | null = useMemo(() => {
    if (!documentItems || documentItems.length === 0) return null;
    return computeCaseStrength(
      documentItems as DocItem[],
      uploadedDocuments,
      documentChecklist,
      docReviewStatus,
      docUploads,
      notes,
      eligibilityAnswers,
    );
  }, [documentItems, uploadedDocuments, documentChecklist, docReviewStatus, docUploads, notes, eligibilityAnswers]);

  if (!documentItems || documentItems.length === 0 || !result) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

      {/* ── Compact header (always visible) ─────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/60 transition-colors"
        style={{ background: open ? "white" : "#fafbfc" }}
        aria-expanded={open}
      >
        <ScoreRing pct={result.overall} color={result.strengthColor} />
        <div className="flex-1 min-w-0">
          <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 leading-tight">
            {contextLabel}
          </div>
          <div className="text-[13.5px] font-extrabold text-slate-900 leading-tight mt-0.5 truncate">
            {stepName || "Case Strength"}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full whitespace-nowrap"
              style={{ background: `${result.strengthColor}15`, color: result.strengthColor, border: `1px solid ${result.strengthColor}33` }}
            >
              {result.strengthLabel}
            </span>
            <span className="text-[10px] text-slate-500 truncate">
              {result.completeness.done}/{result.completeness.required} required
            </span>
          </div>
        </div>
        <ChevronDown
          size={15}
          className="text-slate-400 shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
        />
      </button>

      {/* ── Expanded body ───────────────────────────────────────────────── */}
      {open && (
        <div className="border-t border-slate-100 p-3 flex flex-col gap-3 bg-[#fafbfc]">

          {/* Three dimensions */}
          <div className="bg-white rounded-xl border border-slate-200 px-3 py-3 flex flex-col gap-2.5">
            <DimensionBar
              label="Completeness"
              pct={result.completeness.score}
              color="#3b82f6"
              hint={result.completeness.missing.length ? `${result.completeness.missing.length} required missing` : undefined}
            />
            <DimensionBar
              label="Evidence Quality"
              pct={result.evidenceQuality.score}
              color="#8b5cf6"
              hint={result.evidenceQuality.partialCount ? `${result.evidenceQuality.partialCount} partial evidence` : undefined}
            />
            <DimensionBar
              label="Consistency"
              pct={result.consistency.score}
              color="#06b6d4"
              hint={
                result.consistency.checks.length
                  ? `${result.consistency.checks.filter((c) => c.passed).length}/${result.consistency.checks.length} checks pass`
                  : "No conflicts detected"
              }
            />
          </div>

          {/* Consistency issues — analytical (not redundant with step content) */}
          {result.consistency.checks.some((c) => !c.passed) && (
            <CollapsibleSection
              title="Consistency Issues"
              right={`${result.consistency.checks.filter((c) => !c.passed).length}`}
              defaultOpen={true}
            >
              <ul className="p-3 flex flex-col gap-2">
                {result.consistency.checks.filter((c) => !c.passed).map((c) => (
                  <li key={c.id} className="flex items-start gap-2">
                    <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-[11.5px] font-semibold text-slate-800 leading-snug">{c.label}</div>
                      {c.hint && <div className="text-[10.5px] text-amber-700 leading-snug mt-0.5">{c.hint}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Weak evidence — analytical insight */}
          {result.evidenceQuality.weak.length > 0 && (
            <CollapsibleSection
              title="Strengthen Evidence"
              right={`${result.evidenceQuality.weak.length}`}
              defaultOpen={false}
            >
              <ul className="p-3 flex flex-col gap-1.5">
                {result.evidenceQuality.weak.map((w) => (
                  <li key={w.id} className="flex items-start gap-2 text-[11.5px] text-slate-800">
                    <AlertTriangle size={11} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium leading-snug">{w.name}</div>
                      <div className="text-[10px] text-slate-500 leading-snug">Marked done — upload file + mark reviewed for full credit</div>
                    </div>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          <p className="text-[9.5px] text-slate-400 text-center italic px-2">
            Advisory only — based on documents marked complete or uploaded.
          </p>
        </div>
      )}
    </div>
  );
}

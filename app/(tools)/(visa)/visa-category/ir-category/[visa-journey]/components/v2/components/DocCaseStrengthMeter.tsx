"use client";

/**
 * DocCaseStrengthMeter — minimal, user-friendly Case Strength card.
 *
 * Shows ONLY what the user needs to know:
 *   1. Critical missing — required docs not done (will block / weaken case)
 *   2. Helpful additions — optional docs that make the case stronger
 *   3. Inconsistencies — mismatch between what user said and what they uploaded
 *
 * No scores. No dimension bars. No technical jargon.
 * Returns null when nothing to flag — keeps the dashboard clean.
 */

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Star,
  CircleAlert,
} from "lucide-react";
import type { UploadedDocument } from "@/lib/document-vault/types";
import { computeCaseStrength, type DocItem } from "@/lib/case-strength/doc-scoring";

export interface DocCaseStrengthMeterProps {
  documentItems: DocItem[] | undefined | null;
  uploadedDocuments: UploadedDocument[];
  documentChecklist: Record<string, boolean> | undefined;
  docReviewStatus: Record<string, string> | undefined;
  docUploads: Record<string, unknown> | undefined;
  notes: Record<string, string> | undefined;
  eligibilityAnswers?: Record<string, Record<string, string | string[]> | undefined> | null;
  contextLabel?: string;
  stepName?: string;
  /** Compat — unused; kept for existing call sites */
  relevantTools?: Array<{ label: string; href: string; type?: string }>;
  pakistanSpecificText?: string;
  hasPriorMarriage?: boolean;
  /** If true the card starts collapsed (dashboard mode) and HIDES when nothing to flag */
  defaultCollapsed?: boolean;
}

export function DocCaseStrengthMeter({
  documentItems,
  uploadedDocuments,
  documentChecklist,
  docReviewStatus,
  docUploads,
  notes,
  eligibilityAnswers,
  contextLabel = "Documents",
  stepName,
  defaultCollapsed = false,
}: DocCaseStrengthMeterProps) {
  const [open, setOpen] = useState(!defaultCollapsed);

  const result = useMemo(() => {
    if (!documentItems || documentItems.length === 0) return null;
    return computeCaseStrength(
      documentItems as DocItem[],
      uploadedDocuments,
      documentChecklist,
      docReviewStatus,
      docUploads,
      notes,
      eligibilityAnswers
    );
  }, [
    documentItems,
    uploadedDocuments,
    documentChecklist,
    docReviewStatus,
    docUploads,
    notes,
    eligibilityAnswers,
  ]);

  if (!documentItems || documentItems.length === 0 || !result) return null;

  // What user needs to know — only actionable items
  const missingRequired = result.completeness.missing; // 🔴 must-fix
  const consistencyIssues = result.consistency.checks.filter((c) => !c.passed);
  const helpfulExtras = documentItems.filter((d) => {
    if (d.required) return false; // skip required (already counted)
    // Not done yet, optional but in the JSON
    const done =
      docReviewStatus?.[d.id] === "reviewed" ||
      documentChecklist?.[d.name] === true ||
      (docUploads?.[d.name] !== undefined && docUploads?.[d.name] !== null) ||
      !!notes?.[d.name];
    return !done;
  });

  const hasIssues = missingRequired.length > 0 || consistencyIssues.length > 0;
  const hasExtras = helpfulExtras.length > 0;

  // Dashboard: hide entirely when nothing useful to say
  if (defaultCollapsed && !hasIssues && !hasExtras) return null;

  // All clean (full step view only)
  const allClean = !hasIssues && !hasExtras;

  // Header tone
  const headerColor =
    missingRequired.length > 0 || consistencyIssues.length > 0
      ? "#dc2626"
      : hasExtras
        ? "#d97706"
        : "#059669";

  const headerLabel =
    missingRequired.length > 0
      ? `${missingRequired.length} missing`
      : consistencyIssues.length > 0
        ? `${consistencyIssues.length} mismatch`
        : hasExtras
          ? "Optional to add"
          : "All good";

  const HeaderIcon =
    missingRequired.length > 0
      ? AlertTriangle
      : consistencyIssues.length > 0
        ? CircleAlert
        : hasExtras
          ? Star
          : CheckCircle2;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Compact header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/60 transition-colors"
        style={{ background: open ? "white" : "#fafbfc" }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${headerColor}15`, border: `1.5px solid ${headerColor}33` }}
        >
          <HeaderIcon size={18} color={headerColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400">
            {contextLabel}
          </div>
          <div className="text-[13.5px] font-extrabold text-slate-900 mt-0.5 truncate">
            {stepName || "Your Documents"}
          </div>
          <div className="text-[11px] font-semibold mt-0.5" style={{ color: headerColor }}>
            {headerLabel}
          </div>
        </div>
        <ChevronDown
          size={15}
          className="text-slate-400 shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
        />
      </button>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-slate-100 p-3 flex flex-col gap-3 bg-[#fafbfc]">
          {/* All clean state — only when no missing AND no extras */}
          {allClean && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <div>
                <div className="text-[12.5px] font-bold text-emerald-900">All documents ready!</div>
                <div className="text-[11px] text-emerald-700">
                  Your case looks complete for this step.
                </div>
              </div>
            </div>
          )}

          {/* 🔴 Missing required */}
          {missingRequired.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 overflow-hidden">
              <div className="px-3 py-2 bg-red-100/60 border-b border-red-200 flex items-center gap-2">
                <AlertTriangle size={13} className="text-red-600" />
                <span className="text-[11.5px] font-bold text-red-800">These are missing</span>
              </div>
              <ul className="p-3 flex flex-col gap-2">
                {missingRequired.map((m) => (
                  <li key={m.id} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-slate-900 leading-snug">
                        {m.name}
                      </div>
                      {m.subtitle && (
                        <div className="text-[10.5px] text-slate-600 leading-snug mt-0.5">
                          {m.subtitle}
                        </div>
                      )}
                      {m.guideUrl && (
                        <Link
                          href={m.guideUrl}
                          className="inline-flex items-center gap-1 mt-1 text-[10.5px] font-bold text-blue-700 hover:underline"
                        >
                          How to get this <ExternalLink size={9} />
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 🟡 Consistency mismatches */}
          {consistencyIssues.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
              <div className="px-3 py-2 bg-amber-100/60 border-b border-amber-200 flex items-center gap-2">
                <CircleAlert size={13} className="text-amber-600" />
                <span className="text-[11.5px] font-bold text-amber-800">
                  Things don&apos;t match up
                </span>
              </div>
              <ul className="p-3 flex flex-col gap-2">
                {consistencyIssues.map((c) => (
                  <li key={c.id} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-slate-900 leading-snug">
                        {c.label}
                      </div>
                      {c.hint && (
                        <div className="text-[10.5px] text-amber-800 leading-snug mt-0.5">
                          {c.hint}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ⭐ Helpful additions */}
          {hasExtras && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 overflow-hidden">
              <div className="px-3 py-2 bg-blue-100/60 border-b border-blue-200 flex items-center gap-2">
                <Star size={13} className="text-blue-600" />
                <span className="text-[11.5px] font-bold text-blue-800">
                  Add these to make your case stronger
                </span>
              </div>
              <ul className="p-3 flex flex-col gap-2">
                {helpfulExtras.slice(0, 5).map((d) => (
                  <li key={d.id} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-slate-900 leading-snug">
                        {d.name}
                      </div>
                      {d.subtitle && (
                        <div className="text-[10.5px] text-slate-600 leading-snug mt-0.5">
                          {d.subtitle}
                        </div>
                      )}
                      {d.guideUrl && (
                        <Link
                          href={d.guideUrl}
                          className="inline-flex items-center gap-1 mt-1 text-[10.5px] font-bold text-blue-700 hover:underline"
                        >
                          Learn more <ExternalLink size={9} />
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
                {helpfulExtras.length > 5 && (
                  <li className="text-[10.5px] text-blue-700 font-semibold pl-3.5">
                    +{helpfulExtras.length - 5} more in the checklist below
                  </li>
                )}
              </ul>
            </div>
          )}

          <p className="text-[9.5px] text-slate-400 text-center italic px-2">
            Not legal advice, just a friendly check based on what you&apos;ve filled in.
          </p>
        </div>
      )}
    </div>
  );
}

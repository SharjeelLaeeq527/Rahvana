"use client";

/**
 * Chapter1HealthPanel — side panel showing the current step's case-strength checks.
 *
 * Uses the reusable FloatingSidePanel wrapper which:
 *   - Positions fixed on the right at xl+
 *   - Fades out when footer enters viewport (no overlap)
 *
 * Each step shows only its OWN checks — no info from other steps.
 * Scalability: swap `checkerRegistry` for new visa categories — UI untouched.
 */

import React, { useState } from "react";
import { ChevronDown, ListChecks } from "lucide-react";
import type { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import type { UploadedDocument } from "@/lib/document-vault/types";
import { FloatingSidePanel } from "./FloatingSidePanel";
import { StepHealthInline } from "./StepHealthInline";
import { runStepChecks, type StepChecker } from "@/lib/case-strength/step-checkers";

interface Chapter1HealthPanelProps {
  currentStep: any;
  chapters: any[];
  state: WizardState;
  uploadedDocuments: UploadedDocument[];
  checkerRegistry?: Record<string, StepChecker>;
}

export function Chapter1HealthPanel({
  currentStep,
  state,
  uploadedDocuments,
  checkerRegistry,
}: Chapter1HealthPanelProps) {
  const sId = currentStep?.step_key || currentStep?.id || "";
  const isChapter1 = sId.startsWith("step_1_");
  const [open, setOpen] = useState(true);

  if (!isChapter1) return null;

  const eligibilityAnswers =
    (state.answers?.["eligibility-suite"] as any) ??
    (state.metadata?.["questAnswers_eligibility-suite"] as any);

  const checks = runStepChecks(
    sId,
    { state, uploadedDocuments, eligibilityAnswers },
    checkerRegistry,
  );

  if (checks.length === 0) return null;

  const hasCritical = checks.some((c) => c.level === "critical");
  const hasWarning = checks.some((c) => c.level === "warning");
  const headerColor = hasCritical ? "#dc2626" : hasWarning ? "#d97706" : "#3b82f6";

  return (
    <FloatingSidePanel>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/60 transition-colors"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${headerColor}15`, border: `1.5px solid ${headerColor}33` }}
          >
            <ListChecks size={16} color={headerColor} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400">
              This Step
            </div>
            <div className="text-[13px] font-extrabold text-slate-900 mt-0.5">
              {checks.length} thing{checks.length === 1 ? "" : "s"} to check
            </div>
          </div>
          <ChevronDown
            size={14}
            className="text-slate-400 shrink-0 transition-transform"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
          />
        </button>
        {open && (
          <div className="border-t border-slate-100 p-3 bg-[#fafbfc]">
            <StepHealthInline
              stepKey={sId}
              state={state}
              uploadedDocuments={uploadedDocuments}
              eligibilityAnswers={eligibilityAnswers}
              registry={checkerRegistry}
              compact={true}
            />
          </div>
        )}
      </div>
    </FloatingSidePanel>
  );
}

/**
 * Aggregate all case-strength issues across a chapter's steps into a single list.
 * Used by the dashboard to show ONLY critical/actionable items (not full details).
 *
 * Each item points back to the step where the user can fix it.
 */

import type { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import type { UploadedDocument } from "@/lib/document-vault/types";
import { runStepChecks, IR1_STEP_CHECKERS, type StepChecker } from "./step-checkers";
import { detectRiskFlagsFromEligibilityQuest } from "./eligibility-quest-detector";
import { computeCaseStrength } from "./doc-scoring";
import { getActiveStepsForStage } from "@/app/(tools)/(visa)/visa-category/ir-category/[visa-journey]/components/v2/journeyHelpers";

export interface AggregatedIssue {
  level: "critical" | "warning" | "info";
  title: string;
  hint?: string;
  stepKey: string;
  stepName: string;
  /** Display number shown in UI (from JSON step_number/display_order) */
  stepNumber: number;
  chapterIdx: number;
  /** Array index within chapter.steps — used for navigation */
  stepIdx: number;
  /** When true, the item has been addressed — shows checkmark and disables navigation */
  resolved?: boolean;
}

/** Extract step number from JSON or fall back to parsing the step_key */
function getStepNumber(step: any, fallbackIdx: number): number {
  return step?.step_number ?? step?.display_order ?? fallbackIdx + 1;
}

interface AggregateContext {
  chapters: any[];
  state: WizardState;
  uploadedDocuments: UploadedDocument[];
  registry?: Record<string, StepChecker>;
}

export function aggregateChapter1Issues({
  chapters,
  state,
  uploadedDocuments,
  registry = IR1_STEP_CHECKERS,
}: AggregateContext): AggregatedIssue[] {
  const issues: AggregatedIssue[] = [];

  const eligibilityAnswers =
    (state.answers?.["eligibility-suite"] as any) ??
    (state.metadata?.["questAnswers_eligibility-suite"] as any);

  const chapter1 = chapters?.[0];
  if (!chapter1) return [];

  const steps = chapter1.steps || [];

  // 1. Eligibility quest risks → tag to step_1_1
  const eligFlags = detectRiskFlagsFromEligibilityQuest(eligibilityAnswers);
  const step_1_1Idx = steps.findIndex((s: any) => s.step_key === "step_1_1");
  const step_1_1 = steps[step_1_1Idx];
  const step_1_1Name = step_1_1?.step_name ?? "Eligibility";
  for (const f of eligFlags) {
    issues.push({
      level: f.severity === "critical" ? "critical" : f.severity === "warning" ? "warning" : "info",
      title: f.title,
      hint: f.advisory,
      stepKey: "step_1_1",
      stepName: step_1_1Name,
      stepNumber: getStepNumber(step_1_1, step_1_1Idx),
      chapterIdx: 0,
      stepIdx: step_1_1Idx >= 0 ? step_1_1Idx : 0,
    });
  }

  // 2. Document analyzer issues → tag to step_1_2
  const step_1_2 = steps.find((s: any) => s.step_key === "step_1_2");
  const step_1_2Idx = steps.findIndex((s: any) => s.step_key === "step_1_2");
  const docItems = (step_1_2 as any)?.document_items as any[] | undefined;
  if (docItems && docItems.length > 0) {
    const docResult = computeCaseStrength(
      docItems,
      uploadedDocuments,
      state.documentChecklist,
      state.metadata?.docReviewStatus as Record<string, string> | undefined,
      state.docUploads,
      state.notes,
      eligibilityAnswers
    );
    for (const m of docResult.completeness.missing) {
      issues.push({
        level: "critical",
        title: `Missing: ${m.name}`,
        hint: m.subtitle,
        stepKey: "step_1_2",
        stepName: step_1_2?.step_name ?? "Documents",
        stepNumber: getStepNumber(step_1_2, step_1_2Idx),
        chapterIdx: 0,
        stepIdx: step_1_2Idx >= 0 ? step_1_2Idx : 1,
      });
    }
    for (const c of docResult.consistency.checks.filter((c) => !c.passed)) {
      issues.push({
        level: "warning",
        title: c.label,
        hint: c.hint,
        stepKey: "step_1_2",
        stepName: step_1_2?.step_name ?? "Documents",
        stepNumber: getStepNumber(step_1_2, step_1_2Idx),
        chapterIdx: 0,
        stepIdx: step_1_2Idx >= 0 ? step_1_2Idx : 1,
      });
    }
  }

  // 3. Per-step checker results for every Chapter 1 step (except 1.1 and 1.2 already covered)
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepKey = step.step_key as string;
    if (!stepKey || stepKey === "step_1_1" || stepKey === "step_1_2") continue;

    const checks = runStepChecks(
      stepKey,
      { state, uploadedDocuments, eligibilityAnswers },
      registry
    );
    for (const c of checks) {
      issues.push({
        level: c.level,
        title: c.title,
        hint: c.hint,
        stepKey,
        stepName: step.step_name ?? stepKey,
        stepNumber: getStepNumber(step, i),
        chapterIdx: 0,
        stepIdx: i,
        resolved: c.resolved,
      });
    }
  }

  // Sort: critical → warning → info; within each, preserve step order
  const order = { critical: 0, warning: 1, info: 2 };
  return issues.sort((a, b) => order[a.level] - order[b.level]);
}

/**
 * Aggregate Chapter 2 (NVC / CEAC) issues for the dashboard.
 *
 * Simpler than Chapter 1: every check — including the civil-document analysis
 * at step_2_4 — flows through the per-step checker registry, which now receives
 * the step's JSON node via `ctx.step`. No special-casing needed here.
 */
export function aggregateChapter2Issues({
  chapters,
  state,
  uploadedDocuments,
  registry = IR1_STEP_CHECKERS,
}: AggregateContext): AggregatedIssue[] {
  const issues: AggregatedIssue[] = [];

  const eligibilityAnswers =
    (state.answers?.["eligibility-suite"] as any) ??
    (state.metadata?.["questAnswers_eligibility-suite"] as any);

  const chapter2 = chapters?.[1];
  if (!chapter2) return [];

  const steps = chapter2.steps || [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepKey = step.step_key as string;
    if (!stepKey) continue;

    const checks = runStepChecks(
      stepKey,
      { state, uploadedDocuments, eligibilityAnswers, step },
      registry
    );
    for (const c of checks) {
      issues.push({
        level: c.level,
        title: c.title,
        hint: c.hint,
        stepKey,
        stepName: step.step_name ?? stepKey,
        stepNumber: getStepNumber(step, i),
        chapterIdx: 1,
        stepIdx: i,
        resolved: c.resolved,
      });
    }
  }

  const order = { critical: 0, warning: 1, info: 2 };
  return issues.sort((a, b) => order[a.level] - order[b.level]);
}

/**
 * Aggregate Chapter 3 (Medical + Interview) issues for the dashboard.
 *
 * Chapter 3 has interview-outcome-gated steps (visible_when on interviewOutcome
 * / outcome221gSubtype). We use the canonical `getActiveStepsForStage` helper to
 * decide which steps are visible, then run the per-step checkers only for those —
 * so we never surface, say, the "Track Visa Issuance" check on a 221(g) case.
 * (CLAUDE.md: never evaluate visible_when inline.) `stepIdx` stays the raw index
 * into `chapter.steps`, matching how the step view navigates.
 */
export function aggregateChapter3Issues({
  chapters,
  state,
  uploadedDocuments,
  registry = IR1_STEP_CHECKERS,
}: AggregateContext): AggregatedIssue[] {
  const issues: AggregatedIssue[] = [];

  const eligibilityAnswers =
    (state.answers?.["eligibility-suite"] as any) ??
    (state.metadata?.["questAnswers_eligibility-suite"] as any);

  const chapter3 = chapters?.[2];
  if (!chapter3) return [];

  const steps = chapter3.steps || [];

  const visibleKeys = new Set(
    getActiveStepsForStage({ chapters } as any, 2, state.metadata, state.filingType).map(
      (s: any) => s.step_key || s.id
    )
  );

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepKey = step.step_key as string;
    if (!stepKey || !visibleKeys.has(stepKey)) continue;

    const checks = runStepChecks(
      stepKey,
      { state, uploadedDocuments, eligibilityAnswers, step },
      registry
    );
    for (const c of checks) {
      issues.push({
        level: c.level,
        title: c.title,
        hint: c.hint,
        stepKey,
        stepName: step.step_name ?? stepKey,
        stepNumber: getStepNumber(step, i),
        chapterIdx: 2,
        stepIdx: i,
        resolved: c.resolved,
      });
    }
  }

  const order = { critical: 0, warning: 1, info: 2 };
  return issues.sort((a, b) => order[a.level] - order[b.level]);
}

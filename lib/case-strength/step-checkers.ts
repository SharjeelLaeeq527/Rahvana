/**
 * Step-specific case strength checks.
 *
 * Registry pattern — each step has its own checker function that returns
 * inline alerts to show in the step UI. Future visa categories can swap
 * the registry entirely without touching the UI component.
 */

import type { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import type { UploadedDocument } from "@/lib/document-vault/types";
import { detectRiskFlagsFromEligibilityQuest } from "./eligibility-quest-detector";
import { detectRiskFlags } from "./risk-detector";

export interface StepCheck {
  level: "info" | "warning" | "critical";
  title: string;
  hint?: string;
}

export interface StepCheckContext {
  state: WizardState;
  uploadedDocuments: UploadedDocument[];
  eligibilityAnswers:
    | Record<string, Record<string, string | string[]> | undefined>
    | null
    | undefined;
}

export type StepChecker = (ctx: StepCheckContext) => StepCheck[];

// ─── Helper: pull persisted quest answers ───────────────────────────────────

function getQuestAnswers(state: WizardState) {
  return (
    (state.answers?.["eligibility-suite"] as any) ??
    (state.metadata?.["questAnswers_eligibility-suite"] as any)
  );
}

// ─── IR-1 step-by-step checkers ─────────────────────────────────────────────

export const IR1_STEP_CHECKERS: Record<string, StepChecker> = {
  // Step 1.3 — Choose Filing Method
  step_1_3: ({ state }) => {
    const checks: StepCheck[] = [];
    const fm = state.metadata?.filingMethod as string | undefined;
    const confirmed = state.metadata?.filingMethodConfirmed === true;
    if (!fm) {
      checks.push({
        level: "warning",
        title: "Filing method not chosen yet",
        hint: "Pick online or paper to unlock the next steps",
      });
    } else if (!confirmed) {
      checks.push({
        level: "info",
        title: `Filing method: ${fm}`,
        hint: "Confirm your choice to continue",
      });
    }
    return checks;
  },

  // Step 1.4 — Fill I-130
  step_1_4: ({ state, eligibilityAnswers }) => {
    const checks: StepCheck[] = [];
    const baseline = state.metadata?.consistencyBaseline as any;
    if (!baseline?.marriageDate) {
      checks.push({
        level: "warning",
        title: "Marriage date missing",
        hint: "Enter your marriage date — it'll be cross-checked with Nikah Nama",
      });
    }
    if (!baseline?.petitionerDateOfBirth || !baseline?.beneficiaryDateOfBirth) {
      checks.push({
        level: "warning",
        title: "Date of birth missing",
        hint: "Add both petitioner and beneficiary date of birth",
      });
    }
    // Run date-based risk detection
    if (baseline?.marriageDate) {
      const dateFlags = detectRiskFlags({
        marriage_date: baseline.marriageDate,
        petitioner_dob: baseline.petitionerDateOfBirth,
        beneficiary_dob: baseline.beneficiaryDateOfBirth,
      });
      for (const f of dateFlags) {
        checks.push({
          level: f.severity === "critical" ? "critical" : "warning",
          title: f.title,
          hint: f.advisory,
        });
      }
    }
    return checks;
  },

  // Step 1.5 — Fill I-130A
  step_1_5: ({ state }) => {
    const checks: StepCheck[] = [];
    const bene = state.metadata?.beneficiaryBaseline as any;
    if (!bene?.currentCountry) {
      checks.push({
        level: "warning",
        title: "Current country missing",
        hint: "Enter the beneficiary's current country of residence",
      });
    }
    if (bene?.additionalCountries && bene.additionalCountries.length > 0) {
      checks.push({
        level: "info",
        title: "Multiple country history detected",
        hint: "You may need police certificates from each country lived in for 6+ months",
      });
    }
    return checks;
  },

  // Step 1.6 — Method-specific setup
  step_1_6: ({ state }) => {
    const checks: StepCheck[] = [];
    const fm = state.metadata?.filingMethod as string | undefined;
    if (fm === "online" && !state.metadata?.uscisAccountReady) {
      checks.push({
        level: "warning",
        title: "USCIS online account not confirmed",
        hint: "Create a myUSCIS account before submitting online",
      });
    }
    if (fm === "paper" && !state.metadata?.mailingAddressConfirmed) {
      checks.push({
        level: "info",
        title: "Confirm USCIS mailing address",
        hint: "Verify the current USCIS lockbox address for your category",
      });
    }
    return checks;
  },

  // Step 1.7 — Fee preparation
  step_1_7: ({ state }) => {
    const checks: StepCheck[] = [];
    if (!state.metadata?.feePaymentReady) {
      checks.push({
        level: "info",
        title: "Payment method ready?",
        hint: "USCIS accepts credit/debit card (online) or check/money order (paper)",
      });
    }
    return checks;
  },

  // Step 1.8 — Upload (file quality)
  step_1_8: ({ uploadedDocuments }) => {
    const checks: StepCheck[] = [];
    const MAX_SIZE_MB = 12;
    const ALLOWED = ["pdf", "jpg", "jpeg", "tif", "tiff"];
    let oversized = 0;
    let wrongFormat = 0;
    for (const u of uploadedDocuments) {
      const sizeMb = (u as any).sizeBytes ? (u as any).sizeBytes / (1024 * 1024) : 0;
      if (sizeMb > MAX_SIZE_MB) oversized++;
      const ext = ((u as any).fileName || "").split(".").pop()?.toLowerCase();
      if (ext && !ALLOWED.includes(ext)) wrongFormat++;
    }
    if (oversized > 0) {
      checks.push({
        level: "critical",
        title: `${oversized} file${oversized === 1 ? " is" : "s are"} too large`,
        hint: "USCIS limit is 12MB per file — compress before uploading",
      });
    }
    if (wrongFormat > 0) {
      checks.push({
        level: "critical",
        title: `${wrongFormat} file${wrongFormat === 1 ? " has" : "s have"} wrong format`,
        hint: "Use PDF, JPG, or TIF only",
      });
    }
    return checks;
  },

  // Step 1.9 — Pre-Submission Review (unresolved blockers)
  step_1_9: ({ state, eligibilityAnswers }) => {
    const checks: StepCheck[] = [];
    const flags = detectRiskFlagsFromEligibilityQuest(eligibilityAnswers);
    const critical = flags.filter((f) => f.severity === "critical");
    if (critical.length > 0) {
      checks.push({
        level: "critical",
        title: `${critical.length} unresolved blocker${critical.length === 1 ? "" : "s"} from eligibility`,
        hint: "Go back to Chapter 1 Step 2 and add the missing documents before submitting",
      });
    }
    return checks;
  },

  // Step 1.10 — Review & Submit (final consistency check)
  step_1_10: ({ state, eligibilityAnswers }) => {
    const checks: StepCheck[] = [];
    const baseline = state.metadata?.consistencyBaseline as any;
    if (
      !baseline?.marriageDate ||
      !baseline?.petitionerDateOfBirth ||
      !baseline?.beneficiaryDateOfBirth
    ) {
      checks.push({
        level: "warning",
        title: "Key dates not captured",
        hint: "Go to Chapter 1 Step 4 and save marriage date + DOBs first",
      });
    }
    const flags = detectRiskFlagsFromEligibilityQuest(eligibilityAnswers);
    if (flags.filter((f) => f.severity === "critical").length > 0) {
      checks.push({
        level: "critical",
        title: "Unresolved critical issues — do not submit yet",
        hint: "Fix the critical items in earlier steps first",
      });
    }
    return checks;
  },

  // Step 1.13 — Mailing (packet checklist)
  step_1_13: ({ state }) => {
    const checks: StepCheck[] = [];
    const pkt = state.metadata?.packetChecklist as Record<string, boolean> | undefined;
    if (!pkt || Object.keys(pkt).length === 0) {
      checks.push({
        level: "warning",
        title: "Packet checklist not started",
        hint: "Tick off each item as you place it in the envelope",
      });
    }
    return checks;
  },

  // Step 1.14 — Tracking & receipt
  step_1_14: ({ state }) => {
    const checks: StepCheck[] = [];
    const fm = state.metadata?.filingMethod as string | undefined;
    if (fm === "paper" && !state.metadata?.mailingTrackingNumber) {
      checks.push({
        level: "info",
        title: "Save USPS tracking number",
        hint: "You'll use it to confirm USCIS received your packet",
      });
    }
    return checks;
  },

  // Step 1.15 / 1.16 / 1.17 — Receipt number entry
  step_1_15: ({ state }) => receiptChecks(state),
  step_1_16: ({ state }) => receiptChecks(state),
  step_1_17: ({ state }) => receiptChecks(state),
};

// ─── Shared helper ──────────────────────────────────────────────────────────

function receiptChecks(state: WizardState): StepCheck[] {
  // Receipt is stored in a separate DB table (receipts), not wizard metadata.
  // Use step completion as the signal — when user saves receipt the step
  // gets marked complete and this check disappears automatically.
  const receiptStepDone =
    state.completedSteps?.has?.("step_1_15") ||
    state.completedSteps?.has?.("step_1_16") ||
    state.completedSteps?.has?.("step_1_17");

  if (receiptStepDone) return [];

  // Also check any metadata paths that some flows may write
  const num = (
    (state.metadata?.receiptNum as string) ||
    (state.metadata?.receiptNumber as string) ||
    (state.metadata?.uscis_receipt_number as string)
  );
  if (num) return [];

  return [
    {
      level: "info",
      title: "Receipt number not saved yet",
      hint: "Enter it from your USCIS Form I-797C notice to enable case tracking",
    },
  ];
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function runStepChecks(
  stepKey: string,
  ctx: StepCheckContext,
  registry: Record<string, StepChecker> = IR1_STEP_CHECKERS
): StepCheck[] {
  const checker = registry[stepKey];
  if (!checker) return [];
  try {
    return checker(ctx);
  } catch (e) {
    console.warn("[stepCheckers] Failed for", stepKey, e);
    return [];
  }
}

/**
 * Advanced Consistency Intelligence Engine — Phase 1
 *
 * Cross-validates information already collected across the journey to detect
 * contradictions, timeline issues, and adjudication risks BEFORE they surface
 * at interview. Pure functions — no side effects.
 *
 * This module complements (does NOT replace) the existing:
 *   - consistency.ts        (marriage date + DOB cross-form comparison)
 *   - risk-detector.ts      (marriage duration, never-met, prior marriage patterns)
 *   - eligibility-quest-detector.ts  (eligibility answer → risk flags)
 *
 * Sourcing: 9 FAM 504.4 (civil documents), 9 FAM 302.8 (medical),
 * INA 212(a)(6)(C) (misrepresentation), USCIS Policy Manual Vol.9.
 */

import type { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import type { UploadedDocument } from "@/lib/document-vault/types";
import { isDocUploadedInVault, mapDocumentNameToId } from "@/lib/document-vault/journey-mapping";

// ─── Finding Model ──────────────────────────────────────────────────────────────

export type FindingSeverity = "critical" | "warning" | "informational";

export type FindingCategory =
  | "FORM_CONSISTENCY"
  | "TIMELINE"
  | "FINANCIAL"
  | "IDENTITY"
  | "IMMIGRATION"
  | "MEDICAL"
  | "POST_INTERVIEW";

export interface ConsistencyFinding {
  /** Unique machine ID for deduplication and testing */
  id: string;
  severity: FindingSeverity;
  category: FindingCategory;
  title: string;
  description: string;
  /** Actionable guidance — what the user should do to resolve it */
  resolution: string;
  /** Source references for the finding (e.g., "I-130 §4 vs DS-260 §18") */
  sources?: string[];
  /** The step key where the user can address this finding */
  actionableStepKey?: string;
  /** When true, the finding has been addressed — shows checkmark in sidebar */
  resolved?: boolean;
}

// ─── Input Shape ────────────────────────────────────────────────────────────────

export interface ConsistencyIntelligenceInput {
  state: WizardState;
  eligibilityAnswers:
    | Record<string, Record<string, string | string[]> | undefined>
    | null
    | undefined;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function meta(state: WizardState, key: string): any {
  return state.metadata?.[key];
}

function daysBetween(a: string, b: string): number | null {
  const da = new Date(a);
  const db = new Date(b);
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return null;
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

function monthsBetween(fromIso: string, toIso: string): number | null {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  const years = to.getFullYear() - from.getFullYear();
  const months = to.getMonth() - from.getMonth();
  return years * 12 + months;
}

// ─── Main Engine ────────────────────────────────────────────────────────────────

/**
 * Run ALL Phase 1 consistency checks against the current journey state.
 * Returns deduplicated findings sorted by severity (critical → warning → info).
 */
export function runConsistencyIntelligence(
  input: ConsistencyIntelligenceInput
): ConsistencyFinding[] {
  const findings: ConsistencyFinding[] = [];
  const { state, eligibilityAnswers } = input;

  // NOTE: Form Consistency (marriage date + DOB cross-form comparison),
  // Age Gap Analysis, and Marriage Duration Analysis are handled by the
  // existing step-checkers.ts (step_1_4, step_2_3) via compareBaselines()
  // and detectRiskFlags(). We do NOT duplicate them here.

  // ── 2. Visa Category Consistency ──
  findings.push(...checkVisaCategoryConsistency(state));

  // ── 3. Consulate / Embassy Consistency ──
  findings.push(...checkConsulateConsistency(state));

  // ── 4. Interview Date Consistency ──
  findings.push(...checkInterviewDateConsistency(state));

  // ── 5. Medical Timeline Validation ──
  findings.push(...checkMedicalTimeline(state));

  // ── 6. Police Certificate Timeline ──
  findings.push(...checkPoliceCertificateTimeline(state, eligibilityAnswers));

  // ── 7. Financial Support Consistency ──
  findings.push(...checkFinancialConsistency(state));

  // ── 8. 221(g) Follow-Up Validation ──
  findings.push(...check221gFollowUp(state));

  // ── Deduplicate by ID ──
  const seen = new Set<string>();
  const deduped = findings.filter((f) => {
    if (seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });

  // ── Sort: critical → warning → informational ──
  const order: Record<FindingSeverity, number> = {
    critical: 0,
    warning: 1,
    informational: 2,
  };
  return deduped.sort((a, b) => order[a.severity] - order[b.severity]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ── 2. Visa Category Consistency ────────────────────────────────────────────────

function checkVisaCategoryConsistency(state: WizardState): ConsistencyFinding[] {
  const findings: ConsistencyFinding[] = [];

  // Compare visa category stored across journey records
  // Actual keys: dqCategory (DQ tool), scenarioType (state-level), interviewSaved metadata
  const dqCategory = meta(state, "dqCategory");
  const scenarioType = state.scenarioType;
  const interviewCategory = meta(state, "interviewCategory");

  const categories = [dqCategory, scenarioType, interviewCategory].filter(Boolean);
  // Normalize: extract IR-1 or CR-1 from values like "ir-1", "IR-1", "immediate-relative", etc.
  const normalized = categories.map((c: string) => {
    const upper = c.toUpperCase().trim();
    if (upper.includes("IR-1") || upper.includes("IR1") || upper === "IMMEDIATE-RELATIVE")
      return "IR-1";
    if (upper.includes("CR-1") || upper.includes("CR1")) return "CR-1";
    return upper;
  });
  const unique = [...new Set(normalized)];

  if (unique.length > 1) {
    findings.push({
      id: "visa_category_mismatch",
      severity: "critical",
      category: "IDENTITY",
      title: "Visa category inconsistency detected",
      description: `Different visa categories found across records: ${unique.join(", ")}. This could cause NVC to process your case under the wrong category.`,
      resolution:
        "Verify the correct visa category (IR-1 vs CR-1 depends on marriage duration at time of petition filing). Ensure all forms and records agree.",
      sources: ["9 FAM 504.1"],
      actionableStepKey: "step_2_3",
    });
  }

  return findings;
}

// ── 3. Consulate / Embassy Consistency ──────────────────────────────────────────

function checkConsulateConsistency(state: WizardState): ConsistencyFinding[] {
  const findings: ConsistencyFinding[] = [];

  // Actual metadata keys: consulateLocation (AppointmentReceivedTool),
  // dqPost (DQ Recording Tool), interviewEmbassy (various)
  const appointmentConsulate = meta(state, "consulateLocation");
  const dqPost = meta(state, "dqPost");
  const interviewEmbassy = meta(state, "interviewEmbassy");

  const locations = [
    { label: "Appointment", value: appointmentConsulate },
    { label: "DQ Post", value: dqPost },
    { label: "Interview Embassy", value: interviewEmbassy },
  ].filter((l) => l.value);

  const uniqueLocations = [...new Set(locations.map((l) => String(l.value).trim().toLowerCase()))];

  if (uniqueLocations.length > 1) {
    const details = locations
      .filter((l) => l.value)
      .map((l) => `${l.label}: ${l.value}`)
      .join("; ");

    findings.push({
      id: "consulate_mismatch",
      severity: "warning",
      category: "IDENTITY",
      title: "Consulate/Embassy inconsistency detected",
      description: `Different interview locations found across records — ${details}. This may indicate a data entry error or an unprocessed transfer request.`,
      resolution:
        "Verify your assigned interview location on CEAC. If you've requested a post transfer, confirm NVC has processed it before document submission.",
      sources: ["9 FAM 504.4-2"],
      actionableStepKey: "step_2_3",
    });
  }

  return findings;
}

// ── 4. Interview Date Consistency ───────────────────────────────────────────────

function checkInterviewDateConsistency(state: WizardState): ConsistencyFinding[] {
  const findings: ConsistencyFinding[] = [];

  const interviewDate = meta(state, "interviewDate");
  const ceacInterviewDate = meta(state, "ceac_interview_date");
  const appointmentLetterDate = meta(state, "appointment_letter_date");

  const dates = [
    { label: "Saved interview date", value: interviewDate },
    { label: "CEAC interview date", value: ceacInterviewDate },
    { label: "Appointment letter date", value: appointmentLetterDate },
  ].filter((d) => d.value);

  const uniqueDates = [...new Set(dates.map((d) => String(d.value).trim()))];

  if (uniqueDates.length > 1) {
    findings.push({
      id: "interview_date_conflict",
      severity: "warning",
      category: "TIMELINE",
      title: "Conflicting interview dates detected",
      description: `Different interview dates found: ${dates.map((d) => `${d.label}: ${d.value}`).join(", ")}. This could mean a rescheduled appointment was not updated everywhere.`,
      resolution:
        "Confirm your actual interview date on CEAC and update all records to match. If the embassy rescheduled your appointment, save the new date.",
      actionableStepKey: "step_2_12",
    });
  }

  // Check if interview date is in the past
  if (interviewDate) {
    const days = daysBetween(new Date().toISOString(), interviewDate);
    if (days !== null && days < 0) {
      findings.push({
        id: "interview_date_past",
        severity: "informational",
        category: "TIMELINE",
        title: "Interview date has passed",
        description: `The recorded interview date (${interviewDate}) is in the past.`,
        resolution:
          "Record your interview outcome (approved, 221(g), or refused) so Rahvana can show the correct next steps for your situation.",
        actionableStepKey: "step_3_9",
      });
    }
  }

  return findings;
}

// ── 5. Medical Timeline Validation ──────────────────────────────────────────────

function checkMedicalTimeline(state: WizardState): ConsistencyFinding[] {
  const findings: ConsistencyFinding[] = [];

  const interviewDate = meta(state, "interviewDate") as string | undefined;
  // med_date from MedicalExamTool/StepToolRenderer, medicalDate from DashboardView
  const medDate = (meta(state, "med_date") || meta(state, "medicalDate")) as string | undefined;
  const medApptSaved = meta(state, "med_appt_saved") === "true";
  const medCompleted =
    state.completedSteps?.has?.("step_3_4") || state.completedSteps?.has?.("step_3_5");

  // Medical scheduled AFTER interview
  if (interviewDate && medDate) {
    const days = daysBetween(interviewDate, medDate);
    if (days !== null && days > 0) {
      findings.push({
        id: "medical_after_interview",
        severity: "critical",
        category: "MEDICAL",
        title: "Medical exam scheduled after interview",
        description: `The medical exam (${medDate}) is scheduled after the interview (${interviewDate}). The medical must be completed before your interview — the panel physician needs time to transmit sealed results to the embassy.`,
        resolution:
          "Reschedule the medical exam to at least 2–3 weeks before the interview. Contact the panel physician immediately to request an earlier appointment.",
        sources: ["9 FAM 302.8"],
        actionableStepKey: "step_3_1",
      });
    }
  }

  // Medical results may expire before interview (typical validity: 6 months)
  if (interviewDate && medDate) {
    const daysToMed = daysBetween(medDate, interviewDate);
    if (daysToMed !== null && daysToMed > 180) {
      findings.push({
        id: "medical_expiry_before_interview",
        severity: "warning",
        category: "MEDICAL",
        title: "Medical exam may expire before interview",
        description: `The medical exam (${medDate}) will be more than 6 months before the interview (${interviewDate}). Most embassies require the medical to be valid at the time of interview, not just at submission.`,
        resolution:
          "Confirm your embassy's medical validity requirements. You may need to schedule a later medical appointment or request a re-examination.",
        sources: ["9 FAM 302.8-2"],
        actionableStepKey: "step_3_1",
      });
    }
  }

  // Interview is set but no medical scheduled
  if (interviewDate && !medApptSaved && !medCompleted) {
    const daysToInterview = daysBetween(new Date().toISOString(), interviewDate);
    if (daysToInterview !== null && daysToInterview > 0 && daysToInterview < 60) {
      findings.push({
        id: "medical_not_scheduled_urgent",
        severity: "warning",
        category: "MEDICAL",
        title: "Medical exam not scheduled — interview approaching",
        description: `Your interview is in ${daysToInterview} days but the medical exam hasn't been scheduled yet. Panel physician slots fill up fast.`,
        resolution:
          "Book the medical exam immediately. Bring your polio certificate, passport, and appointment letter to the exam.",
        actionableStepKey: "step_3_1",
      });
    }
  }

  return findings;
}

// ── 6. Police Certificate Timeline ──────────────────────────────────────────────

function checkPoliceCertificateTimeline(
  state: WizardState,
  eligibilityAnswers: ConsistencyIntelligenceInput["eligibilityAnswers"]
): ConsistencyFinding[] {
  const findings: ConsistencyFinding[] = [];

  const interviewDate = meta(state, "interviewDate") as string | undefined;
  const pccSaved = meta(state, "pcc_saved") === "true";
  const pccReceived = meta(state, "pcc_received") === "true";
  // pcc_date from StepToolRenderer/PoliceClearanceTool (NOT pcc_issue_date)
  const pccIssueDate = meta(state, "pcc_date") as string | undefined;
  const interviewStepDone = state.completedSteps?.has?.("step_3_3");

  // PCC missing when interview is approaching
  if (interviewDate && !pccSaved && !pccReceived && !interviewStepDone) {
    const daysToInterview = daysBetween(new Date().toISOString(), interviewDate);
    if (daysToInterview !== null && daysToInterview > 0 && daysToInterview < 90) {
      findings.push({
        id: "pcc_missing_urgent",
        severity: "warning",
        category: "IMMIGRATION",
        title: "Fresh police certificate needed — interview approaching",
        description: `Your interview is in ${daysToInterview} days but a fresh police certificate hasn't been applied for yet. The interview requires a new PCC — not the one submitted to NVC.`,
        resolution:
          "Apply for a fresh police character certificate immediately. Processing can take several weeks.",
        actionableStepKey: "step_3_3",
      });
    }
  }

  // PCC may be outdated (typical validity: varies by embassy, commonly 1–2 years)
  if (interviewDate && pccIssueDate) {
    const monthsFromIssue = monthsBetween(pccIssueDate, interviewDate);
    if (monthsFromIssue !== null && monthsFromIssue > 12) {
      findings.push({
        id: "pcc_potentially_expired",
        severity: "warning",
        category: "IMMIGRATION",
        title: "Police certificate may be outdated at interview",
        description: `The police certificate was issued on ${pccIssueDate}, which is ${monthsFromIssue} months before the interview. Some embassies require a PCC issued within the last 12 months.`,
        resolution:
          "Check your embassy's PCC validity requirements. If needed, apply for a fresh certificate that will be valid at the time of your interview.",
        actionableStepKey: "step_3_3",
      });
    }
  }

  return findings;
}

// ── 7. Financial Support Consistency ────────────────────────────────────────────

function checkFinancialConsistency(state: WizardState): ConsistencyFinding[] {
  const findings: ConsistencyFinding[] = [];

  const sponsorshipResult = meta(state, "sponsorshipResult");
  const jsCount = Number(meta(state, "jsCount") ?? 0);
  const hhCount = Number(meta(state, "hhCount") ?? 0);
  const householdSize = meta(state, "householdSize");
  const sponsorIncome = meta(state, "sponsor_annual_income") || meta(state, "sponsorIncome");
  const jointSponsorAvailable = meta(state, "joint_sponsor_available");

  // Income shortfall without joint sponsor
  if (sponsorshipResult && sponsorshipResult.isEligible === false) {
    if (jsCount === 0 && hhCount === 0 && !jointSponsorAvailable) {
      findings.push({
        id: "income_shortfall_no_sponsor",
        severity: "critical",
        category: "FINANCIAL",
        title: "Income shortfall with no joint sponsor identified",
        description: `The petitioner's income does not meet the 125% poverty guideline for the household size. No joint sponsor or qualifying household member has been added.`,
        resolution:
          "Identify and add a joint sponsor (or qualifying household member) who meets the income requirement. Each sponsor needs their own I-864, tax returns, and W-2s.",
        sources: ["INA 213A", "Form I-864"],
        actionableStepKey: "step_2_7",
      });
    }
  }

  // Household size inconsistency
  const sponsorshipHH = sponsorshipResult?.householdSize;
  if (householdSize && sponsorshipHH && Number(householdSize) !== Number(sponsorshipHH)) {
    findings.push({
      id: "household_size_mismatch",
      severity: "warning",
      category: "FINANCIAL",
      title: "Household size inconsistency in financial data",
      description: `The household size recorded in journey data (${householdSize}) differs from the Affidavit of Support calculation (${sponsorshipHH}). An incorrect household size affects whether the income requirement is met.`,
      resolution:
        "Verify the correct household size (petitioner + beneficiary + dependents + any other sponsored individuals) and update all records to match.",
      actionableStepKey: "step_2_5",
    });
  }

  return findings;
}

// ── 8. 221(g) Follow-Up Validation ──────────────────────────────────────────────

function check221gFollowUp(state: WizardState): ConsistencyFinding[] {
  const findings: ConsistencyFinding[] = [];

  const interviewOutcome = meta(state, "interviewOutcome") as string | undefined;
  const outcome221gSubtype = meta(state, "outcome221gSubtype") as string | undefined;
  const g221Submitted = state.completedSteps?.has?.("step_3_11");
  const g221Date = meta(state, "g221_date") as string | undefined;

  if (interviewOutcome !== "221g") return findings;

  // 221(g) issued but no action taken
  if (!g221Submitted) {
    findings.push({
      id: "221g_no_action",
      severity: "critical",
      category: "POST_INTERVIEW",
      title: "221(g) issued — follow-up documents not submitted",
      description: `Your interview resulted in a 221(g) refusal, but the requested documents haven't been submitted yet${g221Date ? ` (issued ${g221Date})` : ""}. Delays in responding can result in case closure.`,
      resolution:
        "Submit exactly what the 221(g) requested — nothing more, nothing less — using the method and deadline stated in the notice. Keep a complete copy of everything.",
      actionableStepKey: "step_3_11",
    });
  }

  // 221(g) subtype-specific guidance
  if (outcome221gSubtype === "administrative_processing") {
    findings.push({
      id: "221g_admin_processing",
      severity: "informational",
      category: "POST_INTERVIEW",
      title: "Administrative processing in progress",
      description:
        "Your case is under administrative processing (221(g)). This can take weeks to months. Monitor CEAC weekly for status updates.",
      resolution:
        "Do not submit additional documents unless specifically requested. Check CEAC status regularly and respond promptly to any embassy communications.",
      actionableStepKey: "step_3_11",
    });
  }

  return findings;
}

// ─── Utility: Group findings by severity ────────────────────────────────────────

export function groupFindingsBySeverity(findings: ConsistencyFinding[]): {
  critical: ConsistencyFinding[];
  warning: ConsistencyFinding[];
  informational: ConsistencyFinding[];
} {
  return {
    critical: findings.filter((f) => f.severity === "critical"),
    warning: findings.filter((f) => f.severity === "warning"),
    informational: findings.filter((f) => f.severity === "informational"),
  };
}

/**
 * Get a summary count for the dashboard badge.
 */
export function getConsistencySummary(findings: ConsistencyFinding[]): {
  total: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  topFinding?: ConsistencyFinding;
} {
  const grouped = groupFindingsBySeverity(findings);
  return {
    total: findings.length,
    criticalCount: grouped.critical.length,
    warningCount: grouped.warning.length,
    infoCount: grouped.informational.length,
    topFinding: findings[0],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2 — Enhanced Intelligence Questionnaire
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Phase 2 questionnaire questions — minimal, high-value only.
 * These collect information NOT available from existing journey data.
 */
export const PHASE2_QUESTIONS = [
  {
    id: "prior_marriage_either",
    question: "Has either spouse been previously married?",
    description: "This unlocks prior-marriage consistency checks across all forms.",
    group: "Marriage History",
    type: "boolean" as const,
  },
  {
    id: "prior_marriage_terminated",
    question: "Is the divorce/death certificate from the prior marriage available?",
    description: "Required documentation to prove the prior marriage legally ended.",
    group: "Marriage History",
    type: "boolean" as const,
    dependsOn: "prior_marriage_either",
  },
  {
    id: "prior_us_visa_application",
    question: "Has the beneficiary previously applied for any U.S. visa?",
    description:
      "Prior applications (approved, refused, or pending) must be consistent across all forms.",
    group: "Immigration History",
    type: "boolean" as const,
  },
  {
    id: "prior_visa_refusal",
    question: "Was any prior U.S. visa refused?",
    description:
      "Refusals must be disclosed on the DS-260 and explained consistently at interview.",
    group: "Immigration History",
    type: "boolean" as const,
    dependsOn: "prior_us_visa_application",
  },
  {
    id: "prior_visa_refusal_explained",
    question: "Has an explanation for the visa refusal been prepared?",
    description: "A clear, consistent explanation should be ready for the interview.",
    group: "Immigration History",
    type: "boolean" as const,
    dependsOn: "prior_visa_refusal",
  },
  {
    id: "employment_changes",
    question:
      "Has the petitioner or beneficiary had significant employment changes in the last 5 years?",
    description: "Employment gaps or frequent changes may need explanation at interview.",
    group: "Employment",
    type: "boolean" as const,
  },
  {
    id: "multiple_residences",
    question: "Has either spouse lived at multiple addresses in the last 5 years?",
    description: "Multiple addresses require consistent address history across forms.",
    group: "Address History",
    type: "boolean" as const,
  },
  {
    id: "immigration_issues",
    question: "Any prior immigration violations, overstays, or removals?",
    description: "These must be disclosed and may require waivers or additional documentation.",
    group: "Immigration History",
    type: "boolean" as const,
  },
] as const;

export type Phase2QuestionId = (typeof PHASE2_QUESTIONS)[number]["id"];
export type Phase2Responses = Record<Phase2QuestionId, boolean>;

// ─── Phase 2 Checks ─────────────────────────────────────────────────────────────

/**
 * Run Phase 2 consistency checks using questionnaire responses.
 * These checks complement Phase 1 by using information not available in journey data.
 */
export function runPhase2Checks(
  responses: Phase2Responses | undefined | null,
  state: WizardState,
  uploadedDocuments?: UploadedDocument[]
): ConsistencyFinding[] {
  if (!responses) return [];
  const findings: ConsistencyFinding[] = [];

  // ── Previous Marriage Consistency ──
  if (responses.prior_marriage_either) {
    // Check if termination proof exists in the document vault (using journey-mapping utilities)
    const terminationDocNames = [
      "Prior Marriage Termination Documents",
      "Death Certificate of Former Spouse",
      "Divorce Decree",
      "Translated Divorce Decree",
    ];
    const hasTerminationDoc = terminationDocNames.some((docName) => {
      const mappedId = mapDocumentNameToId(docName);
      return (
        mappedId &&
        mappedId !== "misc-document" &&
        isDocUploadedInVault(docName, mappedId, uploadedDocuments ?? [])
      );
    });

    // Also check civilDocsStatus (set when user marks a doc as reviewed in step_2_4)
    const civilDocsStatus = state.metadata?.civilDocsStatus as Record<string, string> | undefined;
    const hasCivilDocReviewed =
      civilDocsStatus?.["prior-marriage"] === "reviewed" ||
      civilDocsStatus?.["death-cert"] === "reviewed";

    // Also check the document checklist for termination docs marked complete
    const checklistHasTermination =
      state.documentChecklist?.["Prior Marriage Termination Documents"] === true ||
      state.documentChecklist?.["Death Certificate of Former Spouse"] === true ||
      state.documentChecklist?.["prior-marriage"] === true ||
      state.documentChecklist?.["death-cert"] === true;

    const isTerminationResolved =
      responses.prior_marriage_terminated ||
      hasTerminationDoc ||
      hasCivilDocReviewed ||
      checklistHasTermination;

    // Always push the finding, but mark as resolved when doc is uploaded
    findings.push({
      id: "phase2_prior_marriage_no_termination",
      severity: "critical",
      category: "FORM_CONSISTENCY",
      title: "Previous marriage declared but no termination proof",
      description: isTerminationResolved
        ? "Prior marriage termination document is on file."
        : "You indicated a prior marriage but haven't confirmed the divorce/death certificate is available. NVC and the consular officer require proof that every prior marriage legally ended.",
      resolution: isTerminationResolved
        ? "Document uploaded — prior marriage termination proof is on file."
        : "Obtain the final divorce decree, annulment, or death certificate. Upload it to your document vault and ensure it's listed on the DS-260.",
      sources: ["8 CFR 204.2(a)(2)", "9 FAM 504.4-4"],
      actionableStepKey: "step_2_4",
      resolved: isTerminationResolved,
    });

    // Cross-check with eligibility answers (prior marriage should have been declared)
    const eligAnswers =
      (state.answers?.["eligibility-suite"] as any) ??
      (state.metadata?.["questAnswers_eligibility-suite"] as any);
    const q3s1 = eligAnswers?.q3?.q3s1;
    const eligDeclaredPrior = q3s1 === "petitioner" || q3s1 === "beneficiary" || q3s1 === "both";

    // Always push finding, mark as resolved when eligibility is updated
    findings.push({
      id: "phase2_prior_marriage_not_in_eligibility",
      severity: "critical",
      category: "FORM_CONSISTENCY",
      title: "Prior marriage not declared in eligibility questionnaire",
      description: eligDeclaredPrior
        ? "Prior marriage is declared in eligibility questionnaire."
        : "You indicated a prior marriage in the consistency questionnaire, but it was not declared during the initial eligibility assessment. This inconsistency could surface at interview.",
      resolution: eligDeclaredPrior
        ? "Eligibility questionnaire updated — prior marriage is declared."
        : "Ensure the prior marriage is declared on both the I-130 and DS-260. All forms must agree on marriage history.",
      actionableStepKey: "step_1_1",
      resolved: eligDeclaredPrior,
    });
  }

  // ── Prior Visa Consistency ──
  if (responses.prior_us_visa_application) {
    if (responses.prior_visa_refusal && !responses.prior_visa_refusal_explained) {
      findings.push({
        id: "phase2_visa_refusal_unexplained",
        severity: "warning",
        category: "IMMIGRATION",
        title: "Prior visa refusal declared but no explanation prepared",
        description:
          "You indicated a prior U.S. visa refusal but haven't prepared an explanation. The consular officer will ask about it — an inconsistent or vague answer can hurt your case.",
        resolution:
          "Prepare a clear, factual explanation for the refusal. Bring any relevant documentation (refusal letter, subsequent approval). Ensure your DS-260 disclosure matches your explanation.",
        actionableStepKey: "step_3_7",
      });
    }

    // Cross-check with eligibility (q5s1 should be "yes" for prior visa issues)
    const eligAnswers =
      (state.answers?.["eligibility-suite"] as any) ??
      (state.metadata?.["questAnswers_eligibility-suite"] as any);
    const q5s1 = eligAnswers?.q5?.q5s1;
    const visaRefusalInEligibility = q5s1 === "yes";

    // Always push finding, mark as resolved when eligibility is updated
    if (responses.prior_visa_refusal) {
      findings.push({
        id: "phase2_visa_refusal_not_in_eligibility",
        severity: "warning",
        category: "FORM_CONSISTENCY",
        title: "Prior visa refusal not declared in eligibility",
        description: visaRefusalInEligibility
          ? "Prior visa refusal is declared in eligibility questionnaire."
          : "You indicated a prior visa refusal in the consistency questionnaire, but it wasn't flagged during the eligibility assessment. Ensure it's disclosed on the DS-260.",
        resolution: visaRefusalInEligibility
          ? "Eligibility questionnaire updated — prior visa refusal is declared."
          : "Confirm the prior visa refusal is declared on your DS-260. Omitting it risks a misrepresentation finding under INA 212(a)(6)(C).",
        actionableStepKey: "step_1_1",
        resolved: visaRefusalInEligibility,
      });
    }
  }

  // ── Employment Consistency ──
  if (responses.employment_changes) {
    findings.push({
      id: "phase2_employment_changes",
      severity: "informational",
      category: "FORM_CONSISTENCY",
      title: "Employment changes noted — ensure consistency across forms",
      description:
        "You indicated significant employment changes. The I-864 employment section and DS-260 employment history must align. Gaps or discrepancies may prompt officer questions.",
      resolution:
        "Review the employment history on your DS-260 and I-864 to ensure dates, employers, and addresses are consistent. Prepare a brief explanation for any gaps.",
      actionableStepKey: "step_2_5",
    });
  }

  // ── Address Consistency ──
  if (responses.multiple_residences) {
    findings.push({
      id: "phase2_multiple_addresses",
      severity: "informational",
      category: "FORM_CONSISTENCY",
      title: "Multiple addresses noted — verify address history consistency",
      description:
        "You indicated multiple residences in the last 5 years. The DS-260 address history, I-130A addresses, and any police certificates must be consistent.",
      resolution:
        "Review all address entries across your forms. Ensure dates don't overlap incorrectly and that you have police certificates from every country where you lived 6+ months since age 16.",
      actionableStepKey: "step_2_3",
    });
  }

  // ── Immigration Issues ──
  if (responses.immigration_issues) {
    findings.push({
      id: "phase2_immigration_issues_disclosed",
      severity: "warning",
      category: "IMMIGRATION",
      title: "Immigration issues disclosed — verify waiver requirements",
      description:
        "You indicated prior immigration violations, overstays, or removals. These typically require waivers (I-601A or I-212) and must be disclosed on every form.",
      resolution:
        "Confirm whether a waiver is needed for your situation. Consult with an immigration attorney if unsure. Ensure every form (I-130, DS-260) discloses the issue consistently.",
      sources: ["INA 212(a)(9)(B)", "INA 212(a)(6)(C)"],
      actionableStepKey: "step_2_3",
    });

    // Cross-check with eligibility
    const eligAnswers =
      (state.answers?.["eligibility-suite"] as any) ??
      (state.metadata?.["questAnswers_eligibility-suite"] as any);
    const q5s4 = eligAnswers?.q5?.q5s4;
    const immigrationInEligibility = q5s4 === "yes";

    // Always push finding, mark as resolved when eligibility is updated
    findings.push({
      id: "phase2_immigration_issues_not_in_eligibility",
      severity: "critical",
      category: "IMMIGRATION",
      title: "Immigration issue not declared in eligibility questionnaire",
      description: immigrationInEligibility
        ? "Immigration issue is declared in eligibility questionnaire."
        : "You indicated prior immigration issues in the consistency questionnaire, but they weren't flagged during eligibility. These MUST be disclosed on the DS-260 — omissions can result in permanent inadmissibility.",
      resolution: immigrationInEligibility
        ? "Eligibility questionnaire updated — immigration issue is declared."
        : "Ensure the immigration issue is fully disclosed on the DS-260 and I-130. Consider consulting an immigration attorney before the interview.",
      actionableStepKey: "step_1_1",
      resolved: immigrationInEligibility,
    });
  }

  return findings;
}

/**
 * Run BOTH Phase 1 and Phase 2 checks, returning unified findings.
 */
export function runFullConsistencyAnalysis(
  input: ConsistencyIntelligenceInput,
  phase2Responses?: Phase2Responses | null,
  uploadedDocuments?: UploadedDocument[]
): ConsistencyFinding[] {
  const phase1 = runConsistencyIntelligence(input);
  const phase2 = runPhase2Checks(phase2Responses, input.state, uploadedDocuments);

  // Merge and deduplicate
  const all = [...phase1, ...phase2];
  const seen = new Set<string>();
  const deduped = all.filter((f) => {
    if (seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });

  const order: Record<FindingSeverity, number> = {
    critical: 0,
    warning: 1,
    informational: 2,
  };
  return deduped.sort((a, b) => order[a.severity] - order[b.severity]);
}

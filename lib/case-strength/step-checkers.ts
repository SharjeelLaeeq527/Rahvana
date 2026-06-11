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
import { analyzeCivilDocs } from "./civil-docs";
import { compareBaselines } from "./consistency";

export interface StepCheck {
  level: "info" | "warning" | "critical";
  title: string;
  hint?: string;
  /** When true, the item stays visible but shows as resolved (checkmark + disabled action) */
  resolved?: boolean;
}

export interface StepCheckContext {
  state: WizardState;
  uploadedDocuments: UploadedDocument[];
  eligibilityAnswers:
    | Record<string, Record<string, string | string[]> | undefined>
    | null
    | undefined;
  /**
   * The current step's roadmap JSON node. Optional so existing Chapter 1
   * callers stay valid — Chapter 2 checkers (e.g. civil docs at step_2_4) read
   * their checklist from here rather than hardcoding doc ids.
   */
  step?: any;
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
    const done = (key: string) => state.completedSteps?.has?.(key);
    const uscisSaved = done("step_1_6") || state.metadata?.uscisPortalSaved === "true";
    if (fm === "online" && !uscisSaved) {
      checks.push({
        level: "warning",
        title: "USCIS online account not confirmed",
        hint: "Create a myUSCIS account before submitting online",
      });
    } else if (fm === "online" && uscisSaved) {
      checks.push({
        level: "info",
        title: "USCIS online account confirmed",
        hint: "Your myUSCIS credentials are saved",
        resolved: true,
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
    const done = (key: string) => state.completedSteps?.has?.(key);
    const feeReady =
      done("step_1_7") || !!state.metadata?.filingFeeDate || !!state.metadata?.feePaymentReady;
    if (!feeReady) {
      checks.push({
        level: "info",
        title: "Payment method ready?",
        hint: "USCIS accepts credit/debit card (online) or check/money order (paper)",
      });
    } else {
      checks.push({
        level: "info",
        title: "Payment method ready",
        hint: "Filing fee payment has been addressed",
        resolved: true,
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

  // Step 1.12 — Prepare Filing Fee (paper path payment method)
  step_1_12: ({ state }) => {
    const checks: StepCheck[] = [];
    const savedMethod = state.metadata?.paper_payment_method as string | undefined;
    if (!savedMethod) {
      checks.push({
        level: "info",
        title: "Save payment method",
        hint: "Store the payment method you plan to use for the USCIS filing fee",
      });
    } else {
      checks.push({
        level: "info",
        title: `Payment method saved: ${savedMethod}`,
        hint: "Your chosen payment method is recorded",
        resolved: true,
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

  // Step 1.14 — Tracking & mailing details
  step_1_14: ({ state }) => {
    const checks: StepCheck[] = [];
    const fm = state.metadata?.filingMethod as string | undefined;
    const savedCarrier = state.metadata?.paper_mailing_carrier as string | undefined;
    const savedTracking = state.metadata?.paper_mailing_tracking as string | undefined;
    const mailingSaved = !!(savedCarrier && savedTracking);
    if (fm === "paper" && !mailingSaved && !state.metadata?.mailingTrackingNumber) {
      checks.push({
        level: "info",
        title: "Save mailing details & tracking number",
        hint: "Record the carrier and tracking number after mailing your packet to USCIS",
      });
    } else if (fm === "paper" && mailingSaved) {
      checks.push({
        level: "info",
        title: `Mailing details saved: ${savedCarrier}`,
        hint: `Carrier and tracking number (${savedTracking}) are recorded`,
        resolved: true,
      });
    }
    return checks;
  },

  // Step 1.15 / 1.16 / 1.17 — Receipt number entry
  step_1_15: ({ state }) => receiptChecks(state),
  step_1_16: ({ state }) => receiptChecks(state),
  step_1_17: ({ state }) => receiptChecks(state),

  // ─── Chapter 2 — NVC / CEAC processing ────────────────────────────────────

  // Step 2.2 — Pay NVC Fees (completeness)
  step_2_2: ({ state }) => {
    const checks: StepCheck[] = [];
    if (!state.metadata?.nvcFeeStatus) {
      checks.push({
        level: "info",
        title: "Save your NVC fee status",
        hint: "Record both the Affidavit of Support fee and Immigrant Visa fee once paid — DS-260 and document upload unlock only after fees post.",
      });
    }
    return checks;
  },

  // Step 2.3 — Complete DS-260 (consistency + mandatory disclosures)
  step_2_3: ({ state, eligibilityAnswers }) => {
    const checks: StepCheck[] = [];
    const i130 = state.metadata?.consistencyBaseline as any;
    const ds260 = state.metadata?.ds260Baseline as any;

    if (!i130?.marriageDate) {
      // No I-130 baseline — nothing to compare against yet.
      checks.push({
        level: "warning",
        title: "I-130 baseline not captured",
        hint: "Go to Chapter 1 Step 4 and save your marriage date and dates of birth so Rahvana can flag any DS-260 mismatch — inconsistencies are the #1 cause of NVC delays.",
      });
    } else if (!ds260?.capturedAt) {
      // I-130 baseline exists but the DS-260 values haven't been confirmed here.
      const parts: string[] = [];
      if (i130.marriageDate) parts.push(`marriage date ${i130.marriageDate}`);
      if (i130.petitionerDateOfBirth) parts.push(`petitioner DOB ${i130.petitionerDateOfBirth}`);
      if (i130.beneficiaryDateOfBirth) parts.push(`beneficiary DOB ${i130.beneficiaryDateOfBirth}`);
      checks.push({
        level: "info",
        title: "Match these on your DS-260",
        hint: `Keep these identical to your I-130: ${parts.join(", ")}. Names and spellings must match too. Enter your DS-260 dates above so Rahvana can compare the two forms.`,
      });
    } else {
      // Both baselines present — do the real cross-form field diff.
      const mismatches = compareBaselines(i130, ds260);
      if (mismatches.length === 0) {
        checks.push({
          level: "info",
          title: "DS-260 dates match your I-130",
          hint: "Marriage date and dates of birth are consistent across both forms. Keep names and spellings identical too.",
        });
      } else {
        for (const m of mismatches) {
          checks.push({
            level: "critical",
            title: `DS-260 does not match I-130: ${m.label}`,
            hint: `I-130 says ${m.i130Value}, DS-260 says ${m.ds260Value}. Correct one so both forms agree — form-to-form inconsistencies are a leading cause of NVC delays and interview RFEs (9 FAM 504.4).`,
          });
        }
      }
    }

    // Mandatory disclosures — anything declared at eligibility MUST appear on DS-260.
    for (const d of ds260Disclosures(eligibilityAnswers)) checks.push(d);

    return checks;
  },

  // Step 2.4 — Prepare Civil Documents (completeness + consistency)
  step_2_4: ({ state, uploadedDocuments, eligibilityAnswers, step }) => {
    const groups = step?.tool_data?.doc_list?.groups;
    const issues = analyzeCivilDocs(groups, {
      civilDocsStatus: state.metadata?.civilDocsStatus as Record<string, string> | undefined,
      uploadedDocuments,
      eligibilityAnswers,
    });
    const checks: StepCheck[] = issues.map((i) => ({
      level: i.level,
      title: i.title,
      hint: i.hint,
    }));

    // While civil-doc work is still pending, surface the foreign-document
    // guidance that applies to every overseas case (the #1 here being a
    // certified English translation). Exact civil-document requirements vary by
    // country, so we point to the authoritative State Dept reciprocity schedule
    // rather than hardcode per-country (e.g. Pakistan/NADRA) specifics in code.
    if (checks.length > 0) {
      checks.push({
        level: "info",
        title: "Certified translations + country-specific requirements",
        hint: "Every foreign-language civil document (birth, marriage, divorce, police certificates) needs a certified English translation, and the exact required documents vary by country — confirm yours on the U.S. State Department reciprocity schedule at travel.state.gov before submitting. (9 FAM 504.4-4)",
      });
    }
    return checks;
  },

  // Step 2.5 — Affidavit of Support (evidence quality — financial adequacy)
  step_2_5: ({ state, eligibilityAnswers }) => {
    const checks: StepCheck[] = [];
    const result = state.metadata?.sponsorshipResult as any;

    if (!result) {
      const hint =
        eligibilityAnswers?.q5?.q5s5 === "yes"
          ? "You flagged a possible income concern during eligibility. Run the Sponsorship Calculator to confirm whether the petitioner meets the 125% poverty guideline — and line up a joint sponsor early if not."
          : "Run the Sponsorship Calculator to confirm the petitioner's income meets the 125% poverty guideline for your household size.";
      checks.push({ level: "info", title: "Confirm income meets the requirement", hint });
      return checks;
    }

    if (result.isEligible === false) {
      const shortfall =
        typeof result.shortfall === "number"
          ? `$${result.shortfall.toLocaleString()}`
          : "an amount";
      const required =
        typeof result.requiredIncome === "number"
          ? `$${result.requiredIncome.toLocaleString()}`
          : "the required level";
      checks.push({
        level: "warning",
        title: `Income is ${shortfall} below the requirement`,
        hint: `Total counted income does not reach ${required} for a household of ${result.householdSize ?? "your size"}. Add a joint sponsor or qualifying assets before submitting the I-864.`,
      });
    }
    return checks;
  },

  // Step 2.6 — Gather Financial Support Documents (completeness)
  step_2_6: ({ state }) => {
    const checks: StepCheck[] = [];
    const result = state.metadata?.sponsorshipResult as any;
    const jsCount = Number(state.metadata?.jsCount ?? 0);
    const hhCount = Number(state.metadata?.hhCount ?? 0);
    if ((result && result.isEligible === false) || jsCount > 0 || hhCount > 0) {
      checks.push({
        level: "info",
        title: "Gather every sponsor's financial documents",
        hint: "Each joint sponsor and household member needs their own tax returns (most recent year), W-2s, recent pay stubs, and an employment letter — not just the petitioner.",
      });
    }
    return checks;
  },

  // Step 2.7 — Add Household Member / Joint Sponsor (conditional)
  step_2_7: ({ state }) => {
    const checks: StepCheck[] = [];
    const result = state.metadata?.sponsorshipResult as any;
    const jsCount = Number(state.metadata?.jsCount ?? 0);
    const hhCount = Number(state.metadata?.hhCount ?? 0);
    if (result && result.isEligible === false && jsCount === 0 && hhCount === 0) {
      checks.push({
        level: "warning",
        title: "Add a joint sponsor in CEAC",
        hint: "The petitioner's income alone is below the requirement. Add a joint sponsor (or qualifying household member) in CEAC so their income counts toward the I-864.",
      });
    }
    return checks;
  },

  // Step 2.8 — Review & Submit to NVC (final QA gate)
  step_2_8: ({ state }) => {
    const checks: StepCheck[] = [];
    const done = (key: string) => state.completedSteps?.has?.(key);
    const result = state.metadata?.sponsorshipResult as any;

    if (!done("step_2_3")) {
      checks.push({
        level: "warning",
        title: "DS-260 not finished yet",
        hint: "Complete and submit the DS-260 (Step 3) before the final NVC submission.",
      });
    }
    if (!done("step_2_4")) {
      checks.push({
        level: "warning",
        title: "Civil documents not all prepared",
        hint: "Finish the civil-document checklist (Step 4) — missing required documents will hold up documentary qualification.",
      });
    }
    if (result && result.isEligible === false) {
      checks.push({
        level: "critical",
        title: "Affidavit of Support income gap unresolved",
        hint: "Your income still falls short of the requirement. Resolve it in Step 5/7 (joint sponsor or assets) before submitting to NVC.",
      });
    }
    return checks;
  },

  // Step 2.10 — Record Documentary Qualification
  step_2_10: ({ state }) => {
    const checks: StepCheck[] = [];
    if (!state.metadata?.dqDate) {
      checks.push({
        level: "info",
        title: "Record your DQ date",
        hint: "Saving the Documentary Qualification date activates interview-scheduling tracking on your dashboard.",
      });
    }
    return checks;
  },

  // Step 2.12 — Interview Appointment Received
  step_2_12: ({ state }) => {
    const checks: StepCheck[] = [];
    if (!state.metadata?.interviewDate) {
      checks.push({
        level: "info",
        title: "Save your interview date",
        hint: "Recording the appointment unlocks Chapter 3 — schedule your medical exam right away, as slots fill quickly before the interview.",
      });
    }
    return checks;
  },

  // ─── Chapter 3 — Medical + Interview ──────────────────────────────────────

  // Step 3.1 — Schedule Medical Examination (completeness + timeline)
  step_3_1: ({ state }) => {
    const checks: StepCheck[] = [];
    const scheduled = state.metadata?.med_appt_saved === "true" || !!state.metadata?.med_date;
    const interviewDate = state.metadata?.interviewDate as string | undefined;
    if (!scheduled) {
      checks.push({
        level: interviewDate ? "warning" : "info",
        title: interviewDate
          ? "Medical exam not scheduled yet — book now"
          : "Schedule your medical exam early",
        hint: "The medical exam must be completed before your interview, and approved panel-physician slots fill up fast. Book as soon as your interview is set and record the appointment here.",
      });
    }
    return checks;
  },

  // Step 3.2 — Polio Vaccination Certificate (completeness — mandatory compliance)
  step_3_2: ({ state }) => {
    const checks: StepCheck[] = [];
    const launched = state.metadata?.polio_launched === "true";
    const polioChecks = state.metadata?.polio_checks as Record<string, boolean> | undefined;
    const anyChecked = polioChecks && Object.values(polioChecks).some(Boolean);
    if (!launched && !anyChecked) {
      checks.push({
        level: "info",
        title: "Get your polio vaccination certificate before the medical exam",
        hint: "Pakistan-origin applicants must present an original polio vaccination certificate. The panel physician reviews it at the medical exam and you must bring the original to the interview — arrange it now so it doesn't hold up your exam.",
      });
    }
    return checks;
  },

  // Step 3.3 — Fresh Police Clearance Certificate (completeness + freshness)
  step_3_3: ({ state }) => {
    const checks: StepCheck[] = [];
    const saved = state.metadata?.pcc_saved === "true";
    const received = state.metadata?.pcc_received === "true";
    if (!saved && !received) {
      checks.push({
        level: "warning",
        title: "Apply for a fresh police certificate now",
        hint: "The interview requires a fresh PCC — not the one submitted during NVC processing. It can take several weeks, so apply early and bring the original to your interview.",
      });
    } else if (saved && !received) {
      checks.push({
        level: "info",
        title: "Track your police certificate until you hold the original",
        hint: "You've applied — keep following up until the original PCC is in hand. Confirm it is still within your embassy's validity window for the interview date.",
      });
    }
    return checks;
  },

  // Step 3.4 — Attend Medical Exam (process — sealed results)
  step_3_4: ({ state }) => {
    const checks: StepCheck[] = [];
    // Relevant once the exam is on the calendar.
    if (state.metadata?.med_appt_saved === "true" || state.metadata?.med_date) {
      checks.push({
        level: "info",
        title: "Do not open the sealed medical envelope",
        hint: "Bring your polio certificate, passport, and appointment letter. The physician seals the results and sends them to the embassy — never open the envelope, and confirm the clinic will transmit your results before your interview date.",
      });
    }
    return checks;
  },

  // Step 3.6 — Gather Original Documents (completeness + consistency)
  step_3_6: ({ state, step }) => {
    const checks: StepCheck[] = [];
    const groups = step?.tool_data?.doc_gathering?.groups as any[] | undefined;
    // Read the "Required" original-document groups straight from the roadmap JSON
    // rather than hardcoding which documents to bring.
    const requiredGroups = Array.isArray(groups)
      ? groups
          .filter(
            (g) => typeof g?.badge === "string" && g.badge.toLowerCase().startsWith("required")
          )
          .map((g) =>
            String(g?.label || "")
              .replace(/^Bring\s*[—-]\s*/i, "")
              .trim()
          )
          .filter(Boolean)
      : [];
    if (requiredGroups.length > 0) {
      checks.push({
        level: "info",
        title: "Bring every required original to your interview",
        hint: `Organize originals (not photocopies) for: ${requiredGroups.join(
          "; "
        )}. Keep each foreign-language civil document together with its certified English translation, and bring the fresh police certificate — not the one filed at NVC.`,
      });
    }
    checks.push({
      level: "info",
      title: "Originals must match what you filed",
      hint: "The consular officer compares your originals and answers against your filed DS-260 and I-864. Make sure names, dates, and record details on your documents stay consistent with the forms NVC already has.",
    });
    return checks;
  },

  // Step 3.7 — Prepare for Interview (consistency — primary at interview stage)
  step_3_7: ({ eligibilityAnswers }) => {
    const checks: StepCheck[] = [];
    checks.push({
      level: "info",
      title: "Your interview answers must match your DS-260",
      hint: "Re-read every DS-260 section before interview day. The officer's questions about your relationship, dates, and history are checked against your filed answers — inconsistencies are the most common cause of 221(g) holds.",
    });
    // Anything disclosed at eligibility will likely come up — be ready to explain it.
    for (const d of interviewDisclosureReminders(eligibilityAnswers)) checks.push(d);
    return checks;
  },

  // Step 3.8 — Attend Visa Interview (final readiness gate)
  step_3_8: ({ state }) => {
    const checks: StepCheck[] = [];
    const done = (key: string) => state.completedSteps?.has?.(key);
    if (!done("step_3_6")) {
      checks.push({
        level: "warning",
        title: "Original documents not gathered yet",
        hint: "Finish gathering and organizing your original documents (Step 6) before interview day — the officer may ask for any of them.",
      });
    }
    if (!done("step_3_7")) {
      checks.push({
        level: "info",
        title: "Run interview prep before you go",
        hint: "Practice your answers and re-read your DS-260 (Step 7) so your responses stay calm, concise, and consistent.",
      });
    }
    checks.push({
      level: "info",
      title: "No electronics — arrive 20–30 minutes early",
      hint: "Bring the printed appointment letter and your organized packet. Phones and electronic devices are not allowed inside U.S. Embassy Islamabad, and latecomers may be turned away.",
    });
    return checks;
  },

  // Step 3.9 — Confirm Interview Outcome (tracking)
  step_3_9: ({ state }) => {
    const checks: StepCheck[] = [];
    if (!state.metadata?.interviewOutcome) {
      checks.push({
        level: "info",
        title: "Record your interview outcome",
        hint: "Saving whether you were approved or issued a 221(g) unlocks the correct next steps for your situation.",
      });
    }
    return checks;
  },

  // Step 3.10 — Track Visa Issuance (evidence accuracy — approved path)
  step_3_10: () => [
    {
      level: "info",
      title: "Verify your visa details when the passport arrives",
      hint: "Check that your name, date of birth, visa category, and expiry date are all correct. Report any error to the embassy immediately — you must enter the U.S. before the visa expires.",
    },
  ],

  // Step 3.11 — Submit 221(g) Documents (completeness + accuracy)
  step_3_11: () => [
    {
      level: "warning",
      title: "Submit exactly what the 221(g) requested",
      hint: "Provide every requested item — nothing more, nothing less — using the method and any deadline stated in the notice. Keep a complete copy of everything you submit, then monitor CEAC weekly.",
    },
  ],
};

// ─── Chapter 2 helper: DS-260 mandatory-disclosure reminders ────────────────

/**
 * Anything the user declared at eligibility MUST be disclosed on the DS-260.
 * Omitting it is treated as misrepresentation (INA 212(a)(6)(C)) — a far more
 * common cause of trouble than the underlying issue itself.
 */
function ds260Disclosures(
  answers: Record<string, Record<string, string | string[]> | undefined> | null | undefined
): StepCheck[] {
  if (!answers) return [];
  const checks: StepCheck[] = [];
  const get = (q: string, s: string) => {
    const v = answers?.[q]?.[s];
    return typeof v === "string" ? v : undefined;
  };

  const q3s1 = get("q3", "q3s1");
  if (q3s1 === "petitioner" || q3s1 === "beneficiary" || q3s1 === "both") {
    checks.push({
      level: "warning",
      title: "Declare the prior marriage on DS-260",
      hint: "List every prior marriage and how it ended. It must match your I-130 and the termination documents.",
    });
  }
  if (get("q5", "q5s1") === "yes") {
    checks.push({
      level: "warning",
      title: "Disclose the past visa refusal on DS-260",
      hint: "Every prior U.S. visa refusal or application must be declared. Omitting it risks a misrepresentation finding.",
    });
  }
  if (get("q5", "q5s2") === "yes") {
    checks.push({
      level: "warning",
      title: "Disclose the court/police record on DS-260",
      hint: "Declare any arrest or charge. Bring certified court and police records to the interview.",
    });
  }
  if (get("q5", "q5s4") === "yes") {
    checks.push({
      level: "warning",
      title: "Disclose the prior U.S. overstay on DS-260",
      hint: "Declare any unlawful presence. A provisional waiver (I-601A) may be needed before the interview.",
    });
  }
  return checks;
}

// ─── Chapter 3 helper: interview-readiness disclosure reminders ─────────────

/**
 * At interview prep, anything the user declared at eligibility is likely to come
 * up at the window. These are framed for the interview (be ready to explain /
 * bring originals) rather than the DS-260 disclosure framing in
 * `ds260Disclosures`. Consistency with the filed DS-260 is the goal.
 */
function interviewDisclosureReminders(
  answers: Record<string, Record<string, string | string[]> | undefined> | null | undefined
): StepCheck[] {
  if (!answers) return [];
  const checks: StepCheck[] = [];
  const get = (q: string, s: string) => {
    const v = answers?.[q]?.[s];
    return typeof v === "string" ? v : undefined;
  };

  const q3s1 = get("q3", "q3s1");
  if (q3s1 === "petitioner" || q3s1 === "beneficiary" || q3s1 === "both") {
    checks.push({
      level: "info",
      title: "Be ready to explain the prior marriage",
      hint: "Expect questions about how a prior marriage ended. Your answer must match the dates and termination documents in your DS-260 and civil records.",
    });
  }
  if (get("q5", "q5s1") === "yes") {
    checks.push({
      level: "info",
      title: "Be ready to explain the past visa refusal",
      hint: "The officer can see prior U.S. visa refusals. Answer consistently with what you declared on the DS-260.",
    });
  }
  if (get("q5", "q5s2") === "yes") {
    checks.push({
      level: "info",
      title: "Bring originals for the court/police record",
      hint: "If you disclosed an arrest or charge, bring the certified court and police records and be ready to explain the outcome briefly and truthfully.",
    });
  }
  if (get("q5", "q5s4") === "yes") {
    checks.push({
      level: "info",
      title: "Be ready to explain the prior U.S. overstay",
      hint: "If you disclosed unlawful presence, be prepared to explain it. Confirm whether a waiver applies to your case before the interview.",
    });
  }
  return checks;
}

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
  const num =
    (state.metadata?.receiptNum as string) ||
    (state.metadata?.receiptNumber as string) ||
    (state.metadata?.uscis_receipt_number as string);
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

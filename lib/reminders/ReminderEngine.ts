// ============================================================
// lib/reminders/ReminderEngine.ts
// Core auto-generation service for in-app reminders.
// Supports all journey types: IR-1, CR-1, IR-5.
//
// Usage (from API route):
//   const engine = new ReminderEngine(supabase)
//   await engine.generateReminders(journeyId)
//
// The engine checks all trigger conditions and upserts reminder
// records using dedup_key to prevent duplicates.


import { SupabaseClient } from "@supabase/supabase-js";
import type { ReminderCandidate, ReminderPriority } from "./types";
import { getJourneyHrefByType } from "@/lib/constants/routes";
import { resolveCaseStrengthProfile } from "@/lib/case-strength/categories";
import {
  computeDocumentStage,
  type DocumentEscalationConfig,
} from "@/lib/case-strength/alert-gating";
import { getBaseVisaCategory } from "@/lib/candidate/candidateSyncService";

const DAY_MS = 86_400_000;

/**
 * Server-side twin of the dashboard's document-checklist escalation. When a
 * category opts in (`profile.documentEscalation`), a missing-document reminder
 * is derived from the SAME `computeDocumentStage` the Alert Center uses, so the
 * bell/email can never contradict the dashboard (§2, §4–§5 of
 * CASE_STRENGTH_ALERT_ESCALATION_PLAN.md). The calm "to-do" (info) stage is NOT
 * pushed — it lives only on the dashboard checklist; the bell is the escalation
 * delivery layer for due-soon (→ normal) and critical (→ high).
 */
interface DocEscalationContext {
  cfg: DocumentEscalationConfig;
  /** ms epoch, or null when the user hasn't set a target filing date. */
  targetFilingDate: number | null;
  /** step_key → status + timestamps, for stage computation. */
  steps: Map<string, { status: string; startedAt: number | null; completedAt: number | null }>;
}

export class ReminderEngine {
  private defaultJourneyHref = getJourneyHrefByType(null);

  constructor(private supabase: SupabaseClient) {}

  // ─────────────────────────────────────────────────────────────
  // Main entry point — call this on every GET /reminders request
  // It detects new conditions and upserts reminders accordingly
  // ─────────────────────────────────────────────────────────────

  async generateReminders(journeyId: string): Promise<void> {
    const candidates: ReminderCandidate[] = [];

    // Run all checks in parallel for performance
    const { data: journey } = await this.supabase
      .from("journeys")
      .select("journey_type")
      .eq("id", journeyId)
      .single();

    this.defaultJourneyHref = getJourneyHrefByType(journey?.journey_type);

    const [
      missingDocReminders,
      appointmentApproachingReminders,
      policeCertReminder,
      receiptNotCapturedReminder,
      nvcFeeReminder,
      accountSetupReminder,
      toolAbandonedReminders,
      appointmentNotRecordedReminder,
      trackingStatusReminder,
      step2GatheringReminder,
    ] = await Promise.allSettled([
      this.checkMissingDocuments(journeyId),
      this.checkAppointmentsApproaching(journeyId),
      this.checkPoliceCertificatePending(journeyId),
      this.checkReceiptNotCaptured(journeyId),
      this.checkNvcFeeNotConfirmed(journeyId),
      this.checkAccountSetupIncomplete(journeyId),
      this.checkAbandonedToolSessions(journeyId),
      this.checkAppointmentNotRecorded(journeyId),
      this.checkTrackingStatusUpdates(journeyId),
      this.checkStep2GatheringPending(journeyId),
    ]);

    // Collect results safely (ignore individual failures)
    const push = (result: PromiseSettledResult<ReminderCandidate[]>) => {
      if (result.status === "fulfilled") candidates.push(...result.value);
    };

    push(missingDocReminders);
    push(appointmentApproachingReminders);
    push(policeCertReminder);
    push(receiptNotCapturedReminder);
    push(nvcFeeReminder);
    push(accountSetupReminder);
    push(toolAbandonedReminders);
    push(appointmentNotRecordedReminder);
    push(trackingStatusReminder);
    push(step2GatheringReminder);

    if (candidates.length === 0) return;

    const rawType = journey?.journey_type;
    const journeyPrefix = rawType
      ? `[${rawType
          .trim()
          .toUpperCase()
          .replace(/^(IR|CR)(\d)$/, "$1-$2")}] `
      : "";

    // Upsert all candidates using dedup_key (ON CONFLICT DO UPDATE)
    // This refreshes the title/body if logic changes, without creating duplicates
    await this.supabase.from("journey_reminders").upsert(
      candidates.map((c) => ({
        journey_id: journeyId,
        ...c,
        title: `${journeyPrefix}${c.title}`,
      })),
      { onConflict: "dedup_key", ignoreDuplicates: false }
    );
  }

  // ─────────────────────────────────────────────────────────────
  // HELPERS / CHECKS
  // ─────────────────────────────────────────────────────────────

  // CHECKER 1: Missing Required Documents
  // Trigger: journey_documents rows where is_required=true and
  //          status is 'not_started' or 'requested'
  // Priority: high
  // ─────────────────────────────────────────────────────────────

  private async checkMissingDocuments(journeyId: string): Promise<ReminderCandidate[]> {
    const { data: docs } = await this.supabase
      .from("journey_documents")
      .select("id, document_type, document_label, step_key, status")
      .eq("journey_id", journeyId)
      .eq("is_required", true)
      .in("status", ["not_started", "requested"])
      .is("deleted_at", null);

    if (!docs || docs.length === 0) return [];

    // Opt-in escalation: when the category enables it, derive urgency from the
    // shared stage engine so the bell matches the dashboard. No config → legacy
    // instant-"high" behavior (IR-1), byte-for-byte unchanged.
    const ctx = await this.getDocEscalationContext(journeyId);
    if (!ctx) {
      return docs.map((doc) => ({
        reminder_type: "missing_document" as const,
        priority: "high" as const,
        title: `Document Required: ${doc.document_label || doc.document_type}`,
        body: `Your "${doc.document_label || doc.document_type}" is required but has not been uploaded yet. Upload it to keep your case on track.`,
        step_key: doc.step_key ?? undefined,
        reference_id: doc.id,
        action_url: this.defaultJourneyHref,
        action_label: "Upload Document",
        dedup_key: `${journeyId}:missing_document:${doc.document_type}`,
      }));
    }

    const now = Date.now();
    const out: ReminderCandidate[] = [];
    for (const doc of docs) {
      const stage = this.resolveDocStage(doc.step_key ?? null, ctx, now);
      if (stage === "info") continue; // calm to-do stays on the dashboard only
      const name = doc.document_label || doc.document_type;
      const critical = stage === "critical";
      out.push({
        reminder_type: "missing_document",
        priority: (critical ? "high" : "normal") as ReminderPriority,
        title: critical ? `Document Required: ${name}` : `Document Due Soon: ${name}`,
        body: critical
          ? `Your "${name}" is required to submit and is now blocking your petition. Please upload it as soon as possible.`
          : `Your "${name}" will be needed as your filing step approaches. Uploading it soon keeps your case on track.`,
        step_key: doc.step_key ?? undefined,
        reference_id: doc.id,
        action_url: this.defaultJourneyHref,
        action_label: "Upload Document",
        dedup_key: `${journeyId}:missing_document:${doc.document_type}`,
      });
    }
    return out;
  }

  /**
   * Load the document-escalation context for a journey, or null when the
   * category hasn't opted in (→ callers keep legacy behavior). Only queried when
   * a checker actually has missing documents, so IR-1 pays nothing.
   */
  private async getDocEscalationContext(journeyId: string): Promise<DocEscalationContext | null> {
    const { data: journey } = await this.supabase
      .from("journeys")
      .select("journey_type")
      .eq("id", journeyId)
      .single();

    const profile = resolveCaseStrengthProfile(journey?.journey_type);
    if (!profile.documentEscalation) return null;

    const [{ data: caseRows }, { data: stepRows }] = await Promise.all([
      this.supabase
        .from("case_data")
        .select("data_value")
        .eq("journey_id", journeyId)
        .eq("data_key", "targetFilingDate"),
      this.supabase
        .from("steps")
        .select("step_key, status, started_at, completed_at, chapters!inner(journey_id)")
        .eq("chapters.journey_id", journeyId),
    ]);

    const rawFiling = caseRows?.[0]?.data_value;
    const parsedFiling =
      rawFiling != null ? new Date(String(rawFiling).replace(/^"|"$/g, "")) : null;
    const targetFilingDate =
      parsedFiling && !Number.isNaN(parsedFiling.getTime()) ? parsedFiling.getTime() : null;

    const steps = new Map<
      string,
      { status: string; startedAt: number | null; completedAt: number | null }
    >();
    for (const s of stepRows ?? []) {
      const key = (s as any).step_key as string | null;
      if (!key) continue;
      const startedAt = (s as any).started_at ? new Date((s as any).started_at).getTime() : null;
      const completedAt = (s as any).completed_at
        ? new Date((s as any).completed_at).getTime()
        : null;
      steps.set(key, { status: (s as any).status, startedAt, completedAt });
    }

    return { cfg: profile.documentEscalation, targetFilingDate, steps };
  }

  /** Compute the escalation stage for one document's owning step. */
  private resolveDocStage(
    stepKey: string | null,
    ctx: DocEscalationContext,
    now: number
  ): "info" | "warning" | "critical" {
    const step = stepKey ? ctx.steps.get(stepKey) : undefined;
    const isBehind = step?.status === "completed";
    const anchor = isBehind ? step?.completedAt : step?.startedAt;
    const daysOnStep = anchor ? Math.max(0, Math.floor((now - anchor) / DAY_MS)) : 0;
    const daysUntilFiling =
      ctx.targetFilingDate !== null ? Math.ceil((ctx.targetFilingDate - now) / DAY_MS) : null;
    return computeDocumentStage({ daysOnStep, daysUntilFiling, isBehind, cfg: ctx.cfg });
  }

  // ─────────────────────────────────────────────────────────────
  // CHECKER 3: Police Certificate Tracking
  // Source: case_data table (pcc_saved, pcc_received, pcc_date)
  // Logic: fires smart escalating reminders weekly until received.
  //   Day  7 → normal  "1 week check-in"
  //   Day 14 → high    "2 weeks — check tracking now"
  //   Day 21 → high    "3 weeks — follow up urgently"
  //   Day 30+ → critical "Overdue — interview may be at risk"
  // ─────────────────────────────────────────────────────────────

  private async checkPoliceCertificatePending(journeyId: string): Promise<ReminderCandidate[]> {
    const { data: caseRows } = await this.supabase
      .from("case_data")
      .select("data_key, data_value")
      .eq("journey_id", journeyId)
      .in("data_key", ["pcc_saved", "pcc_received", "pcc_date"]);

    if (!caseRows || caseRows.length === 0) return [];

    const byKey = Object.fromEntries(caseRows.map((r) => [r.data_key, String(r.data_value ?? "")]));

    // Already received — no reminder
    if (byKey["pcc_received"] === "true" || byKey["pcc_received"] === '"true"') return [];

    // Application must be saved for tracking to start
    if (byKey["pcc_saved"] !== "true" && byKey["pcc_saved"] !== '"true"') return [];

    // Calculate days since application date
    const now = new Date();
    let daysSince = 0;
    const rawDate = (byKey["pcc_date"] ?? "").replace(/^"|"$/g, "");
    if (rawDate) {
      const appDate = new Date(rawDate + "T00:00:00");
      if (!isNaN(appDate.getTime())) {
        daysSince = Math.floor((now.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    // Only fire reminders on meaningful intervals (7, 14, 21, 30+)
    if (daysSince < 7) return [];

    // Escalating priority and messaging
    let priority: "critical" | "high" | "normal";
    let title: string;
    let body: string;
    const week = Math.floor(daysSince / 7);

    if (daysSince >= 30) {
      priority = "critical";
      title = `PCC overdue — ${daysSince} days since application`;
      body = `Your Police Clearance Certificate was applied ${daysSince} days ago and is still not received. This is urgent — contact the issuing authority immediately and confirm your interview timeline is not at risk.`;
    } else if (daysSince >= 21) {
      priority = "high";
      title = `PCC still pending, ${daysSince} days, follow up now`;
      body = `It has been ${daysSince} days since your PCC application. Most PCCs arrive within 14-21 days. Visit the tracking portal or call the issuing office to check your status and get an ETA.`;
    } else if (daysSince >= 14) {
      priority = "high";
      title = "PCC, 2 weeks since application, check tracking";
      body =
        "Your PCC application is 2 weeks old. Log in to the tracking website of the issuing authority to verify processing status. Mark it as received in your journey once it arrives.";
    } else {
      priority = "normal";
      title = "PCC, 1 week check-in";
      body =
        "It has been a week since your PCC application. Applications typically enter processing within 7-10 days. You can start checking the tracking portal for a status update.";
    }

    return [
      {
        reminder_type: "police_certificate_pending" as const,
        priority,
        title,
        body,
        step_key: "step_3_3",
        action_url: this.defaultJourneyHref,
        action_label: "Update PCC Status",
        // dedup_key changes each week — so a fresh escalated notification appears
        dedup_key: `${journeyId}:pcc_tracking:week${week}`,
      },
    ];
  }

  // ─────────────────────────────────────────────────────────────
  // CHECKER 2: Appointment Approaching (within 14 days)
  // Trigger: journey_appointments with appointment_datetime within 14 days
  // Priority: critical (≤1 day), high (≤7 days), normal (≤14 days)
  // ─────────────────────────────────────────────────────────────

  private async checkAppointmentsApproaching(journeyId: string): Promise<ReminderCandidate[]> {
    const now = new Date();
    const in14Days = new Date(now);
    in14Days.setDate(in14Days.getDate() + 14);

    const { data: appointments } = await this.supabase
      .from("journey_appointments")
      .select("id, appointment_type, appointment_date, appointment_datetime, location, step_key")
      .eq("journey_id", journeyId)
      .eq("status", "scheduled")
      .gte("appointment_datetime", now.toISOString())
      .lte("appointment_datetime", in14Days.toISOString());

    if (!appointments || appointments.length === 0) return [];

    return appointments.map((appt) => {
      const apptDate = new Date(appt.appointment_datetime || appt.appointment_date);
      const diffDays = Math.ceil((apptDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const priority = diffDays <= 1 ? "critical" : diffDays <= 7 ? "high" : "normal";

      const typeLabel =
        appt.appointment_type === "medical"
          ? "Medical Exam"
          : appt.appointment_type === "interview"
            ? "Consular Interview"
            : "Appointment";

      const dateStr = apptDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });

      return {
        reminder_type: "appointment_approaching" as const,
        priority: priority as "critical" | "high" | "normal",
        title: `${typeLabel} in ${diffDays} day${diffDays !== 1 ? "s" : ""}`,
        body: `Your ${typeLabel.toLowerCase()} is scheduled for ${dateStr}${appt.location ? ` at ${appt.location}` : ""}. Make sure everything is ready.`,
        step_key: appt.step_key ?? undefined,
        reference_id: appt.id,
        action_url: this.defaultJourneyHref,
        action_label: "View Details",
        dedup_key: `${journeyId}:appointment_approaching:${appt.id}:${diffDays}d`,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────
  // CHECKER 4: USCIS Receipt Not Captured
  // Trigger: case_data has no 'uscis_receipt_number' key for this journey
  //          AND the journey status is 'in_progress' (filing has started)
  // Priority: high
  // ─────────────────────────────────────────────────────────────

  private async checkReceiptNotCaptured(journeyId: string): Promise<ReminderCandidate[]> {
    // Check if journey is in_progress (user has started filing)
    const { data: journey } = await this.supabase
      .from("journeys")
      .select("status, completion_percentage")
      .eq("id", journeyId)
      .single();

    if (!journey || journey.status !== "in_progress") return [];
    // Only trigger if user is past the early stages (>15% complete)
    if ((journey.completion_percentage ?? 0) < 15) return [];

    // Check if receipt number already captured
    const { data: receiptData } = await this.supabase
      .from("case_data")
      .select("id")
      .eq("journey_id", journeyId)
      .eq("data_key", "uscis_receipt_number")
      .single();

    if (receiptData) return []; // Already captured, no reminder needed

    return [
      {
        reminder_type: "receipt_not_captured" as const,
        priority: "high" as const,
        title: "USCIS Receipt Number Not Recorded",
        body: "Once USCIS processes your petition, you will receive a receipt notice with a case number. Enter it here to track your case and activate waiting-state guidance.",
        step_key: "I.9",
        action_url: "/visa-category/ir1-journey",
        action_label: "Enter Receipt Number",
        dedup_key: `${journeyId}:receipt_not_captured`,
      },
    ];
  }

  // ─────────────────────────────────────────────────────────────
  // CHECKER 5: NVC Fee Not Confirmed
  // Trigger: case_data has no 'nvc_fee_status' = 'posted'
  //          AND journey is past Chapter I (completion > 35%)
  // Priority: high
  // ─────────────────────────────────────────────────────────────

  private async checkNvcFeeNotConfirmed(journeyId: string): Promise<ReminderCandidate[]> {
    const { data: journey } = await this.supabase
      .from("journeys")
      .select("completion_percentage")
      .eq("id", journeyId)
      .single();

    if (!journey || (journey.completion_percentage ?? 0) < 35) return [];

    const { data: feeData } = await this.supabase
      .from("case_data")
      .select("data_value")
      .eq("journey_id", journeyId)
      .eq("data_key", "nvc_fee_status")
      .single();

    // If fee is posted, no reminder needed
    if (feeData?.data_value === "posted" || feeData?.data_value === '"posted"') return [];

    return [
      {
        reminder_type: "nvc_fee_not_confirmed" as const,
        priority: "high" as const,
        title: "NVC Fee Payment Not Confirmed",
        body: "Your NVC fee payment has not yet been confirmed as posted in CEAC. DS-260 becomes available only after fees are marked as posted. Check CEAC and update your status.",
        step_key: "II.2",
        action_url: "/visa-category/ir1-journey",
        action_label: "Check CEAC Status",
        dedup_key: `${journeyId}:nvc_fee_not_confirmed`,
      },
    ];
  }

  // ─────────────────────────────────────────────────────────────
  // CHECKER 6: USCIS Account Setup Incomplete
  // Trigger: no portal_record of type 'uscis' for this journey
  //          AND journey progress > 20% (past account creation step)
  // Priority: normal
  // ─────────────────────────────────────────────────────────────

  private async checkAccountSetupIncomplete(journeyId: string): Promise<ReminderCandidate[]> {
    const { data: journey } = await this.supabase
      .from("journeys")
      .select("completion_percentage")
      .eq("id", journeyId)
      .single();

    if (!journey || (journey.completion_percentage ?? 0) < 20) return [];

    const { data: portalRecord } = await this.supabase
      .from("journey_portal_records")
      .select("id")
      .eq("journey_id", journeyId)
      .eq("portal_type", "uscis")
      .limit(1);

    if (portalRecord && portalRecord.length > 0) return [];

    return [
      {
        reminder_type: "account_setup_incomplete" as const,
        priority: "normal" as const,
        title: "USCIS Account Not Saved to Portal Wallet",
        body: "Save your USCIS account credentials to your Portal Wallet so you can quickly access your case online whenever you need to.",
        step_key: "I.5",
        action_url: "/visa-category/ir1-journey",
        action_label: "Save to Wallet",
        dedup_key: `${journeyId}:account_setup_incomplete`,
      },
    ];
  }

  // ─────────────────────────────────────────────────────────────
  // CHECKER 7: Abandoned Tool Sessions (3+ days, incomplete)
  // Trigger: tool_sessions with is_completed=false and
  //          last_saved_at is more than 3 days ago
  // Priority: normal
  // ─────────────────────────────────────────────────────────────

  private async checkAbandonedToolSessions(journeyId: string): Promise<ReminderCandidate[]> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: sessions } = await this.supabase
      .from("tool_sessions")
      .select("id, tool_key, step_key, completion_percentage, last_saved_at")
      .eq("journey_id", journeyId)
      .eq("is_completed", false)
      .lt("last_saved_at", threeDaysAgo.toISOString());

    if (!sessions || sessions.length === 0) return [];

    const toolLabels: Record<string, string> = {
      form_filler_i130: "I-130 AutoFormFiller",
      affidavit_calculator: "Affidavit Support Calculator",
      ds260_prep: "DS-260 Preparation",
      interview_prep: "Interview Prep Tool",
      case_strength_checker: "Case Strength Checker",
    };

    return sessions.map((session) => {
      const label = toolLabels[session.tool_key] || session.tool_key;
      const pct = session.completion_percentage || 0;

      return {
        reminder_type: "tool_session_abandoned" as const,
        priority: "normal" as const,
        title: `Resume ${label}`,
        body: `You started the ${label} but left at ${pct}% completion. Return to pick up where you left off, your progress is saved.`,
        step_key: session.step_key,
        reference_id: session.id,
        action_url: this.defaultJourneyHref,
        action_label: "Resume Tool",
        dedup_key: `${journeyId}:tool_session_abandoned:${session.tool_key}`,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────
  // CHECKER 8: Appointment Not Recorded
  // Trigger: journey progress > 70% (deep into Chapter III) but
  //          no appointments of type 'medical' or 'interview' saved
  // Priority: high
  // ─────────────────────────────────────────────────────────────

  private async checkAppointmentNotRecorded(journeyId: string): Promise<ReminderCandidate[]> {
    const { data: journey } = await this.supabase
      .from("journeys")
      .select("completion_percentage")
      .eq("id", journeyId)
      .single();

    if (!journey || (journey.completion_percentage ?? 0) < 70) return [];

    const { data: caseData } = await this.supabase
      .from("case_data")
      .select("data_key")
      .eq("journey_id", journeyId)
      .in("data_key", ["med_date", "interviewDate"]);

    const hasMedical = caseData?.some((d) => d.data_key === "med_date");
    const hasInterview = caseData?.some((d) => d.data_key === "interviewDate");

    const reminders: ReminderCandidate[] = [];

    if (!hasMedical) {
      reminders.push({
        reminder_type: "appointment_not_recorded" as const,
        priority: "high" as const,
        title: "Medical Exam Date Not Recorded",
        body: "You are in Chapter III but your medical exam appointment date has not been saved. Record it so Rahvana can remind you as it approaches.",
        step_key: "III.1",
        action_url: "/visa-category/ir1-journey",
        action_label: "Record Date",
        dedup_key: `${journeyId}:appointment_not_recorded:medical`,
      });
    }

    if (!hasInterview) {
      reminders.push({
        reminder_type: "appointment_not_recorded" as const,
        priority: "high" as const,
        title: "Interview Date Not Recorded",
        body: "Your consular interview date has not been saved. Add it to receive timely reminders and preparation guidance.",
        step_key: "III.4",
        action_url: "/visa-category/ir1-journey",
        action_label: "Record Date",
        dedup_key: `${journeyId}:appointment_not_recorded:interview`,
      });
    }

    return reminders;
  }

  // ─────────────────────────────────────────────────────────────
  // CHECKER 9: Tracking Status Updates
  // Trigger: recent updates to tracking status
  // Priority: depends on status
  // ─────────────────────────────────────────────────────────────

  private async checkTrackingStatusUpdates(journeyId: string): Promise<ReminderCandidate[]> {
    // Get latest tracking status
    const { data: statusData } = await this.supabase
      .from("case_data")
      .select("data_value, updated_at")
      .eq("journey_id", journeyId)
      .eq("data_key", "tracking_status")
      .single();

    if (!statusData?.data_value) return [];

    // Clean Value
    const status = String(statusData.data_value).replace(/"/g, "").toLowerCase();

    // Only trigger if recently updated (avoid old spam)
    const updatedAt = new Date(statusData.updated_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);

    if (diffMinutes > 60) return [];

    // Only important statuses
    const allowedStatuses = ["out_for_delivery", "delivered"];

    if (!allowedStatuses.includes(status)) {
      return [];
    }

    // Create reminder content
    let title = "";
    let body = "";
    let priority: "high" | "critical" = "high";

    if (status === "out_for_delivery") {
      title = "Packet Out for Delivery to USCIS";
      body =
        "Your packet is out for delivery and should reach USCIS today. Keep your tracking details for confirmation once it is delivered.";
      priority = "high";
    }

    if (status === "delivered") {
      title = "Packet Delivered to USCIS";
      body =
        "Your packet has been successfully delivered to USCIS. Keep the delivery confirmation for your records as proof of submission. You can now continue with receipt notice tracking.";
      priority = "critical";
    }

    return [
      {
        reminder_type: "tracking_status_update" as const,
        priority,
        title,
        body,
        action_url: this.defaultJourneyHref,
        action_label: "View Tracking",
        dedup_key: `${journeyId}:tracking_status:${status}`,
      },
    ];
  }

  // ─────────────────────────────────────────────────────────────
  // CHECKER 10: Chapter 1 Step 2 — Required Documents Not Gathered
  // Trigger: gathering_status exists in case_data (user opened Step 2)
  //          AND one or more required documents are not "reviewed"
  //          AND it has been 48+ hours since last update (no spam)
  // Priority: high (or escalated per documentEscalation config)
  // Auto-dismisses when all required docs are marked reviewed
  //
  // Journey-type-aware: IR-1 uses spouse/marriage doc IDs; IR-5 uses
  // parent-petition doc IDs (no marriage docs). Unknown types: skipped.
  // ─────────────────────────────────────────────────────────────

  /**
   * Per-journey-type config for the Step 2 document gathering checker.
   * Add an entry here when a new journey type has a Step 2 gathering flow.
   * IDs must match the `id` values in the journey's `document_items` JSON.
   */
  private static readonly STEP2_DOC_CONFIGS: Record<
    string,
    { docIds: string[]; labels: Record<string, string> }
  > = {
    // IR-1 / CR-1 — spouse of U.S. citizen
    "ir-1": {
      docIds: [
        "doc_citizenship",
        "doc_passport_ben",
        "doc_nikah_nama",
        "doc_mrc",
        "doc_relationship",
      ],
      labels: {
        doc_citizenship: "Proof of U.S. Citizenship",
        doc_passport_ben: "Beneficiary Passport",
        doc_nikah_nama: "Nikah Nama (Original)",
        doc_mrc: "NADRA Marriage Certificate",
        doc_relationship: "Relationship Evidence",
      },
    },
    // IR-5 — parent of U.S. citizen (no marriage docs; parent-petition civil docs)
    // IDs sourced from IR5_BASE_DOC_IDS in lib/questionnaire/ir5-questionnaire.ts
    "ir-5": {
      docIds: [
        "doc_citizenship",
        "doc_petitioner_birth_cert",
        "doc_parent_identity_match",
        "doc_parent_passport",
        "doc_parent_birth_cert",
      ],
      labels: {
        doc_citizenship: "Proof of U.S. Citizenship",
        doc_petitioner_birth_cert: "Petitioner Birth Certificate",
        doc_parent_identity_match: "Parent Identity & Name Match Evidence",
        doc_parent_passport: "Parent Passport",
        doc_parent_birth_cert: "Parent Birth Certificate",
      },
    },
  };

  /** Normalize journey_type → config key (tolerant: "IR-5"/"IR5"/"ir5"/"ir5_candidate2" → "ir-5"). */
  private static normalizeJourneyType(raw: string | null | undefined): string {
    if (!raw) return "";
    const base = getBaseVisaCategory(raw);
    return base.toLowerCase();
  }

  private async checkStep2GatheringPending(journeyId: string): Promise<ReminderCandidate[]> {
    // Resolve per-journey-type doc config
    const norm = ReminderEngine.normalizeJourneyType(
      // journey_type was already fetched at the top of generateReminders — reuse it
      // by re-querying (one cheap select, cached by Supabase connection).
      await this.supabase
        .from("journeys")
        .select("journey_type")
        .eq("id", journeyId)
        .single()
        .then((r) => r.data?.journey_type ?? null)
    );

    // Also accept "cr-1" as the same config as "ir-1" (same document set)
    const configKey = norm === "cr-1" ? "ir-1" : norm;
    const typeConfig = ReminderEngine.STEP2_DOC_CONFIGS[configKey];

    // No config for this journey type → skip silently (safe default)
    if (!typeConfig) return [];

    const { docIds: REQUIRED_DOC_IDS, labels: REQUIRED_DOC_LABELS } = typeConfig;
    const DEDUP_KEY = `${journeyId}:step2_gathering_pending`;

    // Fetch gathering status from case_data
    const { data: gatheringRow } = await this.supabase
      .from("case_data")
      .select("data_value, updated_at")
      .eq("journey_id", journeyId)
      .eq("data_key", "gathering_status")
      .single();

    // Step 2 has never been opened — no reminder yet
    if (!gatheringRow?.data_value) return [];

    // Parse the gathering status JSON (strip surrounding quotes if present)
    let gatheringStatus: Record<string, string> = {};
    try {
      const raw = String(gatheringRow.data_value).trim().replace(/^"|"$/g, "");
      if (!raw || raw === "null" || raw === "undefined") return [];
      gatheringStatus = JSON.parse(raw);
    } catch {
      return [];
    }

    // Fetch required documents for this journey dynamically (not hardcoded).
    // This way, IR-1 gets spouse docs, IR-5 gets parent docs, future categories get theirs.
    const { data: requiredDocs } = await this.supabase
      .from("journey_documents")
      .select("document_type, document_label")
      .eq("journey_id", journeyId)
      .eq("is_required", true)
      .is("deleted_at", null);

    if (!requiredDocs || requiredDocs.length === 0) return [];

    // Filter to docs not yet marked "reviewed" in the gathering status
    const pendingDocs = requiredDocs.filter((doc) => gatheringStatus[doc.document_type] !== "reviewed");

    // All required docs reviewed — auto-dismiss any existing reminder
    if (pendingDocs.length === 0) {
      await this.supabase
        .from("journey_reminders")
        .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
        .eq("dedup_key", DEDUP_KEY)
        .eq("is_dismissed", false);
      return [];
    }

    // Only remind if user has been inactive on this step for 48+ hours
    const updatedAt = new Date(gatheringRow.updated_at);
    const hoursSince = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 48) return [];

    const pendingLabels = pendingDocs.map((id) => REQUIRED_DOC_LABELS[id] ?? id);
    const count = pendingDocs.length;

    // Opt-in escalation: match the dashboard's urgency for step_1_2 instead of an
    // instant "high". Calm (info) stage → don't push (dashboard shows it). No
    // config → legacy "high" behavior (IR-1), unchanged.
    let priority: ReminderPriority = "high";
    const ctx = await this.getDocEscalationContext(journeyId);
    if (ctx) {
      const stage = this.resolveDocStage("step_1_2", ctx, Date.now());
      if (stage === "info") return [];
      priority = stage === "critical" ? "high" : "normal";
    }

    return [
      {
        reminder_type: "missing_document" as const,
        priority,
        title: `Complete your documents, ${count} item${count !== 1 ? "s" : ""} pending`,
        body: `Your document checklist for Chapter 1, Step 2 is incomplete. Still needed: ${pendingLabels.join(", ")}. Mark each document as ready to keep your case on track.`,
        step_key: "step_1_2",
        action_url: this.defaultJourneyHref,
        action_label: "Complete Documents",
        dedup_key: DEDUP_KEY,
      },
    ];
  }
}

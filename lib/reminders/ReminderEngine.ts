// ============================================================
// lib/reminders/ReminderEngine.ts
// Core auto-generation service for IR-1 Roadmap in-app reminders.
//
// Usage (from API route):
//   const engine = new ReminderEngine(supabase)
//   await engine.generateReminders(journeyId)
//
// The engine checks all trigger conditions defined in
// IR1_Roadmap_Feature_Detail_Document.md (§8.8, §10.3)
// and upserts reminder records using dedup_key to prevent duplicates.
// ============================================================

import { SupabaseClient } from '@supabase/supabase-js'
import type { ReminderCandidate } from './types'

export class ReminderEngine {
  constructor(private supabase: SupabaseClient) {}

  // ─────────────────────────────────────────────────────────────
  // Main entry point — call this on every GET /reminders request
  // It detects new conditions and upserts reminders accordingly
  // ─────────────────────────────────────────────────────────────

  async generateReminders(journeyId: string): Promise<void> {
    const candidates: ReminderCandidate[] = []

    // Run all checks in parallel for performance
    const [
      missingDocReminders,
      appointmentApproachingReminders,
      policeCertReminder,
      receiptNotCapturedReminder,
      nvcFeeReminder,
      accountSetupReminder,
      toolAbandonedReminders,
      appointmentNotRecordedReminder,
    ] = await Promise.allSettled([
      this.checkMissingDocuments(journeyId),
      this.checkAppointmentsApproaching(journeyId),
      this.checkPoliceCertificatePending(journeyId),
      this.checkReceiptNotCaptured(journeyId),
      this.checkNvcFeeNotConfirmed(journeyId),
      this.checkAccountSetupIncomplete(journeyId),
      this.checkAbandonedToolSessions(journeyId),
      this.checkAppointmentNotRecorded(journeyId),
    ])

    // Collect results safely (ignore individual failures)
    const push = (result: PromiseSettledResult<ReminderCandidate[]>) => {
      if (result.status === 'fulfilled') candidates.push(...result.value)
    }

    push(missingDocReminders)
    push(appointmentApproachingReminders)
    push(policeCertReminder)
    push(receiptNotCapturedReminder)
    push(nvcFeeReminder)
    push(accountSetupReminder)
    push(toolAbandonedReminders)
    push(appointmentNotRecordedReminder)

    if (candidates.length === 0) return

    // Upsert all candidates using dedup_key (ON CONFLICT DO UPDATE)
    // This refreshes the title/body if logic changes, without creating duplicates
    await this.supabase
      .from('journey_reminders')
      .upsert(
        candidates.map((c) => ({
          journey_id: journeyId,
          ...c,
        })),
        { onConflict: 'dedup_key', ignoreDuplicates: false }
      )
  }

  /**
   * TRIGGER 8: Find the first actionable step that is 'not_started' and prompt the user.
   */
  private async checkNewStepsAvailable(journeyId: string, reminders: any[]) {
    const { data: currentStep } = await this.supabase
      .from('journey_steps')
      .select('id, step_name')
      .eq('journey_id', journeyId)
      .eq('status', 'not_started')
      .order('sequence_order', { ascending: true })
      .limit(1)
      .single();

    if (currentStep) {
       reminders.push({
         reminder_type: 'step_available',
         priority: 'normal',
         title: `Next Step: ${currentStep.step_name}`,
         body: `Ready for the next phase? Begin ${currentStep.step_name} to keep your case moving.`,
         action_label: 'Start Now',
         action_url: `/visa-category/ir-category/ir1-journey`,
         dedup_key: `${journeyId}:step_available:${currentStep.id}`
       });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────
  // Trigger: journey_documents rows where is_required=true and
  //          status is 'not_started' or 'requested'
  // Priority: high
  // ─────────────────────────────────────────────────────────────

  private async checkMissingDocuments(journeyId: string): Promise<ReminderCandidate[]> {
    const { data: docs } = await this.supabase
      .from('journey_documents')
      .select('id, document_type, document_label, step_key, status')
      .eq('journey_id', journeyId)
      .eq('is_required', true)
      .in('status', ['not_started', 'requested'])
      .is('deleted_at', null)

    if (!docs || docs.length === 0) return []

    return docs.map((doc) => ({
      reminder_type: 'missing_document' as const,
      priority: 'high' as const,
      title: `Document Required: ${doc.document_label || doc.document_type}`,
      body: `Your "${doc.document_label || doc.document_type}" is required but has not been uploaded yet. Upload it to keep your case on track.`,
      step_key: doc.step_key ?? undefined,
      reference_id: doc.id,
      action_url: '/visa-category/ir-category/ir1-journey',
      action_label: 'Upload Document',
      dedup_key: `${journeyId}:missing_document:${doc.document_type}`,
    }))
  }

  // ─────────────────────────────────────────────────────────────
  // CHECKER 2: Appointment Approaching (within 14 days)
  // Trigger: journey_appointments with appointment_datetime within 14 days
  // Priority: critical (≤1 day), high (≤7 days), normal (≤14 days)
  // ─────────────────────────────────────────────────────────────

  private async checkAppointmentsApproaching(journeyId: string): Promise<ReminderCandidate[]> {
    const now = new Date()
    const in14Days = new Date(now)
    in14Days.setDate(in14Days.getDate() + 14)

    const { data: appointments } = await this.supabase
      .from('journey_appointments')
      .select('id, appointment_type, appointment_date, appointment_datetime, location, step_key')
      .eq('journey_id', journeyId)
      .eq('status', 'scheduled')
      .gte('appointment_datetime', now.toISOString())
      .lte('appointment_datetime', in14Days.toISOString())

    if (!appointments || appointments.length === 0) return []

    return appointments.map((appt) => {
      const apptDate = new Date(appt.appointment_datetime || appt.appointment_date)
      const diffDays = Math.ceil((apptDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      const priority =
        diffDays <= 1 ? 'critical' :
        diffDays <= 7 ? 'high' : 'normal'

      const typeLabel =
        appt.appointment_type === 'medical' ? 'Medical Exam' :
        appt.appointment_type === 'interview' ? 'Consular Interview' :
        'Appointment'

      const dateStr = apptDate.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
      })

      return {
        reminder_type: 'appointment_approaching' as const,
        priority: priority as 'critical' | 'high' | 'normal',
        title: `${typeLabel} in ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
        body: `Your ${typeLabel.toLowerCase()} is scheduled for ${dateStr}${appt.location ? ` at ${appt.location}` : ''}. Make sure everything is ready.`,
        step_key: appt.step_key ?? undefined,
        reference_id: appt.id,
        action_url: '/visa-category/ir-category/ir1-journey',
        action_label: 'View Details',
        dedup_key: `${journeyId}:appointment_approaching:${appt.id}:${diffDays}d`,
      }
    })
  }

  // ─────────────────────────────────────────────────────────────
  // CHECKER 3: Police Certificate Pending
  // Trigger: document with type 'police_certificate' and status
  //          'requested' or 'pending' (not yet 'received'/'uploaded')
  // Priority: high (this is a persistent-until-resolved reminder)
  // ─────────────────────────────────────────────────────────────

  private async checkPoliceCertificatePending(journeyId: string): Promise<ReminderCandidate[]> {
    const { data: docs } = await this.supabase
      .from('journey_documents')
      .select('id, status, updated_at')
      .eq('journey_id', journeyId)
      .eq('document_type', 'police_certificate')
      .in('status', ['requested', 'pending'])
      .is('deleted_at', null)
      .limit(1)

    if (!docs || docs.length === 0) return []

    // Check if older than 6 months (180 days)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const isStale = new Date(docs[0].updated_at) < sixMonthsAgo;

    return [{
      reminder_type: 'police_certificate_pending' as const,
      priority: 'high' as const,
      title: isStale ? 'Police Certificate May Be Expired' : 'Police Certificate Not Yet Received',
      body: isStale 
        ? 'Your police certificate request is over 6 months old. Ensure it is still valid for your interview date.'
        : 'Your police certificate has been requested but not yet received. Keep following up with the issuing authority.',
      step_key: 'III.2',
      reference_id: docs[0].id,
      action_url: '/visa-category/ir-category/ir1-journey',
      action_label: 'Update Status',
      dedup_key: `${journeyId}:police_certificate_pending`,
    }]
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
      .from('journeys')
      .select('status, completion_percentage')
      .eq('id', journeyId)
      .single()

    if (!journey || journey.status !== 'in_progress') return []
    // Only trigger if user is past the early stages (>15% complete)
    if ((journey.completion_percentage ?? 0) < 15) return []

    // Check if receipt number already captured
    const { data: receiptData } = await this.supabase
      .from('case_data')
      .select('id')
      .eq('journey_id', journeyId)
      .eq('data_key', 'uscis_receipt_number')
      .single()

    if (receiptData) return [] // Already captured, no reminder needed

    return [{
      reminder_type: 'receipt_not_captured' as const,
      priority: 'high' as const,
      title: 'USCIS Receipt Number Not Recorded',
      body: 'Once USCIS processes your petition, you will receive a receipt notice with a case number. Enter it here to track your case and activate waiting-state guidance.',
      step_key: 'I.9',
      action_url: '/visa-category/ir-category/ir1-journey',
      action_label: 'Enter Receipt Number',
      dedup_key: `${journeyId}:receipt_not_captured`,
    }]
  }

  // ─────────────────────────────────────────────────────────────
  // CHECKER 5: NVC Fee Not Confirmed
  // Trigger: case_data has no 'nvc_fee_status' = 'posted'
  //          AND journey is past Chapter I (completion > 35%)
  // Priority: high
  // ─────────────────────────────────────────────────────────────

  private async checkNvcFeeNotConfirmed(journeyId: string): Promise<ReminderCandidate[]> {
    const { data: journey } = await this.supabase
      .from('journeys')
      .select('completion_percentage')
      .eq('id', journeyId)
      .single()

    if (!journey || (journey.completion_percentage ?? 0) < 35) return []

    const { data: feeData } = await this.supabase
      .from('case_data')
      .select('data_value')
      .eq('journey_id', journeyId)
      .eq('data_key', 'nvc_fee_status')
      .single()

    // If fee is posted, no reminder needed
    if (feeData?.data_value === 'posted' || feeData?.data_value === '"posted"') return []

    return [{
      reminder_type: 'nvc_fee_not_confirmed' as const,
      priority: 'high' as const,
      title: 'NVC Fee Payment Not Confirmed',
      body: 'Your NVC fee payment has not yet been confirmed as posted in CEAC. DS-260 becomes available only after fees are marked as posted. Check CEAC and update your status.',
      step_key: 'II.2',
      action_url: '/visa-category/ir-category/ir1-journey',
      action_label: 'Check CEAC Status',
      dedup_key: `${journeyId}:nvc_fee_not_confirmed`,
    }]
  }

  // ─────────────────────────────────────────────────────────────
  // CHECKER 6: USCIS Account Setup Incomplete
  // Trigger: no portal_record of type 'uscis' for this journey
  //          AND journey progress > 20% (past account creation step)
  // Priority: normal
  // ─────────────────────────────────────────────────────────────

  private async checkAccountSetupIncomplete(journeyId: string): Promise<ReminderCandidate[]> {
    const { data: journey } = await this.supabase
      .from('journeys')
      .select('completion_percentage')
      .eq('id', journeyId)
      .single()

    if (!journey || (journey.completion_percentage ?? 0) < 20) return []

    const { data: portalRecord } = await this.supabase
      .from('journey_portal_records')
      .select('id')
      .eq('journey_id', journeyId)
      .eq('portal_type', 'uscis')
      .limit(1)

    if (portalRecord && portalRecord.length > 0) return []

    return [{
      reminder_type: 'account_setup_incomplete' as const,
      priority: 'normal' as const,
      title: 'USCIS Account Not Saved to Portal Wallet',
      body: 'Save your USCIS account credentials to your Portal Wallet so you can quickly access your case online whenever you need to.',
      step_key: 'I.5',
      action_url: '/visa-category/ir-category/ir1-journey',
      action_label: 'Save to Wallet',
      dedup_key: `${journeyId}:account_setup_incomplete`,
    }]
  }

  // ─────────────────────────────────────────────────────────────
  // CHECKER 7: Abandoned Tool Sessions (3+ days, incomplete)
  // Trigger: tool_sessions with is_completed=false and
  //          last_saved_at is more than 3 days ago
  // Priority: normal
  // ─────────────────────────────────────────────────────────────

  private async checkAbandonedToolSessions(journeyId: string): Promise<ReminderCandidate[]> {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const { data: sessions } = await this.supabase
      .from('tool_sessions')
      .select('id, tool_key, step_key, completion_percentage, last_saved_at')
      .eq('journey_id', journeyId)
      .eq('is_completed', false)
      .lt('last_saved_at', threeDaysAgo.toISOString())

    if (!sessions || sessions.length === 0) return []

    const toolLabels: Record<string, string> = {
      form_filler_i130: 'I-130 AutoFormFiller',
      affidavit_calculator: 'Affidavit Support Calculator',
      ds260_prep: 'DS-260 Preparation',
      interview_prep: 'Interview Prep Tool',
      case_strength_checker: 'Case Strength Checker',
    }

    return sessions.map((session) => {
      const label = toolLabels[session.tool_key] || session.tool_key
      const pct = session.completion_percentage || 0

      return {
        reminder_type: 'tool_session_abandoned' as const,
        priority: 'normal' as const,
        title: `Resume ${label}`,
        body: `You started the ${label} but left at ${pct}% completion. Return to pick up where you left off — your progress is saved.`,
        step_key: session.step_key,
        reference_id: session.id,
        action_url: '/visa-category/ir-category/ir1-journey',
        action_label: 'Resume Tool',
        dedup_key: `${journeyId}:tool_session_abandoned:${session.tool_key}`,
      }
    })
  }

  // ─────────────────────────────────────────────────────────────
  // CHECKER 8: Appointment Not Recorded
  // Trigger: journey progress > 70% (deep into Chapter III) but
  //          no appointments of type 'medical' or 'interview' saved
  // Priority: high
  // ─────────────────────────────────────────────────────────────

  private async checkAppointmentNotRecorded(journeyId: string): Promise<ReminderCandidate[]> {
    const { data: journey } = await this.supabase
      .from('journeys')
      .select('completion_percentage')
      .eq('id', journeyId)
      .single()

    if (!journey || (journey.completion_percentage ?? 0) < 70) return []

    const { data: appointments } = await this.supabase
      .from('journey_appointments')
      .select('id, appointment_type')
      .eq('journey_id', journeyId)
      .in('appointment_type', ['medical', 'interview'])

    const hasMedical = appointments?.some(a => a.appointment_type === 'medical')
    const hasInterview = appointments?.some(a => a.appointment_type === 'interview')

    const reminders: ReminderCandidate[] = []

    if (!hasMedical) {
      reminders.push({
        reminder_type: 'appointment_not_recorded' as const,
        priority: 'high' as const,
        title: 'Medical Exam Date Not Recorded',
        body: 'You are in Chapter III but your medical exam appointment date has not been saved. Record it so Rahvana can remind you as it approaches.',
        step_key: 'III.1',
        action_url: '/visa-category/ir-category/ir1-journey',
        action_label: 'Record Date',
        dedup_key: `${journeyId}:appointment_not_recorded:medical`,
      })
    }

    if (!hasInterview) {
      reminders.push({
        reminder_type: 'appointment_not_recorded' as const,
        priority: 'high' as const,
        title: 'Interview Date Not Recorded',
        body: 'Your consular interview date has not been saved. Add it to receive timely reminders and preparation guidance.',
        step_key: 'III.4',
        action_url: '/visa-category/ir-category/ir1-journey',
        action_label: 'Record Date',
        dedup_key: `${journeyId}:appointment_not_recorded:interview`,
      })
    }

    return reminders
  }
}

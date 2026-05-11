// ============================================================
// lib/notifications/reminderRegistry.ts
//
// SINGLE SOURCE OF TRUTH for all reminders across all 3 chapters.
//
// To add a new reminder: add one object to REMINDER_REGISTRY.
// Nothing else changes — the UnifiedReminderEngine reads this
// and handles scheduling, delivery, and suppression automatically.
// ============================================================

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type ReminderOrigin = 'ceac' | 'journey'
export type ReminderPriority = 'critical' | 'high' | 'normal' | 'low'
export type ReminderChannel = 'push' | 'push_and_email'
export type ReminderKind = 'ACTION' | 'URGENT' | 'WAITING' | 'FOLLOW-UP'

/** What condition stops/cancels this reminder */
export type SuppressCondition =
  | { type: 'step_completed';      stepKey: string }       // stop when this step is done
  | { type: 'metadata_key_exists'; metadataKey: string }   // stop when metadata key is set
  | { type: 'metadata_key_value';  metadataKey: string; value: string } // stop when key = value
  | { type: 'ceac_status_beyond';  groups: string[] }      // stop when CEAC advances
  | { type: 'never' }                                      // never auto-cancel

/** What event starts this reminder chain */
export type TriggerEvent =
  | { type: 'step_completed';      stepKey: string }
  | { type: 'ceac_status';         status: string }
  | { type: 'metadata_key_exists'; metadataKey: string }
  | { type: 'metadata_key_value';  metadataKey: string; value: string }
  | { type: 'metadata_date_set';   metadataKey: string }

// ─────────────────────────────────────────────────────────────
// TYPE-SAFE ACCESSORS — use these instead of (trigger as any)
// ─────────────────────────────────────────────────────────────
export function getStepKey(t: TriggerEvent): string | null {
  return t.type === 'step_completed' ? t.stepKey : null
}
export function getMetadataKey(t: TriggerEvent | SuppressCondition): string | null {
  if ('metadataKey' in t) return t.metadataKey
  return null
}
export function getMetadataValue(t: TriggerEvent | SuppressCondition): string | null {
  if (t.type === 'metadata_key_value') return t.value
  return null
}
export function getSuppressStepKey(s: SuppressCondition): string | null {
  return s.type === 'step_completed' ? s.stepKey : null
}
export function getCeacGroups(s: SuppressCondition): string[] {
  return s.type === 'ceac_status_beyond' ? s.groups : []
}

export interface JourneyReminderDef {
  /** Unique ID — used as reminder_id in DB */
  id: string
  /** Used for bulk cancellation when status/phase advances */
  group: string
  /** Which chapter this belongs to */
  chapter: 1 | 2 | 3
  /** Delivery type */
  kind: ReminderKind
  /** DB source */
  origin: ReminderOrigin

  /** What starts this reminder chain */
  trigger: TriggerEvent
  /** When to auto-cancel */
  suppressWhen: SuppressCondition

  /**
   * Days to offset from the trigger.
   * - For most triggers: days AFTER trigger event (positive = future)
   * - For 'metadata_date_set': days BEFORE the stored date (negative offset)
   *   e.g. delayDays: -14 = fire 14 days BEFORE the appointment date
   */
  delayDays: number
  /** Repeats every N days after first send. undefined = one-shot. */
  recurring?: { intervalDays: number; maxCount?: number }

  priority: ReminderPriority
  channels: ReminderChannel[]

  title: string
  body: string
  actionLabel?: string
  actionUrl?: string

  /** Optional: for refused sub-type reminders only */
  requiresRefusedSubType?: 'refusal_221g' | 'refusal_final'
}

// ─────────────────────────────────────────────────────────────
// REGISTRY — all reminders, all chapters
// ─────────────────────────────────────────────────────────────

export const REMINDER_REGISTRY: JourneyReminderDef[] = [

  // ══════════════════════════════════════════════════════════
  // CHAPTER 1 — USCIS Filing
  // ══════════════════════════════════════════════════════════

  {
    id: 'c1_portal_not_saved',
    group: 'c1_setup',
    chapter: 1,
    kind: 'ACTION',
    origin: 'journey',
    trigger: { type: 'step_completed', stepKey: 'step_1_5' },
    suppressWhen: { type: 'metadata_key_exists', metadataKey: 'uscisPortalSaved' },
    delayDays: 3,
    priority: 'normal',
    channels: ['push'],
    title: 'Save your USCIS account to Portal Wallet',
    body: 'You created your USCIS account a few days ago. Save your login credentials to your Portal Wallet so you can access your case quickly at any time.',
    actionLabel: 'Save to Wallet',
    actionUrl: '/visa-category/ir-category/ir1-journey',
  },

  {
    id: 'c1_receipt_missing',
    group: 'c1_receipt',
    chapter: 1,
    kind: 'WAITING',
    origin: 'journey',
    trigger: { type: 'step_completed', stepKey: 'step_1_9' },
    suppressWhen: { type: 'metadata_key_exists', metadataKey: 'receiptNum' },
    delayDays: 15,
    recurring: { intervalDays: 7, maxCount: 8 },
    priority: 'high',
    channels: ['push'],
    title: 'USCIS Receipt Number not recorded',
    body: 'Your I-130 was submitted. Once USCIS processes it (usually 2–4 weeks), you will receive a receipt notice with a case number. Record it in Chapter 1 → Step 9 to activate case tracking.',
    actionLabel: 'Enter Receipt Number',
    actionUrl: '/visa-category/ir-category/ir1-journey',
  },

  {
    id: 'c1_case_status_check',
    group: 'c1_uscis_wait',
    chapter: 1,
    kind: 'WAITING',
    origin: 'journey',
    trigger: { type: 'metadata_key_exists', metadataKey: 'receiptNum' },
    // Suppress when NVC Case Number exists = USCIS approved + NVC phase started
    suppressWhen: { type: 'metadata_key_exists', metadataKey: 'nvcCaseNum' },
    delayDays: 30,
    recurring: { intervalDays: 30 },
    priority: 'normal',
    channels: ['push'],
    title: 'Check your USCIS case status',
    body: 'Log into your USCIS online account and check your I-130 case status. Cases typically take 6–24 months. Update your journey when you receive a Notice of Approval.',
    actionLabel: 'Open USCIS Portal',
    actionUrl: 'https://my.uscis.gov/',
  },

  // ══════════════════════════════════════════════════════════
  // CHAPTER 2 — NVC Processing
  // ══════════════════════════════════════════════════════════

  {
    id: 'c2_nvc_fee_check',
    group: 'c2_nvc_fee',
    chapter: 2,
    kind: 'WAITING',
    origin: 'journey',
    // Trigger: fires when NVC Case Number is saved (Step 2.1 — CaseRegistrationForm saves nvcCaseNum)
    // This means user has registered with NVC, so fees are now due
    trigger: { type: 'metadata_key_exists', metadataKey: 'nvcCaseNum' },
    // Suppress: nvcFeeStatus is an OBJECT { aos: 'Paid', iv: 'Paid' } saved by NVC Fee Modal.
    // We suppress when the object exists (any status saved = user has acknowledged fees)
    suppressWhen: { type: 'metadata_key_exists', metadataKey: 'nvcFeeStatus' },
    delayDays: 0,
    recurring: { intervalDays: 14 },
    priority: 'high',
    channels: ['push'],
    title: 'NVC fee not confirmed — check CEAC',
    body: 'Your NVC fee payment has not yet been confirmed as posted in CEAC. DS-260 only becomes available after fees show as posted. Log into CEAC and check.',
    actionLabel: 'Check CEAC',
    actionUrl: 'https://ceac.state.gov/IV/Login.aspx',
  },

  // ── Chapter 2 Step 9: Awaiting NVC Document Review ────────
  // Fires when user completes Step 2.8 (docs submitted to NVC).
  // Stops when DQ date is entered (Step 2.10 complete).

  {
    id: 'c2_s9_start',
    group: 'c2_nvc_review',
    chapter: 2,
    kind: 'ACTION',
    origin: 'journey',
    // Trigger: SubmissionReviewTool saves submissionSaved:true when user submits docs to NVC
    trigger: { type: 'metadata_key_exists', metadataKey: 'submissionSaved' },
    suppressWhen: { type: 'metadata_key_exists', metadataKey: 'dqDate' },
    delayDays: 0,
    priority: 'normal',
    channels: ['push'],
    title: 'Documents submitted — NVC review has begun',
    body: 'NVC has received your documents and review has started. This typically takes 2–5 months. Check your CEAC portal regularly for status updates and any requests from NVC.',
    actionLabel: 'Check CEAC Portal',
    actionUrl: 'https://ceac.state.gov/IV/Login.aspx',
  },

  {
    id: 'c2_s9_biweekly',
    group: 'c2_nvc_review',
    chapter: 2,
    kind: 'WAITING',
    origin: 'journey',
    // Trigger: same as c2_s9_start — submissionSaved key existing means docs are with NVC
    trigger: { type: 'metadata_key_exists', metadataKey: 'submissionSaved' },
    suppressWhen: { type: 'metadata_key_exists', metadataKey: 'dqDate' },
    delayDays: 14,
    recurring: { intervalDays: 14 },
    priority: 'normal',
    channels: ['push'],
    title: 'Check your CEAC portal for NVC updates',
    body: 'Log into your CEAC portal and check for any messages or status changes from NVC. If NVC marks your case as Documentarily Qualified (DQ), return here and record it in Step 10.',
    actionLabel: 'Open CEAC Portal',
    actionUrl: 'https://ceac.state.gov/IV/Login.aspx',
  },

  {
    id: 'c2_s9_day60',
    group: 'c2_nvc_review',
    chapter: 2,
    kind: 'WAITING',
    origin: 'journey',
    trigger: { type: 'metadata_key_exists', metadataKey: 'submissionSaved' },
    suppressWhen: { type: 'metadata_key_exists', metadataKey: 'dqDate' },
    delayDays: 60,
    priority: 'high',
    channels: ['push'],
    title: '60 days since docs submitted — still waiting?',
    body: 'Your documents have been with NVC for 60 days. This is within the normal range (60–150 days). Continue monitoring your CEAC portal. If NVC sends a request for additional information, respond promptly.',
    actionLabel: 'Open CEAC Portal',
    actionUrl: 'https://ceac.state.gov/IV/Login.aspx',
  },

  {
    id: 'c2_s9_day90',
    group: 'c2_nvc_review',
    chapter: 2,
    kind: 'WAITING',
    origin: 'journey',
    trigger: { type: 'metadata_key_exists', metadataKey: 'submissionSaved' },
    suppressWhen: { type: 'metadata_key_exists', metadataKey: 'dqDate' },
    delayDays: 90,
    priority: 'high',
    channels: ['push'],
    title: '90 days — NVC processing is taking longer than average',
    body: 'Your case has been at NVC for 90 days without a DQ determination. Some cases take up to 5–6 months depending on workload and case complexity. Keep checking CEAC weekly.',
    actionLabel: 'Open CEAC Portal',
    actionUrl: 'https://ceac.state.gov/IV/Login.aspx',
  },

  {
    id: 'c2_s9_day120',
    group: 'c2_nvc_review',
    chapter: 2,
    kind: 'WAITING',
    origin: 'journey',
    trigger: { type: 'metadata_key_exists', metadataKey: 'submissionSaved' },
    suppressWhen: { type: 'metadata_key_exists', metadataKey: 'dqDate' },
    delayDays: 120,
    priority: 'high',
    channels: ['push_and_email'],
    title: '4 months at NVC — consider checking with a representative',
    body: 'Your case has been at NVC for over 4 months. If you have a Congressional representative, some people contact their office for a status inquiry after 6 months. Continue monitoring CEAC.',
    actionLabel: 'Open CEAC Portal',
    actionUrl: 'https://ceac.state.gov/IV/Login.aspx',
  },

  {
    id: 'c2_dq_not_recorded',
    group: 'c2_dq_recording',
    chapter: 2,
    kind: 'ACTION',
    origin: 'journey',
    // Fires after docs submitted to NVC (submissionSaved) but DQ date not yet recorded.
    // This reminds user to go back and record DQ once NVC approves.
    trigger: { type: 'metadata_key_exists', metadataKey: 'submissionSaved' },
    suppressWhen: { type: 'metadata_key_exists', metadataKey: 'dqDate' },
    delayDays: 45,
    recurring: { intervalDays: 14, maxCount: 6 },
    priority: 'high',
    channels: ['push'],
    title: 'Record your DQ date — Step 10 is waiting',
    body: 'NVC has had your documents for over a month. Once they mark your case as Documentarily Qualified (DQ), go to Chapter 2 → Step 10 and record your DQ date to activate interview queue tracking.',
    actionLabel: 'Go to Step 10',
    actionUrl: '/visa-category/ir-category/ir1-journey',
  },

  {
    id: 'c2_scheduling_not_synced',
    group: 'c2_scheduling',
    chapter: 2,
    kind: 'ACTION',
    origin: 'journey',
    trigger: { type: 'metadata_key_exists', metadataKey: 'dqDate' },
    suppressWhen: { type: 'metadata_key_exists', metadataKey: 'currentSchedulingMonthYear' },
    delayDays: 7,
    recurring: { intervalDays: 14, maxCount: 6 },
    priority: 'normal',
    channels: ['push'],
    title: 'Sync embassy scheduling month for your interview estimate',
    body: 'Your DQ date is recorded. Go to Chapter 2 → Step 11 and sync the current embassy scheduling month from the official IV Status Tool. This activates your estimated interview window.',
    actionLabel: 'Go to Step 11',
    actionUrl: '/visa-category/ir-category/ir1-journey',
  },

  // ══════════════════════════════════════════════════════════
  // POST-DQ — Waiting for Interview Scheduling (Ch2 Step 11)
  // Fires after dqDate is set. Stops when interviewDate is set.
  // ══════════════════════════════════════════════════════════

  {
    id: 'c2_post_dq_passport_check',
    group: 'c2_interview_queue',
    chapter: 2,
    kind: 'ACTION',
    origin: 'journey',
    trigger: { type: 'metadata_key_exists', metadataKey: 'dqDate' },
    suppressWhen: { type: 'metadata_key_exists', metadataKey: 'interviewDate' },
    delayDays: 3,
    priority: 'high',
    channels: ['push'],
    title: 'Check your passport validity before your interview',
    body: 'Your case is DQ\'d and in the scheduling queue. Make sure your passport is valid for at least 6 months beyond your expected interview date. If it expires soon, renew it now — the embassy requires a valid passport on interview day.',
    actionLabel: 'Go to Step 11',
    actionUrl: '/visa-category/ir-category/ir1-journey',
  },

  {
    id: 'c2_post_dq_docs_organized',
    group: 'c2_interview_queue',
    chapter: 2,
    kind: 'ACTION',
    origin: 'journey',
    trigger: { type: 'metadata_key_exists', metadataKey: 'dqDate' },
    suppressWhen: { type: 'metadata_key_exists', metadataKey: 'interviewDate' },
    delayDays: 7,
    priority: 'normal',
    channels: ['push'],
    title: 'Use this waiting time — organize your original documents now',
    body: 'While you wait for your interview letter, gather and organize all original documents (birth certificates, marriage certificate, sponsor\'s financial docs, I-864). Having them ready early means zero last-minute panic.',
    actionLabel: 'View Document Checklist',
    actionUrl: '/visa-category/ir-category/ir1-journey',
  },

  {
    id: 'c2_post_dq_monthly_check',
    group: 'c2_interview_queue',
    chapter: 2,
    kind: 'WAITING',
    origin: 'journey',
    trigger: { type: 'metadata_key_exists', metadataKey: 'dqDate' },
    suppressWhen: { type: 'metadata_key_exists', metadataKey: 'interviewDate' },
    delayDays: 30,
    recurring: { intervalDays: 30 },
    priority: 'normal',
    channels: ['push'],
    title: 'Monthly check — any update on your interview date?',
    body: 'Check your email and CEAC portal for an interview appointment letter. Once you receive it, record your interview date in Chapter 2 → Step 12 to unlock Chapter 3 and your full preparation checklist.',
    actionLabel: 'Check CEAC Portal',
    actionUrl: 'https://ceac.state.gov/IV/Login.aspx',
  },

  {
    id: 'c2_post_dq_sponsor_docs',
    group: 'c2_interview_queue',
    chapter: 2,
    kind: 'ACTION',
    origin: 'journey',
    trigger: { type: 'metadata_key_exists', metadataKey: 'dqDate' },
    suppressWhen: { type: 'metadata_key_exists', metadataKey: 'interviewDate' },
    delayDays: 14,
    priority: 'normal',
    channels: ['push'],
    title: 'Ask your US sponsor to prepare fresh financial documents',
    body: 'Contact your US-based petitioner/sponsor now. They need recent tax returns, pay stubs, and a current I-864 Affidavit of Support ready for your interview. Financial documents more than 12 months old are usually not accepted.',
    actionLabel: 'Go to Step 11',
    actionUrl: '/visa-category/ir-category/ir1-journey',
  },

  // ══════════════════════════════════════════════════════════
  // CHAPTER 3 — Medical + Interview Prep
  // ══════════════════════════════════════════════════════════

  // ── Step 1: Schedule Medical Exam ─────────────────────────
  // Phase A: Interview date set but medicalDate not yet booked → urge booking

  {
    id: 'c3_s1_book_medical',
    group: 'c3_medical_booking',
    chapter: 3,
    kind: 'ACTION',
    origin: 'journey',
    trigger: { type: 'metadata_key_exists', metadataKey: 'interviewDate' },
    suppressWhen: { type: 'metadata_key_value', metadataKey: 'med_appt_saved', value: 'true' },
    delayDays: 0,
    recurring: { intervalDays: 5, maxCount: 5 },
    priority: 'critical',
    channels: ['push_and_email'],
    title: 'Book your medical exam — do this TODAY',
    body: 'Your interview is scheduled. Medical exam spots at approved panel physicians fill up very quickly — sometimes weeks out. Book immediately. The exam must be completed before your interview date.',
    actionLabel: 'Book Medical Exam',
    actionUrl: '/visa-category/ir-category/ir1-journey',
  },

  // Phase B: medicalDate confirmed → countdown reminders relative to the appointment
  // delayDays is NEGATIVE here = fire N days BEFORE the medical date

  {
    id: 'c3_s1_medical_14d_before',
    group: 'c3_medical_countdown',
    chapter: 3,
    kind: 'ACTION',
    origin: 'journey',
    trigger: { type: 'metadata_date_set', metadataKey: 'med_date' },
    suppressWhen: { type: 'never' },
    delayDays: -14,   // 14 days BEFORE the medical appointment
    priority: 'high',
    channels: ['push'],
    title: 'Medical exam in 14 days — start preparing',
    body: 'Your medical exam is in 2 weeks. Start gathering: original passport, 2 passport photos (35×45mm), polio vaccination certificate, COVID-19 vaccination record, and any existing medical records. Book fasting blood tests in the morning slot if possible.',
    actionLabel: 'View Medical Prep',
    actionUrl: '/visa-category/ir-category/ir1-journey',
  },

  {
    id: 'c3_s1_medical_7d_before',
    group: 'c3_medical_countdown',
    chapter: 3,
    kind: 'WAITING',
    origin: 'journey',
    trigger: { type: 'metadata_date_set', metadataKey: 'med_date' },
    suppressWhen: { type: 'never' },
    delayDays: -7,   // 7 days BEFORE
    priority: 'high',
    channels: ['push'],
    title: 'Medical exam in 7 days — confirm you have everything',
    body: 'One week to go. Confirm you have: ✓ Original passport ✓ 2 passport photos (35×45mm) ✓ Polio certificate ✓ Vaccination records ✓ Glasses/contact lens prescription if needed ✓ Payment for physician fee. Avoid alcohol 24 hours before.',
    actionLabel: 'View Checklist',
    actionUrl: '/visa-category/ir-category/ir1-journey',
  },

  {
    id: 'c3_s1_medical_3d_before',
    group: 'c3_medical_countdown',
    chapter: 3,
    kind: 'URGENT',
    origin: 'journey',
    trigger: { type: 'metadata_date_set', metadataKey: 'med_date' },
    suppressWhen: { type: 'never' },
    delayDays: -3,   // 3 days BEFORE
    priority: 'critical',
    channels: ['push_and_email'],
    title: 'Medical exam in 3 days — final checklist',
    body: 'Three days to go. Items to bring on the day: Original passport · 2 passport photos · Vaccination records (polio + COVID-19) · Glasses if worn · Any existing medical records · Physician fee. Fast for 8 hours before blood tests. Arrive 15 minutes early.',
    actionLabel: 'View Final Checklist',
    actionUrl: '/visa-category/ir-category/ir1-journey',
  },

  {
    id: 'c3_s1_medical_day_before',
    group: 'c3_medical_countdown',
    chapter: 3,
    kind: 'URGENT',
    origin: 'journey',
    trigger: { type: 'metadata_date_set', metadataKey: 'med_date' },
    suppressWhen: { type: 'never' },
    delayDays: -1,   // 1 day BEFORE (the evening before)
    priority: 'critical',
    channels: ['push_and_email'],
    title: 'Medical exam is TOMORROW — are you ready?',
    body: 'Your medical exam is tomorrow. Pack your bag tonight: passport + photos + vaccination records + glasses + medical records + fee. Set an alarm. Fast from midnight if blood tests are included. Sleep well.',
    actionLabel: 'View Final Checklist',
    actionUrl: '/visa-category/ir-category/ir1-journey',
  },

  // ── Step 2: Polio Vaccination Certificate ─────────────────

  {
    id: 'c3_s2_polio_cert',
    group: 'c3_polio',
    chapter: 3,
    kind: 'ACTION',
    origin: 'journey',
    trigger: { type: 'metadata_key_exists', metadataKey: 'interviewDate' },
    // PolioCertificateTool saves polio_launched:'true' when guide is completed — no step mark
    suppressWhen: { type: 'metadata_key_value', metadataKey: 'polio_launched', value: 'true' },
    delayDays: 0,
    recurring: { intervalDays: 7, maxCount: 4 },
    priority: 'high',
    channels: ['push'],
    title: 'Get your Polio Vaccination Certificate — required for Pakistan',
    body: 'Pakistan applicants must obtain a polio vaccination certificate before the medical exam. Visit a government vaccination post or WHO-approved site. Take the original certificate to your medical exam appointment.',
    actionLabel: 'Go to Step 2',
    actionUrl: '/visa-category/ir-category/ir1-journey',
  },

  // ── Step 3: Police Clearance Certificate ──────────────────

  {
    id: 'c3_s3_apply_pcc',
    group: 'c3_pcc',
    chapter: 3,
    kind: 'ACTION',
    origin: 'journey',
    trigger: { type: 'metadata_key_exists', metadataKey: 'interviewDate' },
    // PoliceClearanceTool saves pcc_saved:'true' when tracking info is saved — no step mark
    suppressWhen: { type: 'metadata_key_value', metadataKey: 'pcc_saved', value: 'true' },
    delayDays: 0,
    recurring: { intervalDays: 5, maxCount: 4 },
    priority: 'critical',
    channels: ['push_and_email'],
    title: 'Apply for Police Clearance Certificate NOW — can take 2 weeks',
    body: 'A fresh PCC is required for your interview. Apply immediately at your nearest Police Khidmat Markaz or through Rahvana\'s Sindh service. PCCs can take 3–14 days. Do not leave this for the last minute.',
    actionLabel: 'Apply for PCC',
    actionUrl: '/visa-category/ir-category/ir1-journey',
  },

  {
    id: 'c3_s3_pcc_followup',
    group: 'c3_pcc',
    chapter: 3,
    kind: 'WAITING',
    origin: 'journey',
    // Trigger: fires when PCC application is saved (pcc_saved = 'true')
    trigger: { type: 'metadata_key_value', metadataKey: 'pcc_saved', value: 'true' },
    // Suppress: when PCC is received (pcc_received = 'true') via 'Mark as Received' button
    suppressWhen: { type: 'metadata_key_value', metadataKey: 'pcc_received', value: 'true' },
    delayDays: 7,
    recurring: { intervalDays: 7, maxCount: 6 },
    priority: 'high',
    channels: ['push'],
    title: 'PCC status — have you received it yet?',
    body: 'Check the status of your Police Clearance Certificate. If not received yet, follow up with the issuing authority. The original PCC is mandatory — do not attend the interview without it.',
    actionLabel: 'Update PCC Status',
    actionUrl: '/visa-category/ir-category/ir1-journey',
  },

  // ── Step 4: Gather Original Documents ─────────────────────

  {
    id: 'c3_s4_gather_docs_start',
    group: 'c3_documents',
    chapter: 3,
    kind: 'ACTION',
    origin: 'journey',
    trigger: { type: 'metadata_key_exists', metadataKey: 'interviewDate' },
    suppressWhen: { type: 'step_completed', stepKey: 'step_3_4' },
    delayDays: 2,
    priority: 'high',
    channels: ['push'],
    title: 'Start gathering your original documents now',
    body: 'Open Chapter 3 → Step 4 and go through the full document checklist. Collect originals for: passport, civil documents (birth/marriage certificates), sponsor\'s I-864 + financial docs, DS-260 confirmation, and NVC letter. Make 2 copies of each.',
    actionLabel: 'Open Document Checklist',
    actionUrl: '/visa-category/ir-category/ir1-journey',
  },

  {
    id: 'c3_s4_docs_7d_before',
    group: 'c3_documents',
    chapter: 3,
    kind: 'URGENT',
    origin: 'journey',
    trigger: { type: 'metadata_date_set', metadataKey: 'interviewDate' },
    suppressWhen: { type: 'step_completed', stepKey: 'step_3_4' },
    delayDays: -7,
    priority: 'critical',
    channels: ['push_and_email'],
    title: '7 days to interview — confirm ALL documents are in hand',
    body: 'Final document check: ✓ Original passport  ✓ Birth certificate (original + copy)  ✓ Marriage certificate if applicable  ✓ I-864 Affidavit of Support  ✓ Sponsor tax returns + pay stubs  ✓ DS-260 confirmation page  ✓ NVC appointment letter  ✓ Medical exam results  ✓ PCC original  ✓ Passport photos (35×45mm). Mark Step 4 done once everything is confirmed.',
    actionLabel: 'Confirm Documents Ready',
    actionUrl: '/visa-category/ir-category/ir1-journey',
  },

  // ══════════════════════════════════════════════════════════
  // CHAPTER 3 — Journey Lock Warnings (post-interview outcome)
  // Fires when ceacIssuedAt is set (approved OR 221g).
  // Journey auto-locks 14 days after outcome is recorded.
  // ══════════════════════════════════════════════════════════

  {
    id: 'c3_journey_lock_notice',
    group: 'c3_journey_lock',
    chapter: 3,
    kind: 'ACTION',
    origin: 'journey',
    trigger: { type: 'metadata_key_exists', metadataKey: 'ceacIssuedAt' },
    suppressWhen: { type: 'never' },
    delayDays: 0,
    priority: 'high',
    channels: ['push'],
    title: 'Your journey will be locked in 14 days',
    body: 'Your CEAC status has been marked as Issued. This journey will automatically enter read-only mode in 14 days. Complete any remaining steps before then — no edits will be possible once it is locked.',
    actionLabel: 'View Roadmap',
    actionUrl: '/visa-category/ir-category/ir1-journey',
  },

  {
    id: 'c3_journey_lock_3d',
    group: 'c3_journey_lock',
    chapter: 3,
    kind: 'URGENT',
    origin: 'journey',
    trigger: { type: 'metadata_key_exists', metadataKey: 'ceacIssuedAt' },
    suppressWhen: { type: 'never' },
    delayDays: 11,
    priority: 'critical',
    channels: ['push_and_email'],
    title: 'Journey locks in 3 days — complete any pending steps',
    body: 'Your journey will enter read-only mode in 3 days. After that, no edits or step completions will be possible. Review your roadmap now and finish any outstanding items before the deadline.',
    actionLabel: 'Review Roadmap',
    actionUrl: '/visa-category/ir-category/ir1-journey',
  },

  {
    id: 'c3_journey_lock_1d',
    group: 'c3_journey_lock',
    chapter: 3,
    kind: 'URGENT',
    origin: 'journey',
    trigger: { type: 'metadata_key_exists', metadataKey: 'ceacIssuedAt' },
    suppressWhen: { type: 'never' },
    delayDays: 13,
    priority: 'critical',
    channels: ['push_and_email'],
    title: 'Journey locks TOMORROW',
    body: 'This is your final reminder. Your journey will enter read-only mode tomorrow. Complete any remaining steps today — no changes will be possible after it is locked.',
    actionLabel: 'Complete Remaining Steps',
    actionUrl: '/visa-category/ir-category/ir1-journey',
  },

]

// ─────────────────────────────────────────────────────────────
// LOOKUP HELPERS
// ─────────────────────────────────────────────────────────────

/** All reminders triggered by a specific step completion */
export function getRemindersForStep(stepKey: string): JourneyReminderDef[] {
  return REMINDER_REGISTRY.filter(
    (r) => r.trigger.type === 'step_completed' && r.trigger.stepKey === stepKey
  )
}

/** All reminders triggered by a metadata key appearing or a date metadata key */
export function getRemindersForMetadataKey(metadataKey: string): JourneyReminderDef[] {
  return REMINDER_REGISTRY.filter(
    (r) =>
      (r.trigger.type === 'metadata_key_exists' && (r.trigger as any).metadataKey === metadataKey) ||
      (r.trigger.type === 'metadata_date_set' && (r.trigger as any).metadataKey === metadataKey)
  )
}

/** Get reminder by ID */
export function getReminderById(id: string): JourneyReminderDef | undefined {
  return REMINDER_REGISTRY.find((r) => r.id === id)
}

/** All step keys that have reminders */
export const ALL_TRIGGER_STEP_KEYS = [
  ...new Set(
    REMINDER_REGISTRY
      .filter((r) => r.trigger.type === 'step_completed')
      .map((r) => (r.trigger as { type: 'step_completed'; stepKey: string }).stepKey)
  ),
]

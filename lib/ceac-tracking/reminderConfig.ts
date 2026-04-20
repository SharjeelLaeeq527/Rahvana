// ============================================================
// lib/ceac-tracking/reminderConfig.ts
// All 13 CEAC status reminders — typed, immutable config.
//
// These are pure data — no DB calls, no side effects.
// CeacReminderEngine reads this config to know what to schedule.
// ============================================================

import type { ReminderConfig } from './types'

// ─────────────────────────────────────────────────────────────
// GROUP 1 — Status: "In Transit"
// Fires when user reports their CEAC status changed to In Transit.
// Brief status — hours to days. One immediate + one 3-day follow-up.
// ─────────────────────────────────────────────────────────────

export const REMINDERS: ReminderConfig[] = [

  {
    // REMINDER 1 — fires immediately when In Transit is entered
    id: 'status_in_transit',
    kind: 'ACTION',
    triggerStatus: 'in_transit',
    triggerGroup: 'in_transit',
    title: 'Case is on its way to the embassy',
    message:
      'Your case has left NVC and is being transferred to the U.S. Embassy or consulate. ' +
      'This status is usually brief — hours to a few days. ' +
      'Watch for your CEAC status to change to Ready. No action needed right now.',
    channel: 'push',
    recurring: false,
    delayDays: 0,          // immediate on status entry
    suppressIf: 'User enters any status other than In Transit',
  },

  {
    // REMINDER 2 — fires 3 days after In Transit was entered
    // Only if user has NOT yet moved to Ready or later
    id: 'in_transit_followup',
    kind: 'FOLLOW-UP',
    triggerStatus: 'in_transit',
    triggerGroup: 'in_transit',
    title: 'Check your CEAC status — may have changed to Ready',
    message:
      'Your case has been In Transit for 3 days. ' +
      'Log into the CEAC public status tool and check if your status has updated to Ready. ' +
      'If it has, update your status in Rahvana so your reminders stay accurate.',
    channel: 'push',
    recurring: false,
    delayDays: 3,          // 3 days after status entry
    suppressIf: 'User has already entered Ready or any later status',
  },

  // ─────────────────────────────────────────────────────────
  // GROUP 2 — Status: "Ready"
  // Embassy has the file. Interview is approaching.
  // One immediate (URGENT, push+email) + recurring every 14 days.
  // ─────────────────────────────────────────────────────────

  {
    // REMINDER 3 — immediate, URGENT
    id: 'status_ready',
    kind: 'URGENT',
    triggerStatus: 'ready',
    triggerGroup: 'ready',
    title: 'Status is Ready — your interview is coming',
    message:
      "Your case has arrived at the embassy. 'Ready' means the consular post has your file " +
      'and is proceeding toward your interview. ' +
      "Watch for your interview appointment letter if you haven't received it yet.",
    channel: 'push_and_email',
    recurring: false,
    delayDays: 0,
    suppressIf: 'User enters any post-interview status (AP, Issued, Refused)',
  },

  {
    // REMINDER 4 — recurring every 14 days while still in Ready
    id: 'ready_check_ceac',
    kind: 'WAITING',
    triggerStatus: 'ready',
    triggerGroup: 'ready',
    title: 'Check your CEAC status for updates',
    message:
      'Your case is Ready at the embassy. Check the CEAC public status tool every 1–2 weeks. ' +
      'When your status changes to Administrative Processing, Issued, or Refused after your interview — ' +
      'update it in Rahvana immediately.',
    channel: 'push',
    recurring: { intervalDays: 14 },
    delayDays: 14,         // first occurrence: 14 days after Ready entered
    suppressIf: 'User enters any post-interview status (AP, Issued, Refused)',
  },

  // ─────────────────────────────────────────────────────────
  // GROUP 3 — Status: "Administrative Processing" (AP)
  // Post-interview. One immediate explanation + bi-weekly checks + 60-day nudge.
  // ─────────────────────────────────────────────────────────

  {
    // REMINDER 5 — immediate explanation (many users panic at AP)
    id: 'status_ap_explanation',
    kind: 'ACTION',
    triggerStatus: 'ap',
    triggerGroup: 'ap',
    title: 'Administrative Processing — what this means',
    message:
      'AP is not a refusal. It means the consulate needs more time — usually for security checks ' +
      'or background review. Most AP cases result in visa issuance. ' +
      'Do NOT contact the embassy repeatedly. Check CEAC weekly and monitor your registered email.',
    channel: 'push_and_email',
    recurring: false,
    delayDays: 0,
    suppressIf: 'User enters Issued or Refused',
  },

  {
    // REMINDER 6 — recurring bi-weekly CEAC check while in AP
    id: 'ap_biweekly_check',
    kind: 'WAITING',
    triggerStatus: 'ap',
    triggerGroup: 'ap',
    title: 'AP check-in — log into CEAC and check for updates',
    message:
      'Log into the CEAC public status tool and check if your status has changed. ' +
      'If it shows Issued, your visa is ready. ' +
      'If it still shows Administrative Processing, no action needed yet — ' +
      'update Rahvana if anything changes.',
    channel: 'push',
    recurring: { intervalDays: 14 },
    delayDays: 14,         // first: 14 days after AP entered
    suppressIf: 'User enters Issued or Refused',
  },

  {
    // REMINDER 7 — one-shot nudge at day 60 if still in AP
    id: 'ap_60_day_nudge',
    kind: 'WAITING',
    triggerStatus: 'ap',
    triggerGroup: 'ap',
    title: 'AP has been 60+ days — consider consulting an attorney',
    message:
      'Your case has been in Administrative Processing for over 60 days with no update. ' +
      'While this is not uncommon, if you haven\'t already, consider consulting an immigration ' +
      'attorney about your options.',
    channel: 'push',
    recurring: false,
    delayDays: 60,         // fires once at day 60
    suppressIf: 'User enters Issued or Refused before day 60',
  },

  // ─────────────────────────────────────────────────────────
  // GROUP 4 — Status: "Issued"
  // Visa approved. Immediate URGENT + 2-day courier follow-up.
  // ─────────────────────────────────────────────────────────

  {
    // REMINDER 8 — immediate, URGENT: go track your courier NOW
    id: 'status_issued',
    kind: 'URGENT',
    triggerStatus: 'issued',
    triggerGroup: 'issued',
    title: 'Visa Issued — track your courier delivery now',
    message:
      'Congratulations — your visa has been approved and is being processed for delivery. ' +
      'Log into your USVisaScheduling courier account and track your shipment. ' +
      'Confirm your delivery address is correct.',
    channel: 'push_and_email',
    recurring: false,
    delayDays: 0,
    suppressIf: 'none',
  },

  {
    // REMINDER 9 — 2-day follow-up: have you received your passport?
    id: 'issued_courier_followup',
    kind: 'FOLLOW-UP',
    triggerStatus: 'issued',
    triggerGroup: 'issued',
    title: 'Have you received your passport with the visa?',
    message:
      'Your visa was issued 2 days ago. Check your courier tracking in USVisaScheduling for a ' +
      'delivery update. If there is a problem with delivery, contact the courier service directly.',
    channel: 'push',
    recurring: false,
    delayDays: 2,          // 2 days after Issued entered
    suppressIf: 'User marks passport received',
  },

  // ─────────────────────────────────────────────────────────
  // GROUP 5 — Status: "Refused"
  // IMPORTANT: Do NOT auto-assume 221(g) or final denial.
  // Reminder 10 fires immediately for ALL refusals.
  // Reminders 11, 12, 13 fire ONLY after user clarifies sub-type.
  // ─────────────────────────────────────────────────────────

  {
    // REMINDER 10 — immediate, URGENT: clarify which type of refusal
    id: 'status_refused_guidance',
    kind: 'URGENT',
    triggerStatus: 'refused',
    triggerGroup: 'refused',
    title: 'Refused — read your written notice carefully',
    message:
      "A 'Refused' CEAC status covers two very different situations: " +
      '(1) a 221(g) temporary refusal asking for more documents — your case is still active, or ' +
      '(2) a final denial under a specific ground of ineligibility. ' +
      'The CEAC status alone does NOT tell you which one. ' +
      'Read the written notice from the consular officer carefully. ' +
      'It specifies which situation applies to you.',
    channel: 'push_and_email',
    recurring: false,
    delayDays: 0,
    suppressIf: 'none',
    // No requiresRefusedSubType — fires for ALL refusals before clarification
  },

  {
    // REMINDER 11 — only after user confirms 221(g)
    // ACTION: submit the requested documents now
    id: 'refused_221g_path',
    kind: 'ACTION',
    triggerStatus: 'refused',
    triggerGroup: 'refused',
    title: '221(g) — submit the requested documents promptly',
    message:
      'Your 221(g) refusal is a request for additional documents or information, not a final denial. ' +
      'Submit exactly what the officer requested, following the written instructions. ' +
      'After submission, monitor CEAC — your status may update to Issued once the post completes review.',
    channel: 'push',
    recurring: false,
    delayDays: 0,          // fires immediately once sub-type confirmed
    suppressIf: 'User enters Issued or marks case closed',
    requiresRefusedSubType: 'refusal_221g',
  },

  {
    // REMINDER 12 — recurring every 21 days AFTER 221(g) docs submitted
    // Trigger point: docs_221g_submitted_at (not status_entered_at)
    id: 'refused_221g_followup',
    kind: 'WAITING',
    triggerStatus: 'refused',
    triggerGroup: 'refused',
    title: '221(g) follow-up — check CEAC for status update',
    message:
      'Log into the CEAC public status tool and check if your status has changed from Refused to Issued. ' +
      'If the status is still Refused and it has been more than 60 days since you submitted the ' +
      'requested documents, consider contacting the embassy or consulting an immigration attorney.',
    channel: 'push',
    recurring: { intervalDays: 21 },
    delayDays: 21,         // first: 21 days after docs submitted
    suppressIf: 'User enters Issued or marks case closed',
    requiresRefusedSubType: 'refusal_221g',
    // Note: fire_at is calculated from docs_221g_submitted_at, not status_entered_at
  },

  {
    // REMINDER 13 — only after user confirms final denial (not 221g)
    // Serious outcome — consult attorney
    id: 'refused_final_consult',
    kind: 'ACTION',
    triggerStatus: 'refused',
    triggerGroup: 'refused',
    title: 'Final refusal — consult an immigration attorney',
    message:
      'A final refusal under a specific ground of ineligibility (e.g., INA §212) is a serious outcome. ' +
      'Waivers (such as I-601) may be available depending on the ground cited. ' +
      'Consult a licensed immigration attorney before taking any next steps.',
    channel: 'push_and_email',
    recurring: false,
    delayDays: 0,          // fires immediately once final denial confirmed
    suppressIf: 'none',
    requiresRefusedSubType: 'refusal_final',
  },

]

// ─────────────────────────────────────────────────────────────
// LOOKUP HELPERS
// ─────────────────────────────────────────────────────────────

/** Get all reminders for a given trigger status */
export function getRemindersForStatus(status: string): ReminderConfig[] {
  return REMINDERS.filter(r => r.triggerStatus === status)
}

/** Get a single reminder by ID */
export function getReminderById(id: string): ReminderConfig | undefined {
  return REMINDERS.find(r => r.id === id)
}

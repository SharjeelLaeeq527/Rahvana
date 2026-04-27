/**
 * Maps each step_key to the primary entitlement feature that is most visibly
 * locked for a given step. Used by ChapterView (step card lock badges) and
 * StepView (locked content banner).
 *
 * Mapping logic:
 *  - Steps whose main value is a guide         → 'step_guides'
 *  - Steps whose main value is tracking        → 'tracker_reminders'
 *  - Steps whose main value is a specific tool → that tool's feature key
 *  - Steps that are fully accessible for Basic → null
 */
export const STEP_PRIMARY_FEATURE: Record<string, string | null> = {

  // ── Chapter 1 ──────────────────────────────────────────────────────────────
  step_1_1:  null,                 // Determine Eligibility — always accessible
  step_1_2:  'step_guides',        // Gather Documents — list visible; guides/upload locked
  step_1_3:  null,                 // Review Filing Methods — info step, accessible
  step_1_4:  'smart_form_filler',  // Fill Form I-130 — Smart Form Filler locked (buy or upgrade)
  step_1_5:  'smart_form_filler',  // Fill Form I-130A
  step_1_6:  'step_guides',        // Create USCIS Account — guide locked; credential save OK
  step_1_7:  'step_guides',        // Start Form I-130 on USCIS (online)
  step_1_8:  'step_guides',        // Upload Forms & Evidence (online)
  step_1_9:  'step_guides',        // Pay Filing Fee (online)
  step_1_10: 'step_guides',        // Review & Submit (online)
  step_1_11: 'step_guides',        // Print Hard Copies (paper)
  step_1_12: 'step_guides',        // Prepare Filing Fee (paper)
  step_1_13: 'step_guides',        // Assemble Filing Packet (paper)
  step_1_14: 'step_guides',        // Mail Packet & Track Delivery (paper)
  step_1_15: 'tracker_reminders',  // Register Receipt — save works; tracking locked
  step_1_16: 'tracker_reminders',  // Track Case Status — entire tracking step locked
  step_1_17: 'document_vault',     // Receive Approval Notice — manual save OK; upload locked

  // ── Chapter 2 ──────────────────────────────────────────────────────────────
  step_2_1:  'step_guides',        // Access CEAC Case — guide locked; credential save OK
  step_2_2:  'step_guides',        // Pay NVC Fees — guide locked; status save OK
  step_2_3:  'step_guides',        // Complete Form DS-260
  step_2_4:  'step_guides',        // Prepare Civil Documents — list visible; guides/upload locked
  step_2_5:  'step_guides',        // Affidavit of Support — guide + sponsorship calc locked
  step_2_6:  'sponsorship_calc',   // Gather Financial Docs — entire step locked; calc add-on unlocks list
  step_2_7:  'step_guides',        // Household Member / Joint Sponsor
  step_2_8:  'step_guides',        // Review & Submit to NVC — guide locked; credential save OK
  step_2_9:  null,                 // Awaiting NVC Review — passive wait step
  step_2_10: 'tracker_reminders',  // Record DQ — save DQ date OK; tracking locked
  step_2_11: null,                 // Waiting for Scheduling — passive
  step_2_12: 'tracker_reminders',  // Interview Appointment — save OK; tracking/reminders locked

  // ── Chapter 3 ──────────────────────────────────────────────────────────────
  step_3_1:  'medical_booking',    // Schedule Medical — guide + booking service locked
  step_3_2:  'polio_certificate',   // Obtain Polio Certificate — locked for Basic AND Premium (executive-only)
  step_3_3:  'step_guides',        // Obtain PCC — guide locked
  step_3_4:  'step_guides',        // Attend Medical Exam — guide locked
  step_3_5:  'step_guides',        // Courier Registration — guide locked; credential save OK
  step_3_6:  'step_guides',        // Gather Original Documents
  step_3_7:  'step_guides',        // Prepare for Interview — guide locked
  step_3_8:  'step_guides',        // Attend Visa Interview — interview day guide locked
  step_3_9:  null,                 // Confirm Interview Outcome — always accessible
  step_3_10: 'tracker_reminders',  // Track Visa Issuance — tracking locked
  step_3_11: 'action_221g',        // Respond to 221(g) — Action Planner locked (Basic + Premium)
  step_3_12: 'action_221g',        // Track Post-Interview Review
  step_3_13: 'tracker_reminders',  // Monitor Case Status — tracking locked
};
// ============================================================
// lib/ceac-tracking/stateMachine.ts
// CEAC status state machine — valid transitions + group ordering.
//
// Valid progression:
//   at_nvc → in_transit → ready → ap | issued | refused
//   refused (221g) → issued           (possible recovery path)
//   refused (final) → [terminal]
//
// Tracking is INACTIVE while status = at_nvc.
// Engine only schedules reminders once status moves past at_nvc.
// ============================================================

import type { CeacStatus, TriggerGroup } from './types'

// ─────────────────────────────────────────────────────────────
// VALID TRANSITIONS
// Key = current status, Value = set of allowed next statuses.
// "Any forward jump is allowed" — e.g. at_nvc → ready is valid
// if the user simply didn't report in_transit.
// ─────────────────────────────────────────────────────────────

export const VALID_TRANSITIONS: Record<CeacStatus, CeacStatus[]> = {
  // NVC stage — tracking not started yet
  at_nvc:     ['in_transit', 'ready'],        // can jump straight to ready

  // Case heading to embassy
  in_transit: ['ready'],

  // Embassy has file — interview upcoming
  ready:      ['ap', 'issued', 'refused'],

  // Post-interview outcomes (3 parallel terminal-ish states)
  ap:         ['issued', 'refused'],           // AP can resolve to issued or refused
  issued:     [],                              // terminal (passport_received flag handles sub-state)
  refused:    ['issued'],                      // 221(g) path can resolve to issued
}

// ─────────────────────────────────────────────────────────────
// PROGRESSION ORDER
// Lower number = earlier in the journey.
// Used by suppressionEngine to cancel reminders from earlier groups
// when user advances to a later status.
// ─────────────────────────────────────────────────────────────

export const STATUS_ORDER: Record<CeacStatus, number> = {
  at_nvc:     0,
  in_transit: 1,
  ready:      2,
  ap:         3,
  issued:     4,
  refused:    4,  // parallel with issued — both are post-interview
}

// ─────────────────────────────────────────────────────────────
// POST-INTERVIEW STATUSES
// Used for suppression of 'ready' group reminders
// ─────────────────────────────────────────────────────────────

export const POST_INTERVIEW_STATUSES: CeacStatus[] = ['ap', 'issued', 'refused']

// ─────────────────────────────────────────────────────────────
// GROUP → STATUSES THAT SUPPRESS IT
// When user enters any of these statuses, cancel ALL reminders
// from the listed group.
// ─────────────────────────────────────────────────────────────

export const SUPPRESSION_MAP: Record<TriggerGroup, CeacStatus[]> = {
  // Any status after in_transit cancels in_transit reminders
  in_transit: ['ready', 'ap', 'issued', 'refused'],

  // Any post-interview status cancels ready reminders
  ready:      ['ap', 'issued', 'refused'],

  // Issued or refused cancels ap reminders
  ap:         ['issued', 'refused'],

  // Nothing cancels issued reminders (except passport_received flag for reminder 9)
  issued:     [],

  // Issued or case_closed cancels refused reminders (handled specially in engine)
  refused:    ['issued'],
}

// ─────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────

/**
 * Returns true if the transition from previousStatus → newStatus is valid.
 * Also accepts null previousStatus (first time setting status from at_nvc).
 */
export function isValidTransition(
  previousStatus: CeacStatus | null,
  newStatus: CeacStatus
): boolean {
  if (previousStatus === null || previousStatus === 'at_nvc') {
    // First real status entry — anything except at_nvc itself is valid
    return newStatus !== 'at_nvc'
  }
  if (previousStatus === newStatus) return false  // no-op
  return VALID_TRANSITIONS[previousStatus]?.includes(newStatus) ?? false
}

/**
 * Returns true if newStatus is LATER than previousStatus
 * (i.e., user has advanced in the journey).
 * Used to determine which reminder groups to cancel.
 */
export function isForwardProgress(
  previousStatus: CeacStatus,
  newStatus: CeacStatus
): boolean {
  return STATUS_ORDER[newStatus] > STATUS_ORDER[previousStatus]
}

/**
 * Returns all trigger groups whose reminders should be cancelled
 * when user enters newStatus.
 */
export function getGroupsToCancel(newStatus: CeacStatus): TriggerGroup[] {
  const groupsToCancel: TriggerGroup[] = []
  const entries = Object.entries(SUPPRESSION_MAP) as [TriggerGroup, CeacStatus[]][]
  for (const [group, suppressingStatuses] of entries) {
    if (suppressingStatuses.includes(newStatus)) {
      groupsToCancel.push(group)
    }
  }
  return groupsToCancel
}

/**
 * Whether tracking is active for this status.
 * at_nvc = NVC internal sub-stages, we skip entirely.
 */
export function isTrackingActive(status: CeacStatus): boolean {
  return status !== 'at_nvc'
}

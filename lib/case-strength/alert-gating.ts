/**
 * Progressive alert gating + engagement gate for the case-strength dashboard.
 *
 * Two problems this solves, both grounded in standard UX practice:
 *
 * 1. Progressive disclosure of alerts.
 *    `aggregateChapter1/2/3Issues` + consistency findings produce EVERY step's
 *    alerts at once, so a user still on Chapter 1 (I-130) sees Chapter 3
 *    (medical / interview / 221g) warnings on day one — confusing and
 *    un-actionable. `gateAlertIssues` filters that flat list against the user's
 *    journey position (the "frontier" = first uncompleted active step), with a
 *    curated look-ahead exception for deadline-driven items worth planning one
 *    chapter early. (Progressive disclosure: reveal complexity as the user
 *    advances, don't front-load it.)
 *
 * 2. No fabricated case-health before there is data.
 *    A readiness score computed from a nearly-empty case is "false precision":
 *    showing 55/100 with "10 critical" the moment the user arrives is
 *    misleading. `isMeaningfullyStarted` lets the dashboard render an empty
 *    state until the user has produced enough signal to assess. (NN/g empty
 *    states + confidence-under-incomplete-data.)
 *
 * See CASE_STRENGTH_ALERT_PLAN.md for the full schedule and rationale.
 *
 * This module is pure: it depends on no app/UI code. Callers compute the
 * active-step order and frontier with their own journeyHelpers (v2 or v3) and
 * pass them in, so the same gate serves every dashboard version.
 *
 * Phase 1 (ships now): pure progress gating — AHEAD hidden, ACTIVE/BEHIND shown,
 * look-ahead allowlist, plus the engagement gate. Per-step timestamps don't
 * exist client-side yet, so the time thresholds below stay inert until Phase 2
 * passes `startedAt` / `completedAt`. Written time-ready so Phase 2 is a data
 * change, not a rewrite.
 */

import type { AggregatedIssue } from "./aggregate-issues";

/**
 * Timing knobs (days). Tunable in one place. Only take effect once Phase 2
 * supplies the corresponding timestamp maps in `GateContext`.
 */
export const ALERT_TIMING = {
  /** Current-step warning waits this many days before surfacing. */
  activeWarningGraceDays: 3,
  /** A passed step's leftover warning surfaces this many days after completion. */
  behindWarningShowDays: 7,
  /** …and escalates to critical (case-strength note) after this many days. */
  behindWarningEscalateDays: 21,
  /** Recurring nudge cadence for unresolved behind-deficiencies (Phase 2 push). */
  recurringNudgeDays: 14,
  /** Cap on recurring nudges so the dashboard never spams. */
  recurringNudgeMax: 3,
  /** A look-ahead item may appear this many chapters before its own chapter. */
  lookAheadChapters: 1,
} as const;

const DAY_MS = 86_400_000;

function daysSince(fromMs: number, nowMs: number): number {
  return Math.floor((nowMs - fromMs) / DAY_MS);
}

function daysUntil(toMs: number, nowMs: number): number {
  return Math.ceil((toMs - nowMs) / DAY_MS);
}

// ─── Document-checklist escalation (§4–§5) ───────────────────────────────────
//
// Missing required documents should NOT jump straight to red "critical" the
// moment the user reaches the gathering step — at that stage, missing documents
// are normal. Instead they move through three calm-to-urgent stages:
//   to-do (info, calm) → due-soon (warning, amber) → critical (red, blocking).
//
// Two drivers, in priority order (user decision 2026-07-20):
//   1. DEADLINE-RELATIVE — how close the target filing date is. Preferred
//      whenever a target date is known, because every user works at a different
//      speed; a fixed "day 21 = red" is meaningless for someone deliberately
//      slow whose real filing target is still months away.
//   2. FIXED-DAYS FALLBACK — used only when no target date is known: calm for
//      `todoDays`, amber until `criticalDays`, red at `criticalDays`+.
//
// This is OPT-IN per category. A `CaseStrengthProfile` with no
// `documentEscalation` keeps the legacy instant-critical behavior (IR-1); IR-5
// opts in. All thresholds live here so they can be tuned in one place.

export interface DocumentEscalationConfig {
  /** Fixed fallback: days a new missing doc stays calm (to-do) on its step. */
  todoDays: number;
  /** Fixed fallback: day it turns red (critical) if still missing. */
  criticalDays: number;
  /** Deadline-relative: days-to-filing at/under which a missing doc is critical. */
  filingCriticalDays: number;
  /** Deadline-relative: days-to-filing at/under which a missing doc is due-soon. */
  filingDueSoonDays: number;
}

/** Sensible defaults matching §5 of the plan. */
export const DEFAULT_DOCUMENT_ESCALATION: DocumentEscalationConfig = {
  todoDays: 7,
  criticalDays: 21,
  filingCriticalDays: 7,
  filingDueSoonDays: 30,
};

type DocStage = "info" | "warning" | "critical";

/**
 * Pure stage computation for a missing document. Deadline-relative when
 * `daysUntilFiling` is provided, otherwise the fixed-days fallback. `isBehind`
 * = the user has already passed the step this document belongs to.
 */
export function computeDocumentStage(params: {
  daysOnStep: number;
  daysUntilFiling: number | null;
  isBehind: boolean;
  cfg: DocumentEscalationConfig;
}): DocStage {
  const { daysOnStep, daysUntilFiling, isBehind, cfg } = params;

  // 1. Deadline-relative (preferred when we know the target filing date).
  if (daysUntilFiling !== null) {
    if (daysUntilFiling <= cfg.filingCriticalDays) return "critical";
    if (daysUntilFiling <= cfg.filingDueSoonDays) return "warning";
    // Far from filing: calm — unless the user already moved past the step.
    return isBehind ? "warning" : "info";
  }

  // 2. Fixed-days fallback.
  if (isBehind) {
    // Passed the gathering step with the doc still missing → at least amber,
    // red once it's been outstanding as long as the fixed critical window.
    return daysOnStep >= cfg.criticalDays ? "critical" : "warning";
  }
  if (daysOnStep >= cfg.criticalDays) return "critical";
  if (daysOnStep >= cfg.todoDays) return "warning";
  return "info";
}

// ─── Engagement gate (empty-state) ───────────────────────────────────────────
//
// Case-health is only meaningful once the user has actually progressed through
// the journey. Below that, the dashboard shows a "not started" empty state
// instead of a fabricated score.
//
// The signal is deliberately the STRICTEST unambiguous one — at least one
// completed step. Softer signals (an eligibility draft, an auto-merged profile
// field, or a stray document in the vault) do NOT count: the wizard hydrates
// `metadata` from case_data + profile autofill on load, so a truly-fresh journey
// already has non-empty metadata. Keying "started" off completion avoids those
// false positives and matches the user's mental model ("completed a step = started").

export interface EngagementInput {
  /** Number of completed steps (state.completedSteps.size). */
  completedCount: number;
}

export function isMeaningfullyStarted(input: EngagementInput): boolean {
  return input.completedCount > 0;
}

// ─── Case-health score gate (evidence-aware) ─────────────────────────────────
//
// The case-health SCORE is evidence-derived (evidence coverage + consistency).
// `isMeaningfullyStarted` is the right gate for the ALERT stream (one completed
// step = the user has engaged), but it is too loose for the numeric score:
// completing a checklist step produces no evidence, so an empty evidence set
// defaults to ~0 and the ring lands on a misleading ~50% the moment step 1 is
// done. The score must therefore additionally require a real evidence signal —
// an uploaded document or an answered evidence question — before it shows a
// number instead of the neutral "gathering info" state. Visa-agnostic: the
// caller decides what counts as evidence signal for its category.

export interface CaseHealthGateInput extends EngagementInput {
  /**
   * True once the user has produced real evidence to score: e.g. a document in
   * the vault, a populated evidence analysis, or an answered evidence question.
   */
  hasEvidenceSignal: boolean;
}

export function isCaseHealthScorable(input: CaseHealthGateInput): boolean {
  return input.completedCount > 0 && input.hasEvidenceSignal;
}

// ─── User evidence-signal detector (shared by every dashboard version) ────────
//
// `hasEvidenceSignal` above is a boolean the caller supplies; this is the SINGLE
// definition of how that boolean is derived, so V2 (IR-1) and V3 (IR-5) can't
// drift apart (which is exactly how a fresh journey started showing a fabricated
// score). It deliberately excludes profile autofill:
//   • the document vault seeds a "MISSING" placeholder row for every REQUIRED
//     document, so the raw `uploadedDocuments.length` is > 0 on a brand-new
//     journey — callers must pass the count of rows with a REAL uploaded file
//     (status !== "MISSING"), not the array length;
//   • the gap engine's `stats.totalEvidenceItems` folds in journey_documents
//     autofill — callers must pass `userProvided.evidenceCount` (vault-source
//     only), never `stats`.
// Only real user signal opens the gate (§6E).

export interface EvidenceSignalInput {
  /** Vault documents that actually have an uploaded file (status !== "MISSING"). */
  uploadedFileCount: number;
  /** Answered ("yes") evidence-questionnaire questions. */
  evidenceAnsweredCount: number;
  /** Autofill-free evidence item count from the gap engine (userProvided view). */
  userProvidedEvidenceCount: number;
}

export function hasUserEvidenceSignal(input: EvidenceSignalInput): boolean {
  return (
    input.uploadedFileCount > 0 ||
    input.evidenceAnsweredCount > 0 ||
    input.userProvidedEvidenceCount > 0
  );
}

// ─── Look-ahead allowlist ────────────────────────────────────────────────────
//
// Curated, deadline-driven deficiencies worth flagging one chapter early so the
// user can start arranging them (a joint sponsor or a fresh police certificate
// each take weeks). Matched by (stepKey + title) so we only promote the specific
// item, not every alert on that step. Shown "Plan ahead" and capped at warning —
// never a blocking critical while the step is still in the future.
//
// The RULES themselves are category-specific and live on each `CaseStrengthProfile`
// (`profile.lookAhead`) — the gating module stays visa-agnostic and receives them
// via `GateContext.lookAheadRules`. Family categories reuse `COMMON_LOOK_AHEAD`
// (see step-checkers.ts); a category with no early-warning items passes none.

export interface LookAheadRule {
  /** The step whose alert may surface early. */
  stepKey: string;
  /** Which alert on that step to promote (matched against its title). */
  match: (title: string) => boolean;
}

function isLookAhead(issue: AggregatedIssue, rules?: LookAheadRule[]): boolean {
  return !!rules && rules.some((r) => r.stepKey === issue.stepKey && r.match(issue.title));
}

const PLAN_AHEAD_PREFIX = "Plan ahead: ";

function asLookAhead(issue: AggregatedIssue): AggregatedIssue {
  return {
    ...issue,
    // Never blocking while it's still future work.
    level: issue.level === "critical" ? "warning" : issue.level,
    title: issue.title.startsWith(PLAN_AHEAD_PREFIX)
      ? issue.title
      : `${PLAN_AHEAD_PREFIX}${issue.title}`,
  };
}

// ─── Case-strength escalation note ───────────────────────────────────────────

const CASE_STRENGTH_NOTE =
  "This item was left unresolved on a step you already passed, it is now weakening your case strength. Resolve it before your next milestone.";

function withCaseStrengthNote(hint?: string): string {
  return hint ? `${hint}\n\n${CASE_STRENGTH_NOTE}` : CASE_STRENGTH_NOTE;
}

// ─── Gating context ──────────────────────────────────────────────────────────

export interface GateContext {
  /**
   * Ordered active step_keys across all chapters (visible_when already applied
   * by the caller's getActiveStepsForStage). Hidden/branch steps are absent, so
   * their alerts are suppressed automatically.
   */
  activeOrder: string[];
  /** step_key of the user's current position. null = journey complete. */
  frontierStepKey: string | null;
  /** chapterIdx of the frontier (for the look-ahead window). */
  frontierChapterIdx: number;
  /**
   * Category-specific look-ahead rules (from `profile.lookAhead`). Absent → no
   * item is ever surfaced early.
   */
  lookAheadRules?: LookAheadRule[];
  /** Override "now" for tests. Defaults to Date.now(). */
  now?: number;
  /**
   * Phase 2: step_key → completed_at (ms). Enables the behind-step grace +
   * escalation windows. Absent (Phase 1) → behind items show immediately.
   */
  completedAt?: Record<string, number>;
  /**
   * Phase 2: step_key → reached/started_at (ms). Enables the active-step grace
   * window. Absent (Phase 1) → active items show immediately.
   */
  startedAt?: Record<string, number>;
  /**
   * Opt-in document-checklist escalation (§4–§5). When present, issues tagged
   * `kind: "missing-document"` run through the 3-stage lifecycle instead of the
   * instant-critical path. Absent → legacy behavior (IR-1). Set from
   * `profile.documentEscalation`.
   */
  documentEscalation?: DocumentEscalationConfig;
  /**
   * Optional target filing date (ms epoch). When known, document escalation is
   * measured against it (deadline-relative); absent → fixed-days fallback.
   */
  targetFilingDate?: number;
}

/**
 * 3-stage lifecycle for a missing-document issue (§4–§5). Only called when the
 * category opts in via `ctx.documentEscalation`. Returns the issue re-leveled
 * (info/warning/critical) with stage-appropriate wording, or null if it's on a
 * future step (handled by the caller's AHEAD branch, never here).
 */
function gateMissingDocument(
  issue: AggregatedIssue,
  ord: number,
  frontierOrd: number,
  ctx: GateContext,
  now: number
): AggregatedIssue {
  const cfg = ctx.documentEscalation ?? DEFAULT_DOCUMENT_ESCALATION;
  const isBehind = ord < frontierOrd;

  // Days the doc has been "on the clock": since the step was reached (active) or
  // since it was completed/passed (behind). Missing timestamp → treat as day 0.
  const anchorMs = isBehind ? ctx.completedAt?.[issue.stepKey] : ctx.startedAt?.[issue.stepKey];
  const daysOnStep = anchorMs !== undefined ? Math.max(0, daysSince(anchorMs, now)) : 0;

  const daysUntilFiling =
    ctx.targetFilingDate !== undefined ? daysUntil(ctx.targetFilingDate, now) : null;

  const stage = computeDocumentStage({ daysOnStep, daysUntilFiling, isBehind, cfg });
  const name = issue.documentName ?? issue.title.replace(/^Missing:\s*/, "");

  if (stage === "critical") {
    return {
      ...issue,
      level: "critical",
      title: `Missing: ${name}`,
      hint: withDocumentNote(issue.hint, "critical"),
    };
  }
  if (stage === "warning") {
    return {
      ...issue,
      level: "warning",
      title: `Due soon: ${name}`,
      hint: withDocumentNote(issue.hint, "warning"),
    };
  }
  return {
    ...issue,
    level: "info",
    title: `To gather: ${name}`,
    hint: withDocumentNote(issue.hint, "info"),
  };
}

const DOC_STAGE_NOTE: Record<DocStage, string> = {
  info: "Recommended to gather before you submit, not urgent yet.",
  warning: "Your filing step is approaching, please arrange this soon.",
  critical: "This is required to submit and is now blocking your petition.",
};

function withDocumentNote(hint: string | undefined, stage: DocStage): string {
  const note = DOC_STAGE_NOTE[stage];
  return hint ? `${hint}\n\n${note}` : note;
}

/**
 * Decide whether a single issue should surface, and in what form.
 * Returns the (possibly transformed) issue to show, or null to hide it.
 */
function gateOne(
  issue: AggregatedIssue,
  order: Map<string, number>,
  frontierOrd: number,
  frontierChapterIdx: number,
  ctx: GateContext
): AggregatedIssue | null {
  const ord = order.get(issue.stepKey);

  // Not an active step (e.g. an alert from the wrong filing-method branch, or an
  // unknown/consistency default key) → never surface. Edge-case #3 in the plan.
  if (ord === undefined) return null;

  const now = ctx.now ?? Date.now();

  // ── AHEAD: user hasn't reached this step yet ──────────────────────────────
  if (ord > frontierOrd) {
    if (
      isLookAhead(issue, ctx.lookAheadRules) &&
      frontierChapterIdx >= issue.chapterIdx - ALERT_TIMING.lookAheadChapters
    ) {
      return asLookAhead(issue);
    }
    return null; // core fix: suppress future-step alerts
  }

  // Opt-in document-checklist escalation: a missing required doc on the current
  // or a passed step runs through the 3-stage lifecycle rather than showing an
  // instant red critical (§4–§5). Only when the category opted in.
  if (ctx.documentEscalation && issue.kind === "missing-document") {
    return gateMissingDocument(issue, ord, frontierOrd, ctx, now);
  }

  // Criticals block the action they belong to — never grace-delayed.
  if (issue.level === "critical") return issue;

  // ── ACTIVE: user is on this step ──────────────────────────────────────────
  if (ord === frontierOrd) {
    const reachedAt = ctx.startedAt?.[issue.stepKey];
    if (reachedAt === undefined) return issue; // Phase 1: no grace data → show now
    return daysSince(reachedAt, now) >= ALERT_TIMING.activeWarningGraceDays ? issue : null;
  }

  // ── BEHIND: user passed this step but left a deficiency ───────────────────
  const completedAt = ctx.completedAt?.[issue.stepKey];
  // No completion timestamp → either Phase 1, or the user skipped the step
  // without completing it. Either way, surface it now (edge-case #1 & #8).
  if (completedAt === undefined) return issue;

  const days = daysSince(completedAt, now);
  if (days < ALERT_TIMING.behindWarningShowDays) return null; // still in grace
  if (days >= ALERT_TIMING.behindWarningEscalateDays) {
    return { ...issue, level: "critical", hint: withCaseStrengthNote(issue.hint) };
  }
  return issue;
}

/**
 * Gate an aggregated issue list against the user's journey progress.
 * Order is preserved; the caller re-sorts as before.
 */
export function gateAlertIssues(
  issues: AggregatedIssue[],
  ctx: GateContext
): AggregatedIssue[] {
  const order = new Map<string, number>();
  ctx.activeOrder.forEach((key, i) => {
    if (key && !order.has(key)) order.set(key, i);
  });

  // Frontier ordinal. If the journey is complete (no frontier step), treat the
  // frontier as beyond every step so all remaining issues count as BEHIND.
  const frontierOrd =
    ctx.frontierStepKey != null ? order.get(ctx.frontierStepKey) ?? order.size : order.size;

  const out: AggregatedIssue[] = [];
  for (const issue of issues) {
    const gated = gateOne(issue, order, frontierOrd, ctx.frontierChapterIdx, ctx);
    if (gated) out.push(gated);
  }
  return out;
}

// ─── Context builder (shared by every dashboard version) ─────────────────────

/**
 * Build a `GateContext` from a journey's chapters + wizard state. The two
 * journeyHelpers (`getActiveStepsForStage`, `getNextBestAction`) are injected so
 * this stays UI-agnostic and both the V2 (IR-1) and V3 (IR-5) dashboards — and
 * any future one — share the exact same frontier/active-order derivation instead
 * of duplicating it. Phase-2 timestamp maps pass straight through.
 */
export interface BuildGateContextParams {
  chapters: any[];
  state: { metadata: any; filingType: string; completedSteps: Set<string> };
  getActiveStepsForStage: (
    data: any,
    index: number,
    metadata: any,
    filingMethodFallback?: string | null
  ) => any[];
  getNextBestAction: (
    data: any,
    state: any
  ) => { step: any; chapterIdx: number } | null;
  lookAheadRules?: LookAheadRule[];
  now?: number;
  /**
   * Per-step timestamps (ms epoch) from `WizardState.stepTimestamps`. Drives the
   * Phase-2 active-step grace (`startedAt`) and behind-step escalation
   * (`completedAt`). Absent → time gating is inert (items show immediately).
   */
  stepTimestamps?: Record<string, { completedAt?: number | null; startedAt?: number | null }>;
  /** Opt-in document-checklist escalation (from `profile.documentEscalation`). */
  documentEscalation?: DocumentEscalationConfig;
  /** Optional target filing date (ms epoch) for deadline-relative escalation. */
  targetFilingDate?: number;
}

export function buildGateContext(p: BuildGateContextParams): GateContext {
  const data = { chapters: p.chapters };
  const activeOrder: string[] = [];
  for (let ci = 0; ci < p.chapters.length; ci++) {
    for (const s of p.getActiveStepsForStage(data, ci, p.state.metadata, p.state.filingType)) {
      const key = (s as any).step_key || (s as any).id;
      if (key) activeOrder.push(key);
    }
  }
  const next = p.getNextBestAction(data, p.state);

  // Split the timestamp map into the two lookups the gate consumes, keeping only
  // real (finite) values so a null column never counts as a timestamp.
  const completedAt: Record<string, number> = {};
  const startedAt: Record<string, number> = {};
  if (p.stepTimestamps) {
    for (const [key, ts] of Object.entries(p.stepTimestamps)) {
      if (ts?.completedAt != null && Number.isFinite(ts.completedAt)) completedAt[key] = ts.completedAt;
      if (ts?.startedAt != null && Number.isFinite(ts.startedAt)) startedAt[key] = ts.startedAt;
    }
  }

  return {
    activeOrder,
    frontierStepKey: next ? next.step.step_key || (next.step as any).id : null,
    frontierChapterIdx: next ? next.chapterIdx : Math.max(0, p.chapters.length - 1),
    lookAheadRules: p.lookAheadRules,
    now: p.now,
    completedAt,
    startedAt,
    documentEscalation: p.documentEscalation,
    targetFilingDate: p.targetFilingDate,
  };
}

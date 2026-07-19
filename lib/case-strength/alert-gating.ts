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
  "This item was left unresolved on a step you already passed — it is now weakening your case strength. Resolve it before your next milestone.";

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
  };
}

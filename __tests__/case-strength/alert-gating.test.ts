/**
 * Progressive alert-gating + engagement-gate tests (CASE_STRENGTH_ALERT_PLAN.md).
 *
 * gateAlertIssues filters the flat aggregated-issue list against the user's
 * journey "frontier" (first uncompleted active step):
 *   - AHEAD steps  → hidden (the core fix)
 *   - ACTIVE step  → calm until the user opens it (no startedAt → suppressed),
 *                    then a grace window before its warnings surface
 *   - BEHIND steps → shown (Phase-2 escalation when completedAt supplied)
 *   - look-ahead allowlist → shown one chapter early, "Plan ahead", warning-capped
 *   - hidden-branch / unknown steps → always suppressed
 *
 * isMeaningfullyStarted gates the case-health empty state.
 */

import {
  gateAlertIssues,
  buildGateContext,
  buildAlertGateContext,
  resolveTargetFilingDate,
  isMeaningfullyStarted,
  ALERT_TIMING,
  computeDocumentStage,
  DEFAULT_DOCUMENT_ESCALATION,
} from "@/lib/case-strength/alert-gating";
import { COMMON_LOOK_AHEAD } from "@/lib/case-strength/step-checkers";
import type { AggregatedIssue } from "@/lib/case-strength/aggregate-issues";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const NOW = new Date("2026-07-17T00:00:00.000Z").getTime();
const DAY = 86_400_000;
const daysAgo = (n: number) => NOW - n * DAY;

// A 3-chapter active order; no hidden/branch steps.
const ORDER = ["step_1_1", "step_1_2", "step_1_3", "step_2_5", "step_2_8", "step_3_3"];
const CHAPTER_OF: Record<string, number> = {
  step_1_1: 0,
  step_1_2: 0,
  step_1_3: 0,
  step_2_5: 1,
  step_2_8: 1,
  step_3_3: 2,
};

let idc = 0;
function issue(
  stepKey: string,
  chapterIdx: number,
  stepIdx: number,
  level: AggregatedIssue["level"],
  title = `issue-${idc++}`,
  hint = "do the thing"
): AggregatedIssue {
  return { level, title, hint, stepKey, stepName: stepKey, stepNumber: stepIdx + 1, chapterIdx, stepIdx };
}

function titles(issues: AggregatedIssue[]): string[] {
  return issues.map((i) => i.title);
}

/** Run the gate with the frontier derived from a list of completed step_keys. */
function gate(issues: AggregatedIssue[], completed: string[] = [], extra: any = {}) {
  const frontierStepKey = ORDER.find((k) => !completed.includes(k)) ?? null;
  const frontierChapterIdx = frontierStepKey ? CHAPTER_OF[frontierStepKey] : 2;
  return gateAlertIssues(issues, {
    activeOrder: ORDER,
    frontierStepKey,
    frontierChapterIdx,
    lookAheadRules: COMMON_LOOK_AHEAD,
    now: NOW,
    ...extra,
  });
}

// ── AHEAD suppression (the core fix) ──────────────────────────────────────────

describe("progressive reveal — AHEAD suppression", () => {
  it("fresh start stays calm: current step hidden until opened, future steps hidden", () => {
    const issues = [
      issue("step_1_1", 0, 0, "warning", "eligibility risk"), // ACTIVE, not opened
      issue("step_1_2", 0, 1, "critical", "Missing: passport"), // AHEAD
      issue("step_2_8", 1, 1, "warning", "submit to NVC"), // AHEAD
    ];
    // Nothing opened yet → no alert blasts on arrival.
    expect(gate(issues, [])).toHaveLength(0);
    // Once the user has been ON step_1_1 past the grace window, its own warning surfaces.
    const opened = gate(issues, [], {
      startedAt: { step_1_1: daysAgo(ALERT_TIMING.activeWarningGraceDays + 1) },
    });
    expect(titles(opened)).toContain("eligibility risk");
    expect(titles(opened)).not.toContain("Missing: passport"); // step_1_2 is AHEAD
    expect(titles(opened)).not.toContain("submit to NVC"); // Chapter 2 AHEAD
  });

  it("hides even a critical when its step is still in the future", () => {
    const out = gate([issue("step_2_5", 1, 0, "critical", "DS-260 mismatch")], []);
    expect(out).toHaveLength(0);
  });

  it("reveals a behind step's leftover, but NOT the just-reached active step's warning", () => {
    const out = gate(
      [
        issue("step_1_2", 0, 1, "warning", "marriage date missing"), // BEHIND → shows
        issue("step_1_3", 0, 2, "warning", "filing method not chosen"), // ACTIVE, not opened → calm
        issue("step_2_8", 1, 1, "warning", "still ahead"), // AHEAD → hidden
      ],
      ["step_1_1", "step_1_2"] // frontier = step_1_3, no startedAt for it
    );
    expect(titles(out)).toContain("marriage date missing");
    // The user just completed step_1_2; step_1_3 is now current but unopened, so
    // its "you haven't done this yet" warning must NOT blast immediately.
    expect(titles(out)).not.toContain("filing method not chosen");
    expect(titles(out)).not.toContain("still ahead");
  });

  it("keeps the current step calm until opened: unopened → hidden, opened-within-grace → hidden", () => {
    const issues = [issue("step_1_3", 0, 2, "warning", "filing method not chosen")];
    // Frontier advanced here but never opened (no startedAt) → suppressed.
    expect(gate(issues, ["step_1_1", "step_1_2"])).toHaveLength(0);
    // Opened just now (startedAt stamped) → still within grace → suppressed.
    expect(
      gate(issues, ["step_1_1", "step_1_2"], { startedAt: { step_1_3: NOW } })
    ).toHaveLength(0);
  });
});

// ── Look-ahead allowlist ──────────────────────────────────────────────────────

describe("look-ahead allowlist", () => {
  it("surfaces income shortfall one chapter early, tagged + severity-capped", () => {
    const out = gate(
      [issue("step_2_5", 1, 0, "critical", "Income is $5,000 below the requirement")],
      []
    );
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe("Plan ahead: Income is $5,000 below the requirement");
    expect(out[0].level).toBe("warning"); // capped from critical
  });

  it("does NOT surface a Chapter-3 look-ahead while still two chapters away", () => {
    const out = gate(
      [issue("step_3_3", 2, 0, "warning", "Apply for a fresh police certificate now")],
      []
    );
    expect(out).toHaveLength(0);
  });

  it("surfaces the fresh-PCC look-ahead once the user reaches Chapter 2", () => {
    const out = gate(
      [issue("step_3_3", 2, 0, "warning", "Apply for a fresh police certificate now")],
      ["step_1_1", "step_1_2", "step_1_3"]
    );
    expect(out).toHaveLength(1);
    expect(out[0].title.startsWith("Plan ahead: ")).toBe(true);
  });

  it("shows the natural (un-tagged) alert once the user has engaged with the step past grace", () => {
    const out = gate(
      [issue("step_2_5", 1, 0, "warning", "Income is $5,000 below the requirement")],
      ["step_1_1", "step_1_2", "step_1_3"], // frontier = step_2_5 (active)
      { startedAt: { step_2_5: daysAgo(ALERT_TIMING.activeWarningGraceDays + 1) } }
    );
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe("Income is $5,000 below the requirement"); // no "Plan ahead:" prefix
  });
});

// ── Hidden / unknown steps ────────────────────────────────────────────────────

describe("hidden-branch and unknown steps", () => {
  it("suppresses issues whose step is not in the active order", () => {
    const out = gate([issue("step_9_9", 0, 0, "critical", "ghost step")], ["step_1_1"]);
    expect(out).toHaveLength(0);
  });
});

// ── Phase-2 time gating (active grace) ────────────────────────────────────────

describe("Phase 2 — active-step warning grace", () => {
  const completed = ["step_1_1", "step_1_2"]; // frontier = step_1_3

  it("holds a fresh active warning inside the grace window", () => {
    const out = gate([issue("step_1_3", 0, 2, "warning", "filing method")], completed, {
      startedAt: { step_1_3: daysAgo(ALERT_TIMING.activeWarningGraceDays - 1) },
    });
    expect(out).toHaveLength(0);
  });

  it("shows the active warning once the grace window passes", () => {
    const out = gate([issue("step_1_3", 0, 2, "warning", "filing method")], completed, {
      startedAt: { step_1_3: daysAgo(ALERT_TIMING.activeWarningGraceDays + 1) },
    });
    expect(out).toHaveLength(1);
  });

  it("never grace-delays a critical on the active step", () => {
    const out = gate([issue("step_1_3", 0, 2, "critical", "upload too large")], completed, {
      startedAt: { step_1_3: daysAgo(0) },
    });
    expect(out).toHaveLength(1);
  });
});

// ── Phase-2 time gating (behind escalation) ───────────────────────────────────

describe("Phase 2 — behind-step escalation", () => {
  const completed = ["step_1_1", "step_1_2", "step_1_3"]; // frontier = step_2_5

  it("holds a just-passed behind warning inside its grace window", () => {
    const out = gate([issue("step_1_2", 0, 1, "warning", "left behind")], completed, {
      completedAt: { step_1_2: daysAgo(ALERT_TIMING.behindWarningShowDays - 1) },
    });
    expect(out).toHaveLength(0);
  });

  it("shows the behind warning after its grace window", () => {
    const out = gate([issue("step_1_2", 0, 1, "warning", "left behind")], completed, {
      completedAt: { step_1_2: daysAgo(ALERT_TIMING.behindWarningShowDays + 1) },
    });
    expect(out).toHaveLength(1);
    expect(out[0].level).toBe("warning");
  });

  it("escalates a long-unresolved behind warning to critical with a case-strength note", () => {
    const out = gate([issue("step_1_2", 0, 1, "warning", "left behind")], completed, {
      completedAt: { step_1_2: daysAgo(ALERT_TIMING.behindWarningEscalateDays + 1) },
    });
    expect(out).toHaveLength(1);
    expect(out[0].level).toBe("critical");
    expect(out[0].hint).toMatch(/case strength/i);
  });

  it("without a completedAt (Phase 1) a behind warning shows immediately", () => {
    const out = gate([issue("step_1_2", 0, 1, "warning", "left behind")], completed);
    expect(out).toHaveLength(1);
  });
});

// ── Journey complete ──────────────────────────────────────────────────────────

describe("journey complete", () => {
  it("treats every remaining issue as behind and surfaces it", () => {
    const out = gate([issue("step_3_3", 2, 0, "warning", "final leftover")], ORDER.slice());
    expect(titles(out)).toContain("final leftover");
  });
});

// ── buildGateContext + category-driven look-ahead ────────────────────────────

describe("buildGateContext + category-driven look-ahead", () => {
  const makeChapters = () => [
    { steps: [{ step_key: "step_1_1" }, { step_key: "step_1_2" }, { step_key: "step_1_3" }] },
    { steps: [{ step_key: "step_2_5" }, { step_key: "step_2_8" }] },
    { steps: [{ step_key: "step_3_3" }] },
  ];
  const getActiveStepsForStage = (data: any, i: number) => data.chapters[i].steps;
  const mkState = (completed: string[]) => ({
    metadata: {},
    filingType: "online",
    completedSteps: new Set(completed),
  });
  const getNextBestAction = (data: any, state: any) => {
    for (let ci = 0; ci < data.chapters.length; ci++) {
      for (const s of data.chapters[ci].steps) {
        if (!state.completedSteps.has(s.step_key)) return { step: s, chapterIdx: ci };
      }
    }
    return null;
  };

  it("derives activeOrder + frontier and applies profile look-ahead", () => {
    const ctx = buildGateContext({
      chapters: makeChapters(),
      state: mkState([]) as any,
      getActiveStepsForStage,
      getNextBestAction,
      lookAheadRules: COMMON_LOOK_AHEAD,
      now: NOW,
    });
    expect(ctx.activeOrder).toEqual(ORDER);
    expect(ctx.frontierStepKey).toBe("step_1_1");
    expect(ctx.frontierChapterIdx).toBe(0);

    const out = gateAlertIssues(
      [issue("step_2_5", 1, 0, "critical", "Income is below the requirement")],
      ctx
    );
    expect(out[0].title.startsWith("Plan ahead: ")).toBe(true);
  });

  it("surfaces NO look-ahead when the category defines none", () => {
    const out = gateAlertIssues([issue("step_2_5", 1, 0, "critical", "Income is below")], {
      activeOrder: ORDER,
      frontierStepKey: "step_1_1",
      frontierChapterIdx: 0,
      // lookAheadRules omitted → a category with no early-warning items
      now: NOW,
    });
    expect(out).toHaveLength(0);
  });

  it("derives completedAt from stepTimestamps and escalates a long-overdue behind item", () => {
    const ctx = buildGateContext({
      chapters: makeChapters(),
      state: mkState(["step_1_1", "step_1_2", "step_1_3"]) as any, // frontier = step_2_5
      getActiveStepsForStage,
      getNextBestAction,
      lookAheadRules: COMMON_LOOK_AHEAD,
      stepTimestamps: {
        step_1_2: { completedAt: NOW - (ALERT_TIMING.behindWarningEscalateDays + 1) * DAY },
      },
      now: NOW,
    });
    expect(ctx.completedAt).toEqual({
      step_1_2: NOW - (ALERT_TIMING.behindWarningEscalateDays + 1) * DAY,
    });

    const out = gateAlertIssues([issue("step_1_2", 0, 1, "warning", "left behind")], ctx);
    expect(out[0].level).toBe("critical");
    expect(out[0].hint).toMatch(/case strength/i);
  });

  it("drops null timestamps when deriving the completedAt/startedAt maps", () => {
    const ctx = buildGateContext({
      chapters: makeChapters(),
      state: mkState([]) as any,
      getActiveStepsForStage,
      getNextBestAction,
      stepTimestamps: { step_1_1: { completedAt: null, startedAt: null } },
      now: NOW,
    });
    expect(ctx.completedAt).toEqual({});
    expect(ctx.startedAt).toEqual({});
  });
});

// ── buildAlertGateContext (profile-aware wrapper) ─────────────────────────────
//
// This is the shared wrapper every dashboard must use. The regression it guards:
// V2 (IR-1) once called buildGateContext WITHOUT documentEscalation, silently
// disabling IR-1's opt-in escalation so a fresh missing doc showed as an instant
// red critical. Going through the profile here makes that impossible to forget.

describe("resolveTargetFilingDate", () => {
  it("parses an ISO string and an epoch-ms number", () => {
    const iso = "2026-09-01T00:00:00.000Z";
    expect(resolveTargetFilingDate({ targetFilingDate: iso })).toBe(new Date(iso).getTime());
    expect(resolveTargetFilingDate({ targetFilingDate: NOW })).toBe(NOW);
  });

  it("returns undefined when absent or unparseable (→ fixed-days fallback)", () => {
    expect(resolveTargetFilingDate({})).toBeUndefined();
    expect(resolveTargetFilingDate(null)).toBeUndefined();
    expect(resolveTargetFilingDate({ targetFilingDate: "not-a-date" })).toBeUndefined();
  });
});

describe("buildAlertGateContext — wires profile escalation like every dashboard", () => {
  const makeChapters = () => [
    { steps: [{ step_key: "step_1_1" }, { step_key: "step_1_2" }] },
    { steps: [{ step_key: "step_2_5" }] },
  ];
  const getActiveStepsForStage = (data: any, i: number) => data.chapters[i].steps;
  const getNextBestAction = (data: any, state: any) => {
    for (let ci = 0; ci < data.chapters.length; ci++) {
      for (const s of data.chapters[ci].steps) {
        if (!state.completedSteps.has(s.step_key)) return { step: s, chapterIdx: ci };
      }
    }
    return null;
  };
  const mkState = (metadata: any = {}) => ({
    metadata,
    filingType: "online",
    completedSteps: new Set<string>(), // frontier = step_1_1 (active)
    stepTimestamps: { step_1_1: { startedAt: NOW } },
  });

  const gateWith = (profile: any, metadata: any = {}) =>
    gateAlertIssues(
      [missingDoc("step_1_1", 0, 0)],
      buildAlertGateContext({
        chapters: makeChapters(),
        state: mkState(metadata) as any,
        getActiveStepsForStage,
        getNextBestAction,
        stepTimestamps: mkState(metadata).stepTimestamps,
        profile,
        now: NOW,
      })
    );

  it("with the profile's documentEscalation, a fresh missing doc is a calm to-do (the IR-1 fix)", () => {
    const out = gateWith({ documentEscalation: DEFAULT_DOCUMENT_ESCALATION });
    expect(out).toHaveLength(1);
    expect(out[0].level).toBe("info");
    expect(out[0].title).toBe("To gather: Passport");
  });

  it("without documentEscalation (legacy profile), the same doc stays an instant critical", () => {
    const out = gateWith({});
    expect(out[0].level).toBe("critical");
    expect(out[0].title).toBe("Missing: Passport");
  });

  it("derives targetFilingDate from journey metadata → near filing forces red even on a fresh step", () => {
    const out = gateWith(
      { documentEscalation: DEFAULT_DOCUMENT_ESCALATION },
      { targetFilingDate: NOW + DEFAULT_DOCUMENT_ESCALATION.filingCriticalDays * DAY }
    );
    expect(out[0].level).toBe("critical");
  });
});

// ── Engagement gate (empty-state) ─────────────────────────────────────────────

describe("isMeaningfullyStarted", () => {
  it("is false when no step is completed (even if metadata/vault has data)", () => {
    expect(isMeaningfullyStarted({ completedCount: 0 })).toBe(false);
  });

  it("is true after the first completed step", () => {
    expect(isMeaningfullyStarted({ completedCount: 1 })).toBe(true);
  });

  it("stays true deeper into the journey", () => {
    expect(isMeaningfullyStarted({ completedCount: 6 })).toBe(true);
  });
});

// ── Document-checklist escalation (§4–§5) ─────────────────────────────────────

function missingDoc(stepKey: string, chapterIdx: number, stepIdx: number, name = "Passport"): AggregatedIssue {
  return {
    level: "critical",
    title: `Missing: ${name}`,
    hint: "upload it",
    stepKey,
    stepName: stepKey,
    stepNumber: stepIdx + 1,
    chapterIdx,
    stepIdx,
    kind: "missing-document",
    documentName: name,
  };
}

describe("computeDocumentStage (pure)", () => {
  const cfg = DEFAULT_DOCUMENT_ESCALATION;

  it("fixed fallback: calm to-do inside the todo window, amber after, red at criticalDays", () => {
    expect(computeDocumentStage({ daysOnStep: 0, daysUntilFiling: null, isBehind: false, cfg })).toBe("info");
    expect(computeDocumentStage({ daysOnStep: cfg.todoDays, daysUntilFiling: null, isBehind: false, cfg })).toBe("warning");
    expect(computeDocumentStage({ daysOnStep: cfg.criticalDays, daysUntilFiling: null, isBehind: false, cfg })).toBe("critical");
  });

  it("behind the step starts CALM on day 0 (no instant due-soon), then escalates on its shorter windows", () => {
    // Day 0 behind must be calm — completing a step is not a deadline.
    expect(computeDocumentStage({ daysOnStep: 0, daysUntilFiling: null, isBehind: true, cfg })).toBe("info");
    // Behind escalates FASTER than active (shorter windows).
    expect(computeDocumentStage({ daysOnStep: cfg.behindTodoDays, daysUntilFiling: null, isBehind: true, cfg })).toBe("warning");
    expect(computeDocumentStage({ daysOnStep: cfg.behindCriticalDays, daysUntilFiling: null, isBehind: true, cfg })).toBe("critical");
    // Behind is stricter than active at the same elapsed time.
    expect(computeDocumentStage({ daysOnStep: cfg.behindTodoDays, daysUntilFiling: null, isBehind: false, cfg })).toBe("info");
  });

  it("deadline-relative: near filing → red even on day 0; far → no deadline pressure yet", () => {
    expect(computeDocumentStage({ daysOnStep: 0, daysUntilFiling: cfg.filingCriticalDays, isBehind: false, cfg })).toBe("critical");
    expect(computeDocumentStage({ daysOnStep: 0, daysUntilFiling: cfg.filingDueSoonDays, isBehind: false, cfg })).toBe("warning");
    // Far from filing + fresh → calm (no deadline pressure, no elapsed time).
    expect(computeDocumentStage({ daysOnStep: 0, daysUntilFiling: cfg.filingDueSoonDays + 60, isBehind: false, cfg })).toBe("info");
  });

  it("far from the deadline still escalates on elapsed time (deadline + time-based unified)", () => {
    // A distant deadline no longer freezes a doc at calm forever: once it has
    // been outstanding past the critical window, it turns red on its own.
    expect(computeDocumentStage({ daysOnStep: 999, daysUntilFiling: cfg.filingDueSoonDays + 60, isBehind: false, cfg })).toBe("critical");
  });
});

describe("gate — document escalation opt-in", () => {
  it("WITHOUT the config, a missing doc stays an instant critical (legacy IR-1)", () => {
    const out = gate([missingDoc("step_1_1", 0, 0)], []); // step_1_1 is ACTIVE
    expect(out).toHaveLength(1);
    expect(out[0].level).toBe("critical");
    expect(out[0].title).toBe("Missing: Passport");
  });

  it("WITH the config, a freshly-reached missing doc is a calm to-do (info), not red", () => {
    const out = gate([missingDoc("step_1_1", 0, 0)], [], {
      documentEscalation: DEFAULT_DOCUMENT_ESCALATION,
      startedAt: { step_1_1: NOW }, // just reached
    });
    expect(out).toHaveLength(1);
    expect(out[0].level).toBe("info");
    expect(out[0].title).toBe("To gather: Passport");
  });

  it("WITH the config, escalates to amber after the todo window on the active step", () => {
    const out = gate([missingDoc("step_1_1", 0, 0)], [], {
      documentEscalation: DEFAULT_DOCUMENT_ESCALATION,
      startedAt: { step_1_1: daysAgo(DEFAULT_DOCUMENT_ESCALATION.todoDays + 1) },
    });
    expect(out[0].level).toBe("warning");
    expect(out[0].title).toBe("Due soon: Passport");
  });

  it("WITH the config, escalates to red past the critical window", () => {
    const out = gate([missingDoc("step_1_1", 0, 0)], [], {
      documentEscalation: DEFAULT_DOCUMENT_ESCALATION,
      startedAt: { step_1_1: daysAgo(DEFAULT_DOCUMENT_ESCALATION.criticalDays + 1) },
    });
    expect(out[0].level).toBe("critical");
    expect(out[0].title).toBe("Missing: Passport");
  });

  it("deadline-relative: a near target filing date forces red even on a fresh step", () => {
    const out = gate([missingDoc("step_1_1", 0, 0)], [], {
      documentEscalation: DEFAULT_DOCUMENT_ESCALATION,
      startedAt: { step_1_1: NOW },
      targetFilingDate: NOW + DEFAULT_DOCUMENT_ESCALATION.filingCriticalDays * DAY,
    });
    expect(out[0].level).toBe("critical");
  });

  it("still hides a missing doc on a FUTURE step (AHEAD suppression unaffected)", () => {
    const out = gate([missingDoc("step_2_5", 1, 0)], [], {
      documentEscalation: DEFAULT_DOCUMENT_ESCALATION,
    });
    expect(out).toHaveLength(0);
  });

  it("a JUST-completed gathering step (behind, day 0, no deadline) keeps missing docs CALM — the fresh-journey fix", () => {
    // Reproduces the reported bug: start a journey, mark the Gather-Documents
    // step complete with nothing uploaded → the docs must NOT become "Due soon".
    const out = gate([missingDoc("step_1_2", 0, 1)], ["step_1_1", "step_1_2"], {
      documentEscalation: DEFAULT_DOCUMENT_ESCALATION,
      completedAt: { step_1_2: NOW },
    });
    expect(out).toHaveLength(1);
    expect(out[0].level).toBe("info"); // filtered out of the Alert Center (critical+warning only)
    expect(out[0].title).toBe("To gather: Passport");
  });

  it("a behind missing doc escalates to due-soon only AFTER its (shorter) behind window", () => {
    const out = gate([missingDoc("step_1_2", 0, 1)], ["step_1_1", "step_1_2"], {
      documentEscalation: DEFAULT_DOCUMENT_ESCALATION,
      completedAt: { step_1_2: daysAgo(DEFAULT_DOCUMENT_ESCALATION.behindTodoDays + 1) },
    });
    expect(out[0].level).toBe("warning");
    expect(out[0].title).toBe("Due soon: Passport");
  });
});

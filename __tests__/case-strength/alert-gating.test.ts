/**
 * Progressive alert-gating + engagement-gate tests (CASE_STRENGTH_ALERT_PLAN.md).
 *
 * gateAlertIssues filters the flat aggregated-issue list against the user's
 * journey "frontier" (first uncompleted active step):
 *   - AHEAD steps  → hidden (the core fix)
 *   - ACTIVE step  → shown (Phase-2 grace when startedAt supplied)
 *   - BEHIND steps → shown (Phase-2 escalation when completedAt supplied)
 *   - look-ahead allowlist → shown one chapter early, "Plan ahead", warning-capped
 *   - hidden-branch / unknown steps → always suppressed
 *
 * isMeaningfullyStarted gates the case-health empty state.
 */

import {
  gateAlertIssues,
  buildGateContext,
  isMeaningfullyStarted,
  ALERT_TIMING,
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
  it("fresh start shows only the current step; future steps hidden", () => {
    const out = gate(
      [
        issue("step_1_1", 0, 0, "warning", "eligibility risk"),
        issue("step_1_2", 0, 1, "critical", "Missing: passport"),
        issue("step_2_8", 1, 1, "warning", "submit to NVC"),
      ],
      []
    );
    expect(titles(out)).toContain("eligibility risk");
    expect(titles(out)).not.toContain("Missing: passport"); // step_1_2 is AHEAD
    expect(titles(out)).not.toContain("submit to NVC"); // Chapter 2 AHEAD
  });

  it("hides even a critical when its step is still in the future", () => {
    const out = gate([issue("step_2_5", 1, 0, "critical", "DS-260 mismatch")], []);
    expect(out).toHaveLength(0);
  });

  it("reveals a behind step's leftover once the user has moved past it", () => {
    const out = gate(
      [
        issue("step_1_2", 0, 1, "warning", "marriage date missing"), // BEHIND
        issue("step_1_3", 0, 2, "warning", "filing method not chosen"), // ACTIVE
        issue("step_2_8", 1, 1, "warning", "still ahead"), // AHEAD
      ],
      ["step_1_1", "step_1_2"]
    );
    expect(titles(out)).toEqual(
      expect.arrayContaining(["marriage date missing", "filing method not chosen"])
    );
    expect(titles(out)).not.toContain("still ahead");
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

  it("shows the natural (un-tagged) alert once the user is actually on the step", () => {
    const out = gate(
      [issue("step_2_5", 1, 0, "warning", "Income is $5,000 below the requirement")],
      ["step_1_1", "step_1_2", "step_1_3"]
    );
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe("Income is $5,000 below the requirement"); // no prefix
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

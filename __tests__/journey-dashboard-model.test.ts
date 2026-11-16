import {
  alertId,
  buildAlerts,
  buildCaseHealth,
  buildChapters,
  buildHero,
  buildKeyDates,
  buildPath,
  buildTracking,
  estimateInterviewWindow,
} from "@/lib/journey/dashboard/buildDashboardModel";
import {
  parseDay,
  parseDismissed,
  parseEvents,
  parseNotes,
  sortNotes,
} from "@/lib/journey/dashboard/personal";
import {
  getActiveStepsForStage,
  getNextBestAction,
  getStageProgress,
  isStageUnlocked,
} from "@/app/components/journey-engine/journeyHelpers";
import type { AggregatedIssue } from "@/lib/case-strength/aggregate-issues";
import ir5 from "@/data/visa-category/ir-5.json";

const helpers = { getActiveStepsForStage, getStageProgress, isStageUnlocked };
const today = new Date(2026, 10, 14);
const data = ir5 as never;

function stateWith(completed: string[], metadata: Record<string, unknown> = {}) {
  return { completedSteps: new Set(completed), metadata, filingType: "online" } as never;
}

describe("personal data parsing (values from the database are untrusted)", () => {
  it("reads YYYY-MM-DD as a local calendar day and rejects junk", () => {
    const d = parseDay("2026-11-18")!;
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 10, 18]);
    expect(parseDay("2026-02-31")).toBeNull();
    expect(parseDay("1999-01-01")).toBeNull();
    expect(parseDay("not a date")).toBeNull();
    expect(parseDay(undefined)).toBeNull();
  });

  it("drops malformed notes, events and dismissals", () => {
    expect(parseNotes("x")).toEqual([]);
    const notes = parseNotes([
      { id: "a", text: "  keep me  ", color: "#0d9488", ts: 1, pinned: true },
      { id: "b", text: "" },
      { text: "no id" },
      { id: "c", text: "bad colour", color: "javascript:alert(1)", ts: 2 },
    ]);
    expect(notes.map((n) => n.id)).toEqual(["a", "c"]);
    expect(notes[0].text).toBe("keep me");
    expect(notes[1].color).toMatch(/^#/);

    const events = parseEvents([
      { id: "e1", title: "PCC", day: "2026-12-01", time: "14:30", color: "#3b62a0" },
      { id: "e2", title: "Bad day", day: "2026-13-01" },
      { id: "e3", title: "Bad time", day: "2026-12-02", time: "2pm" },
    ]);
    expect(events.map((e) => e.id)).toEqual(["e1", "e3"]);
    expect(events[1].time).toBeUndefined();

    expect(parseDismissed(["a", 3, null, "b"])).toEqual(["a", "b"]);
  });

  it("sorts pinned notes first, then newest", () => {
    const sorted = sortNotes(parseNotes([
      { id: "old", text: "old", ts: 1 },
      { id: "new", text: "new", ts: 3 },
      { id: "pin", text: "pin", ts: 0, pinned: true },
    ]));
    expect(sorted.map((n) => n.id)).toEqual(["pin", "new", "old"]);
  });
});

describe("chapters, path and hero come from the journey JSON", () => {
  it("counts only visible steps and marks the next one current", () => {
    const state = stateWith([]);
    const next = getNextBestAction(data, state);
    const path = buildPath(data, state, helpers, next);
    const visible = [0, 1, 2].reduce(
      (n, i) => n + getActiveStepsForStage(data, i, {}, "online").length,
      0
    );
    expect(path).toHaveLength(visible);
    expect(path.filter((p) => p.state === "current")).toHaveLength(1);
    expect(path[0].state).toBe("current");

    const chapters = buildChapters(data, state, helpers, () => false, next?.chapterIdx ?? null);
    expect(chapters.map((c) => c.status)).toEqual(["current", "locked", "locked"]);
    expect(chapters[0].title).not.toMatch(/^Chapter/);

    const hero = buildHero({ path, data, next, upgradeRequired: false, readOnly: false, metadata: {}, today });
    expect(hero.position).toBe(1);
    expect(hero.interview).toBeNull();
    expect(hero.next?.chapterIndex).toBe(0);
  });

  it("only shows an interview when a real, upcoming date is recorded", () => {
    const state = stateWith([]);
    const next = getNextBestAction(data, state);
    const path = buildPath(data, state, helpers, next);
    const md = { tracking_status: { interview_date: "2026-11-18", interview_time: "9:30 AM" }, interviewEmbassy: "US Embassy" };
    const hero = buildHero({ path, data, next, upgradeRequired: true, readOnly: false, metadata: md, today });
    expect(hero.interview).toMatchObject({ daysLeft: 4, time: "9:30 AM", place: "US Embassy" });
    expect(hero.upgradeRequired).toBe(true);

    const past = buildHero({ path, data, next, upgradeRequired: false, readOnly: false, metadata: { interviewDate: "2026-11-01" }, today });
    expect(past.interview).toBeNull();
  });
});

describe("alerts", () => {
  const issue = (over: Partial<AggregatedIssue>): AggregatedIssue => ({
    level: "critical",
    title: "Police certificate",
    hint: "No certificate on file.\n\nHow to resolve: Upload it to the vault.",
    stepKey: "step_3_6",
    stepName: "Police certificate",
    stepNumber: 6,
    chapterIdx: 2,
    stepIdx: 5,
    ...over,
  });

  it("keeps unresolved critical/warning items and splits the hint", () => {
    const out = buildAlerts(
      [issue({}), issue({ level: "info", title: "FYI" }), issue({ title: "Done", resolved: true }), issue({ level: "warning", title: "Photos" })],
      []
    );
    expect(out.map((a) => [a.title, a.level])).toEqual([
      ["Police certificate", "blocking"],
      ["Photos", "check"],
    ]);
    expect(out[0]).toMatchObject({ where: "Chapter 3, Step 6", detail: "No certificate on file.", fix: "Upload it to the vault." });
  });

  it("drops dismissed alerts", () => {
    const a = issue({});
    expect(buildAlerts([a], [alertId(a)])).toEqual([]);
  });
});

describe("tracking never invents data", () => {
  const flags = { interviewAttended: false, isApPhase: false, isApprovedPhase: false, isJourneyComplete: false, today };

  it("an empty journey has no receipt, no dates and no facts", () => {
    const t = buildTracking({ metadata: {}, receiptRecord: null, ...flags });
    expect(t.receipt).toBeNull();
    expect(t.currentIndex).toBe(0);
    expect(t.stages.every((s) => s.status === "next" && !s.date && s.facts.length === 0)).toBe(true);
  });

  it("follows recorded data through NVC, DQ and interview", () => {
    const t = buildTracking({
      metadata: {
        receiptNum: "IOE0123456789",
        dqDate: "2026-06-02",
        currentSchedulingMonthYear: "2026-03",
        tracking_status: { interview_date: "2026-11-18", interview_embassy: "US Embassy" },
      },
      receiptRecord: null,
      nvcCaseNum: "ISL2026123456",
      ...flags,
    });
    expect(t.stages.map((s) => s.status)).toEqual(["done", "done", "next", "current", "next"]);
    expect(t.currentIndex).toBe(3);
    expect(t.receipt?.number).toBe("IOE0123456789");
    const nvc = t.stages[1];
    expect(nvc.title).toBe("Documentarily qualified");
    expect(nvc.facts.find((f) => f.label === "NVC case number")?.value).toBe("ISL2026123456");
    expect(nvc.facts.some((f) => f.label === "Estimated interview")).toBe(true);
  });

  it("shows the CEAC link and AP status once the interview is done", () => {
    const t = buildTracking({ metadata: { interviewOutcome: "221g" }, receiptRecord: null, ...flags, interviewAttended: true, isApPhase: true });
    const result = t.stages[4];
    expect(result).toMatchObject({ status: "current", title: "Refused under 221(g)", statusText: "221(g)", tone: "alert" });
    expect(result.links[0].href).toContain("ceac.state.gov");
  });

  it("estimates the interview window like the classic tracker", () => {
    const w = estimateInterviewWindow(new Date(2026, 5, 2), "2026-03", today)!;
    expect(w.monthsBehind).toBe(3);
    expect([w.from.getFullYear(), w.from.getMonth()]).toEqual([2027, 1]);
    expect(estimateInterviewWindow(new Date(2026, 5, 2), undefined, today)).toBeNull();
  });
});

describe("key dates and case health", () => {
  it("merges recorded dates with the user's events, oldest first", () => {
    const k = buildKeyDates(
      { medicalDate: "2026-07-14", medClinic: "Panel clinic", interviewDate: "2026-11-18" },
      null,
      parseEvents([{ id: "e1", title: "Collect PCC", day: "2026-09-01", time: "09:00", color: "#3b62a0" }])
    );
    expect(k.map((d) => d.title)).toEqual(["Medical exam", "Collect PCC", "Visa interview"]);
    expect(k[1]).toMatchObject({ custom: true, detail: "9:00 AM" });
  });

  it("uses the real score bands", () => {
    const base = {
      notStarted: false, loading: false, label: "Moderate", status: "good" as const,
      evidence: 60, consistency: 80,
      evidenceQuestions: { answered: 0, total: 5 }, consistencyQuestions: { answered: 0, total: 5 },
    };
    expect(buildCaseHealth({ ...base, score: 66 })).toMatchObject({ band: "moderate", pointsToNextBand: 4, nextBandLabel: "Strong" });
    expect(buildCaseHealth({ ...base, score: 75 }).pointsToNextBand).toBeNull();
    expect(buildCaseHealth({ ...base, score: 10, completeness: 20, riskPenalty: 40 }).factors.map((f) => f.key)).toEqual([
      "evidence", "consistency", "completeness", "risk",
    ]);
  });
});

describe("administrative processing", () => {
  it("finds the AP step by its tool type, only while it is visible", () => {
    const { findStepByToolType, AP_STEP_TOOL_TYPE } = jest.requireActual("@/lib/journey/dashboard/buildDashboardModel");
    const hidden = findStepByToolType(data, stateWith([]), helpers, AP_STEP_TOOL_TYPE);
    expect(hidden).toBeNull();
    const shown = findStepByToolType(
      data,
      stateWith([], { interviewOutcome: "221g", outcome221gSubtype: "further_review" }),
      helpers,
      AP_STEP_TOOL_TYPE
    );
    expect(shown).not.toBeNull();
    const raw = (ir5 as { chapters: { steps: { tool_data?: { type?: string } }[] }[] }).chapters;
    expect(raw[shown.chapterIndex].steps[shown.stepIndex].tool_data?.type).toBe(AP_STEP_TOOL_TYPE);
  });

  it("flags AP on the ticket and asks for details until they are saved", () => {
    const base = { interviewAttended: true, isApPhase: true, isApprovedPhase: false, isJourneyComplete: false, today };
    const t = buildTracking({ metadata: { interviewOutcome: "221g" }, receiptRecord: null, ...base });
    expect(t.ap).toMatchObject({ saved: false });
    expect(t.stages[4].note).toContain("Record your AP details");
    const saved = buildTracking({ metadata: { interviewOutcome: "221g", apSaved: "true" }, receiptRecord: null, ...base });
    expect(saved.ap?.saved).toBe(true);
    expect(saved.stages[4].note).toBeUndefined();
    expect(buildTracking({ metadata: {}, receiptRecord: null, ...base, isApPhase: false }).ap).toBeNull();
  });
});

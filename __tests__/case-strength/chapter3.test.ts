/**
 * Chapter 3 (Medical + Interview) case-strength smoke tests.
 *
 * Advisory engine only — NO numeric scoring is produced anywhere; these tests
 * assert that on purpose. The things Chapter 3 must get right:
 *   1. Timeline/completeness nudges for medical, polio, and the fresh PCC.
 *   2. Interview-readiness consistency: answers must match the filed DS-260,
 *      plus disclosure reminders derived from eligibility answers.
 *   3. The final readiness gate at the interview step.
 *   4. Dashboard aggregation that honors interview-outcome visibility gating.
 */

import {
  runStepChecks,
  aggregateChapter3Issues,
  type StepCheck,
} from "@/lib/case-strength";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Minimal WizardState shape the Chapter 3 checkers read. Cast at call sites. */
function makeState(
  metadata: Record<string, unknown> = {},
  completed: string[] = []
): any {
  return {
    metadata,
    answers: {},
    completedSteps: new Set<string>(completed),
    documentChecklist: {},
    docUploads: {},
    notes: {},
    filingType: "online",
  };
}

const baseCtx = {
  uploadedDocuments: [] as any[],
  eligibilityAnswers: undefined as any,
};

function titles(checks: StepCheck[]): string[] {
  return checks.map((c) => c.title);
}

// ── step_3_1 — schedule medical (timeline) ────────────────────────────────────

describe("step_3_1 — schedule medical examination", () => {
  it("info-level nudge when nothing is scheduled and no interview date yet", () => {
    const checks = runStepChecks("step_3_1", { ...baseCtx, state: makeState() });
    expect(checks).toHaveLength(1);
    expect(checks[0].level).toBe("info");
  });

  it("escalates to a warning once an interview date is set but no medical booked", () => {
    const checks = runStepChecks("step_3_1", {
      ...baseCtx,
      state: makeState({ interviewDate: "2026-08-01" }),
    });
    expect(checks.some((c) => c.level === "warning")).toBe(true);
  });

  it("stays quiet once the appointment is saved", () => {
    const checks = runStepChecks("step_3_1", {
      ...baseCtx,
      state: makeState({ med_appt_saved: "true", med_date: "2026-07-20" }),
    });
    expect(checks).toEqual([]);
  });
});

// ── step_3_3 — fresh police certificate (completeness + freshness) ────────────

describe("step_3_3 — fresh police clearance certificate", () => {
  it("warns to apply for a fresh PCC when none is tracked", () => {
    const checks = runStepChecks("step_3_3", { ...baseCtx, state: makeState() });
    expect(checks.some((c) => c.level === "warning" && /fresh police certificate/i.test(c.title))).toBe(
      true
    );
  });

  it("drops to an info reminder once applied but not yet received", () => {
    const checks = runStepChecks("step_3_3", {
      ...baseCtx,
      state: makeState({ pcc_saved: "true" }),
    });
    expect(checks).toHaveLength(1);
    expect(checks[0].level).toBe("info");
  });

  it("stays quiet once the original is received", () => {
    const checks = runStepChecks("step_3_3", {
      ...baseCtx,
      state: makeState({ pcc_saved: "true", pcc_received: "true" }),
    });
    expect(checks).toEqual([]);
  });
});

// ── step_3_6 — gather originals (completeness + consistency) ───────────────────

describe("step_3_6 — gather original documents", () => {
  const step = {
    step_key: "step_3_6",
    tool_data: {
      doc_gathering: {
        groups: [
          { id: "civil", label: "Bring — Original Civil Documents", badge: "Required", items: [] },
          {
            id: "interview-day",
            label: "Bring — Interview Day Items",
            badge: "Required if applicable",
            items: [],
          },
          { id: "organization", label: "Recommended — Organization Items", badge: "Recommended", items: [] },
        ],
      },
    },
  };

  it("lists only the Required original-document groups read from the JSON", () => {
    const checks = runStepChecks("step_3_6", { ...baseCtx, state: makeState(), step });
    const bring = checks.find((c) => /bring every required original/i.test(c.title));
    expect(bring).toBeDefined();
    // strips the "Bring — " prefix, keeps Required groups, drops the Recommended one
    expect(bring!.hint).toMatch(/Original Civil Documents/);
    expect(bring!.hint).toMatch(/Interview Day Items/);
    expect(bring!.hint).not.toMatch(/Organization Items/);
  });

  it("always surfaces the consistency reminder, even with no JSON groups", () => {
    const checks = runStepChecks("step_3_6", {
      ...baseCtx,
      state: makeState(),
      step: { step_key: "step_3_6" },
    });
    expect(checks.some((c) => /Originals must match what you filed/i.test(c.title))).toBe(true);
  });
});

// ── step_3_7 — interview prep (consistency + disclosures) ──────────────────────

describe("step_3_7 — prepare for interview", () => {
  it("always reminds that answers must match the DS-260", () => {
    const checks = runStepChecks("step_3_7", { ...baseCtx, state: makeState() });
    expect(checks.some((c) => /must match your DS-260/i.test(c.title))).toBe(true);
  });

  it("adds interview-framed disclosure reminders from eligibility answers", () => {
    const checks = runStepChecks("step_3_7", {
      ...baseCtx,
      state: makeState(),
      eligibilityAnswers: {
        q3: { q3s1: "beneficiary" },
        q5: { q5s1: "yes", q5s2: "yes", q5s4: "yes" },
      },
    });
    const t = titles(checks);
    expect(t).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/explain the prior marriage/i),
        expect.stringMatching(/visa refusal/i),
        expect.stringMatching(/court\/police record/i),
        expect.stringMatching(/overstay/i),
      ])
    );
  });
});

// ── step_3_8 — final readiness gate ────────────────────────────────────────────

describe("step_3_8 — attend visa interview", () => {
  it("warns when originals (step 3.6) were never gathered", () => {
    const checks = runStepChecks("step_3_8", { ...baseCtx, state: makeState() });
    expect(checks.some((c) => c.level === "warning" && /not gathered/i.test(c.title))).toBe(true);
  });

  it("clears the gate warnings once 3.6 and 3.7 are complete, keeping the logistics note", () => {
    const checks = runStepChecks("step_3_8", {
      ...baseCtx,
      state: makeState({}, ["step_3_6", "step_3_7"]),
    });
    expect(checks.some((c) => c.level === "warning")).toBe(false);
    expect(checks.some((c) => /No electronics/i.test(c.title))).toBe(true);
  });
});

// ── No-scoring guarantee ──────────────────────────────────────────────────────

describe("no numeric score is ever produced (Chapter 3)", () => {
  it("step checks expose only level/title/hint — never a score field", () => {
    for (const key of ["step_3_1", "step_3_3", "step_3_6", "step_3_7", "step_3_8", "step_3_10"]) {
      const checks = runStepChecks(key, {
        ...baseCtx,
        state: makeState({ interviewDate: "2026-08-01" }),
        step: { step_key: key },
      });
      for (const c of checks) {
        expect(c).not.toHaveProperty("score");
        expect(["info", "warning", "critical"]).toContain(c.level);
      }
    }
  });
});

// ── Dashboard aggregation + interview-outcome visibility gating ────────────────

describe("aggregateChapter3Issues", () => {
  const chapters = [
    { steps: [] }, // chapter 1 placeholder
    { steps: [] }, // chapter 2 placeholder
    {
      steps: [
        { step_key: "step_3_9", step_name: "Confirm Interview Outcome", step_number: 9 },
        {
          step_key: "step_3_10",
          step_name: "Track Visa Issuance",
          step_number: 10,
          visible_when: { interviewOutcome: "approved" },
        },
      ],
    },
  ];

  it("hides outcome-gated steps until the matching outcome is recorded", () => {
    const issues = aggregateChapter3Issues({
      chapters,
      state: makeState(), // no interviewOutcome → step_3_10 not visible
      uploadedDocuments: [],
    });
    expect(issues.some((i) => i.stepKey === "step_3_9")).toBe(true);
    expect(issues.some((i) => i.stepKey === "step_3_10")).toBe(false);
  });

  it("surfaces the approved-path check once the interview outcome is approved", () => {
    const issues = aggregateChapter3Issues({
      chapters,
      state: makeState({ interviewOutcome: "approved" }),
      uploadedDocuments: [],
    });
    const visa = issues.find((i) => i.stepKey === "step_3_10");
    expect(visa).toBeDefined();
    expect(visa!.chapterIdx).toBe(2);
    expect(visa!.stepIdx).toBe(1); // raw index into chapter.steps
    // outcome recorded → step_3_9 nudge gone
    expect(issues.some((i) => i.stepKey === "step_3_9")).toBe(false);
  });

  it("returns an empty list when chapter 3 is absent", () => {
    expect(
      aggregateChapter3Issues({ chapters: [], state: makeState(), uploadedDocuments: [] })
    ).toEqual([]);
  });
});

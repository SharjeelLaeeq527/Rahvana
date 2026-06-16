/**
 * Chapter 2 (NVC / CEAC) case-strength smoke tests.
 *
 * Covers the advisory engine — NO numeric scoring is produced anywhere; these
 * tests assert that on purpose. The three things Chapter 2 must get right:
 *   1. Cross-form consistency (I-130 baseline vs DS-260 baseline) at step_2_3.
 *   2. Mandatory DS-260 disclosures derived from eligibility answers.
 *   3. Civil-document completeness/conditional analysis at step_2_4.
 * Plus the dashboard aggregation that rolls these up.
 */

import {
  compareBaselines,
  BASELINE_FIELDS,
  runStepChecks,
  aggregateChapter2Issues,
  type StepCheck,
} from "@/lib/case-strength";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Minimal WizardState shape the Chapter 2 checkers read. Cast at call sites. */
function makeState(metadata: Record<string, unknown> = {}): any {
  return {
    metadata,
    answers: {},
    completedSteps: new Set<string>(),
    documentChecklist: {},
    docUploads: {},
    notes: {},
  };
}

const baseCtx = {
  uploadedDocuments: [] as any[],
  eligibilityAnswers: undefined as any,
};

const I130 = {
  marriageDate: "2022-05-10",
  petitionerDateOfBirth: "1990-01-01",
  beneficiaryDateOfBirth: "1992-03-15",
  capturedAt: "2024-01-01T00:00:00.000Z",
};

function titles(checks: StepCheck[]): string[] {
  return checks.map((c) => c.title);
}

// ── compareBaselines (pure) ───────────────────────────────────────────────────

describe("compareBaselines", () => {
  it("returns no mismatches when both forms agree", () => {
    expect(compareBaselines(I130, { ...I130 })).toEqual([]);
  });

  it("flags every field that differs", () => {
    const ds260 = {
      ...I130,
      marriageDate: "2022-05-11", // off by one day
      beneficiaryDateOfBirth: "1992-03-16",
    };
    const out = compareBaselines(I130, ds260);
    expect(out.map((m) => m.field).sort()).toEqual([
      "beneficiaryDateOfBirth",
      "marriageDate",
    ]);
    const marriage = out.find((m) => m.field === "marriageDate")!;
    expect(marriage.i130Value).toBe("2022-05-10");
    expect(marriage.ds260Value).toBe("2022-05-11");
  });

  it("only compares fields present on BOTH sides", () => {
    expect(compareBaselines(I130, { marriageDate: "2022-05-10" })).toEqual([]);
    expect(compareBaselines(I130, {})).toEqual([]);
    expect(compareBaselines(null, I130)).toEqual([]);
    expect(compareBaselines(undefined, undefined)).toEqual([]);
  });

  it("ignores surrounding whitespace", () => {
    expect(compareBaselines(I130, { ...I130, marriageDate: " 2022-05-10 " })).toEqual([]);
  });

  it("exposes exactly the three comparable fields", () => {
    expect(BASELINE_FIELDS.map((f) => f.field)).toEqual([
      "marriageDate",
      "petitionerDateOfBirth",
      "beneficiaryDateOfBirth",
    ]);
  });
});

// ── step_2_3 checker (consistency + disclosures) ──────────────────────────────

describe("step_2_3 — DS-260 consistency checker", () => {
  it("warns when no I-130 baseline has been captured", () => {
    const checks = runStepChecks("step_2_3", { ...baseCtx, state: makeState() });
    expect(checks.some((c) => c.level === "warning" && /baseline not captured/i.test(c.title))).toBe(
      true
    );
  });

  it("nudges the user to enter DS-260 dates once the I-130 baseline exists", () => {
    const checks = runStepChecks("step_2_3", {
      ...baseCtx,
      state: makeState({ consistencyBaseline: I130 }),
    });
    expect(checks.some((c) => c.level === "info" && /Match these/i.test(c.title))).toBe(true);
    expect(checks.some((c) => c.level === "critical")).toBe(false);
  });

  it("confirms a match when both baselines agree", () => {
    const checks = runStepChecks("step_2_3", {
      ...baseCtx,
      state: makeState({ consistencyBaseline: I130, ds260Baseline: { ...I130 } }),
    });
    expect(checks.some((c) => /match your I-130/i.test(c.title))).toBe(true);
    expect(checks.some((c) => c.level === "critical")).toBe(false);
  });

  it("raises a CRITICAL per field when the DS-260 diverges from the I-130", () => {
    const ds260 = { ...I130, marriageDate: "2022-06-01" };
    const checks = runStepChecks("step_2_3", {
      ...baseCtx,
      state: makeState({ consistencyBaseline: I130, ds260Baseline: ds260 }),
    });
    const crit = checks.filter((c) => c.level === "critical");
    expect(crit).toHaveLength(1);
    expect(crit[0].title).toMatch(/does not match I-130: Marriage date/i);
  });

  it("adds mandatory-disclosure reminders from eligibility answers", () => {
    const checks = runStepChecks("step_2_3", {
      ...baseCtx,
      state: makeState({ consistencyBaseline: I130, ds260Baseline: { ...I130 } }),
      eligibilityAnswers: {
        q3: { q3s1: "petitioner" },
        q5: { q5s1: "yes", q5s2: "yes", q5s4: "yes" },
      },
    });
    const t = titles(checks);
    expect(t).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Declare the prior marriage/i),
        expect.stringMatching(/visa refusal/i),
        expect.stringMatching(/court\/police record/i),
        expect.stringMatching(/overstay/i),
      ])
    );
  });
});

// ── step_2_4 checker (civil documents) ────────────────────────────────────────

describe("step_2_4 — civil document checker", () => {
  const step = {
    step_key: "step_2_4",
    tool_data: {
      doc_list: {
        groups: [
          {
            id: "required",
            items: [{ id: "birth_cert", title: "Zzz Nonexistent Birth Record", required: true }],
          },
          {
            id: "conditional",
            items: [
              {
                id: "divorce_decree",
                title: "Zzz Nonexistent Divorce Decree",
                tags: ["prior_marriage"],
              },
            ],
          },
        ],
      },
    },
  };

  it("flags a missing required civil document as critical", () => {
    const checks = runStepChecks("step_2_4", {
      ...baseCtx,
      state: makeState(),
      step,
    });
    expect(checks.some((c) => c.level === "critical")).toBe(true);
  });

  it("returns nothing when there is no doc_list", () => {
    const checks = runStepChecks("step_2_4", {
      ...baseCtx,
      state: makeState(),
      step: { step_key: "step_2_4" },
    });
    expect(checks).toEqual([]);
  });
});

// ── No-scoring guarantee ──────────────────────────────────────────────────────

describe("no numeric score is ever produced", () => {
  it("step checks expose only level/title/hint — never a score field", () => {
    const checks = runStepChecks("step_2_3", {
      ...baseCtx,
      state: makeState({ consistencyBaseline: I130, ds260Baseline: { ...I130, marriageDate: "x" } }),
    });
    for (const c of checks) {
      expect(c).not.toHaveProperty("score");
      expect(["info", "warning", "critical"]).toContain(c.level);
    }
  });
});

// ── Dashboard aggregation ─────────────────────────────────────────────────────

describe("aggregateChapter2Issues", () => {
  const chapters = [
    { steps: [] }, // chapter 1 placeholder
    {
      steps: [
        { step_key: "step_2_3", step_name: "Complete Form DS-260", step_number: 3 },
        { step_key: "step_2_4", step_name: "Prepare Civil Documents", step_number: 4 },
      ],
    },
  ];

  it("rolls up critical DS-260 mismatches and tags them to chapter 2", () => {
    const issues = aggregateChapter2Issues({
      chapters,
      state: makeState({
        consistencyBaseline: I130,
        ds260Baseline: { ...I130, petitionerDateOfBirth: "1991-01-01" },
      }),
      uploadedDocuments: [],
    });
    const crit = issues.find((i) => i.level === "critical");
    expect(crit).toBeDefined();
    expect(crit!.chapterIdx).toBe(1);
    expect(crit!.stepKey).toBe("step_2_3");
    // sorted critical-first
    expect(issues[0].level).toBe("critical");
  });

  it("returns an empty list when chapter 2 is absent", () => {
    expect(
      aggregateChapter2Issues({ chapters: [], state: makeState(), uploadedDocuments: [] })
    ).toEqual([]);
  });
});

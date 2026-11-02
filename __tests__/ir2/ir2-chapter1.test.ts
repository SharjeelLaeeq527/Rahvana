/**
 * IR-2 chapter 1 content (Phase 1, docs/ir2-implementation-plan.md).
 * Risk: the restored eligibility quest gives a "pass" to a case IR-2 cannot cover (married
 * child, guardianship, green card holder parent), its result_logic throws at runtime (it is
 * evaluated with `new Function` in QuestRenderer), or the document list uses ids / tags /
 * groups / guide links the StepView document list cannot show.
 */

import fs from "fs";
import path from "path";
import ir2 from "@/data/visa-category/ir-2.json";

type Answers = Record<string, string | string[]>;
interface Quest {
  id: string;
  screens: Array<{ id: string; type: string; options: Array<{ value: string }> }>;
  result_logic: string;
}
interface DocItem {
  id: string;
  tag: string;
  group: string;
  guideUrl: string;
}
interface Step {
  step_key: string;
  step_type: string;
  pending_step_type?: string;
  legal_review?: string;
  quest_data?: { id: string; quests: Quest[] };
  document_items?: DocItem[];
}
interface Journey {
  chapters: Array<{ chapter_key: string; steps: Step[] }>;
}

const data = ir2 as unknown as Journey;
const chapter1 = data.chapters.find((c) => c.chapter_key === "chapter_1")!;
const stepOf = (key: string): Step => chapter1.steps.find((s) => s.step_key === key)!;
const quests = stepOf("step_1_1").quest_data!.quests;
const questOf = (id: string): Quest => quests.find((q) => q.id === id)!;

// Same evaluation QuestRenderer uses.
function run(questId: string, answers: Answers): { state: string; title: string } {
  const fn = new Function("answers", `return ${questOf(questId).result_logic}`);
  return fn(answers);
}

describe("IR-2 chapter 1: every step restored", () => {
  it("has no placeholder step left in chapter 1", () => {
    expect(chapter1.steps.filter((s) => s.pending_step_type).map((s) => s.step_key)).toEqual([]);
  });

  it("marks the eligibility, documents and RFE steps as pending legal review", () => {
    for (const key of ["step_1_1", "step_1_2", "step_1_19"]) {
      expect([key, stepOf(key).legal_review]).toEqual([key, "pending"]);
    }
  });
});

describe("IR-2 eligibility quest", () => {
  it("keeps the suite id and the shared screening screens the detectors read", () => {
    expect(stepOf("step_1_1").quest_data!.id).toBe("eligibility-suite");
    const q5 = questOf("q5").screens.map((s) => s.id);
    expect(q5).toEqual(expect.arrayContaining(["q5s1", "q5s2", "q5s3", "q5s5"]));
  });

  it("evaluates every quest's result_logic without throwing on empty answers", () => {
    for (const q of quests) {
      expect(() => run(q.id, {})).not.toThrow();
      expect(["pass", "caution", "review", "stop"]).toContain(run(q.id, {}).state);
    }
  });

  it("stops a green card holder parent", () => {
    expect(run("q1", { q1s1: "lpr" }).state).toBe("stop");
    expect(run("q1", { q1s1: "citizen", q1s3: "naturalized", q1s4: "yes", q1s5: "match" }).state).toBe(
      "pass"
    );
  });

  it("stops a married child and a guardian-only relationship", () => {
    const base = { q2s1: "bio_mother", q2s2: "under_14", q2s3: "never_married", q2s4: "yes", q2s5: "yes" };
    expect(run("q2", base).state).toBe("pass");
    expect(run("q2", { ...base, q2s3: "married" }).state).toBe("stop");
    expect(run("q2", { ...base, q2s1: "guardian_other" }).state).toBe("stop");
  });

  it("never passes a child aged 21 or older, and warns when close to 21", () => {
    const base = { q2s1: "bio_mother", q2s3: "never_married", q2s4: "yes", q2s5: "yes" };
    expect(run("q2", { ...base, q2s2: "21_plus" }).state).toBe("review");
    expect(run("q2", { ...base, q2s2: "18_20" }).state).toBe("caution");
  });

  it("never treats a guardianship order as a qualifying adoption (D4)", () => {
    const result = run("q3", { q2s1: "adopted", q3s5: "yes", q3s6: "yes", q3s7: "guardianship" });
    expect(result.state).not.toBe("pass");
    expect(result.title).toMatch(/guardianship/i);
  });

  it("stops a step-relationship created after 18 and flags a CR-2 stepchild", () => {
    expect(run("q3", { q2s1: "stepchild", q3s3: "no" }).state).toBe("stop");
    expect(run("q3", { q2s1: "stepchild", q3s3: "yes", q3s4: "no" }).title).toMatch(/CR-2/);
  });
});

describe("IR-2 document list (step_1_2)", () => {
  const docs = stepOf("step_1_2").document_items!;
  // StepView document list: GROUP_ORDER and the tag -> chip mapping.
  const SHOWN_GROUPS = [
    "Required Now",
    "Required if Applicable",
    "USCIS Intake Order",
    "Supporting Evidence",
    "Gather Now for Later",
  ];

  it("uses unique ids", () => {
    expect(new Set(docs.map((d) => d.id)).size).toBe(docs.length);
  });

  it("only uses groups the document list renders", () => {
    for (const d of docs) expect([d.id, SHOWN_GROUPS.includes(d.group)]).toEqual([d.id, true]);
  });

  it("only uses role tags the document list maps", () => {
    for (const d of docs) {
      expect([d.id, ["petitioner", "beneficiary", "both"].includes(d.tag)]).toEqual([d.id, true]);
    }
  });

  it("links only to guide pages that exist", () => {
    const guidesDir = path.join(process.cwd(), "app", "(tools)", "guides");
    for (const d of docs) {
      const slug = d.guideUrl.replace(/^\/guides\/?/, "");
      if (!slug) continue;
      expect([d.guideUrl, fs.existsSync(path.join(guidesDir, slug))]).toEqual([d.guideUrl, true]);
    }
  });

  it("covers the child-specific documents", () => {
    expect(docs.map((d) => d.id)).toEqual(
      expect.arrayContaining([
        "doc_child_birth_cert",
        "doc_child_crc",
        "doc_legitimation",
        "doc_custody_consent",
        "doc_adoption_decree",
      ])
    );
  });
});

/**
 * IR-2 journey JSON (Phase 0b skeleton, docs/ir2-implementation-plan.md).
 * Risk: ir-2.json drifts from the IR-5 step keys (every step-keyed map then misses IR-2),
 * shows IR-5 parent content under the IR-2 name, hands a renderer a step without the data its
 * step_type needs, or ships unreviewed legal copy without the review marker.
 */

import ir2 from "@/data/visa-category/ir-2.json";
import ir5 from "@/data/visa-category/ir-5.json";
import { ConfigLoader } from "@/lib/journey/config-loader";
import { getActiveStepsForStage } from "@/app/components/journey-engine/journeyHelpers";
import type { RoadmapDataV3 } from "@/app/components/journey-engine/types";

interface Step {
  step_key: string;
  step_type?: string;
  visible_when?: unknown;
  dependencies?: unknown;
  legal_review?: string;
  step_description?: string;
  filing_data?: { methods?: unknown };
  [field: string]: unknown;
}
interface Journey {
  journey_type: string;
  stages?: unknown;
  content_review: { status: string };
  chapters: Array<{ chapter_key: string; steps: Step[] }>;
}

const data = ir2 as unknown as Journey;
const parent = ir5 as unknown as Journey;
const steps = (d: Journey): Step[] => d.chapters.flatMap((c) => c.steps);
const stepOf = (key: string): Step => steps(data).find((x) => x.step_key === key) as Step;
const text = JSON.stringify(ir2);

describe("ir-2.json structure", () => {
  it("is a chapters-schema IR2 journey", () => {
    expect(data.journey_type).toBe("IR2");
    expect(Array.isArray(data.chapters)).toBe(true);
    expect(data.stages).toBeUndefined();
  });

  it("keeps the IR-5 chapter and step keys in the same order", () => {
    expect(data.chapters.map((c) => c.chapter_key)).toEqual(
      parent.chapters.map((c) => c.chapter_key)
    );
    expect(steps(data).map((s) => s.step_key)).toEqual(steps(parent).map((s) => s.step_key));
  });

  it("keeps every step's visibility rules and dependencies", () => {
    const byKey = new Map(steps(parent).map((s) => [s.step_key, s]));
    for (const s of steps(data)) {
      const p = byKey.get(s.step_key) as Step;
      expect([s.step_key, s.visible_when]).toEqual([s.step_key, p.visible_when]);
      expect([s.step_key, s.dependencies]).toEqual([s.step_key, p.dependencies]);
    }
  });

  it("gives every step the data its step_type renderer needs", () => {
    const required: Record<string, string> = {
      quest: "quest_data",
      guide: "guide_data",
      docs: "document_items",
      tool: "tool_data",
      action: "action_data",
      filing: "filing_data",
    };
    for (const s of steps(data)) {
      const field = required[s.step_type ?? ""];
      if (field) expect([s.step_key, field, s[field] != null]).toEqual([s.step_key, field, true]);
    }
  });

  it("seeds through the same config loader path as IR-1 / IR-5", () => {
    const loaded = ConfigLoader.loadJourneyJSON("data/visa-category/ir-2.json");
    const chapters = ConfigLoader.transformChaptersInput(loaded.chapters);
    expect(chapters).toHaveLength(3);
    for (const ch of loaded.chapters) {
      const inputs = ConfigLoader.transformStepsInput(ch.steps, ch.chapter_key);
      expect(inputs.length).toBe(ch.steps.length);
    }
  });
});

describe("ir-2.json filing-method branches", () => {
  const visibleKeys = (metadata: Record<string, unknown>) =>
    getActiveStepsForStage(data as unknown as RoadmapDataV3, 0, metadata).map((s) => s.step_key);

  it("shows the online steps for an online filing and hides the paper ones", () => {
    const keys = visibleKeys({ filingMethod: "online", filingMethodConfirmed: true });
    expect(keys).toEqual(expect.arrayContaining(["step_1_5", "step_1_9"]));
    expect(keys).not.toContain("step_1_10");
  });

  it("shows the paper steps for a paper filing and hides the online ones", () => {
    const keys = visibleKeys({ filingMethod: "paper", filingMethodConfirmed: true });
    expect(keys).toEqual(expect.arrayContaining(["step_1_10", "step_1_13"]));
    expect(keys).not.toContain("step_1_5");
  });

  it("keeps the filing-method chooser (step_1_3) working", () => {
    const s = stepOf("step_1_3");
    expect(s.step_type).toBe("filing");
    expect(s.filing_data?.methods).toBeTruthy();
  });
});

describe("ir-2.json content safety", () => {
  it("carries the pending legal review marker (D6)", () => {
    expect(data.content_review.status).toBe("pending_legal_review");
  });

  it("marks every step that uses drafted IR-2 legal text as pending review", () => {
    const drafted = ["step_1_1", "step_1_2", "step_1_19", "step_2_4", "step_3_6"];
    for (const key of drafted) {
      expect([key, stepOf(key).legal_review]).toEqual([key, "pending"]);
    }
  });

  it("never names IR-5 or a parent beneficiary (asset paths excepted)", () => {
    const withoutAssets = text.replace(/\/assets\/[^"'\s]*/g, "");
    expect(withoutAssets).not.toMatch(/\bIR-?5\b/i);
    expect(withoutAssets).not.toMatch(/parent beneficiary/i);
  });

  it("warns that guardianship is not automatically an adoption (D4)", () => {
    const s = stepOf("step_1_2");
    expect(s.step_description).toMatch(/guardianship/i);
    expect(s.step_description).toMatch(/immigration attorney/i);
  });

  it("uses plain ASCII punctuation in copy (no em/en dash, curly quotes, ellipsis)", () => {
    expect(text).not.toMatch(/[–—‘’“”…§]/);
  });
});

/**
 * CSPA checker wiring: journey toolbox, entitlement, IR-2 steps, and journey pre-fill.
 * Risk: the tool shows up on spouse / parent journeys (where age-out does not apply), gets a
 * plan lock although it is free, a step points at a componentKey nothing can open, or the
 * journey pre-fill picks up the wrong person's data.
 */

import fs from "fs";
import path from "path";
import ir2 from "@/data/visa-category/ir-2.json";
import { getJourneyAppGroups, TOOL_FEATURE_MAP } from "@/lib/constants/journey-app-groups";
import {
  CSPA_METADATA_KEY,
  cspaInputFromJourney,
  toCspaJourneyRecord,
} from "@/lib/tools/cspa/journeyPrefill";
import { checkCspa, type CspaInput } from "@/lib/tools/cspa/ageOut";

const toolKeys = (category: string | null) =>
  getJourneyAppGroups(category)
    .flatMap((g) => g.items)
    .map((i) => i.componentKey);

describe("journey toolbox", () => {
  it("shows the CSPA checker on child journeys only", () => {
    for (const c of ["IR-2", "IR2", "ir2_candidate-2", "CR-2"]) {
      expect([c, toolKeys(c).includes("cspa_checker")]).toEqual([c, true]);
    }
    for (const c of ["IR-1", "IR-5", "CR-1", "ir5_candidate-2"]) {
      expect([c, toolKeys(c).includes("cspa_checker")]).toEqual([c, false]);
    }
  });

  it("keeps every other toolbox item unchanged for IR-1 and IR-5", () => {
    expect(toolKeys("IR-1")).toContain("sponsorship_calculator");
    expect(toolKeys("IR-5")).toContain("dq_status_check");
  });

  it("is free: the toolbox feature map has no entitlement for it", () => {
    expect(Object.prototype.hasOwnProperty.call(TOOL_FEATURE_MAP, "cspa_checker")).toBe(true);
    expect(TOOL_FEATURE_MAP.cspa_checker).toBeNull();
  });

  it("is opened by EmbeddedToolContainer", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "app/components/journey-engine/EmbeddedToolContainer.tsx"),
      "utf8"
    );
    expect(src).toContain('case "cspa_checker"');
  });
});

describe("IR-2 steps point at the checker", () => {
  type Step = {
    step_key: string;
    quest_data?: { quests: Array<{ id: string; companion_tool?: { component_key: string } }> };
    tool_data?: { companion_tool?: { component_key: string } };
  };
  const steps = (ir2 as unknown as { chapters: Array<{ steps: Step[] }> }).chapters.flatMap(
    (c) => c.steps
  );
  const companions = steps.flatMap((s) => [
    ...(s.quest_data?.quests ?? []).flatMap((q) => (q.companion_tool ? [q.companion_tool] : [])),
    ...(s.tool_data?.companion_tool ? [s.tool_data.companion_tool] : []),
  ]);

  it("has the card on the child eligibility quest and the I-130 step", () => {
    const q2 = steps.find((s) => s.step_key === "step_1_1")!.quest_data!.quests.find((q) => q.id === "q2")!;
    expect(q2.companion_tool?.component_key).toBe("cspa_checker");
    expect(steps.find((s) => s.step_key === "step_1_4")!.tool_data?.companion_tool?.component_key).toBe(
      "cspa_checker"
    );
  });

  it("only uses componentKeys the IR-2 toolbox offers", () => {
    const available = toolKeys("IR-2");
    for (const c of companions) expect([c.component_key, available.includes(c.component_key)]).toEqual([c.component_key, true]);
  });
});

describe("journey pre-fill", () => {
  const questMeta = {
    "questAnswers_eligibility-suite": { q2: { q2s1: "stepchild", q2s3: "never_married" } },
  };

  it("uses the candidate's date of birth and the quest answers", () => {
    expect(cspaInputFromJourney(questMeta, "2008-05-01")).toEqual({
      dateOfBirth: "2008-05-01",
      relationship: "stepchild",
      maritalStatus: "never_married",
    });
  });

  it("prefers a saved check over the quest answers", () => {
    const input: CspaInput = {
      dateOfBirth: "2007-01-01",
      maritalStatus: "never_married",
      relationship: "biological",
      i130Filed: true,
      filingDate: "2026-01-01",
      parentStatusAtFiling: "citizen",
    };
    const record = toCspaJourneyRecord(input, checkCspa(input, "2026-11-04"));
    expect(record.status).toBe("protected");
    expect(cspaInputFromJourney({ ...questMeta, [CSPA_METADATA_KEY]: record }, "2008-05-01")).toEqual(
      input
    );
  });

  it("ignores missing or malformed data", () => {
    expect(cspaInputFromJourney(null, null)).toEqual({});
    expect(cspaInputFromJourney({ "questAnswers_eligibility-suite": { q2: { q2s1: "guardian_other" } } }, "05/01/2008")).toEqual({});
  });
});

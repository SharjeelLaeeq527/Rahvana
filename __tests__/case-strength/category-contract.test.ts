/**
 * Case-strength category contract.
 *
 * Runs against every chapters-schema journey in data/visa-category/*.json, so a
 * new visa category is checked the moment its JSON lands:
 *   1. Its case-strength coverage is a deliberate decision: either a registered
 *      profile, or listed in AWAITING_PROFILE (gets GENERIC_PROFILE until then).
 *   2. Every step_key a profile attaches a checker or look-ahead rule to exists
 *      in that category's JSON. Checkers are keyed by step_key, and step keys are
 *      positional (IR-5 has no I-130A step, so its online steps sit one key lower
 *      than IR-1's). A key that is missing from the JSON means the check never
 *      runs, or was written for another category's layout.
 * See docs/case_strength_analysis.md section 3 ("Adding a visa category").
 */

import fs from "fs";
import path from "path";
import {
  CASE_STRENGTH_PROFILES,
  findCaseStrengthProfile,
  resolveCaseStrengthProfile,
  GENERIC_PROFILE,
} from "@/lib/case-strength/categories";

const DIR = path.join(process.cwd(), "data", "visa-category");

/**
 * Chapters-schema journeys that knowingly run on GENERIC_PROFILE for now.
 * Remove an entry when its `categories/<slug>.ts` is registered.
 */
const AWAITING_PROFILE: Record<string, string> = {
  "ir-2.json": "IR-2 profile is Phase 5 of docs/ir2-implementation-plan.md",
};

interface JourneyJson {
  journey_type?: string;
  chapters?: Array<{ steps: Array<{ step_key: string }> }>;
}

const journeys = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .map((file) => ({ file, json: JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8")) as JourneyJson }))
  .filter(({ json }) => Array.isArray(json.chapters));

const stepKeysOf = (json: JourneyJson) =>
  new Set(json.chapters!.flatMap((c) => c.steps.map((s) => s.step_key)));

describe("case-strength category contract", () => {
  it("finds the chapters-schema journeys", () => {
    expect(journeys.map((j) => j.file)).toEqual(expect.arrayContaining(["ir-1.json", "ir-5.json"]));
  });

  describe.each(journeys.map((j) => [j.file, j.json] as const))("%s", (file, json) => {
    it("has a registered profile, or is knowingly awaiting one", () => {
      const profile = findCaseStrengthProfile(json.journey_type);
      if (file in AWAITING_PROFILE) {
        expect(profile).toBeNull();
        expect(resolveCaseStrengthProfile(json.journey_type)).toBe(GENERIC_PROFILE);
      } else {
        expect(profile).not.toBeNull();
      }
    });

    it("every step checker / look-ahead key exists in this journey's JSON", () => {
      const profile = resolveCaseStrengthProfile(json.journey_type);
      const keys = stepKeysOf(json);
      const missing = [
        ...Object.keys(profile.stepCheckers),
        ...(profile.lookAhead ?? []).map((r) => r.stepKey),
      ].filter((k) => !keys.has(k));
      expect(missing).toEqual([]);
    });
  });

  it("every registered profile is used by at least one journey JSON", () => {
    const used = new Set(journeys.map((j) => findCaseStrengthProfile(j.json.journey_type)?.id));
    for (const p of CASE_STRENGTH_PROFILES) expect([p.id, used.has(p.id)]).toEqual([p.id, true]);
  });
});

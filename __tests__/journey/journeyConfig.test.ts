/**
 * journeyConfig tests.
 * Risk: the seeding paths (provisioning, journeys/initialize, sync-steps) resolve a journey to
 * the wrong JSON (IR-2 seeded with IR-1 steps) or to a file that does not exist (cr-2.json),
 * or the shared resolver changes what IR-1 / IR-5 already load.
 */

import fs from "fs";
import path from "path";
import {
  hasJourneyConfig,
  journeyBaseCategory,
  journeyConfigKeyFor,
  journeyConfigPathFor,
} from "@/lib/journey/journeyConfig";

describe("journeyConfigKeyFor", () => {
  it.each(["IR2", "ir2", "IR-2", "ir2_candidate-2", "IR-2 / CR-2", "CR-2", "cr2_candidate-3"])(
    "%s -> ir-2",
    (input) => {
      expect(journeyConfigKeyFor(input)).toBe("ir-2");
    }
  );

  it("keeps IR-1 and IR-5 exactly as before", () => {
    expect(journeyConfigKeyFor("IR1")).toBe("ir-1");
    expect(journeyConfigKeyFor("IR-1 / CR-1")).toBe("ir-1");
    expect(journeyConfigKeyFor("IR5")).toBe("ir-5");
    expect(journeyConfigKeyFor("ir5_candidate-2")).toBe("ir-5");
  });

  it("leaves categories without their own config on the old <base> naming", () => {
    // Unchanged pre-existing behavior; only IR-2 / CR-2 were added.
    expect(journeyConfigKeyFor("CR-1")).toBe("cr-1");
    expect(hasJourneyConfig("CR-1")).toBe(false);
    expect(hasJourneyConfig("F-2A")).toBe(false);
  });

  it("every category with a config points at a file that exists", () => {
    for (const input of ["IR-1", "IR-2", "CR-2", "IR-5"]) {
      expect(hasJourneyConfig(input)).toBe(true);
      expect(fs.existsSync(path.join(process.cwd(), journeyConfigPathFor(input)))).toBe(true);
    }
  });
});

describe("journeyBaseCategory", () => {
  it("files CR-2 under the IR-2 journey and leaves others alone", () => {
    expect(journeyBaseCategory("CR-2")).toBe("IR-2");
    expect(journeyBaseCategory("IR-2 / CR-2")).toBe("IR-2");
    expect(journeyBaseCategory("IR-1 / CR-1")).toBe("IR-1");
    expect(journeyBaseCategory("CR-1")).toBe("CR-1");
    expect(journeyBaseCategory("IR-5")).toBe("IR-5");
  });
});

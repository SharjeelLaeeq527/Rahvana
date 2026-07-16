/**
 * Numeric CaseStrengthEngine — financial signal (Signal 2).
 *
 * The v3 journey (IR-5 parent, and any calculator-driven case) records the
 * Sponsorship Calculator verdict in case_data under "sponsorshipResult" and
 * never populates the legacy sponsor_annual_income / household_size keys. These
 * tests lock in that:
 *   - an ELIGIBLE calculator result gives income credit (no LOW_INCOME flag),
 *   - an INELIGIBLE result still flags LOW_INCOME,
 *   - the legacy flat-income path is unchanged for IR-1 (no calculator result).
 *
 * We mock the data-access layer and pass a stub CaseDataService so the engine
 * runs without Supabase or the (circular) real service module.
 */

import { CaseStrengthEngine } from "@/lib/journey/CaseStrengthEngine";
import * as db from "@/lib/journey/data-access";

// Keep the engine's `import { CaseDataService } from "./service"` from pulling in
// the real service (which builds a Supabase client and imports this engine back).
jest.mock("@/lib/journey/service", () => ({ CaseDataService: class {} }));

jest.mock("@/lib/journey/data-access", () => ({
  getJourneyDocumentsDB: jest.fn(),
  getJourneyDB: jest.fn(),
}));

const mockedDb = db as jest.Mocked<typeof db>;

/** Build an engine whose case_data is `allData` and journey is `journeyType`. */
function makeEngine(allData: Record<string, unknown>, journeyType = "IR5") {
  mockedDb.getJourneyDocumentsDB.mockResolvedValue([] as never);
  mockedDb.getJourneyDB.mockResolvedValue({
    journey_type: journeyType,
    completion_percentage: 0,
  } as never);

  const service = {
    getCaseProfile: jest.fn().mockResolvedValue({ all_data: allData }),
    setCaseData: jest.fn().mockResolvedValue(undefined),
  };
  return new CaseStrengthEngine(service as never);
}

const hasLowIncome = (flags: Array<{ code: string }>) =>
  flags.some((f) => f.code === "LOW_INCOME");

describe("CaseStrengthEngine financial signal — sponsorshipResult", () => {
  it("IR-5: an eligible calculator result gives credit and no LOW_INCOME flag", async () => {
    const engine = makeEngine({
      sponsorshipResult: {
        data_value: { isEligible: true, requiredIncome: 30000, totalIncome: 50000 },
      },
    });
    const score = await engine.calculateJourneyStrength("j1");
    expect(hasLowIncome(score.risk_flags)).toBe(false);
    expect(score.positive_signals.some((s) => /income|guidelines|requirement/i.test(s))).toBe(true);
  });

  it("IR-5: a comfortable margin (>125% of the threshold) reads as 'comfortably exceeds'", async () => {
    const engine = makeEngine({
      sponsorshipResult: {
        data_value: { isEligible: true, requiredIncome: 30000, totalIncome: 40000 },
      },
    });
    const score = await engine.calculateJourneyStrength("j1");
    expect(score.positive_signals.some((s) => /comfortably exceeds/i.test(s))).toBe(true);
  });

  it("IR-5: eligibility via a joint sponsor / household member is credited as such", async () => {
    const engine = makeEngine({
      sponsorshipResult: {
        data_value: {
          isEligible: true,
          requiredIncome: 30000,
          totalIncome: 32000,
          jsIncome: 20000,
        },
      },
    });
    const score = await engine.calculateJourneyStrength("j1");
    expect(hasLowIncome(score.risk_flags)).toBe(false);
    expect(score.positive_signals.some((s) => /joint sponsor|household member/i.test(s))).toBe(true);
  });

  it("IR-5: an ineligible calculator result flags LOW_INCOME", async () => {
    const engine = makeEngine({
      sponsorshipResult: {
        data_value: { isEligible: false, requiredIncome: 30000, totalIncome: 10000 },
      },
    });
    const score = await engine.calculateJourneyStrength("j1");
    expect(hasLowIncome(score.risk_flags)).toBe(true);
  });

  it("self-petition (I-864W, requiredIncome 0) is credited, never flagged", async () => {
    const engine = makeEngine({
      sponsorshipResult: {
        data_value: { isEligible: true, isSelfPetition: true, requiredIncome: 0, totalIncome: 0 },
      },
    });
    const score = await engine.calculateJourneyStrength("j1");
    expect(hasLowIncome(score.risk_flags)).toBe(false);
    expect(score.positive_signals.some((s) => /exemption/i.test(s))).toBe(true);
  });

  it("legacy path (IR-1, no calculator result): low flat income still flags LOW_INCOME", async () => {
    const engine = makeEngine(
      { sponsor_annual_income: { data_value: 5000 }, household_size: { data_value: 2 } },
      "IR1"
    );
    const score = await engine.calculateJourneyStrength("j1");
    expect(hasLowIncome(score.risk_flags)).toBe(true);
  });

  it("legacy path (IR-1): high flat income gives credit, no flag (unchanged behavior)", async () => {
    const engine = makeEngine(
      { sponsor_annual_income: { data_value: 90000 }, household_size: { data_value: 2 } },
      "IR1"
    );
    const score = await engine.calculateJourneyStrength("j1");
    expect(hasLowIncome(score.risk_flags)).toBe(false);
    expect(score.positive_signals.some((s) => /income/i.test(s))).toBe(true);
  });
});

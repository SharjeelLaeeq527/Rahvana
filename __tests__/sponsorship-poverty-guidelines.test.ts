import {
  resolveJurisdiction,
  getSponsorshipThreshold,
  getJurisdictionLabel,
  POVERTY_GUIDELINES_BY_JURISDICTION,
  POVERTY_GUIDELINES,
} from "@/lib/tools/sponsorship/povertyGuidelines";

describe("resolveJurisdiction", () => {
  it("maps Alaska (code and name, any case) to AK", () => {
    expect(resolveJurisdiction("AK")).toBe("AK");
    expect(resolveJurisdiction("ak")).toBe("AK");
    expect(resolveJurisdiction("Alaska")).toBe("AK");
    expect(resolveJurisdiction("  alaska ")).toBe("AK");
  });

  it("maps Hawaii (code and name, any case) to HI", () => {
    expect(resolveJurisdiction("HI")).toBe("HI");
    expect(resolveJurisdiction("hawaii")).toBe("HI");
  });

  it("maps all other states, DC, and territories to contiguous", () => {
    expect(resolveJurisdiction("TX")).toBe("contiguous");
    expect(resolveJurisdiction("California")).toBe("contiguous");
    expect(resolveJurisdiction("DC")).toBe("contiguous");
  });

  it("falls back to contiguous for missing / empty / unknown input", () => {
    expect(resolveJurisdiction(undefined)).toBe("contiguous");
    expect(resolveJurisdiction(null)).toBe("contiguous");
    expect(resolveJurisdiction("")).toBe("contiguous");
    expect(resolveJurisdiction("   ")).toBe("contiguous");
    expect(resolveJurisdiction("zzz")).toBe("contiguous");
  });
});

describe("getSponsorshipThreshold", () => {
  it("returns the contiguous 125% table by default (backward compatible)", () => {
    expect(getSponsorshipThreshold(2, 125)).toBe(27050);
    expect(getSponsorshipThreshold(4, 125)).toBe(41250);
    expect(getSponsorshipThreshold(8, 125)).toBe(69650);
    // POVERTY_GUIDELINES export mirrors the contiguous table.
    expect(POVERTY_GUIDELINES[4].level125).toBe(41250);
  });

  it("applies the 100% column (active-duty military rule)", () => {
    expect(getSponsorshipThreshold(4, 100, "contiguous")).toBe(33000);
    expect(getSponsorshipThreshold(4, 100, "AK")).toBe(41250);
    expect(getSponsorshipThreshold(4, 100, "HI")).toBe(37950);
  });

  it("returns higher thresholds for Alaska and Hawaii than contiguous", () => {
    const size = 4;
    const contig = getSponsorshipThreshold(size, 125, "contiguous");
    const ak = getSponsorshipThreshold(size, 125, "AK");
    const hi = getSponsorshipThreshold(size, 125, "HI");
    expect(ak).toBe(51563);
    expect(hi).toBe(47438);
    expect(ak).toBeGreaterThan(contig);
    expect(hi).toBeGreaterThan(contig);
    expect(ak).toBeGreaterThan(hi);
  });

  it("clamps household sizes below 2 to the size-2 row", () => {
    expect(getSponsorshipThreshold(1, 125, "contiguous")).toBe(27050);
    expect(getSponsorshipThreshold(0, 125, "AK")).toBe(33813);
  });

  it("adds the per-additional-member increment above household size 8", () => {
    // contiguous: 69650 + 2 * 7100
    expect(getSponsorshipThreshold(10, 125, "contiguous")).toBe(69650 + 2 * 7100);
    // AK: 87063 + 1 * 8875
    expect(getSponsorshipThreshold(9, 125, "AK")).toBe(87063 + 8875);
    // HI 100%: 64070 + 3 * 6530
    expect(getSponsorshipThreshold(11, 100, "HI")).toBe(64070 + 3 * 6530);
  });
});

describe("jurisdiction table integrity", () => {
  it("keeps 125% approximately 1.25x the 100% figure for every size", () => {
    (["contiguous", "AK", "HI"] as const).forEach((j) => {
      const { table } = POVERTY_GUIDELINES_BY_JURISDICTION[j];
      Object.values(table).forEach(({ level100, level125 }) => {
        // I-864P rounds the 125% figure; allow a small rounding tolerance.
        expect(Math.abs(level125 - level100 * 1.25)).toBeLessThanOrEqual(1);
      });
    });
  });
});

describe("getJurisdictionLabel", () => {
  it("returns human-readable labels", () => {
    expect(getJurisdictionLabel("AK")).toBe("Alaska");
    expect(getJurisdictionLabel("HI")).toBe("Hawaii");
    expect(getJurisdictionLabel("contiguous")).toMatch(/contiguous/i);
  });
});

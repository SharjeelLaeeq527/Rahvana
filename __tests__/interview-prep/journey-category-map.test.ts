import {
  JOURNEY_CATEGORY_MAP,
  getCategoryForJourney,
  getSupportedJourneyTypes,
  isJourneyTypeSupported,
  resolveCategorySlug,
  isMultiCandidateCategorySlug,
} from "@/lib/interview-prep/journey-category-map";

describe("journey-category-map (Phase 2)", () => {
  describe("JOURNEY_CATEGORY_MAP dictionary", () => {
    it("contains entries for IR-1, IR-5, IR-2, and F-1", () => {
      expect(JOURNEY_CATEGORY_MAP["IR1"]).toBe("ir-1-spouse");
      expect(JOURNEY_CATEGORY_MAP["IR-1"]).toBe("ir-1-spouse");
      expect(JOURNEY_CATEGORY_MAP["IR5"]).toBe("ir-5-parent");
      expect(JOURNEY_CATEGORY_MAP["IR-5"]).toBe("ir-5-parent");
      expect(JOURNEY_CATEGORY_MAP["IR2"]).toBe("ir-2-child");
      expect(JOURNEY_CATEGORY_MAP["IR-2"]).toBe("ir-2-child");
      expect(JOURNEY_CATEGORY_MAP["CR2"]).toBe("ir-2-child");
      expect(JOURNEY_CATEGORY_MAP["F1"]).toBe("f1-student");
    });
  });

  describe("getCategoryForJourney", () => {
    it("maps standard base journey types", () => {
      expect(getCategoryForJourney("IR1")).toBe("ir-1-spouse");
      expect(getCategoryForJourney("IR-1")).toBe("ir-1-spouse");
      expect(getCategoryForJourney("IR5")).toBe("ir-5-parent");
      expect(getCategoryForJourney("IR-5")).toBe("ir-5-parent");
      expect(getCategoryForJourney("IR2")).toBe("ir-2-child");
      expect(getCategoryForJourney("IR-2")).toBe("ir-2-child");
    });

    it("resolves multi-candidate suffixed journey types", () => {
      // IR-5 candidate 2 (Father)
      expect(getCategoryForJourney("ir5_candidate2")).toBe("ir-5-parent");
      expect(getCategoryForJourney("ir5_candidate-2")).toBe("ir-5-parent");

      // IR-2 candidate 2 & 3 (Children)
      expect(getCategoryForJourney("ir2_candidate2")).toBe("ir-2-child");
      expect(getCategoryForJourney("ir2_candidate-3")).toBe("ir-2-child");

      // IR-1 candidate 1
      expect(getCategoryForJourney("ir1_candidate-1")).toBe("ir-1-spouse");
    });

    it("throws for unsupported journey types", () => {
      expect(() => getCategoryForJourney("tourist-b2")).toThrow(/Unsupported journey type/);
      expect(() => getCategoryForJourney("")).toThrow(/Unsupported journey type/);
    });
  });

  describe("isJourneyTypeSupported", () => {
    it("returns true for base and candidate-scoped journey keys", () => {
      expect(isJourneyTypeSupported("IR1")).toBe(true);
      expect(isJourneyTypeSupported("IR5")).toBe(true);
      expect(isJourneyTypeSupported("IR2")).toBe(true);
      expect(isJourneyTypeSupported("ir5_candidate2")).toBe(true);
      expect(isJourneyTypeSupported("ir2_candidate-2")).toBe(true);
    });

    it("returns false for unsupported types and empty values", () => {
      expect(isJourneyTypeSupported("unknown-type")).toBe(false);
      expect(isJourneyTypeSupported("")).toBe(false);
    });
  });

  describe("resolveCategorySlug", () => {
    it("preserves canonical category slugs", () => {
      expect(resolveCategorySlug("ir-1-spouse")).toBe("ir-1-spouse");
      expect(resolveCategorySlug("ir-5-parent")).toBe("ir-5-parent");
      expect(resolveCategorySlug("ir-2-child")).toBe("ir-2-child");
      expect(resolveCategorySlug("f1-student")).toBe("f1-student");
    });

    it("resolves various aliases and URL slugs", () => {
      expect(resolveCategorySlug("IR-5")).toBe("ir-5-parent");
      expect(resolveCategorySlug("ir5-journey")).toBe("ir-5-parent");
      expect(resolveCategorySlug("parent")).toBe("ir-5-parent");

      expect(resolveCategorySlug("IR-2")).toBe("ir-2-child");
      expect(resolveCategorySlug("ir2-journey")).toBe("ir-2-child");
      expect(resolveCategorySlug("child")).toBe("ir-2-child");

      expect(resolveCategorySlug("IR-1")).toBe("ir-1-spouse");
      expect(resolveCategorySlug("spouse")).toBe("ir-1-spouse");
      expect(resolveCategorySlug("cr1")).toBe("ir-1-spouse");
    });

    it("returns null for UUIDs", () => {
      expect(resolveCategorySlug("e4b886bf-d98c-4197-8282-53d277889cc7")).toBeNull();
    });
  });

  describe("isMultiCandidateCategorySlug", () => {
    it("identifies multi-candidate visa categories (IR-5, IR-2)", () => {
      expect(isMultiCandidateCategorySlug("ir-5-parent")).toBe(true);
      expect(isMultiCandidateCategorySlug("ir-2-child")).toBe(true);
      expect(isMultiCandidateCategorySlug("IR-5")).toBe(true);
      expect(isMultiCandidateCategorySlug("IR-2")).toBe(true);
      expect(isMultiCandidateCategorySlug("ir5_candidate2")).toBe(true);
    });

    it("returns false for single-beneficiary categories (IR-1 spouse)", () => {
      expect(isMultiCandidateCategorySlug("ir-1-spouse")).toBe(false);
      expect(isMultiCandidateCategorySlug("IR-1")).toBe(false);
    });
  });

  describe("getSupportedJourneyTypes", () => {
    it("includes IR1, IR5, and IR2", () => {
      const types = getSupportedJourneyTypes();
      expect(types).toContain("IR1");
      expect(types).toContain("IR5");
      expect(types).toContain("IR2");
    });
  });
});

import {
  getAllGuides,
  getGuideById,
  getGuideByResourceId,
  getGuideBySlug,
  getGuidesForVisaCategory,
  isGuideRelevantToVisaCategory,
} from "@/lib/guides/guideRegistry";
import { hasJourneyEntitlementForGuide } from "@/lib/guides/guideAccessService";
import { resolveStandaloneAccess } from "@/lib/wallet/standaloneAccess";
import { PlanTier } from "@/lib/entitlements/config";

describe("Phase 1 & 2: Guide Registry and Visa Category Entitlement", () => {
  describe("Guide Registry Data Integrity", () => {
    it("registers all 9 core guides with valid visaCategories", () => {
      const guides = getAllGuides();
      expect(guides.length).toBeGreaterThanOrEqual(9);

      for (const guide of guides) {
        expect(guide.id).toBeTruthy();
        expect(guide.resourceId).toBeTruthy();
        expect(guide.slug).toBeTruthy();
        expect(guide.href).toMatch(/^\/guides\//);
        expect(Array.isArray(guide.visaCategories)).toBe(true);
        expect(guide.visaCategories.length).toBeGreaterThan(0);
      }
    });

    it("correctly identifies guides relevant to specific visa categories", () => {
      const ir1Guides = getGuidesForVisaCategory("IR-1");
      const ir5Guides = getGuidesForVisaCategory("IR-5");

      // Passport and Police Cert should be in both
      expect(ir1Guides.some((g) => g.id === "passport")).toBe(true);
      expect(ir5Guides.some((g) => g.id === "passport")).toBe(true);
      expect(ir1Guides.some((g) => g.id === "police-verification")).toBe(true);
      expect(ir5Guides.some((g) => g.id === "police-verification")).toBe(true);

      // Marriage registration (Nikah Nama) is spouse-specific (IR-1 / CR-1)
      expect(ir1Guides.some((g) => g.id === "marriage-certificate")).toBe(true);
      expect(ir5Guides.some((g) => g.id === "marriage-certificate")).toBe(false);

      // Step-parent and Adoptive-parent are parent-specific (IR-5)
      expect(ir5Guides.some((g) => g.id === "step-parent")).toBe(true);
      expect(ir1Guides.some((g) => g.id === "step-parent")).toBe(false);
    });

    it("looks up guides by id, resourceId, and slug consistently", () => {
      const byId = getGuideById("marriage-certificate");
      const byRes = getGuideByResourceId("guide-nikah-nama");
      const bySlug = getGuideBySlug("nikah-nama-guide");

      expect(byId).toBeDefined();
      expect(byRes).toBeDefined();
      expect(bySlug).toBeDefined();
      expect(byId).toEqual(byRes);
      expect(byId).toEqual(bySlug);
    });
  });

  describe("hasJourneyEntitlementForGuide() Entitlement Rules", () => {
    it("unlocks IR-1 mapped guides for a user with IR-1 Premium", () => {
      const journeyTiers: Record<string, PlanTier> = { "IR-1": "premium" };
      const nikahGuide = getGuideById("marriage-certificate")!;
      const result = hasJourneyEntitlementForGuide(nikahGuide, journeyTiers);

      expect(result.hasAccess).toBe(true);
      expect(result.unlockedViaCategory).toBe("IR-1");
      expect(result.journeyTier).toBe("premium");
    });

    it("unlocks universal guides (passport, police cert) for any eligible category", () => {
      const journeyTiers: Record<string, PlanTier> = { "IR-5": "executive" };
      const passportGuide = getGuideById("passport")!;
      const result = hasJourneyEntitlementForGuide(passportGuide, journeyTiers);

      expect(result.hasAccess).toBe(true);
      expect(result.unlockedViaCategory).toBe("IR-5");
    });

    it("keeps category-restricted guides LOCKED if user only owns an unrelated category", () => {
      // User only bought IR-1, but checks an IR-5 exclusive guide (mocked non-free)
      const journeyTiers: Record<string, PlanTier> = { "IR-1": "premium" };
      const ir5MockGuide = {
        id: "ir5-exclusive-guide",
        resourceId: "guide-ir5-exclusive",
        slug: "ir5-exclusive-guide",
        title: "IR-5 Exclusive",
        description: "Test",
        category: "Pakistan Document" as const,
        href: "/guides/ir5-exclusive",
        iconName: "FileText" as const,
        entitlementFeature: "guide_ir5_exclusive",
        minJourneyTier: "premium" as const,
        visaCategories: ["IR-5"],
      };

      const result = hasJourneyEntitlementForGuide(ir5MockGuide, journeyTiers);
      expect(result.hasAccess).toBe(false);
    });

    it("does NOT unlock guides for Basic tier journey users (DIY friction preserved)", () => {
      const journeyTiers: Record<string, PlanTier> = { "IR-1": "basic" };
      const nikahGuide = getGuideById("marriage-certificate")!;
      const result = hasJourneyEntitlementForGuide(nikahGuide, journeyTiers);

      expect(result.hasAccess).toBe(false);
    });

    it("unlocks free / public guides regardless of user tier and marks them non-creditPayable", () => {
      const emptyTiers: Record<string, PlanTier> = {};
      const stepParent = getGuideById("step-parent")!;
      const adoptiveParent = getGuideById("adoptive-parent")!;

      expect(stepParent.creditPayable).toBe(false);
      expect(stepParent.entitlementFeature).toBeUndefined();
      expect(adoptiveParent.creditPayable).toBe(false);
      expect(adoptiveParent.entitlementFeature).toBeUndefined();

      const result = hasJourneyEntitlementForGuide(stepParent, emptyTiers);
      expect(result.hasAccess).toBe(true);
    });


    it("resolves access with normalized category strings (e.g. 'ir1-journey', 'ir5')", () => {
      const journeyTiers: Record<string, PlanTier> = { "ir1-journey": "premium" };
      const nikahGuide = getGuideById("marriage-certificate")!;
      const result = hasJourneyEntitlementForGuide(nikahGuide, journeyTiers);

      expect(result.hasAccess).toBe(true);
      expect(result.unlockedViaCategory).toBe("IR-1");
    });

    it("grants access for Executive tier plans as well as Premium", () => {
      const journeyTiers: Record<string, PlanTier> = { "IR-1": "executive" };
      const nikahGuide = getGuideById("marriage-certificate")!;
      const result = hasJourneyEntitlementForGuide(nikahGuide, journeyTiers);

      expect(result.hasAccess).toBe(true);
      expect(result.unlockedViaCategory).toBe("IR-1");
      expect(result.journeyTier).toBe("executive");
    });

    it("unlocks wildcard guides ('*') for any user with an active premium journey", () => {
      const journeyTiers: Record<string, PlanTier> = { "CR-1": "premium" };
      const wildcardMockGuide = {
        id: "universal-guide",
        resourceId: "guide-universal",
        slug: "universal-guide",
        title: "Universal Guide",
        description: "Test",
        category: "Pakistan Document" as const,
        href: "/guides/universal-guide",
        iconName: "Globe" as const,
        entitlementFeature: "guide_universal",
        minJourneyTier: "premium" as const,
        visaCategories: ["*"],
      };

      const result = hasJourneyEntitlementForGuide(wildcardMockGuide, journeyTiers);
      expect(result.hasAccess).toBe(true);
      expect(result.unlockedViaCategory).toBe("CR-1");
    });
  });


  describe("Standalone Access Resolution Integration", () => {
    it("returns 'open' for standalone guide when planAllowed is true via journey entitlement", () => {
      const status = resolveStandaloneAccess({
        hasCatalogItem: true,
        isAuthenticated: true,
        planLoading: false,
        walletLoading: false,
        planAllowed: true, // From hasEligibleJourneyPlan
        walletUnlocked: false,
      });

      expect(status).toBe("open");
    });

    it("falls back to wallet credit unlock if user has no journey plan", () => {
      const status = resolveStandaloneAccess({
        hasCatalogItem: true,
        isAuthenticated: true,
        planLoading: false,
        walletLoading: false,
        planAllowed: false, // No journey plan
        walletUnlocked: true, // Purchased with 5 credits
      });

      expect(status).toBe("open");
    });

    it("locks the guide if user has neither journey plan nor wallet unlock", () => {
      const status = resolveStandaloneAccess({
        hasCatalogItem: true,
        isAuthenticated: true,
        planLoading: false,
        walletLoading: false,
        planAllowed: false,
        walletUnlocked: false,
      });

      expect(status).toBe("locked");
    });

    it("locks unauthenticated users immediately", () => {
      const status = resolveStandaloneAccess({
        hasCatalogItem: true,
        isAuthenticated: false,
        planLoading: false,
        walletLoading: false,
        planAllowed: false,
        walletUnlocked: false,
      });

      expect(status).toBe("locked");
    });
  });

  describe("Phase 4: Journey App Group Dynamic Category Filtering", () => {
    it("filters guides for IR-1 (keeps marriage guide, excludes step/adoptive parent)", () => {
      const { getJourneyAppGroups } = require("@/lib/constants/journey-app-groups");
      const ir1Groups = getJourneyAppGroups("IR-1");
      const guidesGroup = ir1Groups.find((g: any) => g.id === "guides")!;

      expect(guidesGroup).toBeDefined();
      const itemKeys = guidesGroup.items.map((i: any) => i.componentKey);

      // IR-1 includes marriage registration
      expect(itemKeys).toContain("marriage_guide");
      expect(itemKeys).toContain("passport_guide");
      expect(itemKeys).toContain("pcc_guide");

      // IR-1 excludes parent-specific guides
      expect(itemKeys).not.toContain("step_parent_guide");
      expect(itemKeys).not.toContain("adoptive_parent_guide");
    });

    it("filters guides for IR-5 (keeps parent guides, excludes marriage registration)", () => {
      const { getJourneyAppGroups } = require("@/lib/constants/journey-app-groups");
      const ir5Groups = getJourneyAppGroups("IR-5");
      const guidesGroup = ir5Groups.find((g: any) => g.id === "guides")!;

      expect(guidesGroup).toBeDefined();
      const itemKeys = guidesGroup.items.map((i: any) => i.componentKey);

      // IR-5 includes parent guides
      expect(itemKeys).toContain("step_parent_guide");
      expect(itemKeys).toContain("adoptive_parent_guide");
      expect(itemKeys).toContain("passport_guide");
      expect(itemKeys).toContain("pcc_guide");

      // IR-5 excludes spouse marriage registration
      expect(itemKeys).not.toContain("marriage_guide");
    });

    it("returns default unfiltered groups when no visaCategory is supplied", () => {
      const { getJourneyAppGroups, JOURNEY_APP_GROUPS } = require("@/lib/constants/journey-app-groups");
      const defaultGroups = getJourneyAppGroups(null);
      expect(defaultGroups).toEqual(JOURNEY_APP_GROUPS);
    });
  });
});


// __tests__/candidate/candidate-entitlements.test.ts
// ============================================================================
// Phase D: Per-Journey Entitlement Resolution & Cross-Category Access Control
// ============================================================================

import {
  getBaseVisaCategory,
  UNKNOWN_VISA_CATEGORY,
} from "@/lib/candidate/candidateSyncService";
import { normalizePlanTier, PlanTier } from "@/lib/entitlements/config";
import { canUse, isLocked, getEffectiveEntitlement } from "@/lib/entitlements/helpers";


describe("Phase D: Per-Journey Entitlement Resolution & Cross-Category Access Control", () => {
  // Helper simulating PlanContext tier resolution
  function resolveEffectiveTier({
    activeCategory,
    journeyTiers,
    accountTier,
    isCandidatePreview = false,
    devOverride = null,
  }: {
    activeCategory: string;
    journeyTiers: Record<string, PlanTier>;
    accountTier: PlanTier;
    isCandidatePreview?: boolean;
    devOverride?: PlanTier | null;
  }): PlanTier {
    if (devOverride) return devOverride;
    if (isCandidatePreview) return "free";

    const normCat = getBaseVisaCategory(activeCategory);
    if (normCat !== UNKNOWN_VISA_CATEGORY && journeyTiers[normCat]) {
      return journeyTiers[normCat];
    }
    // If explicit journey tiers exist, an unpurchased new category is "free"
    if (Object.keys(journeyTiers).length > 0) {
      return "free";
    }
    // Legacy single-journey fallback
    return accountTier;
  }

  describe("1. Cross-Category Tier Resolution (IR-5 Premium vs IR-1 Unpurchased)", () => {
    const journeyTiers: Record<string, PlanTier> = {
      "IR-5": "premium",
      "IR-1": "free",
    };
    const accountTier: PlanTier = "premium";

    it("evaluates Candidate 1 (IR-5 Mother) as Premium", () => {
      const tier = resolveEffectiveTier({
        activeCategory: "IR-5",
        journeyTiers,
        accountTier,
      });
      expect(tier).toBe("premium");
      expect(canUse("smart_form_filler", tier, [])).toBe(true);
      expect(canUse("document_vault", tier, [])).toBe(true);
    });

    it("evaluates Candidate 2 (IR-5 Father) as Premium", () => {
      const tier = resolveEffectiveTier({
        activeCategory: "IR-5",
        journeyTiers,
        accountTier,
      });
      expect(tier).toBe("premium");
      expect(canUse("smart_form_filler", tier, [])).toBe(true);
    });

    it("evaluates Candidate 3 (IR-1 Spouse) as Free/Locked when unpurchased", () => {
      const tier = resolveEffectiveTier({
        activeCategory: "IR-1",
        journeyTiers,
        accountTier,
      });
      expect(tier).toBe("free");
      // Smart form filler requires premium -> locked on free
      expect(canUse("smart_form_filler", tier, [])).toBe(false);
      expect(isLocked("smart_form_filler", tier, [])).toBe(true);
    });
  });

  describe("2. Post-Purchase Multi-Category Unlock", () => {
    it("unlocks IR-1 to Premium once IR-1 subscription is purchased", () => {
      const updatedJourneyTiers: Record<string, PlanTier> = {
        "IR-5": "premium",
        "IR-1": "premium",
      };
      const accountTier: PlanTier = "premium";

      const ir1Tier = resolveEffectiveTier({
        activeCategory: "IR-1",
        journeyTiers: updatedJourneyTiers,
        accountTier,
      });
      expect(ir1Tier).toBe("premium");
      expect(canUse("smart_form_filler", ir1Tier, [])).toBe(true);

      const ir5Tier = resolveEffectiveTier({
        activeCategory: "IR-5",
        journeyTiers: updatedJourneyTiers,
        accountTier,
      });
      expect(ir5Tier).toBe("premium");
      expect(canUse("smart_form_filler", ir5Tier, [])).toBe(true);
    });
  });

  describe("3. Backward Compatibility with Legacy Single-Journey Accounts", () => {
    it("falls back to account-level subscription_tier when journeyTiers table has no rows", () => {
      const legacyJourneyTiers: Record<string, PlanTier> = {};
      const accountTier: PlanTier = "premium";

      const tier = resolveEffectiveTier({
        activeCategory: "IR-5",
        journeyTiers: legacyJourneyTiers,
        accountTier,
      });
      expect(tier).toBe("premium");
    });
  });

  describe("4. Candidate Free Preview & Dev Override Controls", () => {
    const journeyTiers: Record<string, PlanTier> = {
      "IR-5": "premium",
    };

    it("forces tier to 'free' when candidate is in preview mode", () => {
      const tier = resolveEffectiveTier({
        activeCategory: "IR-5",
        journeyTiers,
        accountTier: "premium",
        isCandidatePreview: true,
      });
      expect(tier).toBe("free");
    });

    it("honors devOverride regardless of journey tiers", () => {
      const tier = resolveEffectiveTier({
        activeCategory: "IR-5",
        journeyTiers,
        accountTier: "free",
        devOverride: "executive",
      });
      expect(tier).toBe("executive");
      expect(canUse("mock_interview", tier, [])).toBe(true);
    });
  });
});

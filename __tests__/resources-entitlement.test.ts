/**
 * Credit-pool entitlement rules for the add-on services:
 *  - Photo Booth: each `photo` purchase grants 2 credits on ANY tier;
 *    premium includes 2 plan credits; executive unlimited.
 *  - Expert Consultation: each `consultation` purchase grants 1 credit;
 *    executive includes 2 plan credits; other tiers locked without a purchase.
 *  - Medical Booking / PCC Filing / Document Translation: each purchase
 *    grants 1 credit on ANY tier (locked below executive without one);
 *    executive unlimited (no credits ever consumed).
 *  - Pools are two wallets: plan spend on the bare feature key, purchased
 *    spend on `${feature}:addon` — plan usage never erodes paid credits.
 */
import { getEffectiveEntitlement, getCreditPools, addonPoolKey } from "@/lib/entitlements/helpers";
import { normalizePlanTier } from "@/lib/entitlements/config";

describe("getEffectiveEntitlement — photo_booth credit pool", () => {
  it("free, no purchase → locked_buy with buy-or-upgrade path", () => {
    const e = getEffectiveEntitlement("photo_booth", "free", []);
    expect(e.state).toBe("locked_buy");
    expect(e.addon?.id).toBe("photo");
    expect(e.upgradeTarget).toBe("premium");
  });

  it("basic, no purchase → locked_buy", () => {
    expect(getEffectiveEntitlement("photo_booth", "basic", []).state).toBe("locked_buy");
  });

  it("free, one purchase → limited to 2 purchased credits", () => {
    const e = getEffectiveEntitlement("photo_booth", "free", ["photo"]);
    expect(e.state).toBe("limited");
    expect(e.limit).toBe(2);
  });

  it("basic, two purchases → 4 credits (duplicate ledger entries stack)", () => {
    const e = getEffectiveEntitlement("photo_booth", "basic", ["photo", "photo"]);
    expect(e.state).toBe("limited");
    expect(e.limit).toBe(4);
  });

  it("premium, no purchase → 2 plan credits", () => {
    const e = getEffectiveEntitlement("photo_booth", "premium", []);
    expect(e.state).toBe("limited");
    expect(e.limit).toBe(2);
  });

  it("premium, one purchase → plan credits stack with purchased credits", () => {
    const e = getEffectiveEntitlement("photo_booth", "premium", ["photo"]);
    expect(e.state).toBe("limited");
    expect(e.limit).toBe(4);
  });

  it("executive → unlimited regardless of purchases", () => {
    expect(getEffectiveEntitlement("photo_booth", "executive", []).state).toBe("full");
    expect(getEffectiveEntitlement("photo_booth", "executive", ["photo"]).state).toBe("full");
  });

  it("unrelated add-ons do not affect photo_booth", () => {
    const e = getEffectiveEntitlement("photo_booth", "free", ["sponsor", "interview-prep"]);
    expect(e.state).toBe("locked_buy");
  });

  it("non-pool add-ons keep the old purchased → full behaviour (sponsor)", () => {
    const e = getEffectiveEntitlement("sponsorship_calc", "free", ["sponsor"]);
    expect(e.state).toBe("full");
  });

  it("unexpected DB tier strings fail safe to free via normalizePlanTier", () => {
    const e = getEffectiveEntitlement("photo_booth", normalizePlanTier("gold"), []);
    expect(e.state).toBe("locked_buy");
  });
});

describe("normalizePlanTier", () => {
  it("maps current tier names to themselves", () => {
    expect(normalizePlanTier("free")).toBe("free");
    expect(normalizePlanTier("basic")).toBe("basic");
    expect(normalizePlanTier("premium")).toBe("premium");
    expect(normalizePlanTier("executive")).toBe("executive");
  });

  it("is case-insensitive and fail-safes unknown values to free", () => {
    expect(normalizePlanTier("PREMIUM")).toBe("premium");
    expect(normalizePlanTier(null)).toBe("free");
    expect(normalizePlanTier(undefined)).toBe("free");
    expect(normalizePlanTier("gold")).toBe("free");
    expect(normalizePlanTier("core")).toBe("free");
    expect(normalizePlanTier("plus")).toBe("free");
    expect(normalizePlanTier("pro")).toBe("free");
  });
});

describe("getCreditPools — plan vs purchased wallets", () => {
  it("non-pool features return null (single-counter behaviour preserved)", () => {
    expect(getCreditPools("sponsorship_calc", "free", ["sponsor"])).toBeNull();
  });

  it("photo premium, no purchase → 2 plan credits, empty purchased wallet", () => {
    expect(getCreditPools("photo_booth", "premium", [])).toEqual({
      planCredits: 2,
      purchasedCredits: 0,
    });
  });

  it("photo premium + 1 purchase → plan 2 and purchased 2 are tracked separately", () => {
    expect(getCreditPools("photo_booth", "premium", ["photo"])).toEqual({
      planCredits: 2,
      purchasedCredits: 2,
    });
  });

  it("consultation on a locked tier with 1 purchase → granted purely from purchases", () => {
    expect(getCreditPools("expert_consultation", "premium", ["consultation"])).toEqual({
      planCredits: 0,
      purchasedCredits: 1,
    });
  });

  it("consultation executive + 2 purchases → 2 plan + 2 purchased", () => {
    expect(
      getCreditPools("expert_consultation", "executive", ["consultation", "consultation"])
    ).toEqual({
      planCredits: 2,
      purchasedCredits: 2,
    });
  });

  it("plan spend never erodes the purchased wallet (effective limit = sum)", () => {
    // getEffectiveEntitlement exposes the combined pool for display; the two
    // counters are kept separate in feature_usage (bare key vs `:addon` key).
    const e = getEffectiveEntitlement("expert_consultation", "premium", ["consultation"]);
    expect(e.state).toBe("limited");
    expect(e.limit).toBe(1);
  });
});

describe("getEffectiveEntitlement — expert_consultation credit pool", () => {
  it("free/basic/premium, no purchase → locked_buy (consultation add-on)", () => {
    for (const tier of ["free", "basic", "premium"] as const) {
      const e = getEffectiveEntitlement("expert_consultation", tier, []);
      expect(e.state).toBe("locked_buy");
      expect(e.addon?.id).toBe("consultation");
      expect(e.upgradeTarget).toBe("executive");
    }
  });

  it("premium + 1 purchase → limited to 1 (SERVICE_CREDITS_PER_ADDON)", () => {
    const e = getEffectiveEntitlement("expert_consultation", "premium", ["consultation"]);
    expect(e.state).toBe("limited");
    expect(e.limit).toBe(1);
  });

  it("premium + 3 purchases → 3 credits (duplicate ledger entries stack)", () => {
    const e = getEffectiveEntitlement("expert_consultation", "premium", [
      "consultation",
      "consultation",
      "consultation",
    ]);
    expect(e.state).toBe("limited");
    expect(e.limit).toBe(3);
  });

  it("executive, no purchase → 2 plan credits (limited, not full)", () => {
    const e = getEffectiveEntitlement("expert_consultation", "executive", []);
    expect(e.state).toBe("limited");
    expect(e.limit).toBe(2);
  });

  it("executive + purchase → plan credits stack with purchased credits", () => {
    const e = getEffectiveEntitlement("expert_consultation", "executive", ["consultation"]);
    expect(e.state).toBe("limited");
    expect(e.limit).toBe(3);
  });

  it("the photo add-on does not unlock consultations", () => {
    const e = getEffectiveEntitlement("expert_consultation", "premium", ["photo"]);
    expect(e.state).toBe("locked_buy");
  });
});

describe("getEffectiveEntitlement — medical_booking credit pool", () => {
  it("free/basic/premium, no purchase → locked_buy (medical add-on)", () => {
    for (const tier of ["free", "basic", "premium"] as const) {
      const e = getEffectiveEntitlement("medical_booking", tier, []);
      expect(e.state).toBe("locked_buy");
      expect(e.addon?.id).toBe("medical");
      expect(e.upgradeTarget).toBe("executive");
    }
  });

  it("free + 1 purchase → 1 credit", () => {
    const e = getEffectiveEntitlement("medical_booking", "free", ["medical"]);
    expect(e.state).toBe("limited");
    expect(e.limit).toBe(1);
  });

  it("executive → unlimited regardless of purchases (no credits consumed)", () => {
    expect(getEffectiveEntitlement("medical_booking", "executive", []).state).toBe("full");
    expect(getEffectiveEntitlement("medical_booking", "executive", ["medical"]).state).toBe("full");
  });
});

describe("getEffectiveEntitlement — pcc_filing credit pool", () => {
  it("free/basic/premium, no purchase → locked_buy (pcc add-on)", () => {
    for (const tier of ["free", "basic", "premium"] as const) {
      const e = getEffectiveEntitlement("pcc_filing", tier, []);
      expect(e.state).toBe("locked_buy");
      expect(e.addon?.id).toBe("pcc");
      expect(e.upgradeTarget).toBe("executive");
    }
  });

  it("premium + 2 purchases → 2 credits", () => {
    const e = getEffectiveEntitlement("pcc_filing", "premium", ["pcc", "pcc"]);
    expect(e.state).toBe("limited");
    expect(e.limit).toBe(2);
  });

  it("executive → unlimited regardless of purchases", () => {
    expect(getEffectiveEntitlement("pcc_filing", "executive", []).state).toBe("full");
    expect(getEffectiveEntitlement("pcc_filing", "executive", ["pcc"]).state).toBe("full");
  });
});

describe("getEffectiveEntitlement — document_translation credit pool", () => {
  it("free/basic/premium, no purchase → locked_buy (translate add-on)", () => {
    for (const tier of ["free", "basic", "premium"] as const) {
      const e = getEffectiveEntitlement("document_translation", tier, []);
      expect(e.state).toBe("locked_buy");
      expect(e.addon?.id).toBe("translate");
      expect(e.upgradeTarget).toBe("executive");
    }
  });

  it("basic + 1 purchase → 1 credit", () => {
    const e = getEffectiveEntitlement("document_translation", "basic", ["translate"]);
    expect(e.state).toBe("limited");
    expect(e.limit).toBe(1);
  });

  it("executive → full (was limited(2) — matrix says unlimited)", () => {
    expect(getEffectiveEntitlement("document_translation", "executive", []).state).toBe("full");
  });
});

describe("getCreditPools — service plan vs purchased wallets", () => {
  it("locked tier without a purchase → both wallets empty (no free ride)", () => {
    expect(getCreditPools("medical_booking", "premium", [])).toEqual({
      planCredits: 0,
      purchasedCredits: 0,
    });
  });

  it("medical free + 1 purchase → purely from the purchased wallet", () => {
    expect(getCreditPools("medical_booking", "free", ["medical"])).toEqual({
      planCredits: 0,
      purchasedCredits: 1,
    });
  });

  it("pcc basic + 2 purchases → purchased 2", () => {
    expect(getCreditPools("pcc_filing", "basic", ["pcc", "pcc"])).toEqual({
      planCredits: 0,
      purchasedCredits: 2,
    });
  });

  it("translation premium + 1 purchase → purchased 1", () => {
    expect(getCreditPools("document_translation", "premium", ["translate"])).toEqual({
      planCredits: 0,
      purchasedCredits: 1,
    });
  });

  it("consultation executive + 1 purchase → plan 2 and purchased 1 tracked separately", () => {
    expect(getCreditPools("expert_consultation", "executive", ["consultation"])).toEqual({
      planCredits: 2,
      purchasedCredits: 1,
    });
  });

  it("executive full-access features are not pools (no counters needed)", () => {
    expect(getCreditPools("medical_booking", "executive", [])).toBeNull();
    expect(getCreditPools("pcc_filing", "executive", [])).toBeNull();
    expect(getCreditPools("document_translation", "executive", [])).toBeNull();
  });
});

describe("addonPoolKey — feature_usage counter keys", () => {
  it("purchased spend lives on the `:addon` suffixed key per service", () => {
    expect(addonPoolKey("photo_booth")).toBe("photo_booth:addon");
    expect(addonPoolKey("expert_consultation")).toBe("expert_consultation:addon");
    expect(addonPoolKey("medical_booking")).toBe("medical_booking:addon");
    expect(addonPoolKey("pcc_filing")).toBe("pcc_filing:addon");
    expect(addonPoolKey("document_translation")).toBe("document_translation:addon");
  });
});

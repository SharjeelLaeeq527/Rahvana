/**
 * Photo Booth credit-pool entitlement rules:
 *  - Each `photo` add-on purchase grants 2 credits on ANY tier (plan-agnostic),
 *    stacking with plan-included credits.
 *  - Without a purchase: free/basic locked (buy or upgrade), premium 2 credits,
 *    executive unlimited.
 */
import { getEffectiveEntitlement } from "@/lib/entitlements/helpers";
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

/**
 * subscriptionCleanup tests.
 * Risk: the cleanup cancels an UNRELATED subscription, cancels the sub we mean to
 * keep, misreads a legacy sub's tier, misses live subs past the first page, or
 * (per-journey plans) cancels a plan belonging to ANOTHER journey or candidate.
 */

jest.mock("@/lib/stripe/config", () => ({
  stripe: {
    subscriptions: { list: jest.fn(), cancel: jest.fn().mockResolvedValue({}) },
  },
  STRIPE_PRICES: {
    BASIC: "price_basic",
    PREMIUM: "price_premium",
    EXECUTIVE: "price_exec",
    BASIC_MONTHLY: "price_basic_m",
    PREMIUM_MONTHLY: "price_premium_m",
    EXECUTIVE_MONTHLY: "price_exec_m",
  },
}));

import { stripe } from "@/lib/stripe/config";
import {
  resolveSubscriptionTier,
  isRahvanaJourneySubscription,
  cancelSupersededSubscriptions,
  journeyTypeForVisaCategory,
  isAddCandidateSubscription,
} from "@/lib/stripe/subscriptionCleanup";

const mockList = (stripe as any).subscriptions.list as jest.Mock;
const mockCancel = (stripe as any).subscriptions.cancel as jest.Mock;

// Configure stripe.subscriptions.list to async-iterate over `pages` (the SDK's
// real return value is auto-paginating; we emulate that here).
function setPages(pages: any[]) {
  mockList.mockImplementation(() => ({
    async *[Symbol.asyncIterator]() {
      for (const s of pages) yield s;
    },
  }));
}

function sub(overrides: Partial<any> = {}): any {
  return {
    id: "sub_x",
    status: "active",
    metadata: {},
    items: { data: [] },
    ...overrides,
  };
}

describe("resolveSubscriptionTier", () => {
  it("reads metadata.tier first", () => {
    expect(resolveSubscriptionTier(sub({ metadata: { tier: "premium" } }))).toBe("premium");
  });

  it("falls back to a known price id (legacy sub without metadata)", () => {
    const s = sub({ items: { data: [{ price: { id: "price_premium" } }] } });
    expect(resolveSubscriptionTier(s)).toBe("premium");
  });

  it("returns null for an unknown/custom price with no metadata", () => {
    const s = sub({ items: { data: [{ price: { id: "price_custom_cr2" } }] } });
    expect(resolveSubscriptionTier(s)).toBeNull();
  });

  it("ignores a garbage metadata.tier and uses the price id", () => {
    const s = sub({
      metadata: { tier: "gold" },
      items: { data: [{ price: { id: "price_basic" } }] },
    });
    expect(resolveSubscriptionTier(s)).toBe("basic");
  });
});

describe("isRahvanaJourneySubscription", () => {
  it("true when tier resolves via metadata", () => {
    expect(isRahvanaJourneySubscription(sub({ metadata: { tier: "basic" } }))).toBe(true);
  });
  it("true when tagged with our user_id even without a resolvable tier", () => {
    expect(isRahvanaJourneySubscription(sub({ metadata: { user_id: "u1" } }))).toBe(true);
  });
  it("true when billed on a known Rahvana price id", () => {
    expect(
      isRahvanaJourneySubscription(sub({ items: { data: [{ price: { id: "price_exec" } }] } }))
    ).toBe(true);
  });
  it("false for an unrelated subscription (no metadata, unknown price)", () => {
    expect(
      isRahvanaJourneySubscription(sub({ items: { data: [{ price: { id: "price_other" } }] } }))
    ).toBe(false);
  });
});

describe("journey helpers", () => {
  it("maps visa categories to the journey that owns the plan", () => {
    expect(journeyTypeForVisaCategory("IR-1 / CR-1")).toBe("IR1");
    expect(journeyTypeForVisaCategory("ir1")).toBe("IR1");
    expect(journeyTypeForVisaCategory("IR-5")).toBe("IR5");
    expect(journeyTypeForVisaCategory("ir5")).toBe("IR5");
  });
  it("recognizes add-candidate plans by either metadata tag", () => {
    expect(isAddCandidateSubscription(sub({ metadata: { is_add_candidate: "true" } }))).toBe(true);
    expect(isAddCandidateSubscription(sub({ metadata: { action: "add_candidate" } }))).toBe(true);
    expect(isAddCandidateSubscription(sub({ metadata: { is_add_candidate: "false" } }))).toBe(false);
  });
});

describe("cancelSupersededSubscriptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCancel.mockResolvedValue({});
    setPages([]);
  });

  const ir1 = (id: string, tier = "basic", extra: any = {}) =>
    sub({ id, metadata: { tier, visa_category: "IR-1", ...extra } });
  const ir5 = (id: string, tier = "basic", extra: any = {}) =>
    sub({ id, metadata: { tier, visa_category: "IR-5", ...extra } });

  it("upgrade: retires the old plan of the SAME journey and keeps the new one", async () => {
    setPages([ir1("sub_new", "premium"), ir1("sub_old", "basic")]);
    const cancelled = await cancelSupersededSubscriptions({
      customerId: "cus_1",
      keepSubId: "sub_new",
      visaCategory: "IR-1",
      oldSubscriptionId: "sub_old",
    });
    expect(cancelled).toEqual(["sub_old"]);
    expect(mockCancel).not.toHaveBeenCalledWith("sub_new");
  });

  it("never cancels a plan for a DIFFERENT journey (IR-1 purchase keeps IR-5)", async () => {
    setPages([ir1("sub_new", "basic"), ir5("sub_ir5", "premium")]);
    const cancelled = await cancelSupersededSubscriptions({
      customerId: "cus_1",
      keepSubId: "sub_new",
      visaCategory: "IR-1",
    });
    expect(cancelled).toEqual([]);
    expect(mockCancel).not.toHaveBeenCalled();
  });

  it("add-candidate purchase replaces nothing (existing IR-5 plan survives)", async () => {
    setPages([
      ir5("sub_cand2", "basic", { is_add_candidate: "true" }),
      ir5("sub_primary", "premium"),
    ]);
    const cancelled = await cancelSupersededSubscriptions({
      customerId: "cus_1",
      keepSubId: "sub_cand2",
      visaCategory: "IR-5",
      isAddCandidate: true,
    });
    expect(cancelled).toEqual([]);
    expect(mockList).not.toHaveBeenCalled();
  });

  it("IR-5 primary upgrade keeps other candidates' add-candidate plans", async () => {
    setPages([
      ir5("sub_new", "premium"),
      ir5("sub_old_primary", "basic", { is_add_candidate: "true" }), // first IR-5 purchase
      ir5("sub_cand2", "executive", { action: "add_candidate" }),
    ]);
    const cancelled = await cancelSupersededSubscriptions({
      customerId: "cus_1",
      keepSubId: "sub_new",
      visaCategory: "IR-5",
      oldSubscriptionId: "sub_old_primary",
    });
    expect(cancelled).toEqual(["sub_old_primary"]);
  });

  it("heals a same-journey duplicate even without an upgrade hint", async () => {
    setPages([ir1("sub_keep", "premium"), ir1("sub_dupe", "premium")]);
    const cancelled = await cancelSupersededSubscriptions({
      customerId: "cus_1",
      keepSubId: "sub_keep",
      visaCategory: "IR-1",
    });
    expect(cancelled).toEqual(["sub_dupe"]);
  });

  it("leaves untagged legacy plans alone unless they are the upgrade hint", async () => {
    const legacy = (id: string) => sub({ id, items: { data: [{ price: { id: "price_basic" } }] } });
    setPages([ir1("sub_new", "premium"), legacy("sub_legacy_hint"), legacy("sub_legacy_other")]);
    const cancelled = await cancelSupersededSubscriptions({
      customerId: "cus_1",
      keepSubId: "sub_new",
      visaCategory: "IR-1",
      oldSubscriptionId: "sub_legacy_hint",
    });
    expect(cancelled).toEqual(["sub_legacy_hint"]);
  });

  it("NEVER cancels an unrelated (non-Rahvana) subscription, even as the hint", async () => {
    setPages([
      ir1("sub_keep", "premium"),
      sub({ id: "sub_unrelated", items: { data: [{ price: { id: "price_other" } }] } }),
    ]);
    const cancelled = await cancelSupersededSubscriptions({
      customerId: "cus_1",
      keepSubId: "sub_keep",
      visaCategory: "IR-1",
      oldSubscriptionId: "sub_unrelated",
    });
    expect(cancelled).toEqual([]);
  });

  it("skips non-live statuses and walks ALL pages", async () => {
    const pages = [
      ir1("sub_keep", "executive"),
      sub({
        id: "sub_dead",
        status: "canceled",
        metadata: { tier: "premium", visa_category: "IR-1" },
      }),
    ];
    for (let i = 0; i < 120; i++) pages.push(ir1(`sub_${i}`, "premium"));
    setPages(pages);
    const cancelled = await cancelSupersededSubscriptions({
      customerId: "cus_1",
      keepSubId: "sub_keep",
      visaCategory: "IR-1",
    });
    expect(cancelled).toHaveLength(120);
    expect(cancelled).not.toContain("sub_dead");
  });

  it("is best-effort: a cancel failure does not throw and others still cancel", async () => {
    setPages([ir1("sub_keep", "premium"), ir1("sub_bad"), ir1("sub_ok")]);
    mockCancel.mockImplementation((id: string) =>
      id === "sub_bad" ? Promise.reject(new Error("stripe boom")) : Promise.resolve({})
    );
    const cancelled = await cancelSupersededSubscriptions({
      customerId: "cus_1",
      keepSubId: "sub_keep",
      visaCategory: "IR-1",
    });
    expect(cancelled).toEqual(["sub_ok"]);
  });

  it("never throws even if listing blows up", async () => {
    mockList.mockImplementationOnce(() => {
      throw new Error("list exploded");
    });
    await expect(
      cancelSupersededSubscriptions({
        customerId: "cus_1",
        keepSubId: "sub_keep",
        visaCategory: "IR-1",
      })
    ).resolves.toEqual([]);
  });
});

/**
 * IR-2 regression (docs/ir2-implementation-plan.md, blocker B1).
 * Risk: "IR-2 / CR-2" contains no "5", so the old `includes("5")` mapping filed an IR-2 plan
 * under IR-1. An IR-2 purchase could then retire the user's IR-1 plan (and vice versa).
 */
describe("IR-2 is its own journey for plan ownership", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCancel.mockResolvedValue({});
    setPages([]);
  });

  const plan = (id: string, visa_category: string, tier = "basic", extra: any = {}) =>
    sub({ id, metadata: { tier, visa_category, ...extra } });

  it("maps every IR-2 / CR-2 spelling to IR2 and leaves IR-1 / IR-5 unchanged", () => {
    expect(journeyTypeForVisaCategory("IR-2 / CR-2")).toBe("IR2");
    expect(journeyTypeForVisaCategory("IR-2")).toBe("IR2");
    expect(journeyTypeForVisaCategory("ir2")).toBe("IR2");
    expect(journeyTypeForVisaCategory("CR-2")).toBe("IR2");
    expect(journeyTypeForVisaCategory("ir2_candidate-2")).toBe("IR2");
    expect(journeyTypeForVisaCategory("IR-1 / CR-1")).toBe("IR1");
    expect(journeyTypeForVisaCategory("CR-1")).toBe("IR1");
    expect(journeyTypeForVisaCategory("IR-5")).toBe("IR5");
    expect(journeyTypeForVisaCategory("ir5_candidate-2")).toBe("IR5");
  });

  it("keeps the legacy IR1 default for categories that are not sold as journeys yet", () => {
    expect(journeyTypeForVisaCategory("F-2A")).toBe("IR1");
    expect(journeyTypeForVisaCategory("K-1 / K-2")).toBe("IR1");
  });

  it("an IR-2 upgrade retires only the old IR-2 plan, never IR-1 or IR-5", async () => {
    setPages([
      plan("sub_ir2_new", "IR-2 / CR-2", "premium"),
      plan("sub_ir2_old", "IR-2 / CR-2", "basic"),
      plan("sub_ir1", "IR-1 / CR-1", "premium"),
      plan("sub_ir5", "IR-5", "executive"),
    ]);
    const cancelled = await cancelSupersededSubscriptions({
      customerId: "cus_1",
      keepSubId: "sub_ir2_new",
      visaCategory: "IR-2 / CR-2",
      oldSubscriptionId: "sub_ir2_old",
    });
    expect(cancelled).toEqual(["sub_ir2_old"]);
  });

  it("a first IR-2 purchase (no upgrade hint) does not touch the IR-1 plan", async () => {
    setPages([plan("sub_ir2", "IR-2 / CR-2", "basic"), plan("sub_ir1", "IR-1 / CR-1", "premium")]);
    const cancelled = await cancelSupersededSubscriptions({
      customerId: "cus_1",
      keepSubId: "sub_ir2",
      visaCategory: "IR-2 / CR-2",
    });
    expect(cancelled).toEqual([]);
  });

  it("an IR-1 upgrade never cancels an IR-2 plan", async () => {
    setPages([
      plan("sub_ir1_new", "IR-1 / CR-1", "premium"),
      plan("sub_ir1_old", "IR-1 / CR-1", "basic"),
      plan("sub_ir2", "IR-2 / CR-2", "basic"),
    ]);
    const cancelled = await cancelSupersededSubscriptions({
      customerId: "cus_1",
      keepSubId: "sub_ir1_new",
      visaCategory: "IR-1 / CR-1",
      oldSubscriptionId: "sub_ir1_old",
    });
    expect(cancelled).toEqual(["sub_ir1_old"]);
  });

  it("an IR-2 primary upgrade keeps other children's add-candidate plans", async () => {
    setPages([
      plan("sub_new", "IR-2 / CR-2", "premium"),
      plan("sub_old", "IR-2 / CR-2", "basic"),
      plan("sub_child2", "IR-2 / CR-2", "basic", { is_add_candidate: "true" }),
    ]);
    const cancelled = await cancelSupersededSubscriptions({
      customerId: "cus_1",
      keepSubId: "sub_new",
      visaCategory: "IR-2 / CR-2",
      oldSubscriptionId: "sub_old",
    });
    expect(cancelled).toEqual(["sub_old"]);
  });
});

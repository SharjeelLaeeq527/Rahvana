/**
 * subscriptionCleanup tests.
 * Risk: the cleanup cancels an UNRELATED subscription, cancels the sub we mean to
 * keep, misreads a legacy sub's tier, or misses live subs past the first page.
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
  cancelDuplicateSubscriptions,
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

describe("cancelDuplicateSubscriptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCancel.mockResolvedValue({});
    setPages([]);
  });

  it("cancels other LIVE Rahvana subs but keeps keepSubId", async () => {
    setPages([
      sub({ id: "sub_keep", metadata: { tier: "executive" } }),
      sub({ id: "sub_dupe", metadata: { tier: "premium" } }),
    ]);
    const cancelled = await cancelDuplicateSubscriptions("cus_1", "sub_keep");
    expect(cancelled).toEqual(["sub_dupe"]);
    expect(mockCancel).toHaveBeenCalledWith("sub_dupe");
    expect(mockCancel).not.toHaveBeenCalledWith("sub_keep");
  });

  it("NEVER cancels an unrelated (non-Rahvana) subscription", async () => {
    setPages([
      sub({ id: "sub_keep", metadata: { tier: "premium" } }),
      sub({ id: "sub_unrelated", items: { data: [{ price: { id: "price_other" } }] } }),
    ]);
    const cancelled = await cancelDuplicateSubscriptions("cus_1", "sub_keep");
    expect(cancelled).toEqual([]);
    expect(mockCancel).not.toHaveBeenCalled();
  });

  it("skips non-live statuses (canceled/incomplete) and cancels only live dupes", async () => {
    setPages([
      sub({ id: "sub_keep", metadata: { tier: "premium" } }),
      sub({ id: "sub_dead", status: "canceled", metadata: { tier: "premium" } }),
      sub({ id: "sub_incomplete", status: "incomplete", metadata: { tier: "premium" } }),
      sub({ id: "sub_live_dupe", status: "past_due", metadata: { tier: "basic" } }),
    ]);
    const cancelled = await cancelDuplicateSubscriptions("cus_1", "sub_keep");
    expect(cancelled).toEqual(["sub_live_dupe"]);
  });

  it("walks ALL pages (auto-pagination) so a dupe past page 1 is still cancelled", async () => {
    const pages = [sub({ id: "sub_keep", metadata: { tier: "executive" } })];
    for (let i = 0; i < 120; i++) {
      pages.push(sub({ id: `sub_${i}`, metadata: { tier: "premium" } }));
    }
    setPages(pages);
    const cancelled = await cancelDuplicateSubscriptions("cus_1", "sub_keep");
    expect(cancelled).toHaveLength(120);
    expect(cancelled).not.toContain("sub_keep");
  });

  it("is best-effort: a cancel failure does not throw and others still cancel", async () => {
    setPages([
      sub({ id: "sub_keep", metadata: { tier: "premium" } }),
      sub({ id: "sub_bad", metadata: { tier: "basic" } }),
      sub({ id: "sub_ok", metadata: { tier: "basic" } }),
    ]);
    mockCancel.mockImplementation((id: string) =>
      id === "sub_bad" ? Promise.reject(new Error("stripe boom")) : Promise.resolve({})
    );
    const cancelled = await cancelDuplicateSubscriptions("cus_1", "sub_keep");
    expect(cancelled).toEqual(["sub_ok"]); // sub_bad failed but did not break the run
  });

  it("never throws even if listing blows up", async () => {
    mockList.mockImplementationOnce(() => {
      throw new Error("list exploded");
    });
    await expect(cancelDuplicateSubscriptions("cus_1", "sub_keep")).resolves.toEqual([]);
  });
});

/**
 * lib/wallet/transactions.ts: the pure display/query layer behind the /wallet/transactions page and the statement PDF. Risk: a chip that hides a transaction type, a search string that breaks the PostgREST or()-filter, or a NUMERIC string rendered as NaN.
 */

import {
  FILTER_TYPES,
  LEDGER_DATE_RANGES,
  LEDGER_FILTERS,
  buildSearchOrClause,
  buildStatementQuery,
  buildTransactionsQuery,
  categoryFor,
  formatCredits,
  formatSignedCredits,
  formatUsd,
  isDebit,
  isLedgerFilter,
  paymentMethodFor,
  sanitizeSearch,
  shortRef,
  statusFor,
  toNumber,
  typesForFilter,
  type LedgerTransaction,
  type LedgerTransactionType,
} from "@/lib/wallet/transactions";

const ALL_TYPES: LedgerTransactionType[] = [
  "top_up",
  "tool_launch",
  "guide_unlock",
  "service_booking",
  "refund",
  "adjustment",
  "bonus",
];

const tx = (over: Partial<LedgerTransaction> = {}): LedgerTransaction => ({
  id: "aaaaaaaa-1111-2222-3333-444444444444",
  transaction_type: "top_up",
  amount: "500",
  amount_usd: "500",
  balance_before: "0",
  balance_after: "500",
  description: "Wallet Top-Up: 500 Credits ($500 USD)",
  resource_type: "wallet",
  resource_id: null,
  status: "completed",
  created_at: "2026-10-24T14:45:00.000Z",
  ...over,
});

describe("filter chips", () => {
  it("every transaction type is reachable from exactly one chip", () => {
    const covered = Object.values(FILTER_TYPES).flat();
    expect(new Set(covered).size).toBe(ALL_TYPES.length);
    for (const t of ALL_TYPES) expect(covered).toContain(t);
  });

  it("the 'all' chip adds no transaction_type filter", () => {
    expect(typesForFilter("all")).toEqual([]);
    expect(typesForFilter("service")).toEqual(["service_booking"]);
  });

  it("recognizes only known chip values", () => {
    expect(isLedgerFilter("topup")).toBe(true);
    expect(isLedgerFilter("hack")).toBe(false);
    expect(isLedgerFilter(null)).toBe(false);
    expect(LEDGER_FILTERS[0]).toBe("all");
  });

  it("date ranges include an all-time option", () => {
    expect(LEDGER_DATE_RANGES.some((r) => r.days === 0)).toBe(true);
  });
});

describe("query building", () => {
  it("omits neutral filters and includes active ones", () => {
    expect(buildTransactionsQuery({ page: 1, filter: "all", days: 0, search: "  " })).toBe(
      "page=1"
    );
    expect(
      buildTransactionsQuery({ page: 3, limit: 20, filter: "unlock", days: 90, search: "passport" })
    ).toBe("page=3&limit=20&type=unlock&days=90&q=passport");
  });

  it("statement query carries the view but never a page", () => {
    const qs = buildStatementQuery({ filter: "refund", days: 365, search: "" });
    expect(qs).toBe("type=refund&days=365");
    expect(qs).not.toContain("page");
  });
});

describe("sanitizeSearch", () => {
  it("neutralizes PostgREST or() metacharacters", () => {
    const out = sanitizeSearch(`abc%,(x)"d*`);
    expect(out).not.toMatch(/[,%()"*]/);
    expect(out).toContain("abc");
  });

  it("caps length and collapses whitespace", () => {
    expect(sanitizeSearch("   a       b   ")).toBe("a b");
    expect(sanitizeSearch("x".repeat(500)).length).toBeLessThanOrEqual(80);
  });
});

describe("buildSearchOrClause", () => {
  it("searches description only — uuid has no ilike operator", () => {
    expect(buildSearchOrClause("passport")).toBe("description.ilike.%passport%");
    expect(buildSearchOrClause("photo booth")).toBe("description.ilike.%photo booth%");
  });

  it("matches a pasted full reference by exact id (lowercased)", () => {
    const uuid = "E9797FC5-0E6B-42A9-BD9F-185A8D5E00A8";
    expect(buildSearchOrClause(uuid)).toBe(
      "description.ilike.%E9797FC5-0E6B-42A9-BD9F-185A8D5E00A8%,id.eq.e9797fc5-0e6b-42a9-bd9f-185a8d5e00a8"
    );
  });

  it("does not add an id clause for reference prefixes", () => {
    expect(buildSearchOrClause("e9797fc5")).not.toContain("id.");
  });
});

describe("amount formatting", () => {
  it("parses PostgREST NUMERIC strings", () => {
    expect(toNumber("1050.00")).toBe(1050);
    expect(toNumber("garbage")).toBe(0);
    expect(toNumber(null)).toBe(0);
  });

  it("signs credits and keeps magnitude readable", () => {
    expect(formatSignedCredits("500")).toBe("+500 Credits");
    expect(formatSignedCredits("-250.5")).toBe("-250.5 Credits");
    expect(formatCredits("3500")).toBe("3,500");
  });

  it("renders USD only when a value exists", () => {
    expect(formatUsd("500")).toBe("$500.00");
    expect(formatUsd(null)).toBe("");
    expect(formatUsd("")).toBe("");
    expect(formatUsd(-90)).toBe("$90.00");
  });

  it("classifies debits by sign", () => {
    expect(isDebit(tx({ amount: "-5" }))).toBe(true);
    expect(isDebit(tx({ amount: "5" }))).toBe(false);
  });

  it("shortens references without collisions in the visible prefix", () => {
    expect(shortRef("aaaaaaaa-1111-2222-3333-444444444444")).toBe("AAAAAAAA");
  });
});

describe("display metadata", () => {
  it("has a badge and tile for every type", () => {
    for (const t of ALL_TYPES) {
      const meta = categoryFor(t);
      expect(meta.label).toBeTruthy();
      expect(meta.badge).toContain("ring-1");
      expect(meta.tile).toContain("bg-");
    }
  });

  it("has a dot and label for every status", () => {
    for (const s of ["completed", "pending", "reversed", "failed"] as const) {
      expect(statusFor(s).label).toBeTruthy();
      expect(statusFor(s).dot).toContain("bg-");
    }
  });

  it("derives an honest payment method from metadata and actor", () => {
    expect(paymentMethodFor(tx({ metadata: { source: "stripe_checkout" } }))).toBe(
      "Stripe Checkout"
    );
    expect(paymentMethodFor(tx({ metadata: { source: "wallet_launch" } }))).toBe("Rahvana Wallet");
    expect(paymentMethodFor(tx({ actor_type: "admin", metadata: null }))).toBe(
      "Rahvana support adjustment"
    );
  });
});

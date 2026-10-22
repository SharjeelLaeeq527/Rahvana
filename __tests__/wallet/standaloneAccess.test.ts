import { resolveStandaloneAccess, type StandaloneAccessInput } from "@/lib/wallet/standaloneAccess";

const base: StandaloneAccessInput = {
  hasCatalogItem: true,
  isAuthenticated: true,
  planLoading: false,
  walletLoading: false,
  planAllowed: false,
  walletUnlocked: false,
};

describe("resolveStandaloneAccess (Phase 6)", () => {
  it("falls through to plain PageGate behavior when the resource has no credit price", () => {
    expect(resolveStandaloneAccess({ ...base, hasCatalogItem: false })).toBe("no-catalog");
  });

  it("plan access wins first and never waits for the wallet", () => {
    expect(resolveStandaloneAccess({ ...base, planAllowed: true, walletLoading: true })).toBe(
      "open"
    );
    expect(resolveStandaloneAccess({ ...base, planLoading: true })).toBe("checking");
  });

  it("signed-out users see the lock immediately, no wallet wait", () => {
    expect(resolveStandaloneAccess({ ...base, isAuthenticated: false, walletLoading: true })).toBe(
      "locked"
    );
  });

  it("waits for the wallet before locking, so paid users never see a lock-card flash", () => {
    expect(resolveStandaloneAccess({ ...base, walletLoading: true })).toBe("checking");
  });

  it("the Phase 6 fix: credits paid + no plan = open; nothing else = locked", () => {
    expect(resolveStandaloneAccess({ ...base, walletUnlocked: true })).toBe("open");
    expect(resolveStandaloneAccess(base)).toBe("locked");
  });
});

/**
 * Resolves access for standalone resources opened from the catalog.
 * Kept independent of React and context so it can be reused by the gate component, client hook, and Jest tests.
 *
 * Access is checked in this order:
 *  1. No catalog item -> "no-catalog"; fall back to the regular PageGate.
 *  2. Plan access is still loading -> wait for the result.
 *  3. Plan or add-on allows access -> "open".
 *  4. Signed-out users without plan access -> "locked".
 *  5. Authenticated users wait for the wallet check, if needed.
 *  6. An existing wallet unlock grants access; otherwise, stay locked.
 *
 * Wallet unlocks can grant additional access, but they never restrict users who already have access through their plan or add-on.
 */
export type StandaloneAccessInput = {
  hasCatalogItem: boolean;
  isAuthenticated: boolean;
  planLoading: boolean;
  walletLoading: boolean;
  planAllowed: boolean;
  walletUnlocked: boolean;
};

export type StandaloneAccessStatus = "open" | "locked" | "checking" | "no-catalog";

export function resolveStandaloneAccess(input: StandaloneAccessInput): StandaloneAccessStatus {
  if (!input.hasCatalogItem) return "no-catalog";
  if (input.planLoading) return "checking";
  if (input.planAllowed) return "open";
  // Signed-out users can't have wallet unlocks, so lock them immediately.
  if (!input.isAuthenticated) return "locked";
  // Wait for the wallet response to avoid briefly showing the lock to unlocked users.
  if (input.walletLoading) return "checking";
  if (input.walletUnlocked) return "open";
  return "locked";
}
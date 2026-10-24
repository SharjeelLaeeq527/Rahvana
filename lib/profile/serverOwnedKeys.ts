/**
 * Keys inside `user_profiles.profile_details` that only the server may write
 * (Stripe verify-session / webhook). They decide what the user owns:
 * `purchased_addons` is the legacy add-on ledger that entitlements and the
 * wallet read as permanent access, and `processed_addon_checkout_sessions` is
 * what stops a checkout from being applied twice.
 *
 * A client profile save must never set them (that would grant any add-on for
 * free) and must never drop them (a stale tab would erase a purchase). The DB
 * trigger `guard_user_profile_billing` enforces the same list for direct
 * `authenticated` writes; keep the two in sync.
 */
export const SERVER_OWNED_PROFILE_KEYS = [
  "purchased_addons",
  "processed_addon_checkout_sessions",
  "stripe_subscription_id",
  "active_plan",
  "plan_visa_category",
  "plan_purchase_date",
  "activated_by",
] as const;

/**
 * The client's profile_details with every server-owned key replaced by the value
 * already stored (or left out when nothing is stored).
 */
export function withServerOwnedKeys(
  incoming: Record<string, unknown>,
  stored: unknown
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...incoming };
  const current =
    stored && typeof stored === "object" && !Array.isArray(stored)
      ? (stored as Record<string, unknown>)
      : {};
  for (const key of SERVER_OWNED_PROFILE_KEYS) {
    delete out[key];
    if (Object.prototype.hasOwnProperty.call(current, key)) out[key] = current[key];
  }
  return out;
}

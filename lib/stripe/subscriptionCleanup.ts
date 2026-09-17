/**
 * lib/stripe/subscriptionCleanup.ts
 *
 * Enforces the invariant "one Rahvana JOURNEY subscription per Stripe customer"
 * and heals duplicates left behind by a webhook/DB desync.
 *
 * IMPORTANT — scope: this ONLY ever cancels subscriptions we can positively
 * identify as Rahvana journey plans (tagged with our metadata, or billed on a
 * known Rahvana price). Any other subscription on the customer (a hypothetical
 * unrelated product) is left untouched. We never cancel `keepSubId`.
 *
 * Callers (verify-session, webhook) only invoke this AFTER the new payment is
 * confirmed and AFTER the DB already points at `keepSubId`, so a valid plan is
 * never removed and the customer.subscription.deleted guard skips the downgrade.
 */

import { stripe, STRIPE_PRICES } from "@/lib/stripe/config";
import type Stripe from "stripe";

// Statuses that mean a subscription still occupies a live/billable slot.
export const LIVE_SUB_STATUSES = ["active", "trialing", "past_due", "unpaid"];

// Every Stripe price id that represents a Rahvana journey plan (annual + monthly).
// Empty strings (unset env) are filtered out so they can't match a priceless item.
const KNOWN_JOURNEY_PRICE_IDS = new Set(
  [
    STRIPE_PRICES.BASIC,
    STRIPE_PRICES.PREMIUM,
    STRIPE_PRICES.EXECUTIVE,
    STRIPE_PRICES.BASIC_MONTHLY,
    STRIPE_PRICES.PREMIUM_MONTHLY,
    STRIPE_PRICES.EXECUTIVE_MONTHLY,
  ].filter((id): id is string => typeof id === "string" && id.length > 0)
);

export type JourneyTier = "basic" | "premium" | "executive";
const JOURNEY_TIERS = new Set<JourneyTier>(["basic", "premium", "executive"]);

// Known Rahvana price id -> tier. Lets us determine a subscription's tier even
// when its metadata is missing (legacy subs created before we tagged them), so
// an old Premium sub is never mis-read as Free.
const PRICE_ID_TO_TIER: Record<string, JourneyTier> = {};
for (const [id, tier] of [
  [STRIPE_PRICES.BASIC, "basic"],
  [STRIPE_PRICES.BASIC_MONTHLY, "basic"],
  [STRIPE_PRICES.PREMIUM, "premium"],
  [STRIPE_PRICES.PREMIUM_MONTHLY, "premium"],
  [STRIPE_PRICES.EXECUTIVE, "executive"],
  [STRIPE_PRICES.EXECUTIVE_MONTHLY, "executive"],
] as const) {
  if (typeof id === "string" && id.length > 0) PRICE_ID_TO_TIER[id] = tier;
}

/**
 * Best-effort tier of a subscription, or null if it isn't a recognizable Rahvana
 * journey plan. Checks metadata.tier first (new subs), then the line-item price
 * id (legacy subs). Custom dynamic-price legacy subs (e.g. CR-2) without our
 * metadata resolve to null — UNKNOWN, deliberately not treated as a journey sub.
 */
export function resolveSubscriptionTier(sub: Stripe.Subscription): JourneyTier | null {
  const tier = (sub.metadata?.tier ?? "").toLowerCase();
  if (JOURNEY_TIERS.has(tier as JourneyTier)) return tier as JourneyTier;

  for (const item of sub.items?.data ?? []) {
    const priceId = item.price?.id;
    if (priceId && PRICE_ID_TO_TIER[priceId]) return PRICE_ID_TO_TIER[priceId];
  }
  return null;
}

/**
 * True only when we can positively identify `sub` as a Rahvana journey plan.
 * Recognizers (any one is enough):
 *   1. a resolvable journey tier (metadata.tier OR a known price id)
 *   2. metadata.user_id present (our tag)
 * Anything we cannot prove is ours is left untouched.
 */
export function isRahvanaJourneySubscription(sub: Stripe.Subscription): boolean {
  if (resolveSubscriptionTier(sub) !== null) return true;
  if (sub.metadata?.user_id) return true;

  for (const item of sub.items?.data ?? []) {
    const priceId = item.price?.id;
    if (priceId && KNOWN_JOURNEY_PRICE_IDS.has(priceId)) return true;
  }
  return false;
}

/**
 * Cancels every LIVE Rahvana journey subscription on `customerId` EXCEPT
 * `keepSubId`. Returns the ids it cancelled. Best-effort and never throws — a
 * failure here must not break activation (the next call self-heals).
 */
export async function cancelDuplicateSubscriptions(
  customerId: string,
  keepSubId: string,
  logPrefix = "[subscriptionCleanup]"
): Promise<string[]> {
  const cancelled: string[] = [];
  try {
    // Auto-paginate: `.list()` returns one page (<=100); iterating walks them all
    // so a customer with many historical subs is fully covered.
    const duplicates: Stripe.Subscription[] = [];
    for await (const s of stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 100,
    })) {
      if (
        LIVE_SUB_STATUSES.includes(s.status) &&
        s.id !== keepSubId &&
        isRahvanaJourneySubscription(s)
      ) {
        duplicates.push(s);
      }
    }

    for (const dup of duplicates) {
      try {
        await stripe.subscriptions.cancel(dup.id);
        cancelled.push(dup.id);
        console.log(`${logPrefix} Cancelled duplicate subscription ${dup.id} (kept ${keepSubId})`);
      } catch (e) {
        console.error(
          `${logPrefix} Failed to cancel duplicate sub ${dup.id}:`,
          e instanceof Error ? e.message : e
        );
      }
    }
  } catch (e) {
    console.error(`${logPrefix} list failed:`, e instanceof Error ? e.message : e);
  }
  return cancelled;
}

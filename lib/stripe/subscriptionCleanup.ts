/**
 * lib/stripe/subscriptionCleanup.ts
 *
 * Enforces the invariant "one live plan per JOURNEY" (an upgrade retires the plan
 * it replaces) and heals same-journey duplicates left behind by a webhook/DB desync.
 * A customer may legitimately hold several plans: one per journey (IR-1, IR-5) plus
 * one per added IR-5 candidate, so cleanup is always scoped to the purchase.
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
 * Journey a plan belongs to, derived from its `visa_category`. A customer can hold one live
 * plan PER journey (IR-1 and IR-5 are bought separately), so ownership checks and upgrade
 * cleanup must compare within the same journey only. Shared with checkout.
 */
export function journeyTypeForVisaCategory(visaCategory: string): "IR1" | "IR5" {
  return visaCategory.toLowerCase().includes("5") ? "IR5" : "IR1";
}

/**
 * True for a subscription bought to ADD a beneficiary to a multi-candidate journey (IR-5).
 * It pays for that candidate's journey, so it is never a stale copy of the primary plan.
 */
export function isAddCandidateSubscription(sub: Stripe.Subscription): boolean {
  return sub.metadata?.is_add_candidate === "true" || sub.metadata?.action === "add_candidate";
}

export interface SupersededSubscriptionParams {
  customerId: string;
  /** The subscription the confirmed checkout created. Never cancelled. */
  keepSubId: string;
  /** `visa_category` of the confirmed checkout: scopes cleanup to that journey. */
  visaCategory?: string | null;
  /** The confirmed checkout added a candidate: it adds a plan and replaces nothing. */
  isAddCandidate?: boolean;
  /** Checkout's `old_subscription_id` hint on an upgrade (covers untagged legacy subs). */
  oldSubscriptionId?: string | null;
  logPrefix?: string;
}

/**
 * Retires the plan(s) a confirmed checkout REPLACES, and nothing else:
 * - add-candidate purchases replace nothing (each candidate keeps its own plan);
 * - otherwise cancels the upgrade's `oldSubscriptionId`, plus any other live plan tagged
 *   with the SAME journey (a duplicate left by a desync), skipping add-candidate plans.
 * Plans for a different journey (IR-1 vs IR-5) and untagged legacy subs that are not the
 * upgrade hint are left alone. Returns the ids it cancelled. Best-effort, never throws.
 */
export async function cancelSupersededSubscriptions({
  customerId,
  keepSubId,
  visaCategory,
  isAddCandidate = false,
  oldSubscriptionId,
  logPrefix = "[subscriptionCleanup]",
}: SupersededSubscriptionParams): Promise<string[]> {
  if (isAddCandidate) return [];
  const journeyType = visaCategory ? journeyTypeForVisaCategory(visaCategory) : null;

  return cancelSubscriptionsWhere(
    customerId,
    keepSubId,
    (s) => {
      if (oldSubscriptionId && s.id === oldSubscriptionId) return true;
      if (!journeyType || !s.metadata?.visa_category) return false;
      return (
        journeyTypeForVisaCategory(s.metadata.visa_category) === journeyType &&
        !isAddCandidateSubscription(s)
      );
    },
    logPrefix
  );
}

/**
 * Cancels LIVE Rahvana journey subscriptions on `customerId` (never `keepSubId`) that match
 * `shouldCancel`. Best-effort and never throws: a failure here must not break activation
 * (the next call self-heals).
 */
async function cancelSubscriptionsWhere(
  customerId: string,
  keepSubId: string,
  shouldCancel: (sub: Stripe.Subscription) => boolean,
  logPrefix: string
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
        isRahvanaJourneySubscription(s) &&
        shouldCancel(s)
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

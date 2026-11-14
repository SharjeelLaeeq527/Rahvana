/**
 * Stripe-verified repair of a journey row's plan tier (S1).
 *
 * /api/journeys/initialize used to "self-heal" a free journey row to a paid tier using
 * values the client could write (the roster's candidates[].tier and the legacy stored
 * profile_details.journeyTiers map), with the user's own session. Those values are now
 * only a HINT that a repair may be due. The tier itself comes from a live Stripe
 * subscription on the user's customer that:
 *   - is a recognisable Rahvana journey plan in a live status,
 *   - belongs to the same journey (IR-1 / IR-2 / IR-5, via its visa_category tag),
 *   - names this candidate when it carries a candidate tag, and is not an add-candidate
 *     plan when the journey is a category's base (slot 1) journey with no tag match,
 *   - is not already attached to a different journey row of this user.
 * The write runs with the service-role client. Anything that cannot be confirmed
 * leaves the row as it is (fail closed).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import type { CandidateProfile } from "@/types/candidate";
import { findCandidateForJourneyKey, parseJourneyKey } from "@/lib/candidate/candidateKeys";

const TIER_RANK: Record<string, number> = { free: 0, basic: 1, premium: 2, executive: 3 };

export interface VerifiedJourneyTier {
  tier: "basic" | "premium" | "executive";
  subscriptionId: string;
}

export interface RepairInput {
  /** Service-role client. */
  admin: SupabaseClient;
  userId: string;
  /** Canonical journey key being opened, e.g. "ir2" / "ir5_candidate2". */
  journeyKey: string;
  /** Row id of that journey when it exists (excluded from the "already claimed" set). */
  journeyRowId?: string | null;
  roster: CandidateProfile[];
  /** Injected in tests. */
  stripeClient?: Pick<Stripe, "subscriptions"> | null;
}

async function loadStripe(): Promise<Pick<Stripe, "subscriptions"> | null> {
  try {
    const { stripe } = await import("@/lib/stripe/config");
    return stripe;
  } catch {
    return null;
  }
}

/** Live Stripe plan that pays for `journeyKey`, or null. Never writes. */
export async function verifyJourneyTierWithStripe(
  input: RepairInput
): Promise<VerifiedJourneyTier | null> {
  const { admin, userId, journeyKey, journeyRowId, roster } = input;
  const parsed = parseJourneyKey(journeyKey);
  if (!parsed.key) return null;

  const { data: profile, error: profileError } = await admin
    .from("user_profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();
  const customerId = (profile as { stripe_customer_id?: string | null } | null)?.stripe_customer_id;
  if (profileError || !customerId) return null;

  const { data: rows, error: rowsError } = await admin
    .from("journeys")
    .select("id, stripe_subscription_id")
    .eq("user_id", userId);
  if (rowsError) return null;
  const claimed = new Set(
    (rows ?? [])
      .filter((r: { id: string }) => r.id !== journeyRowId)
      .map((r: { stripe_subscription_id?: string | null }) => r.stripe_subscription_id)
      .filter((id): id is string => Boolean(id))
  );

  const stripeClient = input.stripeClient === undefined ? await loadStripe() : input.stripeClient;
  if (!stripeClient) return null;

  const {
    LIVE_SUB_STATUSES,
    isRahvanaJourneySubscription,
    isAddCandidateSubscription,
    journeyTypeForVisaCategory,
    resolveSubscriptionTier,
  } = await import("@/lib/stripe/subscriptionCleanup");

  let subs: Stripe.Subscription[];
  try {
    const list = await stripeClient.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 100,
    });
    subs = list.data;
  } catch {
    return null;
  }

  const owner = findCandidateForJourneyKey(roster, parsed.key);
  const wantedJourney = journeyTypeForVisaCategory(parsed.base);

  let best: VerifiedJourneyTier | null = null;
  for (const sub of subs) {
    if (!LIVE_SUB_STATUSES.includes(sub.status)) continue;
    if (!isRahvanaJourneySubscription(sub)) continue;
    if (claimed.has(sub.id)) continue;
    const category = sub.metadata?.visa_category;
    if (!category || journeyTypeForVisaCategory(category) !== wantedJourney) continue;

    const taggedCandidate = sub.metadata?.target_candidate_id || sub.metadata?.candidate_id || "";
    if (taggedCandidate) {
      // A tagged plan pays for exactly that candidate.
      if (!owner || owner.id !== taggedCandidate) continue;
    } else if (parsed.slot !== 1 || isAddCandidateSubscription(sub)) {
      // Untagged plans only ever paid for the category's base journey.
      continue;
    }

    const tier = resolveSubscriptionTier(sub);
    if (!tier) continue;
    if (!best || (TIER_RANK[tier] ?? 0) > (TIER_RANK[best.tier] ?? 0)) {
      best = { tier, subscriptionId: sub.id };
    }
  }
  return best;
}

/**
 * Applies a verified tier to the journey row with the service-role client. Returns the
 * tier written, or null when nothing was verified / written.
 */
export async function repairJourneyTierFromStripe(
  input: RepairInput & { journeyRowId: string }
): Promise<VerifiedJourneyTier | null> {
  const verified = await verifyJourneyTierWithStripe(input);
  if (!verified) return null;
  const { error } = await input.admin
    .from("journeys")
    .update({
      subscription_tier: verified.tier,
      stripe_subscription_id: verified.subscriptionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.journeyRowId)
    .eq("user_id", input.userId);
  if (error) {
    console.error("[journeyTierRepair] update failed:", error.message);
    return null;
  }
  return verified;
}

/** True when a client-writable hint claims this key is paid (a reason to ask Stripe). */
export function hasPaidTierHint(
  profileDetails: Record<string, unknown>,
  roster: CandidateProfile[],
  journeyKey: string
): boolean {
  const isPaid = (v: unknown) =>
    typeof v === "string" && v.trim() !== "" && v.trim().toLowerCase() !== "free";
  const owner = findCandidateForJourneyKey(roster, journeyKey);
  if (owner && isPaid(owner.tier)) return true;
  const parsed = parseJourneyKey(journeyKey);
  for (const mapKey of ["journeyTiers", "journey_tiers"]) {
    const map = profileDetails[mapKey];
    if (!map || typeof map !== "object" || Array.isArray(map)) continue;
    for (const [k, v] of Object.entries(map as Record<string, unknown>)) {
      if (!isPaid(v)) continue;
      const p = parseJourneyKey(k);
      if (p.key === parsed.key) return true;
    }
  }
  return false;
}

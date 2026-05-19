/**
 * Plan reconciliation utility.
 *
 * Source of truth: the `payments` table.
 * Compares the user's current `subscription_tier` against the highest tier
 * they have a `succeeded` payment for. If the DB tier is lower OR the
 * subscription status is not active, applies the paid tier.
 *
 * Never downgrades. Idempotent — safe to call from anywhere.
 *
 * Used by:
 *   - /api/plan/reconcile         (PlanContext defensive fetch on every mount)
 *   - /api/stripe/checkout        (prevents accidental double-pay before checkout)
 */

import { SupabaseClient } from '@supabase/supabase-js';

const TIER_RANK: Record<string, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  executive: 3,
};

export interface ReconcileResult {
  tier: string;
  status: string;
  reconciled: boolean;
  previousTier?: string;
}

export async function reconcileUserPlan(
  admin: SupabaseClient,
  userId: string,
): Promise<ReconcileResult> {
  // 1. Current DB state
  const { data: profile } = await admin
    .from('user_profiles')
    .select('subscription_tier, subscription_status, profile_details')
    .eq('id', userId)
    .single();

  const currentTier   = (profile?.subscription_tier ?? 'free').toLowerCase();
  const currentStatus = profile?.subscription_status ?? 'inactive';
  const currentRank   = TIER_RANK[currentTier] ?? 0;

  // 2. Latest succeeded journey_plan payments (last 5 for safety)
  const { data: payments } = await admin
    .from('payments')
    .select('product_id, stripe_payment_id, metadata, created_at')
    .eq('user_id', userId)
    .eq('product_type', 'journey_plan')
    .eq('status', 'succeeded')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!payments || payments.length === 0) {
    return { tier: currentTier, status: currentStatus, reconciled: false };
  }

  // 3. Find highest paid tier
  let bestTier: string | null = null;
  let bestRank = 0;
  let bestSubId: string | null = null;
  for (const p of payments) {
    const pid  = ((p.product_id as string) ?? '').toLowerCase();
    const rank = TIER_RANK[pid] ?? 0;
    if (rank > bestRank) {
      bestRank = rank;
      bestTier = pid;
      bestSubId = ((p.metadata as any)?.stripe_subscription_id as string)
        ?? ((p.stripe_payment_id as string) ?? null);
    }
  }

  if (!bestTier || bestRank === 0) {
    return { tier: currentTier, status: currentStatus, reconciled: false };
  }

  // 4. Decide whether to apply
  const needsTierUpgrade  = bestRank > currentRank;
  const needsReactivation = bestRank === currentRank && currentStatus !== 'active' && currentRank > 0;

  if (!needsTierUpgrade && !needsReactivation) {
    return { tier: currentTier, status: currentStatus, reconciled: false };
  }

  // 5. Apply paid tier (never downgrade — guaranteed by the rank check above)
  const updateData: Record<string, unknown> = {
    subscription_tier: bestTier,
    subscription_status: 'active',
  };
  if (bestSubId) {
    updateData.profile_details = {
      ...(profile?.profile_details || {}),
      active_plan: bestTier,
      stripe_subscription_id: bestSubId,
      reconciled_at: new Date().toISOString(),
    };
  }

  const { error } = await admin
    .from('user_profiles')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    console.error('[reconcileUserPlan] Update failed:', error);
    return { tier: currentTier, status: currentStatus, reconciled: false };
  }

  console.log(
    `[reconcileUserPlan] ${userId}: ${currentTier} (${currentStatus}) → ${bestTier} (active)`,
  );

  return {
    tier: bestTier,
    status: 'active',
    reconciled: true,
    previousTier: currentTier,
  };
}

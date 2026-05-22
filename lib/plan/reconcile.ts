/**
 * Plan reconciliation utility.
 *
 * TWO sources of truth:
 *   1. payments table with status='succeeded'  (webhook processed correctly)
 *   2. payments table with status='pending' but Stripe confirms paid
 *      (webhook failed — we verify directly with Stripe and apply)
 *
 * Never downgrades. Idempotent — safe to call from anywhere.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const TIER_RANK: Record<string, number> = {
  free: 0, basic: 1, premium: 2, executive: 3,
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

  // 2. All recent journey_plan payments — both succeeded AND pending
  const { data: payments } = await admin
    .from('payments')
    .select('id, product_id, stripe_payment_id, stripe_checkout_session_id, status, metadata, created_at')
    .eq('user_id', userId)
    .eq('product_type', 'journey_plan')
    .in('status', ['succeeded', 'pending'])
    .order('created_at', { ascending: false })
    .limit(10);

  if (!payments || payments.length === 0) {
    return { tier: currentTier, status: currentStatus, reconciled: false };
  }

  // 3. Find highest confirmed tier
  //    For 'succeeded' payments: trust the DB record
  //    For 'pending' payments: verify directly with Stripe
  let bestTier: string | null = null;
  let bestRank = 0;
  let bestSubId: string | null = null;
  let pendingPaymentId: string | null = null;
  let pendingSessionId: string | null = null;

  // First pass: check already-succeeded payments
  for (const p of payments) {
    if (p.status !== 'succeeded') continue;
    const pid  = ((p.product_id as string) ?? '').toLowerCase();
    const rank = TIER_RANK[pid] ?? 0;
    if (rank > bestRank) {
      bestRank = rank;
      bestTier = pid;
      bestSubId = ((p.metadata as any)?.stripe_subscription_id as string)
        ?? ((p.stripe_payment_id as string) ?? null);
    }
  }

  // Second pass: check pending payments by verifying with Stripe
  if (bestRank === 0 || currentRank < bestRank) {
    // Try to initialise Stripe lazily (only when needed, avoids import errors in edge)
    let stripeClient: Stripe | null = null;
    try {
      const { stripe } = await import('@/lib/stripe/config');
      stripeClient = stripe;
    } catch { /* Stripe unavailable in this context — skip */ }

    if (stripeClient) {
      for (const p of payments) {
        if (p.status !== 'pending') continue;
        const sessionId = p.stripe_checkout_session_id as string;
        if (!sessionId) continue;

        try {
          const session = await stripeClient.checkout.sessions.retrieve(sessionId);
          const isConfirmed = session.status === 'complete' || session.payment_status === 'paid';
          if (!isConfirmed) continue;

          const pid  = ((p.product_id as string) ?? '').toLowerCase();
          const rank = TIER_RANK[pid] ?? 0;
          if (rank > bestRank) {
            bestRank = rank;
            bestTier = pid;
            bestSubId = (session.subscription as string) || (session.payment_intent as string) || null;
            pendingPaymentId = p.id as string;
            pendingSessionId = sessionId;
          }
        } catch { /* Session not found or Stripe error — skip */ }
      }
    }
  }

  if (!bestTier || bestRank === 0) {
    return { tier: currentTier, status: currentStatus, reconciled: false };
  }

  // 4. Decide whether to apply
  const needsUpgrade     = bestRank > currentRank;
  const needsReactivation = bestRank === currentRank && currentStatus !== 'active' && currentRank > 0;

  if (!needsUpgrade && !needsReactivation) {
    return { tier: currentTier, status: currentStatus, reconciled: false };
  }

  // 5. Apply paid tier
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
      reconciled_by: 'reconcile-utility',
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

  // 6. If we found a pending payment that Stripe confirmed — mark it succeeded
  if (pendingPaymentId) {
    await admin
      .from('payments')
      .update({
        status: 'succeeded',
        ...(bestSubId ? { stripe_payment_id: bestSubId } : {}),
      })
      .eq('id', pendingPaymentId);
  }

  console.log(`[reconcileUserPlan] ${userId}: ${currentTier} → ${bestTier} (active)`);

  return { tier: bestTier, status: 'active', reconciled: true, previousTier: currentTier };
}

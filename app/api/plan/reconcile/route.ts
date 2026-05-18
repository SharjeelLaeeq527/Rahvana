
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { reconcileUserPlan } from '@/lib/plan/reconcile';

/**
 * POST /api/plan/reconcile
 *
 * Defensive reconciliation: ensures the authenticated user's subscription_tier
 * matches the highest tier they have actually paid for.
 *
 * Use cases:
 *   - Webhook failed / never fired but Stripe charged → apply the tier
 *   - profile_details update was clobbered by upgrade-cleanup race → restore
 *
 * Safety:
 *   - Never downgrades
 *   - Only applies tiers from payments with status === 'succeeded'
 *   - Idempotent — calling repeatedly is a no-op once state is correct
 */
export async function POST() {
  try {
    const supabase = await createServerClient();
    const { data: authData, error: authErr } = await supabase.auth.getUser();

    if (authErr || !authData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const result = await reconcileUserPlan(admin, authData.user.id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[plan/reconcile] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

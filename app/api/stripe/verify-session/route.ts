import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/stripe/verify-session?session_id=cs_xxx
 *
 * Checks whether the webhook for this Stripe checkout session has already
 * been processed and the user's subscription_tier has been updated in DB.
 *
 * Returns:
 *   { activated: true,  tier: "premium" }   — webhook done, tier updated
 *   { activated: false, tier: "basic"   }   — webhook not yet processed
 *   { activated: false, tier: "free", error: "..." } — session not found / bad request
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ activated: false, error: 'Missing session_id' }, { status: 400 });
  }

  try {
    // Retrieve the session from Stripe to get metadata (user_id + product_id)
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const userId    = session.metadata?.user_id;
    const productId = session.metadata?.product_id; // the target tier, e.g. "premium"

    if (!userId || !productId) {
      return NextResponse.json({ activated: false, error: 'Invalid session metadata' }, { status: 400 });
    }

    // Read current tier from DB
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier, subscription_status')
      .eq('id', userId)
      .single();

    const currentTier   = profile?.subscription_tier ?? 'free';
    const currentStatus = profile?.subscription_status ?? 'inactive';

    const TIER_RANK: Record<string, number> = { free: 0, basic: 1, premium: 2, executive: 3 };
    const targetRank  = TIER_RANK[productId.toLowerCase()] ?? 0;
    const currentRank = TIER_RANK[currentTier.toLowerCase()] ?? 0;

    // Activated = DB tier is now >= the purchased tier AND subscription is active
    const activated =
      currentStatus === 'active' && currentRank >= targetRank && currentRank > 0;

    return NextResponse.json({ activated, tier: currentTier });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[verify-session] Error:', msg);
    return NextResponse.json({ activated: false, error: msg }, { status: 500 });
  }
}

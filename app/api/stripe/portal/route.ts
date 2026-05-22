import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { paymentService } from '@/lib/services/paymentService';
import { E, msg } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: '[userId]' }) },
        { status: 400 }
      );
    }

    // Get user's Stripe customer ID
    const subscription = await paymentService.getUserSubscription(userId);

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found for this user' },
        { status: 404 }
      );
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/user-dashboard`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error: unknown) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: msg(E.AUTH_UNEXPECTED_ERROR) },
      { status: 500 }
    );
  }
}

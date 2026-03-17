import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRODUCTS } from '@/lib/stripe/config';
import { paymentService } from '@/lib/services/paymentService';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productTier, userId, consultationId } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user email from Supabase
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userEmail = userData.user.email!;

    // Check if user already has a Stripe customer ID
    let stripeCustomerId: string | undefined;
    const subscription = await paymentService.getUserSubscription(userId);
    
    if (subscription?.stripe_customer_id) {
      stripeCustomerId = subscription.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          supabase_user_id: userId,
        },
      });
      stripeCustomerId = customer.id;
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      metadata: {
        user_id: userId,
      },
    };

    // Determine the product based on productTier
    if (productTier) {
      let product: any;
      
      if (productTier === 'plus_monthly' || productTier === 'plus') {
        product = PRODUCTS.PLUS_MONTHLY;
      } else if (productTier === 'plus_yearly') {
        product = PRODUCTS.PLUS_YEARLY;
      } else if (productTier === 'pro') {
        product = PRODUCTS.PRO;
      }

      if (!product || !product.priceId) {
        const err = !product ? 'Product not found' : `Price ID not configured for ${productTier}`;
        return NextResponse.json({ error: err }, { status: 500 });
      }

      // Validate that the price ID is not a placeholder
      if (product.priceId.startsWith('price_...') || product.priceId.length < 10) {
        return NextResponse.json(
          { error: `Invalid price ID for ${productTier}. Please check server config.` },
          { status: 500 }
        );
      }

      // Set mode to subscription for recurring prices
      sessionParams.mode = 'subscription';

      sessionParams.line_items = [
        {
          price: product.priceId,
          quantity: 1,
        },
      ];

      sessionParams.metadata = {
        ...sessionParams.metadata,
        product_type: 'subscription',
        product_id: productTier,
        product_name: product.name,
      };
    }
    // Handle consultation payment
    else if (consultationId) {
      // Get consultation details
      const { data: consultation, error: consultationError } = await supabase
        .from('consultation_bookings')
        .select('*')
        .eq('id', consultationId)
        .single();

      if (consultationError || !consultation) {
        return NextResponse.json(
          { error: 'Consultation not found' },
          { status: 404 }
        );
      }

      // Define consultation price (you can make this dynamic)
      const consultationPrice = 50; // $50 for consultation

      // Set mode to payment for one-time payments
      sessionParams.mode = 'payment';

      sessionParams.line_items = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Consultation Booking',
              description: `${consultation.issue_category} - ${consultation.visa_category}`,
            },
            unit_amount: consultationPrice * 100, // Convert to cents
          },
          quantity: 1,
        },
      ];

      sessionParams.metadata = {
        ...sessionParams.metadata,
        product_type: 'consultation',
        product_id: consultationId,
        consultation_reference: consultation.reference_id,
      };
    } else {
      return NextResponse.json(
        { error: 'Either productTier or consultationId is required' },
        { status: 400 }
      );
    }

    // Ensure mode is set (fallback to payment if somehow not set)
    if (!sessionParams.mode) {
      sessionParams.mode = 'payment';
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    // Create payment record in database
    await paymentService.createPayment({
      user_id: userId,
      stripe_checkout_session_id: session.id,
      amount: session.amount_total! / 100, // Convert from cents
      currency: session.currency || 'usd',
      status: 'pending',
      product_type: (sessionParams.metadata?.product_type === 'subscription' || sessionParams.metadata?.product_type === 'consultation')
        ? sessionParams.metadata!.product_type  // Use non-null assertion since we checked above
        : 'subscription', // Ensure it matches expected type
      product_id: String(sessionParams.metadata?.product_id || ''), // Ensure it's a string
      metadata: {
        product_name: sessionParams.metadata?.product_name || 'Consultation',
        customer_email: userEmail,
      },
      // Don't set stripe_payment_id initially - it will be set by the webhook
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: unknown) {
    console.error('Error creating checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

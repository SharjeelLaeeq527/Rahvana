import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRODUCTS } from '@/lib/stripe/config';
import { paymentService } from '@/lib/services/paymentService';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { VISA_CATEGORIES } from '@/app/(main)/pricing/data/pricing';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productTier, userId, consultationId, addons, visaCategory } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user email from Supabase
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userEmail = userData.user.email!;

    // Get or create Stripe customer
    let stripeCustomerId: string | undefined;
    const subscriptionRecord = await paymentService.getUserSubscription(userId);

    if (subscriptionRecord?.stripe_customer_id) {
      stripeCustomerId = subscriptionRecord.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId },
      });
      stripeCustomerId = customer.id;
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      automatic_tax: { enabled: true },
      billing_address_collection: 'required',
      customer_update: { address: 'auto' },
      metadata: { user_id: userId },
      line_items: [],
    };

    // ================================================
    // JOURNEY PLAN — Monthly Subscription + Add-ons
    // ================================================
    if (productTier) {
      const tierLower = productTier.toLowerCase();

      let product: typeof PRODUCTS.BASIC | typeof PRODUCTS.PREMIUM | typeof PRODUCTS.EXECUTIVE | null = null;
      if (tierLower === 'basic')     product = PRODUCTS.BASIC;
      if (tierLower === 'premium')   product = PRODUCTS.PREMIUM;
      if (tierLower === 'executive') product = PRODUCTS.EXECUTIVE;

      if (!product) {
        return NextResponse.json(
          { error: `Product tier '${productTier}' not found` },
          { status: 404 }
        );
      }

      // Subscription mode for all journey plans
      sessionParams.mode = 'subscription';

      // Check visa category for custom annual price (e.g. CR-2 has lower price)
      let annualPrice = product.price;
      if (visaCategory) {
        const category = VISA_CATEGORIES.find(v => v.id === visaCategory);
        if (category) {
          const plan = category.plans.find(p => p.id === tierLower);
          if (plan) annualPrice = plan.price;
        }
      }

      // FIX 1: Use exact monthlyPrice from PRODUCTS, or divide custom annual price by 12
      const monthlyPrice =
        annualPrice === product.price
          ? product.monthlyPrice  // $29.08, $58.25, $91.58
          : Math.round((annualPrice / 12) * 100) / 100;

      // Add main plan — use saved recurringPriceId if price matches default
      const useRecurringId =
        product.recurringPriceId &&
        product.recurringPriceId.length >= 10 &&
        annualPrice === product.price; // only use saved ID if price is default

      if (useRecurringId) {
        sessionParams.line_items!.push({
          price: product.recurringPriceId,
          quantity: 1,
        });
      } else {
        // Custom price (e.g. CR-2) — create dynamic recurring price
        sessionParams.line_items!.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${product.name} (Monthly)`,
              description: product.features?.join(', ') || '',
            },
            unit_amount: Math.round(monthlyPrice * 100),
            recurring: { interval: 'month' },
          },
          quantity: 1,
        });
      }

      // FIX 2: Metadata — stripe_customer_id + addons as JSON
      sessionParams.metadata = {
        ...sessionParams.metadata,
        stripe_customer_id: stripeCustomerId!,
        product_type: 'journey_plan',
        product_id: productTier,
        product_name: product.name,
        visa_category: visaCategory || 'IR-1 / CR-1',
      };

      // Add-ons — one-time items alongside subscription
      if (addons && Array.isArray(addons) && addons.length > 0) {
        for (const addonId of addons) {
          const addonIdLower = addonId.toLowerCase();
          const addon = (PRODUCTS.ADDONS as any)?.[addonIdLower];
          
          if (addon) {
            // FORCE dynamic price_data to ensure same name/price as UI
            sessionParams.line_items!.push({
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `Add-on: ${addon.name}`,
                },
                unit_amount: Math.round(addon.price * 100),
              },
              quantity: 1,
            });
          }
        }
        // Save addons as JSON string
        sessionParams.metadata!.addons = JSON.stringify(addons);
      }
    }

    // ================================================
    // CONSULTATION — One-time Payment
    // ================================================
    else if (consultationId) {
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

      const consultationPrice = 50; // $50 per consultation

      sessionParams.mode = 'payment';
      sessionParams.line_items = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Consultation Booking',
              description: `${consultation.issue_category} - ${consultation.visa_category}`,
            },
            unit_amount: consultationPrice * 100,
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

    // Fallback mode
    if (!sessionParams.mode) {
      sessionParams.mode = 'payment';
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    // Save payment record in Supabase
    await paymentService.createPayment({
      user_id: userId,
      stripe_checkout_session_id: session.id,
      // FIX: subscription sessions may not have amount_total immediately
      amount: (session.amount_total ?? 0) / 100,
      currency: session.currency || 'usd',
      status: 'pending',
      product_type: (sessionParams.metadata?.product_type as any) || 'journey_plan',
      product_id: String(sessionParams.metadata?.product_id || ''),
      metadata: {
        product_name: sessionParams.metadata?.product_name || 'Consultation',
        customer_email: userEmail,
        stripe_customer_id: stripeCustomerId!,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: unknown) {
    console.error('Error creating checkout session:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create checkout session';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
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
    const subscriptionRecord = await paymentService.getUserSubscription(userId);
    
    if (subscriptionRecord?.stripe_customer_id) {
      stripeCustomerId = subscriptionRecord.stripe_customer_id;
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
      line_items: [],
    };

    // Determine the product based on productTier
    if (productTier) {
      let product: any;
      const tierLower = productTier.toLowerCase();
      
      if (tierLower === 'basic') {
        product = PRODUCTS.BASIC;
        sessionParams.mode = 'payment';
      } else if (tierLower === 'premium') {
        product = PRODUCTS.PREMIUM;
        sessionParams.mode = 'payment';
      } else if (tierLower === 'executive') {
        product = PRODUCTS.EXECUTIVE;
        sessionParams.mode = 'payment';
      }

      if (!product) {
        return NextResponse.json({ error: `Product tier '${productTier}' not found` }, { status: 404 });
      }

      // For subscriptions, priceId is required
      if (sessionParams.mode === 'subscription') {
        if (!product.priceId || product.priceId.startsWith('price_...') || product.priceId.length < 10) {
          return NextResponse.json(
            { error: `Invalid price ID for ${productTier}. Subscription tiers require a valid Stripe Price ID.` },
            { status: 500 }
          );
        }
        sessionParams.line_items!.push({
          price: product.priceId,
          quantity: 1,
        });
      } else {
        // Handle custom pricing from VISA_CATEGORIES (e.g. CR-2)
        let price = product.price;
        if (visaCategory) {
          const category = VISA_CATEGORIES.find(v => v.id === visaCategory);
          if (category) {
            const plan = category.plans.find(p => p.id === tierLower);
            if (plan) {
              price = plan.price;
            }
          }
        }

        // For one-time payments, we can use priceId ONLY if the price matches
        // For dynamic prices from VISA_CATEGORIES (e.g. CR-2 has different prices), 
        // we use price_data since we can't easily rely on fixed price IDs.
        const usePriceId = product.priceId && 
                         !product.priceId.startsWith('price_...') && 
                         product.priceId.length >= 10 && 
                         price === product.price;

        if (usePriceId) {
          sessionParams.line_items!.push({
            price: product.priceId,
            quantity: 1,
          });
        } else {
          sessionParams.line_items!.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: product.name,
                description: product.features?.join(', ') || '',
              },
              unit_amount: Math.round(price * 100),
            },
            quantity: 1,
          });
        }
      }

      sessionParams.metadata = {
        ...sessionParams.metadata,
        stripe_customer_id: stripeCustomerId,
        product_type: 'journey_plan',
        product_id: productTier,
        product_name: product.name,
        visa_category: visaCategory || 'IR-1 / CR-1',
      };

      // Handle Add-ons if present (only for one-time payments)
      if (addons && Array.isArray(addons) && addons.length > 0) {
        for (const addonId of addons) {
          const addonIdLower = addonId.toLowerCase();
          const addon = (PRODUCTS.ADDONS as any)?.[addonIdLower];
          if (addon) {
            if (addon.priceId && !addon.priceId.startsWith('price_...') && addon.priceId.length >= 10) {
              sessionParams.line_items!.push({
                price: addon.priceId,
                quantity: 1,
              });
            } else {
              sessionParams.line_items!.push({
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: addon.name,
                  },
                  unit_amount: Math.round(addon.price * 100),
                },
                quantity: 1,
              });
            }
          }
        }
        sessionParams.metadata!.addons = JSON.stringify(addons);
      }
    }
    // Handle consultation payment (standalone)
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
      product_type: (sessionParams.metadata?.product_type as any) || 'journey_plan',
      product_id: String(sessionParams.metadata?.product_id || ''), 
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

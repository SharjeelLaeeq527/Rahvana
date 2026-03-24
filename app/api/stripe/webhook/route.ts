import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { paymentService } from '@/lib/services/paymentService';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Disable body parsing for webhook
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    console.error('Webhook signature verification failed:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Error handling webhook event:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout session completed:', session.id);

  // Check if metadata exists
  if (!session.metadata) {
    console.error('No metadata in session');
    return;
  }

  const userId = session.metadata.user_id;
  const productType = session.metadata.product_type;
  const productId = session.metadata.product_id;

  if (!userId) {
    console.error('No user_id in session metadata');
    return;
  }

  // Get payment record
  const payment = await paymentService.getPaymentBySessionId(session.id);

  if (!payment) {
    console.error('Payment record not found for session:', session.id);
    return;
  }

  // Update payment with payment intent ID
  await paymentService.updatePayment(payment.id, {
    stripe_payment_id: session.payment_intent as string,
    status: 'succeeded',
  });

  // Handle journey plan purchase (Basic, Premium, Executive)
  if (productType === 'journey_plan' && userId && productId) {
    console.log(`User ${userId} purchased journey plan: ${productId} for visa: ${session.metadata.visa_category}`);
    
    // Parse addons from metadata
    let selectedAddons = [];
    if (session.metadata.addons) {
      try {
        selectedAddons = JSON.parse(session.metadata.addons);
      } catch (e) {
        selectedAddons = session.metadata.addons.split(',');
      }
    }

    // Update the user's subscription tier in the database
    try {
      await paymentService.updateUserSubscription(
        userId,
        productId as 'basic' | 'premium' | 'executive',
        session.customer as string || session.metadata.stripe_customer_id
      );

      // Also update metadata if needed (e.g. for visa category)
      await supabase
        .from('user_profiles')
        .update({ 
          metadata: {
            active_plan: productId,
            plan_visa_category: session.metadata.visa_category,
            plan_purchase_date: new Date().toISOString(),
            purchased_addons: selectedAddons
          }
        })
        .eq('id', userId);
        
    } catch (error) {
      console.error('Error updating user subscription/profile:', error);
    }

    // Send journey confirmation email
    await sendJourneyConfirmationEmail(
      session.customer_details?.email || '',
      productId,
      session.metadata.visa_category || 'IR-1 / CR-1'
    );
  }

  // Handle consultation payment
  if (productType === 'consultation' && userId && productId) {
    // Update consultation booking payment status
    const { error } = await supabase
      .from('consultation_bookings')
      .update({
        payment_id: payment.id,
        payment_status: 'paid',
      })
      .eq('id', productId);

    if (error) {
      console.error('Error updating consultation payment status:', error);
    } else {
      console.log(`Consultation ${productId} marked as paid`);
    }

    // Send consultation confirmation email
    await sendConsultationConfirmationEmail(
      session.customer_details?.email || '',
      session.metadata.consultation_reference || productId
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id);

  const payment = await paymentService.getPaymentByStripeId(paymentIntent.id);

  if (payment && payment.status !== 'succeeded') {
    await paymentService.updatePayment(payment.id, {
      status: 'succeeded',
    });
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent failed:', paymentIntent.id);

  const payment = await paymentService.getPaymentByStripeId(paymentIntent.id);

  if (payment) {
    await paymentService.updatePayment(payment.id, {
      status: 'failed',
    });

    // Update consultation booking if applicable
    if (payment.product_type === 'consultation') {
      await supabase
        .from('consultation_bookings')
        .update({ payment_status: 'failed' })
        .eq('id', payment.product_id);
    }
  }
}

async function sendJourneyConfirmationEmail(email: string, tier: string, visaCategory: string) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: `Your Rahvana ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan is Active!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0d7377;">Journey Confirmed! ✈️</h1>
          <p>Thank you for choosing the <strong>${tier.charAt(0).toUpperCase() + tier.slice(1)}</strong> plan for your <strong>${visaCategory}</strong> journey.</p>
          <p>Your plan is now active and you have access to all included features.</p>
          <div style="background-color: #f7f5f0; padding: 20px; border-radius: 12px; border: 1px solid #e6dfd2; margin: 20px 0;">
            <h3 style="color: #0d7377; margin-top: 0;">Journey Details:</h3>
            <p><strong>Plan:</strong> ${tier.charAt(0).toUpperCase() + tier.slice(1)}</p>
            <p><strong>Visa Category:</strong> ${visaCategory}</p>
          </div>
          <p>Access your roadmap and guided workflows in the dashboard to get started.</p>
          <p>If you have any questions, please reply to this email or contact support.</p>
          <p style="color: #6e736f; font-size: 14px;">Best regards,<br>The Rahvana Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending journey confirmation email:', error);
  }
}

async function sendConsultationConfirmationEmail(email: string, referenceId: string) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: 'Consultation Payment Confirmed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0d9488;">Payment Received! ✓</h1>
          <p>Your payment for consultation booking <strong>${referenceId}</strong> has been confirmed.</p>
          <p>Our team will review your booking and send you a confirmation with the scheduled time shortly.</p>
          <div style="background-color: #f0fdfa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0d9488; margin-top: 0;">Next Steps:</h3>
            <ul>
              <li>You'll receive a confirmation email within 24 hours</li>
              <li>Check your email for the meeting link before your scheduled time</li>
              <li>Prepare any documents you'd like to discuss</li>
            </ul>
          </div>
          <p>If you have any questions, please contact us at support@rahvana.com</p>
          <p style="color: #64748b; font-size: 14px;">Best regards,<br>The Rahvana Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending consultation confirmation email:', error);
  }
}

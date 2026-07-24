import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { paymentService } from "@/lib/services/paymentService";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { consultationService } from "@/lib/services/consultationService";
import { buildAddonPurchaseUpdate } from "@/lib/payments/addon-purchase-ledger";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: unknown) {
    console.error("Webhook signature verification failed:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  // NOTE: Activation is primarily handled by the self-healing /api/stripe/verify-session
  // endpoint (called on the payment success page) and reconcileUserPlan(). This webhook is a
  // secondary, best-effort sync. Therefore — once the signature is valid — we ALWAYS acknowledge
  // with HTTP 200, even if an individual handler throws. Returning 500 on processing errors is
  // what caused Stripe to disable this endpoint after 9 days of retries. We log failures loudly
  // for debugging but never let them fail the delivery.
  try {
    switch (event.type) {
      // ✅ Payment completed (subscription + add-ons first invoice)
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      // ✅ Every monthly charge succeeds
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      // ✅ Monthly charge fails
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      // ✅ User cancels subscription
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      // ✅ Subscription paused or updated
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      // ✅ One-time payment (consultation)
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      // ✅ One-time payment failed
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    // Log loudly so the failure is visible in production logs, but STILL return 200.
    // verify-session / reconcileUserPlan are the source of truth for activation, so a failed
    // sync here is non-critical — and a 200 keeps Stripe from disabling the endpoint again.
    console.error(`Error handling webhook event (${event.type}, ${event.id}):`, error);
    return NextResponse.json({ received: true, handler_error: true });
  }
}

// ================================================
// HANDLER 1: Checkout Session Completed
// First payment — subscription starts + add-ons charged
// ================================================
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("✅ Checkout session completed:", session.id);

  if (!session.metadata) {
    console.error("No metadata in session");
    return;
  }

  const userId = session.metadata.user_id;
  const productType = session.metadata.product_type;
  const productId = session.metadata.product_id;

  if (!userId) {
    console.error("No user_id in session metadata");
    return;
  }

  // Update payment record
  const payment = await paymentService.getPaymentBySessionId(session.id);
  if (payment) {
    await paymentService.updatePayment(payment.id, {
      stripe_payment_id: (session.payment_intent as string) || (session.subscription as string),
      status: "succeeded",
    });
  }

  // Journey Plan or Standalone Add-on
  if (productType === "journey_plan" || productType === "standalone_addon") {
    // Parse add-ons from metadata
    let selectedAddons: string[] = [];
    if (session.metadata.addons) {
      try {
        selectedAddons = JSON.parse(session.metadata.addons);
      } catch {
        selectedAddons = session.metadata.addons.split(",");
      }
    }

    // Journey Plan — activate subscription
    if (productType === "journey_plan" && productId) {
      try {
        await paymentService.updateUserSubscription(
          userId,
          productId as "basic" | "premium" | "executive",
          (session.customer as string) || session.metadata.stripe_customer_id
        );

        const { data: existingProfile } =
  await supabase
    .from("user_profiles")
    .select("profile_details")
    .eq("id", userId)
    .single();

const existingPurchasedAddons =
  Array.isArray(
    existingProfile?.profile_details
      ?.purchased_addons
  )
    ? existingProfile.profile_details
        .purchased_addons
    : [];

const mergedPlanAddons = [
  ...new Set([
    ...existingPurchasedAddons,
    ...selectedAddons,
  ]),
];

        // Save active plan details in user_profiles
        await supabase
  .from("user_profiles")
  .update({
    profile_details: {
      ...(existingProfile?.profile_details || {}),
      active_plan: productId,
      plan_visa_category:
        session.metadata.visa_category,
      plan_purchase_date:
        new Date().toISOString(),
      purchased_addons: mergedPlanAddons,
      stripe_subscription_id:
        session.subscription,
    },
  })
  .eq("id", userId);

        console.log(`✅ User ${userId} subscribed to ${productId}`);

        // Handle Upgrade cleanup
        if (session.metadata.is_upgrade === "true" && session.metadata.old_subscription_id) {
          try {
            await stripe.subscriptions.cancel(session.metadata.old_subscription_id);
            console.log(
              `✅ Cancelled old subscription ${session.metadata.old_subscription_id} after upgrade.`
            );
          } catch (cancelErr) {
            console.error("Error cancelling old subscription after upgrade:", cancelErr);
          }
        }
      } catch (error) {
        console.error("Error updating user subscription:", error);
      }

      await sendJourneyConfirmationEmail(
        session.customer_details?.email || "",
        productId,
        session.metadata.visa_category || "IR-1 / CR-1",
        selectedAddons
      );
    }
    // Standalone Add-on fulfillment
    else if (
      productType === "standalone_addon" &&
      selectedAddons.length > 0
    ) {
      try {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("profile_details")
          .eq("id", userId)
          .single();
    
        const {
          alreadyProcessed,
          profileDetails,
        } = buildAddonPurchaseUpdate(
          profile?.profile_details,
          session.id,
          selectedAddons
        );
    
        if (!alreadyProcessed) {
          await supabase
            .from("user_profiles")
            .update({
              profile_details: profileDetails,
            })
            .eq("id", userId);
        }
    
        console.log(
          `✅ User ${userId} purchased standalone addons: ${selectedAddons.join(", ")}`
        );
      } catch (error) {
        console.error(
          "Error updating standalone addons:",
          error
        );
      }
    }
  }

  // Consultation — mark as paid
  if (productType === "consultation" && productId) {
    // Check if booking already exists (could be created by verify-session)
    const { data: existingBooking } = await supabase
      .from("consultation_bookings")
      .select("id")
      .eq("reference_id", productId)
      .maybeSingle();

    if (existingBooking) {
      const { error } = await supabase
        .from("consultation_bookings")
        .update({
          payment_id: payment?.id,
          payment_status: "paid",
        })
        .eq("id", existingBooking.id);

      if (error) {
        console.error("Error updating consultation payment status:", error);
      }
    } else {
      // Reconstruct case_summary from split metadata fields
      let caseSummary = "";
      let index = 1;
      while (true) {
        const part = session.metadata?.[`c_summary_${index}`];
        if (!part) break;
        caseSummary += part;
        index++;
      }

      // Reconstruct arrays
      const attachments = session.metadata?.c_attachments ? session.metadata.c_attachments.split(",") : [];
      const alternateSlots = session.metadata?.c_alternate_slots 
        ? session.metadata.c_alternate_slots.split(",").map((s) => new Date(s)) 
        : [];

      const bookingData = {
        issue_category: session.metadata?.c_issue_category || "General Inquiry",
        visa_category: session.metadata?.c_visa_category || "IR-1 / CR-1",
        case_stage: session.metadata?.c_case_stage || "Not Specified",
        urgency: (session.metadata?.c_urgency as any) || "normal",
        preferred_language: session.metadata?.c_preferred_language || "English",
        full_name: session.metadata?.c_full_name || "Unknown",
        email: session.metadata?.c_email || session.customer_details?.email || "",
        whatsapp_phone: session.metadata?.c_whatsapp_phone || "",
        embassy_consulate: session.metadata?.c_embassy_consulate || "",
        case_summary: caseSummary,
        attachments: attachments,
        selected_slot: new Date(session.metadata?.c_selected_slot || Date.now()),
        alternate_slots: alternateSlots,
        reference_id: productId,
        status: "pending_approval" as const,
        payment_status: "paid" as const,
        payment_id: payment?.id,
      };

      await consultationService.createBooking(bookingData);
    }

    await sendConsultationConfirmationEmail(
      session.customer_details?.email || "",
      session.metadata.consultation_reference || productId
    );
  }
}

// ================================================
// HANDLER 2: Invoice Payment Succeeded
// Every monthly charge — keep subscription active
// ================================================
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("✅ Invoice payment succeeded:", invoice.id);

  // Skip the first invoice — already handled by checkout.session.completed
  if (invoice.billing_reason === "subscription_create") {
    console.log("First invoice — skipping (handled by checkout.session.completed)");
    return;
  }

  const customerId = invoice.customer as string;

  // Find user by stripe_customer_id
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id, metadata")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!profile) {
    console.error("No user found for customer:", customerId);
    return;
  }

  // Keep subscription active
  await supabase
    .from("user_profiles")
    .update({
      subscription_status: "active",
      metadata: {
        ...profile.metadata,
        last_payment_date: new Date().toISOString(),
      },
    })
    .eq("id", profile.id);

  console.log(`✅ Monthly charge succeeded for user ${profile.id}`);
}

// ================================================
// HANDLER 3: Invoice Payment Failed
// Monthly charge failed — warn user
// ================================================
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("❌ Invoice payment failed:", invoice.id);

  const customerId = invoice.customer as string;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!profile) return;

  // Mark subscription as past_due
  await supabase
    .from("user_profiles")
    .update({ subscription_status: "past_due" })
    .eq("id", profile.id);

  // Send payment failed email
  try {
    const customerEmail = typeof invoice.customer_email === "string" ? invoice.customer_email : "";

    if (customerEmail) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: customerEmail,
        subject: "Action Required — Rahvana Payment Failed",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626;">Payment Failed ⚠️</h1>
            <p>We were unable to process your monthly Rahvana subscription payment.</p>
            <p>Please update your payment method to keep your plan active.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing" 
               style="display:inline-block; padding: 12px 24px; background: #0d7377; color: white; border-radius: 24px; text-decoration: none; font-weight: bold;">
              Update Payment Method
            </a>
            <p style="color: #6e736f; font-size: 14px; margin-top: 24px;">
              If you have any questions, contact us at support@rahvana.com
            </p>
          </div>
        `,
      });
    }
  } catch (error) {
    console.error("Error sending payment failed email:", error);
  }
}

// ================================================
// HANDLER 4: Subscription Deleted (Cancelled)
// User cancelled — remove access
// ================================================
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("❌ Subscription cancelled:", subscription.id);

  const customerId = subscription.customer as string;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id, metadata, profile_details")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!profile) {
    console.error("No user found for customer:", customerId);
    return;
  }

  // Guard: if the cancelled sub is NOT the user's current active sub, it was
  // cancelled as part of an upgrade flow — do NOT downgrade.
  const currentSubId = profile.profile_details?.stripe_subscription_id;
  if (currentSubId && currentSubId !== subscription.id) {
    console.log(
      `Skipping downgrade — cancelled sub ${subscription.id} is not current (${currentSubId}). Upgrade cleanup.`
    );
    return;
  }

  // Downgrade user to free plan
  await supabase
    .from("user_profiles")
    .update({
      subscription_tier: "free",
      subscription_status: "canceled",
      metadata: {
        ...profile.metadata,
        active_plan: null,
        plan_cancelled_date: new Date().toISOString(),
        stripe_subscription_id: null,
      },
    })
    .eq("id", profile.id);

  console.log(`✅ User ${profile.id} downgraded to free plan`);

  // Send cancellation email
  try {
    const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
    if (customer.email) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: customer.email,
        subject: "Your Rahvana Subscription Has Been Cancelled",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0d7377;">Subscription Cancelled</h1>
            <p>Your Rahvana subscription has been cancelled. You will retain access until the end of your current billing period.</p>
            <p>If you change your mind, you can resubscribe at any time from your dashboard.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing"
               style="display:inline-block; padding: 12px 24px; background: #0d7377; color: white; border-radius: 24px; text-decoration: none; font-weight: bold;">
              Resubscribe
            </a>
            <p style="color: #6e736f; font-size: 14px; margin-top: 24px;">Best regards,<br>The Rahvana Team</p>
          </div>
        `,
      });
    }
  } catch (error) {
    console.error("Error sending cancellation email:", error);
  }
}

// ================================================
// HANDLER 5: Subscription Updated
// Plan changed, paused, or resumed
// ================================================
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("🔄 Subscription updated:", subscription.id);

  const customerId = subscription.customer as string;
  const status = subscription.status; // active, past_due, paused, canceled etc.

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!profile) return;

  // Map Stripe status to our status
  const mappedStatus =
    status === "active" ? "active" : status === "canceled" ? "canceled" : "inactive";

  await supabase
    .from("user_profiles")
    .update({ subscription_status: mappedStatus })
    .eq("id", profile.id);

  console.log(`✅ User ${profile.id} subscription status updated to ${mappedStatus}`);
}

// ================================================
// HANDLER 6: Payment Intent Succeeded (consultation)
// ================================================
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log("✅ Payment intent succeeded:", paymentIntent.id);

  const payment = await paymentService.getPaymentByStripeId(paymentIntent.id);
  if (payment && payment.status !== "succeeded") {
    await paymentService.updatePayment(payment.id, {
      status: "succeeded",
    });
  }
}

// ================================================
// HANDLER 7: Payment Intent Failed (consultation)
// ================================================
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log("❌ Payment intent failed:", paymentIntent.id);

  const payment = await paymentService.getPaymentByStripeId(paymentIntent.id);
  if (payment) {
    await paymentService.updatePayment(payment.id, { status: "failed" });

    if (payment.product_type === "consultation") {
      await supabase
        .from("consultation_bookings")
        .update({ payment_status: "failed" })
        .eq("id", payment.product_id);
    }
  }
}

// ================================================
// EMAIL: Journey Plan Confirmation
// ================================================
async function sendJourneyConfirmationEmail(
  email: string,
  tier: string,
  visaCategory: string,
  addons: string[]
) {
  if (!email) return;
  try {
    const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: `Your Rahvana ${tierName} Plan is Active!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0d7377;">Journey Confirmed! ✈️</h1>
          <p>Thank you for choosing the <strong>${tierName}</strong> plan for your <strong>${visaCategory}</strong> journey.</p>
          <p>Your subscription is now active and you will be charged monthly.</p>
          <div style="background-color: #f7f5f0; padding: 20px; border-radius: 12px; border: 1px solid #e6dfd2; margin: 20px 0;">
            <h3 style="color: #0d7377; margin-top: 0;">Plan Details:</h3>
            <p><strong>Plan:</strong> ${tierName}</p>
            <p><strong>Visa Category:</strong> ${visaCategory}</p>
            <p><strong>Billing:</strong> Monthly subscription</p>
            ${addons.length > 0 ? `<p><strong>Add-ons:</strong> ${addons.join(", ")}</p>` : ""}
          </div>
          <p>Access your roadmap and guided workflows in the dashboard to get started.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
             style="display:inline-block; padding: 12px 24px; background: #0d7377; color: white; border-radius: 24px; text-decoration: none; font-weight: bold;">
            Go to Dashboard
          </a>
          <p style="color: #6e736f; font-size: 14px; margin-top: 24px;">Best regards,<br>The Rahvana Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending journey confirmation email:", error);
  }
}

// ================================================
// EMAIL: Consultation Confirmation
// ================================================
async function sendConsultationConfirmationEmail(email: string, referenceId: string) {
  if (!email) return;
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "Consultation Payment Confirmed — Rahvana",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0d9488;">Payment Received! ✓</h1>
          <p>Your payment for consultation booking <strong>${referenceId}</strong> has been confirmed.</p>
          <p>Our team will review your booking and send you a confirmation with the scheduled time shortly.</p>
          <div style="background-color: #f0fdfa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0d9488; margin-top: 0;">Next Steps:</h3>
            <ul>
              <li>You will receive a confirmation email within 24 hours</li>
              <li>Check your email for the meeting link before your scheduled time</li>
              <li>Prepare any documents you would like to discuss</li>
            </ul>
          </div>
          <p>If you have any questions, please contact us at support@rahvana.com</p>
          <p style="color: #64748b; font-size: 14px;">Best regards,<br>The Rahvana Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending consultation confirmation email:", error);
  }
}

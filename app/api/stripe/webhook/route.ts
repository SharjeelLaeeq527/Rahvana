import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { paymentService } from "@/lib/services/paymentService";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { consultationService } from "@/lib/services/consultationService";
import { triggerTranslationNotification } from "@/lib/notifications";
import { buildAddonPurchaseUpdate } from "@/lib/payments/addon-purchase-ledger";
import { cancelSupersededSubscriptions } from "@/lib/stripe/subscriptionCleanup";
import { getCandidateJourneyKey } from "@/lib/candidate/candidateSyncService";
import { provisionCandidateJourneysAndVaults } from "@/lib/candidate/candidateProvisioningService";
import {
  WALLET_TOPUP_PRODUCT_TYPE,
  WalletWebhookRetryableError,
  applyWalletRefund,
  applyWalletTopup,
  isWalletTopupSession,
} from "@/lib/wallet/topup";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Plan ranking for the account-level summary (`user_profiles.subscription_tier`).
const SUMMARY_TIER_RANK: Record<string, number> = { free: 0, basic: 1, premium: 2, executive: 3 };

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

      // Delayed payment methods settle after checkout completes. Only wallet
      // top-ups act on this event; everything else is unchanged.
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (isWalletTopupSession(session)) await handleCheckoutSessionCompleted(session);
        break;
      }

      // Wallet top-up refunded: take the credits back. Other refunds are ignored.
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
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
    // The one exception to "always 200": a paid wallet top-up that could not be
    // credited (or a refund that could not be reversed) because of a transient
    // failure. Answer 500 so Stripe retries; the wallet RPCs are idempotent, so a
    // retry can never credit or reverse twice.
    if (error instanceof WalletWebhookRetryableError) {
      console.error(
        `Wallet webhook failed, asking Stripe to retry (${event.type}, ${event.id}):`,
        error
      );
      return NextResponse.json({ received: false, retry: true }, { status: 500 });
    }
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

  // Wallet top-up: credit the wallet (idempotent with verify-session), then mark
  // the payment succeeded only once the credits landed. Nothing else applies.
  if (isWalletTopupSession(session)) {
    const result = await applyWalletTopup(supabase, session, "[webhook]");
    if (result.ok) {
      const topupPayment = await paymentService.getPaymentBySessionId(session.id);
      if (topupPayment && topupPayment.status !== "succeeded") {
        await paymentService.updatePayment(topupPayment.id, {
          stripe_payment_id: (session.payment_intent as string) || undefined,
          status: "succeeded",
        });
      }
      console.log(
        `✅ Wallet top-up ${result.alreadyProcessed ? "already credited" : `+${result.credits} credits`} for user ${userId}`
      );
    } else {
      console.error(`[webhook] Wallet top-up not applied for ${session.id}: ${result.reason}`);
      // A transient DB failure must be retried: there may be no success-page
      // visit to self-heal it. not_paid / invalid_session never become creditable.
      if (result.reason === "rpc_failed") {
        throw new WalletWebhookRetryableError(
          `credit_wallet_topup_atomic failed for ${session.id}`
        );
      }
    }
    return;
  }

  // Update payment record
  const payment = await paymentService.getPaymentBySessionId(session.id);
  if (payment) {
    await paymentService.updatePayment(payment.id, {
      // Keep each Stripe id in its own column: pi_... vs sub_... (undefined
      // values are omitted by the client, so a subscription won't null out
      // stripe_payment_id and vice versa).
      stripe_payment_id: (session.payment_intent as string) || undefined,
      stripe_subscription_id: (session.subscription as string) || undefined,
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

        // Provision Candidates, Candidate Journeys, and Isolated Document Vaults
        const visaCategoryMeta = session.metadata?.visa_category || "ir1";
        const candidateCountMeta = parseInt(session.metadata?.candidate_count || "1", 10) || 1;
        const isAddCandidateMeta =
          session.metadata?.action === "add_candidate" ||
          session.metadata?.is_add_candidate === "true";
        const targetCandidateIdMeta =
          session.metadata?.target_candidate_id || session.metadata?.candidate_id || undefined;

        await provisionCandidateJourneysAndVaults({
          supabase,
          userId,
          visaCategory: visaCategoryMeta,
          candidateCount: candidateCountMeta,
          tier: productId,
          stripeSubscriptionId: (session.subscription as string) || undefined,
          isAddCandidate: isAddCandidateMeta,
          targetCandidateId: targetCandidateIdMeta,
          isUpgrade: session.metadata?.is_upgrade === "true",
        });

        const { data: existingProfile } = await supabase
          .from("user_profiles")
          .select("profile_details")
          .eq("id", userId)
          .single();

        const existingPurchasedAddons = Array.isArray(
          existingProfile?.profile_details?.purchased_addons
        )
          ? existingProfile.profile_details.purchased_addons
          : [];

        const mergedPlanAddons = [...new Set([...existingPurchasedAddons, ...selectedAddons])];

        // Save active plan details in user_profiles
        await supabase
          .from("user_profiles")
          .update({
            profile_details: {
              ...(existingProfile?.profile_details || {}),
              active_plan: productId,
              plan_visa_category: session.metadata.visa_category,
              plan_purchase_date: new Date().toISOString(),
              purchased_addons: mergedPlanAddons,
              stripe_subscription_id: session.subscription,
            },
          })
          .eq("id", userId);

        console.log(`✅ User ${userId} subscribed to ${productId}`);

        // ── Upgrade cleanup: retire the plan this checkout replaces. ───────────
        // Runs only after this checkout completed (payment confirmed) and after
        // the DB above now points at this session's subscription, so a retired
        // plan can never be mistaken for the current sub and trigger a downgrade.
        // Scoped to THIS journey: an IR-1 purchase never touches the IR-5 plan, and
        // an add-candidate purchase replaces nothing. Mirrors verify-session;
        // whichever activation path fires first does the cleanup (idempotent).
        const customerIdForCleanup =
          (session.customer as string) || session.metadata.stripe_customer_id;
        const keepSubId = session.subscription as string;
        if (customerIdForCleanup && keepSubId) {
          await cancelSupersededSubscriptions({
            customerId: customerIdForCleanup,
            keepSubId,
            visaCategory: visaCategoryMeta,
            isAddCandidate: isAddCandidateMeta,
            oldSubscriptionId:
              session.metadata.is_upgrade === "true" ? session.metadata.old_subscription_id : null,
            logPrefix: "[webhook]",
          });
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
    else if (productType === "standalone_addon" && selectedAddons.length > 0) {
      try {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("profile_details")
          .eq("id", userId)
          .single();

        const { alreadyProcessed, profileDetails } = buildAddonPurchaseUpdate(
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

        console.log(`✅ User ${userId} purchased standalone addons: ${selectedAddons.join(", ")}`);
      } catch (error) {
        console.error("Error updating standalone addons:", error);
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
      const attachments = session.metadata?.c_attachments
        ? session.metadata.c_attachments.split(",")
        : [];
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

  // Document Translation — deferred-create (pay-first) or mark as paid.
  // Mirrors verify-session so a paid request still lands even if the user never
  // returns to the success page. Idempotent: the existence check + primary key guard
  // against the webhook and verify-session both running.
  if (productType === "document_translations" && productId) {
    const { data: existingDoc } = await supabase
      .from("translation_documents")
      .select("id, payment_status")
      .eq("id", productId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingDoc) {
      if (existingDoc.payment_status !== "paid") {
        await supabase
          .from("translation_documents")
          .update({ payment_status: "paid", payment_id: payment?.id })
          .eq("id", productId)
          .eq("user_id", userId);
      }
    } else {
      let userNotes = "";
      let noteIndex = 1;
      while (true) {
        const part = session.metadata?.[`t_notes_${noteIndex}`];
        if (!part) break;
        userNotes += part;
        noteIndex++;
      }

      const docId = session.metadata?.t_doc_id || productId;
      const { error: insertErr } = await supabase.from("translation_documents").insert({
        id: docId,
        user_id: userId,
        user_email: session.metadata?.t_user_email || session.customer_details?.email || "",
        user_name: session.metadata?.t_user_name || "User",
        document_type: session.metadata?.t_document_type || "marriage",
        original_file_path: session.metadata?.t_storage_path || "",
        original_filename: session.metadata?.t_original_filename || "",
        original_file_size: Number(session.metadata?.t_original_file_size || 0) || 0,
        original_mime_type: session.metadata?.t_original_mime_type || "application/pdf",
        user_notes: userNotes || null,
        status: "PENDING",
        payment_status: "paid",
        payment_id: payment?.id,
        metadata: {
          candidate_id: session.metadata?.t_candidate_id || "candidate-1",
          candidate_name: session.metadata?.t_candidate_name || "",
          source: session.metadata?.t_source || "standalone",
          journey_slug: session.metadata?.t_journey_slug || null,
        },
      });

      if (insertErr) {
        // A PK conflict means verify-session already created it — that's fine.
        console.error("[webhook] translation deferred-create error:", insertErr);
      } else {
        try {
          await triggerTranslationNotification(docId);
        } catch (notifErr) {
          console.error("[webhook] translation notification error:", notifErr);
        }
      }
    }
  }

  // Medical appointment / PCC filing — mark as paid and reveal the draft.
  // These rows are pre-created (as hidden drafts when payment was required), so
  // fulfillment here just flips the existing row. Idempotent (only acts when not
  // already paid) and covers the case where the user paid but never returned to the
  // success page (previously only verify-session flipped these — an orphaned draft).
  if ((productType === "medical_booking" || productType === "pcc_filing") && productId) {
    const serviceTable =
      productType === "medical_booking" ? "appointments" : "police_verification_requests";
    const { data: existingServiceRow } = await supabase
      .from(serviceTable)
      .select("id, payment_status")
      .eq("id", productId)
      .maybeSingle();

    if (existingServiceRow && existingServiceRow.payment_status !== "paid") {
      await supabase
        .from(serviceTable)
        .update({ payment_status: "paid", awaiting_payment: false })
        .eq("id", productId);
      console.log(`✅ [webhook] ${productType} ${productId} marked paid and revealed`);
    }
  }
}

// ================================================
// HANDLER 2: Invoice Payment Succeeded
// Every monthly charge — keep subscription active
// ================================================
// ================================================
// HANDLER: Charge Refunded (wallet top-ups only)
// ================================================
async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  // Top-ups tag their PaymentIntent (checkout payment_intent_data.metadata). Cheap
  // filter so refunds of plans / consultations are left alone.
  let piMetadata = charge.metadata;
  if (piMetadata?.product_type !== WALLET_TOPUP_PRODUCT_TYPE) {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    piMetadata = pi.metadata;
  }
  if (piMetadata?.product_type !== WALLET_TOPUP_PRODUCT_TYPE) return;

  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentIntentId,
    limit: 1,
  });
  const session = sessions.data[0];
  if (!session || !isWalletTopupSession(session) || !session.metadata?.user_id) {
    console.error(`[webhook] Refunded wallet charge ${charge.id} has no matching top-up session`);
    return;
  }

  // Credit first if the top-up never landed (refund raced the credit), so the
  // reversal below always has a top-up to reverse. Idempotent.
  const credited = await applyWalletTopup(supabase, session, "[webhook:refund]");
  if (!credited.ok) {
    if (credited.reason === "rpc_failed") {
      throw new WalletWebhookRetryableError(`credit before refund failed for ${session.id}`);
    }
    console.error(
      `[webhook] Refunded top-up ${session.id} was never creditable: ${credited.reason}`
    );
    return;
  }

  const result = await applyWalletRefund(
    supabase,
    {
      userId: session.metadata.user_id,
      stripeSessionId: session.id,
      amountRefundedCents: charge.amount_refunded,
      amountCapturedCents: charge.amount_captured,
      chargeId: charge.id,
    },
    "[webhook:refund]"
  );

  if (!result.ok) {
    if (result.reason === "rpc_failed") {
      throw new WalletWebhookRetryableError(`reverse_wallet_topup_atomic failed for ${session.id}`);
    }
    console.error(`[webhook] Wallet refund not applied for ${session.id}: ${result.reason}`);
    return;
  }
  console.log(
    `✅ Wallet refund for ${session.id}: -${result.creditsDeducted} credits` +
      (result.shortfall > 0 ? ` (shortfall ${result.shortfall}, already spent)` : "") +
      (result.alreadyProcessed ? " (already processed)" : "")
  );
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("✅ Invoice payment succeeded:", invoice.id);

  // Skip the first invoice — already handled by checkout.session.completed
  if (invoice.billing_reason === "subscription_create") {
    console.log("First invoice, skipping (handled by checkout.session.completed)");
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
        subject: "Action Required, Rahvana Payment Failed",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626;">Payment Failed</h1>
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

  // The account summary tracks one "current" sub. Any other cancelled sub is either an
  // upgrade's retired plan or another journey's plan.
  const currentSubId = profile.profile_details?.stripe_subscription_id;
  const isCurrentSub = !currentSubId || currentSubId === subscription.id;

  // ── 1. Revoke the journeys this plan paid for. ──────────────────────────────
  // Entitlements resolve per journey (`journeys.subscription_tier`), so the journey
  // rows still pointing at the cancelled sub drop to free (for an IR-5 purchase that
  // can be several candidate journeys). An upgrade's retired plan matches no row:
  // provisioning repoints the journey at the new sub BEFORE cleanup cancels the old
  // one, so upgrade cleanup never revokes anything here.
  const revokedUpdate = {
    subscription_tier: "free",
    stripe_subscription_id: null,
    updated_at: new Date().toISOString(),
  };
  let { data: revokedJourneys } = await supabase
    .from("journeys")
    .update(revokedUpdate)
    .eq("user_id", profile.id)
    .eq("stripe_subscription_id", subscription.id)
    .select("id, journey_type");
  if (!revokedJourneys?.length && isCurrentSub) {
    // Legacy rows paid before journeys were stamped with their sub id: the account's
    // current plan ended, so its unstamped paid journeys go with it.
    ({ data: revokedJourneys } = await supabase
      .from("journeys")
      .update(revokedUpdate)
      .eq("user_id", profile.id)
      .is("stripe_subscription_id", null)
      .neq("subscription_tier", "free")
      .select("id, journey_type"));
  }
  const revokedCount = revokedJourneys?.length ?? 0;
  if (revokedCount > 0) {
    console.log(`Revoked ${revokedCount} journey(s) paid by cancelled sub ${subscription.id}`);
  }

  // The roster's per-candidate `tier` also gates access (PlanContext forces a candidate
  // whose tier is "free" to free, while journey tiers are keyed per CATEGORY), so the
  // candidates whose journeys were revoked drop to free too. Otherwise a cancelled
  // candidate-2 plan would keep inheriting candidate-1's IR-5 tier.
  const normKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, "");
  const revokedKeys = new Set((revokedJourneys || []).map((j) => normKey(j.journey_type || "")));
  const details = { ...(profile.profile_details || {}) };
  if (revokedKeys.size > 0 && Array.isArray(details.candidates)) {
    details.candidates = details.candidates.map((c: { id?: string; visaCategory?: string }) =>
      c?.visaCategory && revokedKeys.has(normKey(getCandidateJourneyKey(c.visaCategory, c.id)))
        ? { ...c, tier: "free" }
        : c
    );
  }

  // ── 2. Account-level summary. ────────────────────────────────────────────────
  if (!isCurrentSub && revokedCount === 0) {
    console.log(
      `Skipping downgrade, cancelled sub ${subscription.id} is not current (${currentSubId}). Upgrade cleanup.`
    );
    return;
  }

  if (!isCurrentSub) {
    // Another journey's plan ended: summary unchanged, only the roster tiers.
    await supabase.from("user_profiles").update({ profile_details: details }).eq("id", profile.id);
  } else {
    // Other journeys may still be paid (e.g. IR-1 cancelled, IR-5 still live): the
    // summary falls back to the best remaining journey plan instead of to free.
    const { data: remainingJourneys } = await supabase
      .from("journeys")
      .select("subscription_tier, stripe_subscription_id")
      .eq("user_id", profile.id);
    const best = (remainingJourneys || []).reduce<{
      tier: string;
      rank: number;
      subId: string | null;
    }>(
      (acc, j) => {
        const tier = (j.subscription_tier || "free").toLowerCase();
        const rank = SUMMARY_TIER_RANK[tier] ?? 0;
        return rank > acc.rank ? { tier, rank, subId: j.stripe_subscription_id ?? null } : acc;
      },
      { tier: "free", rank: 0, subId: null }
    );
    const stillPaid = best.rank > 0;

    // Clear (or repoint) the subscription id in BOTH metadata and profile_details: the
    // rest of the app reads profile_details.stripe_subscription_id, so leaving a stale
    // id there would confuse the next purchase's upgrade detection.
    await supabase
      .from("user_profiles")
      .update({
        subscription_tier: best.tier,
        subscription_status: stillPaid ? "active" : "canceled",
        metadata: {
          ...profile.metadata,
          active_plan: stillPaid ? best.tier : null,
          plan_cancelled_date: new Date().toISOString(),
          stripe_subscription_id: best.subId,
        },
        profile_details: {
          ...details,
          active_plan: stillPaid ? best.tier : null,
          stripe_subscription_id: best.subId,
        },
      })
      .eq("id", profile.id);

    console.log(`✅ User ${profile.id} account summary set to ${best.tier}`);
  }

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
      subject: "Consultation Payment Confirmed, Rahvana",
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

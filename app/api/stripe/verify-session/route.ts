import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { consultationService } from "@/lib/services/consultationService";
import { buildAddonPurchaseUpdate } from "@/lib/payments/addon-purchase-ledger";
import { cancelDuplicateSubscriptions } from "@/lib/stripe/subscriptionCleanup";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TIER_RANK: Record<string, number> = { free: 0, basic: 1, premium: 2, executive: 3 };

/**
 * GET /api/stripe/verify-session?session_id=cs_xxx
 *
 * Self-healing activation endpoint — does NOT depend on webhooks.
 * Called by the payment success page after Stripe redirect.
 *
 * Handles:
 *   • Journey Plan subscriptions  (basic / premium / executive)
 *   • Standalone add-on purchases  (one-time payment)
 *   • Plan upgrades                (cancels old subscription, applies new tier)
 *
 * Flow:
 *   1. Retrieve session from Stripe — confirm payment
 *   2. Apply tier (or merge add-on) to user_profiles
 *   3. Mark payment record as succeeded
 *   4. Send confirmation email
 *   5. Cancel previous subscription if this is an upgrade
 *
 * Idempotent — safe to call multiple times. Email sent only once.
 */

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ activated: false, error: "Missing session_id" }, { status: 400 });
  }

  try {
    // 1. Get session from Stripe (with line_items expanded to read amounts/products)
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const userId = session.metadata?.user_id;
    const productType = session.metadata?.product_type;
    const productId = session.metadata?.product_id?.toLowerCase();
    const isUpgrade = session.metadata?.is_upgrade === "true";
    const oldSubId = session.metadata?.old_subscription_id;
    const addonsJson = session.metadata?.addons;

    if (!userId) {
      return NextResponse.json(
        { activated: false, error: "Invalid session metadata" },
        { status: 400 }
      );
    }

    // Confirm payment is complete
    const paid = session.status === "complete" || session.payment_status === "paid";
    if (!paid) {
      return NextResponse.json({ activated: false, tier: "free" });
    }

    // 2. Fetch current profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("subscription_tier, subscription_status, profile_details, stripe_customer_id")
      .eq("id", userId)
      .single();

    const currentTier = (profile?.subscription_tier ?? "free").toLowerCase();
    const currentRank = TIER_RANK[currentTier] ?? 0;

    // 3. Decide what type of purchase this is
    let activated = false;
    let appliedTier = currentTier;

    // ── 3a. JOURNEY PLAN (subscription) ──────────────────────────────────────
    if (productType === "journey_plan" && productId && TIER_RANK[productId] > 0) {
      const targetRank = TIER_RANK[productId];
      const newSubId = (session.subscription as string) || null;
      // Which single subscription should SURVIVE the cleanup below. Everything
      // else live on this customer is a duplicate and gets cancelled.
      let subscriptionToKeep: string | null = null;

      if (targetRank > currentRank || profile?.subscription_status !== "active") {
        // Parse add-ons that came with the plan
        let selectedAddons: string[] = [];
        if (addonsJson) {
          try {
            selectedAddons = JSON.parse(addonsJson);
          } catch {
            selectedAddons = addonsJson.split(",");
          }
        }

        const existingAddons = (profile?.profile_details?.purchased_addons as string[]) || [];
        const mergedAddons = [...new Set([...existingAddons, ...selectedAddons])];

        await supabase
          .from("user_profiles")
          .update({
            subscription_tier: productId,
            subscription_status: "active",
            stripe_customer_id:
              (session.customer as string) || profile?.stripe_customer_id || undefined,
            profile_details: {
              ...(profile?.profile_details || {}),
              active_plan: productId,
              plan_visa_category:
                session.metadata?.visa_category || profile?.profile_details?.plan_visa_category,
              plan_purchase_date: new Date().toISOString(),
              stripe_subscription_id:
                (session.subscription as string) ||
                profile?.profile_details?.stripe_subscription_id,
              purchased_addons: mergedAddons,
              activated_by: "verify-session",
            },
          })
          .eq("id", userId);

        appliedTier = productId;
        activated = true;
        // We just made THIS session's subscription the active one in the DB, so
        // it is the one to keep.
        subscriptionToKeep = newSubId || (profile?.profile_details?.stripe_subscription_id as string) || null;
      } else {
        // Already on this tier or higher — keep the EXISTING subscription and let
        // the cleanup cancel this session's redundant new subscription, so the
        // customer is never left paying for two at once. (With the Stripe-aware
        // guard in checkout this branch is defensive only.)
        appliedTier = currentTier;
        activated = true;
        subscriptionToKeep =
          (profile?.profile_details?.stripe_subscription_id as string) || newSubId || null;
      }

      // ── Safety cleanup: exactly ONE live subscription per customer. ──────────
      // CRITICAL ORDERING: this runs only AFTER payment is confirmed (the `paid`
      // check above) and AFTER the DB already points at `subscriptionToKeep`.
      //   • Payment-confirmed-first means a failed/abandoned checkout never
      //     cancels the user's existing (e.g. Premium) subscription.
      //   • DB-updated-first means the customer.subscription.deleted webhook that
      //     fires for each cancelled sub sees the NEW sub as current and skips the
      //     downgrade (see handleSubscriptionDeleted guard), so tier/journey
      //     progress is preserved through an upgrade.
      // This app only ever intends ONE journey subscription per customer, so any
      // OTHER live sub is a duplicate. We never cancel `subscriptionToKeep`.
      const customerId = (session.customer as string) || profile?.stripe_customer_id;
      if (customerId && subscriptionToKeep) {
        await cancelDuplicateSubscriptions(customerId, subscriptionToKeep, "[verify-session]");
      } else if (customerId && !subscriptionToKeep) {
        // Fall back to the checkout hint only when we somehow have no keep target.
        if (isUpgrade && oldSubId) {
          stripe.subscriptions
            .cancel(oldSubId)
            .catch((e) => console.error("[verify-session] cancel old sub failed:", e?.message));
        }
      }
    }

    // ── 3b. STANDALONE ADD-ON (one-time) ─────────────────────────────────────
    else if (productType === "standalone_addon") {
      let selectedAddons: string[] = [];
    
      if (addonsJson) {
        try {
          selectedAddons = JSON.parse(addonsJson);
        } catch {
          selectedAddons = addonsJson.split(",");
        }
      }
    
      const {
        alreadyProcessed,
        profileDetails,
      } = buildAddonPurchaseUpdate(
        profile?.profile_details,
        sessionId,
        selectedAddons
      );
    
      if (!alreadyProcessed) {
        await supabase
          .from("user_profiles")
          .update({
            stripe_customer_id:
              (session.customer as string) ||
              profile?.stripe_customer_id ||
              undefined,
    
            profile_details: {
              ...profileDetails,
              activated_by: "verify-session",
            },
          })
          .eq("id", userId);
      }
    
      activated = true;
      appliedTier = currentTier;
    }

    // ── 3c. CONSULTATION (one-time) ──────────────────────────────────────────
    else if (productType === "consultation" && productId) {
      // Get the payment ID
      const { data: paymentRecord } = await supabase
        .from("payments")
        .select("id")
        .eq("stripe_checkout_session_id", sessionId)
        .maybeSingle();
      const paymentId = paymentRecord?.id;

      // Check if booking already exists (could be created by webhook)
      const { data: existingBooking } = await supabase
        .from("consultation_bookings")
        .select("id")
        .eq("reference_id", productId)
        .maybeSingle();

      if (existingBooking) {
        // Just update payment status and payment_id if not done
        await supabase
          .from("consultation_bookings")
          .update({
            payment_status: "paid",
            payment_id: paymentId || undefined,
          })
          .eq("id", existingBooking.id);
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
          payment_id: paymentId,
        };

        await consultationService.createBooking(bookingData);
      }

      activated = true;
    }

    // ── 3d. MEDICAL APPOINTMENT (one-time) ───────────────────────────────────
    else if (productType === "medical_booking" && productId) {
      await supabase.from("appointments").update({ payment_status: "paid" }).eq("id", productId);

      activated = true;
    }

    // ── 3e. POLICE VERIFICATION (one-time) ───────────────────────────────────
    else if (productType === "pcc_filing" && productId) {
      await supabase
        .from("police_verification_requests")
        .update({ payment_status: "paid" })
        .eq("id", productId);

      activated = true;
    }

    // ── 3e. Document Translation (one-time) ───────────────────────────────────
    else if (productType === "document_translations" && productId) {
      await supabase
        .from("translation_documents")
        .update({ payment_status: "paid" })
        .eq("id", productId);

      activated = true;
    }

    // 4. Mark payment record as succeeded (idempotent)
    await supabase
      .from("payments")
      .update({
        status: "succeeded",
        // Store each Stripe id in its own column: pi_... for one-time payments,
        // sub_... for subscriptions (undefined keys are dropped, so neither
        // overwrites the other).
        stripe_payment_id: (session.payment_intent as string) || undefined,
        stripe_subscription_id: (session.subscription as string) || undefined,
      })
      .eq("stripe_checkout_session_id", sessionId)
      .eq("user_id", userId)
      .neq("status", "succeeded"); // only update if not already succeeded — keeps email send guarded

    // 5. Send confirmation email — ONCE per session via simple idempotency flag in profile_details
    const emailFlagKey = `email_sent_${sessionId}`;
    const alreadyEmailed = profile?.profile_details?.[emailFlagKey] === true;

    if (activated && !alreadyEmailed && process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
      const email = session.customer_details?.email || session.customer_email;
      if (email) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          const tierName =
            (appliedTier || "plan").charAt(0).toUpperCase() + (appliedTier || "plan").slice(1);
          await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: email,
            subject:
              productType === "journey_plan"
                ? `Your Rahvana ${tierName} Plan is Active!`
                : "Your Rahvana purchase is confirmed",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #0d7377;">Payment Confirmed ✓</h1>
                <p>Your purchase has been activated on your Rahvana account.</p>
                <p>You can now access ${productType === "journey_plan" ? `your <strong>${tierName}</strong> plan features` : "your new feature"} immediately.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://rahvana.com"}/user-dashboard"
                   style="display:inline-block; padding: 12px 24px; background: #0d7377; color: white; border-radius: 24px; text-decoration: none; font-weight: bold;">
                  Go to Dashboard
                </a>
                <p style="color: #6e736f; font-size: 13px; margin-top: 24px;">
                  Questions? Reply to this email, we're here to help.
                </p>
              </div>
            `,
          });

          // Mark email as sent (idempotent — won't resend on next verify-session call)
          const { data: fresh } = await supabase
            .from("user_profiles")
            .select("profile_details")
            .eq("id", userId)
            .single();

          await supabase
            .from("user_profiles")
            .update({
              profile_details: { ...(fresh?.profile_details || {}), [emailFlagKey]: true },
            })
            .eq("id", userId);
        } catch (e) {
          console.error("[verify-session] email send failed:", e);
        }
      }
    }

    if (activated) {
      console.log(
        `[verify-session] Activated ${productType}=${productId || "addon"} for user ${userId}`
      );
    }

    return NextResponse.json({ activated, tier: appliedTier });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[verify-session] Error:", msg);
    return NextResponse.json({ activated: false, error: msg }, { status: 500 });
  }
}

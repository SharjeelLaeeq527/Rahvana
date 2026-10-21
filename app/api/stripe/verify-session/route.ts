import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { consultationService } from "@/lib/services/consultationService";
import { triggerTranslationNotification } from "@/lib/notifications";
import { buildAddonPurchaseUpdate } from "@/lib/payments/addon-purchase-ledger";
import { cancelSupersededSubscriptions } from "@/lib/stripe/subscriptionCleanup";
import { provisionCandidateJourneysAndVaults } from "@/lib/candidate/candidateProvisioningService";
import { getAuthenticatedUser } from "@/lib/api/authGuards";
import {
  WALLET_TOPUP_PRODUCT_TYPE,
  WALLET_DEFAULT_RETURN_PATH,
  applyWalletTopup,
  resolveTopupReturnPath,
} from "@/lib/wallet/topup";

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
 *   • Wallet top-ups               (credits the Rahvana Wallet, $1 = 1 credit)
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
    let walletTopup: { credits: number; balance: number; returnTo: string } | null = null;

    // ── 3w. WALLET TOP-UP (one-time) ─────────────────────────────────────────
    // Idempotent per session (same RPC as the webhook). Nothing else in this
    // handler applies: no tier change, and the payments row is only marked
    // succeeded once the credits have actually landed.
    if (productType === WALLET_TOPUP_PRODUCT_TYPE) {
      const result = await applyWalletTopup(supabase, session, "[verify-session]");
      if (!result.ok) {
        return NextResponse.json(
          { activated: false, productType, error: result.reason },
          { status: result.reason === "rpc_failed" ? 500 : 200 }
        );
      }
      walletTopup = {
        credits: result.credits,
        balance: result.balance,
        returnTo: resolveTopupReturnPath(session.metadata?.return_to || WALLET_DEFAULT_RETURN_PATH),
      };
      activated = true;
    }

    // ── 3a. JOURNEY PLAN (subscription) ──────────────────────────────────────
    else if (productType === "journey_plan" && productId && TIER_RANK[productId] > 0) {
      const visaCategoryMeta = session.metadata?.visa_category || "ir1";
      const candidateCountMeta = parseInt(session.metadata?.candidate_count || "1", 10) || 1;
      const isAddCandidateMeta =
        session.metadata?.action === "add_candidate" ||
        session.metadata?.is_add_candidate === "true";
      const targetCandidateIdMeta =
        session.metadata?.target_candidate_id || session.metadata?.candidate_id || undefined;

      // ── 1. Provision Candidates, Journeys, and Document Vaults ─────────────
      // Automatically creates candidate profiles, seeds multi-candidate journeys
      // (candidate-1, candidate-2, etc.), and initializes isolated document vaults.
      await provisionCandidateJourneysAndVaults({
        supabase,
        userId,
        visaCategory: visaCategoryMeta,
        candidateCount: candidateCountMeta,
        tier: productId,
        stripeSubscriptionId: (session.subscription as string) || undefined,
        isAddCandidate: isAddCandidateMeta,
        targetCandidateId: targetCandidateIdMeta,
      });

      // ── 2. Compute highest active tier across all user journeys ─────────────
      // user_profiles.subscription_tier acts as an account-level summary.
      const { data: userJourneys } = await supabase
        .from("journeys")
        .select("subscription_tier")
        .eq("user_id", userId);

      const highestRank = (userJourneys || []).reduce((max, journey) => {
        const rank = TIER_RANK[(journey.subscription_tier || "free").toLowerCase()] || 0;

        return Math.max(max, rank);
      }, TIER_RANK[productId] || 0);

      const highestTierName =
        Object.keys(TIER_RANK).find((tier) => TIER_RANK[tier] === highestRank) || productId;

      // ── 3. Update user profile account-level summary ────────────────────────
      const { data: latestProfile } = await supabase
        .from("user_profiles")
        .select("profile_details")
        .eq("id", userId)
        .maybeSingle();

      await supabase
        .from("user_profiles")
        .update({
          subscription_tier: highestTierName,
          subscription_status: "active",
          stripe_customer_id:
            (session.customer as string) || profile?.stripe_customer_id || undefined,
          profile_details: {
            ...(latestProfile?.profile_details || profile?.profile_details || {}),
            active_plan: highestTierName,
            plan_purchase_date: new Date().toISOString(),
            activated_by: "verify-session",
          },
        })
        .eq("id", userId);

      // ── 4. Retire the plan this checkout replaced (upgrade cleanup) ─────────
      // Only after payment is confirmed and the journey row points at the new
      // sub, so a failed upgrade never removes the existing plan. Scoped to this
      // journey; add-candidate purchases replace nothing. Idempotent with the
      // webhook's identical call.
      const customerIdForCleanup =
        (session.customer as string) || profile?.stripe_customer_id || undefined;
      const keepSubId = session.subscription as string | null;
      if (customerIdForCleanup && keepSubId) {
        await cancelSupersededSubscriptions({
          customerId: customerIdForCleanup,
          keepSubId,
          visaCategory: visaCategoryMeta,
          isAddCandidate: isAddCandidateMeta,
          oldSubscriptionId: isUpgrade ? oldSubId : null,
          logPrefix: "[verify-session]",
        });
      }

      // ── 5. Mark verification as successfully activated ─────────────────────
      appliedTier = productId;
      activated = true;
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

      const { alreadyProcessed, profileDetails } = buildAddonPurchaseUpdate(
        profile?.profile_details,
        sessionId,
        selectedAddons
      );

      if (!alreadyProcessed) {
        await supabase
          .from("user_profiles")
          .update({
            stripe_customer_id:
              (session.customer as string) || profile?.stripe_customer_id || undefined,

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
          payment_id: paymentId,
        };

        await consultationService.createBooking(bookingData);
      }

      activated = true;
    }

    // ── 3d. MEDICAL APPOINTMENT (one-time) ───────────────────────────────────
    else if (productType === "medical_booking" && productId) {
      await supabase
        .from("appointments")
        .update({ payment_status: "paid", awaiting_payment: false })
        .eq("id", productId);

      activated = true;
    }

    // ── 3e. POLICE VERIFICATION (one-time) ───────────────────────────────────
    else if (productType === "pcc_filing" && productId) {
      await supabase
        .from("police_verification_requests")
        .update({ payment_status: "paid", awaiting_payment: false })
        .eq("id", productId);

      activated = true;
    }

    // ── 3e. Document Translation (one-time) ───────────────────────────────────
    else if (productType === "document_translations" && productId) {
      // Deferred-create (pay-first) flow — mirrors Expert Consultation. The row is
      // inserted ONLY now that payment succeeded, so a canceled/failed checkout never
      // leaves a "submitted" request behind. The update branch stays for legacy rows
      // that were created before payment (backward compatible).
      const { data: paymentRecord } = await supabase
        .from("payments")
        .select("id")
        .eq("stripe_checkout_session_id", sessionId)
        .maybeSingle();
      const paymentId = paymentRecord?.id;

      const { data: existingDoc } = await supabase
        .from("translation_documents")
        .select("id")
        .eq("id", productId)
        .maybeSingle();

      if (existingDoc) {
        await supabase
          .from("translation_documents")
          .update({ payment_status: "paid", payment_id: paymentId || undefined })
          .eq("id", productId);
      } else {
        // Reconstruct user_notes from split metadata fields.
        let userNotes = "";
        let noteIndex = 1;
        while (true) {
          const part = session.metadata?.[`t_notes_${noteIndex}`];
          if (!part) break;
          userNotes += part;
          noteIndex++;
        }

        const { error: insertErr } = await supabase.from("translation_documents").insert({
          id: session.metadata?.t_doc_id || productId,
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
          payment_id: paymentId,
          metadata: {
            candidate_id: session.metadata?.t_candidate_id || "candidate-1",
            candidate_name: session.metadata?.t_candidate_name || "",
            source: session.metadata?.t_source || "standalone",
            journey_slug: session.metadata?.t_journey_slug || null,
          },
        });

        if (insertErr) {
          console.error("[verify-session] translation deferred-create error:", insertErr);
        } else {
          try {
            await triggerTranslationNotification(session.metadata?.t_doc_id || productId);
          } catch (notifErr) {
            console.error("[verify-session] translation notification error:", notifErr);
          }
        }
      }

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
                : walletTopup
                  ? `${walletTopup.credits} credits added to your Rahvana Wallet`
                  : "Your Rahvana purchase is confirmed",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #0d7377;">Payment Confirmed ✓</h1>
                <p>Your purchase has been activated on your Rahvana account.</p>
                <p>${
                  walletTopup
                    ? `<strong>${walletTopup.credits} credits</strong> were added to your Rahvana Wallet. Your balance is now <strong>${walletTopup.balance} credits</strong>.`
                    : `You can now access ${productType === "journey_plan" ? `your <strong>${tierName}</strong> plan features` : "your new feature"} immediately.`
                }</p>
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

    // Wallet top-ups: anyone holding the session id may trigger the (idempotent,
    // owner-only) credit, but only the signed-in owner sees the amount, balance and
    // tier. Other purchase types keep their existing response.
    if (walletTopup) {
      const viewer = await getAuthenticatedUser().catch(() => null);
      if (viewer?.id !== userId) {
        return NextResponse.json({ activated, productType });
      }
      return NextResponse.json({ activated, tier: appliedTier, productType, ...walletTopup });
    }

    return NextResponse.json({
      activated,
      tier: appliedTier,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[verify-session] Error:", msg);
    return NextResponse.json({ activated: false, error: msg }, { status: 500 });
  }
}

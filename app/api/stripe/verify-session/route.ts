import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

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

        // Cancel previous subscription if this was an upgrade
        if (isUpgrade && oldSubId && oldSubId !== session.subscription) {
          stripe.subscriptions
            .cancel(oldSubId)
            .catch((e) => console.error("[verify-session] cancel old sub failed:", e?.message));
        }
      } else {
        // Already on this tier or higher
        appliedTier = currentTier;
        activated = true;
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
      const existingAddons = (profile?.profile_details?.purchased_addons as string[]) || [];
      const mergedAddons = [...new Set([...existingAddons, ...selectedAddons])];

      await supabase
        .from("user_profiles")
        .update({
          stripe_customer_id:
            (session.customer as string) || profile?.stripe_customer_id || undefined,
          profile_details: {
            ...(profile?.profile_details || {}),
            purchased_addons: mergedAddons,
            activated_by: "verify-session",
          },
        })
        .eq("id", userId);

      activated = true;
      appliedTier = currentTier;
    }

    // ── 3c. CONSULTATION (one-time) ──────────────────────────────────────────
    else if (productType === "consultation" && productId) {
      await supabase
        .from("consultation_bookings")
        .update({ payment_status: "paid" })
        .eq("id", productId);

      activated = true;
    }

    // 4. Mark payment record as succeeded (idempotent)
    await supabase
      .from("payments")
      .update({
        status: "succeeded",
        stripe_payment_id:
          (session.subscription as string) || (session.payment_intent as string) || undefined,
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
                  Questions? Reply to this email — we're here to help.
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

import { NextRequest, NextResponse } from "next/server";
import { stripe, PRODUCTS } from "@/lib/stripe/config";
import { paymentService } from "@/lib/services/paymentService";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { VISA_CATEGORIES } from "@/app/(main)/pricing/data/pricing";
import { reconcileUserPlan } from "@/lib/plan/reconcile";
import * as fs from "fs";
import * as path from "path";
import { E, msg } from "@/lib/errors";

function logDebug(msg: string, obj?: any) {
  try {
    const logPath = path.join(process.cwd(), "api-debug.log");
    const time = new Date().toISOString();
    const objStr = obj ? JSON.stringify(obj, null, 2) : "";
    fs.appendFileSync(logPath, `[${time}] ${msg} ${objStr}\n`);
  } catch (e) {}
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  logDebug("--- NEW CHECKOUT REQUEST ---");
  try {
    const body = await request.json();
    logDebug("Request body:", body);
    const { productTier, userId, consultationId, addons, visaCategory, isUpgrade, currentTier } =
      body;

    // Validate required fields
    if (!userId) {
      logDebug("Returning 400 User ID is required");
      return NextResponse.json(
        { error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: "[userId]" }) },
        { status: 400 }
      );
    }

    // Get user email from Supabase
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userEmail = userData.user.email!;

    // ── Reconcile any unapplied payments BEFORE we let user pay again ────────
    // This prevents double-charging: if a previous payment succeeded but the
    // webhook failed to update the tier, applying it here means the duplicate-
    // purchase guard below will catch it and reject the new checkout.
    await reconcileUserPlan(supabase, userId).catch((e) =>
      console.error("[checkout] pre-reconcile failed (non-fatal):", e)
    );

    // Fetch profile AFTER reconcile so we see the up-to-date tier
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("subscription_tier, subscription_status, profile_details")
      .eq("id", userId)
      .single();

    const dbVisaCategory =
      profile?.profile_details?.plan_visa_category || profile?.profile_details?.visa_category;
    const effectiveVisaCategory = visaCategory || dbVisaCategory || "IR-1 / CR-1";
    const oldSubscriptionId = profile?.profile_details?.stripe_subscription_id;

    // ── Server-side downgrade + duplicate-purchase guard ─────────────────────
    // Rejects two scenarios:
    //   (a) target tier <  current tier  → downgrade attempt
    //   (b) target tier == current tier  → duplicate purchase (already owned)
    // We derive this from DB — never trust the client's `currentTier` field.
    if (productTier) {
      const TIER_RANK: Record<string, number> = { free: 0, basic: 1, premium: 2, executive: 3 };
      const dbTier = (profile?.subscription_tier ?? "free").toLowerCase();
      const dbStatus = profile?.subscription_status ?? "inactive";
      const targetRank = TIER_RANK[productTier.toLowerCase()] ?? 0;
      const currentRank = TIER_RANK[dbTier] ?? 0;

      if (dbStatus === "active" && targetRank < currentRank) {
        return NextResponse.json(
          {
            error: `You already have the ${dbTier} plan. Downgrades are not allowed — manage via billing portal.`,
          },
          { status: 400 }
        );
      }
      if (dbStatus === "active" && targetRank === currentRank) {
        return NextResponse.json(
          {
            error: `You already own the ${dbTier} plan. No need to purchase again.`,
            alreadyOwned: true,
          },
          { status: 400 }
        );
      }
    }
    // ────────────────────────────────────────────────────────────────────────

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
      billing_address_collection: "required",
      customer_update: { address: "auto" },
      metadata: { user_id: userId },
      line_items: [],
    };

    // ================================================
    // JOURNEY PLAN — Monthly Subscription + Add-ons
    // ================================================
    if (productTier) {
      const tierLower = productTier.toLowerCase();

      let product:
        | typeof PRODUCTS.BASIC
        | typeof PRODUCTS.PREMIUM
        | typeof PRODUCTS.EXECUTIVE
        | null = null;
      if (tierLower === "basic") product = PRODUCTS.BASIC;
      if (tierLower === "premium") product = PRODUCTS.PREMIUM;
      if (tierLower === "executive") product = PRODUCTS.EXECUTIVE;

      if (!product) {
        return NextResponse.json({ error: msg(E.CASE_DATA_NOT_FOUND) }, { status: 404 });
      }

      // Subscription mode for all journey plans
      sessionParams.mode = "subscription";

      // Check visa category for custom annual price (e.g. CR-2 has lower price)
      let targetAnnualPrice: number = product.price;
      let currentAnnualPrice = 0;

      if (effectiveVisaCategory) {
        const category = VISA_CATEGORIES.find((v) => v.id === effectiveVisaCategory);
        if (category) {
          const plan = category.plans.find((p) => p.id === tierLower);
          if (plan) targetAnnualPrice = plan.price;

          if (isUpgrade && currentTier) {
            const cPlan = category.plans.find((p) => p.id === currentTier);
            if (cPlan) currentAnnualPrice = cPlan.price;
          }
        }
      } else if (isUpgrade && currentTier) {
        let currentProduct: any = null;
        if (currentTier === "basic") currentProduct = PRODUCTS.BASIC;
        if (currentTier === "premium") currentProduct = PRODUCTS.PREMIUM;
        if (currentTier === "executive") currentProduct = PRODUCTS.EXECUTIVE;
        if (currentProduct) currentAnnualPrice = currentProduct.price;
      }

      let effectiveAnnualPrice = targetAnnualPrice;
      if (isUpgrade && currentTier && targetAnnualPrice > currentAnnualPrice) {
        effectiveAnnualPrice = targetAnnualPrice - currentAnnualPrice;
      }

      // FIX 1: Use exact monthlyPrice from PRODUCTS, or divide custom annual price by 12
      const monthlyPrice =
        effectiveAnnualPrice === product.price
          ? product.monthlyPrice // $29.08, $58.25, $91.58
          : Math.round((effectiveAnnualPrice / 12) * 100) / 100;

      // Add main plan — use saved recurringPriceId if price matches default
      const useRecurringId =
        product.recurringPriceId &&
        product.recurringPriceId.length >= 10 &&
        effectiveAnnualPrice === product.price; // only use saved ID if price is default

      if (useRecurringId) {
        sessionParams.line_items!.push({
          price: product.recurringPriceId,
          quantity: 1,
        });
      } else {
        // Custom price (e.g. CR-2) — create dynamic recurring price
        sessionParams.line_items!.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: `${product.name} (Monthly)`,
              description: product.features?.join(", ") || "",
              tax_code: (product as any).taxCode || "txcd_10103000",
            },
            unit_amount: Math.round(monthlyPrice * 100),
            recurring: { interval: "month" },
          },
          quantity: 1,
        });
      }

      // FIX 2: Metadata — stripe_customer_id + addons as JSON
      sessionParams.metadata = {
        ...sessionParams.metadata,
        stripe_customer_id: stripeCustomerId!,
        product_type: "journey_plan",
        product_id: productTier,
        product_name: product.name + (isUpgrade ? " (Upgrade)" : ""),
        visa_category: effectiveVisaCategory,
        is_upgrade: isUpgrade ? "true" : "false",
        old_subscription_id: isUpgrade ? oldSubscriptionId || "" : "",
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
                currency: "usd",
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
    // STANDALONE ADD-ONS — One-time Payment
    // ================================================
    else if (addons && Array.isArray(addons) && addons.length > 0) {
      sessionParams.mode = "payment";

      for (const addonId of addons) {
        const addonIdLower = addonId.toLowerCase();
        const addon = (PRODUCTS.ADDONS as any)?.[addonIdLower];

        if (addon) {
          sessionParams.line_items!.push({
            price_data: {
              currency: "usd",
              product_data: {
                name: `Add-on: ${addon.name}`,
                description: "One-time purchase",
              },
              unit_amount: Math.round(addon.price * 100),
            },
            quantity: 1,
          });
        }
      }

      sessionParams.metadata = {
        ...sessionParams.metadata,
        stripe_customer_id: stripeCustomerId!,
        product_type: "standalone_addon",
        addons: JSON.stringify(addons),
        visa_category: effectiveVisaCategory,
      };
    }
    // ================================================
    // CONSULTATION — One-time Payment
    // ================================================
    else if (consultationId) {
      const { data: consultation, error: consultationError } = await supabase
        .from("consultation_bookings")
        .select("*")
        .eq("id", consultationId)
        .single();

      if (consultationError || !consultation) {
        return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
      }

      const consultationPrice = 50; // $50 per consultation

      sessionParams.mode = "payment";
      sessionParams.line_items = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Consultation Booking",
              description: `${consultation.issue_category} - ${consultation.visa_category}`,
            },
            unit_amount: consultationPrice * 100,
          },
          quantity: 1,
        },
      ];

      sessionParams.metadata = {
        ...sessionParams.metadata,
        product_type: "consultation",
        product_id: consultationId,
        consultation_reference: consultation.reference_id,
      };
    } else {
      return NextResponse.json(
        { error: "Either productTier, addons, or consultationId is required" },
        { status: 400 }
      );
    }

    // Fallback mode
    if (!sessionParams.mode) {
      sessionParams.mode = "payment";
    }

    logDebug("Calling Stripe with sessionParams:", sessionParams);
    // Create Stripe checkout session
    let session;
    try {
      session = await stripe.checkout.sessions.create(sessionParams);
      logDebug("Stripe session created successfully:", { id: session.id, url: session.url });
    } catch (stripeErr: any) {
      logDebug("Stripe SDK error:", { msg: stripeErr.message, type: stripeErr.type });
      throw stripeErr;
    }

    logDebug("Creating payment record in Supabase...");
    // Save payment record in Supabase

    // FIX: Map standalone_addon to journey_plan for the DB insert to satisfy the check constraint,
    // but keep it as standalone_addon in the Stripe metadata so the webhook works perfectly.
    const dbProductType =
      sessionParams.metadata?.product_type === "standalone_addon"
        ? "journey_plan"
        : (sessionParams.metadata?.product_type as any) || "journey_plan";

    const dbProductId =
      sessionParams.metadata?.product_type === "standalone_addon"
        ? addons?.[0] || "addon"
        : String(sessionParams.metadata?.product_id || "");

    await paymentService.createPayment({
      user_id: userId,
      stripe_checkout_session_id: session.id,
      amount: (session.amount_total ?? 0) / 100,
      currency: session.currency || "usd",
      status: "pending",
      product_type: dbProductType,
      product_id: dbProductId,
      metadata: {
        product_name: sessionParams.metadata?.product_name || "Add-on Purchase",
        customer_email: userEmail,
        stripe_customer_id: stripeCustomerId!,
        original_product_type: sessionParams.metadata?.product_type, // keep reference
      },
    });
    logDebug("Payment record created successfully");

    logDebug("Returning 200 with session details");
    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: unknown) {
    logDebug(
      "Caught global error in checkout API:",
      error instanceof Error ? error.message : String(error)
    );
    if (error instanceof Error && error.stack) {
      logDebug("Error stack:", error.stack);
    }
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create checkout session";
    logDebug("Returning 500 with errorMessage:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

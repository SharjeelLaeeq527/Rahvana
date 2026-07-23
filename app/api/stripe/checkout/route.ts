import { NextRequest, NextResponse } from "next/server";
import { stripe, PRODUCTS } from "@/lib/stripe/config";
import { paymentService } from "@/lib/services/paymentService";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { VISA_CATEGORIES, ADDONS } from "@/app/(main)/pricing/data/pricing";
import { reconcileUserPlan } from "@/lib/plan/reconcile";
import * as fs from "fs";
import * as path from "path";
import { E, msg } from "@/lib/errors";
import { getAuthenticatedUser } from "@/lib/api/authGuards";

function logDebug(msg: string, obj?: any) {
  // Never write request/session details to disk in production (PII hygiene).
  if (process.env.NODE_ENV === "production") return;
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
    // AUTH: the buyer is always the authenticated user. Never trust a `userId`
    // from the request body — that allowed anyone to create checkouts/payment
    // rows for arbitrary accounts.
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const userId = user.id;

    const body = await request.json();
    logDebug("Request body received");
    const {
      productTier,
      consultationId,
      consultationDetails,
      appointmentId,
      policeVerificationId,
      documentTranslationId,
      addons,
      visaCategory,
    } = body;

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

    // ── Authoritative upgrade state — derived from the DB, NEVER the client ──
    // The proration below subtracts the current-tier price from the target
    // price. If we trusted a client-supplied `currentTier`/`isUpgrade`, a free
    // user could send { isUpgrade: true, currentTier: "premium" } and pay only
    // the tier *difference* while still being provisioned the full higher tier.
    // So both are computed from the DB profile only.
    const dbTierForUpgrade = (profile?.subscription_tier ?? "free").toLowerCase();
    const dbActiveForUpgrade = (profile?.subscription_status ?? "inactive") === "active";
    const serverIsUpgrade = dbActiveForUpgrade && dbTierForUpgrade !== "free";
    const serverCurrentTier = serverIsUpgrade ? dbTierForUpgrade : undefined;

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

    // Base URL for redirects — derive from the incoming request origin so it
    // works on whatever host the user is actually on (localhost in dev, the real
    // domain in prod). Falls back to the env var if no origin header is present.
    const origin =
      request.headers.get("origin") ||
      request.nextUrl.origin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "";

    // ── Cancel URL — industry-standard: return the user to where they started
    // (the order summary) with their selection intact, NOT a dead-end "canceled"
    // page. The pricing page reads these params, restores the order, and shows a
    // subtle "checkout canceled, no charge made" notice.
    const buildCancelUrl = () => {
      const base = origin;
      // Consultations have no order-summary concept — send back to booking.
      if (!productTier && !(Array.isArray(addons) && addons.length > 0) && consultationId) {
        return `${base}/book-consultation?checkout_canceled=1`;
      }
      const params = new URLSearchParams({ checkout_canceled: "1" });
      if (productTier) {
        params.set("mode", "plans");
        params.set("plan", productTier);
        params.set("step", "review");
      } else if (Array.isArray(addons) && addons.length > 0) {
        const firstKind =
          (ADDONS.find((a) => a.id === addons[0]) as { kind?: string } | undefined)?.kind ??
          "tools";
        params.set("mode", firstKind);
      }
      if (Array.isArray(addons) && addons.length > 0) params.set("addons", addons.join(","));
      if (effectiveVisaCategory) params.set("visa", effectiveVisaCategory);
      return `${base}/pricing?${params.toString()}`;
    };

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: buildCancelUrl(),
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

          if (serverIsUpgrade && serverCurrentTier) {
            const cPlan = category.plans.find((p) => p.id === serverCurrentTier);
            if (cPlan) currentAnnualPrice = cPlan.price;
          }
        }
      } else if (serverIsUpgrade && serverCurrentTier) {
        let currentProduct: any = null;
        if (serverCurrentTier === "basic") currentProduct = PRODUCTS.BASIC;
        if (serverCurrentTier === "premium") currentProduct = PRODUCTS.PREMIUM;
        if (serverCurrentTier === "executive") currentProduct = PRODUCTS.EXECUTIVE;
        if (currentProduct) currentAnnualPrice = currentProduct.price;
      }

      let effectiveAnnualPrice = targetAnnualPrice;
      if (serverIsUpgrade && serverCurrentTier && targetAnnualPrice > currentAnnualPrice) {
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
        product_name: product.name + (serverIsUpgrade ? " (Upgrade)" : ""),
        visa_category: effectiveVisaCategory,
        is_upgrade: serverIsUpgrade ? "true" : "false",
        old_subscription_id: serverIsUpgrade ? oldSubscriptionId || "" : "",
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
    else if (consultationDetails) {
      const referenceId = `REQ-${Math.floor(100000 + Math.random() * 900000)}`;
      const consultationPrice = 99; // $99 per consultation

      sessionParams.mode = "payment";
      sessionParams.line_items = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Consultation Booking",
              description: `${consultationDetails.issue_category} - ${consultationDetails.visa_category || "IR-1 / CR-1"}`,
            },
            unit_amount: consultationPrice * 100,
          },
          quantity: 1,
        },
      ];

      // Helper to split a long string into chunks of max 450 chars for Stripe metadata
      const splitMetadataString = (str: string, prefix: string) => {
        const chunkLimit = 450;
        const meta: Record<string, string> = {};
        if (!str) return meta;
        let index = 1;
        for (let i = 0; i < str.length; i += chunkLimit) {
          meta[`${prefix}_${index}`] = str.substring(i, i + chunkLimit);
          index++;
        }
        return meta;
      };

      const summaryMeta = splitMetadataString(consultationDetails.case_summary || "", "c_summary");

      sessionParams.metadata = {
        ...sessionParams.metadata,
        product_type: "consultation",
        product_id: referenceId, // store referenceId as product_id in payment
        consultation_reference: referenceId,
        c_reference_id: referenceId,
        c_issue_category: consultationDetails.issue_category || "",
        c_visa_category: consultationDetails.visa_category || "",
        c_case_stage: consultationDetails.case_stage || "",
        c_urgency: consultationDetails.urgency || "normal",
        c_preferred_language: consultationDetails.preferred_language || "English",
        c_full_name: consultationDetails.full_name || "",
        c_email: consultationDetails.email || "",
        c_whatsapp_phone: consultationDetails.whatsapp_phone || "",
        c_embassy_consulate: consultationDetails.embassy_consulate || "",
        c_selected_slot: consultationDetails.selected_slot || "",
        c_alternate_slots: Array.isArray(consultationDetails.alternate_slots) 
          ? consultationDetails.alternate_slots.join(",") 
          : "",
        c_attachments: Array.isArray(consultationDetails.attachments) 
          ? consultationDetails.attachments.join(",") 
          : "",
        ...summaryMeta,
      };
    } else if (consultationId) {
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
    } else if (appointmentId) {
      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", appointmentId)
        .single();

      if (appointmentError || !appointment) {
        return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
      }

      const appointmentPrice = 5; // $5 per medical appointment booking

      sessionParams.mode = "payment";
      sessionParams.line_items = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Book Medical Appointment",
              description: `Appointment for ${appointment.full_name} (${appointment.location})`,
            },
            unit_amount: appointmentPrice * 100,
          },
          quantity: 1,
        },
      ];

      sessionParams.metadata = {
        ...sessionParams.metadata,
        product_type: "medical_booking",
        product_id: appointmentId,
      };
    } else if (policeVerificationId) {
      const { data: requestRecord, error: requestError } = await supabase
        .from("police_verification_requests")
        .select("*")
        .eq("id", policeVerificationId)
        .single();

      if (requestError || !requestRecord) {
        return NextResponse.json(
          { error: "Police verification request not found" },
          { status: 404 }
        );
      }

      const pccPrice = 25; // $25 per police verification request

      sessionParams.mode = "payment";
      sessionParams.line_items = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "PCC Filing (Sindh Only)",
              description: `Police Verification for ${requestRecord.full_name} (${requestRecord.district})`,
            },
            unit_amount: pccPrice * 100,
          },
          quantity: 1,
        },
      ];

      sessionParams.metadata = {
        ...sessionParams.metadata,
        product_type: "pcc_filing",
        product_id: policeVerificationId,
      };
    } else if (documentTranslationId) {
      // Note: document upload route stores records in `translation_documents`
      const { data: requestRecord, error: requestError } = await supabase
        .from("translation_documents")
        .select("*")
        .eq("id", documentTranslationId)
        .single();

      if (requestError || !requestRecord) {
        return NextResponse.json(
          { error: "Document translation request not found" },
          { status: 404 }
        );
      }

      const documentTranslationPrice = 25; // $25 per document translation request

      sessionParams.mode = "payment";
      sessionParams.line_items = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Document Translation",
              description: `Document Translation for ${requestRecord.full_name} (${requestRecord.documentType})`,
            },
            unit_amount: documentTranslationPrice * 100,
          },
          quantity: 1,
        },
      ];

      sessionParams.metadata = {
        ...sessionParams.metadata,
        product_type: "document_translations",
        product_id: documentTranslationId,
      };
    } else {
      return NextResponse.json(
        {
          error:
            "Either productTier, addons, consultationId, appointmentId, documentTranslationId,  or policeVerificationId is required",
        },
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
    // and map medical_booking / pcc_filing to consultation to satisfy the check constraint as well,
    // but keep it as medical_booking / pcc_filing in the Stripe metadata so the webhook/verify-session works perfectly.
    const dbProductType =
      sessionParams.metadata?.product_type === "standalone_addon"
        ? "journey_plan"
        : sessionParams.metadata?.product_type === "medical_booking" ||
            sessionParams.metadata?.product_type === "pcc_filing" ||
            sessionParams.metadata?.product_type === "document_translations"
          ? "consultation"
          : (sessionParams.metadata?.product_type as any) || "journey_plan";

    const dbProductId =
      sessionParams.metadata?.product_type === "standalone_addon"
        ? addons?.[0] || "addon"
        : sessionParams.metadata?.product_type === "medical_booking"
          ? appointmentId
          : sessionParams.metadata?.product_type === "pcc_filing"
            ? policeVerificationId
            : sessionParams.metadata?.product_type === "document_translations"
              ? documentTranslationId
              : String(sessionParams.metadata?.product_id || "");

    let paymentId: string | null = null;
    try {
      const payment = await paymentService.createPayment({
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
          original_product_type: sessionParams.metadata?.product_type || "",
        },
      });
      paymentId = payment.id;
      logDebug("Payment record created successfully:", { paymentId });

      // Link payment to translation document if this is a document translation purchase
      if (
        sessionParams.metadata?.product_type === "document_translations" &&
        documentTranslationId &&
        paymentId
      ) {
        const { error: updateErr } = await supabase
          .from("translation_documents")
          .update({ payment_id: paymentId, payment_status: "pending" })
          .eq("id", documentTranslationId);

        if (updateErr) {
          logDebug("Warning: Failed to link payment_id to translation_documents:", updateErr);
          // Don't throw - the payment was created successfully, this is just linking
        } else {
          logDebug("Successfully linked payment_id to translation_documents");
        }
      }

      // Link payment to appointment if this is a medical booking purchase
      if (
        sessionParams.metadata?.product_type === "medical_booking" &&
        appointmentId &&
        paymentId
      ) {
        const { error: updateErr } = await supabase
          .from("appointments")
          .update({ payment_id: paymentId, payment_status: "pending" })
          .eq("id", appointmentId);

        if (updateErr) {
          logDebug("Warning: Failed to link payment_id to appointments:", updateErr);
        } else {
          logDebug("Successfully linked payment_id to appointment");
        }
      }

      // Link payment to police verification document if this is a police verification purchase
      if (
        sessionParams.metadata?.product_type === "pcc_filing" &&
        policeVerificationId &&
        paymentId
      ) {
        const { error: updateErr } = await supabase
          .from("police_verification_requests")
          .update({ payment_id: paymentId, payment_status: "pending" })
          .eq("id", policeVerificationId);

        if (updateErr) {
          logDebug(
            "Warning: Failed to link payment_id to police_verification_requests:",
            updateErr
          );
        } else {
          logDebug("Successfully linked payment_id to police_verification_requests");
        }
      }
    } catch (payErr: any) {
      // Log detailed Supabase error for debugging and return a clearer message
      logDebug(
        "paymentService.createPayment failed:",
        payErr && payErr.message ? payErr.message : String(payErr)
      );
      try {
        logDebug("paymentService.createPayment error (full):", JSON.stringify(payErr));
      } catch (e) {
        // ignore JSON stringify errors
      }
      return NextResponse.json({ error: msg(E.PAYMENT_CREATE_FAILED) }, { status: 500 });
    }

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

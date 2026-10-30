import { NextRequest, NextResponse } from "next/server";
import { stripe, PRODUCTS } from "@/lib/stripe/config";
import { paymentService } from "@/lib/services/paymentService";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { VISA_CATEGORIES, ADDONS } from "@/app/(main)/pricing/data/pricing";
import { reconcileUserPlan } from "@/lib/plan/reconcile";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { E, msg } from "@/lib/errors";
import { getAuthenticatedUser } from "@/lib/api/authGuards";
import { acquireCheckoutLock, releaseCheckoutLock } from "@/lib/stripe/checkoutLock";
import { IR2_ENABLED } from "@/lib/feature-flags";
import { journeyBaseCategory } from "@/lib/journey/journeyConfig";
import {
  isMultiCandidateCategory,
  getCandidateJourneyKey,
} from "@/lib/candidate/candidateSyncService";
import {
  resolveSubscriptionTier,
  journeyTypeForVisaCategory,
  isAddCandidateSubscription,
} from "@/lib/stripe/subscriptionCleanup";
import {
  WALLET_TOPUP_PRODUCT_TYPE,
  validateTopupAmount,
  resolveTopupReturnPath,
} from "@/lib/wallet/topup";
import {
  calculateSubscriptionCycle,
  calculateUpgradeSchedule,
} from "@/lib/pricing/upgradeScheduleService";

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

const INTERVIEW_PREP_ADDON_PREFIX = "interview-prep:";

function getCatalogAddonId(addonId: string): string {
  const normalized = addonId.toLowerCase();

  if (normalized.startsWith(INTERVIEW_PREP_ADDON_PREFIX)) {
    return "interview-prep";
  }

  return normalized;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  logDebug("--- NEW CHECKOUT REQUEST ---");
  // Set when we acquire the per-user checkout lock, so `finally` can release it.
  // `lockToken` is the ownership token so release only removes OUR lock.
  let lockedUserId: string | null = null;
  let lockToken: string | null = null;
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
      translationDetails,
      addons,
      visaCategory,
      candidateCount,
      candidateId: rawCandidateId,
      candidate_id: snakeCandidateId,
      action,
      productType,
      amount,
      returnUrl,
      resourceId,
      upgradeTotal,
      newMonthlyPrice,
    } = body;

    const candidateId = rawCandidateId || snakeCandidateId || undefined;
    const parsedCandidateCount =
      candidateCount && !isNaN(Number(candidateCount)) && Number(candidateCount) >= 1
        ? Math.floor(Number(candidateCount))
        : 1;
    // ── Wallet top-up: validate before touching Stripe. The client sends only a
    // whole-dollar amount ($1 = 1 credit); it never sets what gets credited, which
    // is derived from what Stripe actually charged (lib/wallet/topup.ts). ──
    const isWalletTopup = productType === WALLET_TOPUP_PRODUCT_TYPE;
    let topupCredits = 0;
    if (isWalletTopup) {
      if (productTier || (Array.isArray(addons) && addons.length > 0)) {
        return NextResponse.json(
          { error: "A wallet top-up cannot be combined with a plan or add-ons." },
          { status: 400 }
        );
      }
      const topup = validateTopupAmount(amount);
      if (!topup.ok) {
        return NextResponse.json({ error: topup.error }, { status: 400 });
      }
      topupCredits = topup.credits;
    }
    const topupReturnPath = resolveTopupReturnPath(returnUrl);

    // Add-ons are no longer sold for dollars: standalone tools and guides unlock with
    // wallet credits and services are paid with credits per booking. Purchases made
    // before this keep working (the webhook and verify-session still record a paid
    // add-on session), but no new add-on checkout is started.
    if (Array.isArray(addons) && addons.length > 0) {
      return NextResponse.json(
        {
          error:
            "Add-ons are no longer sold here. Tools and guides unlock with Rahvana credits, and services are paid with credits when you book them.",
          code: "ADDONS_DISCONTINUED",
        },
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
    const selectedJourneyType = journeyTypeForVisaCategory(effectiveVisaCategory);

    // IR-2 is not on sale while its flag is off. The pricing page hides it, but the
    // category arrives from the client, so refuse it here too (before any Stripe call).
    if (productTier && selectedJourneyType === "IR2" && !IR2_ENABLED) {
      return NextResponse.json(
        { error: "This visa category is not available yet.", code: "CATEGORY_NOT_AVAILABLE" },
        { status: 400 }
      );
    }

    const isMultiCand =
      isMultiCandidateCategory(effectiveVisaCategory) || selectedJourneyType === "IR5";
    // Keyed on the journey's canonical category (CR-2 -> IR-2), matching provisioning.
    const targetCandidateJourneyKey =
      isMultiCand && candidateId
        ? getCandidateJourneyKey(journeyBaseCategory(effectiveVisaCategory), candidateId)
        : selectedJourneyType;

    const { data: selectedJourney } = productTier
      ? await supabase
          .from("journeys")
          .select("subscription_tier, stripe_subscription_id, status, created_at")
          .eq("user_id", userId)
          .ilike("journey_type", targetCandidateJourneyKey)
          .maybeSingle()
      : { data: null };

    const targetCandidateProfile =
      isMultiCand && candidateId && Array.isArray(profile?.profile_details?.candidates)
        ? (profile.profile_details.candidates as any[]).find((c) => c.id === candidateId)
        : null;

    // ── Concurrency guard: serialize subscription checkouts per user so two
    // in-flight requests can't both pass the "no live sub" check below and each
    // create a subscription (double-click / retried request race). Only needed
    // for subscription purchases; one-time add-ons don't create subscriptions. ──
    if (productTier) {
      const lock = await acquireCheckoutLock(userId);
      if (!lock.ok) {
        return NextResponse.json(
          { error: "A checkout is already in progress. Please wait a moment and try again." },
          { status: 409 }
        );
      }
      lockedUserId = userId;
      lockToken = lock.token;
    }

    const TIER_RANK: Record<string, number> = { free: 0, basic: 1, premium: 2, executive: 3 };
    const tierNameForRank = (rank: number): string =>
      (Object.keys(TIER_RANK).find((k) => TIER_RANK[k] === rank) as string | undefined) || "free";

    // ── Resolve the Stripe customer FIRST so we can consult Stripe (the real
    // source of truth) for any LIVE subscriptions before deciding anything. ──
    const subscriptionRecord = await paymentService.getUserSubscription(userId);
    let stripeCustomerId: string | undefined = subscriptionRecord?.stripe_customer_id || undefined;

    // ── Resolve the EXISTING Stripe customer BEFORE the live-subscription guard ─
    // If the DB has no `stripe_customer_id` (a webhook/DB desync), the customer
    // used to be resolved only AFTER the guard below — so the guard was skipped
    // entirely and duplicate protection fell back to post-hoc cleanup, in exactly
    // the desync case the Stripe-aware guard exists to cover. Resolve it here
    // (search by our metadata tag, then by email) so the guard runs against the
    // customer that actually holds any live subs. We look up but do NOT create
    // yet — creation stays after the guard so a blocked request leaves no stray
    // customer. For a subscription purchase we FAIL CLOSED if a lookup errors:
    // proceeding could create a second customer (and a second subscription) while
    // a pre-existing customer/sub can't be ruled out.
    let searchedForCustomer = false;
    if (!stripeCustomerId && productTier) {
      searchedForCustomer = true;
      try {
        const byUserId = await stripe.customers.search({
          query: `metadata['supabase_user_id']:'${userId}'`,
          limit: 1,
        });
        stripeCustomerId = byUserId.data[0]?.id;
        if (!stripeCustomerId) {
          const byEmail = await stripe.customers.list({ email: userEmail, limit: 1 });
          stripeCustomerId = byEmail.data[0]?.id;
        }
      } catch (e) {
        console.error("[checkout] Failed to resolve existing Stripe customer:", e);
        return NextResponse.json(
          {
            error:
              "We could not verify your billing account with our payment provider. Please try again in a moment.",
          },
          { status: 503 }
        );
      }
      if (stripeCustomerId) {
        // Persist the recovered id so future requests skip the lookup and never
        // create a duplicate customer.
        await supabase
          .from("user_profiles")
          .update({ stripe_customer_id: stripeCustomerId })
          .eq("id", userId);
      }
    }

    // ── Ask Stripe what subscriptions this customer ACTUALLY has live. ────────
    // The DB (subscription_status / profile_details.stripe_subscription_id) can
    // drift from Stripe (delayed or failed webhook, past_due, manual edits).
    // Trusting it alone let a second live subscription get created on the same
    // customer. These statuses all mean "occupies a live subscription slot".
    const LIVE_SUB_STATUSES = ["active", "trialing", "past_due", "unpaid"];
    const liveSubs: Stripe.Subscription[] = [];
    if (stripeCustomerId && productTier) {
      // FAIL CLOSED: for a subscription purchase we MUST know the customer's
      // current subscriptions before creating a new one. If Stripe is unreachable
      // we cannot verify, so we refuse rather than risk creating a duplicate.
      try {
        // Auto-paginate (matches cancelDuplicateSubscriptions): a customer with
        // >100 historical subs would otherwise hide live ones past the first page,
        // letting a duplicate slip through. `for await` walks every page.
        for await (const s of stripe.subscriptions.list({
          customer: stripeCustomerId,
          status: "all",
          limit: 100,
        })) {
          if (LIVE_SUB_STATUSES.includes(s.status)) liveSubs.push(s);
        }
      } catch (e) {
        console.error("[checkout] Failed to list Stripe subscriptions:", e);
        return NextResponse.json(
          {
            error:
              "We could not verify your current subscription with our payment provider. Please try again in a moment.",
          },
          { status: 503 }
        );
      }
    }

    // Highest tier the customer actually holds. Derived from the subscription's
    // resolvable tier (metadata OR known price id) — NOT metadata alone, so a
    // legacy Premium sub is never mis-read as Free — else the DB tier. Taking the
    // MAX means a stale DB can never UNDER-report the current tier and let a
    // duplicate or downgrade slip through.
    // The account profile holds a maximum tier. Checkout guards must instead
    // consider only the selected journey and its Stripe subscription.
    // Within the journey, plans bought to ADD an IR-5 candidate pay for that
    // candidate's own journey row, not the primary plan being upgraded, so they are
    // excluded (unless the journey row itself points at one, e.g. the first IR-5
    // purchase). Otherwise a candidate-2 Executive plan would make a candidate-1
    // Basic -> Premium upgrade look like a downgrade, or be picked as the sub to retire.
    const dbSubId = selectedJourney?.stripe_subscription_id as string | undefined;
    const journeyLiveSubs = liveSubs.filter((subscription) => {
      if (subscription.id === dbSubId) return true;
      const subscriptionJourneyType = subscription.metadata?.visa_category
        ? journeyTypeForVisaCategory(subscription.metadata.visa_category)
        : null;
      return (
        subscriptionJourneyType === selectedJourneyType && !isAddCandidateSubscription(subscription)
      );
    });
    const candidateRosterTier = targetCandidateProfile?.tier;
    const dbTier = (
      (candidateRosterTier || selectedJourney?.subscription_tier) ??
      "free"
    ).toLowerCase();
    const dbStatus = selectedJourney?.status ?? "not_started";
    const stripeTierRank = journeyLiveSubs.reduce((max, s) => {
      const t = resolveSubscriptionTier(s);
      return Math.max(max, t ? (TIER_RANK[t] ?? 0) : 0);
    }, 0);
    const effectiveCurrentRank = Math.max(TIER_RANK[dbTier] ?? 0, stripeTierRank);
    const effectiveCurrentTier = tierNameForRank(effectiveCurrentRank);
    // "Has a plan" is true if EITHER source says so — this closes the desync gap.
    const hasLivePlan =
      journeyLiveSubs.length > 0 || (dbStatus !== "completed" && (TIER_RANK[dbTier] ?? 0) > 0);

    // A live sub whose recurring charge is failing. Such a user should RECOVER
    // (update payment method / pay the open invoice) via the billing portal, not
    // buy the same plan again — that would create a second subscription and leave
    // the broken one behind.
    const failingSub = journeyLiveSubs.find(
      (s) => s.status === "past_due" || s.status === "unpaid"
    );

    // The real subscription to retire on an upgrade — prefer the one the DB points
    // at, else the highest-tier live sub. This is only a HINT: verify-session runs
    // a belt-and-suspenders cleanup, and (critically) the old sub is cancelled ONLY
    // after the new one is confirmed paid, never here at checkout time.
    const oldSubscriptionId =
      journeyLiveSubs.find((s) => s.id === dbSubId)?.id ||
      [...journeyLiveSubs].sort((a, b) => {
        const ra = resolveSubscriptionTier(b);
        const rb = resolveSubscriptionTier(a);
        return (ra ? TIER_RANK[ra] : 0) - (rb ? TIER_RANK[rb] : 0);
      })[0]?.id ||
      dbSubId ||
      "";

    // ── Authoritative upgrade state — derived from Stripe+DB, NEVER the client. ─
    // The proration below subtracts the current-tier price from the target price.
    // If we trusted a client-supplied `currentTier`/`isUpgrade`, a free user could
    // send { isUpgrade: true, currentTier: "premium" } and pay only the tier
    // *difference* while being provisioned the full higher tier. So it is server-derived.
    const isMultiCandidate =
      isMultiCandidateCategory(effectiveVisaCategory) || selectedJourneyType === "IR5";
    const isUpgradeAction = action === "upgrade";
    const isAddCandidateAction = action === "add_candidate";

    // When upgrading (either explicitly requested via action="upgrade" or a single-candidate upgrade),
    // we want proration, retiring the old sub, and guarding against downgrade/duplicate.
    const serverIsUpgrade =
      hasLivePlan &&
      effectiveCurrentRank > 0 &&
      (isUpgradeAction || (!isMultiCandidate && !isAddCandidateAction));

    const serverCurrentTier = serverIsUpgrade ? effectiveCurrentTier : undefined;

    // isAddCandidateRequest indicates adding a new candidate to a roster or initial multi-candidate setup
    const isAddCandidateRequest = !serverIsUpgrade && (isAddCandidateAction || isMultiCandidate);

    // ── Server-side downgrade + duplicate-purchase guard (Stripe-aware) ──────
    // Rejects two scenarios:
    //   (a) target tier <  current tier  → downgrade attempt
    //   (b) target tier == current tier  → duplicate purchase (already owned/live)
    // Blocks even when the DB status is stale, because `hasLivePlan` also trusts
    // Stripe. Upgrades (target > current) fall through and are allowed.
    // NOTE: Multi-candidate categories allow purchasing additional candidates at any tier!
    if (productTier && (!isMultiCandidate || isUpgradeAction)) {
      const targetRank = TIER_RANK[productTier.toLowerCase()] ?? 0;

      if (hasLivePlan && targetRank < effectiveCurrentRank) {
        return NextResponse.json(
          {
            error: `You already have the ${effectiveCurrentTier} plan. Downgrades are not allowed, manage via billing portal.`,
          },
          { status: 400 }
        );
      }
      if (hasLivePlan && targetRank === effectiveCurrentRank) {
        // Payment failing on the plan they already hold → send them to recover it,
        // not re-buy (which would spawn a duplicate subscription).
        if (failingSub) {
          return NextResponse.json(
            {
              error: `Your ${effectiveCurrentTier} plan payment is past due. Please update your payment method to restore it instead of purchasing again.`,
              recover: true,
              portal: true,
            },
            { status: 409 }
          );
        }
        return NextResponse.json(
          {
            error: `You already own the ${effectiveCurrentTier} plan. No need to purchase again.`,
            alreadyOwned: true,
          },
          { status: 400 }
        );
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    // Resolve/create the Stripe customer now (done AFTER the guard so a blocked/
    // duplicate request never creates a stray customer). For a subscription
    // purchase the existing-customer SEARCH already ran above (fail-closed), so we
    // only reach `create` here for a genuinely new customer that passed the guard.
    // For one-time purchases (no productTier) we do the best-effort search here
    // (its failure is non-fatal — a one-time payment can't create a duplicate sub).
    if (!stripeCustomerId) {
      if (!searchedForCustomer) {
        try {
          // Preferred: match on the id we stamp into customer metadata at creation.
          const byUserId = await stripe.customers.search({
            query: `metadata['supabase_user_id']:'${userId}'`,
            limit: 1,
          });
          stripeCustomerId = byUserId.data[0]?.id;
        } catch (e) {
          console.error("[checkout] customer search by user id failed (non-fatal):", e);
        }

        if (!stripeCustomerId) {
          // Fallback: match on email (covers customers created before we tagged them).
          try {
            const byEmail = await stripe.customers.list({ email: userEmail, limit: 1 });
            stripeCustomerId = byEmail.data[0]?.id;
          } catch (e) {
            console.error("[checkout] customer list by email failed (non-fatal):", e);
          }
        }
      }

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { supabase_user_id: userId },
        });
        stripeCustomerId = customer.id;
      }

      // Persist the resolved customer id so we never re-derive (or re-create) it.
      await supabase
        .from("user_profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", userId);
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
      if (isWalletTopup) {
        const sep = topupReturnPath.includes("?") ? "&" : "?";
        return `${base}${topupReturnPath}${sep}topup_canceled=1`;
      }
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
        const firstCatalogAddonId = getCatalogAddonId(addons[0]);

        const firstKind =
          (
            ADDONS.find((addon) => addon.id === firstCatalogAddonId) as
              { kind?: string } | undefined
          )?.kind ?? "tools";
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
    // WALLET TOP-UP — One-time Payment ($1 = 1 credit)
    // ================================================
    if (isWalletTopup) {
      sessionParams.mode = "payment";
      sessionParams.line_items = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Rahvana Wallet: ${topupCredits} Credits`,
              description: "Credits for standalone tools, guides and services. 1 credit = $1.",
            },
            unit_amount: topupCredits * 100,
          },
          quantity: 1,
        },
      ];
      sessionParams.payment_intent_data = {
        metadata: { user_id: userId, product_type: WALLET_TOPUP_PRODUCT_TYPE },
      };
      sessionParams.metadata = {
        ...sessionParams.metadata,
        stripe_customer_id: stripeCustomerId!,
        product_type: WALLET_TOPUP_PRODUCT_TYPE,
        product_id: WALLET_TOPUP_PRODUCT_TYPE,
        product_name: `Rahvana Wallet: ${topupCredits} Credits`,
        credits: String(topupCredits),
        topup_reason: typeof resourceId === "string" && resourceId ? "exact_deficit" : "pack",
        resource_id: typeof resourceId === "string" ? resourceId.slice(0, 100) : "",
        return_to: topupReturnPath,
      };
    }
    // ================================================
    // JOURNEY PLAN — Monthly Subscription + Add-ons
    // ================================================
    else if (productTier) {
      const tierLower = productTier.toLowerCase();

      let product:
        typeof PRODUCTS.BASIC | typeof PRODUCTS.PREMIUM | typeof PRODUCTS.EXECUTIVE | null = null;
      if (tierLower === "basic") product = PRODUCTS.BASIC;
      if (tierLower === "premium") product = PRODUCTS.PREMIUM;
      if (tierLower === "executive") product = PRODUCTS.EXECUTIVE;

      if (!product) {
        return NextResponse.json({ error: msg(E.CASE_DATA_NOT_FOUND) }, { status: 404 });
      }

      // Subscription mode for all journey plans
      sessionParams.mode = "subscription";

      // Tag the subscription itself (not just the checkout session) with the tier
      // so Stripe stays the source of truth: future checkouts and the safety
      // cleanup can read `subscription.metadata.tier` to know exactly what a live

      // Tag the subscription itself (not just the checkout session) with the tier
      // so Stripe stays the source of truth: future checkouts and the safety
      // cleanup can read `subscription.metadata.tier` to know exactly what a live
      // sub represents, instead of guessing from price amounts.
      sessionParams.subscription_data = {
        metadata: {
          user_id: userId,
          tier: tierLower,
          visa_category: effectiveVisaCategory,
          candidate_count: String(parsedCandidateCount),
          target_candidate_id: candidateId || "",
          candidate_id: candidateId || "",
          action: isAddCandidateRequest ? "add_candidate" : "",
          is_add_candidate: isAddCandidateRequest ? "true" : "false",
        },
      };

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
      let monthlyPrice = product.monthlyPrice;
      let upgradeMonthsElapsed = 0;
      let upgradeMonthsRemaining = 12;

      if (serverIsUpgrade && serverCurrentTier && targetAnnualPrice > currentAnnualPrice) {
        // Resolve active subscription start date for accurate 12-month timeline calculation
        const activeStartDate =
          targetCandidateProfile?.createdAt ||
          selectedJourney?.created_at ||
          profile?.profile_details?.plan_purchase_date ||
          null;

        const cycle = calculateSubscriptionCycle(activeStartDate);
        upgradeMonthsElapsed = cycle.monthsElapsed;
        upgradeMonthsRemaining = cycle.monthsRemaining;

        const category = VISA_CATEGORIES.find((v) => v.id === effectiveVisaCategory);
        const curPlanObj = category?.plans.find((p) => p.id === serverCurrentTier);
        const targetPlanObj = category?.plans.find((p) => p.id === tierLower);

        if (curPlanObj && targetPlanObj) {
          const schedule = calculateUpgradeSchedule({
            currentPlan: curPlanObj,
            targetPlan: targetPlanObj,
            monthsElapsed: cycle.monthsElapsed,
            monthsRemaining: cycle.monthsRemaining,
          });

          if (schedule) {
            effectiveAnnualPrice = schedule.totalNewCommitment;
            monthlyPrice = schedule.newMonthlyRate;
          }
        } else if (newMonthlyPrice && !isNaN(Number(newMonthlyPrice)) && Number(newMonthlyPrice) > 0) {
          monthlyPrice = Number(newMonthlyPrice);
          effectiveAnnualPrice =
            upgradeTotal && !isNaN(Number(upgradeTotal))
              ? Number(upgradeTotal)
              : Math.round(monthlyPrice * 12 * 100) / 100;
        } else {
          // Fallback simplified formula: targetAnnual - paidSoFar
          const curMonthly =
            currentAnnualPrice > 0 ? Math.round((currentAnnualPrice / 12) * 100) / 100 : 0;
          const paidSoFar = Math.round(upgradeMonthsElapsed * curMonthly * 100) / 100;
          effectiveAnnualPrice = Math.max(0, targetAnnualPrice - paidSoFar);
          monthlyPrice = Math.round((effectiveAnnualPrice / 12) * 100) / 100;
        }
      } else {
        monthlyPrice =
          effectiveAnnualPrice === product.price
            ? product.monthlyPrice // $29.08, $58.25, $91.58
            : Math.round((effectiveAnnualPrice / 12) * 100) / 100;
      }

      // Add main plan — for upgrades, create dynamic 12-month upgrade schedule line item
      const useRecurringId =
        !serverIsUpgrade &&
        product.recurringPriceId &&
        product.recurringPriceId.length >= 10 &&
        effectiveAnnualPrice === product.price;

      if (serverIsUpgrade) {
        sessionParams.line_items!.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: `${product.name} (Upgrade — 12-Month Schedule)`,
              description: `12-month upgrade schedule: $${effectiveAnnualPrice} total ($${monthlyPrice}/mo). Replaces ${serverCurrentTier} plan.`,
              tax_code: (product as any).taxCode || "txcd_10103000",
            },
            unit_amount: Math.round(monthlyPrice * 100),
            recurring: { interval: "month" },
          },
          quantity: parsedCandidateCount,
        });
      } else if (useRecurringId) {
        sessionParams.line_items!.push({
          price: product.recurringPriceId,
          quantity: parsedCandidateCount,
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
          quantity: parsedCandidateCount,
        });
      }

      // Metadata — tag subscription and checkout session with upgrade schedule info
      sessionParams.subscription_data = {
        metadata: {
          user_id: userId,
          tier: tierLower,
          visa_category: effectiveVisaCategory,
          candidate_count: String(parsedCandidateCount),
          target_candidate_id: candidateId || "",
          candidate_id: candidateId || "",
          action: isAddCandidateRequest ? "add_candidate" : isUpgradeAction ? "upgrade" : "",
          is_add_candidate: isAddCandidateRequest ? "true" : "false",
          is_upgrade: serverIsUpgrade ? "true" : "false",
          upgrade_total: serverIsUpgrade ? String(effectiveAnnualPrice) : "",
          upgrade_monthly_rate: serverIsUpgrade ? String(monthlyPrice) : "",
          upgrade_months_elapsed: serverIsUpgrade ? String(upgradeMonthsElapsed) : "",
          upgrade_months_remaining: serverIsUpgrade ? String(upgradeMonthsRemaining) : "",
        },
      };

      sessionParams.metadata = {
        ...sessionParams.metadata,
        stripe_customer_id: stripeCustomerId!,
        product_type: "journey_plan",
        product_id: productTier,
        product_name: product.name + (serverIsUpgrade ? " (Upgrade)" : ""),
        visa_category: effectiveVisaCategory,
        candidate_count: String(parsedCandidateCount),
        target_candidate_id: candidateId || "",
        candidate_id: candidateId || "",
        action: isAddCandidateRequest ? "add_candidate" : isUpgradeAction ? "upgrade" : "",
        is_add_candidate: isAddCandidateRequest ? "true" : "false",
        is_upgrade: serverIsUpgrade ? "true" : "false",
        upgrade_total: serverIsUpgrade ? String(effectiveAnnualPrice) : "",
        upgrade_monthly_rate: serverIsUpgrade ? String(monthlyPrice) : "",
        upgrade_months_elapsed: serverIsUpgrade ? String(upgradeMonthsElapsed) : "",
        upgrade_months_remaining: serverIsUpgrade ? String(upgradeMonthsRemaining) : "",
        old_subscription_id: serverIsUpgrade ? oldSubscriptionId || "" : "",
      };

      // Add-ons — one-time items alongside subscription
      if (addons && Array.isArray(addons) && addons.length > 0) {
        for (const addonId of addons) {
          const catalogAddonId = getCatalogAddonId(addonId);

          const addon = (PRODUCTS.ADDONS as any)?.[catalogAddonId];

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
        const catalogAddonId = getCatalogAddonId(addonId);

        const addon = (PRODUCTS.ADDONS as any)?.[catalogAddonId];

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

      // Checked AFTER the loop: checking inside it (before the first push) rejected
      // every standalone add-on purchase with a 400.
      if (sessionParams.line_items!.length === 0) {
        return NextResponse.json(
          { error: "No valid purchasable add-ons were provided." },
          { status: 400 }
        );
      }

      sessionParams.metadata = {
        ...sessionParams.metadata,
        stripe_customer_id: stripeCustomerId!,
        product_type: "standalone_addon",
        addons: JSON.stringify(addons),
        visa_category: effectiveVisaCategory,
      };
    } else if (consultationDetails) {
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
    } else if (translationDetails) {
      // Deferred-create (pay-first) flow for Document Translation — mirrors Expert
      // Consultation. No `translation_documents` row exists yet; the fields ride along
      // in Stripe metadata and the row is inserted by the webhook / verify-session ONLY
      // after a successful payment, so a canceled/failed checkout leaves nothing behind.
      // `docId` is the future row's primary key.
      const docId =
        typeof translationDetails.docId === "string" && translationDetails.docId
          ? translationDetails.docId
          : crypto.randomUUID();
      // The file must be the caller's own upload from upload-file
      // (`<userId>/translation-originals/<docId>/...`); never trust a client path.
      const storagePath = String(translationDetails.storagePath || "");
      if (
        !/^[0-9a-f-]{36}$/i.test(docId) ||
        !storagePath.startsWith(`${userId}/translation-originals/${docId}/`) ||
        storagePath.includes("..")
      ) {
        return NextResponse.json({ error: "Invalid translation upload." }, { status: 400 });
      }
      const documentTranslationPrice = 25; // $25 per document translation request

      // Look up name server-side (never trust client-provided identity).
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      const splitMeta = (str: string, prefix: string) => {
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
      const notesMeta = splitMeta(String(translationDetails.userNotes || ""), "t_notes");

      sessionParams.mode = "payment";
      sessionParams.line_items = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Document Translation",
              description: `Document Translation (${translationDetails.documentType || "document"})`,
            },
            unit_amount: documentTranslationPrice * 100,
          },
          quantity: 1,
        },
      ];

      sessionParams.metadata = {
        ...sessionParams.metadata,
        product_type: "document_translations",
        product_id: docId,
        t_doc_id: docId,
        t_storage_path: storagePath,
        t_original_filename: String(translationDetails.originalFilename || ""),
        t_original_file_size: String(translationDetails.originalFileSize || ""),
        t_original_mime_type: String(translationDetails.originalMimeType || ""),
        t_document_type: String(translationDetails.documentType || ""),
        t_user_email: String(user.email || ""),
        t_user_name: String(profileRow?.full_name || "User"),
        t_candidate_id: String(translationDetails.candidateId || "candidate-1"),
        t_candidate_name: String(translationDetails.candidateName || ""),
        t_source: translationDetails.source === "journey" ? "journey" : "standalone",
        t_journey_slug: String(translationDetails.journeySlug || ""),
        ...notesMeta,
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

    // Idempotency key (subscription checkouts): dedupes accidental retries of the
    // SAME purchase (network timeout, double submit) so a retry returns the
    // existing session instead of creating a second one. Scoped to a short time
    // bucket so a genuinely new attempt later still gets a fresh session, and
    // includes ALL parameters (plan, candidate count, candidate ID, action, line items,
    // and add-ons) so any parameter change (e.g. switching between 2 and 4 parents)
    // yields a distinct idempotency key, avoiding Stripe parameter-mismatch errors.
    let idempotencyKey: string | undefined;
    if (productTier) {
      const bucket = Math.floor(Date.now() / (10 * 60 * 1000)); // 10-minute dedupe window
      const lineItemsSummary = (sessionParams.line_items || []).map((item) => ({
        price: item.price || null,
        quantity: item.quantity ?? 1,
        amount: item.price_data?.unit_amount ?? null,
      }));
      const payloadToHash = {
        userId,
        productTier: productTier.toLowerCase(),
        visaCategory: effectiveVisaCategory,
        candidateCount: parsedCandidateCount,
        candidateId: candidateId || "",
        action: action || "",
        addons: Array.isArray(addons) ? [...addons].sort() : [],
        lineItems: lineItemsSummary,
        bucket,
      };
      idempotencyKey = crypto
        .createHash("sha256")
        .update(JSON.stringify(payloadToHash))
        .digest("hex");
    }

    logDebug("Calling Stripe with sessionParams:", sessionParams);
    // Create Stripe checkout session
    let session;
    try {
      session = await stripe.checkout.sessions.create(
        sessionParams,
        idempotencyKey ? { idempotencyKey } : undefined
      );
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
    // wallet_topup is mapped to "consultation" too (NOT journey_plan, which
    // reconcileUserPlan reads to self-heal plan tiers).
    const dbProductType =
      sessionParams.metadata?.product_type === "standalone_addon"
        ? "journey_plan"
        : sessionParams.metadata?.product_type === "medical_booking" ||
            sessionParams.metadata?.product_type === "pcc_filing" ||
            sessionParams.metadata?.product_type === "document_translations" ||
            sessionParams.metadata?.product_type === WALLET_TOPUP_PRODUCT_TYPE
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
              ? documentTranslationId || sessionParams.metadata?.product_id || ""
              : String(sessionParams.metadata?.product_id || "");

    let paymentId: string | null = null;
    try {
      // Check if payment already exists for this session (e.g. reused checkout session from idempotent retry)
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("stripe_checkout_session_id", session.id)
        .maybeSingle();

      if (existingPayment) {
        paymentId = existingPayment.id;
        logDebug("Existing payment record reused for session:", { paymentId });
      } else {
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
      }

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
    console.error("[checkout] Failed to create checkout session:", error);
    // Stripe / DB error text stays in the logs; the client gets a generic message.
    return NextResponse.json(
      { error: "We could not start checkout. Please try again." },
      { status: 500 }
    );
  } finally {
    // Always release the checkout lock, on success or any error/early return.
    // Pass the ownership token so we never delete another request's lock.
    if (lockedUserId) {
      await releaseCheckoutLock(lockedUserId, lockToken).catch(() => {});
    }
  }
}

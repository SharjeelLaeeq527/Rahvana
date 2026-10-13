import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { safeRedirectPath } from "@/lib/security/safeRedirect";

/**
 * Rahvana Wallet top-ups: $1 USD = 1 credit.
 *
 * The client sends only a whole-dollar amount (a preset pack or the exact deficit
 * for a tool). Checkout validates it here, Stripe charges it, and BOTH the webhook
 * and verify-session credit it through `applyWalletTopup`, which is idempotent per
 * Stripe session (credit_wallet_topup_atomic + unique stripe_session_id).
 */

export const WALLET_TOPUP_PRODUCT_TYPE = "wallet_topup";

/** Preset packs shown in the top-up UI. */
export const WALLET_TOPUP_PACKS = [10, 25, 50, 100] as const;

/**
 * Smallest top-up we charge. Protects margin from Stripe's flat fee. An exact
 * deficit below this is rounded up to it (the extra stays in the wallet).
 */
export const WALLET_MIN_TOPUP = 5;

/** Upper bound for a single top-up (largest catalog item is 200 credits). */
export const WALLET_MAX_TOPUP = 1000;

export const WALLET_DEFAULT_RETURN_PATH = "/resources";

export type TopupValidation =
  | { ok: true; credits: number }
  | { ok: false; error: string };

/**
 * Validate a client-supplied top-up amount. Whole credits only: every catalog price
 * is a whole number, so fractional top-ups would only strand cents in the wallet.
 * A deficit under the minimum is lifted to the minimum.
 */
export function validateTopupAmount(raw: unknown): TopupValidation {
  const amount = typeof raw === "string" ? Number(raw) : raw;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Top-up amount must be a positive number." };
  }
  if (!Number.isInteger(amount)) {
    return { ok: false, error: "Top-up amount must be a whole number of credits." };
  }
  if (amount > WALLET_MAX_TOPUP) {
    return {
      ok: false,
      error: `Top-up amount cannot exceed ${WALLET_MAX_TOPUP} credits.`,
    };
  }
  return { ok: true, credits: Math.max(amount, WALLET_MIN_TOPUP) };
}

/** Same-origin relative return path for after the top-up (open-redirect safe). */
export function resolveTopupReturnPath(raw: unknown): string {
  return safeRedirectPath(typeof raw === "string" ? raw : null, WALLET_DEFAULT_RETURN_PATH);
}

export function isWalletTopupSession(session: Pick<Stripe.Checkout.Session, "metadata">) {
  return session.metadata?.product_type === WALLET_TOPUP_PRODUCT_TYPE;
}

/**
 * Credits paid for in this session. Taken from what Stripe actually charged before
 * tax (`amount_subtotal`), never from metadata alone, so a tampered or stale
 * metadata value can't mint credits. Returns null when it can't be trusted.
 */
export function creditsFromSession(
  session: Pick<Stripe.Checkout.Session, "amount_subtotal" | "metadata">
): number | null {
  const subtotalCents = session.amount_subtotal;
  if (typeof subtotalCents !== "number" || subtotalCents <= 0) return null;
  const credits = subtotalCents / 100;
  if (!Number.isInteger(credits)) return null;

  const metaCredits = Number(session.metadata?.credits);
  if (session.metadata?.credits !== undefined && metaCredits !== credits) {
    // Charged amount and tagged amount disagree: refuse rather than guess.
    return null;
  }
  return credits;
}

export type WalletTopupResult =
  | {
      ok: true;
      credits: number;
      balance: number;
      alreadyProcessed: boolean;
      transactionId: string | null;
    }
  | { ok: false; reason: "not_paid" | "invalid_session" | "rpc_failed"; error?: string };

/**
 * Credit a paid top-up session to the buyer's wallet. Safe to call from both the
 * webhook and verify-session, any number of times.
 */
export async function applyWalletTopup(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
  logPrefix = "[wallet-topup]"
): Promise<WalletTopupResult> {
  const userId = session.metadata?.user_id;
  if (!userId || !isWalletTopupSession(session)) {
    return { ok: false, reason: "invalid_session" };
  }

  // Strictly "paid": a `complete` session can still be unpaid for delayed methods.
  if (session.payment_status !== "paid") {
    return { ok: false, reason: "not_paid" };
  }

  const credits = creditsFromSession(session);
  if (credits === null) {
    console.error(`${logPrefix} Untrusted amount on session ${session.id}`, {
      amount_subtotal: session.amount_subtotal,
      metaCredits: session.metadata?.credits,
    });
    return { ok: false, reason: "invalid_session" };
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  const { data, error } = await supabase.rpc("credit_wallet_topup_atomic", {
    p_user_id: userId,
    p_amount: credits,
    p_stripe_session_id: session.id,
    p_stripe_payment_id: (session.payment_intent as string) || null,
    p_description: `Wallet Top-Up: ${credits} Credits ($${credits} USD)`,
    p_payment_id: payment?.id ?? null,
    p_metadata: {
      source: "stripe_checkout",
      amount_total_cents: session.amount_total ?? null,
      currency: session.currency ?? "usd",
      reason: session.metadata?.topup_reason || "manual",
      resource_id: session.metadata?.resource_id || null,
    },
  });

  if (error || !data?.success) {
    console.error(`${logPrefix} credit_wallet_topup_atomic failed for ${session.id}:`, error);
    return { ok: false, reason: "rpc_failed", error: error?.message };
  }

  return {
    ok: true,
    credits,
    balance: Number(data.balance ?? 0),
    alreadyProcessed: data.already_processed === true,
    transactionId: data.transaction_id ?? null,
  };
}

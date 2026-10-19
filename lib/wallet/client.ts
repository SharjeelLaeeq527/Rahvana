import {
  WALLET_MAX_TOPUP,
  WALLET_MIN_TOPUP,
  WALLET_TOPUP_PRODUCT_TYPE,
} from "@/lib/wallet/topup";
import type { WalletResourceType } from "@/lib/wallet/catalog";

/**
 * Browser-side calls to the wallet API (/api/wallet/*) and the top-up checkout.
 * The server decides every price and credit amount; nothing here is trusted.
 * Kept out of WalletContext so the logic is testable without React.
 */

export type WalletUnlock = { resourceType: WalletResourceType; resourceId: string };

export type WalletSnapshot = { balance: number; unlocks: WalletUnlock[] };

export type LaunchResponse = {
  status: number;
  body: {
    success: boolean;
    error?: string;
    message?: string;
    balance?: number;
    charged?: number;
    alreadyUnlocked?: boolean;
    required?: number;
    available?: number;
    deficit?: number;
    topupAmount?: number;
    [key: string]: unknown;
  };
};

export const unlockKey = (resourceType: string, resourceId: string) =>
  `${resourceType}:${resourceId}`;

/** Null when signed out (401). Throws on any other failure. */
export async function fetchWalletSnapshot(): Promise<WalletSnapshot | null> {
  const res = await fetch("/api/wallet", { cache: "no-store" });
  if (res.status === 401) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || "Could not load your wallet.");
  }
  const balance = Number(data.wallet?.balance);
  return {
    balance: Number.isFinite(balance) ? balance : 0,
    unlocks: Array.isArray(data.unlocks) ? data.unlocks : [],
  };
}

/** Matches the server's accepted idempotency key shape. */
export function newLaunchIdempotencyKey() {
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `launch_${Date.now()}_${rand}`.slice(0, 100);
}

export async function requestLaunch(
  resourceType: WalletResourceType,
  resourceId: string,
  idempotencyKey: string
): Promise<LaunchResponse> {
  try {
    const res = await fetch("/api/wallet/launch-tool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceType, resourceId, idempotencyKey }),
    });
    const body = await res.json().catch(() => null);
    return {
      status: res.status,
      body: body && typeof body === "object" ? body : { success: false, error: "LAUNCH_FAILED" },
    };
  } catch {
    return { status: 0, body: { success: false, error: "NETWORK_ERROR" } };
  }
}

export type CustomTopupResult = { ok: true; credits: number } | { ok: false; error: string };

/** Validate what the user typed in the custom amount box. */
export function parseCustomTopup(input: string): CustomTopupResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Enter an amount." };
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false, error: "Enter a whole number of dollars." };
  }
  const credits = Number(trimmed);
  if (credits < WALLET_MIN_TOPUP) {
    return { ok: false, error: `The minimum top-up is $${WALLET_MIN_TOPUP}.` };
  }
  if (credits > WALLET_MAX_TOPUP) {
    return { ok: false, error: `The maximum top-up is $${WALLET_MAX_TOPUP}.` };
  }
  return { ok: true, credits };
}

/** Same-origin path to come back to after Stripe. Falls back to /resources. */
export function currentReturnPath(): string {
  if (typeof window === "undefined") return "/resources";
  const path = `${window.location.pathname}${window.location.search}`;
  return path.startsWith("/") && !path.startsWith("//") ? path : "/resources";
}

/** Creates the Stripe session and returns its URL. Throws a readable message. */
export async function createTopupCheckout(amount: number, returnUrl: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productType: WALLET_TOPUP_PRODUCT_TYPE, amount, returnUrl }),
    });
  } catch {
    throw new Error("Could not reach the payment page. Check your connection and try again.");
  }
  const data = await res.json().catch(() => null);
  if (res.status === 401) throw new Error("Please sign in to top up your wallet.");
  if (!res.ok || typeof data?.url !== "string") {
    throw new Error(data?.error || "Could not start the payment. Please try again.");
  }
  return data.url;
}

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PHOTO_BOOTH_PHOTOS_PER_PURCHASE,
  getCatalogItem,
  isItemUnlocked,
  isPhotoBoothItem,
} from "@/lib/wallet/catalog";
import { getPhotoBoothPack } from "@/lib/wallet/photoBoothPack";
import { loadWalletState } from "@/lib/wallet/state";
import { WALLET_MAX_TOPUP, WALLET_MIN_TOPUP } from "@/lib/wallet/topup";

const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9_:.-]{8,100}$/;

export type LaunchRequest = {
  resourceType: unknown;
  resourceId: unknown;
  idempotencyKey?: unknown;
};

export type LaunchResult =
  | {
      status: 200;
      body: {
        success: true;
        unlocked: true;
        resourceType: string;
        resourceId: string;
        balance: number;
        charged: number;
        alreadyUnlocked: boolean;
        alreadyProcessed: boolean;
        transactionId: string | null;
      };
    }
  | {
      status: 402;
      body: {
        success: false;
        error: "INSUFFICIENT_CREDITS";
        required: number;
        available: number;
        deficit: number;
        /** Whole-credit top-up that covers the deficit (Phase 5 exact-replenish CTA). */
        topupAmount: number;
      };
    }
  | { status: 400 | 404 | 500; body: { success: false; error: string } };

/**
 * Exact replenishment: the smallest whole-credit top-up that covers the deficit,
 * lifted to the minimum top-up and capped at the maximum.
 */
export function topupAmountForDeficit(deficit: number): number {
  return Math.min(WALLET_MAX_TOPUP, Math.max(WALLET_MIN_TOPUP, Math.ceil(deficit - 1e-9)));
}

/**
 * Unlock a standalone resource with wallet credits. The price always comes from
 * the server catalog; the client sends only the resource. Re-launching an
 * unlocked resource is free, and the deduct RPC serializes concurrent launches
 * under the wallet row lock, so double clicks never charge twice.
 *
 * Call with the service-role client ONLY after authenticating `userId`.
 */
export async function launchResource(
  supabase: SupabaseClient,
  userId: string,
  request: LaunchRequest
): Promise<LaunchResult> {
  const item = getCatalogItem(request.resourceType, request.resourceId);
  if (!item) {
    return { status: 404, body: { success: false, error: "UNKNOWN_RESOURCE" } };
  }
  if (!item.launchable) {
    return { status: 400, body: { success: false, error: "RESOURCE_NOT_LAUNCHABLE" } };
  }

  let idempotencyKey: string | null = null;
  if (request.idempotencyKey !== undefined && request.idempotencyKey !== null) {
    if (typeof request.idempotencyKey !== "string" || !IDEMPOTENCY_KEY_RE.test(request.idempotencyKey)) {
      return { status: 400, body: { success: false, error: "INVALID_IDEMPOTENCY_KEY" } };
    }
    // The ledger's idempotency index is global; namespacing by user keeps one
    // user's key from colliding with (or probing) another user's, and by resource
    // so a reused key can't return another resource's result as an unlock.
    idempotencyKey = `launch:${userId}:${item.resourceType}:${item.resourceId}:${request.idempotencyKey}`;
  }

  // Photo Booth is sold in packs of photos: a used-up pack is closed first, so
  // it can be bought again even if closing it after the last photo failed.
  if (isPhotoBoothItem(item)) await getPhotoBoothPack(supabase, userId);

  // Legacy purchases and earlier wallet unlocks are never charged again.
  const state = await loadWalletState(supabase, userId);
  if (isItemUnlocked(item, state.unlockRows, state.purchasedAddons)) {
    return {
      status: 200,
      body: {
        success: true,
        unlocked: true,
        resourceType: item.resourceType,
        resourceId: item.resourceId,
        balance: state.balance,
        charged: 0,
        alreadyUnlocked: true,
        alreadyProcessed: false,
        transactionId: null,
      },
    };
  }

  const { data, error } = await supabase.rpc("deduct_wallet_credits_atomic", {
    p_user_id: userId,
    p_resource_type: item.resourceType,
    p_resource_id: item.resourceId,
    p_credit_cost: item.credits,
    p_description: isPhotoBoothItem(item)
      ? `${item.name} - ${PHOTO_BOOTH_PHOTOS_PER_PURCHASE} photos`
      : `${item.name} - Standalone Access Unlock`,
    p_idempotency_key: idempotencyKey,
    p_metadata: { source: "wallet_launch", catalog_credits: item.credits },
  });

  if (error || !data) {
    console.error(`[wallet] deduct failed for ${item.resourceType}/${item.resourceId}:`, error);
    return { status: 500, body: { success: false, error: "LAUNCH_FAILED" } };
  }

  if (data.success === false) {
    if (data.error === "INSUFFICIENT_CREDITS") {
      const deficit = Number(data.deficit ?? item.credits);
      return {
        status: 402,
        body: {
          success: false,
          error: "INSUFFICIENT_CREDITS",
          required: Number(data.required ?? item.credits),
          available: Number(data.available ?? 0),
          deficit,
          topupAmount: topupAmountForDeficit(deficit),
        },
      };
    }
    console.error(`[wallet] deduct refused ${item.resourceId}:`, data);
    return { status: 500, body: { success: false, error: "LAUNCH_FAILED" } };
  }

  const alreadyUnlocked = data.already_unlocked === true;
  const alreadyProcessed = data.already_processed === true;
  return {
    status: 200,
    body: {
      success: true,
      unlocked: true,
      resourceType: item.resourceType,
      resourceId: item.resourceId,
      balance: Number(data.balance ?? 0),
      charged: alreadyUnlocked || alreadyProcessed ? 0 : item.credits,
      alreadyUnlocked,
      alreadyProcessed,
      transactionId: data.transaction_id ?? null,
    },
  };
}

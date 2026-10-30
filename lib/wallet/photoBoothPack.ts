import type { SupabaseClient } from "@supabase/supabase-js";
import { PHOTO_BOOTH_PHOTOS_PER_PURCHASE, PHOTO_BOOTH_TOOL_ID } from "@/lib/wallet/catalog";

/**
 * Standalone Photo Booth is sold in packs: each credit purchase of the tool gives
 * PHOTO_BOOTH_PHOTOS_PER_PURCHASE photos. Uses are counted on the
 * `photo_booth:wallet` feature_usage key against (purchases x photos per pack).
 * When the last photo is used, the unlock row is closed ('revoked') so the user
 * can buy the tool again; the deduct RPC re-activates the row on that purchase.
 * Journey mode never reads this (journey plans have their own counters).
 */
export const PHOTO_BOOTH_WALLET_USAGE_KEY = "photo_booth:wallet";

export type PhotoBoothPack = {
  purchases: number;
  limit: number;
  used: number;
  remaining: number;
};

type PackRead = PhotoBoothPack & {
  latestTransactionId: string | null;
  row: { status: string; transaction_id: string | null } | null;
};

async function readPack(supabase: SupabaseClient, userId: string): Promise<PackRead> {
  const [txRes, usageRes, rowRes] = await Promise.all([
    supabase
      .from("credit_transactions")
      .select("id, created_at")
      .eq("user_id", userId)
      .eq("resource_type", "tool")
      .eq("resource_id", PHOTO_BOOTH_TOOL_ID)
      .eq("transaction_type", "tool_launch")
      .eq("status", "completed")
      .order("created_at", { ascending: false }),
    supabase
      .from("feature_usage")
      .select("usage_count")
      .eq("user_id", userId)
      .eq("feature_key", PHOTO_BOOTH_WALLET_USAGE_KEY)
      .maybeSingle(),
    supabase
      .from("standalone_unlocked_resources")
      .select("status, transaction_id")
      .eq("user_id", userId)
      .eq("resource_type", "tool")
      .eq("resource_id", PHOTO_BOOTH_TOOL_ID)
      .maybeSingle(),
  ]);
  const error = txRes.error || usageRes.error || rowRes.error;
  if (error) throw new Error(`Failed to read Photo Booth pack: ${error.message}`);

  const purchases = txRes.data?.length ?? 0;
  const limit = purchases * PHOTO_BOOTH_PHOTOS_PER_PURCHASE;
  const used = Number(usageRes.data?.usage_count ?? 0);
  return {
    purchases,
    limit,
    used,
    remaining: Math.max(limit - used, 0),
    latestTransactionId: (txRes.data?.[0]?.id as string | undefined) ?? null,
    row: rowRes.data ?? null,
  };
}

/**
 * All photos used: close the unlock so the tool can be bought again. Only the
 * row of the purchase we counted is closed, so a purchase that lands at the same
 * moment (it re-points the row) is never closed by mistake.
 */
async function closeUsedUpPack(supabase: SupabaseClient, userId: string, pack: PackRead) {
  if (!pack.row || pack.row.status !== "active") return;
  if (pack.row.transaction_id !== pack.latestTransactionId) return;
  let query = supabase
    .from("standalone_unlocked_resources")
    .update({ status: "revoked" })
    .eq("user_id", userId)
    .eq("resource_type", "tool")
    .eq("resource_id", PHOTO_BOOTH_TOOL_ID)
    .eq("status", "active");
  query = pack.latestTransactionId
    ? query.eq("transaction_id", pack.latestTransactionId)
    : query.is("transaction_id", null);
  const { error } = await query;
  if (error) console.error("[photo-booth] failed to close a used-up pack:", error);
}

function publicPack(pack: PackRead): PhotoBoothPack {
  return { purchases: pack.purchases, limit: pack.limit, used: pack.used, remaining: pack.remaining };
}

/**
 * Photos left from credit purchases. Closes a used-up pack on the way.
 * Call with the service-role client ONLY after authenticating `userId`.
 */
export async function getPhotoBoothPack(
  supabase: SupabaseClient,
  userId: string
): Promise<PhotoBoothPack> {
  const pack = await readPack(supabase, userId);
  if (pack.remaining <= 0) await closeUsedUpPack(supabase, userId, pack);
  return publicPack(pack);
}

/**
 * Spend one photo from the credit packs (atomic, never past the limit). Returns
 * allowed false when no photo is left. Closes the pack after its last photo.
 * Call with the service-role client ONLY after authenticating `userId`.
 */
export async function spendPhotoBoothPhoto(
  supabase: SupabaseClient,
  userId: string
): Promise<PhotoBoothPack & { allowed: boolean }> {
  const pack = await readPack(supabase, userId);
  if (pack.remaining <= 0) {
    await closeUsedUpPack(supabase, userId, pack);
    return { ...publicPack(pack), allowed: false };
  }

  const { data, error } = await supabase.rpc("increment_feature_usage_atomic", {
    p_user_id: userId,
    p_feature_key: PHOTO_BOOTH_WALLET_USAGE_KEY,
    p_limit: pack.limit,
  });
  if (error || !data) throw new Error(`Failed to use a Photo Booth photo: ${error?.message}`);

  const used = Number(data.used ?? pack.used);
  const after: PackRead = { ...pack, used, remaining: Math.max(pack.limit - used, 0) };
  if (after.remaining <= 0) await closeUsedUpPack(supabase, userId, after);
  return { ...publicPack(after), allowed: data.allowed === true };
}

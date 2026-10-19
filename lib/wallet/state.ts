import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveUnlockedItems, type UnlockRow, type WalletCatalogItem } from "@/lib/wallet/catalog";

export type WalletState = {
  balance: number;
  unlockRows: UnlockRow[];
  purchasedAddons: unknown[];
  unlocked: WalletCatalogItem[];
};

/**
 * Read a user's wallet balance and standalone access. Call with the service-role
 * client ONLY after authenticating `userId` (every query is filtered by it).
 * A user who never topped up has no wallet row yet: balance 0.
 */
export async function loadWalletState(
  supabase: SupabaseClient,
  userId: string
): Promise<WalletState> {
  const [walletRes, unlocksRes, profileRes] = await Promise.all([
    supabase.from("user_wallets").select("balance").eq("user_id", userId).maybeSingle(),
    supabase
      .from("standalone_unlocked_resources")
      .select("resource_type, resource_id, status")
      .eq("user_id", userId),
    supabase.from("user_profiles").select("profile_details").eq("id", userId).maybeSingle(),
  ]);

  const error = walletRes.error || unlocksRes.error || profileRes.error;
  if (error) throw new Error(`Failed to load wallet state: ${error.message}`);

  const unlockRows = (unlocksRes.data ?? []) as UnlockRow[];
  const addons = profileRes.data?.profile_details?.purchased_addons;
  const purchasedAddons = Array.isArray(addons) ? addons : [];

  return {
    balance: Number(walletRes.data?.balance ?? 0),
    unlockRows,
    purchasedAddons,
    unlocked: resolveUnlockedItems(unlockRows, purchasedAddons),
  };
}

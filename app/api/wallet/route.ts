import { NextResponse } from "next/server";
import { getAuthenticatedUser, getServiceRoleClient } from "@/lib/api/authGuards";
import { loadWalletState } from "@/lib/wallet/state";

/**
 * GET /api/wallet
 * The signed-in user's credit balance and the standalone resources they can use
 * without paying (wallet unlocks + permanent legacy add-on purchases).
 */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  try {
    const state = await loadWalletState(getServiceRoleClient(), user.id);
    return NextResponse.json(
      {
        success: true,
        wallet: { balance: state.balance, currency: "credits" },
        unlockedResources: state.unlocked.map((item) => item.resourceId),
        unlocks: state.unlocked.map((item) => ({
          resourceType: item.resourceType,
          resourceId: item.resourceId,
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error("[wallet] GET failed:", err);
    return NextResponse.json({ success: false, error: "Could not load wallet" }, { status: 500 });
  }
}

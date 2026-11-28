import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/api/authGuards";
import { loadWalletState } from "@/lib/wallet/state";
import { requireActiveSessionForRequest } from "@/lib/security/session-guard";

/**
 * GET /api/wallet
 * The signed-in user's credit balance and the standalone resources they can use
 * without paying (wallet unlocks + permanent legacy add-on purchases).
 */
export async function GET(request: NextRequest) {
  const sessionGuard = await requireActiveSessionForRequest(request);
  if (!sessionGuard.ok) return sessionGuard.response;
  const { user } = sessionGuard.context;

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

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getServiceRoleClient } from "@/lib/api/authGuards";
import { launchResource } from "@/lib/wallet/launch";

/**
 * POST /api/wallet/launch-tool
 * Body: { resourceType: "tool" | "guide", resourceId, idempotencyKey? }
 * Unlocks a standalone resource with wallet credits at the server catalog price.
 * 402 = not enough credits (body carries the deficit and the top-up to offer).
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: "INVALID_BODY" }, { status: 400 });
  }

  try {
    // Any client-sent price is ignored: only the resource is read from the body.
    const result = await launchResource(getServiceRoleClient(), user.id, {
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      idempotencyKey: body.idempotencyKey,
    });
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    console.error("[wallet] launch-tool failed:", err);
    return NextResponse.json({ success: false, error: "LAUNCH_FAILED" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getServiceRoleClient } from "@/lib/api/authGuards";
import { deductServiceBooking } from "@/lib/wallet/serviceBooking";

/**
 * POST /api/wallet/deduct-service
 * Body: { serviceId: string, referenceId?: string, idempotencyKey?: string, description?: string, metadata?: Record<string, unknown> }
 *
 * Deducts wallet credits for a standalone service booking.
 * 402 = not enough credits (returns deficit and required top-up amount).
 * Prices are strictly server-authoritative from the wallet catalog.
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
    const result = await deductServiceBooking(getServiceRoleClient(), user.id, {
      serviceId: body.serviceId,
      referenceId: body.referenceId,
      idempotencyKey: body.idempotencyKey,
      description: body.description,
      metadata:
        typeof body.metadata === "object" && body.metadata !== null && !Array.isArray(body.metadata)
          ? (body.metadata as Record<string, unknown>)
          : undefined,
    });
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    console.error("[wallet] deduct-service failed:", err);
    return NextResponse.json({ success: false, error: "DEDUCT_SERVICE_FAILED" }, { status: 500 });
  }
}

// app/api/case/roles/route.ts
// POST — EITHER spouse makes the ONE-TIME case-role choice. The caller declares
// THEIR OWN role; the other active member automatically gets the opposite. Roles
// CANNOT be swapped afterward: public.assign_case_roles() rejects a second
// assignment (returns a clear error the UI surfaces).
// Spec: docs/partner-collaboration-spec.md §7.1.

import { NextRequest, NextResponse } from "next/server";
import { verifyJourneyAccess, errorResponse, successResponse } from "@/lib/api/journey-auth";
import { logCaseActivity } from "@/lib/case-collaboration/activity";

const VALID_ROLES = ["petitioner", "beneficiary"] as const;
type CaseRole = (typeof VALID_ROLES)[number];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const journeyId = body?.journeyId as string | undefined;
    const role = body?.role as string | undefined;

    if (!journeyId) {
      return NextResponse.json(errorResponse("VALIDATION", "journeyId is required"), {
        status: 400,
      });
    }
    if (!role || !VALID_ROLES.includes(role as CaseRole)) {
      return NextResponse.json(
        errorResponse("VALIDATION", "role must be 'petitioner' or 'beneficiary'"),
        { status: 400 }
      );
    }

    // Any active MEMBER can assign (not owner-only) — confirmed product decision.
    const access = await verifyJourneyAccess(journeyId);
    if (access.error) return access.error;

    // Atomic assignment via the DB function. It re-verifies membership using
    // auth.uid() and requires both spouses present, so we pass the caller's own
    // authenticated client (NOT the admin client) to carry the JWT.
    const { error: rpcError } = await access.supabase.rpc("assign_case_roles", {
      p_journey_id: journeyId,
      p_caller_role: role,
    });

    if (rpcError) {
      // The function raises clear messages (not a member / both spouses required /
      // invalid role). Surface a 400 with the message; the UI shows it as-is.
      console.error("[case/roles] assign error:", rpcError);
      return NextResponse.json(
        errorResponse("ROLE_ASSIGN_FAILED", rpcError.message || "Could not assign roles"),
        { status: 400 }
      );
    }

    // Audit log (best-effort). actor_role is snapshotted AFTER the swap, so it
    // reflects the role the caller just chose for themselves.
    await logCaseActivity({
      journeyId,
      actorUserId: access.user.id,
      action: "role.assign",
      targetLabel: `Set themselves as ${role}`,
      metadata: { chosen_role: role },
    });

    return NextResponse.json(
      successResponse({ assigned: true, yourRole: role }, "Roles updated")
    );
  } catch (error) {
    console.error("[case/roles] POST error:", error);
    return NextResponse.json(errorResponse("INTERNAL", "Unexpected error"), { status: 500 });
  }
}

// app/api/case/collaborators/route.ts
// GET    — list members of a case (any member can view) + any pending invite.
// DELETE — owner removes the partner (status='removed') and revokes pending invites.
// Spec: docs/partner-collaboration-spec.md §8.

import { NextRequest, NextResponse } from "next/server";
import { verifyJourneyAccess, errorResponse, successResponse } from "@/lib/api/journey-auth";
import { getAdminClient } from "@/lib/case-collaboration/helpers";

type CollabRow = {
  user_id: string;
  membership_role: string;
  case_role: string | null;
  status: string;
  invited_email: string | null;
};

// ─────────────────────────────────────────────────────────────
// GET ?journeyId=...
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const journeyId = req.nextUrl.searchParams.get("journeyId") || "";
    if (!journeyId) {
      return NextResponse.json(errorResponse("VALIDATION", "journeyId is required"), {
        status: 400,
      });
    }

    const access = await verifyJourneyAccess(journeyId);
    if (access.error) return access.error;
    const { user } = access;

    const admin = getAdminClient();

    // Self-heal: journeys created AFTER the collaboration migration have no owner
    // collaborator row (only legacy journeys were backfilled). Ensure one exists
    // so the members list + role gate work. Insert-if-missing — never clobbers an
    // existing row. case_role stays NULL: roles are decided LATER, by either
    // spouse, only once both are in the case.
    if (access.isOwner) {
      await admin.from("case_collaborators").upsert(
        {
          journey_id: journeyId,
          user_id: access.journey.user_id,
          membership_role: "owner",
          case_role: null,
          status: "active",
        },
        { onConflict: "journey_id,user_id", ignoreDuplicates: true }
      );
    }

    const { data: rows } = await admin
      .from("case_collaborators")
      .select("user_id, membership_role, case_role, status, invited_email")
      .eq("journey_id", journeyId)
      .eq("status", "active");

    // Enrich each row with the member's email (small list — at most two members).
    const collaborators = await Promise.all(
      ((rows as CollabRow[]) || []).map(async (r) => {
        let email = r.invited_email;
        if (!email) {
          const { data } = await admin.auth.admin.getUserById(r.user_id);
          email = data?.user?.email ?? null;
        }
        return {
          userId: r.user_id,
          membershipRole: r.membership_role,
          caseRole: r.case_role,
          email,
          isYou: r.user_id === user.id,
        };
      })
    );

    const { data: pendingInvite } = await admin
      .from("case_invites")
      .select("invited_email, expires_at")
      .eq("journey_id", journeyId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    return NextResponse.json(
      successResponse({
        collaborators,
        isOwner: access.isOwner,
        pendingInvite: pendingInvite ?? null,
      })
    );
  } catch (error) {
    console.error("[case/collaborators] GET error:", error);
    return NextResponse.json(errorResponse("INTERNAL", "Unexpected error"), { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE — owner removes the partner / revokes the pending invite
// Body: { journeyId, userId? }  (userId optional — defaults to the partner)
// ─────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const journeyId = body?.journeyId as string | undefined;
    if (!journeyId) {
      return NextResponse.json(errorResponse("VALIDATION", "journeyId is required"), {
        status: 400,
      });
    }

    const access = await verifyJourneyAccess(journeyId);
    if (access.error) return access.error;
    if (!access.isOwner) {
      return NextResponse.json(
        errorResponse("FORBIDDEN", "Only the case owner can remove a partner"),
        { status: 403 }
      );
    }

    const admin = getAdminClient();
    const targetUserId = body?.userId as string | undefined;

    // Remove the partner (never the owner). If a userId is given, ensure it's a
    // partner row; otherwise remove the single active partner.
    let query = admin
      .from("case_collaborators")
      .update({ status: "removed" })
      .eq("journey_id", journeyId)
      .eq("membership_role", "partner")
      .eq("status", "active");
    if (targetUserId) query = query.eq("user_id", targetUserId);

    const { error: removeError } = await query;
    if (removeError) {
      console.error("[case/collaborators] remove error:", removeError);
      return NextResponse.json(errorResponse("INTERNAL", "Could not remove partner"), {
        status: 500,
      });
    }

    // Revoke any outstanding invites for this case.
    await admin
      .from("case_invites")
      .update({ status: "revoked" })
      .eq("journey_id", journeyId)
      .eq("status", "pending");

    return NextResponse.json(successResponse({ removed: true }, "Partner removed"));
  } catch (error) {
    console.error("[case/collaborators] DELETE error:", error);
    return NextResponse.json(errorResponse("INTERNAL", "Unexpected error"), { status: 500 });
  }
}

// app/api/case/invite/accept/route.ts
// GET  — validate a token and tell the accept page what state to show
//        (valid? expired? already used? is the visitor logged in?).
// POST — accept the invite. The INVITE LINK itself is the secret: any logged-in
//        account may accept (no email lock). Guards: the token must be valid +
//        single-use, the case owner cannot accept their own invite, and a case
//        can hold at most one partner.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAuth, errorResponse, successResponse } from "@/lib/api/journey-auth";
import { getAdminClient, hashToken } from "@/lib/case-collaboration/helpers";

type InviteRow = {
  id: string;
  journey_id: string;
  invited_email: string;
  status: string;
  expires_at: string;
};

async function lookupInvite(token: string): Promise<InviteRow | null> {
  if (!token) return null;
  const admin = getAdminClient();
  const { data } = await admin
    .from("case_invites")
    .select("id, journey_id, invited_email, status, expires_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  return (data as InviteRow) ?? null;
}

function inviteUsable(invite: InviteRow | null): { ok: boolean; reason?: string } {
  if (!invite) return { ok: false, reason: "not_found" };
  if (invite.status !== "pending") return { ok: false, reason: "already_used" };
  if (new Date(invite.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" };
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────
// GET — pre-check (works whether or not the visitor is logged in)
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token") || "";
    const invite = await lookupInvite(token);
    const usable = inviteUsable(invite);

    if (!usable.ok) {
      return NextResponse.json(successResponse({ valid: false, reason: usable.reason }));
    }

    // May be null if the visitor hasn't logged in yet. The invite is acceptable
    // by ANY account — we only need to know whether they're signed in.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return NextResponse.json(
      successResponse({
        valid: true,
        isAuthenticated: !!user,
      })
    );
  } catch (error) {
    console.error("[case/invite/accept] GET error:", error);
    return NextResponse.json(errorResponse("INTERNAL", "Unexpected error"), { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// POST — accept
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const token = (body?.token as string) || "";

    // Must be logged in to accept (any email — the link is the secret).
    const auth = await verifyAuth();
    if (auth.error) return auth.error;
    const { user } = auth;

    const invite = await lookupInvite(token);
    const usable = inviteUsable(invite);
    if (!usable.ok) {
      return NextResponse.json(errorResponse("INVALID_INVITE", `Invite ${usable.reason}`), {
        status: 410,
      });
    }

    const admin = getAdminClient();

    // Guard 1: the case owner cannot accept their own invite (would demote the
    // owner row via the upsert). They're already a full member.
    const { data: journey } = await admin
      .from("journeys")
      .select("user_id")
      .eq("id", invite!.journey_id)
      .single();

    if (journey?.user_id === user.id) {
      return NextResponse.json(
        errorResponse("ALREADY_OWNER", "You're already the owner of this case"),
        { status: 400 }
      );
    }

    // Guard 2: at most one partner per case. If an active partner already exists
    // (and it isn't this same user re-accepting), block.
    const { data: existingPartner } = await admin
      .from("case_collaborators")
      .select("user_id")
      .eq("journey_id", invite!.journey_id)
      .eq("membership_role", "partner")
      .eq("status", "active")
      .maybeSingle();

    if (existingPartner && existingPartner.user_id !== user.id) {
      return NextResponse.json(
        errorResponse("PARTNER_EXISTS", "This case already has a partner"),
        { status: 409 }
      );
    }

    // Add the partner row (idempotent — re-accept is a no-op). `invited_email`
    // records the address the link was sent to (for display), not a gate.
    const { error: collabError } = await admin.from("case_collaborators").upsert(
      {
        journey_id: invite!.journey_id,
        user_id: user.id,
        membership_role: "partner",
        status: "active",
        invited_email: invite!.invited_email,
      },
      { onConflict: "journey_id,user_id" }
    );

    if (collabError) {
      console.error("[case/invite/accept] collaborator upsert error:", collabError);
      return NextResponse.json(errorResponse("INTERNAL", "Could not join the case"), {
        status: 500,
      });
    }

    // Mark the invite accepted (single-use — this consumes the token).
    await admin
      .from("case_invites")
      .update({
        status: "accepted",
        accepted_by: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite!.id);

    return NextResponse.json(
      successResponse({ journeyId: invite!.journey_id }, "You've joined the shared case")
    );
  } catch (error) {
    console.error("[case/invite/accept] POST error:", error);
    return NextResponse.json(errorResponse("INTERNAL", "Unexpected error"), { status: 500 });
  }
}

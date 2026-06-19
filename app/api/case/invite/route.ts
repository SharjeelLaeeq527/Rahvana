// app/api/case/invite/route.ts
// POST — the case OWNER invites their spouse by email.
// Enforces: owner-only, active paid plan, max ONE partner, single pending invite.
// The email is only the DELIVERY address for the secure link — acceptance is NOT
// email-locked; whoever opens the valid single-use token link may accept with any
// account (the link is the secret). Hash stored, raw token emailed.
// Spec: docs/partner-collaboration-spec.md §8 / §10.

import { NextRequest, NextResponse } from "next/server";
import { verifyJourneyAccess, errorResponse, successResponse } from "@/lib/api/journey-auth";
import {
  getAdminClient,
  generateInviteToken,
  hashToken,
  isPaidTier,
  normalizeEmail,
  INVITE_EXPIRY_DAYS,
} from "@/lib/case-collaboration/helpers";
import { sendEmail, getSpouseInviteEmailHtml } from "@/lib/email/resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const journeyId = body?.journeyId as string | undefined;
    const rawEmail = body?.email as string | undefined;

    if (!journeyId || !rawEmail) {
      return NextResponse.json(
        errorResponse("VALIDATION", "journeyId and email are required"),
        { status: 400 }
      );
    }

    // Auth + must be the OWNER of this journey.
    const access = await verifyJourneyAccess(journeyId);
    if (access.error) return access.error;
    const { user } = access;
    if (!access.isOwner) {
      return NextResponse.json(
        errorResponse("FORBIDDEN", "Only the case owner can invite a spouse"),
        { status: 403 }
      );
    }

    const invitedEmail = normalizeEmail(rawEmail);
    if (!EMAIL_RE.test(invitedEmail)) {
      return NextResponse.json(errorResponse("VALIDATION", "Invalid email address"), {
        status: 400,
      });
    }
    if (invitedEmail === normalizeEmail(user.email)) {
      return NextResponse.json(
        errorResponse("VALIDATION", "You cannot invite your own account"),
        { status: 400 }
      );
    }

    const admin = getAdminClient();

    // Owner must be on an active paid plan.
    const { data: ownerProfile } = await admin
      .from("user_profiles")
      .select("subscription_tier, profile_details")
      .eq("id", user.id)
      .single();

    if (!isPaidTier(ownerProfile?.subscription_tier)) {
      return NextResponse.json(
        errorResponse("UPGRADE_REQUIRED", "Upgrade to a paid plan to invite your spouse"),
        { status: 403 }
      );
    }

    // Max ONE active partner per case.
    const { count: partnerCount } = await admin
      .from("case_collaborators")
      .select("id", { count: "exact", head: true })
      .eq("journey_id", journeyId)
      .eq("membership_role", "partner")
      .eq("status", "active");

    if ((partnerCount ?? 0) > 0) {
      return NextResponse.json(
        errorResponse("PARTNER_EXISTS", "This case already has a partner"),
        { status: 409 }
      );
    }

    // Only one outstanding invite at a time.
    const { data: pending } = await admin
      .from("case_invites")
      .select("id, expires_at")
      .eq("journey_id", journeyId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (pending) {
      return NextResponse.json(
        errorResponse(
          "INVITE_PENDING",
          "An invite is already pending. Revoke it before sending another."
        ),
        { status: 409 }
      );
    }

    // Create the invite — store only the token HASH.
    const rawToken = generateInviteToken();
    const expiresAt = new Date(
      Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error: insertError } = await admin.from("case_invites").insert({
      journey_id: journeyId,
      invited_by: user.id,
      invited_email: invitedEmail,
      token_hash: hashToken(rawToken),
      status: "pending",
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error("[case/invite] insert error:", insertError);
      return NextResponse.json(errorResponse("INTERNAL", "Could not create invite"), {
        status: 500,
      });
    }

    // Build the link from the ORIGIN of THIS request, so it matches wherever the
    // owner is working: localhost in dev, the real domain in production. Falls
    // back to the configured app URL if the header is missing.
    const appUrl =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    const inviteLink = `${appUrl}/invite/accept?token=${rawToken}`;
    const profile = ownerProfile?.profile_details as Record<string, unknown> | null;
    const inviterName =
      (profile?.full_name as string) ||
      (profile?.first_name as string) ||
      (user.email ? user.email.split("@")[0] : "") ||
      "Your spouse";

    const emailResult = await sendEmail({
      to: invitedEmail,
      subject: "You're invited to a shared visa case on Rahvana",
      html: getSpouseInviteEmailHtml(inviteLink, inviterName),
    });

    if (!emailResult.success) {
      console.error("[case/invite] email send failed:", emailResult.error);
    }

    // The invite row exists regardless of email delivery. Return the link so the
    // owner can share it manually if the email didn't go through (e.g. Resend
    // sandbox / unverified-domain limits during testing). Safe: it's the owner's
    // own single-use invite.
    return NextResponse.json(
      successResponse(
        {
          invitedEmail,
          inviteLink,
          emailSent: emailResult.success,
          emailError: emailResult.success ? undefined : emailResult.error,
        },
        emailResult.success ? "Invite sent" : "Invite created (email not sent)"
      )
    );
  } catch (error) {
    console.error("[case/invite] unexpected error:", error);
    return NextResponse.json(errorResponse("INTERNAL", "Unexpected error"), { status: 500 });
  }
}

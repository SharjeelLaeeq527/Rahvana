// app/api/case/activity/route.ts
// GET ?journeyId=&limit= — the shared case's activity feed (audit log), readable
// by EITHER spouse, view-only. Returns entries latest-first, each enriched with
// the actor's email so the UI can show "who". Membership is verified
// (verifyJourneyAccess); rows are read with the service role afterward.
// Spec: docs/partner-collaboration-spec.md §13b.

import { NextRequest, NextResponse } from "next/server";
import { verifyJourneyAccess, errorResponse, successResponse } from "@/lib/api/journey-auth";
import { getAdminClient } from "@/lib/case-collaboration/helpers";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 300;

interface ActivityRow {
  id: string;
  actor_user_id: string | null;
  actor_role: string | null;
  action: string;
  target_label: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export async function GET(req: NextRequest) {
  try {
    const journeyId = req.nextUrl.searchParams.get("journeyId") || "";
    if (!journeyId) {
      return NextResponse.json(errorResponse("VALIDATION", "journeyId is required"), {
        status: 400,
      });
    }

    const rawLimit = parseInt(req.nextUrl.searchParams.get("limit") || "", 10);
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT;

    const access = await verifyJourneyAccess(journeyId);
    if (access.error) return access.error;
    const { user } = access;

    const admin = getAdminClient();

    const [activityRes, collabRes] = await Promise.all([
      admin
        .from("case_activity")
        .select("id, actor_user_id, actor_role, action, target_label, metadata, created_at")
        .eq("journey_id", journeyId)
        .order("created_at", { ascending: false })
        .limit(limit),
      admin
        .from("case_collaborators")
        .select("user_id, membership_role, case_role")
        .eq("journey_id", journeyId)
        .eq("status", "active"),
    ]);

    const rows = (activityRes.data as ActivityRow[]) || [];

    // Resolve actor emails. Look them up once per unique user id (at most a
    // couple of people per case).
    const actorIds = Array.from(
      new Set(rows.map((r) => r.actor_user_id).filter((id): id is string => !!id))
    );
    const emailById = new Map<string, string | null>();
    await Promise.all(
      actorIds.map(async (id) => {
        const { data } = await admin.auth.admin.getUserById(id);
        emailById.set(id, data?.user?.email ?? null);
      })
    );

    const activity = rows.map((r) => ({
      id: r.id,
      action: r.action,
      actorRole: r.actor_role,
      targetLabel: r.target_label,
      metadata: r.metadata ?? {},
      createdAt: r.created_at,
      actorUserId: r.actor_user_id,
      actorEmail: r.actor_user_id ? emailById.get(r.actor_user_id) ?? null : null,
      isYou: r.actor_user_id === user.id,
    }));

    const members = ((collabRes.data as Array<Record<string, unknown>>) || []).map((c) => ({
      userId: c.user_id as string,
      membershipRole: c.membership_role as string,
      caseRole: (c.case_role as string) ?? null,
      isYou: (c.user_id as string) === user.id,
    }));

    return NextResponse.json(successResponse({ activity, members }));
  } catch (error) {
    console.error("[case/activity] GET error:", error);
    return NextResponse.json(errorResponse("INTERNAL", "Unexpected error"), { status: 500 });
  }
}

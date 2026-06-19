// app/api/case/interview/debug/route.ts
// TEMPORARY diagnostic for spouse interview-prep sharing. Open this URL while
// logged in as the spouse who can't see the prep. Returns what /api/case/interview
// resolves + the raw interview sessions across the whole case, so we can see
// exactly why nothing shows. Safe to delete once the issue is fixed.

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api/journey-auth";
import { getAdminClient, resolveActiveJourneyId, getCaseRole } from "@/lib/case-collaboration/helpers";

export async function GET(_req: NextRequest) {
  try {
    const auth = await verifyAuth();
    if (auth.error) return auth.error;
    const { user, supabase } = auth;

    const admin = getAdminClient();

    // What this user owns / collaborates on.
    const [ownJourneys, collabRows] = await Promise.all([
      admin.from("journeys").select("id, user_id, journey_type, status, updated_at").eq("user_id", user.id),
      admin
        .from("case_collaborators")
        .select("journey_id, user_id, membership_role, case_role, status")
        .eq("user_id", user.id),
    ]);

    const journeyId = await resolveActiveJourneyId(supabase, user.id);

    let journeyOwnerId: string | null = null;
    let allMembers: any[] = [];
    let journeySessions: any[] = [];
    let memberSessions: any[] = [];
    let caseRole: string | null = null;

    if (journeyId) {
      caseRole = await getCaseRole(admin, journeyId, user.id);

      const [jr, members] = await Promise.all([
        admin.from("journeys").select("user_id").eq("id", journeyId).maybeSingle(),
        admin
          .from("case_collaborators")
          .select("user_id, membership_role, case_role, status")
          .eq("journey_id", journeyId),
      ]);
      journeyOwnerId = (jr.data as { user_id: string } | null)?.user_id ?? null;
      allMembers = (members.data as any[]) || [];

      // Sessions linked to this journey (any source).
      const js = await admin
        .from("interview_prep_sessions")
        .select("id, user_id, source, journey_id, status, completed, category_slug, updated_at")
        .eq("journey_id", journeyId);
      journeySessions = (js.data as any[]) || [];

      // ALL interview sessions owned by ANY member of this case (catches tool
      // sessions with journey_id = null).
      const memberIds = Array.from(
        new Set([...(allMembers.map((m) => m.user_id) as string[]), journeyOwnerId].filter(Boolean))
      ) as string[];
      if (memberIds.length) {
        const ms = await admin
          .from("interview_prep_sessions")
          .select("id, user_id, source, journey_id, status, completed, category_slug, updated_at")
          .in("user_id", memberIds);
        memberSessions = (ms.data as any[]) || [];
      }
    }

    // For each session found, how much data does it carry?
    const enrich = async (sessions: any[]) => {
      const out: any[] = [];
      for (const s of sessions) {
        const [res, ua, qa] = await Promise.all([
          admin.from("interview_prep_results").select("session_id", { count: "exact", head: true }).eq("session_id", s.id),
          admin.from("interview_user_answers").select("session_id", { count: "exact", head: true }).eq("session_id", s.id),
          admin.from("interview_prep_answers").select("session_id", { count: "exact", head: true }).eq("session_id", s.id),
        ]);
        out.push({
          ...s,
          isMine: s.user_id === user.id,
          resultsRows: res.count ?? 0,
          userAnswerRows: ua.count ?? 0,
          questionnaireAnswerRows: qa.count ?? 0,
        });
      }
      return out;
    };

    return NextResponse.json({
      me: { userId: user.id, email: user.email },
      resolvedJourneyId: journeyId,
      iOwnThisJourney: journeyOwnerId === user.id,
      journeyOwnerId,
      myCaseRole: caseRole,
      ownJourneys: ownJourneys.data ?? [],
      myCollaboratorRows: collabRows.data ?? [],
      caseMembers: allMembers,
      sessionsLinkedToJourney: await enrich(journeySessions),
      allSessionsOwnedByAnyMember: await enrich(memberSessions),
    });
  } catch (error) {
    console.error("[case/interview/debug] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "unknown" },
      { status: 500 }
    );
  }
}

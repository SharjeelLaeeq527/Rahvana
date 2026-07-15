import { NextRequest, NextResponse } from "next/server";
import { E, msg } from "@/lib/errors";
import { getAuthenticatedUser, getServiceRoleClient } from "@/lib/api/authGuards";

export async function GET(request: NextRequest) {
  // Debug endpoint — never expose in production.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const journeyId = searchParams.get("journeyId");

  if (!journeyId) {
    return NextResponse.json(
      { error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: "[journeyId]" }) },
      { status: 400 }
    );
  }

  // AUTH: caller must be logged in
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const supabase = getServiceRoleClient();

  // AUTHZ: caller must own this journey before we return its data
  const { data: ownerRow, error: ownerError } = await supabase
    .from("journeys")
    .select("user_id")
    .eq("id", journeyId)
    .maybeSingle();

  if (ownerError || !ownerRow) {
    return NextResponse.json({ error: "Journey not found" }, { status: 404 });
  }
  if (ownerRow.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [scheduledRes, remindersRes, journeysRes, caseDataRes] = await Promise.all([
    supabase
      .from("ceac_scheduled_notifications")
      .select("*")
      .eq("journey_id", journeyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("journey_reminders")
      .select("*")
      .eq("journey_id", journeyId)
      .order("created_at", { ascending: false }),
    supabase.from("journeys").select("metadata").eq("id", journeyId).single(),
    supabase.from("case_data").select("*").eq("journey_id", journeyId),
  ]);

  return NextResponse.json({
    journey_reminders: remindersRes.data,
    ceac_scheduled_notifications: scheduledRes.data,
    journeys: journeysRes.data,
    case_data: caseDataRes.data,
  });
}

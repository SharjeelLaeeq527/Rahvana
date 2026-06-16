import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { E, msg } from "@/lib/errors";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const journeyId = searchParams.get("journeyId");

  if (!journeyId) {
    return NextResponse.json(
      { error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: "[journeyId]" }) },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

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

// app/api/guides/save/route.ts

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { E, msg } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const { slug, candidateId = "candidate-1" } = await request.json();

    if (!slug) {
      return NextResponse.json(
        { error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: "[slug]" }) },
        { status: 400 }
      );
    }

    // 2. Get guide ID
    const { data: guide, error: guideError } = await supabase
      .from("guides")
      .select("id")
      .eq("slug", slug)
      .single();

    if (guideError || !guide) {
      return NextResponse.json({ error: msg(E.CASE_DATA_NOT_FOUND) }, { status: 404 });
    }

    // 3. Get user session for this candidate
    let sessionQuery = supabase
      .from("user_guides")
      .select("id, saved")
      .eq("guide_id", guide.id)
      .eq("user_id", user.id);

    if (candidateId === "candidate-1") {
      sessionQuery = sessionQuery.or(`candidate_id.eq.candidate-1,candidate_id.is.null`);
    } else {
      sessionQuery = sessionQuery.eq("candidate_id", candidateId);
    }

    const { data: session, error: sessionError } = await sessionQuery.maybeSingle();

    if (sessionError) {
      console.error("Error checking session:", sessionError);
      return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
    }

    if (!session) {
      // Create the guide session dynamically if it does not exist
      const { error: insertError } = await supabase.from("user_guides").insert({
        user_id: user.id,
        guide_id: guide.id,
        candidate_id: candidateId,
        saved: true,
        status: "not_started",
      });

      if (insertError) {
        console.error("Error creating guide session:", insertError);
        return NextResponse.json({ error: msg(E.CASE_DATA_SAVE_FAILED) }, { status: 500 });
      }
    } else {
      // 4. Update existing session to saved = true
      const { error: updateError } = await supabase
        .from("user_guides")
        .update({
          saved: true,
          candidate_id: candidateId,
          last_updated_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      if (updateError) {
        console.error("Error saving guide:", updateError);
        return NextResponse.json({ error: msg(E.CASE_DATA_SAVE_FAILED) }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: "Guide saved successfully",
    });
  } catch (error) {
    console.error("Unexpected error in /api/guides/save:", error);
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}

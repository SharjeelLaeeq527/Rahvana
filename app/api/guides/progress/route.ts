import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { E, msg } from '@/lib/errors';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const candidateId = searchParams.get("candidateId") || "candidate-1";

    if (!slug) {
      return NextResponse.json({ error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: '[slug]' }) }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    // 1. Get the session for this guide and candidate
    let session = null;
    let query = supabase
      .from("user_guides")
      .select(
        `
        *,
        guides!inner(slug, title, description)
      `
      )
      .eq("user_id", user.id)
      .eq("guides.slug", slug);

    if (candidateId === "candidate-1") {
      query = query.or(`candidate_id.eq.candidate-1,candidate_id.is.null`);
    } else {
      query = query.eq("candidate_id", candidateId);
    }

    const { data: sessionData, error: sessionError } = await query.maybeSingle();

    if (!sessionError && sessionData) {
      session = sessionData;
    } else if (sessionError) {
      // Fallback query without candidate_id column filter
      const fallback = await supabase
        .from("user_guides")
        .select(
          `
          *,
          guides!inner(slug, title, description)
        `
        )
        .eq("user_id", user.id)
        .eq("guides.slug", slug)
        .maybeSingle();

      if (!fallback.error && fallback.data) {
        if (candidateId === "candidate-1" || fallback.data.candidate_id === candidateId) {
          session = fallback.data;
        }
      }
    }

    if (!session) {
      return NextResponse.json({ session: null, steps: [] });
    }

    // 2. Get all steps for this session
    const { data: steps, error: stepsError } = await supabase
      .from("user_guide_steps")
      .select("*")
      .eq("user_guide_id", session.id);

    if (stepsError) {
      console.error("Error fetching steps:", stepsError);
      return NextResponse.json({ error: "Failed to fetch steps" }, { status: 500 });
    }

    return NextResponse.json({
      session,
      steps: steps || [],
    });
  } catch (error) {
    console.error("Unexpected error in /api/guides/progress:", error);
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}

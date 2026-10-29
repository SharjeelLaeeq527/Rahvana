import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { E, msg } from '@/lib/errors';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const { slug, candidateId = "candidate-1" } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: '[slug]' }) }, { status: 400 });
    }

    // 1. Get the guide ID from the registry
    const { data: guide, error: guideError } = await supabase
      .from("guides")
      .select("id, slug, title, description")
      .eq("slug", slug)
      .single();

    if (guideError || !guide) {
      return NextResponse.json({ error: msg(E.CASE_DATA_NOT_FOUND) }, { status: 404 });
    }

    // 2. Check if a session already exists for this user, guide, and candidate
    let existingSession = null;
    try {
      let sessionQuery = supabase
        .from("user_guides")
        .select("*")
        .eq("user_id", user.id)
        .eq("guide_id", guide.id);

      if (candidateId === "candidate-1") {
        sessionQuery = sessionQuery.or(`candidate_id.eq.candidate-1,candidate_id.is.null`);
      } else {
        sessionQuery = sessionQuery.eq("candidate_id", candidateId);
      }

      const res = await sessionQuery.maybeSingle();
      if (!res.error) {
        existingSession = res.data;
      }
    } catch {
      // Ignore schema column errors
    }

    let session = existingSession;

    if (!session) {
      // Try insert with candidate_id
      const insertAttempt = await supabase
        .from("user_guides")
        .insert({
          user_id: user.id,
          guide_id: guide.id,
          candidate_id: candidateId,
          status: "in_progress",
          saved: false,
          last_updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertAttempt.error) {
        // Fallback insert without candidate_id if column missing or constraint error
        const fallbackInsert = await supabase
          .from("user_guides")
          .upsert(
            {
              user_id: user.id,
              guide_id: guide.id,
              status: "in_progress",
              saved: false,
              last_updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,guide_id" }
          )
          .select()
          .single();

        session = fallbackInsert.data || {
          id: `${user.id}_${guide.id}_${candidateId}`,
          user_id: user.id,
          guide_id: guide.id,
          candidate_id: candidateId,
          status: "in_progress",
          saved: false,
          progress_percent: 0,
        };
      } else {
        session = insertAttempt.data;
      }
    } else {
      // Update existing session
      const updateAttempt = await supabase
        .from("user_guides")
        .update({
          last_updated_at: new Date().toISOString(),
          candidate_id: candidateId,
        })
        .eq("id", session.id)
        .select()
        .single();

      if (!updateAttempt.error && updateAttempt.data) {
        session = updateAttempt.data;
      }
    }

    const sessionWithGuide = session
      ? {
          ...session,
          guides: {
            slug: guide.slug,
            title: guide.title,
            description: guide.description || "",
          },
        }
      : session;

    return NextResponse.json({
      message: "Session started",
      session: sessionWithGuide,
    });
  } catch (error) {
    console.error("Unexpected error in /api/guides/start:", error);
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}

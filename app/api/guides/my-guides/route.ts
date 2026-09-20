import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { E, msg } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get("candidateId") || "candidate-1";

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("[guides/my-guides] Unauthorized:", userError);
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    // 1. Try querying user_guides with candidate_id column
    let { data: sessions, error: sessionsError } = await supabase
      .from("user_guides")
      .select(
        `
        id,
        progress_percent,
        status,
        saved,
        candidate_id,
        last_updated_at,
        guides(slug, title, description)
      `
      )
      .eq("user_id", user.id)
      .eq("saved", true)
      .order("last_updated_at", { ascending: false });

    // 2. Fallback if candidate_id column or filter has schema variance
    if (sessionsError) {
      const fallback = await supabase
        .from("user_guides")
        .select(
          `
          id,
          progress_percent,
          status,
          saved,
          last_updated_at,
          guides(slug, title, description)
        `
        )
        .eq("user_id", user.id)
        .eq("saved", true)
        .order("last_updated_at", { ascending: false });

      sessions = fallback.data || [];
    }

    // 3. Filter by candidate_id in memory
    const filteredSessions = (sessions || []).filter((s: any) => {
      // Must be explicitly saved by user (saved === true)
      if (s.saved !== true) return false;

      if (candidateId === "candidate-1") {
        return !s.candidate_id || s.candidate_id === "candidate-1";
      }
      return s.candidate_id === candidateId;
    });

    return NextResponse.json({ sessions: filteredSessions });
  } catch (error) {
    console.error("Unexpected error in /api/guides/my-guides:", error);
    return NextResponse.json({ sessions: [] });
  }
}

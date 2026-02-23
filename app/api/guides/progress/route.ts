import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Guide slug is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get the session for this guide
    const { data: session, error: sessionError } = await supabase
      .from("user_guides")
      .select(`
        *,
        guides!inner(slug, title)
      `)
      .eq("user_id", user.id)
      .eq("guides.slug", slug)
      .maybeSingle();

    if (sessionError) {
      console.error("Error fetching session:", sessionError);
      return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

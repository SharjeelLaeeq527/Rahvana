import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "Guide slug is required" }, { status: 400 });
    }

    // 1. Get the guide ID from the registry
    const { data: guide, error: guideError } = await supabase
      .from("guides")
      .select("id")
      .eq("slug", slug)
      .single();

    if (guideError || !guide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }

    // 2. Initialize or fetch existing session
    const { data: session, error: sessionError } = await supabase
      .from("user_guides")
      .upsert({
        user_id: user.id,
        guide_id: guide.id,
        status: "in_progress",
        last_updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,guide_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Error starting guide session:", sessionError);
      return NextResponse.json({ error: "Failed to initialize session" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Session started",
      session,
    });
  } catch (error) {
    console.error("Unexpected error in /api/guides/start:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

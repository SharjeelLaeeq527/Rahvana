import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get guide slug from body
    const body = await request.json();
    const slug = body.slug;

    if (!slug) {
      return NextResponse.json(
        { error: "Guide slug is required" },
        { status: 400 },
      );
    }

    // Fetch the user_guide session for this guide slug
    const { data: session, error: sessionError } = await supabase
      .from("user_guides")
      .select(
        `
        *,
        guides!inner(slug, title)
      `,
      )
      .eq("user_id", user.id)
      .eq("guides.slug", slug)
      .maybeSingle();

    if (sessionError) {
      console.error("Error fetching session:", sessionError);
      return NextResponse.json(
        { error: "Failed to fetch user guide session" },
        { status: 500 },
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: "User guide session not found" },
        { status: 404 },
      );
    }

    // Update hide_intro_modal to true
    const { data: updated, error: updateError } = await supabase
      .from("user_guides")
      .update({ hide_intro_modal: true })
      .eq("id", session.id)
      .select("*")
      .maybeSingle();

    if (updateError) {
      console.error("Error updating hide_intro_modal:", updateError);
      return NextResponse.json(
        { error: "Failed to update hide_intro_modal" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Intro modal hidden successfully",
      session: updated,
    });
  } catch (error) {
    console.error("Unexpected error in /api/guides/hide-intro:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// app/api/guides/save/route.ts

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json(
        { error: "Guide slug is required" },
        { status: 400 },
      );
    }

    // 2. Get guide ID
    const { data: guide, error: guideError } = await supabase
      .from("guides")
      .select("id")
      .eq("slug", slug)
      .single();

    if (guideError || !guide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }

    // 3. Get user session
    const { data: session, error: sessionError } = await supabase
      .from("user_guides")
      .select("id, saved")
      .eq("guide_id", guide.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (sessionError) {
      console.error("Error checking session:", sessionError);
      return NextResponse.json(
        { error: "Failed to check session" },
        { status: 500 },
      );
    }

    if (!session) {
      // Create the guide session dynamically if it does not exist
      const { error: insertError } = await supabase
        .from("user_guides")
        .insert({
          user_id: user.id,
          guide_id: guide.id,
          saved: true,
          status: "not_started"
        });

      if (insertError) {
        console.error("Error creating guide session:", insertError);
        return NextResponse.json(
          { error: "Failed to save guide" },
          { status: 500 },
        );
      }
    } else {
      // 4. Update existing session to saved = true
      const { error: updateError } = await supabase
        .from("user_guides")
        .update({
          saved: true,
          last_updated_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      if (updateError) {
        console.error("Error saving guide:", updateError);
        return NextResponse.json(
          { error: "Failed to save guide" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      message: "Guide saved successfully",
    });
  } catch (error) {
    console.error("Unexpected error in /api/guides/save:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

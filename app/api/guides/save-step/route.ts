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

    const { guideSessionId, stepKey, data, isCompleted, progressPercent } =
      await request.json();

    if (!guideSessionId || !stepKey) {
      return NextResponse.json(
        { error: "guideSessionId and stepKey are required" },
        { status: 400 },
      );
    }

    // 1. Verify session ownership
    const { data: session, error: sessionError } = await supabase
      .from("user_guides")
      .select("id")
      .eq("id", guideSessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found or unauthorized" },
        { status: 403 },
      );
    }

    // 2. Upsert step
    const { error: stepError } = await supabase.from("user_guide_steps").upsert(
      {
        user_guide_id: guideSessionId,
        step_key: stepKey,
        data,
        is_completed: isCompleted || false,
      },
      {
        onConflict: "user_guide_id,step_key",
      },
    );

    if (stepError) {
      console.error("Error saving step data:", stepError);
      return NextResponse.json(
        { error: "Failed to save step data" },
        { status: 500 },
      );
    }

    // 3. Determine status
    let status = "in_progress";
    let completed_at = null;

    if (progressPercent !== undefined && progressPercent >= 100) {
      status = "completed";
      completed_at = new Date().toISOString();
    }

    // 4. Update session
    const updatePayload: any = {
      last_updated_at: new Date().toISOString(),
      current_step_key: stepKey,
      status,
      completed_at,
    };

    if (progressPercent !== undefined) {
      updatePayload.progress_percent = progressPercent;
    }

    const { error: updateError } = await supabase
      .from("user_guides")
      .update(updatePayload)
      .eq("id", guideSessionId);

    if (updateError) {
      console.error("Error updating session:", updateError);
      return NextResponse.json(
        { error: "Failed to update session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Step saved successfully" });
  } catch (error) {
    console.error("Unexpected error in /api/guides/save-step:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

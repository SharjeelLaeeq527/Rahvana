import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, deleteAll } = await request.json();

    if (deleteAll) {
      // Delete all guide sessions for this user
      const { error: deleteError } = await supabase
        .from("user_guides")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Error deleting all guides:", deleteError);
        return NextResponse.json({ error: "Failed to delete all guides" }, { status: 500 });
      }

      return NextResponse.json({ message: "All guide sessions deleted" });
    }

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    // Delete a specific session
    const { error: deleteError } = await supabase
      .from("user_guides")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting guide session:", deleteError);
      return NextResponse.json({ error: "Failed to delete guide session" }, { status: 500 });
    }

    return NextResponse.json({ message: "Guide session deleted" });
  } catch (error) {
    console.error("Unexpected error in /api/guides/delete:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

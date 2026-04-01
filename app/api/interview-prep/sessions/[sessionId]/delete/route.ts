/**
 * DELETE /api/interview-prep/sessions/[sessionId]/delete
 * Delete an interview preparation session
 */

import { NextResponse, NextRequest } from "next/server";
import { getInterviewSessionDB } from "@/lib/interview-prep/data-access";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify session exists and belongs to user
    const session = await getInterviewSessionDB(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Delete session
    const { error: deleteError } = await supabase
      .from("interview_prep_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    // Delete associated answers
    await supabase
      .from("interview_user_answers")
      .delete()
      .eq("session_id", sessionId);

    // Delete associated results
    await supabase
      .from("interview_prep_results")
      .delete()
      .eq("session_id", sessionId);

    return NextResponse.json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete session" },
      { status: 500 }
    );
  }
}

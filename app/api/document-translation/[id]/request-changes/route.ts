// POST /api/document-translation/[id]/request-changes
// User rejects translation and requests changes
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "Please provide a reason for requesting changes" },
        { status: 400 }
      );
    }

    const { data: existing, error: checkError } = await supabase
      .from("translation_documents")
      .select("status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (existing.status !== "TRANSLATED") {
      return NextResponse.json(
        {
          error: `Cannot request changes. Current status: ${existing.status}. Must be TRANSLATED.`,
        },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("translation_documents")
      .update({
        status: "CHANGES_REQUESTED",
        rejection_reason: reason,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to request changes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: updated.status,
      message:
        "Change request submitted. Admin will review and re-upload.",
    });
  } catch (error) {
    console.error("Request changes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
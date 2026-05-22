// POST /api/document-translation/[id]/verify
// Admin verifies and certifies the translation (final step)
import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function getStorageSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase credentials not configured");
  }
  return createSupabaseClient(supabaseUrl, serviceRoleKey);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { verificationNotes } = body;

    const supabase = getStorageSupabase();

    // Check if document exists and is in USER_CONFIRMED state
    const { data: existing, error: checkError } = await supabase
      .from("translation_documents")
      .select("status, translated_file_path")
      .eq("id", id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (existing.status !== "USER_CONFIRMED") {
      return NextResponse.json(
        {
          error: `Cannot verify. Current status: ${existing.status}. Must be USER_CONFIRMED.`,
        },
        { status: 400 }
      );
    }

    if (!existing.translated_file_path) {
      return NextResponse.json({ error: "No translated file available" }, { status: 400 });
    }

    // Update status to VERIFIED (final state)
    const { data: updated, error: updateError } = await supabase
      .from("translation_documents")
      .update({
        status: "VERIFIED",
        admin_verified_at: new Date().toISOString(),
        admin_notes: verificationNotes,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json({ error: "Failed to verify translation" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: updated.status,
      message: "Translation verified and certified. Ready for use.",
    });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

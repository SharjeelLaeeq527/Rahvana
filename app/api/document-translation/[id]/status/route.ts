// GET /api/document-translation/[id]/status
// Get document details by ID
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    const { data: document, error } = await supabase
      .from("translation_documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Signed URLs
    let originalFileUrl = null;
    let translatedFileUrl = null;

    if (document.original_file_path) {
      const { data } = await supabase.storage
        .from("document-vault")
        .createSignedUrl(document.original_file_path, 3600);

      originalFileUrl = data?.signedUrl ?? null;
    }

    if (document.translated_file_path) {
      const { data } = await supabase.storage
        .from("document-vault")
        .createSignedUrl(document.translated_file_path, 3600);

      translatedFileUrl = data?.signedUrl ?? null;
    }

    return NextResponse.json({
      ...document,
      originalFileUrl,
      translatedFileUrl,
    });
  } catch (error) {
    console.error("Get document error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
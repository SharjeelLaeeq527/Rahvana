// GET /api/document-translation/list?limit=50&offset=0
// User lists their own documents
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data: documents, error, count } = await supabase
      .from("translation_documents")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    // Generate signed URLs
    const documentsWithUrls = await Promise.all(
      (documents || []).map(async (doc) => {
        let originalFileUrl = null;
        let translatedFileUrl = null;

        if (doc.original_file_path) {
          const { data } = await supabase.storage
            .from("document-vault")
            .createSignedUrl(doc.original_file_path, 3600);

          originalFileUrl = data?.signedUrl || null;
        }

        if (doc.translated_file_path) {
          const { data } = await supabase.storage
            .from("document-vault")
            .createSignedUrl(doc.translated_file_path, 3600);

          translatedFileUrl = data?.signedUrl || null;
        }

        return {
          ...doc,
          originalFileUrl,
          translatedFileUrl,
        };
      })
    );

    return NextResponse.json({
      documents: documentsWithUrls,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("List documents error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
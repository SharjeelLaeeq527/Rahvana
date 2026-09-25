// GET /api/document-translation/list?limit=50&offset=0
// User lists their own documents
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("[document-translation/list] Unauthorized:", userError);
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const candidateId = searchParams.get("candidateId") || searchParams.get("candidate_id");

    const {
      data: documents,
      error,
      count,
    } = await supabase
      .from("translation_documents")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      // Only show documents that have been paid for (payment_status='paid')
      // or documents without a payment requirement (payment_id IS NULL means free/no payment)
      .or("payment_status.eq.paid,payment_id.is.null")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Query error:", error);
      return NextResponse.json({ error: msg(E.ADMIN_FETCH_FAILED) }, { status: 500 });
    }

    // Filter by candidateId if provided (and not 'all')
    const filteredDocs = (documents || []).filter((doc) => {
      if (!candidateId || candidateId === "all") return true;
      const meta = (doc.metadata || {}) as Record<string, unknown>;
      const docCandId = (meta.candidate_id as string) || "candidate-1";
      return docCandId === candidateId;
    });

    const paginatedDocs = filteredDocs.slice(offset, offset + limit);

    // Generate signed URLs
    const documentsWithUrls = await Promise.all(
      paginatedDocs.map(async (doc) => {
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

        const meta = (doc.metadata || {}) as Record<string, unknown>;
        return {
          ...doc,
          originalFileUrl,
          translatedFileUrl,
          candidate_id: (meta.candidate_id as string) || "candidate-1",
          candidate_name: (meta.candidate_name as string) || "",
        };
      })
    );

    return NextResponse.json({
      documents: documentsWithUrls,
      total: filteredDocs.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("List documents error:", error);
    return NextResponse.json({ error: msg(E.ADMIN_FETCH_FAILED) }, { status: 500 });
  }
}

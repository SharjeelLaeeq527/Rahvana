// GET /api/document-translation/admin/[id]
// Admin-only document detail with signed URLs for BOTH files.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getServiceRoleClient } from "@/lib/api/authGuards";

const URL_TTL_SECONDS = 3600;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // AUTHZ: admin only (service-role client below bypasses RLS by design)
    const { isAdmin, error: authError } = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: authError || "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const admin = getServiceRoleClient();

    const { data: document, error } = await admin
      .from("translation_documents")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Sign both file URLs with the service role (bypasses storage RLS).
    let originalFileUrl: string | null = null;
    let translatedFileUrl: string | null = null;

    if (document.original_file_path) {
      const { data, error: signError } = await admin.storage
        .from("document-vault")
        .createSignedUrl(document.original_file_path, URL_TTL_SECONDS);
      if (signError) console.error("Admin sign (original) failed:", signError.message);
      originalFileUrl = data?.signedUrl ?? null;
    }

    if (document.translated_file_path) {
      const { data, error: signError } = await admin.storage
        .from("document-vault")
        .createSignedUrl(document.translated_file_path, URL_TTL_SECONDS);
      if (signError) console.error("Admin sign (translated) failed:", signError.message);
      translatedFileUrl = data?.signedUrl ?? null;
    }

    return NextResponse.json({
      ...document,
      originalFileUrl,
      translatedFileUrl,
    });
  } catch (error) {
    console.error("Admin document detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

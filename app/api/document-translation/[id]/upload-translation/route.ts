// POST /api/document-translation/[id]/upload-translation
// Admin uploads translated document

import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { E, msg } from "@/lib/errors";
import { triggerTranslationNotification } from "@/lib/notifications";
import { requireAdmin } from "@/lib/api/authGuards";
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
    // AUTHZ: admin only (this route uses the service role → bypasses RLS)
    const { isAdmin, error: authError } = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: authError || "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const adminNotes = formData.get("adminNotes") as string | undefined;

    if (!file) {
      return NextResponse.json({ error: msg(E.UPLOAD_NO_FILE) }, { status: 400 });
    }

    // Validate file type (PDF only)
    if (!file.type.includes("pdf")) {
      return NextResponse.json({ error: msg(E.UPLOAD_INVALID_PDF) }, { status: 400 });
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: msg(E.UPLOAD_FILE_TOO_LARGE, { maxSize: 50 }) },
        { status: 400 }
      );
    }

    const supabase = getStorageSupabase();

    // Check if document exists
    const { data: existing, error: checkError } = await supabase
      .from("translation_documents")
      .select("status, translated_file_path, version")
      .eq("id", id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
      return NextResponse.json({ error: msg(E.CASE_DATA_NOT_FOUND) }, { status: 404 });
    }

    // Allow upload for PENDING, IN_REVIEW, or CHANGES_REQUESTED statuses
    const allowedStatuses = ["PENDING", "IN_REVIEW", "CHANGES_REQUESTED"];
    if (!allowedStatuses.includes(existing.status)) {
      return NextResponse.json(
        {
          error: `Cannot upload. Current status: ${existing.status}. Must be PENDING, IN_REVIEW, or CHANGES_REQUESTED.`,
        },
        { status: 400 }
      );
    }

    // Delete old translated file if it exists
    if (existing.translated_file_path) {
      await supabase.storage.from("document-vault").remove([existing.translated_file_path]);
    }

    // Upload new translated file
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `translation-translated/${id}/${timestamp}_${sanitizedFileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("document-vault")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload translated file" }, { status: 500 });
      return NextResponse.json({ error: msg(E.UPLOAD_PROCESSING_FAILED) }, { status: 500 });
    }

    // Determine new version
    const newVersion = existing.status === "CHANGES_REQUESTED" ? existing.version + 0.1 : 1.0;

    // Update database record
    const { data: updated, error: updateError } = await supabase
      .from("translation_documents")
      .update({
        translated_file_path: storagePath,
        translated_filename: file.name,
        translated_file_size: file.size,
        translated_mime_type: file.type,
        translated_uploaded_at: new Date().toISOString(),
        admin_notes: adminNotes,
        status: "TRANSLATED",
        rejection_reason: null, // Clear rejection reason
        version: newVersion,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      // Cleanup uploaded file
      await supabase.storage.from("document-vault").remove([storagePath]);
      return NextResponse.json({ error: "Failed to update database" }, { status: 500 });
    }

    // Trigger user notification (email and in-app)
    await triggerTranslationNotification(id);

    return NextResponse.json({
      success: true,
      status: updated.status,
      message: msg(E.UPLOAD_TRANSLATION_SUCCESS),
    });
  } catch (error) {
    console.error("Upload translation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}

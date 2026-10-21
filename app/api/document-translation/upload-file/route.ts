// POST /api/document-translation/upload-file
// Storage-only upload used by the pay-first (deferred-create) flow. It validates and
// uploads the original document to storage and returns the generated docId + storage
// path, but does NOT insert a `translation_documents` row. The row is created only
// after the Stripe checkout succeeds (webhook / verify-session), so a canceled or
// failed payment never leaves a "submitted" request behind.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";
import { validateUploadedFile } from "@/lib/security/file-content";
import { UPLOAD_PROFILES } from "@/lib/security/upload-limits";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string | undefined;

    if (!file || !documentType) {
      return NextResponse.json(
        { error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: "[file, documentType]" }) },
        { status: 400 }
      );
    }

    // Same document-type allowlist as the create-on-submit upload route.
    const allowedTypes = ["marriage", "birth", "death", "divorce"];
    if (!allowedTypes.includes(documentType)) {
      return NextResponse.json(
        {
          error: msg(E.UPLOAD_INVALID_DOCUMENT_TYPE, {
            types: "[marriage, birth, death, divorce]",
          }),
        },
        { status: 400 }
      );
    }

    const checked = await validateUploadedFile(file, UPLOAD_PROFILES.translation);
    if (!checked.ok) {
      return NextResponse.json({ error: checked.error }, { status: checked.status });
    }
    const buffer = checked.buffer;

    // Generate the id up-front so the storage path is stable and reusable by the
    // deferred-create branch (the row will be inserted with this exact id).
    const docId = crypto.randomUUID();
    const timestamp = Date.now();

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    const userName = profile?.full_name || "User";

    const safeUserName = userName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const baseFileName = file.name.replace(/\.pdf$/i, "");
    const storageFileName = `${baseFileName}_${safeUserName}.pdf`;
    const storagePath = `${user.id}/translation-originals/${docId}/${timestamp}_${storageFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("document-vault")
      .upload(storagePath, buffer, {
        contentType: checked.detectedMime,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: msg(E.UPLOAD_PROCESSING_FAILED) }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      docId,
      storagePath,
      originalFilename: storageFileName,
      originalFileSize: file.size,
      originalMimeType: checked.detectedMime,
    });
  } catch (error) {
    console.error("Upload-file error:", error);
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}

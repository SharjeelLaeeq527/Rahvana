// POST /api/document-translation/upload
// User uploads original Urdu document for translation
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";
import { triggerTranslationNotification } from "@/lib/notifications";
import { validateUploadedFile } from "@/lib/security/file-content";
import { UPLOAD_PROFILES } from "@/lib/security/upload-limits";
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userNotes = formData.get("userNotes") as string | undefined;
    const documentType = formData.get("documentType") as string | undefined;

    const userEmail = user.email;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const userName = profile?.full_name || "User";

    // Validate required fields
    if (!file || !documentType) {
      return NextResponse.json(
        { error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: "[file, documentType]" }) },
        { status: 400 }
      );
    }

    // Extract file name
    const fileName = file.name;

    // Validate document type
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

    // Generate unique document ID
    const docId = crypto.randomUUID();
    const timestamp = Date.now();

    const safeUserName = userName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const baseFileName = fileName.replace(/\.pdf$/i, "");
    const storageFileName = `${baseFileName}_${safeUserName}.pdf`;

    const storagePath = `${user.id}/translation-originals/${docId}/${timestamp}_${storageFileName}`;

    // Upload to Supabase Storage
    const checked = await validateUploadedFile(file, UPLOAD_PROFILES.translation);
    if (!checked.ok) {
      return NextResponse.json({ error: checked.error }, { status: checked.status });
    }
    const buffer = checked.buffer;

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

    const candidateId = (formData.get("candidateId") as string) || (formData.get("candidate_id") as string) || "candidate-1";
    const candidateName = (formData.get("candidateName") as string) || (formData.get("candidate_name") as string) || "";

    // Create database record
    const { data: document, error: dbError } = await supabase
      .from("translation_documents")
      .insert({
        id: docId,
        user_id: user.id,
        user_email: userEmail,
        user_name: userName,
        document_type: documentType,
        original_file_path: storagePath,
        original_filename: storageFileName,
        original_file_size: file.size,
        original_mime_type: checked.detectedMime,
        user_notes: userNotes,
        status: "PENDING",
        metadata: {
          upload_ip: request.headers.get("x-forwarded-for") || "unknown",
          user_agent: request.headers.get("user-agent") || "unknown",
          candidate_id: candidateId,
          candidate_name: candidateName,
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Cleanup uploaded file
      await supabase.storage.from("document-vault").remove([storagePath]);
      return NextResponse.json({ error: "Failed to create database record" }, { status: 500 });
    }

    // Trigger admin notification
    try {
      await triggerTranslationNotification(document.id);
    } catch (notifError) {
      console.error("Failed to trigger admin notification:", notifError);
    }

    return NextResponse.json({
      success: true,
      documentId: document.id,
      status: document.status,
      message:
        "Document uploaded successfully. Our team will review and upload the english translation shortly.",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}

// POST /api/document-translation/upload
// User uploads original Urdu document for translation
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";
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

    // Validate file type (PDF only)
    if (file.type !== "application/pdf") {
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
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("document-vault")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: msg(E.UPLOAD_PROCESSING_FAILED) }, { status: 500 });
    }

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
        original_mime_type: file.type,
        user_notes: userNotes,
        status: "PENDING",
        metadata: {
          upload_ip: request.headers.get("x-forwarded-for") || "unknown",
          user_agent: request.headers.get("user-agent") || "unknown",
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

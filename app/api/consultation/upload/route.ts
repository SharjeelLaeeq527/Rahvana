import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { E, msg } from "@/lib/errors";
import { assertRequestBodySize } from "@/lib/security/request-body";
import { validateUploadedFile } from "@/lib/security/file-content";
import { UPLOAD_PROFILES } from "@/lib/security/upload-limits";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: msg(E.UPLOAD_NO_FILE) }, { status: 400 });
    }

    const checked = await validateUploadedFile(file, UPLOAD_PROFILES.consultation);
    if (!checked.ok) {
      return NextResponse.json({ error: checked.error }, { status: checked.status });
    }

    const timestamp = Date.now();
    const uniqueId = crypto.randomUUID().substring(0, 8);
    const storagePath = `consultation-attachments/${timestamp}_${uniqueId}_${file.name}`;
    const buffer = checked.buffer;

    const { error: uploadError } = await supabase.storage
      .from("document-vault")
      .upload(storagePath, buffer, {
        contentType: checked.detectedMime,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: msg(E.UPLOAD_FAILED) }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      path: storagePath,
      name: file.name,
    });
  } catch (error) {
    console.error("Attachment upload error:", error);
    return NextResponse.json({ error: msg(E.UPLOAD_PROCESSING_FAILED) }, { status: 500 });
  }
}

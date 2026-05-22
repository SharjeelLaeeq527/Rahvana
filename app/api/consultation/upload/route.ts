import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { E, msg } from '@/lib/errors';

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

    // Generate unique name
    const timestamp = Date.now();
    const uniqueId = crypto.randomUUID().substring(0, 8);
    const storagePath = `consultation-attachments/${timestamp}_${uniqueId}_${file.name}`;

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
      return NextResponse.json({ error: msg(E.UPLOAD_FAILED) }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      path: storagePath,
      name: file.name
    });
  } catch (error) {
    console.error("Attachment upload error:", error);
    return NextResponse.json({ error: msg(E.UPLOAD_PROCESSING_FAILED) }, { status: 500 });
  }
}

// app/api/guides/upload/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server"; // For auth verification

export async function POST(request: Request) {
  try {
    // 1️⃣ Verify user session
    const supabase = await createClient(); // user session client
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const file = formData.get("file") as File;
    const slug = formData.get("slug") as string;
    const stepKey = formData.get("stepKey") as string;

    if (!file || !slug || !stepKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2️⃣ Get guide ID
    const { data: guide } = await supabaseAdmin
      .from("guides")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!guide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }

    // 3️⃣ Get user guide session
    const { data: session } = await supabaseAdmin
      .from("user_guides")
      .select("id")
      .eq("guide_id", guide.id)
      .eq("user_id", user.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Guide session not found" }, { status: 404 });
    }

    // 4️⃣ Construct storage path
    const filePath = `${slug}/${user.id}/${stepKey}/${file.name}`;

    // 5️⃣ Upload file to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("document-vault")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // 6️⃣ Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("document-vault")
      .getPublicUrl(filePath);

    // 7️⃣ Save metadata in DB
    const { error: dbError } = await supabaseAdmin
      .from("user_guide_files")
      .insert({
        user_guide_id: session.id,
        user_id: user.id,
        step_key: stepKey,
        file_url: publicUrlData.publicUrl,
        file_name: file.name,
        mime_type: file.type,
      });

    if (dbError) {
      console.error("DB insert error:", dbError);
      return NextResponse.json({ error: "Database save failed" }, { status: 500 });
    }

    // 8️⃣ Return success
    return NextResponse.json({
      message: "File uploaded successfully",
      fileUrl: publicUrlData.publicUrl,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
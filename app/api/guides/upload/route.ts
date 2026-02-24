// app/api/guides/upload/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

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
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get guide
    const { data: guide } = await supabase
      .from("guides")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!guide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }

    // Get user session
    const { data: session } = await supabase
      .from("user_guides")
      .select("id")
      .eq("guide_id", guide.id)
      .eq("user_id", user.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Guide session not found" }, { status: 404 });
    }

    const filePath = `${slug}/${user.id}/${stepKey}/${file.name}`;

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      console.error(uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from("documents")
      .getPublicUrl(filePath);

    // Save metadata
    const { error: dbError } = await supabase
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
      console.error(dbError);
      return NextResponse.json({ error: "Database save failed" }, { status: 500 });
    }

    return NextResponse.json({
      message: "File uploaded successfully",
      fileUrl: publicUrlData.publicUrl,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
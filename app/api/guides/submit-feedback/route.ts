// app/api/guides/submit-feedback/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const slug = formData.get("slug") as string;
    const stepKey = formData.get("stepKey") as string;
    const feedbackType = formData.get("feedbackType") as string;
    const description = formData.get("description") as string;
    const file = formData.get("attachment") as File | null;

    if (!slug || !feedbackType || !description) {
      return NextResponse.json(
        { error: "Missing required fields (slug, feedbackType, description)" },
        { status: 400 }
      );
    }

    const { data: guide } = await supabase
      .from("guides")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!guide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }

    let attachmentUrl = null;

    if (file && file.size > 0) {
      const filePath = `feedback/${guide.id}/${user.id}/${Date.now()}_${file.name}`;

      await supabase.storage
        .from("document-vault")
        .upload(filePath, file, { upsert: true });

      const { data } = supabase.storage
        .from("document-vault")
        .getPublicUrl(filePath);

      attachmentUrl = data.publicUrl;
    }

    const { error: insertError } = await supabase.from("guide_feedback").insert({
      user_id: user.id,
      guide_id: guide.id,
      step_key: stepKey || null,
      feedback_type: feedbackType,
      description,
      attachment_url: attachmentUrl,
    });

    if (insertError) {
      console.error("Feedback insert error:", insertError.message, insertError.details, insertError.hint);
      return NextResponse.json(
        { error: `Database error: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Feedback submitted successfully" });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
// app/api/feedback/route.ts
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin }  from "@/lib/supabase/admin";
import { NextResponse }   from "next/server";
import { appendFeedbackToSheet } from "@/lib/googleSheets";

/** Convert a URL path to a human-readable page name */
function pathToPageName(url: string): string {
  try {
    // Strip query/hash, grab the pathname
    const pathname = new URL(url).pathname;

    if (pathname === "/" || pathname === "") return "Home Page";

    // Take the last meaningful segment
    const segments = pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1] ?? pathname;

    return last
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    // url might already be just a pathname
    if (url === "/" || url === "") return "Home Page";
    const last = url.split("/").filter(Boolean).pop() ?? url;
    return last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

/** Maps feedback type keys to readable labels */
const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  incorrect_information: "Incorrect Information",
  ui_ux_issue:           "UI / UX Issue",
  bug:                   "Bug / Broken",
  suggestion:            "Suggestion",
  other:                 "Other",
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // User is optional – anonymous feedback is allowed on global pages
    const { data: { user } } = await supabase.auth.getUser();

    const formData = await request.formData();

    const slug         = (formData.get("slug")         as string) || "";
    const stepKey      = (formData.get("stepKey")      as string) || "";
    const feedbackType = (formData.get("feedbackType") as string) || "";
    const description  = (formData.get("description")  as string) || "";
    const pageUrl      = (formData.get("pageUrl")      as string) || "";  // full URL
    const file         = formData.get("attachment")    as File | null;

    if (!feedbackType || !description) {
      return NextResponse.json(
        { error: "Missing required fields (feedbackType, description)" },
        { status: 400 },
      );
    }

    // ── 1. Resolve guide ID (optional) ─────────────────────────────────────
    let guideId: string | null = null;

    if (slug && slug !== "general") {
      const { data: guide } = await supabaseAdmin
        .from("guides")
        .select("id")
        .eq("slug", slug)
        .single();
      guideId = guide?.id ?? null;
    }

    // ── 2. File attachment ─────────────────────────────────────────────────
    let attachmentUrl = "";

    if (file && file.size > 0) {
      const folder   = guideId ? `guides/${guideId}` : "general";
      const filePath = `feedback/${folder}/${user?.id ?? "anon"}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("document-vault")
        .upload(filePath, file, { upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage
          .from("document-vault")
          .getPublicUrl(filePath);
        attachmentUrl = urlData.publicUrl;
      }
    }

    // ── 3. Silently save to Supabase (backup) ─────────────────────────────
    let fbCreatedAt = new Date().toISOString();

    try {
      const { data: inserted, error: dbErr } = await supabaseAdmin
        .from("guide_feedback")
        .insert({
          user_id:        user?.id ?? null,
          guide_id:       guideId,
          step_key:       stepKey || null,
          feedback_type:  feedbackType,
          description,
          attachment_url: attachmentUrl || null,
        })
        .select("created_at")
        .single();

      if (inserted?.created_at) fbCreatedAt = inserted.created_at;
      if (dbErr) console.error("DB backup error:", dbErr.message);
    } catch (e) {
      console.error("DB save failed:", e);
    }

    // ── 4. Derive page name ────────────────────────────────────────────────
    //   Priority: pageUrl → stepKey (guide step) → slug → fallback
    const resolvedPageUrl  = pageUrl || stepKey || slug || "/";
    const resolvedPageName =
      guideId && stepKey                  ? `${pathToPageName(slug)} — ${stepKey}`
      : pageUrl                           ? pathToPageName(pageUrl)
      : slug && slug !== "general"        ? pathToPageName(slug)
      :                                     "General";

    // ── 5. Build PKT timestamp ─────────────────────────────────────────────
    const dateObj = new Date(fbCreatedAt);
    dateObj.setHours(dateObj.getHours() + 5);
    const timestamp = dateObj.toISOString().replace("T", "  ").slice(0, 20) + " PKT";

    // ── 6. Sync to Google Sheets ───────────────────────────────────────────
    try {
      await appendFeedbackToSheet({
        userEmail:    user?.email ?? "Anonymous",
        pageName:     resolvedPageName,
        pageUrl:      resolvedPageUrl,
        feedbackType: FEEDBACK_TYPE_LABELS[feedbackType] ?? feedbackType,
        description,
        attachmentUrl: attachmentUrl || "—",
        timestamp,
      });
    } catch (sheetErr) {
      console.error("Google Sheets sync error (non-fatal):", sheetErr);
    }

    return NextResponse.json({ message: "Feedback submitted successfully" });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

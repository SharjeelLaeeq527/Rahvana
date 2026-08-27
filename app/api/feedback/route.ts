// app/api/feedback/route.ts
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { E, msg } from "@/lib/errors";
import { appendFeedbackToSheet } from "@/lib/googleSheets";
import { triggerFeedbackNotification } from "@/lib/notifications";
import { UPLOAD_PROFILES } from "@/lib/security/upload-limits";
import { validateUploadedFile } from "@/lib/security/file-content";

/** Convert a URL/path to a human-readable page name */
function pathToPageName(url: string): string {
  try {
    const pathname = new URL(url).pathname;

    if (pathname === "/" || pathname === "") {
      return "Home Page";
    }

    const segments = pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1] ?? pathname;

    return last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    if (url === "/" || url === "") {
      return "Home Page";
    }

    const last = url.split("/").filter(Boolean).pop() ?? url;

    return last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

/** Maps feedback type keys to readable labels */
const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  incorrect_information: "Incorrect Information",
  ui_ux_issue: "UI / UX Issue",
  bug: "Bug / Broken",
  suggestion: "Suggestion",
  other: "Other",
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // User is optional – anonymous feedback is allowed on global pages
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const formData = await request.formData();

    const slug = String(formData.get("slug") ?? "");
    const stepKey = String(formData.get("stepKey") ?? "");
    const feedbackType = String(formData.get("feedbackType") ?? "");
    const description = String(formData.get("description") ?? "");
    const pageUrl = String(formData.get("pageUrl") ?? "");

    const files = formData
      .getAll("attachment")
      .filter((value): value is File => value instanceof File);

    // 1. Validate required fields
    if (!feedbackType || !description) {
      return NextResponse.json(
        {
          error: "Missing required fields (feedbackType, description)",
        },
        { status: 400 }
      );
    }

    // 2. Resolve guide ID
    let guideId: string | null = null;

    if (slug && slug !== "general") {
      const { data: guide, error: guideError } = await supabaseAdmin
        .from("guides")
        .select("id")
        .eq("slug", slug)
        .single();

      if (guideError) {
        console.error("[Feedback] Guide lookup failed:", guideError.message);
      }

      guideId = guide?.id ?? null;
    }

    // 3. Process file attachments
    console.log(`[Feedback] Processing ${files.length} attachments...`);

    const attachmentUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file || file.size === 0) {
        continue;
      }

      const checked = await validateUploadedFile(file, UPLOAD_PROFILES.feedbackAttachment);

      if (!checked.ok) {
        console.error(`[Feedback] Rejected attachment ${file.name}:`, checked.error);

        // Skip invalid files without failing the entire submission.
        continue;
      }

      const folder = guideId ? `guides/${guideId}` : "general";

      // Sanitize filename and make it unique.
      const safeOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");

      const randomStr = Math.random().toString(36).substring(2, 8);

      const fileName = `${Date.now()}_${i}_${randomStr}_${safeOriginalName}`;

      const filePath = `feedback/${folder}/${user?.id ?? "anon"}/${fileName}`;

      console.log(`[Feedback] Uploading file ${i + 1}/${files.length}: ${file.name}`);

      const { error: uploadError } = await supabaseAdmin.storage
        .from("document-vault")
        .upload(filePath, checked.buffer, {
          upsert: true,
          contentType: checked.detectedMime,
        });

      if (uploadError) {
        console.error(`[Feedback] Upload failed for ${file.name}:`, uploadError.message);

        continue;
      }

      const { data: urlData } = supabaseAdmin.storage.from("document-vault").getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        attachmentUrls.push(urlData.publicUrl);
      }
    }

    const finalAttachmentUrl = attachmentUrls.length > 0 ? attachmentUrls.join("\n\n") : "";

    console.log(`[Feedback] Total successful uploads: ${attachmentUrls.length}`);

    // 4. Save feedback to Supabase
    let fbCreatedAt = new Date().toISOString();

    try {
      const { data: inserted, error: dbError } = await supabaseAdmin
        .from("guide_feedback")
        .insert({
          user_id: user?.id ?? null,
          guide_id: guideId,
          step_key: stepKey || null,
          feedback_type: feedbackType,
          description,
          attachment_url: finalAttachmentUrl || null,
        })
        .select("created_at")
        .single();

      if (dbError) {
        console.error("[Feedback] DB backup error:", dbError.message);
      }

      if (inserted?.created_at) {
        fbCreatedAt = inserted.created_at;
      }
    } catch (dbError) {
      console.error("[Feedback] DB save failed:", dbError);
    }

    // 5. Resolve page name
    let resolvedPageName = "General Page";

    if (guideId && stepKey) {
      resolvedPageName = `${pathToPageName(slug)} - ${stepKey}`;
    } else if (pageUrl) {
      resolvedPageName = pathToPageName(pageUrl);
    } else if (slug && slug !== "general") {
      resolvedPageName = pathToPageName(slug);
    }

    // 6. Determine priority
    let priority = "Medium";

    switch (feedbackType) {
      case "incorrect_information":
        priority = "Critical";
        break;

      case "bug":
        priority = "High";
        break;

      case "suggestion":
        priority = "Low";
        break;

      default:
        priority = "Medium";
    }

    // 7. Build PKT timestamp
    const dateObj = new Date(fbCreatedAt);

    // Convert UTC → PKT (UTC+5)
    dateObj.setHours(dateObj.getHours() + 5);

    const timestamp = dateObj.toISOString().replace("T", "  ").slice(0, 20) + " PKT";

    // 8. Sync to Google Sheets
    try {
      await appendFeedbackToSheet({
        userEmail: user?.email ?? "Anonymous",
        pageName: resolvedPageName,
        pageUrl: pageUrl || slug || "/",
        feedbackType: FEEDBACK_TYPE_LABELS[feedbackType] ?? feedbackType,
        description,
        attachmentUrls: finalAttachmentUrl,
        timestamp,
        priority,
      });
    } catch (sheetError) {
      // Google Sheets failure should NOT fail the feedback submission.
      console.error("[Feedback] Google Sheets sync error (non-fatal):", sheetError);
    }

    // 9. Notify admins
    try {
      await triggerFeedbackNotification(
        user?.email ?? "Anonymous",
        FEEDBACK_TYPE_LABELS[feedbackType] ?? feedbackType
      );
    } catch (notificationError) {
      // Notification failure should NOT fail the feedback submission.
      console.error("[Feedback] Admin notification failed (non-fatal):", notificationError);
    }

    // 10. Success response
    return NextResponse.json(
      {
        message: "Feedback submitted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Feedback] API error:", error);

    return NextResponse.json(
      {
        error: msg(E.FEEDBACK_GUIDE_SAVE_FAILED),
      },
      { status: 500 }
    );
  }
}

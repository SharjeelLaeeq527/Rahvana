import { NextRequest } from "next/server";
import { E, msg } from "@/lib/errors";
import { getAuthenticatedUser, getServiceRoleClient } from "@/lib/api/authGuards";
import { UPLOAD_PROFILES } from "@/lib/security/upload-limits";
import { validateUploadedFile } from "@/lib/security/file-content";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const requestId = formData.get("requestId") as string;
    const fileType = formData.get("fileType") as string;
    const file = formData.get("file") as File | null;

    if (!requestId || !fileType || !file) {
      return Response.json({ error: msg(E.UPLOAD_NO_FILE) }, { status: 400 });
    }

    const fieldMapping: Record<string, string> = {
      judgmentCopy: "judgment_copy_url",
      photograph: "photograph_url",
      passportCopy: "passport_copy_url",
      utilityBill: "utility_bill_url",
      policeLetter: "police_letter_url",
    };

    if (!fieldMapping[fileType]) {
      return Response.json({ error: msg(E.TOOL_FILE_TYPE_UNSUPPORTED) }, { status: 400 });
    }

    // AUTH: caller must be logged in
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    // Service role bypasses RLS — used only AFTER verifying ownership below.
    const supabase = getServiceRoleClient();

    // AUTHZ: caller must own this police-verification request
    const { data: pvReq, error: pvError } = await supabase
      .from("police_verification_requests")
      .select("user_id")
      .eq("id", requestId)
      .maybeSingle();

    if (pvError || !pvReq) {
      return Response.json({ error: "Request not found" }, { status: 404 });
    }
    if (pvReq.user_id !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const checked = await validateUploadedFile(file, UPLOAD_PROFILES.appointment);
    if (!checked.ok) {
      return Response.json({ error: checked.error }, { status: checked.status });
    }
    const buffer = checked.buffer;
    
    const fileName = `police-verification/${requestId}/${fileType}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("document-vault")
      .upload(fileName, buffer, {
        contentType: checked.detectedMime,
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return Response.json({ error: msg(E.UPLOAD_FAILED) }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("document-vault").getPublicUrl(fileName);

    const updateField = fieldMapping[fileType];
    const { error: updateError } = await supabase
      .from("police_verification_requests")
      .update({ [updateField]: publicUrl })
      .eq("id", requestId);

    if (updateError) {
      console.error("Error updating police verification request with file URL:", updateError);
      return Response.json({ error: "Failed to update record" }, { status: 500 });
    }

    return Response.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("Unexpected error in file upload:", error);
    return Response.json({ error: msg(E.UPLOAD_PROCESSING_FAILED) }, { status: 500 });
  }
}

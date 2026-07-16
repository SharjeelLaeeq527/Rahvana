import { NextRequest } from "next/server";
import { msg, E } from "@/lib/errors";
import { getAuthenticatedUser, getServiceRoleClient } from "@/lib/api/authGuards";

export async function POST(req: NextRequest) {
  try {
    // Parse the multipart form data
    const formData = await req.formData();

    // Extract the appointment ID and file type
    const appointmentId = formData.get("appointmentId") as string;
    const fileType = formData.get("fileType") as string;
    const file = formData.get("file") as File | null;

    if (!appointmentId || !fileType || !file) {
      return Response.json({ error: msg(E.UPLOAD_MISSING_FIELDS) }, { status: 400 });
    }

    // Validate file type
    const validFileTypes = ["scannedPassport", "kOneLetter", "appointmentConfirmationLetter"];
    if (!validFileTypes.includes(fileType)) {
      return Response.json({ error: msg(E.UPLOAD_INVALID_FILE_TYPE) }, { status: 400 });
    }

    // Validate file size (max 20MB) — prevent storage-fill abuse
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return Response.json({ error: msg(E.UPLOAD_FILE_TOO_LARGE, { maxSize: 20 }) }, { status: 400 });
    }

    // AUTH: caller must be logged in
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    // Service role bypasses RLS — used only AFTER verifying ownership below.
    const supabase = getServiceRoleClient();

    // AUTHZ: caller must own the target appointment
    const { data: appt, error: apptError } = await supabase
      .from("appointments")
      .select("user_id")
      .eq("id", appointmentId)
      .maybeSingle();

    if (apptError || !appt) {
      return Response.json({ error: "Appointment not found" }, { status: 404 });
    }
    if (appt.user_id !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Convert File to ArrayBuffer for upload
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate a unique filename
    const fileName = `${appointmentId}/${fileType}/${Date.now()}_${file.name}`;

    // Upload file to Supabase Storage using the existing document-vault bucket
    const { error: uploadError } = await supabase.storage
      .from("document-vault") // Using existing document-vault bucket
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true, // Overwrite if file exists
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return Response.json({ error: msg(E.UPLOAD_UPLOAD_FAILED) }, { status: 500 });
    }

    // Get the public URL of the uploaded file
    const {
      data: { publicUrl },
    } = supabase.storage.from("document-vault").getPublicUrl(fileName);

    // Update the appointment record with the file URL
    let updateField = "";
    switch (fileType) {
      case "scannedPassport":
        updateField = "scanned_passport_url";
        break;
      case "kOneLetter":
        updateField = "k_one_letter_url";
        break;
      case "appointmentConfirmationLetter":
        updateField = "appointment_confirmation_letter_url";
        break;
      default:
        return Response.json({ error: msg(E.UPLOAD_INVALID_FILE_TYPE) }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ [updateField]: publicUrl })
      .eq("id", appointmentId);

    if (updateError) {
      console.error("Error updating appointment with file URL:", updateError);
      return Response.json({ error: msg(E.UPLOAD_UPDATE_FAILED) }, { status: 500 });
    }

    return Response.json({
      success: true,
      url: publicUrl,
      fileName,
    });
  } catch (error) {
    console.error("Unexpected error in file upload:", error);
    return Response.json({ error: msg(E.UPLOAD_UPLOAD_FAILED) }, { status: 500 });
  }
}

import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const requestId = formData.get("requestId") as string;
    const fileType = formData.get("fileType") as string;
    const file = formData.get("file") as File | null;

    if (!requestId || !fileType || !file) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const fieldMapping: Record<string, string> = {
      judgmentCopy: "judgment_copy_url",
      photograph: "photograph_url",
      passportCopy: "passport_copy_url",
      utilityBill: "utility_bill_url",
      policeLetter: "police_letter_url",
    };

    if (!fieldMapping[fileType]) {
      return Response.json({ error: "Invalid file type" }, { status: 400 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {},
        },
      }
    );

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `police-verification/${requestId}/${fileType}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("document-vault")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return Response.json({ error: "Failed to upload file" }, { status: 500 });
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
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

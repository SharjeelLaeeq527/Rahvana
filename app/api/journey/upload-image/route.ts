import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createClientJs } from "@supabase/supabase-js";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function getStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClientJs(supabaseUrl, serviceRoleKey);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const entityType = ((formData.get("entityType") as string) || "journey").toLowerCase();
    const entityId = ((formData.get("entityId") as string) || "default")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_");

    if (!file) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image size exceeds the 5MB maximum limit." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpeg", "jpg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
    const storagePath = `journey-media/${user.id}/${entityType}_${entityId}_${Date.now()}.${safeExt}`;

    const storageClient = getStorageClient();
    const { error: uploadError } = await storageClient.storage
      .from("document-vault")
      .upload(storagePath, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("[upload-image] Supabase Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload image to storage." }, { status: 500 });
    }

    const mediaUrl = `/api/journey/media?path=${encodeURIComponent(storagePath)}`;

    return NextResponse.json({
      success: true,
      url: mediaUrl,
      storagePath,
    });
  } catch (error) {
    console.error("[upload-image] Unexpected error:", error);
    return NextResponse.json({ error: "Unexpected error during image upload." }, { status: 500 });
  }
}

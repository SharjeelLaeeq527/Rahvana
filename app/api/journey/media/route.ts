import { NextRequest, NextResponse } from "next/server";
import { createClient as createClientJs } from "@supabase/supabase-js";

function getStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClientJs(supabaseUrl, serviceRoleKey);
}

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storagePath = searchParams.get("path");

    if (!storagePath) {
      return NextResponse.json({ error: "Missing image path." }, { status: 400 });
    }

    // Security guard: only allow paths within journey-media/ or user-uploads/
    if (
      !storagePath.startsWith("journey-media/") &&
      !storagePath.startsWith("user-uploads/")
    ) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const storageClient = getStorageClient();
    const { data: blob, error } = await storageClient.storage
      .from("document-vault")
      .download(storagePath);

    if (error || !blob) {
      console.warn("[journey/media] Storage download failed:", error?.message);
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }

    const ext = storagePath.split(".").pop()?.toLowerCase() || "jpg";
    const contentType = MIME_BY_EXT[ext] || "image/jpeg";
    const arrayBuffer = await blob.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err) {
    console.error("[journey/media] Unexpected error:", err);
    return NextResponse.json({ error: "Failed to load image." }, { status: 500 });
  }
}

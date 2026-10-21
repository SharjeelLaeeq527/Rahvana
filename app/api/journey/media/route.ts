import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const storagePath = searchParams.get("path");

    if (!storagePath) {
      return NextResponse.json({ error: "Missing image path." }, { status: 400 });
    }

    // Owner-only: the download below uses the service role (bypasses storage RLS), so
    // the path must sit inside the caller's own folder, as written by upload-image
    // (`journey-media/<userId>/...`). Rejecting ".." keeps it from escaping that folder.
    if (!storagePath.startsWith(`journey-media/${user.id}/`) || storagePath.includes("..")) {
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
        // private: owner-only content must not be stored by shared caches/CDNs.
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (err) {
    console.error("[journey/media] Unexpected error:", err);
    return NextResponse.json({ error: "Failed to load image." }, { status: 500 });
  }
}

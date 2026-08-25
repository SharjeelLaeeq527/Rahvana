import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { E, msg } from "@/lib/errors";
import { triggerPoliceVerificationNotification } from "@/lib/notifications";
import { safeError } from "@/lib/api/safeError";

export const dynamic = "force-dynamic";

async function signVerificationUrls(supabase: any, requests: any[]) {
  if (!requests || requests.length === 0) return;

  const urlFields = [
    "photograph_url",
    "passport_copy_url",
    "utility_bill_url",
    "police_letter_url",
    "judgment_copy_url",
  ] as const;

  const pathsToSign: string[] = [];

  for (const row of requests) {
    for (const field of urlFields) {
      const url = row[field];
      if (url && typeof url === "string") {
        const parts = url.split("/document-vault/");
        if (parts.length >= 2) {
          const storagePath = decodeURIComponent(parts[1]);
          pathsToSign.push(storagePath);
        }
      }
    }
  }

  if (pathsToSign.length === 0) return;

  const uniquePaths = Array.from(new Set(pathsToSign));

  try {
    const { data: signedData, error: signingError } = await supabase.storage
      .from("document-vault")
      .createSignedUrls(uniquePaths, 86400); // 24 hours

    if (signingError) {
      console.error("Error batch signing URLs:", signingError);
      return;
    }

    if (signedData) {
      const signedUrlMap = new Map<string, string>();
      for (const item of signedData) {
        if (item.signedUrl && !item.error) {
          signedUrlMap.set(item.path, item.signedUrl);
        }
      }

      for (const row of requests) {
        for (const field of urlFields) {
          const url = row[field];
          if (url && typeof url === "string") {
            const parts = url.split("/document-vault/");
            if (parts.length >= 2) {
              const storagePath = decodeURIComponent(parts[1]);
              const signedUrl = signedUrlMap.get(storagePath);
              if (signedUrl) {
                row[field] = signedUrl;
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to sign URLs:", err);
  }
}

export async function GET(req: NextRequest) {
  try {
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("police_verification_requests")
      .select("*")
      .or("payment_status.eq.paid,payment_id.is.null")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching police verification requests:", error);
      return Response.json({ error: msg(E.ADMIN_FETCH_FAILED) }, { status: 500 });
    }

    if (data) {
      await signVerificationUrls(supabase, data);
    }

    return Response.json({ data });
  } catch (error) {
    console.error("Unexpected error fetching police verifications:", error);
    return Response.json({ error: msg(E.ADMIN_FETCH_FAILED) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
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

    const body = await req.json();
    const { id, status, adminNotes } = body;

    if (!id || !status) {
      return Response.json({ error: "Missing id or status" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("police_verification_requests")
      .update({ status, admin_notes: adminNotes || "", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return safeError(error);
    }

    if (data) {
      await signVerificationUrls(supabase, [data]);
    }

    // Trigger status update notifications (email and in-app)
    await triggerPoliceVerificationNotification(id);

    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: "Internal server error" + error }, { status: 500 });
  }
}

import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { E, msg } from "@/lib/errors";
import { triggerPoliceVerificationNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

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
    const { id, status } = body;

    if (!id || !status) {
      return Response.json({ error: "Missing id or status" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("police_verification_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Trigger status update notifications (email and in-app)
    await triggerPoliceVerificationNotification(id);

    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: "Internal server error" + error }, { status: 500 });
  }
}

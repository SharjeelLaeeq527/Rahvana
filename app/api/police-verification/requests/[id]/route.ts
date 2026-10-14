import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { E, msg } from "@/lib/errors";
import { safeError } from "@/lib/api/safeError";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/police-verification/requests/[id]
 * Lets the owning user update their own PCC request (e.g. journey "mark as received"
 * flow sets status: "received" + received_at, which drives the 6-month validity clock).
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing request id" }, { status: 400 });
    }

    const body = await req.json();

    // Whitelist only user-writable lifecycle fields (admin status edits go through /api/admin).
    const updates: Record<string, unknown> = {};
    if (typeof body.status === "string") updates.status = body.status;
    if (typeof body.received_at === "string") updates.received_at = body.received_at;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("police_verification_requests")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating police verification request:", error);
      return safeError(error);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("PCC request patch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

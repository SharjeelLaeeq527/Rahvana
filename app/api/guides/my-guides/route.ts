import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { E, msg } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("[guides/my-guides] Unauthorized:", userError);
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const { data: sessions, error: sessionsError } = await supabase
      .from("user_guides")
      .select(
        `
        id,
        progress_percent,
        status,
        saved,
        last_updated_at,
        guides(slug, title, description)
      `
      )
      .eq("user_id", user.id)
      .eq("saved", true) // fetch only saved guides
      .order("last_updated_at", { ascending: false });

    if (sessionsError) {
      console.error("Error fetching user guides:", sessionsError);
      return NextResponse.json({ error: msg(E.ADMIN_FETCH_FAILED) }, { status: 500 });
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error) {
    console.error("Unexpected error in /api/guides/my-guides:", error);
    return NextResponse.json({ error: msg(E.ADMIN_FETCH_FAILED) }, { status: 500 });
  }
}

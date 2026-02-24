import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all active/completed guide sessions for the user
    const { data: sessions, error: sessionsError } = await supabase
      .from("user_guides")
      .select(`
        *,
        guides(slug, title, description)
      `)
      .eq("user_id", user.id)
      .order("last_updated_at", { ascending: false });

    if (sessionsError) {
      console.error("Error fetching user guides:", sessionsError);
      return NextResponse.json({ error: "Failed to fetch user guides" }, { status: 500 });
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Unexpected error in /api/guides/my-guides:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

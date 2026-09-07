import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("USCIS Case History GET unauthorized:", userError);
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("uscis_case_history")
      .select("*")
      .eq("user_id", user.id)
      .order("checked_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching USCIS case history:", error);
      return NextResponse.json({ error: "Failed to fetch USCIS case history" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("USCIS Case History Route Error:", error);
    return NextResponse.json({ error: msg(E.USCIS_UNEXPECTED_ERROR) }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("USCIS Case History DELETE unauthorized:", userError);
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("uscis_case_history")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting USCIS case history:", error);
      return NextResponse.json({ error: "Failed to delete USCIS case history" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("USCIS Case History Route Error:", error);
    return NextResponse.json({ error: msg(E.USCIS_UNEXPECTED_ERROR) }, { status: 500 });
  }
}

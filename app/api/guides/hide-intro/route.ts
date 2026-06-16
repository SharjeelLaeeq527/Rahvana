import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { E, msg } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("[guides/hide-intro] Unauthorized:", userError);
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    // Get guide slug from body
    const body = await request.json();
    const slug = body.slug;

    if (!slug) {
      return NextResponse.json({ error: msg(E.ADMIN_INVALID_INPUT) }, { status: 400 });
    }

    // Fetch the user_guide session for this guide slug
    const { data: session, error: sessionError } = await supabase
      .from("user_guides")
      .select(
        `
        *,
        guides!inner(slug, title)
      `
      )
      .eq("user_id", user.id)
      .eq("guides.slug", slug)
      .maybeSingle();

    if (sessionError) {
      console.error("Error fetching session:", sessionError);
      return NextResponse.json({ error: msg(E.ADMIN_FETCH_FAILED) }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: msg(E.ADMIN_INVALID_INPUT) }, { status: 404 });
    }

    // Update hide_intro_modal to true
    const { data: updated, error: updateError } = await supabase
      .from("user_guides")
      .update({ hide_intro_modal: true })
      .eq("id", session.id)
      .select("*")
      .maybeSingle();

    if (updateError) {
      console.error("Error updating hide_intro_modal:", updateError);
      return NextResponse.json({ error: msg(E.ADMIN_FETCH_FAILED) }, { status: 500 });
    }

    return NextResponse.json({ session: updated });
  } catch (error) {
    console.error("Unexpected error in /api/guides/hide-intro:", error);
    return NextResponse.json({ error: msg(E.ADMIN_FETCH_FAILED) }, { status: 500 });
  }
}

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// export const dynamic = "force-dynamic";

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

    const userId = user.id;

    // GUIDES 
    const { count: totalGuides } = await supabase
      .from("user_guides")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // JOURNEYS
    const { count: journeysCount } = await supabase
      .from("user_journey_progress")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // DOCUMENT TRANSLATIONS 
    const { count: translationCount } = await supabase
      .from("translation_documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // CASE STRENGTH 
    const { count: caseStrengthCount } = await supabase
      .from("user_case_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    return NextResponse.json({
      guides: {
        total: totalGuides || 0,
    },
      journeys: {
        total: journeysCount || 0,
      },
      document_translations: {
        total: translationCount || 0,
      },
      case_strength: {
        total: caseStrengthCount || 0,
      },
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);

    return NextResponse.json(
      { error: "Failed to fetch dashboard analytics" },
      { status: 500 }
    );
  }
}
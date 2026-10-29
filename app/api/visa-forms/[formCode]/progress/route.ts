import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";

type DraftPayload = {
  payload: Record<string, string>;
  current_step: number;
  current_question_index: number;
  view_mode?: "form" | "review";
  progressive_sub_question_indices?: Record<string, number>;
  journey_key?: string;
  config_version?: string;
  completed?: boolean;
};

async function getAuthedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null as null };
  }

  return { supabase, user };
}

export async function GET(request: NextRequest, { params }: { params: { formCode: string } }) {
  try {
    const { formCode } = await params;
    const journeyKey = request.nextUrl.searchParams.get("journey_key") || "global";

    const { supabase, user } = await getAuthedUser();

    if (!user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    let { data, error } = await supabase
      .from("visa_forms_draft")
      .select("*")
      .eq("user_id", user.id)
      .eq("form_code", formCode)
      .eq("journey_key", journeyKey)
      .maybeSingle();

    if (error) {
      console.error("/api/visa-forms progress GET db error:", error);
      return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
    }

    // Fallback: If no draft exists for this specific journey_key, and journeyKey is not 'global' and not 'standalone', check for a legacy 'global' draft
    if (!data && journeyKey !== "global" && journeyKey !== "standalone") {
      const fallback = await supabase
        .from("visa_forms_draft")
        .select("*")
        .eq("user_id", user.id)
        .eq("form_code", formCode)
        .eq("journey_key", "global")
        .maybeSingle();

      if (!fallback.error && fallback.data) {
        data = fallback.data;
      }
    }

    return NextResponse.json({ draft: data ?? null });
  } catch (error) {
    console.error("/api/visa-forms progress GET unexpected error:", error);
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { formCode: string } }) {
  try {
    const { formCode } = await params;
    const body = (await request.json()) as DraftPayload;
    const journeyKey = body.journey_key || "global";

    const { supabase, user } = await getAuthedUser();

    if (!user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const upsertRow = {
      user_id: user.id,
      form_code: formCode,
      journey_key: journeyKey,
      payload: body.payload,
      current_step: body.current_step ?? 1,
      current_question_index: body.current_question_index ?? 0,
      view_mode: body.view_mode ?? "form",
      progressive_sub_question_indices: body.progressive_sub_question_indices ?? {},
      config_version: body.config_version ?? "v1",
      completed: body.completed ?? false,
      last_saved_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("visa_forms_draft")
      .upsert(upsertRow, { onConflict: "user_id,form_code,journey_key" })
      .select()
      .maybeSingle();

    if (error) {
      console.error("/api/visa-forms progress POST db error:", error);
      return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
    }

    return NextResponse.json({ draft: data ?? null });
  } catch (error) {
    console.error("/api/visa-forms progress POST unexpected error:", error);
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { formCode: string } }) {
  try {
    const { formCode } = await params;
    const journeyKey = request.nextUrl.searchParams.get("journey_key") || "global";

    const { supabase, user } = await getAuthedUser();

    if (!user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("visa_forms_draft")
      .delete()
      .eq("user_id", user.id)
      .eq("form_code", formCode)
      .eq("journey_key", journeyKey);

    if (error) {
      console.error("/api/visa-forms progress DELETE db error:", error);
      return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
    }

    return NextResponse.json({ message: "Draft deleted successfully" });
  } catch (error) {
    console.error("/api/visa-forms progress DELETE unexpected error:", error);
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}

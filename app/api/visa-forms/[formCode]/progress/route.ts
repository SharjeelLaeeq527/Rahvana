import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

export async function GET(
  request: NextRequest,
  { params }: { params: { formCode: string } },
) {
  try {
    const { formCode } = await params;
    const journeyKey =
      request.nextUrl.searchParams.get("journey_key") || "global";

    const { supabase, user } = await getAuthedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("visa_forms_draft")
      .select("*")
      .eq("user_id", user.id)
      .eq("form_code", formCode)
      .eq("journey_key", journeyKey)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ draft: data ?? null });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { formCode: string } },
) {
  try {
    const { formCode } = await params;
    const body = (await request.json()) as DraftPayload;
    const journeyKey = body.journey_key || "global";

    const { supabase, user } = await getAuthedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const upsertRow = {
      user_id: user.id,
      form_code: formCode,
      journey_key: journeyKey,
      payload: body.payload,
      current_step: body.current_step ?? 1,
      current_question_index: body.current_question_index ?? 0,
      view_mode: body.view_mode ?? "form",
      progressive_sub_question_indices:
        body.progressive_sub_question_indices ?? {},
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ draft: data ?? null });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { formCode: string } },
) {
  try {
    const { formCode } = await params;
    const journeyKey =
      request.nextUrl.searchParams.get("journey_key") || "global";

    const { supabase, user } = await getAuthedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("visa_forms_draft")
      .delete()
      .eq("user_id", user.id)
      .eq("form_code", formCode)
      .eq("journey_key", journeyKey);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Draft deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

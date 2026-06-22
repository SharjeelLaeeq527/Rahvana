import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveActiveJourneyId } from "@/lib/case-collaboration/helpers";
import { logCaseActivity } from "@/lib/case-collaboration/activity";
import { E, msg } from "@/lib/errors";

// Friendly form labels for the activity feed. Unknown codes fall back to the
// upper-cased code.
const FORM_LABELS: Record<string, string> = {
  i130: "Form I-130",
  i130a: "Form I-130A",
  ds260: "Form DS-260",
  i864: "Form I-864",
  i864a: "Form I-864A",
};
function formLabel(code: string): string {
  return FORM_LABELS[code.toLowerCase()] || `Form ${code.toUpperCase()}`;
}

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ formCode: string }> }) {
  try {
    const { formCode } = await params;
    const journeyKey = request.nextUrl.searchParams.get("journey_key") || "global";

    const { supabase, user } = await getAuthedUser();

    if (!user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    // Scope the draft to the SHARED case, not the individual user, so a spouse
    // opens the same I-130/DS-260/etc. (one draft per case + form). Falls back
    // to per-user keying only when the user has no journey yet.
    const journeyId = await resolveActiveJourneyId(supabase, user.id);

    let query = supabase.from("visa_forms_draft").select("*").eq("form_code", formCode);
    query = journeyId
      ? query.eq("journey_id", journeyId)
      : query.eq("user_id", user.id).eq("journey_key", journeyKey);

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("/api/visa-forms progress GET db error:", error);
      return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
    }

    return NextResponse.json({ draft: data ?? null });
  } catch (error) {
    console.error("/api/visa-forms progress GET unexpected error:", error);
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ formCode: string }> }) {
  try {
    const { formCode } = await params;
    const body = (await request.json()) as DraftPayload;
    const journeyKey = body.journey_key || "global";

    const { supabase, user } = await getAuthedUser();

    if (!user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    // One shared draft per case + form. When the user belongs to a case we key
    // by journey_id (both spouses upsert the same row; user_id records the last
    // editor) and set journey_key = the journey id so the legacy per-user index
    // never collides with their own pre-join 'global' draft. No journey yet ->
    // keep the original per-user behaviour.
    const journeyId = await resolveActiveJourneyId(supabase, user.id);

    const upsertRow = {
      user_id: user.id,
      form_code: formCode,
      journey_id: journeyId,
      journey_key: journeyId ?? journeyKey,
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
      .upsert(upsertRow, {
        onConflict: journeyId ? "journey_id,form_code" : "user_id,form_code,journey_key",
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("/api/visa-forms progress POST db error:", error);
      return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
    }

    // Audit log (best-effort, shared case only). form.complete when the draft
    // just flipped to completed; otherwise a regular form.save.
    await logCaseActivity({
      journeyId,
      actorUserId: user.id,
      action: body.completed ? "form.complete" : "form.save",
      targetLabel: formLabel(formCode),
      metadata: { form_code: formCode, current_step: upsertRow.current_step },
    });

    return NextResponse.json({ draft: data ?? null });
  } catch (error) {
    console.error("/api/visa-forms progress POST unexpected error:", error);
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ formCode: string }> }) {
  try {
    const { formCode } = await params;
    const journeyKey = request.nextUrl.searchParams.get("journey_key") || "global";

    const { supabase, user } = await getAuthedUser();

    if (!user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    // Delete the shared case draft when in a case; otherwise the per-user one.
    const journeyId = await resolveActiveJourneyId(supabase, user.id);

    let delQuery = supabase.from("visa_forms_draft").delete().eq("form_code", formCode);
    delQuery = journeyId
      ? delQuery.eq("journey_id", journeyId)
      : delQuery.eq("user_id", user.id).eq("journey_key", journeyKey);

    const { data, error } = await delQuery;

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

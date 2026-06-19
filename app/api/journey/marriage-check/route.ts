import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { caseDataService } from "@/lib/journey/service";
import { E, msg } from "@/lib/errors";

// ─────────────────────────────────────────────────────────────────────────────
// Marriage cross-check between an uploaded document and the journey's own answers.
//
// The IR-1 journey asks the beneficiary, in an earlier roadmap step, whether they
// were previously married (`prior_marriage_beneficiary` = "yes" | "no", and
// `beneficiary_marriage_end` = "divorce" | "death"). When the user later uploads a
// divorce decree / death certificate of a former spouse, the upload modal calls
// GET here to learn what the journey currently says. If the journey says "no prior
// marriage" but the document shows one, the modal raises a clash warning. On
// Confirm & Save the modal calls POST here to OVERWRITE the earlier step answer so
// the two sources stay in sync.
//
// All journey lookups happen server-side (by the authenticated user's own IR-1
// journey), so the modal works from any caller without wizard context.
// ─────────────────────────────────────────────────────────────────────────────

const PRIOR_KEY = "prior_marriage_beneficiary";
const END_KEY = "beneficiary_marriage_end";

/**
 * Find the most-recent IR-1 journey the authenticated user is a MEMBER of
 * (owner OR invited partner), or null. We deliberately do NOT filter by
 * user_id: RLS on journeys (is_journey_member) already returns only the
 * journeys this user can access, which includes a spouse's shared case.
 */
async function findIr1JourneyId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  _userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("journeys")
    .select("id, journey_type, updated_at")
    .order("updated_at", { ascending: false });

  if (error || !data || data.length === 0) return null;
  // Prefer an IR1/CR1 journey; fall back to the most-recent journey.
  const ir1 = data.find((j) => /IR1|CR1/i.test(String(j.journey_type)));
  return (ir1 ?? data[0]).id as string;
}

function readFlag(caseProfile: { all_data?: Record<string, { data_value?: unknown }> }, key: string): string {
  const v = caseProfile?.all_data?.[key]?.data_value;
  return v == null ? "" : String(v).trim();
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const journeyId = await findIr1JourneyId(supabase, user.id);
    if (!journeyId) {
      return NextResponse.json({ journeyId: null, priorMarriageBeneficiary: "", marriageEnd: "" });
    }

    const caseProfile = await caseDataService.getCaseProfile(journeyId);
    return NextResponse.json({
      journeyId,
      priorMarriageBeneficiary: readFlag(caseProfile, PRIOR_KEY),
      marriageEnd: readFlag(caseProfile, END_KEY),
    });
  } catch (error) {
    console.error("[journey/marriage-check] GET error:", error);
    // Soft-fail: the modal treats this as "no journey answer to compare against".
    return NextResponse.json({ journeyId: null, priorMarriageBeneficiary: "", marriageEnd: "" });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const howEnded = body?.howEnded === "death" ? "death" : "divorce";

    const journeyId = await findIr1JourneyId(supabase, user.id);
    if (!journeyId) {
      // No journey to update — not an error; nothing to overwrite.
      return NextResponse.json({ success: true, updated: false });
    }

    // Overwrite the earlier step answer: the beneficiary WAS previously married.
    await caseDataService.setCaseData(journeyId, PRIOR_KEY, "yes", {
      is_verified: true,
      source: "form_extraction",
      source_reference: "document-ocr:divorce",
    });
    await caseDataService.setCaseData(journeyId, END_KEY, howEnded, {
      is_verified: true,
      source: "form_extraction",
      source_reference: "document-ocr:divorce",
    });

    return NextResponse.json({ success: true, updated: true });
  } catch (error) {
    console.error("[journey/marriage-check] POST error:", error);
    return NextResponse.json({ error: msg(E.CASE_DATA_SAVE_FAILED) }, { status: 500 });
  }
}

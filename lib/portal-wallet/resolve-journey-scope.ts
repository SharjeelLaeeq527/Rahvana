
import { NextResponse } from "next/server";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

export async function resolveJourneyScope(
  supabase: SupabaseClient,
  userId: string,
  journeyId: string | null | undefined,
  candidateId?: string | null
) {
  if (!journeyId) {
    return {
      error: NextResponse.json(
        { error: "journeyId is required" },
        { status: 400 }
      ),
      scope: null,
    };
  }

  const normalizedCandidateId =
    candidateId?.trim() || "candidate-1";

  const { data: journey, error } = await supabase
    .from("journeys")
    .select("id")
    .eq("id", journeyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Portal Wallet journey validation failed:", error);

    return {
      error: NextResponse.json(
        { error: "Failed to validate journey" },
        { status: 500 }
      ),
      scope: null,
    };
  }

  if (!journey) {
    return {
      error: NextResponse.json(
        { error: "Journey not found" },
        { status: 404 }
      ),
      scope: null,
    };
  }

  return {
    error: null,
    scope: {
      journeyId: journey.id,
      candidateId: normalizedCandidateId,
    },
  };
}

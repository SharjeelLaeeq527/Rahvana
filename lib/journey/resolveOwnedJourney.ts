import type { SupabaseClient } from "@supabase/supabase-js";
import { getCandidateJourneyKey } from "@/lib/candidate/candidateSyncService";
import { isSameJourneyType } from "@/lib/document-vault/journey-mapping";

export type OwnedJourney = {
  id: string;
  journey_type: string;
  subscription_tier: string | null;
  status: string | null;
};

/** How a client names its journey: the row id, or a slug/category + candidate. */
export type JourneyRef = {
  journeyId?: string | null;
  /** Visa category or journey slug (e.g. "IR-1", "ir1-journey"). */
  journeyCategory?: string | null;
  candidateId?: string | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Find a journey that `userId` owns. Every query is filtered by the user id, so a
 * client can never borrow another user's journey (or its plan tier). Embedded
 * tools sometimes only know a slug ("ir1-journey") instead of the row id, so a
 * non-UUID id is treated as the category and matched with the candidate on the
 * canonical journey identity (same rule as the vault / switcher).
 * Returns null when nothing matches or the read fails (fail closed).
 */
export async function resolveOwnedJourney(
  supabase: SupabaseClient,
  userId: string,
  ref: JourneyRef
): Promise<OwnedJourney | null> {
  const columns = "id, journey_type, subscription_tier, status";
  const journeyId = typeof ref.journeyId === "string" ? ref.journeyId.trim() : "";

  if (UUID_RE.test(journeyId)) {
    const { data, error } = await supabase
      .from("journeys")
      .select(columns)
      .eq("id", journeyId)
      .eq("user_id", userId)
      .maybeSingle();
    return error || !data ? null : (data as OwnedJourney);
  }

  const category = (ref.journeyCategory || journeyId || "").trim();
  if (!category) return null;

  const { data, error } = await supabase.from("journeys").select(columns).eq("user_id", userId);
  if (error || !Array.isArray(data)) return null;

  const wanted = getCandidateJourneyKey(category, ref.candidateId);
  return ((data as OwnedJourney[]).find((j) => isSameJourneyType(j.journey_type, wanted)) ??
    null) as OwnedJourney | null;
}

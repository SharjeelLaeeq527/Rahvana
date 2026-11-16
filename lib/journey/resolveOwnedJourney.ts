import type { SupabaseClient } from "@supabase/supabase-js";
import type { CandidateProfile } from "@/types/candidate";
import { canonicalJourneyKey, resolveCandidateJourneyKey } from "@/lib/candidate/candidateKeys";

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
 * canonical journey key resolved from the roster: a candidate of the same category pool
 * selects its own slot journey; a candidate of another pool resolves to the category's
 * slot-1 journey (never another category's row).
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

  const [{ data, error }, { data: profileRow, error: profileError }] = await Promise.all([
    supabase.from("journeys").select(columns).eq("user_id", userId),
    supabase.from("user_profiles").select("profile_details").eq("id", userId).maybeSingle(),
  ]);
  if (error || !Array.isArray(data) || profileError) return null;

  const details = (profileRow?.profile_details || {}) as { candidates?: unknown };
  const roster = Array.isArray(details.candidates) ? (details.candidates as CandidateProfile[]) : [];
  const wanted = resolveCandidateJourneyKey(roster, category, ref.candidateId);
  if (!wanted) return null;

  const matches = (data as OwnedJourney[]).filter(
    (j) => canonicalJourneyKey(j.journey_type) === wanted
  );
  // Variant rows of one journey: prefer the paid one (same rule as initialize).
  return (
    matches.find((j) => (j.subscription_tier || "free").toLowerCase() !== "free") ??
    matches[0] ??
    null
  );
}

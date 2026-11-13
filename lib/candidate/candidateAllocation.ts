// lib/candidate/candidateAllocation.ts
// ============================================================================
// Server-side inputs for allocating a new candidate (candidate/create, Stripe
// provisioning):
//  - highWater: the highest candidate id number ever issued, so a deleted id is never
//    handed to a new candidate (rows tagged with the old candidate_id would otherwise
//    attach to the new person).
//  - blockedKeys: canonical journey keys a new candidate may NOT take over yet, because
//    data of a previous owner is still stored under them.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CandidateProfile } from "@/types/candidate";
import { UNKNOWN_VISA_CATEGORY } from "./visaCategory";
import { candidateIdNumber, parseJourneyKey } from "./candidateKeys";

/** profile_details key holding the highest candidate id number ever issued (server-owned). */
export const CANDIDATE_ID_HIGH_WATER_KEY = "candidateIdHighWater";

/** Tables whose rows carry a candidate_id. Scanned so an id still in use is never reissued. */
export const CANDIDATE_TAGGED_TABLES = [
  "user_guides",
  "app_notifications",
  "notifications",
  "scheduled_notifications",
  "ceac_case_status",
  "appointments",
  "portal_wallet_credentials",
  "interview_prep_sessions",
  "consultation_bookings",
] as const;

/** A canonical key we treat as a real journey key (known base category). */
function journeyKeyOf(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "";
  const parsed = parseJourneyKey(raw);
  if (!parsed.key || parsed.base === UNKNOWN_VISA_CATEGORY) return "";
  // "candidate-2" (a candidate-keyed customization) parses to a junk base; only
  // visa-category bases such as IR-5 / CR-1 / F-1 count as journey keys.
  if (!/^[A-Z]{1,3}-\d/.test(parsed.base)) return "";
  return parsed.key;
}

function objectKeys(value: unknown): string[] {
  return value && typeof value === "object" && !Array.isArray(value) ? Object.keys(value) : [];
}

/**
 * Journey keys that profile_details still references: the legacy stored tier map
 * (journeyTiers / journey_tiers) and journeyCustomizations (cover name / image).
 */
export function profileBlockedKeys(profileDetails: Record<string, unknown>): Set<string> {
  const keys = new Set<string>();
  for (const k of [
    ...objectKeys(profileDetails.journeyTiers),
    ...objectKeys(profileDetails.journey_tiers),
    ...objectKeys(profileDetails.journeyCustomizations),
  ]) {
    const key = journeyKeyOf(k);
    if (key) keys.add(key);
  }
  return keys;
}

export interface AllocationState {
  highWater: number;
  blockedKeys: Set<string>;
  /** The user's journey rows (id, journey_type, subscription_tier). */
  journeys: Array<{ id: string; journey_type: string; subscription_tier: string | null }>;
}

/**
 * Reads everything a new candidate's id and slot depend on. Reads that fail are
 * treated conservatively: a failed journeys / drafts read throws (the caller answers
 * 500 instead of risking a slot that still holds data); a failed candidate-tag scan
 * only skips that table (the stored high-water mark still applies).
 */
export async function loadAllocationState(
  supabase: SupabaseClient,
  userId: string,
  profileDetails: Record<string, unknown>,
  roster: ReadonlyArray<Pick<CandidateProfile, "id">>
): Promise<AllocationState> {
  const [journeysRes, draftsRes] = await Promise.all([
    supabase.from("journeys").select("id, journey_type, subscription_tier").eq("user_id", userId),
    supabase.from("visa_forms_draft").select("journey_key").eq("user_id", userId),
  ]);
  if (journeysRes.error) throw new Error(`journeys read failed: ${journeysRes.error.message}`);
  if (draftsRes.error) throw new Error(`visa_forms_draft read failed: ${draftsRes.error.message}`);

  const blockedKeys = profileBlockedKeys(profileDetails);
  for (const row of journeysRes.data ?? []) {
    const key = journeyKeyOf(row?.journey_type);
    if (key) blockedKeys.add(key);
  }
  for (const row of draftsRes.data ?? []) {
    const key = journeyKeyOf(row?.journey_key);
    if (key) blockedKeys.add(key);
  }

  const stored = Number(profileDetails[CANDIDATE_ID_HIGH_WATER_KEY]);
  let highWater = Number.isInteger(stored) && stored > 0 ? stored : 0;
  for (const c of roster) {
    const n = candidateIdNumber(c?.id);
    if (n !== null && n > highWater) highWater = n;
  }

  const scans = await Promise.all(
    CANDIDATE_TAGGED_TABLES.map((table) =>
      supabase
        .from(table)
        .select("candidate_id")
        .eq("user_id", userId)
        .like("candidate_id", "candidate-%")
        .limit(1000)
        .then(
          (res) => (res.error ? [] : (res.data ?? [])),
          () => []
        )
    )
  );
  for (const rows of scans) {
    for (const row of rows as Array<{ candidate_id?: string | null }>) {
      const n = candidateIdNumber(row?.candidate_id);
      if (n !== null && n > highWater) highWater = n;
    }
  }

  return {
    highWater,
    blockedKeys,
    journeys: (journeysRes.data ?? []) as AllocationState["journeys"],
  };
}

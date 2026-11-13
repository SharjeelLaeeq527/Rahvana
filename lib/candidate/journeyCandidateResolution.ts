// lib/candidate/journeyCandidateResolution.ts
// ============================================================================
// Which candidate a journey page shows. The URL decides the CATEGORY; the active
// candidate is aligned to a candidate of that category's pool:
//   1. `?candidateId=` when that candidate belongs to the pool;
//   2. the active candidate when it already belongs to the pool;
//   3. the candidate last used in the pool (per-pool sessionStorage map);
//   4. the pool's slot-1 candidate.
// When the pool has no candidate, null: the page loads the category's base journey
// without a candidate and never creates one.
//
// Pure, so the page can compute it during render and the very first
// /api/journeys/initialize request already carries the right candidate.
// ============================================================================

import type { CandidateProfile } from "@/types/candidate";
import { getCandidateSlot, poolMembers, slotPool } from "./candidateKeys";

export interface JourneyCandidateInput {
  /** Category from the URL (e.g. "ir-2", "IR-5", "ir2-journey"). */
  category: string;
  roster: ReadonlyArray<CandidateProfile>;
  urlCandidateId?: string | null;
  activeCandidateId?: string | null;
  /** Pool -> candidate id last used in that pool. */
  lastUsedByPool?: Readonly<Record<string, string>>;
}

export function resolveJourneyCandidate(input: JourneyCandidateInput): CandidateProfile | null {
  const members = poolMembers(input.roster, input.category);
  if (members.length === 0) return null;

  const byId = (id?: string | null) => (id ? members.find((c) => c.id === id) : undefined);

  return (
    byId(input.urlCandidateId) ??
    byId(input.activeCandidateId) ??
    byId(input.lastUsedByPool?.[slotPool(input.category)]) ??
    members.find((c) => getCandidateSlot(c) === 1) ??
    members[0]
  );
}

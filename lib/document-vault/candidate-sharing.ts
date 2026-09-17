// Candidate sharing + roster helpers for multi-candidate journeys (IR-5+).
//
// A "candidate" is a sub-scope inside ONE journey's vault (e.g. Parent 1 / Parent 2 in an
// IR-5 case). This module is the single source of truth for:
//   1. whether a given document type may be shared across candidates, and
//   2. the roster rules (labels, per-category cap, next id, share targets).
//
// The DATA MODEL and these helpers are N-candidate capable. The per-category UI cap
// (e.g. IR-5 = 2) is expressed only via getMaxCandidates() so future categories such as
// IR-2 can raise it without touching queries or business logic.
//
// Keep this logic OUT of components. See docs/IR5-DOCUMENT-VAULT-MULTI-CANDIDATE-PLAN.md.

import { DocumentDefinition, DocumentRole, VaultCandidate } from "./types";

/** Roles whose documents belong to the shared U.S.-citizen side, not an individual candidate. */
const SHARED_ROLES: DocumentRole[] = ["PETITIONER", "JOINT_SPONSOR", "HOUSEHOLD_MEMBER"];

/**
 * Whether a document type may be shared across candidates.
 *
 * Default rule: a document is shareable only if EVERY one of its roles is a shared role
 * (petitioner / joint sponsor / household member) - those documents belong to the shared
 * sponsor and are identical for every candidate's case. Any BENEFICIARY role makes it
 * candidate-specific (each parent's own passport, CNIC, birth cert, marriage, police...).
 *
 * An explicit `shareableAcrossCandidates` on the definition overrides the default in
 * either direction (e.g. a "both parents' marriage certificate" can be forced shareable).
 */
export function isDocumentShareableAcrossCandidates(def: DocumentDefinition): boolean {
  if (def.shareableAcrossCandidates === true) return true;
  if (def.shareableAcrossCandidates === false) return false;

  const roles = def.roles ?? [];
  if (roles.length === 0) return false;
  return roles.every((r) => SHARED_ROLES.includes(r));
}

// ── Roster helpers ─────────────────────────────────────────────────────────────────────

/** Normalize a journey type / visa category to a lowercase alnum key (ir5, ir2, ir1...). */
function normalizeJourneyType(journeyType?: string | null): string {
  return (journeyType ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Max candidates the UI allows for a journey type. This is a UI/business cap ONLY; the
 * data model and the rest of this module do not assume it. IR-5 = 2 parents. Everything
 * else is single-candidate today (future categories like IR-2 can raise their entry).
 */
export function getMaxCandidates(journeyType?: string | null): number {
  const key = normalizeJourneyType(journeyType);
  const caps: Record<string, number> = {
    ir5: 2,
  };
  return caps[key] ?? 1;
}

/** Whether this journey type uses the multi-candidate vault UI at all. */
export function isMultiCandidateJourney(journeyType?: string | null): boolean {
  return getMaxCandidates(journeyType) > 1;
}

/** Human label for the Nth candidate (1-based) of a journey type. */
export function getCandidateLabel(journeyType: string | null | undefined, index: number): string {
  const key = normalizeJourneyType(journeyType);
  if (key === "ir5") return `Parent ${index}`;
  return `Candidate ${index}`;
}

/** The default single-candidate roster for a journey type ([] for non-multi journeys). */
export function getDefaultCandidates(journeyType?: string | null): VaultCandidate[] {
  if (!isMultiCandidateJourney(journeyType)) return [];
  return [{ id: "candidate_1", label: getCandidateLabel(journeyType, 1) }];
}

/**
 * Next candidate to append, or null if the roster is already at the journey's cap.
 * Ids are stable ("candidate_1", "candidate_2", ...); the numeric suffix is one past the
 * current highest so ids never collide even after a middle candidate was removed.
 */
export function getNextCandidate(
  journeyType: string | null | undefined,
  candidates: VaultCandidate[]
): VaultCandidate | null {
  const max = getMaxCandidates(journeyType);
  if (candidates.length >= max) return null;

  let highest = 0;
  for (const c of candidates) {
    const m = /^candidate_(\d+)$/.exec(c.id);
    if (m) highest = Math.max(highest, Number(m[1]));
  }
  const nextIndex = Math.max(highest, candidates.length) + 1;
  return { id: `candidate_${nextIndex}`, label: getCandidateLabel(journeyType, candidates.length + 1) };
}

/** Whether an id refers to a real candidate in the roster. */
export function isValidCandidateId(candidates: VaultCandidate[], id?: string | null): boolean {
  if (!id) return false;
  return candidates.some((c) => c.id === id);
}

/** All candidates except the active one (the cross-share targets). */
export function getOtherCandidates(
  candidates: VaultCandidate[],
  activeId?: string | null
): VaultCandidate[] {
  return candidates.filter((c) => c.id !== activeId);
}

/**
 * The candidates a document may be cross-shared to from the upload modal:
 * the OTHER candidates, but only when the document type is shareable and the journey is
 * actually multi-candidate. Returns [] otherwise (modal then hides the share block).
 * Pure selector so it is trivially testable and keeps logic out of the component.
 */
export function getCandidateShareTargets(
  def: DocumentDefinition,
  candidates: VaultCandidate[],
  activeCandidateId?: string | null
): VaultCandidate[] {
  if (!candidates || candidates.length < 2) return [];
  if (!isDocumentShareableAcrossCandidates(def)) return [];
  return getOtherCandidates(candidates, activeCandidateId);
}

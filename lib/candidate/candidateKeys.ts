// lib/candidate/candidateKeys.ts
// ============================================================================
// Candidate identity, per-category numbering and journey keys.
//
// Two separate numbers:
//  - `id` ("candidate-N") is account-wide and never reused. Every candidate_id column
//    (guides, notifications, appointments, CEAC, wallet, interview prep, services)
//    keys on it.
//  - `categorySlot` numbers a candidate inside its category POOL. The journey key and
//    the default label come from it, so an IR-2 child added after two IR-5 parents is
//    "IR-2 Candidate 1" on journey `ir2`, not `ir2_candidate3`.
//
// Pools: IR-5 | IR-2 + CR-2 (shared: CR-2 is provisioned on the IR-2 journey) |
// IR-1 + CR-1 | every other category on its own.
//
// A candidate saved before `categorySlot` existed has no slot; its slot is the number
// in its id. That keeps every existing journey key unchanged until the data migration.
//
// Pure functions only (safe on the client and the server).
// ============================================================================

import type { CandidateProfile } from "@/types/candidate";
import { getBaseVisaCategory, UNKNOWN_VISA_CATEGORY } from "./visaCategory";
import { journeyBaseCategory } from "@/lib/journey/journeyConfig";

type CandidateLike = {
  id: string;
  visaCategory?: string | null;
  categorySlot?: number | null;
};

const ID_RE = /^candidate-(\d+)$/i;
const KEY_SLOT_RE = /candidate[-_]?(\d+)/i;

/** "candidate-7" -> 7. Null for anything else (uuids, malformed ids). */
export function candidateIdNumber(id?: string | null): number | null {
  const match = ID_RE.exec(String(id ?? "").trim());
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Next account-wide id: one above the highest id ever issued. `highWater` is the
 * stored high-water mark (profile_details.candidateIdHighWater) plus any id still
 * referenced by candidate-tagged rows, so a deleted id is never handed out again.
 */
export function nextCandidateId(
  roster: ReadonlyArray<Pick<CandidateProfile, "id">>,
  highWater = 0
): string {
  let max = Number.isInteger(highWater) && highWater > 0 ? highWater : 0;
  for (const c of roster) {
    const n = candidateIdNumber(c?.id);
    if (n !== null && n > max) max = n;
  }
  return `candidate-${max + 1}`;
}

/** Numbering pool of a category: IR-2/CR-2 -> "IR-2", IR-1/CR-1 -> "IR-1", else its base. */
export function slotPool(visaCategory?: string | null): string {
  const base = getBaseVisaCategory(visaCategory);
  if (base === "IR-2" || base === "CR-2") return "IR-2";
  if (base === "IR-1" || base === "CR-1") return "IR-1";
  return base;
}

export function isSamePool(a?: string | null, b?: string | null): boolean {
  const pa = slotPool(a);
  return pa !== UNKNOWN_VISA_CATEGORY && pa === slotPool(b);
}

/** Slot inside the pool. Legacy candidates (no slot) use the number in their id. */
export function getCandidateSlot(candidate: CandidateLike | null | undefined): number {
  if (!candidate) return 1;
  const slot = candidate.categorySlot;
  if (typeof slot === "number" && Number.isInteger(slot) && slot >= 1) return slot;
  return candidateIdNumber(candidate.id) ?? 1;
}

/** Slot 1 of its pool: owns the category's base journey (`ir2`, `ir5`, ...). */
export function isCategoryPrimary(candidate: CandidateLike | null | undefined): boolean {
  return getCandidateSlot(candidate) === 1;
}

/** "ir2" for slot 1, "ir2_candidate2" for slot 2. CR-2 maps to the IR-2 journey. */
export function journeyKeyForSlot(visaCategory: string | null | undefined, slot: number): string {
  const base = journeyBaseCategory(visaCategory).toLowerCase().replace(/[^a-z0-9]/g, "");
  return slot > 1 ? `${base}_candidate${slot}` : base;
}

/** The `journeys.journey_type` key a candidate's journey lives on. */
export function getJourneyKeyForCandidate(candidate: CandidateLike): string {
  return journeyKeyForSlot(candidate.visaCategory, getCandidateSlot(candidate));
}

export interface ParsedJourneyKey {
  /** Journey base category (CR-2 -> IR-2). UNKNOWN for unparseable input. */
  base: string;
  /** 1 for the base journey, N for `<base>_candidateN` / `<base>_candidate-N`. */
  slot: number;
  /** Canonical key, e.g. "ir2_candidate2". */
  key: string;
}

/** "ir5_candidate-2" / "IR5_candidate2" / "ir-5" -> { base: "IR-5", slot }. */
export function parseJourneyKey(journeyType?: string | null): ParsedJourneyKey {
  const raw = String(journeyType ?? "");
  const base = journeyBaseCategory(raw);
  const match = KEY_SLOT_RE.exec(raw);
  const n = match ? Number(match[1]) : 1;
  const slot = Number.isInteger(n) && n >= 1 ? n : 1;
  return { base, slot, key: base === UNKNOWN_VISA_CATEGORY ? "" : journeyKeyForSlot(base, slot) };
}

/** Canonical form of any stored journey key ("" when it does not parse). */
export function canonicalJourneyKey(journeyType?: string | null): string {
  return parseJourneyKey(journeyType).key;
}

/** Pool members, ordered by id number (stable, oldest first). */
export function poolMembers<T extends CandidateLike>(roster: ReadonlyArray<T>, visaCategory?: string | null): T[] {
  return roster
    .filter((c) => c && isSamePool(c.visaCategory, visaCategory))
    .sort(
      (a, b) =>
        (candidateIdNumber(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (candidateIdNumber(b.id) ?? Number.MAX_SAFE_INTEGER)
    );
}

/** The candidate a stored journey key belongs to, or null when no candidate owns it. */
export function findCandidateForJourneyKey<T extends CandidateLike>(
  roster: ReadonlyArray<T>,
  journeyType?: string | null
): T | null {
  const parsed = parseJourneyKey(journeyType);
  if (!parsed.key) return null;
  return (
    poolMembers(roster, parsed.base).find(
      (c) => getJourneyKeyForCandidate(c) === parsed.key
    ) ?? null
  );
}

/** The pool's slot-1 candidate, if any. */
export function categoryPrimaryOf<T extends CandidateLike>(
  roster: ReadonlyArray<T>,
  visaCategory?: string | null
): T | null {
  return poolMembers(roster, visaCategory).find((c) => getCandidateSlot(c) === 1) ?? null;
}

/**
 * Journey key for (category, candidate). A candidate from ANOTHER pool (a stale
 * active candidate, a forged id) never produces a key outside the category: it
 * resolves to the category's slot-1 key, so no stray row such as `ir5_candidate3`
 * can be created for an IR-2 child.
 */
export function resolveCandidateJourneyKey(
  roster: ReadonlyArray<CandidateLike>,
  visaCategory: string,
  candidateId?: string | null
): string {
  const candidate = candidateId ? roster.find((c) => c?.id === candidateId) : undefined;
  if (candidate && isSamePool(candidate.visaCategory, visaCategory)) {
    return getJourneyKeyForCandidate(candidate);
  }
  return journeyKeyForSlot(visaCategory, 1);
}

/** Distinct pools on the roster. */
export function rosterPoolCount(roster: ReadonlyArray<CandidateLike>): number {
  return new Set(
    roster.map((c) => slotPool(c?.visaCategory)).filter((p) => p !== UNKNOWN_VISA_CATEGORY)
  ).size;
}

const DEFAULT_LABEL_RE = /^candidate\s*\d+$/i;

/**
 * Display label. A custom name always wins. A default "Candidate N" label is shown
 * as "Candidate {slot}", prefixed with the category ("IR-2 Candidate 1") only when
 * the roster spans two or more pools, so IR-5-only accounts look exactly as before.
 */
export function formatCandidateLabel(
  candidate: CandidateLike & { label?: string; customName?: string },
  roster: ReadonlyArray<CandidateLike>
): string {
  if (candidate.customName) return candidate.customName;
  const label = (candidate.label || "").trim();
  if (label && !DEFAULT_LABEL_RE.test(label)) return label;
  const generic = `Candidate ${getCandidateSlot(candidate)}`;
  if (rosterPoolCount(roster) < 2) return generic;
  const base = getBaseVisaCategory(candidate.visaCategory);
  return base === UNKNOWN_VISA_CATEGORY ? generic : `${base} ${generic}`;
}

/**
 * Lowest slot that is free in the pool: no remaining candidate uses it AND its
 * journey key is not in `blockedKeys` (canonical keys of leftover journey rows,
 * form drafts, stored tier entries or customizations). Existing candidates are
 * never renumbered.
 */
export function nextCategorySlot(
  roster: ReadonlyArray<CandidateLike>,
  visaCategory: string,
  blockedKeys: ReadonlySet<string> = new Set()
): number {
  const used = new Set(poolMembers(roster, visaCategory).map((c) => getCandidateSlot(c)));
  for (let n = 1; n < 10_000; n++) {
    if (used.has(n)) continue;
    if (blockedKeys.has(journeyKeyForSlot(visaCategory, n))) continue;
    return n;
  }
  throw new Error("No free category slot");
}

/**
 * candidate_id to tag rows of a journey with: the roster candidate that owns the journey
 * key (by category slot). Without an owner, the id the key implied before category slots
 * existed ("ir5_candidate2" -> "candidate-2", base -> "candidate-1"), which is what every
 * pre-slot row was tagged with.
 */
export function candidateIdForJourneyKey(
  roster: ReadonlyArray<CandidateLike>,
  journeyType?: string | null
): string {
  const owner = findCandidateForJourneyKey(roster, journeyType);
  if (owner) return owner.id;
  const slot = parseJourneyKey(journeyType).slot;
  return `candidate-${slot}`;
}

/** Reads the roster from a profile_details value (anything not an array -> []). */
export function rosterFromProfileDetails(profileDetails: unknown): CandidateProfile[] {
  const details = profileDetails && typeof profileDetails === "object" ? profileDetails : {};
  const candidates = (details as { candidates?: unknown }).candidates;
  return Array.isArray(candidates) ? (candidates as CandidateProfile[]) : [];
}

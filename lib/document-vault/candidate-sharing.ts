// Cross-candidate document-sharing relevance (multi-candidate journeys, e.g. IR-5 two
// parents). Single source of truth for "may this document be shared with another
// candidate (another parent) in the same case?".
//
// Sharing between candidates rides the existing cross-JOURNEY share (each candidate is its
// own journey). This module only decides WHICH documents are offered for that share when
// the target journey is a sibling candidate, so parent-specific documents (passport, CNIC,
// birth certificate, medical, ...) are never offered, while shared petitioner/sponsor
// documents are.
//
// Keep this logic OUT of components (config-driven, testable).

import { DocumentDefinition, DocumentRole } from "./types";

/** Roles whose documents belong to the shared U.S.-citizen side, not an individual candidate. */
const SHARED_ROLES: DocumentRole[] = ["PETITIONER", "JOINT_SPONSOR", "HOUSEHOLD_MEMBER"];

/**
 * Whether a document type may be shared with a sibling candidate (another parent).
 *
 * Default rule: shareable only if EVERY role is a shared role (petitioner / joint sponsor /
 * household member) - those documents are identical for every candidate's case. Any
 * BENEFICIARY role makes it candidate-specific (each parent's own passport, CNIC, birth
 * certificate, marriage, police, medical...).
 *
 * An explicit `shareableAcrossCandidates` on the definition overrides the default in either
 * direction (e.g. the petitioner's own parents' marriage certificate carries a BENEFICIARY
 * role but is the SAME document for both parents, so it is flagged shareable).
 */
export function isDocumentShareableAcrossCandidates(def: DocumentDefinition): boolean {
  if (def.shareableAcrossCandidates === true) return true;
  if (def.shareableAcrossCandidates === false) return false;

  const roles = def.roles ?? [];
  if (roles.length === 0) return false;
  return roles.every((r) => SHARED_ROLES.includes(r));
}

/**
 * Candidate tag stored on a STANDALONE service booking (Medical / Police) made for someone
 * who is not one of the account's beneficiaries ("Someone else" in the Booking for picker).
 * Such rows belong to the account, so beneficiary-filtered lists always include them.
 */
export const SOMEONE_ELSE_CANDIDATE_ID = "someone-else";

/** True when a service row was booked for "Someone else". */
export function isSomeoneElseRow(row: {
  candidate_id?: string | null;
  metadata?: { candidate_id?: string | null } | null;
}): boolean {
  return (
    row.candidate_id === SOMEONE_ELSE_CANDIDATE_ID ||
    row.metadata?.candidate_id === SOMEONE_ELSE_CANDIDATE_ID
  );
}

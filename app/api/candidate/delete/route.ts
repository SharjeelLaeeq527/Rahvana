// app/api/candidate/delete/route.ts
// Delete a candidate. Rules and cleanup live in lib/candidate/deleteCandidate.ts.

import { handleCandidateDelete } from "@/lib/candidate/deleteCandidate";
import { requireActiveSessionForRequest } from "@/lib/security/session-guard";

export async function POST(request: Request) {
  const sessionGuard = await requireActiveSessionForRequest(request);
  if (!sessionGuard.ok) return sessionGuard.response;

  return handleCandidateDelete(request);
}

// app/api/candidate/delete/route.ts
// Delete a candidate. Rules and cleanup live in lib/candidate/deleteCandidate.ts.

import { handleCandidateDelete } from "@/lib/candidate/deleteCandidate";

export async function POST(request: Request) {
  return handleCandidateDelete(request);
}

// lib/interview-prep/case-access.ts
//
// Spouse collaboration: decide how the authenticated caller may act on a given
// interview session. Interview data is per-user (every data-access query is
// `user_id`-scoped), so by default only the session's owner can read/write it.
//
// For a SHARED CASE, both spouses work on ONE interview — the beneficiary owns
// the session, and the petitioner (the other case member) may also view, edit
// and practise it. When the caller is a case member who is NOT the owner, we
// return an `ActingContext` (service-role client + the owner's id) that the
// data-access layer uses to operate on the owner's session on the member's
// behalf. Membership is verified here with `is_journey_member` before any
// elevated access is granted — the data-access layer trusts this gate.

import { verifyAuth } from "@/lib/api/journey-auth";
import { getAdminClient, resolveActiveJourneyId } from "@/lib/case-collaboration/helpers";
import type { ActingContext } from "./data-access";

export type SessionAccess =
  | { ok: false; status: number; error: string }
  | { ok: true; mode: "owner"; callerId: string; ownerId: string; acting?: undefined }
  | { ok: true; mode: "delegate"; callerId: string; ownerId: string; acting: ActingContext };

/**
 * Resolve the authenticated caller's access to `sessionId`.
 *  - 'owner'    → the caller owns the session (use the normal user-scoped path;
 *                 `acting` is undefined).
 *  - 'delegate' → the caller is a case member acting on the owner's shared
 *                 session (pass `acting` into the data-access functions).
 *  - ok:false   → 401 (unauthenticated) / 404 (no such session) / 403 (not the
 *                 owner and not a member of the owner's case).
 */
export async function resolveSessionAccess(sessionId: string): Promise<SessionAccess> {
  if (!sessionId || sessionId === "undefined") {
    return { ok: false, status: 400, error: "Invalid session ID" };
  }

  const auth = await verifyAuth();
  if ("error" in auth) return { ok: false, status: 401, error: "Authentication required" };
  const callerId = auth.user.id;

  const admin = getAdminClient();

  const { data: sessionRow } = await admin
    .from("interview_prep_sessions")
    .select("user_id")
    .eq("id", sessionId)
    .maybeSingle();

  const ownerId = (sessionRow as { user_id: string } | null)?.user_id ?? null;
  if (!ownerId) return { ok: false, status: 404, error: "Session not found" };

  // The caller owns it → normal per-user path.
  if (ownerId === callerId) {
    return { ok: true, mode: "owner", callerId, ownerId };
  }

  // Otherwise the caller and the owner must belong to the SAME shared case.
  let journeyId: string | null = null;
  try {
    journeyId = await resolveActiveJourneyId(admin, callerId);
  } catch {
    journeyId = null;
  }

  if (journeyId) {
    const [{ data: callerMember }, { data: ownerMember }] = await Promise.all([
      admin.rpc("is_journey_member", { p_journey_id: journeyId, p_uid: callerId }),
      admin.rpc("is_journey_member", { p_journey_id: journeyId, p_uid: ownerId }),
    ]);

    if (callerMember && ownerMember) {
      let email: string | null = null;
      try {
        const { data: ownerInfo } = await admin.auth.admin.getUserById(ownerId);
        email = ownerInfo?.user?.email ?? null;
      } catch {
        email = null;
      }
      return {
        ok: true,
        mode: "delegate",
        callerId,
        ownerId,
        acting: { client: admin, userId: ownerId, email },
      };
    }
  }

  return { ok: false, status: 403, error: "You don't have access to this interview session" };
}

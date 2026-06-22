// lib/case-collaboration/activity.ts
// Best-effort audit logging for the shared case. Every entry records who did
// what, when, plus a SNAPSHOT of the actor's case_role at the time so a later
// role swap never rewrites the past. See spec §13b.
//
// IMPORTANT: logging must NEVER break the real action. Every call is wrapped in
// try/catch and resolves regardless of outcome. Callers should NOT await-block
// the user response on this beyond a quick fire-and-forget.

import { getAdminClient } from "@/lib/case-collaboration/helpers";

export type CaseActivityAction =
  | "document.upload"
  | "document.delete"
  | "form.save"
  | "form.complete"
  | "step.complete"
  | "step.reopen"
  | "role.assign";

interface LogArgs {
  journeyId: string | null | undefined;
  actorUserId: string | null | undefined;
  action: CaseActivityAction;
  targetLabel?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Append one entry to the shared case's activity feed. Resolves the actor's
 * current case_role (owner | petitioner | beneficiary | null) and freezes it on
 * the row. No-ops silently when there's no journey (solo/pre-case user) or on
 * any error — logging is never allowed to fail the underlying action.
 */
export async function logCaseActivity({
  journeyId,
  actorUserId,
  action,
  targetLabel = null,
  metadata = {},
}: LogArgs): Promise<void> {
  try {
    if (!journeyId) return; // No shared case to attribute the action to.

    const admin = getAdminClient();

    // Snapshot the actor's role at the time of the action. Prefer an assigned
    // case_role; fall back to 'owner' when this user owns the journey but has no
    // case_role yet (solo owner before roles are chosen).
    let actorRole: string | null = null;
    if (actorUserId) {
      const { data: collab } = await admin
        .from("case_collaborators")
        .select("case_role, membership_role")
        .eq("journey_id", journeyId)
        .eq("user_id", actorUserId)
        .eq("status", "active")
        .maybeSingle();

      const row = collab as { case_role: string | null; membership_role: string | null } | null;
      if (row?.case_role === "petitioner" || row?.case_role === "beneficiary") {
        actorRole = row.case_role;
      } else if (row?.membership_role === "owner") {
        actorRole = "owner";
      }
    }

    await admin.from("case_activity").insert({
      journey_id: journeyId,
      actor_user_id: actorUserId ?? null,
      actor_role: actorRole,
      action,
      target_label: targetLabel,
      metadata,
    });
  } catch (err) {
    // Swallow — the real action already succeeded; the log is a nicety.
    console.error("[logCaseActivity] failed (non-fatal):", err);
  }
}

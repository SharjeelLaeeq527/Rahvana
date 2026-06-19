// lib/case-collaboration/helpers.ts
// Shared helpers for the spouse-collaboration invite flow.
// See docs/partner-collaboration-spec.md (§4, §8, §10).

import crypto from "crypto";
import { createClient as createAdminClientRaw } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses RLS — use ONLY server-side, and ONLY
 * after the caller's identity/ownership has been verified. Token validation and
 * collaborator/invite writes go through this (see spec §5.2 / §8).
 */
export function getAdminClient() {
  return createAdminClientRaw(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Generate a raw, single-use invite token. The raw value is emailed; only its
 *  hash is stored (spec §4.2 security note). */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** SHA-256 hash of a token, hex-encoded. Stored in case_invites.token_hash. */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/** Mask an email for display in the wrong-email error state (spec §10):
 *  "alice@gmail.com" -> "a••••@gmail.com". */
export function maskEmail(email: string): string {
  const [local, domain] = String(email).split("@");
  if (!domain) return "•••••";
  const first = local.slice(0, 1);
  return `${first}${"•".repeat(Math.max(local.length - 1, 3))}@${domain}`;
}

/** Normalize an email for comparison (lowercase + trim). */
export function normalizeEmail(email: string | null | undefined): string {
  return String(email ?? "").trim().toLowerCase();
}

/**
 * Resolve the journey (case) a user belongs to, so per-user data can be scoped
 * to the SHARED case instead of the individual account. Both spouses resolve to
 * the SAME journey: the owner via their own journey row; an invited partner —
 * who typically has no journey of their own — via their active collaborator row
 * (which points at the owner's journey). Mirrors the resolution in
 * app/(main)/settings/page.tsx so the whole app agrees on "the current case".
 *
 * Pass any Supabase client whose RLS lets the user read their own journey +
 * collaborator row (the authed server client works), or a service-role client.
 * Returns the journey id, or null if the user has no case yet.
 */
export async function resolveActiveJourneyId(
  // Minimal shape — works with both the SSR server client and the admin client.
  supabase: { from: (table: string) => any },
  userId: string
): Promise<string | null> {
  const { data: own } = await supabase
    .from("journeys")
    .select("id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const ownId = (own as { id: string } | null)?.id ?? null;
  if (ownId) return ownId;

  const { data: collab } = await supabase
    .from("case_collaborators")
    .select("journey_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (collab as { journey_id: string } | null)?.journey_id ?? null;
}

/**
 * The caller's case_role for a journey: 'petitioner' | 'beneficiary' | null.
 * null means no active collaborator row, or a role not yet assigned (solo owner
 * before any role is chosen — see 20260617_clear_default_owner_roles). BOTH the
 * owner and the invited partner have a case_collaborators row, so this resolves
 * for either spouse.
 *
 * Used to gate role-specific behaviour — notably interview prep, where only the
 * BENEFICIARY edits/practices and the PETITIONER is read-only (the beneficiary
 * sits the IR-1 interview). Pass the admin client when this gates a write, so
 * the lookup isn't itself subject to the caller's RLS. See spec §7.1 / §13.
 */
export async function getCaseRole(
  supabase: { from: (table: string) => any },
  journeyId: string,
  userId: string
): Promise<"petitioner" | "beneficiary" | null> {
  const { data } = await supabase
    .from("case_collaborators")
    .select("case_role")
    .eq("journey_id", journeyId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  const role = (data as { case_role: string | null } | null)?.case_role ?? null;
  return role === "petitioner" || role === "beneficiary" ? role : null;
}

const PAID_TIERS = new Set(["basic", "premium", "executive", "core", "plus", "pro"]);

/** True if the raw DB subscription_tier represents an active PAID plan
 *  (free / null are not paid). Inviting a spouse requires a paid owner. */
export function isPaidTier(rawTier: string | null | undefined): boolean {
  return PAID_TIERS.has(String(rawTier ?? "").trim().toLowerCase());
}

export const INVITE_EXPIRY_DAYS = 7;

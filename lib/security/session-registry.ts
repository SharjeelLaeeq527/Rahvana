/**
 * Registers verified sessions and provides the active-check and heartbeat operations used by security routes.
 */
import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSecurityAdmin } from "@/lib/security/security-admin";
import { getSecurityContext, type SecurityContext } from "@/lib/security/security-context";

export async function registerVerifiedSession(
  supabase: SupabaseClient,
  request: Request | NextRequest
): Promise<{ context: SecurityContext; recordId: string }> {
  const context = await getSecurityContext(supabase, request);
  if (!context) throw new Error("Verified user session required.");

  if (!context.sessionId) {
    throw new Error("A valid application session ID is required for registration.");
  }

  const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
  if (factorsError) throw factorsError;
  const hasVerifiedTotp = (factors?.totp ?? []).some((factor) => factor.status === "verified");
  if (hasVerifiedTotp) {
    // Do not register an MFA-protected account at AAL1.
    const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalError) throw aalError;
    if (aal?.currentLevel !== "aal2") {
      throw new Error("MFA must be completed before registering this session.");
    }
  }

  const { data, error } = await createSecurityAdmin().rpc("register_security_session", {
    p_user_id: context.user.id,
    p_session_id: context.sessionId,
    p_device_name: context.device.deviceName,
    p_browser: context.device.browser,
  });
  if (error || typeof data !== "string") {
    throw new Error(`Session registration failed: ${error?.message ?? "invalid response"}`);
  }

  return { context, recordId: data };
}

/** Returns false for missing/revoked sessions and throws if the registry is unavailable. */
export async function assertActiveSession(
  userId: string,
  sessionId: string,
  signal?: AbortSignal
) {
  const query = createSecurityAdmin().rpc("is_security_session_active", {
    p_user_id: userId,
    p_session_id: sessionId,
  });
  const { data, error } = signal ? await query.abortSignal(signal) : await query;
  if (error) throw new Error(`Session registry check failed: ${error.message}`);
  if (typeof data !== "boolean") {
    throw new Error("Session registry check returned an invalid response.");
  }
  return data;
}

export async function touchSession(userId: string, sessionId: string) {
  // Throttle writes while keeping the session ID and owner constraints in place.
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { error } = await createSecurityAdmin()
    .from("user_sessions")
    .update({ last_active_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .is("revoked_at", null)
    .lt("last_active_at", cutoff);

  if (error) throw new Error(`Session activity update failed: ${error.message}`);
}

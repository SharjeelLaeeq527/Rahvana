/**
 * Writes account security events and safely links failed attempts to accounts.
 * Keep the HMAC key in server-only environment configuration.
 */
import { createHmac } from "node:crypto";
import { createSecurityAdmin } from "@/lib/security/security-admin";
import type { RequestDevice } from "@/lib/security/security-context";

export type LoginFailureReason =
  | "invalid_credentials"
  | "email_unconfirmed"
  | "invalid_mfa"
  | "rate_limited"
  | "account_locked"
  | "provider_error";

const HMAC_KEY_VERSION = 1;

// Lets a later account view match failed attempts without storing the email.
function hmacEmail(email: string): string {
  const secret = process.env.LOGIN_ACTIVITY_HMAC_SECRET;
  if (!secret) throw new Error("LOGIN_ACTIVITY_HMAC_SECRET is not configured.");
  return createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("hex");
}

export async function recordLoginFailure(input: {
  email: string;
  reason: LoginFailureReason;
  device: RequestDevice;
}): Promise<void> {
  const { error } = await createSecurityAdmin()
    .from("login_activity")
    .insert({
      user_id: null,
      event_type: "login_failure",
      identifier_hmac: hmacEmail(input.email),
      identifier_hmac_key_version: HMAC_KEY_VERSION,
      failure_reason: input.reason,
      device_name: input.device.deviceName,
      browser: input.device.browser,
    });
  if (error) throw new Error(`Login activity write failed: ${error.message}`);
}

export async function recordAccountEvent(input: {
  userId: string;
  eventType: "session_revoked" | "logout" | "password_changed" | "mfa_enabled" | "mfa_disabled";
  device?: RequestDevice;
  sessionRecordId?: string | null;
}): Promise<void> {
  const { error } = await createSecurityAdmin()
    .from("login_activity")
    .insert({
      user_id: input.userId,
      event_type: input.eventType,
      session_record_id: input.sessionRecordId ?? null,
      device_name: input.device?.deviceName ?? "Unknown device",
      browser: input.device?.browser ?? "Unknown browser",
    });
  if (error) throw new Error(`Account activity write failed: ${error.message}`);
}

export function getLoginEmailHmac(email: string) {
  return { hash: hmacEmail(email), keyVersion: HMAC_KEY_VERSION };
}

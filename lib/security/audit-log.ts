/**
 * lib/security/audit-log.ts
 *
 * Server-side audit logging utility.
 *
 * Writes security-relevant events to the `audit_logs` Supabase table.
 * Uses the service-role client so it can always write, even for
 * unauthenticated events (e.g. failed signup attempts).
 *
 * IMPORTANT:
 *   - This is fire-and-forget: never blocks or fails the parent request.
 *   - Only use server-side (API routes / middleware). Never import in client components.
 *
 * Usage:
 *   import { auditLog } from '@/lib/security/audit-log'
 *
 *   await auditLog({
 *     userId: user.id,
 *     action: 'auth.signup',
 *     resource: 'profiles',
 *     request,
 *     status: 'success',
 *   })
 */

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Admin Client (service role) ──────────────────────────────────────────────
// We create a dedicated client here rather than importing from lib/supabase/admin
// to avoid circular dependency issues and keep this module self-contained.

const supabaseAudit = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuditLogParams {
  /** The authenticated user's ID. Null/undefined for unauthenticated events. */
  userId?: string | null;
  /** What happened — use dot notation: 'auth.signup', 'portal_wallet.view', etc. */
  action: string;
  /** Which table/resource was affected (optional). */
  resource?: string;
  /** The specific row/entity ID (optional). */
  resourceId?: string;
  /** The incoming request — used to extract IP and User-Agent. */
  request: NextRequest | Request;
  /** Extra action-specific context. Keep small — no PII or secrets. */
  metadata?: Record<string, unknown>;
  /** Event outcome. Defaults to 'success'. */
  status?: "success" | "failure" | "blocked";
}

// ─── IP Extraction ────────────────────────────────────────────────────────────

function extractIp(request: NextRequest | Request): string {
  const headers = request.headers;

  // Vercel: x-forwarded-for (comma-separated, first = client)
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  // Render / nginx: x-real-ip
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Log a security-relevant event to the audit_logs table.
 *
 * This function is **fire-and-forget** — it will never throw or block
 * the calling API route. Errors are silently logged to the server console.
 */
export async function auditLog(params: AuditLogParams): Promise<void> {
  try {
    const {
      userId,
      action,
      resource,
      resourceId,
      request,
      metadata = {},
      status = "success",
    } = params;

    const ip = extractIp(request);
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Fire and forget — don't await in the calling route if you don't need to
    const { error } = await supabaseAudit.from("audit_logs").insert({
      user_id: userId || null,
      action,
      resource: resource || null,
      resource_id: resourceId || null,
      ip_address: ip,
      user_agent: userAgent.slice(0, 500), // Truncate to prevent oversized entries
      metadata,
      status,
    });

    if (error) {
      console.error("[audit-log] Failed to write audit log:", error.message);
    }
  } catch (err) {
    // Never let audit logging crash the parent request
    console.error("[audit-log] Unexpected error:", err);
  }
}

// ─── Convenience Wrappers ─────────────────────────────────────────────────────

/** Log a successful auth event */
export function auditAuthSuccess(
  request: NextRequest | Request,
  action: string,
  userId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  return auditLog({
    userId,
    action,
    resource: "auth",
    request,
    metadata,
    status: "success",
  });
}

/** Log a failed auth event (no userId needed for anonymous failures) */
export function auditAuthFailure(
  request: NextRequest | Request,
  action: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  return auditLog({
    action,
    resource: "auth",
    request,
    metadata,
    status: "failure",
  });
}

/** Log a rate-limited/blocked event */
export function auditBlocked(
  request: NextRequest | Request,
  action: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  return auditLog({
    action,
    resource: "security",
    request,
    metadata,
    status: "blocked",
  });
}

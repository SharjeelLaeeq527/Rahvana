/**
 * Resolves the verified caller and the session ID used by Rahvana's registry.
 * Device labels are for display only and must not be used for authorization.
 */
import type { NextRequest } from "next/server";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

const SESSION_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type RequestDevice = { deviceName: string; browser: string };
export type SecurityContext = {
  supabase: SupabaseClient;
  user: User;
  session: Session;
  sessionId: string;
  device: RequestDevice;
};

export function getRequestDevice(request: Request | NextRequest): RequestDevice {
  // Store coarse labels only; never persist the raw User-Agent.
  const ua = request.headers.get("user-agent") || "";
  const deviceName = /iPhone/i.test(ua)
    ? "iPhone"
    : /iPad/i.test(ua)
      ? "iPad"
      : /Android/i.test(ua)
        ? "Android"
        : /Windows/i.test(ua)
          ? "Windows"
          : /Macintosh|Mac OS/i.test(ua)
            ? "Mac"
            : /Linux/i.test(ua)
              ? "Linux"
              : "Unknown device";
  const browser = /Edg\//i.test(ua)
    ? "Edge"
    : /Firefox\//i.test(ua)
      ? "Firefox"
      : /Chrome\//i.test(ua)
        ? "Chrome"
        : /Safari\//i.test(ua)
          ? "Safari"
          : "Unknown browser";
  return { deviceName, browser };
}

export async function getSecurityContext(
  supabase: SupabaseClient,
  request: Request | NextRequest
): Promise<SecurityContext | null> {
  // Verify the caller before using any JWT claim.
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError && (userError.status ?? 0) >= 500) throw userError;
  if (userError || !userData.user) return null;

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const session = sessionData.session;
  if (!session) return null;

  // session_id is a registry key, not an identity check.
  const encodedPayload = session.access_token.split(".")[1];
  if (!encodedPayload) throw new Error("Authenticated JWT is malformed.");
  const claims = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as {
    sub?: unknown;
    session_id?: unknown;
  };

  if (
    claims.sub !== userData.user.id ||
    typeof claims.session_id !== "string" ||
    !SESSION_ID_RE.test(claims.session_id)
  ) {
    throw new Error("Authenticated session claims are invalid.");
  }

  return {
    supabase,
    user: userData.user,
    session,
    sessionId: claims.session_id,
    device: getRequestDevice(request),
  };
}

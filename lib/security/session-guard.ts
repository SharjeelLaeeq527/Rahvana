
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  getSecurityContext,
  type SecurityContext,
} from "@/lib/security/security-context";
import { assertActiveSession } from "@/lib/security/session-registry";

type ActiveSessionGuardResult =
  | { ok: true; context: SecurityContext }
  | { ok: false; response: NextResponse };

export async function requireActiveSession(
  supabase: SupabaseClient,
  request: Request
): Promise<ActiveSessionGuardResult> {
  let context: SecurityContext | null;

  try {
    context = await getSecurityContext(supabase, request);
  } catch (error) {
    console.error(
      "[security/session-guard] context validation failed:",
      error
    );

    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Unable to verify session.",
          code: "SESSION_VALIDATION_UNAVAILABLE",
        },
        { status: 503 }
      ),
    };
  }

  if (!context) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  // Temporary compatibility for authenticated legacy sessions.
  // These sessions do not yet have a registered session ID.
  if (context.sessionId === null) {
    return { ok: true, context };
  }

  // New sessions must have an active registry record.
  let isActive: boolean;

  try {
    isActive = await assertActiveSession(
      context.user.id,
      context.sessionId
    );
  } catch (error) {
    console.error(
      "[security/session-guard] active-session check failed:",
      error
    );

    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Unable to verify session.",
          code: "SESSION_VALIDATION_UNAVAILABLE",
        },
        { status: 503 }
      ),
    };
  }

  if (!isActive) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Session revoked.",
          code: "SESSION_REVOKED",
        },
        { status: 401 }
      ),
    };
  }

  return { ok: true, context };
}

export async function requireActiveSessionForRequest(
  request: Request
): Promise<ActiveSessionGuardResult> {
  try {
    const supabase = await createClient();

    return await requireActiveSession(supabase, request);
  } catch (error) {
    console.error(
      "[security/session-guard] failed to create auth client:",
      error
    );

    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Unable to verify session.",
          code: "SESSION_VALIDATION_UNAVAILABLE",
        },
        { status: 503 }
      ),
    };
  }
}

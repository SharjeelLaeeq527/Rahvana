// lib/api/journey-auth.ts
// Shared auth + journey ownership verification helper
// Used by all of Hashir's Supporting Features API routes
//
// Pattern:
//   const { user, journey, error } = await verifyJourneyAccess(request, journeyId)
//   if (error) return error
//   // safe to proceed — user owns this journey

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiError } from "@/types/journey-support";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface AuthResult {
  user: { id: string; email?: string };
  supabase: Awaited<ReturnType<typeof createClient>>;
  error?: never;
}

export interface AuthError {
  user?: never;
  supabase?: never;
  error: NextResponse;
}

// ─────────────────────────────────────────────────────────────
// verifyAuth
// Just checks auth — use when you don't need journey ownership
// ─────────────────────────────────────────────────────────────

export async function verifyAuth(): Promise<AuthResult | AuthError> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: NextResponse.json(errorResponse("UNAUTHORIZED", "Authentication required"), {
        status: 401,
      }),
    };
  }

  return { user, supabase };
}

// ─────────────────────────────────────────────────────────────
// verifyJourneyAccess
// Checks auth AND verifies the user is a MEMBER of the given journeyId
// (owner OR an active collaborator — see case_collaborators +
// public.is_journey_member). This is THE chokepoint for every journey-scoped
// API route, so changing it here unlocks shared access everywhere at once.
//
// `isOwner` is returned so routes that must stay owner-only (delete a journey,
// invite/remove a collaborator, assign case roles) can enforce it explicitly.
// ─────────────────────────────────────────────────────────────

export async function verifyJourneyAccess(
  journeyId: string
): Promise<
  (AuthResult & { journey: { id: string; user_id: string }; isOwner: boolean }) | AuthError
> {
  const authResult = await verifyAuth();
  if (authResult.error) return authResult as AuthError;

  const { user, supabase } = authResult as AuthResult;

  // Membership check via the shared DB primitive (owner OR active collaborator).
  // Done explicitly (rather than relying solely on RLS) because this file is the
  // security chokepoint — it must hold even if a future RLS change is loosened.
  const { data: isMember, error: memberError } = await supabase.rpc("is_journey_member", {
    p_journey_id: journeyId,
    p_uid: user.id,
  });

  if (memberError) {
    return {
      error: NextResponse.json(errorResponse("INTERNAL", "Membership check failed"), {
        status: 500,
      }),
    };
  }

  if (!isMember) {
    // Non-member, or journey doesn't exist — don't leak which.
    return {
      error: NextResponse.json(errorResponse("FORBIDDEN", "Access denied to this journey"), {
        status: 403,
      }),
    };
  }

  // Member confirmed — fetch the row (RLS now permits members) for owner checks.
  const { data: journey, error: journeyError } = await supabase
    .from("journeys")
    .select("id, user_id")
    .eq("id", journeyId)
    .single();

  if (journeyError || !journey) {
    return {
      error: NextResponse.json(errorResponse("NOT_FOUND", "Journey not found"), { status: 404 }),
    };
  }

  return { user, supabase, journey, isOwner: journey.user_id === user.id };
}

// ─────────────────────────────────────────────────────────────
// Helpers for standard response shapes
// ─────────────────────────────────────────────────────────────

export function errorResponse(
  code: string,
  message: string,
  details?: Array<{ field: string; issue: string }>
): ApiError {
  return {
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  };
}

export function successResponse<T>(data: T, message?: string) {
  return { success: true, data, ...(message ? { message } : {}) };
}

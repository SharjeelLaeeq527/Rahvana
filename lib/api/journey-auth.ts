// lib/api/journey-auth.ts
// Shared auth + journey ownership verification helper
// Used by all of Hashir's Supporting Features API routes
//
// Pattern:
//   const { user, journey, error } = await verifyJourneyAccess(request, journeyId)
//   if (error) return error
//   // safe to proceed — user owns this journey

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiError } from '@/types/journey-support'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface AuthResult {
  user: { id: string; email?: string }
  supabase: Awaited<ReturnType<typeof createClient>>
  error?: never
}

export interface AuthError {
  user?: never
  supabase?: never
  error: NextResponse
}

// ─────────────────────────────────────────────────────────────
// verifyAuth
// Just checks auth — use when you don't need journey ownership
// ─────────────────────────────────────────────────────────────

export async function verifyAuth(): Promise<AuthResult | AuthError> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required'),
        { status: 401 }
      )
    }
  }

  return { user, supabase }
}

// ─────────────────────────────────────────────────────────────
// verifyJourneyAccess
// Checks auth AND verifies the user owns the given journeyId
// ─────────────────────────────────────────────────────────────

export async function verifyJourneyAccess(
  journeyId: string
): Promise<(AuthResult & { journey: { id: string; user_id: string } }) | AuthError> {
  const authResult = await verifyAuth()
  if (authResult.error) return authResult as AuthError

  const { user, supabase } = authResult as AuthResult

  // Verify user owns this journey (Hammad's journeys table)
  const { data: journey, error: journeyError } = await supabase
    .from('journeys')
    .select('id, user_id')
    .eq('id', journeyId)
    .single()

  if (journeyError || !journey) {
    return {
      error: NextResponse.json(
        errorResponse('NOT_FOUND', 'Journey not found'),
        { status: 404 }
      )
    }
  }

  if (journey.user_id !== user.id) {
    return {
      error: NextResponse.json(
        errorResponse('FORBIDDEN', 'Access denied to this journey'),
        { status: 403 }
      )
    }
  }

  return { user, supabase, journey }
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
    error: { code, message, ...(details ? { details } : {}) }
  }
}

export function successResponse<T>(data: T, message?: string) {
  return { success: true, data, ...(message ? { message } : {}) }
}

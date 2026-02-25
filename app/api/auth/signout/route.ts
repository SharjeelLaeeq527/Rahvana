// app/api/auth/signout/route.ts
// Server-side sign-out handler that properly clears all session cookies
// This is necessary because the browser client's signOut() cannot reliably
// clear httpOnly cookies that were set by the middleware on Vercel.

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Use scope: 'global' to revoke the refresh token on the Supabase server,
    // which invalidates ALL sessions for this user (not just the local one).
    // This ensures that even if a cookie lingers, the token is dead server-side.
    const { error } = await supabase.auth.signOut({ scope: 'global' })

    if (error) {
      console.error('[signout] Supabase signOut error:', error.message)
      // Still return 200 — we want the client to proceed with the redirect
      // even if the server-side revocation partially failed.
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[signout] Unexpected error:', err)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

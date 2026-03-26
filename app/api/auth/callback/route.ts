// app/auth/callback/route.ts
// OAuth callback handler for Google Sign-In

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;)\s*oauth_redirect\s*=\s*([^;]+)/);
  const nextCookie = match ? decodeURIComponent(match[1]) : null;

  const next = searchParams.get('next') ?? nextCookie ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get the current user to create/update their profile
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Create or update user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            role: 'user' // Default role is 'user'
          });

        if (profileError) {
          console.error("Error creating/updating user profile:", profileError);
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      let response;
      if (isLocalEnv) {
        response = NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        response = NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        response = NextResponse.redirect(`${origin}${next}`)
      }

      response.cookies.delete('oauth_redirect')
      return response
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}

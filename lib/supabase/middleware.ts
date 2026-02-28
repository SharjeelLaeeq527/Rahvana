// lib/supabase/middleware.ts
// Supabase middleware client for refreshing auth tokens

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Specific admin emails - ONLY these emails have admin access
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'hammadnooralam@gmail.com').split(',').map(email => email.trim());

// Create admin client with service role for checking admin status
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not write any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make your application
  // vulnerable to security issues.

  const {
    data: { user },
  } = await supabase.auth.getUser()

// Define protected routes (must be logged in)
const protectedRoutes = [
  '/dashboard',
  '/complete-profile',
    '/profile',
    '/settings',
]


  // Define admin routes (must be logged in as admin)
  const adminRoutes = ['/admin']

  // Define auth routes (should redirect to dashboard if logged in)
  const authRoutes = ['/login', '/signup']

  // Define admin auth routes (for admin login)
  const adminAuthRoutes = ['/admin-login']

  const pathname = request.nextUrl.pathname

  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  // Check if current path is an admin route
  const isAdminRoute = adminRoutes.some(route =>
    pathname.startsWith(route) && !adminAuthRoutes.includes(pathname)
  )

  // Check if current path is an auth route
  const isAuthRoute = authRoutes.some(route =>
    pathname === route || pathname.startsWith(route)
  )

  // Check if current path is an admin auth route
  const isAdminAuthRoute = adminAuthRoutes.some(route =>
    pathname === route || pathname.startsWith(route)
  )

  // Handle admin route protection
  if (isAdminRoute) {
    // For admin routes, check if user is logged in and is an admin
    if (!user) {
      // Redirect to admin login if not logged in
      const url = request.nextUrl.clone()
      url.pathname = '/admin-login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }

    // Get user profile to verify admin status
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !ADMIN_EMAILS.includes(profile.email)) {
      // Redirect to unauthorized page or home if not an admin
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // If user is not authenticated and trying to access protected route (non-admin)
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access auth routes
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/complete-profile'
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access admin auth routes
  if (user && isAdminAuthRoute) {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (!profileError && profile && ADMIN_EMAILS.includes(profile.email)) {
      // Admin user - redirect to admin panel
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    } else {
      // Regular user - redirect to dashboard
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // If user is not authenticated and trying to access admin auth routes, allow access to login
  if (!user && isAdminAuthRoute) {
    // Allow access to admin login page for unauthenticated users
    return supabaseResponse;
  }

  return supabaseResponse
}
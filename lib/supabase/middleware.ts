// lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// =============================
// Admin Emails
// =============================
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "hammadnooralam@gmail.com")
  .split(",")
  .map((email) => email.trim());

// =============================
// Service Role Client (Admin)
// =============================
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next();

  // =============================
  // Supabase Server Client
  // =============================
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // ⚠️ DO NOT put logic between client creation & getUser
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // =============================
  // Route Definitions
  // =============================
  const protectedRoutes = [
    "/user-dashboard",
    "/dashboard",
    "/complete-profile",
    "/profile",
    "/settings",
    "/portal-wallet",
    "/221g-action-planner",
    "/visa-case-strength-checker",
    "/document-vault",
    "/passport",
    "/visa-forms",
    "/signature-image-processing",
    "/affidavit-support-calculator",
    "/visa-checker",
    "/visa-eligibility",
    "/visa-category/ir-category/ir1-journey",
    "/interview-prep",
  ];

  const adminRoutes = ["/admin"];
  const authRoutes = ["/login", "/signup"];
  const adminAuthRoutes = ["/admin-login"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAdminRoute =
    adminRoutes.some((route) => pathname.startsWith(route)) &&
    !adminAuthRoutes.includes(pathname);

  const isAuthRoute = authRoutes.includes(pathname);
  const isAdminAuthRoute = adminAuthRoutes.includes(pathname);

  // =============================
  // Admin Route Protection
  // =============================
  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin-login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    if (!profile || !ADMIN_EMAILS.includes(profile.email)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // =============================
  // Protected Routes
  // =============================
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // =============================
  // Logged-in user accessing login/signup
  // =============================
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/complete-profile";
    return NextResponse.redirect(url);
  }

  // =============================
  // Logged-in user accessing admin login
  // =============================
  if (user && isAdminAuthRoute) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();

    if (profile && ADMIN_EMAILS.includes(profile.email)) {
      url.pathname = "/admin";
    } else {
      url.pathname = "/dashboard";
    }

    return NextResponse.redirect(url);
  }

  return response;
}

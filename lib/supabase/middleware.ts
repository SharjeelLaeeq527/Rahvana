// lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auditLog } from "@/lib/security/audit-log";

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
  const pathname = request.nextUrl.pathname;

  // =============================
  // Route Definitions
  // =============================
  const protectedRoutes = [
    "/user-dashboard",
    "/complete-profile",
    "/profile",
    "/settings",
    "/portal-wallet",
    "/221g-action-planner",
    "/visa-case-strength-checker",
    "/visa-case-strength-checker/my-cases",
    "/document-vault",
    "/passport",
    "/visa-forms",
    "/signature-image-processing",
    "/affidavit-support-calculator",
    "/visa-checker",
    "/visa-eligibility",
    "/visa-category/ir1-journey",
    "/visa-category/ir5-journey",
    "/visa-category/ir2-journey",
    "/interview-prep",
    "/interview-prep/my-sessions",
    "/document-translation",
    "/document-translation/my-requests",
    "/document-translation/request/[id]",
    "/user-dashboard-v2",
    "/courier-registration",
    "/view-security-questions",
    "/pdf-processing",
    "/police-verification",
    "/police-verification/apply",
    "/case-status",
    "/book-appointment",
    "/interview-prep/result",
    "/visa-forms/[formCode]/wizard",
    "/visa-checker/result",
  ];

  const adminRoutes = ["/admin"];
  const authRoutes = ["/login", "/signup"];
  const adminAuthRoutes = ["/admin-login"];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  const isAdminRoute =
    adminRoutes.some((route) => pathname.startsWith(route)) && !adminAuthRoutes.includes(pathname);

  const isAuthRoute = authRoutes.includes(pathname);
  const isAdminAuthRoute = adminAuthRoutes.includes(pathname);

  // =============================
  // Admin Route Protection
  // =============================
  const isApiAdminRoute = pathname.startsWith("/api/admin");

  const needsAuthCheck =
    isProtectedRoute || isAdminRoute || isApiAdminRoute || isAuthRoute || isAdminAuthRoute;

  // Optimize: Skip auth checks and API calls on completely public routes.
  // This avoids costly network requests to Supabase Auth on every static asset/page and prevents 504 Middleware Timeouts.
  if (!needsAuthCheck) {
    return response;
  }

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

  if (isAdminRoute || isApiAdminRoute) {
    if (!user) {
      if (isApiAdminRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const url = request.nextUrl.clone();
      url.pathname = "/admin-login";
      url.searchParams.set("redirectTo", request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, role")
      .eq("id", user.id)
      .single();

    const isAuthorizedAdmin =
      profile && ADMIN_EMAILS.includes(profile.email) && profile.role === "admin";

    if (!isAuthorizedAdmin) {
      // Audit: unauthorized admin access attempt
      auditLog({
        userId: user.id,
        action: "admin.access_denied",
        resource: "admin",
        request,
        metadata: { pathname, email: profile?.email },
        status: "blocked",
      });

      if (isApiAdminRoute) {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
      }
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // Audit successful admin access — but ONLY for state-changing requests
    // (POST/PUT/PATCH/DELETE). Previously we wrote an audit_logs row on EVERY
    // admin request including plain reads; the admin dashboard's 30s polling of
    // GET endpoints turned that into a constant stream of INSERTs (a Supabase
    // Disk IO source). Reads are not security-interesting; only writes are.
    const isMutation = !["GET", "HEAD", "OPTIONS"].includes(request.method);
    if (isMutation) {
      auditLog({
        userId: user.id,
        action: "admin.access",
        resource: "admin",
        request,
        metadata: { pathname, method: request.method },
        status: "success",
      });
    }
  }

  // =============================
  // Protected Routes
  // =============================
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // =============================
  // Logged-in user accessing login/signup
  // =============================
  if (user && isAuthRoute) {
    // Allow MFA flow - don't redirect if user has MFA credentials in session
    if (request.nextUrl.searchParams.get("mfa") === "true") {
      return response;
    }

    const redirectTo =
      request.nextUrl.searchParams.get("redirectTo") ||
      request.nextUrl.searchParams.get("redirect");
    if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

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
      url.pathname = "/user-dashboard";
    }

    return NextResponse.redirect(url);
  }

  return response;
}

// lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  createClient,
  isAuthRetryableFetchError,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { auditLog } from "@/lib/security/audit-log";
import { isStagingEmailAllowed } from "@/lib/security/staging-access";
import { getSecurityContext } from "@/lib/security/security-context";
import { assertActiveSession } from "@/lib/security/session-registry";

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

// =============================
// Timeouts
// =============================
// Every Supabase call in this middleware is capped. Without a cap, an unhealthy
// Supabase project makes the middleware hang until Vercel kills it with
// 504 MIDDLEWARE_INVOCATION_TIMEOUT, which takes the whole page down with it.
const MIDDLEWARE_SUPABASE_TIMEOUT_MS = 5000;

const SESSION_CHECK_EXEMPT_API_ROUTES = new Set([
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/confirm-email",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/signout",
  "/api/auth/mfa/verify-login",
  "/api/admin/logout",
]);

type GetUserResult =
  | { unavailable: false; user: User | null }
  | { unavailable: true; reason: string };

export async function getUserWithTimeout(supabase: Pick<SupabaseClient, "auth">): Promise<GetUserResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<GetUserResult>((resolve) => {
    timer = setTimeout(
      () => resolve({ unavailable: true, reason: `timeout after ${MIDDLEWARE_SUPABASE_TIMEOUT_MS}ms` }),
      MIDDLEWARE_SUPABASE_TIMEOUT_MS
    );
  });

  const lookup = supabase.auth
    .getUser()
    .then<GetUserResult>(({ data, error }) => {
      // A network / 5xx failure means "Auth is down", not "signed out".
      // Treating it as signed out would bounce signed-in users to /login.
      if (error && (isAuthRetryableFetchError(error) || (error.status ?? 0) >= 500)) {
        return { unavailable: true, reason: error.message };
      }
      return { unavailable: false, user: data.user ?? null };
    })
    .catch<GetUserResult>((err: unknown) => ({
      unavailable: true,
      reason: err instanceof Error ? err.message : "getUser threw",
    }));

  try {
    return await Promise.race([lookup, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export async function isCurrentSecuritySessionActive(
  supabase: SupabaseClient,
  request: NextRequest,
  user: User
): Promise<boolean> {
  const context = await getSecurityContext(supabase, request, user);
  if (!context) throw new Error("Verified user session required.");
  if (context.sessionId === null) return true;

  return assertActiveSession(
    context.user.id,
    context.sessionId,
    AbortSignal.timeout(MIDDLEWARE_SUPABASE_TIMEOUT_MS)
  );
}

function serviceUnavailable(asJson: boolean) {
  const headers = { "Retry-After": "30" };
  if (asJson) {
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again shortly." },
      { status: 503, headers }
    );
  }
  return new NextResponse("Service temporarily unavailable. Please try again in a moment.", {
    status: 503,
    headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next();
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
  const isApiRoute = pathname.startsWith("/api/");
  const shouldEnforceActiveSession =
    isProtectedRoute ||
    isAdminRoute ||
    (isApiRoute && !SESSION_CHECK_EXEMPT_API_ROUTES.has(pathname));

  // =============================
  // Admin Route Protection
  // =============================
  const isApiAdminRoute = pathname.startsWith("/api/admin");

  const needsAuthCheck =
    shouldEnforceActiveSession ||
    isApiAdminRoute ||
    isAuthRoute ||
    isAdminAuthRoute;

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
  const auth = await getUserWithTimeout(supabase);

  // Supabase Auth did not answer in time (or is down). Do not wait for it:
  // Vercel kills a slow middleware with 504 MIDDLEWARE_INVOCATION_TIMEOUT.
  // - Admin routes fail CLOSED (503): never let anyone in without a check.
  // - Every other route passes through unchanged. We cannot tell a signed-in
  //   user from a signed-out one right now, and sending a signed-in user to
  //   /login would be wrong. Private API handlers and RLS retain their own
  //   authorization checks.
  if (auth.unavailable) {
    console.warn(`[middleware] Supabase Auth unavailable (${auth.reason}) on ${pathname}`);
    if (isAdminRoute || isApiAdminRoute) {
      return serviceUnavailable(isApiAdminRoute);
    }
    return response;
  }
  const user = auth.user;

  if (user && shouldEnforceActiveSession) {
    try {
      const isActive = await isCurrentSecuritySessionActive(supabase, request, user);
      if (!isActive) {
        if (isApiRoute) {
          response = NextResponse.json(
            { error: "Session revoked.", code: "SESSION_REVOKED" },
            { status: 401 }
          );
        } else {
          const url = request.nextUrl.clone();
          url.pathname = "/login";
          url.searchParams.set("error", "session_revoked");
          response = NextResponse.redirect(url);
        }

        try {
          const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
          if (signOutError) {
            console.warn("[middleware] local sign-out failed for revoked session:", signOutError);
          }
        } catch (signOutError) {
          console.warn("[middleware] local sign-out failed for revoked session:", signOutError);
        }
        return response;
      }
    } catch (error) {
      console.warn(`[middleware] active-session check failed on ${pathname}:`, error);
      if (isApiRoute) {
        return NextResponse.json(
          {
            error: "Unable to verify session.",
            code: "SESSION_VALIDATION_UNAVAILABLE",
          },
          { status: 503, headers: { "Retry-After": "30" } }
        );
      }
      return serviceUnavailable(isApiRoute);
    }
  }

  // =============================
  // Staging Access Session Check
  // =============================
  if (user && !isStagingEmailAllowed(user.email)) {
    if (isProtectedRoute || isAdminRoute || isApiAdminRoute) {
      if (isApiAdminRoute || pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Staging access denied: account not authorized on this environment." },
          { status: 403 }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "staging_access_denied");
      return NextResponse.redirect(url);
    }
  }

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

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email, role")
      .eq("id", user.id)
      .abortSignal(AbortSignal.timeout(MIDDLEWARE_SUPABASE_TIMEOUT_MS))
      .single();

    // Database slow / unreachable (anything but "no profile row"): fail closed
    // with 503 instead of hanging, and do not log a false "access denied".
    if (profileError && profileError.code !== "PGRST116") {
      console.warn(`[middleware] admin profile lookup failed on ${pathname}: ${profileError.message}`);
      return serviceUnavailable(isApiAdminRoute);
    }

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
  if (user && isAuthRoute && isStagingEmailAllowed(user.email)) {
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
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email, role")
      .eq("id", user.id)
      .abortSignal(AbortSignal.timeout(MIDDLEWARE_SUPABASE_TIMEOUT_MS))
      .single();

    // Database slow / unreachable: just show the admin login page.
    if (profileError && profileError.code !== "PGRST116") {
      return response;
    }

    const url = request.nextUrl.clone();

    // MUST match the /admin gate exactly (email whitelist AND role === "admin").
    const isAuthorizedAdmin =
      !!profile && ADMIN_EMAILS.includes(profile.email) && profile.role === "admin";

    if (isAuthorizedAdmin) {
      url.pathname = "/admin";
    } else {
      url.pathname = "/user-dashboard";
    }

    return NextResponse.redirect(url);
  }

  return response;
}

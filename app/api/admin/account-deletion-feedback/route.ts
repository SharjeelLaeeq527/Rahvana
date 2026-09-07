// app/api/admin/account-deletion-feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { E, msg } from "@/lib/errors";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "ahmed1work2@gmail.com") 
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const VALID_REASONS = [
  "journey_completed",
  "no_longer_needed",
  "couldnt_find_needed",
  "missing_features",
  "technical_problem",
  "privacy_security_concern",
  "found_alternative",
  "other",
] as const;

type DeletionReason = (typeof VALID_REASONS)[number];

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function getServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}

async function checkAdminRole(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      isAdmin: false,
      error: msg(E.AUTH_UNAUTHORIZED),
      user: null,
    };
  }

  const userEmail = user.email?.trim().toLowerCase();

  if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
    return {
      isAdmin: false,
      error: msg(E.AUTH_UNAUTHORIZED_ADMIN),
      user: null,
    };
  }

  const supabaseAdmin = getServiceRoleClient();

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[admin/account-deletion-feedback] Profile lookup error:", {
      userId: user.id,
      error: profileError,
    });

    return {
      isAdmin: false,
      error: "Profile verification failed",
      user: null,
    };
  }

  if (!profile || profile.role !== "admin") {
    return {
      isAdmin: false,
      error: msg(E.AUTH_UNAUTHORIZED_ADMIN),
      user: null,
    };
  }

  return {
    isAdmin: true,
    error: null,
    user,
  };
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function isValidReason(value: string): value is DeletionReason {
  return VALID_REASONS.includes(value as DeletionReason);
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate + authorize admin
    const { isAdmin, error: authError } = await checkAdminRole(request);

    if (!isAdmin) {
      return NextResponse.json(
        {
          error: authError || "Admin access required",
        },
        { status: 403 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);

    const page = parsePositiveInteger(searchParams.get("page"), DEFAULT_PAGE);

    const requestedLimit = parsePositiveInteger(searchParams.get("limit"), DEFAULT_LIMIT);

    const limit = Math.min(requestedLimit, MAX_LIMIT);

    const reasonParam = searchParams.get("reason")?.trim();

    // 3. Validate reason filter
    if (reasonParam && !isValidReason(reasonParam)) {
      return NextResponse.json(
        {
          error: "Invalid deletion reason.",
          valid_reasons: VALID_REASONS,
        },
        { status: 400 }
      );
    }

    // 4. Calculate pagination range
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 5. Fetch feedback
    const supabaseAdmin = getServiceRoleClient();

    let query = supabaseAdmin
      .from("account_deletion_feedback")
      .select("id, reason, additional_comments, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (reasonParam) {
      query = query.eq("reason", reasonParam);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("[admin/account-deletion-feedback] Fetch error:", error);

      return NextResponse.json(
        {
          error: "Failed to fetch account deletion feedback.",
        },
        { status: 500 }
      );
    }

    // 6. Pagination metadata
    const total = count ?? 0;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    // 7. Return response
    return NextResponse.json({
      data: data ?? [],
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_previous_page: page > 1 && totalPages > 0,
      },
      filters: {
        reason: reasonParam || null,
      },
    });
  } catch (error) {
    console.error("[admin/account-deletion-feedback] Unexpected error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong.",
      },
      { status: 500 }
    );
  }
}

// app/api/admin/audit-logs/route.ts
//
// Admin-only endpoint to query audit logs.
// Protected by middleware admin check (middleware.ts already guards /api/admin/*).
//
// GET /api/admin/audit-logs?action=auth.signup&limit=50&offset=0&userId=xxx&from=2026-01-01&to=2026-12-31

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    // Double-check auth (middleware already guards this, but defense-in-depth)
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Build query using admin client (bypasses RLS to see all logs)
    // count: "planned" uses Postgres's query-planner ESTIMATE instead of
    // physically counting every matching row. "exact" forced a full scan of
    // audit_logs on every page view of the admin viewer. For a paginated log
    // list an approximate total is perfectly fine.
    let query = supabaseAdmin
      .from("audit_logs")
      .select("*", { count: "planned" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (action) {
      query = query.eq("action", action);
    }
    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (from) {
      query = query.gte("created_at", new Date(from).toISOString());
    }
    if (to) {
      query = query.lte("created_at", new Date(to).toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("[admin/audit-logs] Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch audit logs" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      logs: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[admin/audit-logs] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

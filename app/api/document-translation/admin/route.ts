// GET /api/document-translation/admin?status=PENDING&limit=50&offset=0
// Admin lists documents (with filters)
import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { E, msg } from "@/lib/errors";
import { requireAdmin } from "@/lib/api/authGuards";
function getStorageSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase credentials not configured");
  }
  return createSupabaseClient(supabaseUrl, serviceRoleKey);
}

export async function GET(request: NextRequest) {
  try {
    // AUTHZ: admin only (this route uses the service role → bypasses RLS)
    const { isAdmin, error: authError } = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: authError || "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = getStorageSupabase();

    let query = supabase
      .from("translation_documents")
      .select("*", { count: "exact" })
      // Only show documents that have been paid for (or legacy rows)
      .neq("payment_status", "pending")
      .neq("payment_status", "failed")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status if provided
    if (status) {
      query = query.eq("status", status);
    }

    const { data: documents, error, count } = await query;

    if (error) {
      console.error("Query error:", error);
      return NextResponse.json({ error: msg(E.ADMIN_FETCH_FAILED) }, { status: 500 });
    }

    return NextResponse.json({
      documents,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("List documents error:", error);
    return NextResponse.json({ error: msg(E.ADMIN_FETCH_FAILED) }, { status: 500 });
  }
}

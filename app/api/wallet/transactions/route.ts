import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getServiceRoleClient } from "@/lib/api/authGuards";

const MAX_LIMIT = 50;

/** Columns safe to show the user; internal ids and raw metadata stay server-side. */
const LEDGER_COLUMNS =
  "id, transaction_type, amount, amount_usd, balance_before, balance_after, description, resource_type, resource_id, status, created_at";

function positiveInt(raw: string | null, fallback: number): number | null {
  if (raw === null) return fallback;
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return n >= 1 ? n : null;
}

/**
 * GET /api/wallet/transactions?page=1&limit=20
 * The signed-in user's credit ledger, newest first.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  const page = positiveInt(request.nextUrl.searchParams.get("page"), 1);
  const rawLimit = positiveInt(request.nextUrl.searchParams.get("limit"), 20);
  if (page === null || rawLimit === null) {
    return NextResponse.json({ success: false, error: "INVALID_PAGINATION" }, { status: 400 });
  }
  const limit = Math.min(rawLimit, MAX_LIMIT);
  const from = (page - 1) * limit;

  const { data, error, count } = await getServiceRoleClient()
    .from("credit_transactions")
    .select(LEDGER_COLUMNS, { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + limit - 1);

  if (error) {
    console.error("[wallet] transactions failed:", error);
    return NextResponse.json({ success: false, error: "Could not load transactions" }, { status: 500 });
  }

  const total = count ?? 0;
  return NextResponse.json(
    {
      success: true,
      transactions: data ?? [],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

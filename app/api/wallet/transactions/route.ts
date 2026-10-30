import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getServiceRoleClient } from "@/lib/api/authGuards";
import {
  buildSearchOrClause,
  isLedgerFilter,
  sanitizeSearch,
  typesForFilter,
  type LedgerSummary,
} from "@/lib/wallet/transactions";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const MAX_DAYS = 3650; // ~10 years; anything larger is a typo, not a range.

/** Columns safe to show the user; wallet_id/payment ids stay server-side. */
const LEDGER_COLUMNS =
  "id, transaction_type, amount, amount_usd, balance_before, balance_after, description, resource_type, resource_id, status, stripe_invoice_id, actor_type, metadata, created_at";

function positiveInt(raw: string | null, fallback: number): number | null {
  if (raw === null) return fallback;
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return n >= 1 ? n : null;
}

/** Maps the get_wallet_ledger_summary RPC row into the client-facing shape. */
function toSummary(row: Record<string, unknown> | null | undefined): LedgerSummary | null {
  if (!row) return null;
  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    balance: num(row.balance),
    totalAdded: num(row.total_credits_added),
    totalSpent: num(row.total_credits_spent),
    pendingCount: num(row.pending_count),
    transactionCount: num(row.transaction_count),
  };
}

/**
 * GET /api/wallet/transactions?page=1&limit=20&type=all&days=0&q=
 * The signed-in user's credit ledger, newest first.
 *   type: all | topup | unlock | service | refund (history chips)
 *   days: 30 | 90 | 365 ... window from now, 0/absent = all time
 *   q:    free text over description / transaction reference (sanitized)
 * `summary` carries lifetime totals (never filter-scoped) and degrades to null
 * if the summary RPC is unavailable, so the list still renders.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const page = positiveInt(params.get("page"), 1);
  const rawLimit = positiveInt(params.get("limit"), DEFAULT_LIMIT);
  if (page === null || rawLimit === null) {
    return NextResponse.json({ success: false, error: "INVALID_PAGINATION" }, { status: 400 });
  }
  const limit = Math.min(rawLimit, MAX_LIMIT);
  const from = (page - 1) * limit;

  const rawType = params.get("type") ?? "all";
  if (!isLedgerFilter(rawType)) {
    return NextResponse.json({ success: false, error: "INVALID_TYPE" }, { status: 400 });
  }
  const filter = rawType;

  const rawDays = params.get("days");
  let days = 0;
  if (rawDays !== null) {
    if (!/^\d+$/.test(rawDays) || Number(rawDays) > MAX_DAYS) {
      return NextResponse.json({ success: false, error: "INVALID_RANGE" }, { status: 400 });
    }
    days = Number(rawDays);
  }

  const search = sanitizeSearch(params.get("q") ?? "");

  const supabase = getServiceRoleClient();

  let query = supabase
    .from("credit_transactions")
    .select(LEDGER_COLUMNS, { count: "exact" })
    .eq("user_id", user.id);

  const types = typesForFilter(filter);
  if (types.length > 0) query = query.in("transaction_type", types);
  if (days > 0) {
    query = query.gte("created_at", new Date(Date.now() - days * 86_400_000).toISOString());
  }
  if (search) {
    // sanitizeSearch removed the or()-filter metacharacters (, ( ) % * ").
    query = query.or(buildSearchOrClause(search));
  }

  const [{ data, error, count }, { data: summaryRow }] = await Promise.all([
    query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + limit - 1),
    supabase.rpc("get_wallet_ledger_summary", { p_user_id: user.id }),
  ]);

  if (error) {
    console.error("[wallet] transactions failed:", error);
    return NextResponse.json(
      { success: false, error: "Could not load transactions" },
      { status: 500 }
    );
  }

  const total = count ?? 0;
  return NextResponse.json(
    {
      success: true,
      transactions: data ?? [],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: toSummary(summaryRow as Record<string, unknown> | null),
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

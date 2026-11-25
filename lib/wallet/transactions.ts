/**
 * Rahvana Wallet transaction history: shared types, category display metadata,
 * and the pure helpers used by the /wallet/transactions page, the detail modal,
 * the list API (/api/wallet/transactions) and the statement PDF route.
 *
 * Free of React and server-only imports so it bundles on both sides and is
 * unit-testable in Jest (mirrors the catalog.ts / client.ts split).
 */

export type LedgerTransactionType =
  "top_up" | "tool_launch" | "guide_unlock" | "service_booking" | "refund" | "adjustment" | "bonus";

export type LedgerStatus = "completed" | "pending" | "reversed" | "failed";

/** One credit-ledger row, exactly as /api/wallet/transactions returns it. */
export type LedgerTransaction = {
  id: string;
  transaction_type: LedgerTransactionType;
  /** NUMERIC arrives as a string over PostgREST; positive = credit, negative = debit. */
  amount: string | number;
  amount_usd: string | number | null;
  balance_before: string | number;
  balance_after: string | number;
  description: string;
  resource_type: "tool" | "guide" | "service" | "wallet" | "adjustment" | null;
  resource_id: string | null;
  status: LedgerStatus;
  created_at: string;
  /** Detail-modal extras (safe for the owner; kept out of the compact table). */
  stripe_invoice_id?: string | null;
  actor_type?: "user" | "system" | "admin" | "stripe_webhook" | null;
  metadata?: Record<string, unknown> | null;
};

/** Lifetime hero stats from the get_wallet_ledger_summary RPC. */
export type LedgerSummary = {
  balance: number;
  totalAdded: number;
  totalSpent: number;
  pendingCount: number;
  transactionCount: number;
};

export type LedgerFilter = "all" | "topup" | "unlock" | "service" | "refund";

export const LEDGER_FILTERS: readonly LedgerFilter[] = [
  "all",
  "topup",
  "unlock",
  "service",
  "refund",
];

/** Which ledger transaction_type values each history chip covers. */
export const FILTER_TYPES: Record<Exclude<LedgerFilter, "all">, LedgerTransactionType[]> = {
  topup: ["top_up", "bonus"],
  unlock: ["tool_launch", "guide_unlock"],
  service: ["service_booking"],
  refund: ["refund", "adjustment"],
};

export const LEDGER_FILTER_LABELS: Record<LedgerFilter, string> = {
  all: "All",
  topup: "Top-ups",
  unlock: "Unlocks",
  service: "Services",
  refund: "Refunds",
};

/** What each chip actually covers — surfaced as a tooltip on the chip. */
export const LEDGER_FILTER_HINTS: Record<LedgerFilter, string> = {
  all: "Every credit deposit and disbursement",
  topup: "Wallet top-ups and promotional bonuses",
  unlock: "All resource unlocks: standalone tools and guides",
  service: "Consultations and expert services booked on Rahvana",
  refund: "Refunds and support adjustments back to your wallet",
};

export type LedgerDateRange = { days: number; label: string };

/** "Last 30 days" style picker. 0 = all time. */
export const LEDGER_DATE_RANGES: readonly LedgerDateRange[] = [
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 90 days" },
  { days: 365, label: "Last 12 months" },
  { days: 0, label: "All time" },
];

export function isLedgerFilter(raw: unknown): raw is LedgerFilter {
  return typeof raw === "string" && (LEDGER_FILTERS as readonly string[]).includes(raw);
}

/** Every type must be reachable from exactly one chip (guarded by tests). */
export function typesForFilter(filter: LedgerFilter): LedgerTransactionType[] {
  if (filter === "all") return [];
  return FILTER_TYPES[filter];
}

/** Display metadata per transaction type: label + badge + icon-tile classes. */
export type LedgerCategoryMeta = {
  label: string;
  /** Pill classes used in the CATEGORY column. */
  badge: string;
  /** Rounded icon-tile classes used in the TRANSACTION DETAILS column. */
  tile: string;
};

const CATEGORY_META: Record<LedgerTransactionType, LedgerCategoryMeta> = {
  top_up: {
    label: "Top-Up",
    badge:
      "bg-rahvana-primary-pale text-rahvana-primary-dark ring-1 ring-inset ring-rahvana-primary/15",
    tile: "bg-rahvana-primary-pale text-rahvana-primary",
  },
  bonus: {
    label: "Bonus",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/70",
    tile: "bg-amber-50 text-amber-600",
  },
  tool_launch: {
    label: "Tool Unlock",
    badge: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200/70",
    tile: "bg-violet-50 text-violet-600",
  },
  guide_unlock: {
    label: "Guide Unlock",
    // Rose mirrors the platform's accent-rose guide/chapter theme.
    badge: "bg-[#fbeef0] text-[#a34553] ring-1 ring-inset ring-[#c0596a]/20",
    tile: "bg-[#fbeef0] text-[#c0596a]",
  },
  service_booking: {
    label: "Service",
    badge: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200/70",
    tile: "bg-indigo-50 text-indigo-600",
  },
  refund: {
    label: "Refund",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/70",
    tile: "bg-emerald-50 text-emerald-600",
  },
  adjustment: {
    label: "Adjustment",
    badge: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
    tile: "bg-slate-100 text-slate-600",
  },
};

export function categoryFor(type: LedgerTransactionType): LedgerCategoryMeta {
  return CATEGORY_META[type] ?? CATEGORY_META.adjustment;
}

export type LedgerStatusMeta = {
  label: string;
  /** Small dot, for dense contexts that still use one. */
  dot: string;
  text: string;
  /** Pill classes — rendered like the category badge, not dot + plain text. */
  pill: string;
};

const STATUS_META: Record<LedgerStatus, LedgerStatusMeta> = {
  completed: {
    label: "Completed",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    pill: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/70",
  },
  pending: {
    label: "Pending",
    dot: "bg-amber-500",
    text: "text-amber-700",
    pill: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/70",
  },
  reversed: {
    label: "Reversed",
    dot: "bg-slate-400",
    text: "text-slate-500",
    pill: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
  },
  failed: {
    label: "Failed",
    dot: "bg-red-500",
    text: "text-red-600",
    pill: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/70",
  },
};

export function statusFor(status: LedgerStatus): LedgerStatusMeta {
  return STATUS_META[status] ?? STATUS_META.failed;
}

/** NUMERIC(10,2) travels as a string; everything downstream wants a number. */
export function toNumber(value: string | number | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function isDebit(t: Pick<LedgerTransaction, "amount">): boolean {
  return toNumber(t.amount) < 0;
}

/** "2,450" / "-250" style credit amount without the sign word. */
export function formatCredits(value: string | number): string {
  return toNumber(value).toLocaleString("en-US");
}

/** Signed credit amount for the table: "+500 Credits" / "-250 Credits". */
export function formatSignedCredits(value: string | number): string {
  const n = toNumber(value);
  const abs = Math.abs(n).toLocaleString("en-US");
  return `${n >= 0 ? "+" : "-"}${abs} Credits`;
}

/** "$500.00" or "" when the row carries no USD equivalent. */
export function formatUsd(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Compact reference for the table: first 8 chars of the UUID, uppercase. */
export function shortRef(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

/** "Oct 24, 2025 · 02:45 PM" in the viewer's locale/timezone. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${date} · ${time}`;
}

/** Full timestamp for the detail modal and the PDF, incl. timezone name. */
export function formatFullDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

const MAX_SEARCH_LENGTH = 80;

/**
 * Neutralize everything that would break out of a PostgREST `or=` filter
 * (comma/parens split filters, % and * are wildcards, " quotes values).
 */
export function sanitizeSearch(raw: string): string {
  return raw
    .replace(/[,()%*"']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SEARCH_LENGTH);
}

const FULL_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * or()-filter for a sanitized search term. Postgres has no ilike operator for
 * uuid ("operator does not exist: uuid ~~* unknown"), and casts are not allowed
 * inside or() logic trees — so a reference only matches when the full UUID is
 * pasted (the table's copy button provides exactly that).
 */
export function buildSearchOrClause(search: string): string {
  const parts = [`description.ilike.%${search}%`];
  if (FULL_UUID_RE.test(search)) parts.push(`id.eq.${search.toLowerCase()}`);
  return parts.join(",");
}

export type LedgerListParams = {
  page: number;
  limit?: number;
  filter: LedgerFilter;
  /** 0 = all time. */
  days: number;
  /** Raw user input; sanitized here before it becomes a query string. */
  search: string;
};

/** Builds the /api/wallet/transactions query string for the current view. */
export function buildTransactionsQuery({
  page,
  limit,
  filter,
  days,
  search,
}: LedgerListParams): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  applyLedgerView(params, { filter, days, search });
  return params.toString();
}

/** Query string for /api/wallet/transactions/statement (same view, no paging). */
export function buildStatementQuery(
  view: Pick<LedgerListParams, "filter" | "days" | "search">
): string {
  const params = new URLSearchParams();
  applyLedgerView(params, view);
  return params.toString();
}

function applyLedgerView(
  params: URLSearchParams,
  { filter, days, search }: Pick<LedgerListParams, "filter" | "days" | "search">
): void {
  if (filter !== "all") params.set("type", filter);
  if (days > 0) params.set("days", String(days));
  const q = sanitizeSearch(search);
  if (q) params.set("q", q);
}

/**
 * Human label for how a payment was made, derived from the row's metadata
 * (the only metadata keys the wallet engine writes are display-safe).
 */
export function paymentMethodFor(t: LedgerTransaction): string {
  const source = typeof t.metadata?.source === "string" ? t.metadata.source : "";
  if (source === "stripe_checkout") return "Stripe Checkout";
  if (source === "wallet_launch") return "Rahvana Wallet";
  if (t.actor_type === "stripe_webhook") return "Stripe";
  if (t.actor_type === "admin") return "Rahvana support adjustment";
  if (t.actor_type === "system") return "Rahvana system";
  if (t.transaction_type === "refund") return "Refund processing";
  return "Rahvana Wallet";
}

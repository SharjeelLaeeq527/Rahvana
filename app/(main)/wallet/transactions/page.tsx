"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  BookOpen,
  CalendarCheck,
  Clock,
  Coins,
  Copy,
  Check,
  Download,
  ExternalLink,
  Gift,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Wallet,
  Wrench,
  Info,
} from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import Pagination from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/app/context/AuthContext";
import { useWallet } from "@/app/context/WalletContext";
import { useToast } from "@/app/components/shared/ToastProvider";
import { getCatalogItem } from "@/lib/wallet/catalog";
import { TransactionDetailModal } from "@/app/components/wallet/TransactionDetailModal";
import {
  LEDGER_DATE_RANGES,
  LEDGER_FILTERS,
  LEDGER_FILTER_HINTS,
  LEDGER_FILTER_LABELS,
  buildStatementQuery,
  buildTransactionsQuery,
  categoryFor,
  formatCredits,
  formatSignedCredits,
  formatDateTime,
  formatUsd,
  isDebit,
  paymentMethodFor,
  shortRef,
  statusFor,
  type LedgerFilter,
  type LedgerSummary,
  type LedgerTransaction,
  type LedgerTransactionType,
} from "@/lib/wallet/transactions";

/**
 * Credit Wallet & Transactions — the user's dedicated wallet history section,
 * reachable from the profile tray. Hero: balance card (left) + lifetime stats
 * row (right). Below: searchable/filterable ledger with a server-rendered PDF
 * statement download and a per-row detail modal.
 *
 * All numbers come from /api/wallet/transactions (service-role reads of the
 * credit_transactions ledger); this page never computes money itself.
 */

const PAGE_LIMIT = 20;

const CATEGORY_ICONS: Record<LedgerTransactionType, typeof Coins> = {
  top_up: ArrowDownLeft,
  bonus: Gift,
  tool_launch: Wrench,
  guide_unlock: BookOpen,
  service_booking: CalendarCheck,
  refund: RotateCcw,
  adjustment: SlidersHorizontal,
};

type LedgerView = {
  transactions: LedgerTransaction[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  summary: LedgerSummary | null;
};

/** Muted one-hue wash per stat card — premium, not cartoonish. */
const STAT_TONES = {
  teal: {
    wash: "from-rahvana-primary-pale/70",
    icon: "bg-rahvana-primary-pale text-rahvana-primary",
  },
  violet: { wash: "from-violet-50/80", icon: "bg-violet-50 text-violet-600" },
  amber: { wash: "from-amber-50/80", icon: "bg-amber-50 text-amber-600" },
  emerald: { wash: "from-emerald-50/80", icon: "bg-emerald-50 text-emerald-600" },
} as const;

function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  tone,
  unit = "Credits",
}: {
  label: string;
  value: string;
  caption: string;
  icon: typeof Coins;
  tone: keyof typeof STAT_TONES;
  unit?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent ${STAT_TONES[tone].wash}`}
      />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">{label}</p>
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/5 ring-inset ${STAT_TONES[tone].icon}`}
          >
            <Icon size={16} aria-hidden="true" />
          </span>
        </div>
        <div className="mt-4">
          <p className="text-[26px] leading-none font-extrabold text-[#0a1128] tabular-nums">
            {value}
            {unit && (
              <span className="ml-1.5 text-[11px] font-bold tracking-wide text-slate-400 uppercase">
                {unit}
              </span>
            )}
          </p>
          <p className="mt-2 text-[11.5px] font-medium text-slate-400">{caption}</p>
        </div>
      </div>
    </div>
  );
}

export default function WalletTransactionsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { balance, isLoading: walletLoading, openTopup } = useWallet();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<LedgerFilter>("all");
  const [days, setDays] = useState<number>(30);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [view, setView] = useState<LedgerView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<LedgerTransaction | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Newest request wins; late responses from stale filters are dropped.
  const requestIdRef = useRef(0);

  // Send anonymous visitors to sign in, then back here (profile-page pattern).
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=${encodeURIComponent("/wallet/transactions")}`);
    }
  }, [authLoading, user, router]);

  // Debounce free-text search and always restart at page 1 when the view changes.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => {
    setPage(1);
  }, [filter, days, debouncedSearch]);

  const load = useCallback(async () => {
    const my = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const qs = buildTransactionsQuery({
        page,
        limit: PAGE_LIMIT,
        filter,
        days,
        search: debouncedSearch,
      });
      const res = await fetch(`/api/wallet/transactions?${qs}`, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (my !== requestIdRef.current) return;
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Could not load your transaction history.");
      }
      setView(data as LedgerView);
    } catch (e) {
      if (my !== requestIdRef.current) return;
      setError(e instanceof Error ? e.message : "Could not load your transaction history.");
    } finally {
      if (my === requestIdRef.current) setLoading(false);
    }
  }, [page, filter, days, debouncedSearch]);

  useEffect(() => {
    if (user) void load();
  }, [load, user]);

  // The wallet context refresh keeps the hero balance live after a top-up
  // completed in another tab or a Stripe redirect back to this page.
  useEffect(() => {
    if (!user) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load, user]);

  const summary = view?.summary ?? null;
  const pagination = view?.pagination;
  const rows = view?.transactions ?? [];
  const rangeStart =
    pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const rangeEnd = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;
  const copyReference = useCallback(
    async (t: LedgerTransaction) => {
      try {
        await navigator.clipboard.writeText(t.id);
        setCopiedId(t.id);
        showToast("Reference copied.", "success");
        setTimeout(() => setCopiedId((cur) => (cur === t.id ? null : cur)), 2000);
      } catch {
        showToast("Could not copy the reference.", "error");
      }
    },
    [showToast]
  );

  // Server-rendered PDF of exactly the view on screen (same chip/range/search).
  const downloadStatement = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const qs = buildStatementQuery({ filter, days, search: debouncedSearch });
      const res = await fetch(`/api/wallet/transactions/statement${qs ? `?${qs}` : ""}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Could not generate the statement. Please try again.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Rahvana-Wallet-Statement-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("Statement downloaded.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not generate the statement.", "error");
    } finally {
      setDownloading(false);
    }
  }, [downloading, filter, days, debouncedSearch, showToast]);

  // Signed-out visitors are redirected by the effect above; hold the screen.
  if (authLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader size="md" text="Checking your session…" subText="Please wait a moment" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pt-16">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ---------------- Page header ---------------- */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-[#0a1128]">
              Credit Wallet &amp; Transactions
            </h1>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-500">
              Track your credit balance, review standalone tool, guide and service charges, and
              download a complete statement of every deposit and disbursement.
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-600 shadow-sm"
            title="Rahvana Credits map 1:1 to US dollars."
          >
            <Coins size={13} className="text-rahvana-primary" aria-hidden="true" />1 USD = 1 Rahvana
            Credit
          </span>
        </div>

        {/* ---------------- Hero: balance + lifetime stats ---------------- */}
        <div className="mt-6 grid gap-5 lg:grid-cols-12">
          {/* Balance card — the platform's premium deep-teal hero treatment */}
          <div className="shadow-rahvana-primary/20 relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d7377] via-[#095c5f] to-[#063e40] p-6 text-white shadow-lg ring-1 ring-black/5 lg:col-span-5">
            <div
              aria-hidden="true"
              className="bg-rahvana-secondary/15 pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full blur-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-white/5 blur-2xl"
            />
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-semibold text-white/70">Available Credits</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white ring-1 ring-white/15 ring-inset">
                  <span
                    className="bg-rahvana-secondary h-1.5 w-1.5 rounded-full"
                    aria-hidden="true"
                  />
                  Active &amp; Unrestricted
                </span>
              </div>
              <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-[42px] leading-none font-extrabold tracking-tight text-white tabular-nums">
                  {balance !== null ? formatCredits(balance) : walletLoading ? "…" : "0"}
                </span>
                <span className="rounded-md bg-white/15 px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-white uppercase ring-1 ring-white/10 ring-inset">
                  Credits
                </span>
                <span className="text-[13px] font-semibold text-white/60 tabular-nums">
                  {balance !== null ? `\u2248 ${formatUsd(balance)} USD` : ""}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openTopup({ returnUrl: "/wallet/transactions" })}
              className="text-rahvana-primary-dark hover:bg-rahvana-primary-pale relative mt-6 inline-flex w-fit items-center gap-2 rounded-2xl bg-white px-5 py-3 text-[14px] font-bold shadow-sm transition-all hover:shadow-md"
            >
              <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
              Top Up Credits
            </button>
          </div>

          {/* Stats row (right, three cards side by side) */}
          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-7">
            <StatCard
              label="Total Credits Added"
              value={summary ? formatCredits(summary.totalAdded) : "—"}
              caption={
                summary
                  ? `${formatUsd(summary.totalAdded) || "$0.00"} cumulative deposits`
                  : "Awaiting ledger summary"
              }
              icon={ArrowDownLeft}
              tone="teal"
            />
            <StatCard
              label="Credits Spent"
              value={summary ? formatCredits(summary.totalSpent) : "—"}
              caption="Tools, guides & booked services"
              icon={Wallet}
              tone="violet"
            />
            <StatCard
              label="Pending Items"
              value={summary ? formatCredits(summary.pendingCount) : "—"}
              caption={
                summary && summary.pendingCount > 0
                  ? "Settlement in progress"
                  : "All balances settled"
              }
              icon={summary && summary.pendingCount > 0 ? Clock : Check}
              tone={summary && summary.pendingCount > 0 ? "amber" : "emerald"}
              unit=""
            />
          </div>
        </div>

        {/* ---------------- Transaction history ---------------- */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Card head */}
          <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-[19px] font-extrabold tracking-tight text-[#0a1128]">
                  Transaction History
                </h2>
                {pagination && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-bold text-slate-600 tabular-nums">
                    {pagination.total} transactions
                  </span>
                )}
              </div>
              <p className="mt-1 text-[13px] text-slate-500">
                Complete audit trail of top-ups, tool &amp; guide unlocks, booked services, and
                refunds.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadStatement}
              disabled={downloading}
              className="hover:border-rahvana-primary/40 hover:text-rahvana-primary-dark inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-slate-700 shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloading ? (
                <>
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                  Preparing PDF…
                </>
              ) : (
                <>
                  <Download size={15} aria-hidden="true" />
                  Download Statement (PDF)
                </>
              )}
            </button>
          </div>

          {/* Toolbar: search left, filters + date range right */}
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
              <Search
                size={15}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by description or reference…"
                aria-label="Search transactions"
                className="focus:border-rahvana-primary/50 focus:ring-rahvana-primary/15 w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-[13px] font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:outline-none"
              />
            </div>

            <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
              <div
                className="flex flex-wrap items-center gap-1 rounded-full bg-slate-100 p-1"
                role="group"
                aria-label="Filter transactions"
              >
                {LEDGER_FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    aria-pressed={filter === f}
                    title={LEDGER_FILTER_HINTS[f]}
                    className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-all ${
                      filter === f
                        ? "text-rahvana-primary-dark bg-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {LEDGER_FILTER_LABELS[f]}
                  </button>
                ))}
              </div>

              <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                <SelectTrigger
                  className="w-[150px] rounded-xl border-slate-200 bg-white text-[12.5px] font-semibold text-slate-600 shadow-none"
                  aria-label="Date range"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEDGER_DATE_RANGES.map((r) => (
                    <SelectItem
                      key={r.days}
                      value={String(r.days)}
                      className="text-[12.5px] font-medium"
                    >
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="border-t border-slate-100">
            {error ? (
              <div className="px-6 py-14 text-center">
                <p className="mx-auto max-w-md text-[13.5px] font-semibold text-red-600">{error}</p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="bg-rahvana-primary hover:bg-rahvana-primary-dark mt-4 rounded-2xl px-5 py-2.5 text-[13.5px] font-bold text-white transition-colors"
                >
                  Try again
                </button>
              </div>
            ) : loading && !view ? (
              <div className="flex items-center justify-center px-6 py-16">
                <Loader
                  size="sm"
                  text="Loading your history…"
                  subText="Reading your credit ledger"
                />
              </div>
            ) : rows.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <Coins size={24} aria-hidden="true" />
                </span>
                <p className="mt-4 text-[15px] font-bold text-slate-800">No transactions found</p>
                <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">
                  {debouncedSearch || filter !== "all" || days !== 0
                    ? "Nothing matches the current filters. Try widening the range or clearing the search."
                    : "Top up your wallet or unlock a tool to start your credit history."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      {[
                        "Transaction Details",
                        "Date & Time",
                        "Category",
                        "Status",
                        "Amount",
                        "",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className={`px-4 py-3 text-[10.5px] font-bold tracking-[0.06em] whitespace-nowrap text-slate-500 uppercase ${i >= 5 ? "text-right" : ""}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody
                    className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}
                  >
                    {rows.map((t) => {
                      const category = categoryFor(t.transaction_type);
                      const status = statusFor(t.status);
                      const Icon = CATEGORY_ICONS[t.transaction_type] ?? Coins;
                      const resource = getCatalogItem(t.resource_type, t.resource_id)?.name;
                      const debit = isDebit(t);
                      return (
                        <tr
                          key={t.id}
                          className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
                        >
                          {/* Details */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${category.tile}`}
                                aria-hidden="true"
                              >
                                <Icon size={16} />
                              </span>
                              <div className="max-w-[300px] min-w-0">
                                <p className="truncate text-[13.5px] font-bold text-slate-800">
                                  {t.description}
                                </p>
                                <p className="truncate text-[11.5px] font-medium text-slate-400">
                                  {resource ?? paymentMethodFor(t)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-[12.5px] font-medium whitespace-nowrap text-slate-500">
                            {formatDateTime(t.created_at)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${category.badge}`}
                            >
                              {category.label}
                            </span>
                          </td>
                  <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${status.pill}`}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <span
                              className={`text-[13.5px] font-extrabold tabular-nums ${debit ? "text-slate-900" : "text-emerald-600"}`}
                            >
                              {formatSignedCredits(t.amount)}
                            </span>
                          </td>
                          {/* Action: full record in a modal */}
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => setDetail(t)}
                              aria-label={`View details for ${t.description}`}
                              title="View transaction details"
                              className="hover:border-rahvana-primary/40 hover:bg-rahvana-primary-pale hover:text-rahvana-primary-dark inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors"
                            >
                              <Info size={15} strokeWidth={2.25} aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination footer — shared Pagination component */}
          {pagination && pagination.total > 0 && pagination.totalPages > 1 && (
            <div className="border-t border-slate-100 px-3 py-4 sm:px-4">
              <p className="px-3 text-[12.5px] font-medium text-slate-500 tabular-nums sm:hidden">
                Showing {rangeStart}–{rangeEnd} of {pagination.total} transactions
              </p>
              <Pagination
                currentPage={page}
                totalItems={pagination.total}
                itemsPerPage={PAGE_LIMIT}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-[11.5px] text-slate-400">
          Journey tools on your subscription plan never spend wallet credits. Every line here is a
          standalone purchase or top-up.
        </p>
      </div>

      {detail && <TransactionDetailModal transaction={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  BookOpen,
  CalendarCheck,
  Clock,
  Coins,
  HelpCircle,
  Check,
  Download,
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
    <div className="bg-[#F6F4EF] min-h-screen pt-16">
      <div className="w-full">
        {/* Hero Header Deck */}
        <header className="relative overflow-hidden bg-[#0A4F49] px-4 py-10 pb-20 text-white sm:px-6 lg:px-10">
          <svg
            className="pointer-events-none absolute bottom-14 hidden h-[160px] w-[150px] opacity-[.14] md:right-[200px] md:block lg:right-[400px]"
            viewBox="160 70 840 850"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Directional Credit Flow Arc */}
            <path
              d="M 230 330 A 380 380 0 0 1 885 265"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="20 14"
            />
            <polyline
              points="855,235 892,268 852,295"
              fill="none"
              stroke="currentColor"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Credit Token Coins */}
            <g transform="translate(715, 130)">
              <circle
                cx="115"
                cy="65"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="7"
                opacity="0.7"
              />
              <circle cx="65" cy="95" r="64" fill="none" stroke="currentColor" strokeWidth="10" />
              <circle
                cx="65"
                cy="95"
                r="46"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="8 6"
              />
              <path
                d="M 65 62 V 128 M 82 75 C 82 67 48 67 48 79 C 48 92 82 90 82 105 C 82 118 48 118 48 109"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </g>

            {/* Ledger Card & Pending Clock */}
            <g transform="translate(690, 625)">
              <rect
                x="0"
                y="0"
                width="215"
                height="165"
                rx="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="9"
              />
              <circle cx="34" cy="45" r="8" fill="currentColor" />
              <line
                x1="56"
                y1="45"
                x2="145"
                y2="45"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <line
                x1="165"
                y1="45"
                x2="188"
                y2="45"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <circle cx="34" cy="84" r="8" fill="currentColor" />
              <line
                x1="56"
                y1="84"
                x2="130"
                y2="84"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <line
                x1="165"
                y1="84"
                x2="188"
                y2="84"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <circle cx="34" cy="123" r="8" fill="currentColor" opacity="0.65" />
              <line
                x1="56"
                y1="123"
                x2="120"
                y2="123"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.65"
              />
              <circle cx="176" cy="123" r="18" fill="none" stroke="currentColor" strokeWidth="6" />
              <polyline
                points="176,113 176,123 183,127"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </g>

            {/* Rahvana Bird */}
            <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M236,880C228,876 222,867 222,860C222,854 229,840 237,832C244,824 270,806 281,801C284,800 296,794 300,792C307,789 328,781 348,774C352,772 358,770 360,770C361,769 364,768 366,768C367,768 370,767 371,766C372,766 376,764 380,763C383,762 387,761 390,760C392,760 397,758 401,757C405,756 413,754 418,753C424,751 429,750 430,750C432,750 448,740 452,735C454,734 458,730 462,728C482,713 509,687 523,667C529,659 529,657 523,657C518,657 500,652 492,648C487,646 474,640 469,637C449,626 418,594 404,570C400,564 399,562 389,556C359,535 336,510 321,479C307,452 300,426 300,400C300,383 301,378 306,374C311,370 319,373 326,381C327,383 330,386 331,387C332,389 333,390 333,390C333,391 335,394 338,398C340,403 342,406 342,407C342,407 344,411 346,416C348,421 352,429 354,434C356,440 358,445 359,446C359,448 361,452 363,457C365,462 367,469 369,472C371,476 372,480 372,481C372,481 373,484 374,486C377,493 378,496 379,500C380,502 383,507 384,511C386,514 387,517 387,518C387,518 388,521 390,525C392,529 394,533 395,535C397,540 397,541 402,550C421,585 441,608 468,626C475,631 496,642 498,642C498,642 500,643 502,643C509,646 526,650 532,650C535,650 535,650 541,639C544,632 546,626 546,626C546,625 546,624 547,623C548,622 552,609 557,591C563,564 561,527 551,502C540,474 522,455 487,434C485,433 465,423 462,421C454,418 432,409 421,405C417,403 412,401 410,400C409,400 405,398 403,397C398,396 393,393 382,388C368,382 366,381 361,378C358,376 356,375 355,375C355,375 352,374 350,372C347,371 345,369 344,368C308,347 280,314 266,276C263,267 258,251 257,245C256,242 254,236 254,233C249,216 247,184 248,161C249,142 252,136 259,132C269,127 278,135 293,159C311,187 325,207 337,220C339,223 344,229 347,232C366,254 396,279 416,290C419,291 422,293 424,294C428,297 442,303 451,308C462,313 471,317 476,319C490,325 493,326 502,331C507,333 516,338 520,340C525,343 531,346 533,347C540,351 550,358 560,365C566,369 572,374 573,375C580,380 602,402 609,412C620,427 622,430 630,446C635,457 637,462 643,480C646,488 649,504 653,525C659,563 660,567 668,567C671,567 673,566 675,566C676,565 677,564 678,564C680,564 710,541 728,525C732,522 744,511 754,501C779,477 785,472 798,464C816,454 834,449 854,452C869,454 879,458 892,469C898,474 902,476 913,477C935,480 943,482 943,485C942,487 935,491 930,492C921,494 907,500 894,507C880,515 866,529 858,544C852,555 846,567 846,569C846,570 846,571 845,572C845,572 843,576 842,581C839,589 838,592 835,600C835,602 833,606 832,610C831,615 826,630 822,640C810,675 776,713 739,732C735,734 731,737 730,737C729,738 721,742 714,744C678,758 649,762 609,760C585,759 577,758 568,757C521,751 463,751 439,757C434,758 402,783 383,800C377,805 370,810 368,813C359,820 353,825 340,836C312,859 289,874 269,880C261,883 242,883 236,880ZM259,873C275,872 299,859 323,840C328,836 334,831 337,829C339,826 348,819 355,813C366,803 377,794 395,780C396,778 398,777 399,776C400,775 403,773 406,770C415,763 417,761 409,763C406,764 398,767 391,769C373,773 378,772 340,785C336,786 332,787 331,788C330,788 328,789 326,790C308,797 285,807 276,812C248,829 231,848 231,861C231,866 237,873 243,874C245,874 247,874 248,875C248,875 250,875 251,874C252,874 256,874 259,873ZM652,751C666,749 677,747 683,745C697,741 700,740 711,736C717,734 723,731 725,730C726,730 727,729 728,729C728,729 731,728 733,726C736,724 738,723 739,723C740,723 759,710 766,704C774,697 788,683 791,678C798,669 804,659 804,659C804,658 805,657 805,656C807,654 816,632 820,622C821,617 823,612 823,611C824,610 826,603 828,596C830,589 833,579 835,574C837,568 839,562 840,561C840,560 841,557 842,556C842,555 843,553 844,552C856,529 871,512 888,502C897,497 911,490 914,489C923,488 921,485 911,485C900,484 895,481 884,473C874,466 870,463 860,461C848,458 829,459 816,464C797,472 785,481 746,520C739,527 730,535 726,538C722,541 715,546 710,551C679,575 669,579 661,574C652,568 650,562 643,521C635,473 625,446 601,414C593,404 573,384 561,375C548,365 523,350 510,344C508,343 505,341 504,341C489,333 476,327 475,327C474,327 471,326 468,324C464,323 459,320 455,318C411,299 383,280 352,248C325,221 316,208 282,157C266,133 260,132 257,154C255,168 257,210 260,222C260,224 262,229 262,234C265,245 268,257 273,269C274,272 276,276 276,277C279,287 291,309 301,321C309,332 337,357 340,357C341,357 344,359 347,361C350,363 357,367 362,369C376,376 392,384 392,384C393,384 396,385 399,387C405,390 424,398 432,401C435,402 441,404 446,407C452,409 456,411 457,411C457,411 459,412 461,412C462,413 468,416 474,419C489,426 491,427 498,431C536,456 554,479 565,519C567,526 567,529 567,554C567,581 567,589 563,600C562,601 562,604 561,606C561,609 559,615 557,620C555,626 552,632 552,633C552,635 549,639 547,643C545,647 544,650 544,651C545,651 552,651 559,651C594,651 625,641 668,615C673,612 678,609 679,609C680,608 683,607 686,605C691,602 694,602 694,604C694,605 678,617 667,624C654,633 636,642 627,646C596,656 584,659 556,660L538,660L534,666C530,672 530,673 522,682C518,686 513,692 511,695C507,699 488,718 481,723C474,729 462,738 460,740C457,742 454,745 455,745C455,746 463,745 472,745C492,743 529,745 557,748C576,750 595,752 602,752C612,753 645,752 652,751ZM390,545C390,544 390,543 389,542C386,537 378,518 371,501C369,495 365,486 363,482C362,477 359,470 357,466C356,462 353,455 351,450C349,445 347,440 347,438C335,406 319,380 312,381C310,381 309,382 309,388C308,395 309,420 310,424C311,425 312,429 312,431C312,433 314,438 314,440C315,442 317,447 318,449C324,472 342,502 359,520C374,536 390,549 390,545Z"
                />
          </svg>
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-7">
            <div className="max-w-2xl">
              <h1 className="text-[30px] leading-tight font-extrabold tracking-tight text-white sm:text-[38px] lg:text-[42px]">
                Credit Wallet &amp; Transactions
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-white/85 sm:text-[15px]">
                Track your credit balance, review standalone tool, guide and service charges, and
                download a complete statement of every deposit and disbursement.
              </p>
            </div>

            <div className="flex items-center">
              <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white px-5 py-3 shadow-xl shadow-black/10">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f6f3] text-[#0a4f49]">
                  <Coins size={18} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#0a1128]">Universal 1:1 Parity</p>
                  <p className="text-[11px] text-slate-500">
                    1 Credit = $1.00 USD for all services
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="relative z-10 mx-auto -mt-11 w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          {/* Overview Grid */}
          <section className="grid gap-5 lg:grid-cols-12">
            {/* Balance Card */}
            <div className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl border border-[#0f8f80]/30 bg-gradient-to-br from-[#E8F6F3] to-[#D8EFEA] p-6 text-[#0a1128] shadow-[0_10px_30px_-10px_rgba(10,79,73,0.1)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0f8f80]/50 hover:shadow-[0_14px_36px_-10px_rgba(10,79,73,0.16)] sm:p-7 lg:col-span-5">
              <div className="pointer-events-none absolute -right-6 -bottom-6 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(15,143,128,0.14),transparent_70%)]" />

              <div className="relative z-10">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[13.5px] font-bold tracking-wide text-[#0a4f49]">
                    Available Credits
                    <span title="Your available wallet balance">
                      <HelpCircle size={14} className="opacity-80" />
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-2">
                  <span className="font-serif text-[38px] leading-none font-bold tracking-tight text-[#0a4f49] sm:text-[46px]">
                    {balance !== null ? formatCredits(balance) : walletLoading ? "…" : "0"}
                  </span>

                  <span className="rounded-md bg-[#0a4f49]/10 px-2 py-1 text-[11px] font-bold tracking-wider text-[#0a4f49] uppercase">
                    Credits
                  </span>

                  <span className="text-[13px] font-medium text-slate-500 sm:text-[14px]">
                    {balance !== null ? `≈ ${formatUsd(balance)} USD` : ""}
                  </span>
                </div>
              </div>

              <div className="relative z-10 mt-6 flex items-center border-t border-[#0a4f49]/15 pt-5">
                <button
                  type="button"
                  onClick={() => openTopup({ returnUrl: "/wallet/transactions" })}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0a4f49] px-5 py-3 text-[13.5px] font-bold text-white shadow-md shadow-[#0a4f49]/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#073b37] hover:shadow-lg active:scale-[0.98]"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  Top Up Credits
                </button>
              </div>
            </div>

            {/* Metrics Cluster */}
            <div className="grid gap-4 sm:grid-cols-3 lg:col-span-7">
              {/* Total Credits Added */}
              <div className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0f8f80]/25 hover:shadow-md">
                <div className="mb-5 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    Total Credits Added
                  </span>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f6f3] text-[#0a4f49]">
                    <ArrowDownLeft size={18} strokeWidth={2.5} />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-baseline gap-1.5 text-[24px] leading-tight font-bold text-[#0a1128]">
                    <span>{summary ? formatCredits(summary.totalAdded) : "—"}</span>
                    <span className="text-[11.5px] font-semibold text-slate-400">Credits</span>
                  </div>
                  <p className="mt-1.5 text-[12px] text-slate-500">
                    {summary
                      ? `${formatUsd(summary.totalAdded) || "$0.00"} cumulative deposits`
                      : "Awaiting ledger summary"}
                  </p>
                </div>
              </div>

              {/* Credits Spent */}
              <div className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0f8f80]/25 hover:shadow-md">
                <div className="mb-5 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    Credits Spent
                  </span>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                    <Wallet size={18} />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-baseline gap-1.5 text-[24px] leading-tight font-bold text-[#0a1128]">
                    <span>{summary ? formatCredits(summary.totalSpent) : "—"}</span>
                    <span className="text-[11.5px] font-semibold text-slate-400">Credits</span>
                  </div>
                  <p className="mt-1.5 text-[12px] text-slate-500">Tools, guides &amp; services</p>
                </div>
              </div>

              {/* Pending Items */}
              <div className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0f8f80]/25 hover:shadow-md">
                <div className="mb-5 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    Pending Items
                  </span>
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      summary && summary.pendingCount > 0
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {summary && summary.pendingCount > 0 ? (
                      <Clock size={18} />
                    ) : (
                      <Check size={18} strokeWidth={2.5} />
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-baseline gap-1.5 text-[24px] leading-tight font-bold text-[#0a1128]">
                    <span>{summary ? formatCredits(summary.pendingCount) : "—"}</span>
                    <span className="text-[11.5px] font-semibold text-slate-400">Credits</span>
                  </div>

                  <p
                    className={`mt-1.5 flex items-center gap-1 text-[12px] font-semibold ${
                      summary && summary.pendingCount > 0 ? "text-amber-700" : "text-emerald-700"
                    }`}
                  >
                    {summary && summary.pendingCount > 0
                      ? "Settlement in progress"
                      : "All balances settled"}
                  </p>
                </div>
              </div>
            </div>
          </section>

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
                  className="scrollbar-hide flex w-full items-center gap-1 overflow-x-auto rounded-full bg-slate-100 p-1 whitespace-nowrap sm:w-fit"
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
                      className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-bold whitespace-nowrap transition-all ${
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
                  <p className="mx-auto max-w-md text-[13.5px] font-semibold text-red-600">
                    {error}
                  </p>
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
          {detail && (
            <TransactionDetailModal transaction={detail} onClose={() => setDetail(null)} />
          )}
        </main>
      </div>
    </div>
  );
}
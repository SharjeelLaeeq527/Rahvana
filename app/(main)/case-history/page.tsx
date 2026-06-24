"use client";

// Shared case progress and presentation-aggregated activity history.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/app/context/AuthContext";
import { FilterPanel, type FilterField } from "@/app/components/shared/FilterPanel";
import { Loader } from "@/components/ui/spinner";
import Pagination from "@/components/ui/pagination";
import CaseProgressPanel from "@/components/case/CaseProgressPanel";
import {
  Activity,
  CheckCircle2,
  Dot,
  FileCheck,
  Paperclip,
  Pencil,
  RotateCcw,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";

interface ActivityEntry {
  id: string;
  action: string;
  category: ActivityType | "other";
  actorRole: "petitioner" | "beneficiary" | "owner" | null;
  targetLabel: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  lastActivityAt: string;
  actorUserId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  isYou: boolean;
  aggregateCount: number;
  activityIds: string[];
}

const ACTIVITY_ITEMS_PER_PAGE = 25;

interface ActivityPageCache {
  entries: ActivityEntry[];
  totalItems: number;
}

const ACTION_META: Record<string, { verb: string; icon: LucideIcon; tone: string; bg: string }> = {
  "document.upload": {
    verb: "uploaded",
    icon: Paperclip,
    tone: "text-sky-700",
    bg: "bg-sky-50",
  },
  "document.delete": {
    verb: "deleted",
    icon: Trash2,
    tone: "text-rose-700",
    bg: "bg-rose-50",
  },
  "document.update": {
    verb: "updated",
    icon: Pencil,
    tone: "text-sky-700",
    bg: "bg-sky-50",
  },
  "form.save": {
    verb: "updated",
    icon: Pencil,
    tone: "text-amber-700",
    bg: "bg-amber-50",
  },
  "form.complete": {
    verb: "completed",
    icon: FileCheck,
    tone: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  "step.complete": {
    verb: "completed step",
    icon: CheckCircle2,
    tone: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  "step.reopen": {
    verb: "reopened step",
    icon: RotateCcw,
    tone: "text-slate-600",
    bg: "bg-slate-100",
  },
  "role.assign": {
    verb: "assigned case roles",
    icon: Users,
    tone: "text-[#0d7377]",
    bg: "bg-teal-50",
  },
};

type RoleFilter = "all" | "petitioner" | "beneficiary";
type ActivityType = "all" | "documents" | "forms" | "steps" | "roles";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (Number.isNaN(diff)) return "";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function exactTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function roleBadge(role: ActivityEntry["actorRole"]) {
  if (role === "petitioner") {
    return (
      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
        Petitioner
      </span>
    );
  }

  if (role === "beneficiary") {
    return (
      <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs font-medium text-fuchsia-700">
        Beneficiary
      </span>
    );
  }

  if (role === "owner") {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        Owner
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
      Case Member
    </span>
  );
}

function actorLabel(entry: ActivityEntry): string {
  if (entry.isYou) return "You";
  return entry.actorName || entry.actorEmail || "Case Member";
}

export default function CaseHistoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [journeyId, setJourneyId] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [typeFilter, setTypeFilter] = useState<ActivityType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalActivityItems, setTotalActivityItems] = useState(0);
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageCacheRef = useRef<Map<number, ActivityPageCache>>(new Map());
  const prefetchingPagesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      const { data: own } = await supabase
        .from("journeys")
        .select("id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let jid = (own as { id: string } | null)?.id ?? null;

      if (!jid) {
        const { data: collab } = await supabase
          .from("case_collaborators")
          .select("journey_id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("joined_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        jid = (collab as { journey_id: string } | null)?.journey_id ?? null;
      }

      if (!cancelled) {
        setJourneyId(jid);
        setResolved(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, supabase]);

  const fetchActivityPage = useCallback(
    async (page: number, options: { apply: boolean } = { apply: true }) => {
      if (!journeyId) return null;

      const cached = pageCacheRef.current.get(page);
      if (cached) {
        if (options.apply) {
          setEntries(cached.entries);
          setTotalActivityItems(cached.totalItems);
          setError(null);
          setLoading(false);
        }
        return cached;
      }

      if (!options.apply && prefetchingPagesRef.current.has(page)) return null;
      if (!options.apply) prefetchingPagesRef.current.add(page);

      try {
        const params = new URLSearchParams({
          journeyId,
          page: String(page),
          pageSize: String(ACTIVITY_ITEMS_PER_PAGE),
        });
        const res = await fetch(`/api/case/activity?${params.toString()}`);
        const json = await res.json();

        if (!res.ok) {
          if (options.apply) {
            setError(json?.error?.message || "Could not load activity history.");
          }
          return null;
        }

        const pageData = {
          entries: json.data?.activity ?? [],
          totalItems: json.data?.pagination?.totalItems ?? 0,
        };

        pageCacheRef.current.set(page, pageData);

        if (options.apply) {
          setEntries(pageData.entries);
          setTotalActivityItems(pageData.totalItems);
          setError(null);
        }

        return pageData;
      } catch {
        if (options.apply) {
          setError("Could not load activity history.");
        }
        return null;
      } finally {
        if (options.apply) setLoading(false);
        prefetchingPagesRef.current.delete(page);
      }
    },
    [journeyId]
  );

  const load = useCallback(async () => {
    if (!journeyId) {
      setLoading(false);
      return;
    }
    await fetchActivityPage(currentPage, { apply: true });
  }, [currentPage, fetchActivityPage, journeyId]);

  useEffect(() => {
    if (resolved) load();
  }, [resolved, load]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(totalActivityItems / ACTIVITY_ITEMS_PER_PAGE));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalActivityItems]);

  useEffect(() => {
    if (!journeyId || totalActivityItems === 0) return;

    const totalPages = Math.max(1, Math.ceil(totalActivityItems / ACTIVITY_ITEMS_PER_PAGE));
    if (currentPage < totalPages) {
      void fetchActivityPage(currentPage + 1, { apply: false });
    }
    if (currentPage > 1) {
      void fetchActivityPage(currentPage - 1, { apply: false });
    }
  }, [currentPage, fetchActivityPage, journeyId, totalActivityItems]);

  useEffect(() => {
    if (!journeyId) return;

    const scheduleRefetch = () => {
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      refetchTimer.current = setTimeout(() => {
        pageCacheRef.current.clear();
        void load();
      }, 600);
    };

    const channel = supabase
      .channel(`case-activity:${journeyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "case_activity",
          filter: `journey_id=eq.${journeyId}`,
        },
        scheduleRefetch
      )
      .subscribe();

    return () => {
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      supabase.removeChannel(channel);
    };
  }, [journeyId, load, supabase]);

  const filtered = useMemo(
    () =>
      entries.filter((entry) => {
        const roleMatches = roleFilter === "all" || entry.actorRole === roleFilter;
        const typeMatches = typeFilter === "all" || entry.category === typeFilter;
        return roleMatches && typeMatches;
      }),
    [entries, roleFilter, typeFilter]
  );

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        key: "role",
        label: "Role",
        value: roleFilter,
        options: [
          { value: "all", label: "All" },
          { value: "petitioner", label: "Petitioner" },
          { value: "beneficiary", label: "Beneficiary" },
        ],
      },
      {
        key: "type",
        label: "Activity Type",
        value: typeFilter,
        options: [
          { value: "all", label: "All Activities" },
          { value: "documents", label: "Documents" },
          { value: "forms", label: "Forms" },
          { value: "steps", label: "Steps" },
          { value: "roles", label: "Roles" },
        ],
      },
    ],
    [roleFilter, typeFilter]
  );

  return (
    <div className="guide-grid-bg min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 mt-10">
          <button
            onClick={() => router.push("/settings")}
            className="mb-3 text-sm text-slate-500 hover:text-slate-700"
          >
            Back to settings
          </button>
          <h1 className="text-2xl font-semibold text-slate-900">Progress &amp; history</h1>
          <p className="mt-1 text-sm text-slate-500">
            Shared progress, collaboration signals, and audit activity for this case.
          </p>
        </div>

      {!authLoading && !loading && !error && journeyId && (
        <div className="mb-6">
          <CaseProgressPanel journeyId={journeyId} />
        </div>
      )}

      {(authLoading || (loading && !error)) && (
        <div className="flex justify-center py-16">
          <Loader />
        </div>
      )}

      {!authLoading && !loading && error && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-red-600">
          {error}
        </div>
      )}

      {!authLoading && !loading && !error && !journeyId && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          You don&apos;t have a case yet. Start your journey to begin tracking activity.
        </div>
      )}

      {!authLoading && !loading && !error && journeyId && (
        <section className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-4 shadow-sm backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Activity feed</h2>
                <p className="text-sm text-slate-500">
                  Repeated actions are grouped into feed entries while audit records stay intact.
                </p>
              </div>
              <span className="hidden items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200 sm:flex">
                <Activity className="h-3.5 w-3.5" />
                Latest first
              </span>
            </div>

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <FilterPanel
                fields={filterFields}
                onFilterChange={(filters) => {
                  setRoleFilter((filters.role as RoleFilter) || "all");
                  setTypeFilter((filters.type as ActivityType) || "all");
                }}
                itemCount={filtered.length}
                totalCount={totalActivityItems}
              />
              <p className="text-sm text-slate-500">
                Showing <span className="font-semibold text-slate-800">{filtered.length}</span> of{" "}
                <span className="font-semibold text-slate-800">{totalActivityItems}</span>{" "}
                aggregated entries
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <Activity className="h-6 w-6 text-[#0d7377]" strokeWidth={2} />
                </div>
                <p className="mx-auto max-w-lg text-sm text-slate-600">
                  {entries.length === 0
                    ? "No activity recorded yet. Actions such as document uploads, form updates, and completed steps will appear here."
                    : "No activity matches the selected filters."}
                </p>
              </div>
            ) : (
              <ol className="max-h-[650px] space-y-0 overflow-y-auto pr-2">
                {filtered.map((entry, index) => {
                  const meta =
                    ACTION_META[entry.action] || {
                      verb: entry.action,
                      icon: Dot,
                      tone: "text-slate-500",
                      bg: "bg-slate-100",
                    };
                  const Icon = meta.icon;
                  const isLast = index === filtered.length - 1;
                  const relative = timeAgo(entry.createdAt);
                  const exact = exactTime(entry.createdAt);

                  return (
                    <li key={entry.id} className="relative flex gap-4 pb-5">
                      {!isLast && (
                        <span className="absolute left-[18px] top-10 h-[calc(100%-2.5rem)] w-px bg-slate-200" />
                      )}
                      <span
                        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.bg} ring-4 ring-slate-50`}
                      >
                        <Icon className={`h-4.5 w-4.5 ${meta.tone}`} strokeWidth={2} />
                      </span>

                      <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                          <span className="font-semibold text-slate-900">{actorLabel(entry)}</span>
                          {roleBadge(entry.actorRole)}
                          {entry.aggregateCount > 1 && (
                            <span className="rounded-full bg-[#0d7377]/10 px-2 py-0.5 text-xs font-semibold text-[#0d7377]">
                              {entry.aggregateCount} changes
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-slate-600">
                          <span>{meta.verb}</span>
                          {entry.targetLabel && (
                            <span className="font-medium text-slate-800">
                              {" "}
                              {entry.targetLabel}
                            </span>
                          )}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          {relative}
                          {exact && <span> &bull; {exact}</span>}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
            {totalActivityItems > ACTIVITY_ITEMS_PER_PAGE && (
              <Pagination
                currentPage={currentPage}
                totalItems={totalActivityItems}
                itemsPerPage={ACTIVITY_ITEMS_PER_PAGE}
                onPageChange={(page) => {
                  const cached = pageCacheRef.current.get(page);
                  if (cached) {
                    setEntries(cached.entries);
                    setTotalActivityItems(cached.totalItems);
                    setError(null);
                  }
                  setCurrentPage(page);
                }}
              />
            )}
          </div>
        </section>
      )}
      </div>
    </div>
  );
}

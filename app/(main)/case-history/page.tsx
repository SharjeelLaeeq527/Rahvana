"use client";

// Activity history (audit log) for the shared case — view-only. Shows who did
// what, when: document uploads/deletes, form saves/completions, step
// completions/reopens, and role assignments. Both spouses can read it. Each
// entry shows the actor's role SNAPSHOT at the time (petitioner/beneficiary/
// owner). Spec: docs/partner-collaboration-spec.md §13b.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/spinner";

interface ActivityEntry {
  id: string;
  action: string;
  actorRole: "petitioner" | "beneficiary" | "owner" | null;
  targetLabel: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  actorUserId: string | null;
  actorEmail: string | null;
  isYou: boolean;
}

// action -> { verb, emoji } for the feed line.
const ACTION_META: Record<string, { verb: string; emoji: string }> = {
  "document.upload": { verb: "uploaded", emoji: "📎" },
  "document.delete": { verb: "deleted", emoji: "🗑️" },
  "form.save": { verb: "updated", emoji: "✏️" },
  "form.complete": { verb: "completed", emoji: "✅" },
  "step.complete": { verb: "completed step", emoji: "✔️" },
  "step.reopen": { verb: "reopened step", emoji: "↩️" },
  "role.assign": { verb: "set roles", emoji: "👥" },
};

type RoleFilter = "all" | "petitioner" | "beneficiary";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (Number.isNaN(diff)) return "";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function fullTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

function roleBadge(role: ActivityEntry["actorRole"]) {
  if (role === "petitioner")
    return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Petitioner</span>;
  if (role === "beneficiary")
    return <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">Beneficiary</span>;
  if (role === "owner")
    return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Owner</span>;
  return null;
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
  const [filter, setFilter] = useState<RoleFilter>("all");

  // Resolve the user's case the same way /settings does (own journey, else the
  // shared case they were invited to).
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

  const load = useCallback(async () => {
    if (!journeyId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/case/activity?journeyId=${journeyId}`);
      const json = await res.json();
      if (res.ok) {
        setEntries(json.data?.activity ?? []);
        setError(null);
      } else {
        setError(json?.error?.message || "Could not load activity history.");
      }
    } catch {
      setError("Could not load activity history.");
    } finally {
      setLoading(false);
    }
  }, [journeyId]);

  useEffect(() => {
    if (resolved) load();
  }, [resolved, load]);

  const filtered = entries.filter((e) => filter === "all" || e.actorRole === filter);

  const FilterTab = ({ value, label }: { value: RoleFilter; label: string }) => (
    <button
      onClick={() => setFilter(value)}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        filter === value
          ? "bg-[#0d7377] text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.push("/settings")}
          className="mb-3 text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back to settings
        </button>
        <h1 className="text-2xl font-semibold text-slate-900">Activity history</h1>
        <p className="mt-1 text-sm text-slate-500">
          A record of who did what on this shared case — view-only.
        </p>
      </div>

      {(authLoading || (loading && !error)) && (
        <div className="flex justify-center py-16">
          <Loader />
        </div>
      )}

      {!authLoading && !loading && error && (
        <div className="rounded-xl border border-slate-200 p-5 text-sm text-red-600">{error}</div>
      )}

      {!authLoading && !loading && !error && !journeyId && (
        <div className="rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          You don&apos;t have a case yet. Start your journey to begin tracking activity.
        </div>
      )}

      {!authLoading && !loading && !error && journeyId && (
        <>
          <div className="mb-5 flex flex-wrap gap-2">
            <FilterTab value="all" label="All" />
            <FilterTab value="petitioner" label="Petitioner" />
            <FilterTab value="beneficiary" label="Beneficiary" />
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
              {entries.length === 0
                ? "No activity yet. Actions like uploads, form edits and completed steps will show up here."
                : "No activity for this filter."}
            </div>
          ) : (
            <ol className="space-y-2">
              {filtered.map((e) => {
                const meta = ACTION_META[e.action] || { verb: e.action, emoji: "•" };
                const who = e.isYou ? "You" : e.actorEmail || "A case member";
                return (
                  <li
                    key={e.id}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <span className="mt-0.5 text-lg leading-none">{meta.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className="font-medium text-slate-800">{who}</span>
                        {roleBadge(e.actorRole)}
                        <span className="text-slate-500">{meta.verb}</span>
                        {e.targetLabel && (
                          <span className="font-medium text-slate-700">{e.targetLabel}</span>
                        )}
                      </div>
                      <span
                        className="mt-0.5 block text-xs text-slate-400"
                        title={fullTime(e.createdAt)}
                      >
                        {timeAgo(e.createdAt)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}
    </div>
  );
}

"use client";

// Live, case-wide progress shared between both spouses. Shows the overall
// journey progress plus every tool and autofiller form (I-130, I-130A, DS-260,
// I-864, ...) for the SHARED case. Because forms/tools are now keyed by the
// journey, both partners see the same numbers — and a Supabase Realtime
// subscription refetches the moment the other person saves, so it updates live.
// A slow poll is kept as a fallback in case the realtime publication is off.

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ToolProgress {
  toolKey: string;
  label: string;
  stepKey: string | null;
  completionPercentage: number;
  isCompleted: boolean;
  lastSavedAt: string | null;
}

interface FormProgress {
  formCode: string;
  label: string;
  completed: boolean;
  currentStep: number;
  lastSavedAt: string | null;
  lastEditedByYou: boolean;
}

interface ProgressData {
  journey: {
    completionPercentage: number;
    completedSteps: number;
    totalSteps: number;
    status: string | null;
  };
  tools: ToolProgress[];
  forms: FormProgress[];
  members: { userId: string; membershipRole: string; caseRole: string | null; isYou: boolean }[];
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (Number.isNaN(diff)) return "";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function Bar({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div className="h-2 w-full rounded-full bg-slate-200">
      <div
        className="h-2 rounded-full bg-gradient-to-r from-[#0d7377] to-[#32e0c4] transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export default function CaseProgressPanel({ journeyId }: { journeyId: string }) {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  // Debounce bursts of realtime events into a single refetch.
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/case/progress?journeyId=${journeyId}`);
      const json = await res.json();
      if (res.ok) {
        setData(json.data);
        setError(null);
      } else {
        setError(json?.error?.message || "Could not load case progress.");
      }
    } catch {
      setError("Could not load case progress.");
    } finally {
      setLoading(false);
    }
  }, [journeyId]);

  useEffect(() => {
    load();
  }, [load]);

  // Slow poll as a safety net (realtime is the primary path below).
  useEffect(() => {
    const id = setInterval(load, 25000);
    return () => clearInterval(id);
  }, [load]);

  // Realtime: refetch whenever the shared case's progress tables change.
  useEffect(() => {
    if (!journeyId) return;
    const supabase = createClient();

    const scheduleRefetch = () => {
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      refetchTimer.current = setTimeout(load, 600);
    };

    const channel = supabase
      .channel(`case-progress:${journeyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tool_sessions", filter: `journey_id=eq.${journeyId}` },
        scheduleRefetch
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "visa_forms_draft", filter: `journey_id=eq.${journeyId}` },
        scheduleRefetch
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "journeys", filter: `id=eq.${journeyId}` },
        scheduleRefetch
      )
      .subscribe((status: string) => setLive(status === "SUBSCRIBED"));

    return () => {
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      supabase.removeChannel(channel);
    };
  }, [journeyId, load]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 p-5 text-sm text-slate-500">
        Loading shared progress…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-slate-200 p-5 text-sm text-red-600">{error}</div>
    );
  }

  if (!data) return null;

  const bothPresent = data.members.length === 2;

  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#0d7377]">Shared progress</h3>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <span
            className={`h-2 w-2 rounded-full ${live ? "bg-emerald-500" : "bg-slate-300"}`}
            title={live ? "Live — updates as your spouse works" : "Reconnecting…"}
          />
          {live ? "Live" : "Syncing"}
        </span>
      </div>

      {!bothPresent && (
        <p className="mb-4 text-xs text-slate-500">
          Invite your spouse to see both of you working on this case together.
        </p>
      )}

      {/* Overall journey progress */}
      <div className="mb-5 rounded-lg bg-slate-50 px-4 py-3">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Overall journey</span>
          <span className="text-slate-500">
            {data.journey.completedSteps}/{data.journey.totalSteps} steps ·{" "}
            {Math.round(data.journey.completionPercentage)}%
          </span>
        </div>
        <Bar pct={data.journey.completionPercentage} />
      </div>

      {/* Autofiller forms */}
      <div className="mb-5">
        <p className="mb-2 text-sm font-medium text-slate-700">Forms</p>
        {data.forms.length === 0 ? (
          <p className="text-xs text-slate-400">No forms started yet.</p>
        ) : (
          <ul className="space-y-2">
            {data.forms.map((f) => (
              <li
                key={f.formCode}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="text-slate-700">{f.label}</span>
                <span className="flex items-center gap-2 text-xs">
                  {f.completed ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700">
                      Completed
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
                      In progress · step {f.currentStep}
                    </span>
                  )}
                  {f.lastSavedAt && (
                    <span className="text-slate-400">
                      {f.lastEditedByYou ? "you · " : "spouse · "}
                      {timeAgo(f.lastSavedAt)}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tools */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Tools</p>
        {data.tools.length === 0 ? (
          <p className="text-xs text-slate-400">No tools started yet.</p>
        ) : (
          <ul className="space-y-3">
            {data.tools.map((t) => (
              <li key={`${t.toolKey}:${t.stepKey ?? ""}`} className="rounded-lg bg-slate-50 px-3 py-2.5">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-slate-700">{t.label}</span>
                  <span className="text-xs text-slate-500">
                    {t.isCompleted ? "Completed" : `${Math.round(t.completionPercentage)}%`}
                    {t.lastSavedAt && <span className="text-slate-400"> · {timeAgo(t.lastSavedAt)}</span>}
                  </span>
                </div>
                <Bar pct={t.isCompleted ? 100 : t.completionPercentage} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

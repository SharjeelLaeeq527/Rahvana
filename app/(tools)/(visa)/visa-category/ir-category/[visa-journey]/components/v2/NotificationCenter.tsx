"use client";

import React, { useState, useEffect, useCallback } from "react";
import { E, msg } from '@/lib/errors';
import {
  Bell,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
  Calendar,
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types (matching journey_reminders table shape)
// ─────────────────────────────────────────────────────────────
interface JourneyReminder {
  id: string;
  journey_id: string;
  reminder_type: string;
  priority: "critical" | "high" | "normal" | "low";
  title: string;
  body: string;
  step_key?: string | null;
  action_url?: string | null;
  action_label?: string | null;
  is_dismissed: boolean;
  snoozed_until?: string | null;
  created_at: string;
}

interface NotificationCenterProps {
  userId?: string;
  journeyId?: string;          // real Supabase journey UUID
  trackingStatus?: Record<string, any>;
  onClose?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Priority colours
// ─────────────────────────────────────────────────────────────
const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high:     "bg-orange-400",
  normal:   "bg-primary",
  low:      "bg-slate-300",
};

// ─────────────────────────────────────────────────────────────
// Icon per reminder type
// ─────────────────────────────────────────────────────────────
function ReminderIcon({ type, priority }: { type: string; priority: string }) {
  const cls = priority === "critical" ? "text-red-500"
            : priority === "high"     ? "text-orange-400"
            : "text-primary";

  if (type === "ceac_status_update")      return <Bell       className={cls} size={16} />;
  if (type === "appointment_approaching") return <Calendar   className={cls} size={16} />;
  if (type === "missing_document")        return <AlertTriangle className={cls} size={16} />;
  if (type === "receipt_not_captured")    return <Info       className={cls} size={16} />;
  if (type === "nvc_fee_not_confirmed")   return <Clock      className={cls} size={16} />;
  return <Bell className={cls} size={16} />;
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
export default function NotificationCenter({
  journeyId,
  onClose,
}: NotificationCenterProps) {
  const [reminders, setReminders]   = useState<JourneyReminder[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [readIds, setReadIds]       = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("rahvana_notif_read");
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch { return new Set<string>(); }
  });

  const [resolvedJourneyId, setResolvedJourneyId] = useState<string | null>(journeyId === "ir-1" ? null : (journeyId || null));

  // ── Fetch from real API ──────────────────────────────────
  const fetchReminders = useCallback(async () => {
    let activeJourneyId = journeyId && journeyId !== "ir-1" ? journeyId : null;

    if (!activeJourneyId) {
      try {
        const listRes = await fetch("/api/journeys");
        if (listRes.ok) {
          const listData = await listRes.json();
          if (listData.success && listData.data && listData.data.length > 0) {
            const active = listData.data.find((j: any) => j.journey.status === "in_progress") || listData.data[0];
            activeJourneyId = active.journey.id;
            setResolvedJourneyId(activeJourneyId);
          }
        }
      } catch (err) {
        console.error("Failed to fetch active journey", err);
      }
    } else {
      setResolvedJourneyId(activeJourneyId);
    }

    if (!activeJourneyId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/journeys/${activeJourneyId}/reminders`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setReminders(data.reminders ?? []);
    } catch (err) {
      console.error('Error loading reminders:', err);
      setError(msg(E.JOURNEY_NOTIFICATIONS_FAILED));
    } finally {
      setLoading(false);
    }
  }, [journeyId]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  useEffect(() => {
    const handleRefresh = () => {
      console.log("[NotificationCenter] Refreshing reminders due to data change...");
      fetchReminders();
    };

    window.addEventListener("refresh-reminders", handleRefresh);
    return () => window.removeEventListener("refresh-reminders", handleRefresh);
  }, [fetchReminders]);

  // ── Dismiss ──────────────────────────────────────────────
  const dismiss = async (reminderId: string) => {
    if (!resolvedJourneyId) return;
    setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    await fetch(`/api/v1/journeys/${resolvedJourneyId}/reminders/${reminderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dismiss" }),
    }).catch(() => {});
  };


  const markOneRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set([...prev, id]);
      try { localStorage.setItem("rahvana_notif_read", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const unread = reminders.filter((r) => !readIds.has(r.id));

  // ── No real journey ID yet ───────────────────────────────
  const noRealId = !resolvedJourneyId;

  return (
    <div className="flex flex-col h-full bg-white border-l border-[#d0e4f7] shadow-2xl w-[360px] animate-in slide-in-from-right duration-300">

      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-[#d0e4f7]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell size={16} className="text-primary" />
          </div>
          <h2 className="text-[15px] font-black text-[#0c1b33]">Notifications</h2>
        </div>
        <div className="flex items-center gap-2">
          {unread.length > 0 && (
            <span className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full">
              {unread.length}
            </span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#6b8097] hover:bg-[#f4f7fb] transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">

        {/* Journey not synced to DB yet */}
        {noRealId && (
          <div className="flex flex-col items-center justify-center h-full p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <Bell size={24} className="text-slate-200" />
            </div>
            <h3 className="text-[14px] font-bold text-[#0c1b33] mb-1">Notifications activate after sync</h3>
            <p className="text-[12px] text-[#6b8097] leading-relaxed">
              Complete a step to sync your journey to the server, then notifications will appear here.
            </p>
          </div>
        )}

        {/* Loading */}
        {!noRealId && loading && (
          <div className="flex items-center justify-center h-32">
            <RefreshCw size={20} className="text-primary animate-spin" />
          </div>
        )}

        {/* Error */}
        {!noRealId && !loading && error && (
          <div className="p-5 text-center">
            <p className="text-[12px] text-red-400">{error}</p>
            <button onClick={fetchReminders} className="mt-2 text-[11px] text-primary font-bold hover:underline">
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!noRealId && !loading && !error && reminders.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <CheckCircle2 size={24} className="text-green-300" />
            </div>
            <h3 className="text-[14px] font-bold text-[#0c1b33] mb-1">All caught up!</h3>
            <p className="text-[12px] text-[#6b8097] leading-relaxed">
              No pending notifications. When reminders are due, they'll appear here.
            </p>
          </div>
        )}

        {/* Notification list */}
        {!noRealId && !loading && reminders.length > 0 && (
          <div className="divide-y divide-[#d0e4f7]/50">
            {reminders.map((r) => {
              const isRead = readIds.has(r.id);
              return (
              <div
                key={r.id}
                className={`p-5 transition-colors relative group ${
                  !isRead
                    ? r.priority === "critical" || r.priority === "high"
                      ? "bg-orange-50"
                      : "bg-[#f0f7ff]"
                    : "bg-white hover:bg-slate-50"
                }`}
              >
                {/* Left border — only when unread */}
                {!isRead && (
                  <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${PRIORITY_DOT[r.priority] ?? "bg-primary"}`} />
                )}

                <div className="flex gap-3">
                  <div className="mt-0.5 shrink-0">
                    {!isRead
                      ? <ReminderIcon type={r.reminder_type} priority={r.priority} />
                      : <div className="w-4 h-4" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[13px] line-clamp-1 ${isRead ? "font-medium text-[#6b8097]" : "font-bold text-[#0c1b33]"}`}>
                        {r.title}
                      </span>
                      <span className="text-[10px] text-[#6b8097] whitespace-nowrap ml-2">
                        {new Date(r.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric",
                        })}
                      </span>
                    </div>

                    <p className={`text-[12px] leading-relaxed mb-3 line-clamp-3 ${isRead ? "text-[#6b8097]" : "text-[#3a4f63]"}`}>
                      {r.body}
                    </p>

                    <div className="flex items-center gap-3">
                      {r.action_label && r.action_url && (
                        <a
                          href={r.action_url}
                          className="flex items-center gap-1 text-[11px] font-black text-primary hover:underline uppercase tracking-wider"
                        >
                          {r.action_label}
                          <ChevronRight size={12} strokeWidth={3} />
                        </a>
                      )}
                      {!isRead && (
                        <button
                          onClick={() => markOneRead(r.id)}
                          className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                          <span className="w-3 h-3 rounded-full border border-primary flex items-center justify-center text-[7px]">✓</span>
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => dismiss(r.id)}
                        className="text-[10px] text-[#6b8097] hover:text-red-400 font-medium ml-auto"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {!noRealId && reminders.length > 0 && (
        <div className="p-4 border-t border-[#d0e4f7] bg-slate-50">
          <button
            onClick={() => reminders.forEach((r) => dismiss(r.id))}
            className="w-full py-2.5 rounded-lg border border-[#d0e4f7] bg-white text-[12px] font-bold text-[#3a4f63] hover:bg-slate-50 transition-colors"
          >
            Delete all
          </button>
        </div>
      )}

    </div>
  );
}

"use client";

import React from "react";
import { Video, Calendar, CheckCircle2, Clock, XCircle } from "lucide-react";

/** Row shape returned by /api/user-dashboard/services-status → consultationBookings. */
export interface ConsultationRow {
  id: string;
  reference_id?: string;
  full_name: string;
  issue_category?: string;
  status: string;
  selected_slot: string | null; // ISO datetime
  alternate_slots?: string[];
  location?: string | null;
  created_at?: string;
}

interface Props {
  req: ConsultationRow;
}

export default function ConsultationRequestCard({ req }: Props) {
  const isUpcoming = req.selected_slot && new Date(req.selected_slot).getTime() >= Date.now();
  const isCanceled = req.status === "canceled" || req.status === "cancelled";

  const badge = isCanceled
    ? { icon: XCircle, label: "Canceled", cls: "bg-rose-50 text-rose-700 border-rose-200" }
    : req.status === "confirmed" && isUpcoming
      ? { icon: CheckCircle2, label: "Confirmed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" }
      : { icon: Clock, label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200" };

  const BadgeIcon = badge.icon;
  const slotDate = req.selected_slot ? new Date(req.selected_slot) : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-[#0d7377]">
            <Video size={16} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Expert Consultation</div>
            {req.issue_category && (
              <div className="text-xs text-slate-500">{req.issue_category}</div>
            )}
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}
        >
          <BadgeIcon size={12} />
          {badge.label}
        </span>
      </div>

      {slotDate && (
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Calendar size={12} />
          <span>
            {slotDate.toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        </div>
      )}

      {req.reference_id && (
        <div className="mt-1 font-mono text-[11px] text-slate-400">{req.reference_id}</div>
      )}
    </div>
  );
}

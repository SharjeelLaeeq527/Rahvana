"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * My-Resources-style request card for a PCC (Sindh) filing.
 * Extracted from app/(main)/services/page.tsx so the exact same card can be
 * shown in My Resources and inside journey-embedded service views.
 */

export interface PccRequestRow {
  id: string;
  request_id?: string;
  full_name?: string;
  status?: string;
  district?: string;
  purpose?: string;
  province?: string;
  admin_notes?: string;
  created_at?: string;
  received_at?: string;
  source?: string;
  journey_slug?: string;
}

/** Collapsible admin message block (same pattern as the services page). */
export function CollapsibleAdminNotes({ notes }: { notes: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-teal-100">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between bg-teal-50/70 px-3 py-2 text-xs font-bold text-teal-800 transition-colors hover:bg-teal-50 focus:outline-none"
      >
        <span>Admin Message</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="border-t border-teal-50 bg-white px-3 py-2.5 text-xs leading-relaxed text-slate-700">
          {notes}
        </div>
      )}
    </div>
  );
}

export function PccRequestCard({ req }: { req: PccRequestRow }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 transition hover:bg-gray-50">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <span className="rounded bg-teal-50 px-2 py-0.5 font-mono text-xs font-bold text-teal-700">
            {req.request_id}
          </span>
          <h4 className="mt-1 font-semibold text-gray-900">{req.full_name}</h4>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
            req.status === "completed"
              ? "bg-green-100 text-green-700"
              : req.status === "in_progress"
                ? "bg-blue-100 text-blue-700"
                : req.status === "action_required"
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
          }`}
        >
          {req.status?.replace("_", " ") || "Pending"}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 border-t pt-2 text-xs text-gray-500">
        <div>
          <span className="font-medium">District:</span> {req.district}
        </div>
        <div>
          <span className="font-medium">Purpose:</span> {req.purpose}
        </div>
        {req.created_at && (
          <div className="col-span-2 mt-1">
            <span className="font-medium">Filed On:</span>{" "}
            {new Date(req.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        )}
      </div>
      {req.admin_notes && <CollapsibleAdminNotes notes={req.admin_notes} />}
    </div>
  );
}

export default PccRequestCard;

"use client";

import React from "react";
import { CollapsibleAdminNotes } from "./PccRequestCard";

/**
 * My-Resources-style request card for a medical appointment booking.
 * Extracted from app/(main)/services/page.tsx so the exact same card can be
 * shown in My Resources and inside journey-embedded service views.
 */

export interface MedicalAppointmentRow {
  id: string;
  medical_website?: string;
  location?: string;
  status?: string;
  full_name?: string;
  passport_number?: string;
  preferred_date?: string;
  preferred_time?: string;
  notes?: string;
  admin_notes?: string;
  created_at?: string;
  source?: string;
  journey_slug?: string;
}

export function MedicalAppointmentCard({ appointment }: { appointment: MedicalAppointmentRow }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 transition hover:bg-gray-50">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <span className="font-semibold text-gray-900">
            {appointment.medical_website || "Medical Examination"}
          </span>
          <p className="mt-0.5 text-xs text-gray-500 capitalize">
            Location: {appointment.location}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
            appointment.status === "completed"
              ? "bg-green-100 text-green-700"
              : appointment.status === "in_progress"
                ? "bg-blue-100 text-blue-700"
                : appointment.status === "cancelled"
                  ? "bg-gray-100 text-gray-700"
                  : "bg-amber-100 text-amber-700"
          }`}
        >
          {appointment.status || "Pending"}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 border-t pt-2 text-xs text-gray-500">
        <div>
          <span className="font-medium">Applicant:</span> {appointment.full_name}
        </div>
        <div>
          <span className="font-medium">Passport:</span> {appointment.passport_number || "N/A"}
        </div>
        <div>
          {appointment.preferred_date ? (
            <>
              <span className="font-medium">Appointment Date:</span>{" "}
              {new Date(appointment.preferred_date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </>
          ) : (
            "N/A"
          )}
        </div>
        <div>
          {appointment.preferred_time ? (
            <>
              <span className="font-medium">Appointment Time:</span> {appointment.preferred_time}
            </>
          ) : (
            "N/A"
          )}
        </div>
      </div>
      {appointment.notes && (
        <div className="mt-2 rounded bg-gray-100/50 p-2 text-xs text-gray-600">
          <span className="font-semibold">Note:</span> {appointment.notes}
        </div>
      )}
      {appointment.admin_notes && <CollapsibleAdminNotes notes={appointment.admin_notes} />}
    </div>
  );
}

export default MedicalAppointmentCard;

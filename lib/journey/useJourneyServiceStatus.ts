"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JourneyServiceRecord } from "./toolModeGuards";
import type { PccRequestRow } from "@/components/services/PccRequestCard";
import type { MedicalAppointmentRow } from "@/components/services/MedicalAppointmentCard";
import type { ConsultationRow } from "@/components/services/ConsultationRequestCard";

/**
 * Server-synced journey service status for the Medical Booking / PCC Filing step cards.
 *
 * Fetches /api/user-dashboard/services-status?scope=journey (only rows tagged
 * source='journey' for this journey slug + candidate) and:
 *  • exposes the latest ACTIVE server row mapped to a JourneyServiceRecord (card truth source),
 *  • reconciles stale journey metadata — e.g. a request deleted in the backend directly
 *    clears state.metadata.medicalBooking / pccFiling instead of showing ghost info.
 */

interface UseJourneyServiceStatusParams {
  journeySlug: string;
  candidateId?: string | null;
  medicalMetadata?: JourneyServiceRecord | null;
  pccMetadata?: JourneyServiceRecord | null;
  consultationMetadata?: JourneyServiceRecord | null;
  updateMetadata?: (updates: Record<string, unknown>) => void;
  /** Skip fetching/reconciling (e.g. when the service tool isn't the active view). */
  enabled?: boolean;
}

const isFutureDate = (d?: string | null) => {
  if (!d) return false;
  const t = new Date(d);
  return !Number.isNaN(t.getTime()) && t.getTime() >= Date.now();
};

/** Latest not-yet-held appointment (cancelled rows ignored; past dates = completed). */
function pickActiveMedical(rows: MedicalAppointmentRow[]): MedicalAppointmentRow | null {
  const usable = rows.filter((r) => r.status !== "cancelled");
  if (usable.length === 0) return null;
  const upcoming = usable.filter((r) => isFutureDate(r.preferred_date));
  if (upcoming.length > 0) {
    return upcoming.sort(
      (a, b) => new Date(a.preferred_date!).getTime() - new Date(b.preferred_date!).getTime()
    )[0];
  }
  return usable[0] ?? null;
}

/** Latest active PCC request (rejected rows ignored). */
function pickActivePcc(rows: PccRequestRow[]): PccRequestRow | null {
  const usable = rows.filter((r) => r.status !== "rejected");
  if (usable.length === 0) return null;
  // A server-side "completed" certificate takes priority over still-pending ones.
  return usable.find((r) => r.status === "completed") ?? usable[0] ?? null;
}

function mapMedicalRow(row: MedicalAppointmentRow): JourneyServiceRecord {
  return {
    savedAt: row.created_at || new Date().toISOString(),
    referenceId: row.id,
    referenceDate: row.preferred_date ? row.preferred_date.slice(0, 10) : undefined,
    location: row.location || undefined,
    timeSlot: row.preferred_time || undefined,
    status: row.status || "pending",
  };
}

/** Upcoming (non-cancelled) consultation first; fall back to the most recent active row. */
function pickActiveConsultation(rows: ConsultationRow[]): ConsultationRow | null {
  const usable = rows.filter((r) => r.status !== "canceled" && r.status !== "cancelled");
  if (usable.length === 0) return null;
  const upcoming = usable.filter((r) => isFutureDate(r.selected_slot));
  if (upcoming.length > 0) {
    return upcoming.sort(
      (a, b) => new Date(a.selected_slot!).getTime() - new Date(b.selected_slot!).getTime()
    )[0];
  }
  return usable[0] ?? null;
}

function mapConsultationRow(row: ConsultationRow): JourneyServiceRecord {
  return {
    savedAt: row.created_at || new Date().toISOString(),
    referenceId: row.reference_id || row.id,
    referenceDate: row.selected_slot || undefined, // full ISO datetime — see 7.6
    location: row.location || "Remote (video call)",
    status: row.status || "pending_approval",
  };
}

function mapPccRow(
  row: PccRequestRow,
  metadata?: JourneyServiceRecord | null
): JourneyServiceRecord {
  const isReceived = row.status === "completed" || metadata?.status === "received";
  return {
    savedAt: row.created_at || new Date().toISOString(),
    referenceId: row.request_id || row.id,
    referenceDate: row.created_at ? row.created_at.slice(0, 10) : metadata?.referenceDate,
    location: row.district || metadata?.location || "Sindh",
    status: isReceived ? "received" : "requested",
    receivedAt: row.received_at || metadata?.receivedAt,
  };
}

export function useJourneyServiceStatus({
  journeySlug,
  candidateId,
  medicalMetadata,
  pccMetadata,
  consultationMetadata,
  updateMetadata,
  enabled = true,
}: UseJourneyServiceStatusParams) {
  const [pccRows, setPccRows] = useState<PccRequestRow[]>([]);
  const [medicalRows, setMedicalRows] = useState<MedicalAppointmentRow[]>([]);
  const [consultationRows, setConsultationRows] = useState<ConsultationRow[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [refreshKey, setRefreshKey] = useState(0);
  const lastFetchKey = useRef<string>("");

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const cid = candidateId || "candidate-1";

    (async () => {
      try {
        setLoading(true);
        const url = `/api/user-dashboard/services-status?scope=journey&journeySlug=${encodeURIComponent(
          journeySlug
        )}&candidateId=${encodeURIComponent(cid)}`;
        const res = await fetch(url);
        if (!res.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setPccRows(data.pccRequests || []);
        setMedicalRows(data.medicalAppointments || []);
        setConsultationRows(data.consultationBookings || []);
      } catch (err) {
        console.error("[journey-service-status] fetch failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [journeySlug, candidateId, refreshKey, enabled]);

  const activeMedicalRow = useMemo(() => pickActiveMedical(medicalRows), [medicalRows]);
  const activePccRow = useMemo(() => pickActivePcc(pccRows), [pccRows]);
  const activeConsultationRow = useMemo(() => pickActiveConsultation(consultationRows), [consultationRows]);
  // Server row wins over local metadata (which may reference a deleted request).
  const medicalRecord: JourneyServiceRecord | null = activeMedicalRow
    ? mapMedicalRow(activeMedicalRow)
    : null;
  const pccRecord: JourneyServiceRecord | null = activePccRow
    ? mapPccRow(activePccRow, pccMetadata)
    : null;
  const consultationRecord: JourneyServiceRecord | null = activeConsultationRow
    ? mapConsultationRow(activeConsultationRow)
    : null;

  // ── Metadata reconciliation ──────────────────────────────────────────────
  // 1) Stored reference no longer exists server-side (deleted in the backend) → clear it.
  // 2) Server identity/status drifted from metadata → re-sync metadata.
  useEffect(() => {
    if (loading || !updateMetadata || !enabled) return;

    if (medicalMetadata) {
      if (!activeMedicalRow) {
        updateMetadata({ medicalBooking: null });
      } else if (medicalMetadata.referenceId !== activeMedicalRow.id && activeMedicalRow.id) {
        updateMetadata({ medicalBooking: mapMedicalRow(activeMedicalRow) });
      }
    }

    if (pccMetadata) {
      if (!activePccRow) {
        updateMetadata({ pccFiling: null });
      } else {
        const refId = activePccRow.request_id || activePccRow.id;
        const serverStatus = activePccRow.status === "completed" ? "received" : pccMetadata.status;
        if (pccMetadata.referenceId !== refId || serverStatus !== pccMetadata.status) {
          updateMetadata({
            pccFiling: {
              ...pccMetadata,
              ...(refId ? { referenceId: refId } : {}),
              ...(serverStatus ? { status: serverStatus } : {}),
              ...(activePccRow.received_at ? { receivedAt: activePccRow.received_at } : {}),
            },
          });
        }
      }
    }

    if (consultationMetadata) {
      if (!activeConsultationRow) {
        updateMetadata({ consultation: null });
      } else if (consultationMetadata.referenceId !== activeConsultationRow.id && activeConsultationRow.id) {
        updateMetadata({ consultation: mapConsultationRow(activeConsultationRow) });
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, enabled, activeMedicalRow?.id, activePccRow?.id, activePccRow?.status]);

  // Keep displayed records fresh right after a new submission too.
  const refetch = refresh;

  return {
    loading,
    medicalRecord,
    pccRecord,
    consultationRecord,
    activeMedicalRow,
    activePccRow,
    activeConsultationRow,
    medicalRows: medicalRows as MedicalAppointmentRow[],
    pccRows: pccRows as PccRequestRow[],
    consultationRows: consultationRows as ConsultationRow[],
    refetch,
  };
}

/**
 * Persist "mark as received" server-side (PATCH own row) so the lifecycle
 * survives reloads and the admin view stays in sync. Best-effort: the journey
 * metadata update is the primary store and runs regardless of this result.
 */
export async function patchPccReceived(id: string, receivedAt: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/police-verification/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed", received_at: receivedAt }),
    });
    return res.ok;
  } catch (err) {
    console.error("[pcc] failed to patch received status:", err);
    return false;
  }
}

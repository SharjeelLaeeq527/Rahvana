"use client";

import { useCallback, useEffect, useState } from "react";
import type { PccRequestRow } from "@/components/services/PccRequestCard";
import type { MedicalAppointmentRow } from "@/components/services/MedicalAppointmentCard";

export interface ServiceRequestsResult {
  pccRequests: PccRequestRow[];
  medicalAppointments: MedicalAppointmentRow[];
  loading: boolean;
  refresh: () => void;
}

/**
 * Fetches the user's service requests from /api/user-dashboard/services-status.
 *  • scope="standalone" (default) → exactly the rows shown in My Resources.
 *  • scope="journey" + journeySlug → rows created from inside that journey.
 * Used by journey-embedded service views to surface My-Resources-style request cards.
 */
export function useServiceRequests(opts: {
  scope?: "standalone" | "journey";
  journeySlug?: string;
  candidateId?: string;
  /** Skip fetching entirely (e.g. tool overlay closed). */
  enabled?: boolean;
}): ServiceRequestsResult {
  const { scope = "standalone", journeySlug, candidateId, enabled = true } = opts;
  const [pccRequests, setPccRequests] = useState<PccRequestRow[]>([]);
  const [medicalAppointments, setMedicalAppointments] = useState<MedicalAppointmentRow[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ scope });
        if (journeySlug) params.set("journeySlug", journeySlug);
        if (candidateId) params.set("candidateId", candidateId);
        const res = await fetch(`/api/user-dashboard/services-status?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setPccRequests(data.pccRequests || []);
        setMedicalAppointments(data.medicalAppointments || []);
      } catch (err) {
        console.error("[useServiceRequests] fetch failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, scope, journeySlug, candidateId, refreshKey]);

  return { pccRequests, medicalAppointments, loading, refresh };
}

export default useServiceRequests;

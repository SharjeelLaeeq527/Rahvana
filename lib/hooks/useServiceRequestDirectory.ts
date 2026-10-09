"use client";

import { useEffect, useMemo, useState } from "react";
import { useCandidate } from "@/app/context/CandidateContext";
import {
  buildServiceRequestDirectory,
  type ServiceRequestItem,
  type ServicesStatusPayload,
} from "@/lib/services/serviceRequestDirectory";

/**
 * Every service request on the account across all journeys/candidates
 * (services-status?scope=all), normalized + labeled with where it lives.
 * Fetches only while `enabled` (the directory modal is open).
 */
export function useServiceRequestDirectory(enabled: boolean): {
  items: ServiceRequestItem[];
  loading: boolean;
  error: boolean;
} {
  const { candidates } = useCandidate();
  const [payload, setPayload] = useState<ServicesStatusPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch("/api/user-dashboard/services-status?scope=all");
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as ServicesStatusPayload;
        if (!cancelled) setPayload(data);
      } catch (err) {
        console.error("[service-request-directory] fetch failed:", err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const items = useMemo(
    () => (payload ? buildServiceRequestDirectory(payload, candidates) : []),
    [payload, candidates]
  );

  return { items, loading, error };
}

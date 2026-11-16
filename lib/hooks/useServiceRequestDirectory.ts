"use client";

import { useEffect, useMemo, useState } from "react";
import { useCandidate } from "@/app/context/CandidateContext";
import {
  buildServiceRequestDirectory,
  type ServiceRequestItem,
  type ServicesStatusPayload,
} from "@/lib/services/serviceRequestDirectory";

export interface UseServiceRequestDirectoryOptions {
  /** When true (default), account-wide requests are omitted when accessed for the journey. */
  excludeAccountWide?: boolean;
}

/**
 * Service requests across journeys/candidates (services-status?scope=all),
 * normalized + labeled with where it lives. Account-wide requests are excluded
 * by default when accessed for the journey.
 * Fetches only while `enabled` (the directory modal is open).
 */
export function useServiceRequestDirectory(
  enabled: boolean,
  options?: UseServiceRequestDirectoryOptions
): {
  items: ServiceRequestItem[];
  loading: boolean;
  error: boolean;
} {
  const { candidates } = useCandidate();
  const [payload, setPayload] = useState<ServicesStatusPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const excludeAccountWide = options?.excludeAccountWide ?? true;

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
    () =>
      payload
        ? buildServiceRequestDirectory(payload, candidates, { excludeAccountWide })
        : [],
    [payload, candidates, excludeAccountWide]
  );

  return { items, loading, error };
}

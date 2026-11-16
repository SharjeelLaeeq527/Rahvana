"use client";

import { useCallback, useMemo, useState } from "react";
import { USCIS_LIVE_STATUS_KEY, liveStatusFromUscisResponse } from "@/lib/journey/dashboard/caseFacts";

export interface UscisLiveCheck {
  checking: boolean;
  error: string | null;
  /** Ask USCIS (Torch API) for the current status and save it on this journey. */
  check: () => void;
  /** The journey's plan does not include status tracking: check opens the upgrade prompt. */
  locked?: boolean;
}

/**
 * Live USCIS status for the tracking ticket. Calls the same
 * `/api/uscis-case-status` route as the standalone Case Status tool (which
 * also records the lookup in `uscis_case_history`) and saves the result to
 * this journey's case data, so the ticket shows it on every device.
 */
export function useUscisLiveCheck(
  receiptNumber: string | undefined,
  journeyId: string | undefined,
  updateMetadata: (patch: Record<string, unknown>) => unknown
): UscisLiveCheck {
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(() => {
    if (!receiptNumber || checking) return;
    setChecking(true);
    setError(null);
    void (async () => {
      try {
        const res = await fetch("/api/uscis-case-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // The journey id makes the server check this journey's plan.
          body: JSON.stringify({ receiptNumber, journeyId }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          const m = json?.error?.message || json?.error;
          setError(typeof m === "string" && m ? m : "USCIS could not be reached. Try again later.");
          return;
        }
        const live = liveStatusFromUscisResponse(receiptNumber, json);
        if (!live) {
          setError("USCIS returned no status for this receipt number.");
          return;
        }
        await updateMetadata({ [USCIS_LIVE_STATUS_KEY]: live });
      } catch {
        setError("USCIS could not be reached. Try again later.");
      } finally {
        setChecking(false);
      }
    })();
  }, [receiptNumber, journeyId, checking, updateMetadata]);

  return useMemo(() => ({ checking, error, check }), [checking, error, check]);
}

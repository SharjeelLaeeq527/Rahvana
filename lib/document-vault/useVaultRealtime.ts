"use client";

// Live updates for the SHARED Document Vault. When one spouse uploads/deletes a
// document or changes the checklist config, the other's vault refreshes without a
// page reload. Mirrors the realtime pattern used by CaseProgressPanel: subscribe
// to postgres_changes on the case's rows, debounce, and refetch from the store.
//
// Mount once wherever the vault is shown (standalone page + journey step). The
// store is a singleton, so multiple mounts share state; each sets up its own
// channel keyed by journeyId, which is harmless.

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDocumentVaultStore } from "./store";

export function useVaultRealtime() {
  const journeyId = useDocumentVaultStore((s) => s.journeyId);
  const reloadDocuments = useDocumentVaultStore((s) => s.reloadDocuments);
  const reloadConfig = useDocumentVaultStore((s) => s.reloadConfig);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!journeyId) return;
    const supabase = createClient();

    // Coalesce bursts (e.g. multi-file upload) into a single refetch.
    const debounce = (fn: () => void) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(fn, 500);
    };

    const channel = supabase
      .channel(`vault:${journeyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents", filter: `journey_id=eq.${journeyId}` },
        () => debounce(reloadDocuments)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "document_vault_config",
          filter: `journey_id=eq.${journeyId}`,
        },
        () => debounce(reloadConfig)
      )
      .subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [journeyId, reloadDocuments, reloadConfig]);
}

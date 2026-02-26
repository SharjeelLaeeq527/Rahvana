"use client";

import { useState } from "react";

interface UseHideIntroModalReturn {
  hideIntroModal: (slug: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export const useHideIntroModal = (): UseHideIntroModalReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hideIntroModal = async (slug: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/guides/hide-intro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to hide intro modal");
        return false;
      }

      return true;
    } catch (err) {
      console.error("Hide intro modal error:", err);
      setError("Unexpected error occurred");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { hideIntroModal, loading, error };
};
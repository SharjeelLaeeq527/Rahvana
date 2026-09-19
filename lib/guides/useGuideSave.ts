import { useState } from "react";
import { useToast } from "@/app/components/shared/ToastProvider";
import { useCandidate } from "@/app/context/CandidateContext";

export function useGuideSave() {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { showToast } = useToast();
  const { activeCandidateId } = useCandidate();

  const saveGuide = async (slug: string, explicitCandidateId?: string) => {
    setSaving(true);
    setSaveError(null);

    const candidateId = explicitCandidateId || activeCandidateId || "candidate-1";

    try {
      const response = await fetch("/api/guides/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug, candidateId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Save failed: ${response.statusText}`);
      }

      const result = await response.json();
      showToast("Guide saved to My Guides successfully!", "success");

      // Update local storage cache to mark saved
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(`rahvana_guide_${slug}_${candidateId}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            parsed.saved = true;
            localStorage.setItem(`rahvana_guide_${slug}_${candidateId}`, JSON.stringify(parsed));

            const listRaw = localStorage.getItem(`rahvana_guide_sessions_${candidateId}`);
            const list = listRaw ? JSON.parse(listRaw) : [];
            const filtered = list.filter(
              (s: any) => (s.guides?.slug && s.guides.slug !== slug) && s.id !== parsed.id
            );
            localStorage.setItem(
              `rahvana_guide_sessions_${candidateId}`,
              JSON.stringify([parsed, ...filtered])
            );
          }
        } catch {
          // Ignore
        }
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save guide";
      setSaveError(errorMessage);
      console.error("Save error:", error);
      showToast("Failed to save guide. Please try again.", "error");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    saveGuide,
    saving,
    saveError,
    clearError: () => setSaveError(null),
  };
}

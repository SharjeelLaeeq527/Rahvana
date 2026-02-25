import { useState } from "react";
import { useToast } from "@/app/components/shared/ToastProvider";

export function useGuideSave() {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { showToast } = useToast();

  const saveGuide = async (slug: string) => {
    setSaving(true);
    setSaveError(null);

    try {
      const response = await fetch('/api/guides/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Save failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Guide saved successfully:', result);
      showToast("Guide saved to My Guides successfully!", "success");
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save guide';
      setSaveError(errorMessage);
      console.error('Save error:', error);
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
    clearError: () => setSaveError(null)
  };
}
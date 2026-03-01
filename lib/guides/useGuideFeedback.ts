import { useState } from "react";

export function useGuideFeedback() {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submitFeedback = async (
    slug: string,
    stepKey: string,
    feedbackType: string,
    description: string,
    attachment?: File,
  ) => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append("slug", slug);
      formData.append("stepKey", stepKey);
      formData.append("feedbackType", feedbackType);
      formData.append("description", description);

      if (attachment) {
        formData.append("attachment", attachment);
      }

      const response = await fetch("/api/guides/submit-feedback", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Feedback submission failed: ${response.statusText}`,
        );
      }

      const result = await response.json();
      console.log("Feedback submitted successfully:", result);

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Feedback submission failed";
      setSubmitError(errorMessage);
      console.error("Feedback submission error:", error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitFeedback,
    submitting,
    submitError,
    clearError: () => setSubmitError(null),
  };
}

"use client";

import React, { useState } from "react";
import { MessageCircle, X, Upload } from "lucide-react";
import { useToast } from "./shared/ToastProvider";
import { usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

interface FeedbackButtonProps {
  steps?: string[];
  currentStepName?: string;
  onSubmit?: (
    feedbackType: string,
    description: string,
    attachment?: File,
  ) => Promise<any>;
}

export default function FeedbackButton({
  steps = [],
  currentStepName = "",
  onSubmit,
}: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [feedback, setFeedback] = useState({
    category: "",
    step: currentStepName || "",
    description: "",
    attachments: [] as File[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  // Prevent background scrolling when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup function to ensure scroll is restored when component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Update step if it changes externally while modal is open
  React.useEffect(() => {
    if (currentStepName && !feedback.step) {
      setFeedback((prev) => ({ ...prev, step: currentStepName }));
    }
  }, [currentStepName, feedback.step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!feedback.category) {
        showToast("Please select a feedback type.", "error");
        setIsSubmitting(false);
        return;
      }
      if (!feedback.description) {
        showToast("Please provide a description.", "error");
        setIsSubmitting(false);
        return;
      }

      // If onSubmit callback is provided, use it
      if (onSubmit) {
        await onSubmit(
          feedback.category,
          feedback.description,
          feedback.attachments[0],
        );
      } else {
        // Default global submission
        const formData = new FormData();
        const isGuide = pathname.includes("/guides/");
        const slug = isGuide ? pathname.split("/").pop() : "general";
        // Capture the full page URL so the sheet shows exactly where the user was
        const fullPageUrl =
          typeof window !== "undefined" ? window.location.href : pathname;

        formData.append("slug", slug || "general");
        formData.append("stepKey", feedback.step || pathname);
        formData.append("feedbackType", feedback.category);
        formData.append("description", feedback.description);
        formData.append("pageUrl", fullPageUrl);
        
        // Append all attachments
        feedback.attachments.forEach((file) => {
          formData.append("attachment", file);
        });

        const response = await fetch("/api/feedback", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to submit feedback");
        }
      }

      showToast(
        "Feedback submitted successfully! Thank you for helping us improve.",
        "success",
      );
      setIsOpen(false);
      setFeedback({
        category: "",
        step: currentStepName || "",
        description: "",
        attachments: [],
      });
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setIsSubmitting(false);
      const message =
        error instanceof Error ? error.message : "Failed to submit feedback.";
      showToast(message, "error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setFeedback((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...files],
      }));
    }
  };

  return (
    <>
      {/* Sticky Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 inline-flex items-center justify-center gap-2 bg-primary text-white p-3 sm:px-5 sm:py-3 rounded-full shadow-lg hover:bg-primary/80 transition-all duration-200 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2"
        aria-label="Provide feedback"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm font-semibold tracking-wide hidden sm:inline">
          Provide feedback
        </span>
      </button>

      {/* Feedback Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  Send Feedback
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Feedback Type */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback Type
                  </label>
                  <Select
                    value={feedback.category}
                    onValueChange={(val) =>
                      setFeedback((prev) => ({ ...prev, category: val }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incorrect_information">
                        Incorrect information
                      </SelectItem>
                      <SelectItem value="ui_ux_issue">UI/UX issue</SelectItem>
                      <SelectItem value="bug">
                        Bug / Something broken
                      </SelectItem>
                      <SelectItem value="suggestion">
                        Suggestion / Improvement
                      </SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Step */}
                {steps.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Where did this happen?
                    </label>
                    <Select
                      value={feedback.step}
                      onValueChange={(val) =>
                        setFeedback((prev) => ({ ...prev, step: val }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a step" />
                      </SelectTrigger>
                      <SelectContent>
                        {steps.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={feedback.description}
                    onChange={(e) =>
                      setFeedback((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary min-h-[120px] shadow-sm resize-y"
                    placeholder="Please describe your feedback in detail..."
                    required
                  />
                </div>

                {/* Attachments */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Attachments (optional)
                  </label>

                  <div className="flex items-center gap-3">
                    <input
                      id="feedback-files"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="feedback-files" className="cursor-pointer">
                      <span className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 shadow-sm">
                        <Upload className="w-4 h-4" />
                        Add files
                      </span>
                    </label>
                    <span className="text-xs text-slate-500">
                      Screenshots help a lot.
                    </span>
                  </div>

                  {feedback.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {feedback.attachments.map((file, idx) => (
                        <div
                          key={`${file.name}-${idx}`}
                          className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 truncate"
                        >
                          {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-lg hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Feedback"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

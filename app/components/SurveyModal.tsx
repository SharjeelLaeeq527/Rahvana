"use client";

import React, { useState } from "react";
import { X, MessageSquareHeart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/app/components/shared/ToastProvider";
import { CustomDropdown } from "./shared/CustomDropdown";

interface SurveyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: (data: {
    reason: string;
    followUpAnswers: Record<string, string>;
    additionalComments: string;
  }) => Promise<unknown>;
  onSkip: () => void;
}

const DELETION_REASONS = [
  {
    value: "journey_completed",
    label: "My immigration journey is complete",
  },
  {
    value: "couldnt_find_needed",
    label: "I couldn't find what I needed",
  },
  {
    value: "missing_features",
    label: "Rahvana is missing features I need",
  },
  {
    value: "technical_problem",
    label: "I experienced a technical problem",
  },
  {
    value: "privacy_security_concern",
    label: "I'm concerned about privacy or security",
  },
  {
    value: "found_alternative",
    label: "I'm using another way to manage my immigration process",
  },
  {
    value: "other",
    label: "Other",
  },
] as const;

const FOLLOW_UP_CONFIG = {
  journey_completed: {
    question: "What was the outcome of your immigration process?",
    options: [
      {
        value: "visa_approved",
        label: "My visa was approved",
      },
      {
        value: "visa_denied",
        label: "My visa was denied",
      },
      {
        value: "visa_refused",
        label: "My visa was refused",
      },
      {
        value: "other",
        label: "Other",
      },
    ],
  },

  couldnt_find_needed: {
    question: "What were you looking for?",
    options: [
      {
        value: "journey_guidance",
        label: "Step-by-step immigration journey guidance",
      },
      {
        value: "visa_information",
        label: "Information about my visa category",
      },
      {
        value: "document_checklists",
        label: "Document checklists and requirements",
      },
      {
        value: "forms_assistance",
        label: "Forms and form-filling assistance",
      },
      {
        value: "case_status_information",
        label: "Case or status information",
      },
      {
        value: "other",
        label: "Something else",
      },
    ],
  },

  missing_features: {
    textFollowUp: {
      label: "What would you like Rahvana to add or improve?",
      placeholder: "Tell us what you'd like Rahvana to help you with...",
    },
  },

  technical_problem: {
    question: "What kind of technical problem did you experience?",
    options: [
      {
        value: "something_didnt_work",
        label: "Something didn't work",
      },
      {
        value: "encountered_error",
        label: "I encountered an error",
      },
      {
        value: "page_too_slow",
        label: "The page was too slow",
      },
      {
        value: "couldnt_complete_action",
        label: "I couldn't complete an action",
      },
      {
        value: "information_not_displaying",
        label: "Information wasn't displaying correctly",
      },
      {
        value: "other",
        label: "Other",
      },
    ],
    textFollowUp: {
      label: "What were you trying to do when this happened?",
      placeholder:
        "For example, upload a document, check my case status, prepare for an interview...",
    },
  },

  privacy_security_concern: {
    question: "What was your main privacy or security concern?",
    options: [
      {
        value: "personal_information_storage",
        label: "How my personal information is stored",
      },
      {
        value: "document_handling",
        label: "How my documents are handled",
      },
      {
        value: "account_security",
        label: "Account security",
      },
      {
        value: "data_sharing",
        label: "Data sharing",
      },
      {
        value: "uncomfortable_providing_information",
        label: "I wasn't comfortable providing personal information",
      },
      {
        value: "other",
        label: "Other",
      },
    ],
  },

  found_alternative: {
    question: "What are you using instead of Rahvana?",
    options: [
      {
        value: "immigration_attorney",
        label: "An immigration attorney or law firm",
      },
      {
        value: "another_immigration_platform",
        label: "Another immigration platform or service",
      },
      {
        value: "family_friends_or_helper",
        label: "Family, friends, or someone helping me",
      },
      {
        value: "personal_research",
        label: "My own research",
      },
      {
        value: "other",
        label: "Other",
      },
    ],
    textFollowUp: {
      label: "What did the alternative provide that you needed?",
      placeholder: "Tell us what worked better for you...",
    },
  },
} as const;

type FollowUpReason = keyof typeof FOLLOW_UP_CONFIG;

export default function SurveyModal({ open, onOpenChange, onContinue, onSkip }: SurveyModalProps) {
  const [reason, setReason] = useState("");
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [followUpText, setFollowUpText] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();

  const resetForm = () => {
    setReason("");
    setFollowUpAnswer("");
    setFollowUpText("");
    setAdditionalComments("");
    setIsSubmitting(false);
  };

  const handleReasonChange = (value: string) => {
    setReason(value);

    // Clear answers belonging to the previous reason.
    setFollowUpAnswer("");
    setFollowUpText("");
  };

  const handleFollowUpChange = (value: string) => {
    setFollowUpAnswer(value);

    // If user changes the follow-up answer, keep contextual text
    // because it may still be relevant to the same reason.
  };

  const handleOpenChange = (value: boolean) => {
    if (!value && !isSubmitting) {
      resetForm();
    }

    onOpenChange(value);
  };

  const handleSkip = () => {
    if (isSubmitting) return;

    resetForm();
    onOpenChange(false);
    onSkip();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      showToast("Please select a reason for deleting your account.", "error");
      return;
    }

    // "Other" has no structured follow-up question,
    // so the main feedback field becomes required.
    if (reason === "other" && !additionalComments.trim()) {
      showToast("Please tell us a little more about why you're leaving.", "error");
      return;
    }

    /**
     * Missing features has a required TEXT-ONLY follow-up.
     */
    if (reason === "missing_features" && !followUpText.trim()) {
      showToast("Please tell us what feature or capability you were looking for.", "error");
      return;
    }

    // All configured reasons except missing_features
    // and other require a structured follow-up answer.
    if (reason !== "other" && reason !== "missing_features" && !followUpAnswer) {
      showToast("Please answer the follow-up question.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const followUpAnswers: Record<string, string> = {};

      if (reason !== "other") {
        /**
         * Structured dropdown answers.
         *
         * missing_features intentionally does NOT appear here
         * because it uses a text-only follow-up.
         */
        if (followUpAnswer) {
          const answerKeyMap: Record<string, string> = {
            journey_completed: "journey_stage",
            couldnt_find_needed: "information_needed",
            technical_problem: "problem_type",
            privacy_security_concern: "concern_type",
            found_alternative: "alternative_type",
          };

          const answerKey = answerKeyMap[reason];

          if (answerKey) {
            followUpAnswers[answerKey] = followUpAnswer;
          }
        }

        /**
         * Missing features text-only response.
         */
        if (reason === "missing_features" && followUpText.trim()) {
          followUpAnswers["feature_needed_details"] = followUpText.trim();
        }

        /**
         * Technical problem contextual response.
         */
        if (reason === "technical_problem" && followUpText.trim()) {
          followUpAnswers["what_were_you_trying_to_do"] = followUpText.trim();
        }

        /**
         * Found alternative contextual response.
         */
        if (reason === "found_alternative" && followUpText.trim()) {
          followUpAnswers["additional_context"] = followUpText.trim();
        }
      }

      await onContinue({
        reason,
        followUpAnswers,
        additionalComments: additionalComments.trim(),
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting account deletion survey:", error);

      const message = error instanceof Error ? error.message : "Failed to submit your feedback.";

      showToast(message, "error");
      setIsSubmitting(false);
    }
  };

  /**
   * Get the configuration for the selected reason.
   */
  const selectedReasonConfig =
    reason !== "other" ? FOLLOW_UP_CONFIG[reason as FollowUpReason] : null;

  /**
   * Only dropdown-based configurations have `options`.
   */
  const followUpOptions =
    selectedReasonConfig && "options" in selectedReasonConfig
      ? selectedReasonConfig.options.map((option) => ({
          value: option.value,
          label: option.label,
        }))
      : [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:w-full">
        <DialogDescription className="sr-only">
          Tell us why you are deleting your Rahvana account.
        </DialogDescription>

        {/* Header */}
        <DialogHeader className="from-primary/[0.06] relative shrink-0 border-b border-slate-100 bg-gradient-to-b to-white px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <MessageSquareHeart className="text-primary h-5 w-5" />
              </div>

              <div>
                <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900">
                  We&apos;re sorry to see you go.
                </DialogTitle>

                <p className="mt-1 max-w-[440px] text-sm leading-5 text-slate-500">
                  Your journey matters to us. A little feedback can help us make Rahvana better for
                  people navigating their immigration journey.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* Content */}
          <div className="scrollbar-premium min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {/* Main Reason */}
            <div>
              <div className="mb-3.5">
                <label
                  htmlFor="deletion-reason"
                  className="block text-sm font-semibold text-slate-800"
                >
                  What&apos;s the main reason you&apos;re leaving Rahvana?
                  <span className="ml-1 text-rose-500">*</span>
                </label>

                <p className="mt-1 text-xs text-slate-400">
                  Select the option that best describes your reason.
                </p>
              </div>

              <CustomDropdown
                value={reason}
                onChange={handleReasonChange}
                options={DELETION_REASONS.map((item) => ({
                  value: item.value,
                  label: item.label,
                }))}
                placeholder="Select your main reason"
                disabled={isSubmitting}
                className="w-full"
              />
            </div>

            {/* Conditional Follow-up */}
            {selectedReasonConfig && (
              <>
                <div className="my-6 h-px bg-slate-100" />

                {/* Dropdown Follow-up */}
                {"options" in selectedReasonConfig && (
                  <div>
                    <div className="mb-3.5">
                      <label className="block text-sm font-semibold text-slate-800">
                        {selectedReasonConfig.question}
                        <span className="ml-1 text-rose-500">*</span>
                      </label>
                    </div>

                    <CustomDropdown
                      value={followUpAnswer}
                      onChange={handleFollowUpChange}
                      options={followUpOptions}
                      placeholder="Select an option"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Missing features text-only follow-up */}
                {reason === "missing_features" && (
                  <div className="mt-5">
                    <label
                      htmlFor="missing-features-details"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      {FOLLOW_UP_CONFIG.missing_features.textFollowUp.label}
                      <span className="text-destructive ml-1">*</span>
                    </label>

                    <textarea
                      id="missing-features-details"
                      value={followUpText}
                      onChange={(e) => setFollowUpText(e.target.value)}
                      placeholder={FOLLOW_UP_CONFIG.missing_features.textFollowUp.placeholder}
                      maxLength={500}
                      disabled={isSubmitting}
                      className="focus:border-primary focus:ring-primary/10 min-h-[90px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-3 text-sm leading-6 text-slate-700 transition-all outline-none placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <div className="mt-1.5 text-right text-[10px] text-slate-400">
                      {followUpText.length}/500
                    </div>
                  </div>
                )}

                {/* Technical Problem Context */}
                {reason === "technical_problem" && (
                  <div className="mt-5">
                    <label
                      htmlFor="technical-problem-context"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      {FOLLOW_UP_CONFIG.technical_problem.textFollowUp.label}
                    </label>

                    <textarea
                      id="technical-problem-context"
                      value={followUpText}
                      onChange={(e) => setFollowUpText(e.target.value)}
                      placeholder={FOLLOW_UP_CONFIG.technical_problem.textFollowUp.placeholder}
                      maxLength={500}
                      disabled={isSubmitting}
                      className="focus:border-primary focus:ring-primary/10 min-h-[90px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-3 text-sm leading-6 text-slate-700 transition-all outline-none placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <div className="mt-1.5 text-right text-[10px] text-slate-400">
                      {followUpText.length}/500
                    </div>
                  </div>
                )}

                {/* Alternative Context */}
                {reason === "found_alternative" && (
                  <div className="mt-5">
                    <label
                      htmlFor="alternative-context"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      {FOLLOW_UP_CONFIG.found_alternative.textFollowUp.label}
                      <span className="ml-1 text-xs font-normal text-slate-400">Optional</span>
                    </label>

                    <textarea
                      id="alternative-context"
                      value={followUpText}
                      onChange={(e) => setFollowUpText(e.target.value)}
                      placeholder={FOLLOW_UP_CONFIG.found_alternative.textFollowUp.placeholder}
                      maxLength={500}
                      disabled={isSubmitting}
                      className="focus:border-primary focus:ring-primary/10 min-h-[90px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-3 text-sm leading-6 text-slate-700 transition-all outline-none placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <div className="mt-1.5 text-right text-[10px] text-slate-400">
                      {followUpText.length}/500
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Additional Comments */}
            <div className="mt-6">
              <div className="mb-3">
                <label
                  htmlFor="deletion-feedback"
                  className="block text-sm font-semibold text-slate-800"
                >
                  {reason === "other"
                    ? "Could you tell us a little more?"
                    : "Is there anything we could have done better?"}

                  {reason === "other" ? (
                    <span className="ml-1 text-rose-500">*</span>
                  ) : (
                    <span className="ml-1 text-xs font-normal text-slate-400">Optional</span>
                  )}
                </label>

                <p className="mt-1 text-xs text-slate-400">
                  {reason === "other"
                    ? "Your feedback helps us understand what we can improve."
                    : "Even a few words can help us improve."}
                </p>
              </div>

              <div className="relative">
                <textarea
                  id="deletion-feedback"
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.target.value)}
                  placeholder={
                    reason === "other"
                      ? "Please share why you're leaving Rahvana..."
                      : "Share any feedback you'd like us to know..."
                  }
                  className="focus:border-primary focus:ring-primary/10 min-h-[110px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-3.5 text-sm leading-6 text-slate-700 transition-all outline-none placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:ring-4"
                  maxLength={1000}
                  disabled={isSubmitting}
                />

                <div className="pointer-events-none absolute right-3 bottom-3 rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] text-slate-400">
                  {additionalComments.length}/1000
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-white hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Skip
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 focus:ring-primary/20 inline-flex min-w-[105px] items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-sm"
            >
              {isSubmitting ? "Saving..." : "Continue"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

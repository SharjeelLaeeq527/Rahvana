"use client";

import React, { useState } from "react";
import { X, MessageSquareHeart, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/app/components/shared/ToastProvider";

interface SurveyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: (reason: string, additionalComments: string) => Promise<unknown>;
  onSkip: () => void;
}

const DELETION_REASONS = [
  {
    value: "journey_completed",
    label: "My immigration journey is complete",
  },
  {
    value: "no_longer_needed",
    label: "I no longer need Rahvana",
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
    label: "I found another solution",
  },
  {
    value: "other",
    label: "Other",
  },
];

export default function SurveyModal({ open, onOpenChange, onContinue, onSkip }: SurveyModalProps) {
  const [reason, setReason] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();

  const resetForm = () => {
    setReason("");
    setAdditionalComments("");
    setIsSubmitting(false);
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

    setIsSubmitting(true);

    try {
      await onContinue(reason, additionalComments.trim());

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting account deletion survey:", error);

      const message = error instanceof Error ? error.message : "Failed to submit your feedback.";

      showToast(message, "error");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:w-full">
        <DialogDescription className="sr-only">
          Tell us why you are deleting your Rahvana account.
        </DialogDescription>

        {/* Header */}
        <DialogHeader className="from-primary/[0.06] relative shrink-0 border-b border-slate-100 bg-gradient-to-b to-white px-6 pt-6 pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <MessageSquareHeart className="text-primary h-5 w-5" />
              </div>

              <div>
                <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900">
                  Before you go...
                </DialogTitle>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  A quick question to help us make Rahvana better.
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
            {/* Reason */}
            <div>
              <div className="mb-3.5">
                <label className="block text-sm font-semibold text-slate-800">
                  What&apos;s the main reason you&apos;re deleting your account?
                  <span className="ml-1 text-rose-500">*</span>
                </label>

                <p className="mt-1 text-xs text-slate-400">
                  Select the option that best describes your reason.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {DELETION_REASONS.map((item) => {
                  const isSelected = reason === item.value;

                  return (
                    <label
                      key={item.value}
                      className={`group relative flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-all duration-200 ${
                        isSelected
                          ? "border-primary bg-primary/[0.06] shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80"
                      }`}
                    >
                      <input
                        type="radio"
                        name="deletion-reason"
                        value={item.value}
                        checked={isSelected}
                        onChange={(e) => setReason(e.target.value)}
                        className="sr-only"
                      />

                      {/* Custom radio */}
                      <span
                        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-all ${
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-slate-300 bg-white group-hover:border-slate-400"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </span>

                      <span
                        className={`text-[13px] leading-5 transition-colors ${
                          isSelected ? "font-medium text-slate-800" : "text-slate-600"
                        }`}
                      >
                        {item.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="my-7 h-px bg-slate-100" />

            {/* Additional Comments */}
            <div>
              <div className="mb-3">
                <label
                  htmlFor="deletion-feedback"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Is there anything we could have done better?
                  <span className="ml-1 text-xs font-normal text-slate-400">Optional</span>
                </label>

                <p className="mt-1 text-xs text-slate-400">Even a few words can help us improve.</p>
              </div>

              <div className="relative">
                <textarea
                  id="deletion-feedback"
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.target.value)}
                  placeholder="Share any feedback you'd like us to know..."
                  className="focus:border-primary focus:ring-primary/10 min-h-[120px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-3.5 text-sm leading-6 text-slate-700 transition-all outline-none placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:ring-4"
                  maxLength={1000}
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

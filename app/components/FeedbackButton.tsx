"use client";

import React, { useState } from "react";
import { MessageCircle, X, Upload, CheckCircle2 } from "lucide-react";

interface FeedbackButtonProps {
  steps: string[];
  currentStepName: string;
}

export default function FeedbackButton({
  steps,
  currentStepName,
}: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState({
    category: "",
    step: currentStepName || "",
    description: "",
    attachments: [] as File[],
  });
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Store feedback locally (in production, this would be sent to a server)
    const existingFeedback = JSON.parse(
      localStorage.getItem("wizard_feedback") || "[]",
    );

    // We don't save the actual File objects in localStorage since they can't be stringified properly
    // Storing metadata instead
    const fileMetadata = feedback.attachments.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
    }));

    const newFeedback = {
      category: feedback.category,
      step: feedback.step,
      description: feedback.description,
      attachments: fileMetadata,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(
      "wizard_feedback",
      JSON.stringify([...existingFeedback, newFeedback]),
    );

    setSubmitted(true);
    setTimeout(() => {
      setIsOpen(false);
      setSubmitted(false);
      setFeedback({
        category: "",
        step: currentStepName || "",
        description: "",
        attachments: [],
      });
    }, 2000);
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
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-teal-700 transition-all duration-200 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/70 focus-visible:ring-offset-2"
        aria-label="Provide feedback"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm font-semibold tracking-wide">
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

              {submitted ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">
                    Thank you for your feedback!
                  </h4>
                  <p className="text-slate-600">
                    Your input helps us improve the wizard experience.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Feedback Type
                    </label>
                    <select
                      value={feedback.category}
                      onChange={(e) =>
                        setFeedback((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white shadow-sm"
                      required
                    >
                      <option value="">Select a category</option>
                      <option value="Incorrect info">
                        Incorrect information
                      </option>
                      <option value="UI/UX issue">UI/UX issue</option>
                      <option value="Bug">Bug / Something broken</option>
                      <option value="Suggestion">
                        Suggestion / Improvement
                      </option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Step */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Where did this happen?
                    </label>
                    <select
                      value={feedback.step}
                      onChange={(e) =>
                        setFeedback((prev) => ({
                          ...prev,
                          step: e.target.value,
                        }))
                      }
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white shadow-sm"
                    >
                      {steps.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

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
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-h-[120px] shadow-sm resize-y"
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
                      <label
                        htmlFor="feedback-files"
                        className="cursor-pointer"
                      >
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
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                      Submit Feedback
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

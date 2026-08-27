"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquareWarning, X, Upload } from "lucide-react";
import { useToast } from "./shared/ToastProvider";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";

interface FeedbackButtonProps {
  steps?: string[];
  currentStepName?: string;
  onSubmit?: (feedbackType: string, description: string, attachment?: File) => Promise<unknown>;
}

export default function FeedbackButton({
  steps = [],
  currentStepName = "",
  onSubmit,
}: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inHero, setInHero] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(16);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const [hideForHeroAnim, setHideForHeroAnim] = useState(true);
  const [heroAnimationResolved, setHeroAnimationResolved] = useState(false);
  const [feedback, setFeedback] = useState({
    category: "",
    step: currentStepName || "",
    description: "",
    attachments: [] as File[],
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const heroPlaying = document.documentElement.dataset.heroAnimationPlaying;
    const isHomePage = /^\/(?:home)?$/.test(window.location.pathname);

    if (!isHomePage) {
      setHideForHeroAnim(false);
      return;
    }

    setHideForHeroAnim(heroPlaying !== "false");
  }, [pathname]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chooseButtonPosition = useCallback(() => {
    if (typeof window === "undefined" || isOpen) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const edgeOffset = viewportWidth < 640 ? 12 : 24;
    const buttonHeight = 48;
    const buttonWidth = 56;
    const maxBottom = Math.max(edgeOffset, viewportHeight - buttonHeight - 96);
    const baseCandidates = [
      edgeOffset,
      edgeOffset + 64,
      edgeOffset + 128,
      edgeOffset + 192,
      edgeOffset + 256,
      Math.round(viewportHeight * 0.45),
    ];
    const candidates = Array.from(
      new Set(baseCandidates.map((candidate) => Math.min(candidate, maxBottom)))
    ).filter((candidate) => candidate >= edgeOffset);

    const right = viewportWidth - edgeOffset;
    const left = right - buttonWidth;

    const scoreCandidate = (candidate: number) => {
      const top = viewportHeight - candidate - buttonHeight;
      const samplePoints = [
        [left + buttonWidth / 2, top + buttonHeight / 2],
        [left + 10, top + 10],
        [right - 10, top + buttonHeight - 10],
      ];

      return samplePoints.reduce((score, [x, y]) => {
        const elements = document.elementsFromPoint(x, y);

        const hasImportantElement = elements.some((element) => {
          const currentButton = buttonRef.current;
          if (
            !element ||
            element === document.body ||
            element === document.documentElement ||
            (currentButton && currentButton.contains(element))
          ) {
            return false;
          }

          if (!(element instanceof HTMLElement)) return false;

          const style = window.getComputedStyle(element);
          if (
            style.visibility === "hidden" ||
            style.display === "none" ||
            style.pointerEvents === "none"
          ) {
            return false;
          }

          const tagName = element.tagName.toLowerCase();
          const isInteractive =
            ["a", "button", "input", "select", "textarea", "summary"].includes(tagName) ||
            element.getAttribute("role") === "button" ||
            element.getAttribute("role") === "link" ||
            element.hasAttribute("tabindex");
          const isFloating =
            style.position === "fixed" || style.position === "sticky" || Number(style.zIndex) >= 10;

          return isInteractive || isFloating;
        });

        return score + (hasImportantElement ? 1 : 0);
      }, 0);
    };

    const bestCandidate = candidates.reduce(
      (best, candidate) => {
        const score = scoreCandidate(candidate);
        if (score < best.score) return { offset: candidate, score };
        return best;
      },
      { offset: candidates[0] ?? edgeOffset, score: Number.POSITIVE_INFINITY }
    );

    setBottomOffset(bestCandidate.offset);
  }, [isOpen]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
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

  useEffect(() => {
    let frameId = 0;

    const schedulePositionUpdate = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(chooseButtonPosition);
    };

    schedulePositionUpdate();
    window.addEventListener("scroll", schedulePositionUpdate, {
      passive: true,
    });
    window.addEventListener("resize", schedulePositionUpdate);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", schedulePositionUpdate);
      window.removeEventListener("resize", schedulePositionUpdate);
    };
  }, [chooseButtonPosition]);

  // Listen for hero visibility changes
  useEffect(() => {
    const handleHeroVisibility = (event: Event) => {
      if (event instanceof CustomEvent) {
        setInHero(event.detail.inHero);
      }
    };

    window.addEventListener("home-hero-visibility", handleHeroVisibility);
    return () => {
      window.removeEventListener("home-hero-visibility", handleHeroVisibility);
    };
  }, []);

  // Listen for hero animation playing state — hides the button entirely
  // while the intro cinematic sequence is still running.
  useEffect(() => {
    const handleHeroAnimPlaying = (event: Event) => {
      if (event instanceof CustomEvent) {
        const playing = event.detail.playing;
        setHideForHeroAnim(Boolean(playing));
        if (playing === false) setHeroAnimationResolved(true);
      }
    };

    // Read an initial, possibly-persistent flag to avoid race where the
    // animation dispatches before this component mounts.
    try {
      if (typeof window !== "undefined" && typeof document !== "undefined") {
        const winFlag = (window as any).__heroAnimationPlaying;
        const dataFlag = document.documentElement.dataset.heroAnimationPlaying;
        let initPlaying: boolean | null = null;

        if (typeof winFlag === "boolean") initPlaying = winFlag;
        else if (dataFlag === "true") initPlaying = true;
        else if (dataFlag === "false") initPlaying = false;

        // Default to hiding while unsure (treat unknown as playing)
        if (initPlaying === null) initPlaying = true;

        setHideForHeroAnim(initPlaying);
        if (initPlaying === false) setHeroAnimationResolved(true);
      }
    } catch (e) {
      /* noop */
    }

    window.addEventListener("hero-animation-playing", handleHeroAnimPlaying);
    return () => {
      window.removeEventListener("hero-animation-playing", handleHeroAnimPlaying);
    };
  }, []);

  // Update step if it changes externally while modal is open
  useEffect(() => {
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
        await onSubmit(feedback.category, feedback.description, feedback.attachments[0]);
      } else {
        // Default global submission
        const formData = new FormData();
        const isGuide = pathname.includes("/guides/");
        const slug = isGuide ? pathname.split("/").pop() : "general";
        // Capture the full page URL so the sheet shows exactly where the user was
        const fullPageUrl = typeof window !== "undefined" ? window.location.href : pathname;

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

      showToast("Feedback submitted successfully! Thank you for helping us improve.", "success");
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
      const message = error instanceof Error ? error.message : "Failed to submit feedback.";
      showToast(message, "error");
    }
  };

  const processFiles = (files: File[]) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const validFiles: File[] = [];
    const tooLargeFiles: string[] = [];

    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        tooLargeFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (tooLargeFiles.length > 0) {
      const errorMsg =
        tooLargeFiles.length === 1
          ? `File "${tooLargeFiles[0]}" exceeds the 10MB limit.`
          : `Some files exceed the 10MB limit: ${tooLargeFiles.join(", ")}`;
      showToast(errorMsg, "error");
    }

    if (validFiles.length > 0) {
      setFeedback((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...validFiles],
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
      // Reset input value so the same file can be selected/re-selected
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFeedback((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  return (
    <>
      {/* Sticky Feedback Button — hidden while the hero intro animation is playing */}
      {!hideForHeroAnim && (
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(true)}
          className="group fixed right-3 z-40 inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-white shadow-lg transition-[background-color,box-shadow] duration-200 ease-out [will-change:transform] [contain:layout] [backface-visibility:hidden] sm:right-6 md:hover:w-[190px] md:hover:scale-[1.03] md:hover:gap-2 md:hover:px-4 md:focus:w-[190px] md:focus:gap-2 md:focus:px-4 md:active:w-[190px] md:active:gap-2 md:active:px-4"
          style={{
            bottom: "calc(16px + env(safe-area-inset-bottom))",
            backgroundColor: inHero
              ? "var(--feedback-button-hero, #71a1a1)"
              : "var(--feedback-button-bg, #0d7377)",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
            transform: "translate3d(0,0,0)",
          }}
        >
          <span className="pointer-events-none flex shrink-0 items-center justify-center">
            <MessageSquareWarning className="h-5 w-5" />
          </span>

          <span className="pointer-events-none max-w-0 text-sm font-semibold whitespace-nowrap opacity-0 transition-all duration-200 sm:group-hover:max-w-[136px] sm:group-hover:opacity-100 sm:group-focus:max-w-[136px] sm:group-focus:opacity-100 sm:group-active:max-w-[136px] sm:group-active:opacity-100">
            Provide Feedback
          </span>
        </button>
      )}

      {/* Feedback Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="flex max-h-[85vh] w-[95vw] max-w-lg flex-col overflow-hidden rounded-2xl border-none bg-white p-0 shadow-2xl sm:w-full">
          <DialogDescription className="sr-only">
            Provide feedback about incorrect information, UI/UX issues, bugs, suggestions, or other
            feedback.
          </DialogDescription>
          <DialogHeader className="flex shrink-0 flex-row items-center justify-between border-b border-slate-100 px-6 py-4">
            <DialogTitle className="text-xl font-bold text-slate-900">Send Feedback</DialogTitle>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="shrink-0 rounded-lg p-2 transition-colors hover:bg-slate-100"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="scrollbar-premium min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-4">
              {/* Feedback Type */}
              <div className="mt-1">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Feedback Type
                </label>
                <CustomDropdown
                  value={feedback.category}
                  onChange={(val) => setFeedback((prev) => ({ ...prev, category: val }))}
                  options={[
                    { value: "incorrect_information", label: "Incorrect information" },
                    { value: "ui_ux_issue", label: "UI/UX issue" },
                    { value: "bug", label: "Bug / Something broken" },
                    { value: "suggestion", label: "Suggestion / Improvement" },
                    { value: "other", label: "Other" },
                  ]}
                  placeholder="Select a category"
                  className="w-full [&_button]:w-full [&_button]:min-w-0"
                />
              </div>

              {/* Step */}
              {steps.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Where did this happen?
                  </label>
                  <CustomDropdown
                    value={feedback.step}
                    onChange={(val) => setFeedback((prev) => ({ ...prev, step: val }))}
                    options={steps.map((step) => ({ value: step, label: step }))}
                    placeholder="Select a step"
                    className="w-full [&_button]:w-full [&_button]:min-w-0"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={feedback.description}
                  onChange={(e) =>
                    setFeedback((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="focus:ring-primary focus:border-primary min-h-[120px] w-full resize-y rounded-lg border border-slate-300 p-3 shadow-sm focus:ring-2"
                  placeholder="Please describe your feedback in detail..."
                  required
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Attachments <span className="font-normal text-slate-400">(optional)</span>
                </label>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-all duration-200 ${
                    isDragging
                      ? "scale-[0.99] border-[#0d7377] bg-[#0d7377]/5 shadow-sm"
                      : "border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <Upload className="mx-auto mb-2 h-8 w-8 animate-pulse text-slate-400" />
                  <p className="mt-1 text-sm text-slate-500">
                    Screenshots help us understand the issue.
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    Drag & drop files here or browse
                  </p>
                  <p className="mt-1 text-xs text-slate-500">PNG, JPG, PDF • Up to 10MB per file</p>
                </div>
                <input
                  ref={fileInputRef}
                  id="feedback-files"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />

                {feedback.attachments.length > 0 && (
                  <div className="scrollbar-premium mt-3 max-h-48 space-y-2 overflow-y-auto">
                    {feedback.attachments.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="animate-in fade-in slide-in-from-top-1 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 duration-150"
                      >
                        <span className="mr-2 flex-1 truncate" title={file.name}>
                          {file.name}
                        </span>
                        <span className="mr-3 shrink-0 text-xs text-slate-400">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(idx);
                          }}
                          className="shrink-0 rounded-full p-1 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-500"
                          title="Remove file"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="focus:ring-primary rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-offset-2 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/80 focus:ring-primary rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-white focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { FormSelections } from "@/app/(tools)/(visa)/221g-action-planner/types/221g";
import { Check, X as XIcon, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGuideSave } from "@/lib/guides/useGuideSave";

interface FollowUpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: FormSelections;
  onResponse: (response: {
    difficultyDoc: string;
    answers: Record<string, boolean>;
  }) => void;
}

const GUIDE_MAPPING: Record<string, string> = {
  passport: "/guides/passport-guide",
  nadra_family_reg: "/guides/frc-guide",
  nadra_birth_cert: "/guides/birth-certificate-guide",
  nadra_birth_cert_petitioner: "/guides/birth-certificate-guide",
  nadra_birth_cert_beneficiary: "/guides/birth-certificate-guide",
  nadra_marriage_cert: "/guides/nikah-nama-guide",
  nikah_nama: "/guides/nikah-nama-guide",
  police_certificate: "/guides/police-verification-guide",
  cnic_guide: "/guides/cnic-guide",
  polio_vaccination_guide: "/guides/polio-vaccination-guide",
};

export function FollowUpDialog({
  isOpen,
  onClose,
  selectedItems,
  onResponse,
}: FollowUpDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [difficultyType, setDifficultyType] = useState<
    "gathering" | "uploading" | "other" | ""
  >("");
  const [difficultyDoc, setDifficultyDoc] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  const { saveGuide, saving } = useGuideSave();

  const handleSaveForLater = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Determine which guide slug corresponds to the selected document
    let guideSlug = "guides";
    if (difficultyDoc !== "other") {
      const docData = relevantDocs.find((d) => d.id === difficultyDoc);
      if (docData && docData.href) {
        // e.g. "/guides/passport-guide" -> "passport-guide"
        const parts = docData.href.split("/");
        guideSlug = parts[parts.length - 1] || "guides";
      }
    }

    // Trigger profile dropdown
    window.dispatchEvent(new CustomEvent("open-profile-menu"));

    // Fire the animation event relative to where the user clicked
    const rect = e.currentTarget.getBoundingClientRect();
    window.dispatchEvent(
      new CustomEvent("animate-save-guide", {
        detail: {
          startX: rect.left + rect.width / 2,
          startY: rect.top + rect.height / 2,
        },
      }),
    );

    // Actively save the guide via backend
    await saveGuide(guideSlug);
  };

  const handleAnswerChange = useCallback((question: string, val: boolean) => {
    setAnswers((prev) => ({ ...prev, [question]: val }));
  }, []);

  // Build steps dynamically based on answers
  const steps = useMemo(() => {
    const list: {
      type: string;
      question: string;
      key: string;
      title?: string;
      options?: { label: string; value: string }[];
      yesLabel?: string;
      noLabel?: string;
    }[] = [];

    // Step 0: Upload Check
    list.push({
      type: "boolean",
      question:
        "Have you uploaded all the requested documents to the portal or submitted them?",
      key: "has_uploaded",
      yesLabel: "Yes, I have",
      noLabel: "No, not yet",
    });

    if (answers["has_uploaded"] === true) {
      list.push({
        type: "boolean",
        question: "Have you received any update from the embassy?",
        key: "embassy_update",
        yesLabel: "Yes",
        noLabel: "No update yet",
      });

      if (answers["embassy_update"] === false) {
        list.push({
          type: "info",
          question: "Check Your Status on CEAC",
          key: "ceac_instructions",
        });
        list.push({
          type: "cta",
          title: "Still Waiting?",
          question:
            "Administrative processing can take time. If it has been over 60 days, you might want to reach out to the embassy or consult our experts.",
          key: "consultation",
        });
      } else if (answers["embassy_update"] === true) {
        list.push({
          type: "cta",
          title: "Congratulations on your update!",
          question:
            "If you need further assistance with new requirements or have questions, you can always consult our experts.",
          key: "consultation",
        });
      }
    } else if (answers["has_uploaded"] === false) {
      list.push({
        type: "boolean",
        question:
          "Are you finding any difficulty in gathering or submitting your documents?",
        key: "has_difficulty",
        yesLabel: "Yes, I need help",
        noLabel: "No, I'm good",
      });

      if (answers["has_difficulty"] === true) {
        list.push({
          type: "choice",
          question: "Where are you facing the most difficulty?",
          key: "difficulty_type",
          options: [
            { label: "Gathering Required Documents", value: "gathering" },
            { label: "Uploading or Submitting Documents", value: "uploading" },
            { label: "Technical Issues or Other", value: "other" },
          ],
        });

        if (difficultyType === "gathering") {
          list.push({
            type: "select",
            question: "Which document are you having trouble with?",
            key: "difficultyDoc",
          });
        } else if (difficultyType === "uploading") {
          list.push({
            type: "info",
            question: "How to Submit Documents",
            key: "uploading_instructions",
          });
        }

        list.push({
          type: "cta",
          title: "Speak with an expert",
          question:
            "Our experts specialize in resolving complex 221(g) cases. Would you like a consultation?",
          key: "consultation",
        });
      } else if (answers["has_difficulty"] === false) {
        list.push({
          type: "cta",
          title: "Please Upload Your Documents",
          question:
            "Since you don't have any difficulties, we encourage you to upload your documents as soon as possible to avoid further delays.",
          key: "encourage_upload",
        });
      }
    }

    return list;
  }, [answers, difficultyType]);

  const activeStep = steps[currentStep] || steps[steps.length - 1];
  const isLastStep =
    currentStep === steps.length - 1 && activeStep?.type === "cta";

  // Filter and deduplicate selected items to show only those marked as true
  const relevantDocs = useMemo(() => {
    const docsMap = new Map<
      string,
      { id: string; label: string; href: string; hasGuide: boolean }
    >();

    Object.entries(selectedItems).forEach(([key, value]) => {
      if (value !== true || key === "admin_processing") return;

      let baseKey = key;
      let label = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

      if (key.includes("birth_cert")) {
        baseKey = "birth_certificate";
        label = "Birth Certificate";
      } else if (
        key.includes("divorce_cert") ||
        key.includes("divorce_decree")
      ) {
        baseKey = "divorce_certificate";
        label = "Divorce Certificate";
      } else if (key.includes("i864")) {
        baseKey = "i864_affidavit";
        label = "Affidavit of Support (I-864)";
      }

      const guideKey = GUIDE_MAPPING[key]
        ? key
        : GUIDE_MAPPING[baseKey]
          ? baseKey
          : key;
      const isMapped = !!GUIDE_MAPPING[guideKey];

      if (!docsMap.has(baseKey)) {
        docsMap.set(baseKey, {
          id: key,
          label: label,
          href: GUIDE_MAPPING[guideKey] || "#",
          hasGuide: isMapped,
        });
      }
    });

    return Array.from(docsMap.values());
  }, [selectedItems]);

  const handleNext = () => {
    if (isLastStep) {
      onResponse({ difficultyDoc, answers });
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const selectDifficultyType = (type: "gathering" | "uploading" | "other") => {
    setDifficultyType(type);
    handleNext();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col my-8 rounded-2xl border-none shadow-2xl bg-white"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header with Progress Bar */}
          <div className="px-6 pt-6 pb-2">
            <div className="flex justify-between items-end mb-4">
              <div>
                <DialogTitle className="text-xl font-bold text-primary leading-tight">
                  221(g) Step-by-Step Help
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                </div>
              </div>
            </div>
            {/* Progress indicator bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-in-out"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <div className="min-h-[250px] flex flex-col justify-center animate-in fade-in slide-in-from-bottom-2 duration-300">
              {activeStep.type === "boolean" && (
                <div className="space-y-6">
                  <p className="text-xl font-semibold text-slate-800 text-center px-4">
                    {activeStep.question}
                  </p>
                  <div className="flex gap-4 max-w-sm mx-auto w-full">
                    <Button
                      variant={
                        answers[activeStep.key] === true ? "default" : "outline"
                      }
                      className={cn(
                        "flex-1 h-20 text-lg font-medium transition-all",
                        answers[activeStep.key] === true
                          ? "bg-primary hover:bg-primary/90 border-primary shadow-md scale-105"
                          : "border-slate-200 text-slate-600 hover:border-primary hover:text-primary",
                      )}
                      onClick={() => {
                        handleAnswerChange(activeStep.key, true);
                        handleNext();
                      }}
                    >
                      {activeStep.yesLabel || "Yes, I need help"}
                    </Button>
                    <Button
                      variant={
                        answers[activeStep.key] === false
                          ? "default"
                          : "outline"
                      }
                      className={cn(
                        "flex-1 h-20 text-lg font-medium transition-all",
                        answers[activeStep.key] === false
                          ? "bg-primary hover:bg-primary/90 border-primary shadow-md scale-105"
                          : "border-slate-200 text-slate-600 hover:border-primary hover:text-primary",
                      )}
                      onClick={() => {
                        handleAnswerChange(activeStep.key, false);
                        handleNext();
                      }}
                    >
                      {activeStep.noLabel || "No, I'm good"}
                    </Button>
                  </div>
                </div>
              )}

              {activeStep.type === "choice" && (
                <div className="space-y-6">
                  <p className="text-xl font-semibold text-slate-800 text-center px-4">
                    {activeStep.question}
                  </p>
                  <div className="grid grid-cols-1 gap-3 max-w-md mx-auto w-full text-left">
                    {activeStep.options?.map((opt) => (
                      <Button
                        key={opt.value}
                        variant="outline"
                        className={cn(
                          "h-14 justify-start px-6 text-base font-medium transition-all border-slate-200 hover:border-primary hover:bg-primary/10",
                          difficultyType === opt.value &&
                            "border-primary bg-primary/10 text-primary font-bold",
                        )}
                        onClick={() => selectDifficultyType(opt.value)}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mr-3" />
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {activeStep.type === "select" && (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-xl font-semibold text-slate-800 px-4">
                      {activeStep.question}
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      Select a document to view our expert guidance.
                    </p>
                  </div>

                  <div className="max-w-md mx-auto w-full space-y-4">
                    <Select
                      value={difficultyDoc}
                      onValueChange={setDifficultyDoc}
                    >
                      <SelectTrigger className="h-14 bg-white border-slate-200 shadow-sm text-base">
                        <SelectValue placeholder="Select a document..." />
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        sideOffset={8}
                        className="max-h-[300px] z-9999 w-[--radix-select-trigger-width]"
                      >
                        {relevantDocs.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="other">
                          Other / Not in list
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {difficultyDoc &&
                      (() => {
                        const isOther = difficultyDoc === "other";
                        const selectedDocObj = isOther
                          ? null
                          : relevantDocs.find((d) => d.id === difficultyDoc);
                        const hasGuide = isOther
                          ? true
                          : !!selectedDocObj?.hasGuide;

                        return (
                          <div className="p-5 bg-primary/10 border border-primary/20 rounded-xl animate-in zoom-in-95 duration-200 shadow-sm">
                            <p className="text-base text-primary font-medium mb-1">
                              {hasGuide
                                ? "We have a guide for this!"
                                : "Guide Not Available Yet"}
                            </p>
                            <p className="text-sm text-primary leading-relaxed mb-3">
                              {isOther
                                ? "Check our comprehensive list of document guides."
                                : hasGuide
                                  ? `Learn exactly how to obtain your ${selectedDocObj?.label}.`
                                  : `We don't have a guide for ${selectedDocObj?.label} yet. Please let us know if you need one using the feedback button—your input helps us prioritize new guides!`}
                            </p>
                            <Button
                              asChild
                              variant="default"
                              className="w-full bg-primary hover:bg-primary/90"
                            >
                              <Link
                                href={
                                  hasGuide &&
                                  selectedDocObj?.href &&
                                  selectedDocObj.href !== "#"
                                    ? selectedDocObj.href
                                    : "/guides"
                                }
                              >
                                {hasGuide
                                  ? "View Guide"
                                  : "Browse Available Guides"}
                              </Link>
                            </Button>

                            {hasGuide && (
                              <Button
                                variant="outline"
                                onClick={handleSaveForLater}
                                disabled={saving}
                                className="w-full h-10 border-primary/30 text-primary hover:bg-primary/10 transition-colors flex items-center gap-2 mt-2"
                              >
                                <Bookmark className="w-4 h-4" />
                                {saving ? "Saving..." : "Save it for later"}
                              </Button>
                            )}
                          </div>
                        );
                      })()}
                  </div>
                </div>
              )}

              {activeStep.type === "info" &&
                activeStep.key === "ceac_instructions" && (
                  <div className="space-y-6 max-w-lg mx-auto w-full">
                    <div className="text-center">
                      <p className="text-xl font-bold text-slate-900">
                        {activeStep.question}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        If your case is still under administrative processing,
                        here is what you can do.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          1
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            Check CEAC Portal
                          </p>
                          <p className="text-sm text-slate-600">
                            Visit the Consular Electronic Application Center
                            (CEAC) website to check your exact visa status using
                            your case number.
                          </p>
                          <Link
                            href="https://ceac.state.gov/CEACStatTracker/Status.aspx"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-bold text-primary hover:underline mt-1 inline-block"
                          >
                            Go to CEAC Portal →
                          </Link>
                        </div>
                      </div>

                      <div className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          2
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            Be Patient
                          </p>
                          <p className="text-sm text-slate-600">
                            Administrative processing typically takes 60 days
                            but can vary.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {activeStep.type === "info" &&
                activeStep.key === "uploading_instructions" && (
                  <div className="space-y-6 max-w-lg mx-auto w-full">
                    <div className="text-center">
                      <p className="text-xl font-bold text-slate-900">
                        {activeStep.question}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Follow these steps to submit your documents correctly.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          1
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            Check Your Refusal Letter
                          </p>
                          <p className="text-sm text-slate-600">
                            The letter specifies if you should upload to CEAC or
                            send via Courier.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          2
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            Prepare Your Scans
                          </p>
                          <p className="text-sm text-slate-600">
                            PDF is best. Ensure files are under 2MB and clearly
                            readable.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          3
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            Detailed Instructions
                          </p>
                          <p className="text-sm text-slate-600">
                            Need a detailed walkthrough of the CEAC upload
                            process?
                          </p>
                          <Link
                            href="/guides/how-to-upload-ceac"
                            className="text-sm font-bold text-primary hover:underline mt-1 inline-block"
                          >
                            View Uploading Guide →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {activeStep.type === "cta" && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mb-2">
                      {answers["has_difficulty"] === false ? (
                        <Check className="w-10 h-10" />
                      ) : (
                        <Check className="w-10 h-10" />
                        // <XIcon className="w-10 h-10" />
                      )}
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {activeStep.title}
                    </p>
                    <p className="text-slate-600 px-8 text-lg">
                      {activeStep.question}
                    </p>
                  </div>

                  {activeStep.key !== "encourage_upload" && (
                    <div className="max-w-sm mx-auto w-full space-y-3">
                      <Button
                        asChild
                        className="w-full h-14 text-lg bg-primary hover:bg-primary/90 shadow-md group"
                      >
                        <Link
                          href="/book-consultation"
                          className="flex items-center justify-center"
                        >
                          Secure Appointment
                          <span className="ml-2 group-hover:translate-x-1 transition-transform">
                            →
                          </span>
                        </Link>
                      </Button>
                      <p className="text-center text-xs text-slate-400">
                        Get personalized help from our immigration specialists.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t border-slate-50 flex sm:flex-row gap-3 bg-slate-50/30">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            className={cn(
              "sm:flex-1 text-slate-500 hover:text-slate-700",
              currentStep === 0 && "opacity-0 invisible",
            )}
          >
            Back
          </Button>

          <Button
            className={cn(
              "sm:flex-1 text-white shadow-sm transition-all h-12 text-base",
              isLastStep
                ? "bg-primary hover:bg-primary/90"
                : "bg-primary hover:bg-primary/90",
            )}
            onClick={handleNext}
            disabled={
              (activeStep.type === "boolean" &&
                answers[activeStep.key] === undefined) ||
              (activeStep.type === "choice" && difficultyType === "")
            }
          >
            {isLastStep ? "Finish & Update Status" : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

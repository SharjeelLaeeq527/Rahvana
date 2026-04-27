// app/components/forms/reusable/multi-step-form.tsx
"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getFormConfig } from "@/lib/formConfig";
import { Header } from "./Header";
import { ProgressFooter } from "./ProgressFooter";
import { FormStep } from "./FormStep";
import { ReviewPage } from "./ReviewPage";
import type { Field as ConfigField } from "@/lib/formConfig/types";
import {
  X,
  ChevronRight,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/app/context/AuthContext";
import { autoFillForm } from "@/lib/autoFill/mapper";
import type { MasterProfile } from "@/types/profile";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { DocumentRole } from "@/lib/document-vault/types";
import { useToast } from "@/app/components/shared/ToastProvider";
import { Loader } from "@/components/ui/spinner";

const FORM_ID_MAPPING: Record<string, string> = {
  i130: "i-130-petition",
  i130a: "i-130a-supplemental",
  i129f: "i-129f-petition",
  i912: "i-912-waiver",
  i864: "i-864-affidavit",
  i864a: "i-864a-contract",
  i864ez: "i-864ez-affidavit",
  i693: "i-693-medical",
  ds260: "ds-260",
};

type ViewType = "form" | "review";

type MultiStepFormProps = {
  formCode: string;
};

const getLastAnsweredIndex = (
  fields: ConfigField[],
  data: Record<string, string>,
) => {
  let lastIndex = 0;
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    if (field.condition && !field.condition(data)) continue;
    const value = data[field.key];
    if (value && value !== "") {
      lastIndex = i;
    } else {
      break;
    }
  }
  return lastIndex;
};

export function MultiStepForm({ formCode }: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [view, setView] = useState<ViewType>("form");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isScrollingUp, setIsScrollingUp] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const [navigationDirection, setNavigationDirection] = useState<
    "next" | "prev"
  >("next");
  const [progressiveSubQuestionIndices, setProgressiveSubQuestionIndices] =
    useState<Record<string, number>>({});
  const [isClient, setIsClient] = useState(false);
  const [showSectionIntro, setShowSectionIntro] = useState(false);
  const [introVisible, setIntroVisible] = useState(false);
  const [cameFromIntro, setCameFromIntro] = useState(false);
  const savedScrollPosition = useRef<number>(0);
  const { user } = useAuth();
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSavingToVault, setIsSavingToVault] = useState(false);
  const { showToast } = useToast();
  const {
    config: vaultConfig,
    reloadDocuments,
    initialize: initializeVault,
  } = useDocumentVaultStore();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const prevStepRef = useRef(currentStep);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const config = useMemo(() => getFormConfig(formCode), [formCode]);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && config) {
      setFormData(config.getInitialFormData());
      setIsReady(true);
    }
  }, [isClient, config]);

  useEffect(() => {
    if (user && !vaultConfig) {
      initializeVault(user.id);
    }
  }, [user, vaultConfig, initializeVault]);

  // Detect scroll direction for mobile menu visibility
  useEffect(() => {
    let lastScrollY = 0;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY) {
        setIsScrollingUp(true);
      } else if (currentScrollY > lastScrollY + 50) {
        setIsScrollingUp(false);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user || profileLoaded) return;
      try {
        const { data } = await supabase
          .from("user_profiles")
          .select("profile_details")
          .eq("id", user.id)
          .single();

        if (data?.profile_details) {
          setFormData((prev) => {
            // Use current form structure as template for auto-fill
            const autoData = autoFillForm(
              data.profile_details as MasterProfile,
              prev,
            ) as Record<string, string>;
            return { ...prev, ...autoData };
          });
          setProfileLoaded(true);
        }
      } catch (err) {
        console.error("Auto-fill error:", err);
      }
    };
    loadProfile();
  }, [user, profileLoaded, supabase]);

  const sections = useMemo(() => {
    if (!config) return [];
    const sectionMap = new Map<string, ConfigField[]>();
    config.formFields.forEach((field: ConfigField) => {
      const section = field.section ?? "General";
      if (!sectionMap.has(section)) sectionMap.set(section, []);
      sectionMap.get(section)!.push(field);
    });
    return Array.from(sectionMap.entries())
      .filter(([, fields]) => fields.length > 0)
      .map(([title, fields]) => ({ title, fields }));
  }, [config]);

  const totalSteps = sections.length;
  const currentSection = sections[currentStep - 1];

  // Visible fields for the current section
  const visibleFields = useMemo(() => {
    if (!currentSection) return [];
    return currentSection.fields.filter((field) => {
      if (field.condition && !field.condition(formData)) return false;
      return true;
    });
  }, [currentSection, formData]);

  // Sync question index when section changes
  useEffect(() => {
    if (!currentSection) return;
    const lastIndex = getLastAnsweredIndex(visibleFields, formData);
    setCurrentQuestionIndex(lastIndex);

    // Initialize progressive sub-question index for the current field
    const currentField = visibleFields[lastIndex];
    if (currentField?.subQuestions && currentField.subQuestions.length > 0) {
      // Check if any subQuestions are non-conditional (should show immediately)
      const hasNonConditionalSubQ = currentField.subQuestions.some(
        (subQ) => !subQ.condition || subQ.condition(formData),
      );
      if (
        hasNonConditionalSubQ &&
        !progressiveSubQuestionIndices[currentField.key]
      ) {
        // Initialize to 0 to show first subQuestion immediately
        setProgressiveSubQuestionIndices((prev) => ({
          ...prev,
          [currentField.key]: 0,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Auto-expand first section on mount, and auto-expand/collapse on step change
  useEffect(() => {
    // Only expand/collapse when step actually changes, not on every render
    if (prevStepRef.current !== currentStep) {
      if (currentSection && sections.length > 0) {
        setExpandedSections(new Set([currentSection.title]));

        // Show intro card for new section
        setShowSectionIntro(true);
        setIntroVisible(true);
      }
      prevStepRef.current = currentStep;
    }
  }, [currentStep, currentSection, sections.length]);

  // Show intro on first load
  useEffect(() => {
    if (isReady && currentSection && !showSectionIntro) {
      setShowSectionIntro(true);
      setIntroVisible(true);
    }
  }, [isReady]);

  // Save and restore scroll position when intro card appears/disappears
  useEffect(() => {
    if (showSectionIntro && introVisible) {
      // Save scroll position before intro appears
      savedScrollPosition.current = window.scrollY;
    } else if (
      !showSectionIntro &&
      !introVisible &&
      savedScrollPosition.current > 0
    ) {
      // Restore scroll position after intro disappears (both auto and manual)
      const position = savedScrollPosition.current;
      requestAnimationFrame(() => {
        window.scrollTo({
          top: position,
          behavior: "instant" as ScrollBehavior,
        });
      });
      savedScrollPosition.current = 0;
    }
  }, [showSectionIntro, introVisible]);

  const fieldsToRender = visibleFields.slice(0, currentQuestionIndex + 1);

  // Granular progress: completed sections + within-section progress
  const progress = useMemo(() => {
    if (totalSteps === 0) return 0;
    const sectionWeight = 100 / totalSteps;
    const completedSections = (currentStep - 1) * sectionWeight;
    const within =
      visibleFields.length > 0
        ? ((currentQuestionIndex + 1) / visibleFields.length) * sectionWeight
        : sectionWeight;
    return Math.min(100, completedSections + within);
  }, [currentStep, totalSteps, currentQuestionIndex, visibleFields.length]);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;

      setFormData((prev) => {
        const newData = {
          ...prev,
          [name]: type === "checkbox" ? (checked ? "Yes" : "") : value,
        };

        // Special side effect for I-130: If beneficiary is NOT employed, set employer name to "Unemployed"
        if (name === "beneficiary_isEmployed" && value === "No") {
          newData["beneficiary_employerName"] = "Unemployed";
        }

        return newData;
      });
    },
    [],
  );

  const handleNext = () => {
    setNavigationDirection("next");

    if (currentQuestionIndex < visibleFields.length - 1) {
      const currentField = visibleFields[currentQuestionIndex];
      const currentSubCount =
        progressiveSubQuestionIndices[currentField.key] ?? -1;

      // Handle sub-questions (including conditional ones)
      if (
        currentField.subQuestions &&
        currentSubCount < currentField.subQuestions.length - 1
      ) {
        setProgressiveSubQuestionIndices((prev) => ({
          ...prev,
          [currentField.key]: (currentSubCount ?? -1) + 1,
        }));
        return;
      }

      // Move to next field
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);

      // Initialize sub-question index for the new field if it has subQuestions
      const nextField = visibleFields[nextIndex];
      if (nextField?.subQuestions && nextField.subQuestions.length > 0) {
        const hasNonConditionalSubQ = nextField.subQuestions.some(
          (subQ) => !subQ.condition || subQ.condition(formData),
        );
        if (hasNonConditionalSubQ) {
          setProgressiveSubQuestionIndices((prev) => ({
            ...prev,
            [nextField.key]: 0,
          }));
        }
      }
    } else {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        setProgressiveSubQuestionIndices({});
      } else {
        setView("review");
      }
    }
  };

  const handlePrevious = () => {
    setNavigationDirection("prev");
    if (currentQuestionIndex > 0) {
      const currentField = visibleFields[currentQuestionIndex];
      const currentSubCount =
        progressiveSubQuestionIndices[currentField.key] ?? -1;
      if (currentSubCount > -1) {
        // Hide last shown sub-question
        setProgressiveSubQuestionIndices((prev) => ({
          ...prev,
          [currentField.key]: Math.max(-1, currentSubCount - 1),
        }));
        return;
      }
      setCurrentQuestionIndex((prev) => prev - 1);
    } else if (currentStep > 1) {
      if (currentQuestionIndex === 0 && cameFromIntro) {
        // User just entered section → go back to intro of SAME section
        setShowSectionIntro(true);
        setIntroVisible(true);
        setCameFromIntro(false);
        return;
      }
    
      // normal behavior (go to previous section LAST question)
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setProgressiveSubQuestionIndices({});
    
      const prevSection = sections[prevStep - 1];
      const prevVisible = prevSection.fields.filter(
        (field) => !field.condition || field.condition(formData)
      );
    
      setCurrentQuestionIndex(Math.max(0, prevVisible.length - 1));
    }
  };

  const toggleSectionExpanded = useCallback((title: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }, []);

  const handleJumpToQuestion = useCallback(
    (stepIdx: number, questionIdx: number) => {
      setCurrentStep(stepIdx + 1);
      setCurrentQuestionIndex(questionIdx);
      setIsDrawerOpen(false);
    },
    [],
  );

  const handleGoToStep = useCallback((step: number) => {
    setCurrentStep(step);
    setView("form");
  }, []);

  const handleEditStep = useCallback((step: number) => {
    setCurrentStep(step);
    setView("form");
  }, []);

  // Get intro message from config
  const getSectionIntroMessage = useCallback(
    (sectionTitle: string) => {
      const configMessages = config?.sectionIntroMessages;
      if (configMessages && configMessages[sectionTitle]) {
        return configMessages[sectionTitle];
      }
      // Fallback generic message
      return {
        greeting: `Moving to ${sectionTitle.replace(/^\d+\.\s*/, "")}`,
        message: "Please answer the following questions carefully.",
      };
    },
    [config],
  );

  const buildPdfPayload = useCallback((): Record<string, any> => {
    if (!config) return {};

    const payload: Record<string, any> = {};

    config.formFields.forEach((field: ConfigField) => {
      const value = formData[field.key];
      if (!value || (field.condition && !field.condition(formData))) return;

      if (field.type === "radio" && field.options) {
        const selected = field.options.find(
          (opt: { value: string; pdfKey: string }) => opt.value === value,
        );
        if (selected) {
          payload[selected.pdfKey] = "Yes";
          field.options
            .filter(
              (opt: { value: string; pdfKey: string }) => opt.value !== value,
            )
            .forEach(
              (opt: { value: string; pdfKey: string }) =>
                (payload[opt.pdfKey] = "Off"),
            );
        }
      } else if (field.type === "checkbox") {
        const isChecked =
          value === "Yes" || String(value) === "true" || value === "on";
        payload[field.pdfKey] = isChecked ? "Yes" : "Off";
      } else {
        payload[field.pdfKey] = value;
      }
    });

    // Add dynamic overflow handling for additional addresses
    const count = Number(formData.address_count) || 0;
    const additionalBlocks = [];

    for (let i = 3; i <= count + 1; i++) {
      if (i > 9) break; // Limit to Address 9 (which is 8 previous addresses) for now

      const street = formData[`address_${i}_street`] || "";
      const city = formData[`address_${i}_city`] || "";
      const state = formData[`address_${i}_state`] || "";
      const zip = formData[`address_${i}_zip`] || "";
      const from = formData[`address_${i}_from`] || "";
      const to = formData[`address_${i}_to`] || "";
      const country = formData[`address_${i}_country`] || "";

      const parts = [street, city, state, zip, country].filter(Boolean);
      let infoString = `Address ${i}: ${parts.join("\n ")}.`;
      if (from || to) {
        infoString += ` From: ${from} To: ${to}`;
      }

      additionalBlocks.push({
        page_number: "2", // I-130 Address History is on Page 2
        part_number: "2", // Part 2
        item_number: "14", // Item 14 (Physical Address 2)
        info: infoString,
      });
    }

    if (additionalBlocks.length > 0) {
      payload.additional_info_blocks = additionalBlocks;
    }

    return payload;
  }, [config, formData]);

  const handlePreviewPDF = async () => {
    const payload = buildPdfPayload();
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
    setIsPreviewing(true);
    try {
      const res = await fetch(`${apiUrl}/fill-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: formCode, data: payload }),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err: unknown) {
      console.error("Preview error:", err);
      if (err instanceof Error)
        alert(`Preview failed: ${err.message}. Please check console.`);
      else alert("Preview failed. Please check console.");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleDownloadPDF = async () => {
    const payload = buildPdfPayload();
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
    setIsDownloading(true);
    try {
      const res = await fetch(`${apiUrl}/fill-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: formCode, data: payload }),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${formCode.toUpperCase()}-filled.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error("Download error:", err);
      if (err instanceof Error)
        alert(`Download failed: ${err.message}. Please check console.`);
      else alert("Download failed. Please check console.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveToVault = useCallback(async () => {
    if (!user) {
      showToast("Please login to save to the Document Vault", "error");
      return;
    }
    if (!vaultConfig) {
      showToast("Document Vault is not ready. Please wait a moment.", "error");
      return;
    }
    const docDefId = FORM_ID_MAPPING[formCode.toLowerCase()];
    if (!docDefId) {
      showToast(
        `This form (${formCode}) cannot be saved to the vault automatically yet.`,
        "error",
      );
      return;
    }
    const payload = buildPdfPayload();
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
    setIsSavingToVault(true);
    try {
      const res = await fetch(`${apiUrl}/fill-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: formCode, data: payload }),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();

      const file = new File(
        [blob],
        `${formCode.toUpperCase()}-auto-filled.pdf`,
        { type: "application/pdf" },
      );

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("documentDefId", docDefId);

      let role: DocumentRole = "PETITIONER";
      if (
        formCode.toLowerCase() === "i130a" ||
        formCode.toLowerCase() === "ds260" ||
        formCode.toLowerCase() === "i693"
      ) {
        role = "BENEFICIARY";
      } else if (formCode.toLowerCase() === "i864a") {
        role = "HOUSEHOLD_MEMBER";
      }

      formDataUpload.append("role", role);
      formDataUpload.append("caseId", vaultConfig.caseId || "CASE");

      let personName = "Unknown";
      if (role === "PETITIONER" && vaultConfig.petitionerName) {
        personName = vaultConfig.petitionerName;
      } else if (role === "BENEFICIARY" && vaultConfig.beneficiaryName) {
        personName = vaultConfig.beneficiaryName;
      } else if (role === "JOINT_SPONSOR" && vaultConfig.jointSponsorName) {
        personName = vaultConfig.jointSponsorName;
      }
      formDataUpload.append("personName", personName);
      formDataUpload.append(
        "notes",
        `Automatically generated via ${config?.formTitle || formCode} tool.`,
      );

      const uploadRes = await fetch("/api/documents/upload", {
        method: "POST",
        body: formDataUpload,
      });
      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || "Upload failed");
      }

      showToast("Successfully saved to Document Vault!", "success");
      if (reloadDocuments) await reloadDocuments();
    } catch (err: unknown) {
      console.error("Save to vault error:", err);
      showToast(
        err instanceof Error ? err.message : "Failed to save to vault",
        "error",
      );
    } finally {
      setIsSavingToVault(false);
    }
  }, [
    user,
    vaultConfig,
    formCode,
    buildPdfPayload,
    config?.formTitle,
    reloadDocuments,
    showToast,
  ]);

  /* Sidebar (desktop) */
  const SectionList = useCallback(
    ({ onPick }: { onPick?: () => void }) => (
      <div className="space-y-1.5">
        {sections.map((section, idx) => {
          const stepNum = idx + 1;
          const label = section.title.replace(/^\d+\.\s*/, "");
          const isActive = currentStep === stepNum;
          const isDone = stepNum < currentStep;
          const isExpanded = expandedSections.has(section.title);

          return (
            <motion.div
              key={section.title}
              whileHover={{ x: isSidebarCollapsed ? 0 : 2 }}
              className="group w-full text-left rounded-xl transition-all overflow-visible relative cursor-pointer"
              style={{
                backgroundColor:
                  isActive && !isSidebarCollapsed ? "#e8f6f6" : "transparent",
                boxShadow:
                  isActive && !isSidebarCollapsed
                    ? "inset 0 0 0 1px rgba(13, 115, 119, 0.1)"
                    : "inset 0 0 0 1px transparent",
              }}
              onClick={() => {
                handleGoToStep(stepNum);
                onPick?.();
              }}
            >
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div
                  className="flex items-center justify-center rounded-lg shrink-0 text-xs font-bold transition-all"
                  style={{
                    width: 32,
                    height: 32,
                    background: isDone
                      ? "linear-gradient(135deg, #0d7377 0%, #14a0a6 100%)"
                      : isActive
                        ? "linear-gradient(135deg, #0d7377 0%, #14a0a6 100%)"
                        : "#e8f6f6",
                    color: isDone || isActive ? "#fff" : "#0a5a5d",
                    boxShadow:
                      isActive || isDone
                        ? "0 4px 10px -2px rgba(13, 115, 119, 0.4)"
                        : "none",
                  }}
                >
                  {isDone ? (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  ) : (
                    stepNum
                  )}
                </div>

                {!isSidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{
                        color: isActive ? "#0a5a5d" : "#374151",
                      }}
                    >
                      {label}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {isDone ? "✓ Completed" : isActive ? "In progress" : ""}
                    </p>
                  </div>
                )}

                {!isSidebarCollapsed && (
                  <motion.button
                    animate={{
                      rotate: isExpanded ? 180 : 0,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionExpanded(section.title);
                    }}
                    className="shrink-0 p-1 hover:bg-[#d4edee] rounded transition-colors"
                    style={{ color: "#0a5a5d" }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                )}
              </div>

              {/* Expanded questions list */}
              <AnimatePresence>
                {isExpanded && !isSidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 py-2 space-y-1 bg-[#f9fdfb] border-t border-[#e8f6f6]">
                      {section.fields.map((field) => {
                        // Skip conditional fields that don't match
                        if (field.condition && !field.condition(formData))
                          return null;

                        // Remove numbering from label
                        const cleanLabel = field.label.replace(
                          /^\d+[a-z]?\.\s*/,
                          "",
                        );
                        const fieldAnswered =
                          formData[field.key] && formData[field.key] !== "";

                        return (
                          <motion.button
                            key={field.key}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ x: 2 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const actualIndex = section.fields.findIndex(
                                (f) => f.key === field.key,
                              );
                              handleJumpToQuestion(idx, actualIndex);
                            }}
                            className="w-full text-left text-xs p-2 rounded hover:bg-[#e8f6f6] transition-colors flex items-center gap-2 group"
                            style={{
                              color: fieldAnswered ? "#0a5a5d" : "#6b7280",
                            }}
                          >
                            {fieldAnswered && (
                              <Check
                                className="w-3 h-3"
                                style={{ color: "#0d7377" }}
                              />
                            )}
                            <span className="truncate line-clamp-1">
                              {cleanLabel.substring(0, 35)}
                              {cleanLabel.length > 35 ? "..." : ""}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    ),
    [
      sections,
      currentStep,
      isSidebarCollapsed,
      expandedSections,
      formData,
      handleGoToStep,
      toggleSectionExpanded,
      handleJumpToQuestion,
    ],
  );

  // Show loading state until ready
  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader size="lg" />
        <p className="text-[#0d7377] text-sm font-medium mt-2">
          Loading {formCode.toUpperCase()} Form...
        </p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7fbfb]">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center max-w-md shadow-sm">
          <h2 className="text-2xl font-bold text-red-800 mb-3">
            Form Not Found
          </h2>
          <p className="text-red-700">
            Sorry, the form &quot;<strong>{formCode.toUpperCase()}</strong>
            &quot; is not available yet.
          </p>
          <p className="text-sm text-gray-600 mt-4">
            Available: I-130, I-130A, I-864, DS-260
          </p>
        </div>
      </div>
    );
  }

  if (totalSteps === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        No questions in this form.
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: "#f7fbfb" }}>
      {/* Sticky Header */}
      <Header
        formTitle={config.formTitle}
        formSubtitle={config.formSubtitle}
        onOpenMenu={() => setIsDrawerOpen(true)}
        showMenu={view === "form"}
      />

      {/* Mobile Bottom Tray */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 z-40"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.y > 120) {
                  setIsDrawerOpen(false);
                }
              }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl h-[80vh] flex flex-col"
            >
              {/* Drag Handle */}
              <div className="flex flex-col items-center py-3 border-b bg-gray-50 rounded-t-3xl">
                <div className="w-12 h-1.5 bg-gray-400 rounded-full mb-1" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b">
                <h2 className="text-lg font-bold text-gray-900">Navigation</h2>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content (Scrollable) */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <SectionList onPick={() => setIsDrawerOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Layout - Desktop with Sidebar & Centered Content */}
      <div className="flex gap-6 px-4 md:px-8 py-6 guide-grid-bg justify-center">
        {/* Desktop Sidebar - Hide when intro is visible */}
        {view === "form" && !(showSectionIntro && introVisible) && (
          <motion.aside
            initial={{ width: isSidebarCollapsed ? 80 : 304 }}
            animate={{ width: isSidebarCollapsed ? 80 : 304 }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="hidden lg:block shrink-0"
          >
            <div
              className={`sticky top-6 rounded-2xl transition-all duration-300 flex flex-col 
                max-h-[calc(100vh-180px)] min-h-[calc(100vh-180px)]
                ${
                  isSidebarCollapsed
                    ? "items-center justify-start p-2"
                    : "items-stretch border p-4 overflow-y-auto custom-scrollbar"
                }`}
              style={{
                backgroundColor: isSidebarCollapsed
                  ? "transparent"
                  : "rgba(255, 255, 255, 0.95)",
                borderColor: isSidebarCollapsed ? "transparent" : "#e8f6f6",
                backdropFilter: isSidebarCollapsed ? "none" : "blur(10px)",
              }}
            >
              <AnimatePresence mode="wait">
                {isSidebarCollapsed ? (
                  <motion.div
                    key="collapsed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-center w-full"
                  >
                    <motion.button
                      onClick={() => setIsSidebarCollapsed(false)}
                      className="p-2 rounded-lg"
                      style={{ color: "#0d7377" }}
                      whileHover={{
                        backgroundColor: "rgba(13, 115, 119, 0.08)",
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <PanelLeftOpen className="w-5 h-5" />
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="expanded"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full flex flex-col"
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-4 px-1">
                      <h3
                        className="text-[11px] font-bold uppercase tracking-[0.14em]"
                        style={{ color: "#0a5a5d" }}
                      >
                        Sections
                      </h3>

                      <motion.button
                        onClick={() => setIsSidebarCollapsed(true)}
                        className="p-2 rounded-lg"
                        style={{ color: "#0d7377" }}
                        whileHover={{ backgroundColor: "#e8f6f6" }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <PanelLeftClose className="w-5 h-5" />
                      </motion.button>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <SectionList />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        )}

        {/* Right Content Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 flex items-start justify-center py-8">
            <div className="w-full max-w-2xl px-4 md:px-0">
              {view === "form" && currentSection && (
                <>
                  {/* Section Intro Card */}
                  <AnimatePresence mode="wait">
                    {showSectionIntro && introVisible && (
                      <motion.div
                        key="intro-card"
                        initial={{ opacity: 0, y: 30, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="flex items-center justify-center min-h-[60vh] px-4"
                      >
                        <div className="relative max-w-3xl w-full">
                          <div className="absolute -inset-6 bg-gradient-to-r from-[#0d7377]/20 via-[#14a0a6]/10 to-transparent blur-3xl rounded-[40px]" />

                          <div className="relative overflow-hidden rounded-[28px] border border-white/20 shadow-[0_30px_100px_-40px_rgba(13,115,119,0.35)] backdrop-blur-xl bg-white">
                            <div className="absolute inset-0 flex">
                              <div className="w-1/2 bg-gradient-to-br from-[#0d7377] via-[#14a0a6] to-[#32e0c4]" />
                              <div className="w-1/2 bg-gradient-to-br from-[#0d7377] via-[#14a0a6] to-[#32e0c4]" />
                            </div>

                            <div className="absolute inset-0 overflow-hidden">
                              {Array.from({ length: 18 }).map((_, i) => (
                                <span
                                  key={i}
                                  className="absolute w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse"
                                  style={{
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                    animationDuration: `${2 + Math.random() * 3}s`,
                                  }}
                                />
                              ))}
                            </div>

                            <div className="relative z-10 grid md:grid-cols-2">
                              <div className="p-10 md:p-14 flex flex-col justify-center text-white">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 w-fit">
                                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold">
                                    {currentSection?.title || "Next Section"}
                                  </span>
                                </div>

                                <h2 className="mt-6 text-3xl md:text-4xl font-semibold leading-tight">
                                  {
                                    getSectionIntroMessage(currentSection.title)
                                      .greeting
                                  }
                                </h2>

                                <p className="mt-4 text-sm md:text-base text-white/80 leading-relaxed">
                                  {
                                    getSectionIntroMessage(currentSection.title)
                                      .message
                                  }
                                </p>
                              </div>

                              <div className="p-10 md:p-14 flex flex-col justify-center bg-white relative">
                                {/* subtle gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#f7fbfb] to-white" />

                                <div className="relative z-10">
                                  <h3 className="text-2xl font-semibold text-[#0F0F0E]">
                                    Ready to Dive in?
                                  </h3>

                                  <div className="mt-6 space-y-3">
                                    <div className="flex items-start gap-2 text-sm text-gray-500">
                                      <span className="mt-4 w-2 h-2 rounded-full bg-[#14a0a6]" />
                                      Provide accurate details for faster
                                      processing
                                    </div>
                                    <div className="flex items-start gap-2 text-sm text-gray-500">
                                      <span className="mt-4 w-2 h-2 rounded-full bg-[#14a0a6]" />
                                      This information will be used in official
                                      forms
                                    </div>
                                    <div className="flex items-start gap-2 text-sm text-gray-500">
                                      <span className="mt-4 w-2 h-2 rounded-full bg-[#14a0a6]" />
                                      You can review and edit everything later
                                    </div>
                                  </div>

                                  {/* Progress mini indicator */}
                                  <div className="mt-6">
                                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                                      <span>Section Progress</span>
                                      <span>
                                        {currentStep}/{totalSteps}
                                      </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{
                                          width: `${(currentStep / totalSteps) * 100}%`,
                                        }}
                                        className="h-full bg-gradient-to-r from-[#0d7377] to-[#32e0c4]"
                                      />
                                    </div>
                                  </div>

                                  {/* CTA */}
                                  <motion.button
                                    onClick={() => {
                                      setIntroVisible(false);
                                      setCameFromIntro(true); 
                                      setTimeout(() => setShowSectionIntro(false), 400);
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="mt-8 w-full py-3.5 rounded-xl font-semibold text-white shadow-lg"
                                    style={{
                                      background:
                                        "linear-gradient(135deg, #0d7377 0%, #14a0a6 100%)",
                                    }}
                                  >
                                    Continue →
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form Card */}
                  <AnimatePresence mode="wait">
                    {(!showSectionIntro || !introVisible) && (
                      <motion.div
                        key="form-card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="space-y-6"
                      >
                        <FormStep
                          stepNumber={currentStep}
                          sectionTitle={currentSection.title}
                          fields={fieldsToRender}
                          allVisibleFields={visibleFields}
                          formData={formData}
                          onInputChange={handleChange}
                          currentQuestionIndex={currentQuestionIndex}
                          navigationDirection={navigationDirection}
                          progressiveSubQuestionIndices={
                            progressiveSubQuestionIndices
                          }
                        />

                        {/* Navigation Buttons */}
                        <div className="flex flex-row justify-between items-center gap-3 mt-10 pt-6 border-t border-[#e8f6f6]">
                          <button
                            onClick={handlePrevious}
                            disabled={
                              currentStep === 1 && currentQuestionIndex === 0
                            }
                            className="px-6 py-3 rounded-lg font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#0d7377] hover:text-[#0d7377] whitespace-nowrap inline-flex items-center gap-2"
                            style={{
                              background: "transparent",
                              color: "#8C8C85",
                              border: "1px solid #E0DDD8",
                              letterSpacing: "0.01em",
                            }}
                          >
                            ← Back
                          </button>

                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleNext}
                            className="w-full px-6 md:px-8 py-3 rounded-lg text-white font-semibold transition-all text-sm"
                            style={{
                              background: "#0d7377",
                              letterSpacing: "0.02em",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#0a5a5d";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#0d7377";
                            }}
                          >
                            {(() => {
                              const isLastField =
                                currentQuestionIndex ===
                                visibleFields.length - 1;
                              const isLastStep = currentStep === totalSteps;

                              if (isLastStep && isLastField) {
                                return "Review Answers";
                              }
                              return "Continue →";
                            })()}
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {view === "review" && (
                <div
                  className="rounded-2xl bg-white p-4 md:p-8 border-2 animated-border"
                  style={{
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.03), 0 12px 40px -16px rgba(13,115,119,0.12)",
                  }}
                >
                  <ReviewPage
                    formData={formData}
                    sections={sections}
                    onEditStep={handleEditStep}
                    onBackToForm={() => setView("form")}
                    onPreviewPDF={handlePreviewPDF}
                    onDownloadPDF={handleDownloadPDF}
                    onSaveToVault={handleSaveToVault}
                    isPreviewing={isPreviewing}
                    isDownloading={isDownloading}
                    isSavingToVault={isSavingToVault}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Footer */}
      {view === "form" && (
        <ProgressFooter
          current={currentStep}
          total={totalSteps}
          progress={progress}
          sections={sections}
        />
      )}
    </div>
  );
}

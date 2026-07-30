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
import { X, ChevronLeft, ChevronRight, Check, Sparkles, FileText, Lock } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/app/context/AuthContext";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { autoFillForm, mapFormToProfile } from "@/lib/autoFill/mapper";
import { getFormFieldOverrides, firstProfileValue } from "@/lib/autoFill/formOverrides";
import type { MasterProfile } from "@/types/profile";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { DocumentRole } from "@/lib/document-vault/types";
import { useToast } from "@/app/components/shared/ToastProvider";
import { E, msg } from "@/lib/errors";
import { Loader } from "@/components/ui/spinner";
import { ExpandableTooltip } from "../../shared/ExpandableTooltip";
import { AlertCircle } from "lucide-react";
import { usePlan } from "@/app/context/PlanContext";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { useFreePreview } from "./useFreePreview";

// ============ TYPE DEFINITIONS ============
interface FormProgressDraft {
  id?: string;
  payload: Record<string, string>;
  current_step: number;
  current_question_index: number;
  view_mode: "form" | "review";
  completed?: boolean;
  progressive_sub_question_indices: Record<string, number>;
  last_saved_at: string;
  config_version: string;
}

interface FormProgressResponse {
  draft: FormProgressDraft | null;
  message?: string;
}

// ============ UTILITY FUNCTIONS ============
const createAbortController = (timeoutMs = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeoutId };
};

const DRAFT_STORAGE_KEY = "visa_form_draft_backup";

const buildDraftStorageKey = (formCode: string, journeyKey = "global") =>
  `${DRAFT_STORAGE_KEY}:${formCode.toLowerCase()}:${journeyKey}`;

const readDraftBackup = (formCode: string, journeyKey = "global") => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(buildDraftStorageKey(formCode, journeyKey));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { draft?: FormProgressDraft };
    return parsed.draft ?? null;
  } catch {
    return null;
  }
};

const writeDraftBackup = (formCode: string, draft: FormProgressDraft, journeyKey = "global") => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      buildDraftStorageKey(formCode, journeyKey),
      JSON.stringify({ draft })
    );
  } catch {
    // Ignore storage quota/private mode failures.
  }
};

const clearDraftBackup = (formCode: string, journeyKey = "global") => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(buildDraftStorageKey(formCode, journeyKey));
  } catch {
    // Ignore storage errors.
  }
};

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

const getLastAnsweredIndex = (fields: ConfigField[], data: Record<string, string>) => {
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
  const plan = usePlan();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const config = useMemo(() => getFormConfig(formCode), [formCode]);

  const { isFreePreview, filledFieldsCount } = useFreePreview({
    canUseSmartFormFiller: plan.canUse("smart_form_filler"),
    formFields: config?.formFields || [],
    formData,
  });
  const [view, setView] = useState<ViewType>("form");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [navigationDirection, setNavigationDirection] = useState<"next" | "prev">("next");
  const [progressiveSubQuestionIndices, setProgressiveSubQuestionIndices] = useState<
    Record<string, number>
  >({});
  const [isClient, setIsClient] = useState(false);
  const [showSectionIntro, setShowSectionIntro] = useState(false);
  const [introVisible, setIntroVisible] = useState(false);
  const [cameFromIntro, setCameFromIntro] = useState(false);
  const savedScrollPosition = useRef<number>(0);
  const hasShownInitialIntro = useRef(false);
  const draftJourneyKey = "global";
  const { user } = useAuth();
  const {
    profile: userProfile,
    isProfileLoading: isContextProfileLoading,
    updateProfile,
  } = useUserProfile();
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSavingToVault, setIsSavingToVault] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [draftStatus, setDraftStatus] = useState<"draft" | "completed">("draft");
  const { showToast } = useToast();
  const {
    config: vaultConfig,
    reloadDocuments,
    initialize: initializeVault,
  } = useDocumentVaultStore();
  const prevStepRef = useRef(currentStep);
  const saveTimerRef = useRef<number | null>(null);
  const draftDataRef = useRef({
    formData: formData,
    currentStep: currentStep,
    currentQuestionIndex: currentQuestionIndex,
    view: view,
    progressiveSubQuestionIndices: progressiveSubQuestionIndices,
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [isReady, setIsReady] = useState(false);

  // ============ CONSOLIDATED INITIALIZATION EFFECT ============
  useEffect(() => {
    let isMounted = true;

    const initializeForm = async () => {
      if (!isClient || !config) return;

      try {
        let draftData: FormProgressDraft | null = null;

        // Load draft first if user is authenticated
        if (user) {
          try {
            const res = await fetch(
              `/api/visa-forms/${formCode}/progress?journey_key=${draftJourneyKey}`,
              {
                signal: AbortSignal.timeout(5000), // 5s timeout for draft fetch
              }
            );
            if (res.ok) {
              const data = (await res.json()) as FormProgressResponse;
              draftData = data.draft;
            }
          } catch (draftErr) {
            console.warn("Failed to load draft, proceeding with fresh form:", draftErr);
          }
        }

        if (!draftData) {
          draftData = readDraftBackup(formCode, draftJourneyKey);
        }

        if (!isMounted) return;

        // Build sections for validation
        const sectionMap = new Map<string, ConfigField[]>();
        config.formFields.forEach((field: ConfigField) => {
          const section = field.section ?? "General";
          if (!sectionMap.has(section)) sectionMap.set(section, []);
          sectionMap.get(section)!.push(field);
        });
        const sections = Array.from(sectionMap.entries())
          .filter(([, fields]) => fields.length > 0)
          .map(([title, fields]) => ({ title, fields }));

        // Validate and restore draft or initialize fresh
        if (draftData && sections.length > 0) {
          // Validate step is within bounds
          const validStep = Math.min(Math.max(1, draftData.current_step || 1), sections.length);

          // Validate question index against visible fields
          const draftFormData = draftData.payload || {};
          const section = sections[validStep - 1];
          const validFields =
            section?.fields.filter((f) => !f.condition || f.condition(draftFormData)) || [];
          const validQuestionIndex = Math.min(
            Math.max(0, draftData.current_question_index || 0),
            Math.max(0, validFields.length - 1)
          );

          // Restore fields that exist in config, including nested conditional sub-questions
          const collectFieldKeys = (fields: ConfigField[]): Set<string> => {
            const keys = new Set<string>();
            const walk = (items: ConfigField[]) => {
              items.forEach((f) => {
                keys.add(f.key);
                if (f.options) {
                  f.options.forEach((opt) => {
                    const name = opt.pdfKey || opt.value;
                    keys.add(name);
                  });
                }
                if (f.subQuestions && f.subQuestions.length > 0) {
                  walk(f.subQuestions as ConfigField[]);
                }
              });
            };
            walk(fields);
            return keys;
          };

          const validKeys = collectFieldKeys(config.formFields);
          const validatedPayload: Record<string, string> = {};
          Object.entries(draftData.payload || {}).forEach(([key, value]) => {
            if (!validKeys.has(key)) return;
            if (typeof value !== "string") return;
            validatedPayload[key] = value;
          });

          if (isMounted) {
            setFormData(validatedPayload);
            setCurrentStep(validStep);
            setCurrentQuestionIndex(validQuestionIndex);
            setView((draftData.view_mode || "form") as ViewType);
            setDraftStatus(draftData.completed ? "completed" : "draft");
            setProgressiveSubQuestionIndices(draftData.progressive_sub_question_indices || {});
            setLastSavedAt(draftData.last_saved_at || null);
          }
        } else {
          // Fresh form initialization
          if (isMounted) {
            setFormData(config.getInitialFormData());
            setCurrentStep(1);
            setCurrentQuestionIndex(0);
            setView("form");
            setDraftStatus("draft");
            setProgressiveSubQuestionIndices({});
            setLastSavedAt(null);
          }
        }

        if (isMounted) {
          setDraftLoaded(true);
          setIsReady(true);
        }
      } catch (error) {
        console.error("Form initialization failed:", error);
        if (isMounted) {
          setFormData(config.getInitialFormData());
          setDraftLoaded(true);
          setIsReady(true);
        }
      }
    };

    initializeForm();

    return () => {
      isMounted = false;
    };
  }, [isClient, config, user, formCode]);

  // ============ SESSION VALIDATION ============
  useEffect(() => {
    if (!user) {
      setIsSessionValid(false);
    } else {
      setIsSessionValid(true);
    }
  }, [user]);

  useEffect(() => {
    if (user && !vaultConfig) {
      initializeVault(user.id);
    }
  }, [user, vaultConfig, initializeVault]);

  // Detect scroll direction for mobile menu visibility - REMOVED (unused)
  // This was previously used but is no longer needed

  // Auto-fill from central UserProfileContext (no direct Supabase call)
  // IMPORTANT: wait for `draftLoaded` first. The draft/initial form data is set by
  // the async initialization effect; if auto-fill ran before that, the later
  // setFormData(draft) would overwrite (wipe) the auto-filled values. Gating on
  // draftLoaded guarantees we merge INTO the loaded form data instead of racing it.
  useEffect(() => {
    if (isContextProfileLoading || profileLoaded || !userProfile || !draftLoaded) return;

    setFormData((prev) => {
      // Use current form structure as template for auto-fill
      const autoData = autoFillForm(userProfile, prev) as Record<string, string>;

      const merged = { ...prev };
      const overrides = getFormFieldOverrides(formCode);

      // Global mapper: only fill fields that are still empty (don't touch drafts).
      // Fields with a per-form override are NEVER filled from the global map —
      // the global path may be the WRONG PERSON for this form (e.g. I-130 Part 1
      // asks the SPONSOR's name; the top-level profile is the beneficiary's).
      Object.entries(autoData).forEach(([key, value]) => {
        if (!merged[key] && !(key in overrides)) {
          merged[key] = value;
        }
      });

      // Per-form overrides: for these fields the central profile (e.g. passport-derived
      // beneficiary data) is the SOURCE OF TRUTH, so OVERWRITE any stale value already
      // in the form — a previously-saved draft, or a wrong-person value the global
      // mapper filled (I-130A / DS-260 "you" = beneficiary, not petitioner). We only
      // overwrite when the profile actually has a value, so we never blank a field.
      const profileForOverride = userProfile as unknown as Record<string, unknown>;
      for (const [formKey, paths] of Object.entries(overrides)) {
        const val = firstProfileValue(profileForOverride, paths);
        if (val) merged[formKey] = val;
      }

      return merged;
    });
    setProfileLoaded(true);
  }, [userProfile, isContextProfileLoading, profileLoaded, draftLoaded]);

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
        (subQ) => !subQ.condition || subQ.condition(formData)
      );
      if (hasNonConditionalSubQ && !progressiveSubQuestionIndices[currentField.key]) {
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
    if (isReady && currentSection && !hasShownInitialIntro.current) {
      hasShownInitialIntro.current = true;
      setShowSectionIntro(true);
      setIntroVisible(true);
    }
  }, [isReady, currentSection]);

  // Save and restore scroll position when intro card appears/disappears
  useEffect(() => {
    if (showSectionIntro && introVisible) {
      // Save scroll position before intro appears
      savedScrollPosition.current = window.scrollY;
    } else if (!showSectionIntro && !introVisible && savedScrollPosition.current > 0) {
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

    // Ensure valid step
    if (currentStep > totalSteps) return 100;
    if (currentStep < 1) return 0;

    const sectionWeight = 100 / totalSteps;
    const completedSections = (currentStep - 1) * sectionWeight;

    // Only calculate within-section progress if fields exist
    let withinProgress = 0;
    if (visibleFields.length > 0 && currentQuestionIndex >= 0) {
      withinProgress = ((currentQuestionIndex + 1) / visibleFields.length) * sectionWeight;
    } else if (visibleFields.length > 0) {
      withinProgress = 0; // Haven't answered any questions yet
    } else {
      withinProgress = sectionWeight; // No visible fields, mark section complete
    }

    return Math.min(100, Math.max(0, completedSections + withinProgress));
  }, [currentStep, totalSteps, currentQuestionIndex, visibleFields.length]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
    []
  );

  // Update ref whenever data changes (no effect dependency)
  useEffect(() => {
    draftDataRef.current = {
      formData,
      currentStep,
      currentQuestionIndex,
      view,
      progressiveSubQuestionIndices,
    };
  }, [formData, currentStep, currentQuestionIndex, view, progressiveSubQuestionIndices]);

  useEffect(() => {
    if (!draftLoaded || draftStatus === "completed") return;

    const draftSnapshot: FormProgressDraft = {
      payload: formData,
      current_step: currentStep,
      current_question_index: currentQuestionIndex,
      view_mode: view,
      progressive_sub_question_indices: progressiveSubQuestionIndices,
      last_saved_at: lastSavedAt ?? new Date().toISOString(),
      config_version: "v1",
      completed: false,
    };

    writeDraftBackup(formCode, draftSnapshot, draftJourneyKey);
  }, [
    draftLoaded,
    draftStatus,
    formCode,
    formData,
    currentStep,
    currentQuestionIndex,
    view,
    progressiveSubQuestionIndices,
    lastSavedAt,
  ]);

  // ============ DEBOUNCED AUTOSAVE EFFECT ============
  // Separated from saveDraft callback to avoid re-creating effect on data changes
  const lastSaveTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!draftLoaded || !user || !isSessionValid || draftStatus === "completed") {
      return;
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(async () => {
      if (!user || !isSessionValid) return;

      // THROTTLE: enforce minimum 5s gap between API calls
      const now = Date.now();
      if (now - lastSaveTimeRef.current < 5000) {
        return;
      }
      lastSaveTimeRef.current = now;

      setSaveError(null);
      setIsAutoSaving(true);

      try {
        const { controller, timeoutId } = createAbortController(10000); // 10s timeout

        const res = await fetch(`/api/visa-forms/${formCode}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payload: formData,
            current_step: currentStep,
            current_question_index: currentQuestionIndex,
            view_mode: view,
            progressive_sub_question_indices: progressiveSubQuestionIndices,
            journey_key: "global",
            config_version: "v1",
            completed: false,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Save failed (${res.status})`);
        }

        const data = (await res.json()) as FormProgressResponse;

        setLastSavedAt(data.draft?.last_saved_at ?? new Date().toISOString());

        if (data.draft) {
          writeDraftBackup(formCode, data.draft, draftJourneyKey);
        }

        setSaveError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to save progress";

        if (error instanceof Error && error.name === "AbortError") {
          setSaveError(null);
          console.warn("Autosave timeout; will retry on next change");
        } else {
          setSaveError(message);
          console.error("Autosave failed:", error);
          showToast(`Auto-save failed: ${message}`, "error");
        }
      } finally {
        setIsAutoSaving(false);
      }
    }, 700);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [
    draftLoaded,
    user,
    formCode,
    isSessionValid,
    showToast,
    formData,
    currentStep,
    currentQuestionIndex,
    view,
    progressiveSubQuestionIndices,
    draftStatus,
  ]);

  const finalizeDraft = useCallback(async () => {
    if (!user) return;

    setDraftStatus("completed");

    try {
      const { controller, timeoutId } = createAbortController(15000); // 15s timeout for finalize

      const res = await fetch(`/api/visa-forms/${formCode}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: formData,
          current_step: currentStep,
          current_question_index: currentQuestionIndex,
          view_mode: "review",
          progressive_sub_question_indices: progressiveSubQuestionIndices,
          journey_key: "global",
          config_version: "v1",
          completed: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Failed to mark form as complete: ${res.status}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.warn("Form completion timeout - may retry");
      } else {
        console.error("Draft finalization failed:", error);
        showToast("Form completion status may not have been saved", "error");
      }
    } finally {
      clearDraftBackup(formCode, draftJourneyKey);

      // Save completed form data back to central profile (auto-fill for other tools)
      if (userProfile) {
        try {
          const profileDelta = mapFormToProfile(
            formData,
            userProfile,
            getFormFieldOverrides(formCode)
          );
          if (Object.keys(profileDelta).length > 0) {
            updateProfile(profileDelta, { silent: true });
          }
        } catch (e) {
          console.warn("[MultiStepForm] Profile save-back failed:", e);
        }
      }
    }
  }, [
    user,
    formCode,
    showToast,
    formData,
    currentStep,
    currentQuestionIndex,
    progressiveSubQuestionIndices,
    userProfile,
    updateProfile,
  ]);

  const handleNext = () => {
    if (isNavigating) return; // ← Rate limiting
    setNavigationDirection("next");

    // If user is locked out, check if warning needs to be displayed after every 10 questions
    if (isFreePreview) {
      let nextField = null;
      if (currentQuestionIndex < visibleFields.length - 1) {
        nextField = visibleFields[currentQuestionIndex + 1];
      } else if (currentStep < totalSteps) {
        const nextSection = sections[currentStep];
        if (nextSection) {
          const nextVisible = nextSection.fields.filter(
            (f) => !f.condition || f.condition(formData)
          );
          nextField = nextVisible[0];
        }
      }

      const isNextFieldEmpty =
        !nextField || !formData[nextField.key] || formData[nextField.key].trim() === "";

      if (filledFieldsCount >= 15 && isNextFieldEmpty) {
        showToast(
          "Free Preview: You've reached the 15-question limit. Redirecting to review page...",
          "info",
          6000
        );
        setView("review");
        return;
      }
    }

    const currentField = visibleFields[currentQuestionIndex];
    if (currentField) {
      const currentSubCount = progressiveSubQuestionIndices[currentField.key] ?? -1;
      const applicableSubQuestions = (currentField.subQuestions || []).filter(
        (subQ) => !subQ.condition || subQ.condition(formData)
      );

      // Handle sub-questions (including conditional ones)
      if (applicableSubQuestions.length > 0 && currentSubCount < applicableSubQuestions.length - 1) {
        setProgressiveSubQuestionIndices((prev) => ({
          ...prev,
          [currentField.key]: (currentSubCount ?? -1) + 1,
        }));
        return;
      }
    }

    if (currentQuestionIndex < visibleFields.length - 1) {
      // Move to next field
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);

      // Initialize sub-question index for the new field if it has subQuestions
      const nextField = visibleFields[nextIndex];
      if (nextField?.subQuestions && nextField.subQuestions.length > 0) {
        const hasNonConditionalSubQ = nextField.subQuestions.some(
          (subQ) => !subQ.condition || subQ.condition(formData)
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

    // Save current step data back to central profile (real-time sync for other tools)
    if (userProfile) {
      try {
        const profileDelta = mapFormToProfile(
          formData,
          userProfile,
          getFormFieldOverrides(formCode)
        );
        if (Object.keys(profileDelta).length > 0) {
          updateProfile(profileDelta, { silent: true });
        }
      } catch (e) {
        console.warn("[MultiStepForm] Profile save-back failed:", e);
      }
    }

    // Debounce navigation
    setIsNavigating(true);
    setTimeout(() => setIsNavigating(false), 100);
  };

  const handlePrevious = () => {
    setNavigationDirection("prev");
    const currentField = visibleFields[currentQuestionIndex];
    if (currentField) {
      const currentSubCount = progressiveSubQuestionIndices[currentField.key] ?? -1;
      if (currentSubCount > -1) {
        // Hide last shown sub-question
        setProgressiveSubQuestionIndices((prev) => ({
          ...prev,
          [currentField.key]: Math.max(-1, currentSubCount - 1),
        }));
        return;
      }
    }

    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      const prevField = visibleFields[prevIndex];
      if (prevField?.subQuestions && prevField.subQuestions.length > 0) {
        const applicablePrev = prevField.subQuestions.filter(
          (subQ) => !subQ.condition || subQ.condition(formData)
        );
        setProgressiveSubQuestionIndices((prev) => ({
          ...prev,
          [prevField.key]: Math.max(0, applicablePrev.length - 1),
        }));
      }
      setCurrentQuestionIndex(prevIndex);
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

      const targetIdx = Math.max(0, prevVisible.length - 1);
      const prevField = prevVisible[targetIdx];
      if (prevField?.subQuestions && prevField.subQuestions.length > 0) {
        const applicablePrev = prevField.subQuestions.filter(
          (subQ) => !subQ.condition || subQ.condition(formData)
        );
        setProgressiveSubQuestionIndices((prev) => ({
          ...prev,
          [prevField.key]: Math.max(0, applicablePrev.length - 1),
        }));
      }

      setCurrentQuestionIndex(targetIdx);
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
      if (isFreePreview && filledFieldsCount >= 15) {
        const targetSection = sections[stepIdx];
        const targetField = targetSection?.fields.filter(
          (f) => !f.condition || f.condition(formData)
        )[questionIdx];

        const isTargetEmpty =
          !targetField || !formData[targetField.key] || formData[targetField.key].trim() === "";

        if (isTargetEmpty) {
          showToast(
            "Free Preview: You've reached the 15-question limit. Please unlock the tool or upgrade to access new questions.",
            "info",
            5000
          );
          setView("review");
          return;
        }
      }
      setCurrentStep(stepIdx + 1);
      setCurrentQuestionIndex(questionIdx);
      setIsDrawerOpen(false);
    },
    [isFreePreview, filledFieldsCount, sections, formData]
  );

  const handleGoToStep = useCallback(
    (step: number) => {
      if (isFreePreview && filledFieldsCount >= 15) {
        const targetSection = sections[step - 1];
        const hasAnyAnswered = targetSection?.fields.some(
          (f) => formData[f.key] && formData[f.key].trim() !== ""
        );

        if (!hasAnyAnswered) {
          showToast(
            "Free Preview: You've reached the 15-question limit. Please unlock the tool or upgrade to access new sections.",
            "info",
            5000
          );
          setView("review");
          return;
        }
      }
      setCurrentStep(step);
      setView("form");
    },
    [isFreePreview, filledFieldsCount, sections, formData]
  );

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
    [config]
  );

  const buildPdfPayload = useCallback((): Record<string, string | undefined> => {
    if (!config) return {};

    const payload: Record<string, string | undefined> = {};

    const processField = (field: ConfigField) => {
      if (field.condition && !field.condition(formData)) {
        return;
      }

      const value = formData[field.key];
      if (value || (field.type === "checkbox" && field.options)) {
        if (field.type === "radio" && field.options) {
          const selected = field.options.find(
            (opt: { value: string; pdfKey?: string }) => opt.value === value
          );
          if (selected && selected.pdfKey) {
            payload[selected.pdfKey] = "Yes";
            field.options
              .filter((opt: { value: string; pdfKey?: string }) => opt.value !== value)
              .forEach((opt: { value: string; pdfKey?: string }) => {
                if (opt.pdfKey) {
                  payload[opt.pdfKey] = "Off";
                }
              });
          }
        } else if (field.type === "checkbox") {
          if (field.options) {
            field.options.forEach((opt: { value: string; pdfKey?: string }) => {
              const name = opt.pdfKey || opt.value;
              const optVal = formData[name];
              const isChecked = optVal === "Yes" || String(optVal) === "true" || optVal === "on";
              if (opt.pdfKey) {
                payload[opt.pdfKey] = isChecked ? "Yes" : "Off";
              }
            });
          } else {
            const isChecked = value === "Yes" || String(value) === "true" || value === "on";
            const pdfKey = field.pdfKey as string | undefined;
            if (pdfKey) {
              payload[pdfKey] = isChecked ? "Yes" : "Off";
            }
          }
        } else {
          const pdfKey = field.pdfKey as string | undefined;
          if (pdfKey) {
            payload[pdfKey] = value;
          }
        }
      }

      if (field.subQuestions) {
        field.subQuestions.forEach((subQ) => {
          processField(subQ as unknown as ConfigField);
        });
      }
    };

    config.formFields.forEach((field: ConfigField) => {
      processField(field);
    });

    // Add dynamic overflow handling for additional entries (e.g. addresses, spouses)
    const additionalBlocks: Array<{
      page_number: string;
      part_number: string;
      item_number: string;
      info: string;
    }> = [];

    if (config.overflowFields) {
      config.overflowFields.forEach((overConfig) => {
        const count = Number(formData[overConfig.countKey]) || 0;
        const maxIdx = overConfig.maxIndex ?? (count + 1);
        for (let i = overConfig.startIndex; i <= count + 1; i++) {
          if (i > maxIdx) break;

          const keyPrefix = `${overConfig.prefix}_${i}_`;
          const isAnyFieldFilled = overConfig.fields.some((f) => {
            const val = formData[`${keyPrefix}${f.suffix}`];
            return val && val.trim() !== "";
          });

          if (isAnyFieldFilled) {
            const infoString = overConfig.formatInfo(i, formData);
            additionalBlocks.push({
              page_number: overConfig.pageNumber,
              part_number: overConfig.partNumber,
              item_number: overConfig.itemNumber,
              info: infoString,
            });
          }
        }
      });
    }

    if (additionalBlocks.length > 0) {
      payload.additional_info_blocks = JSON.stringify(additionalBlocks);
    }

    return payload;
  }, [config, formData]);

  const handlePreviewPDF = async () => {
    const payload = buildPdfPayload();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
    const { controller, timeoutId } = createAbortController(60000); // 60s timeout for preview

    setIsPreviewing(true);
    try {
      const res = await fetch(`${apiUrl}/fill-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: formCode, data: payload, onlyFirstPage: isFreePreview }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`${await res.text()} (Endpoint: ${apiUrl})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      console.error("Preview error:", err);
      if (err instanceof Error && err.name === "AbortError") {
        showToast("Preview timed out. Server may be slow.", "error");
      } else {
        showToast(
          err instanceof Error ? err.message : "Preview failed. Please check console.",
          "error"
        );
      }
    } finally {
      setIsPreviewing(false);
      controller.abort();
    }
  };

  const handleDownloadPDF = async () => {
    const payload = buildPdfPayload();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
    const { controller, timeoutId } = createAbortController(60000); // 60s timeout for download

    setIsDownloading(true);
    try {
      const res = await fetch(`${apiUrl}/fill-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: formCode, data: payload, onlyFirstPage: isFreePreview }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`${await res.text()} (Endpoint: ${apiUrl})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${formCode.toUpperCase()}-filled.pdf`;
      a.click();
      await finalizeDraft();
      URL.revokeObjectURL(url);
      showToast("PDF downloaded successfully!", "success");
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      console.error("Download error:", err);
      if (err instanceof Error && err.name === "AbortError") {
        showToast("Download timed out. Server may be slow.", "error");
      } else {
        showToast(
          err instanceof Error ? err.message : "Download failed. Please check console.",
          "error"
        );
      }
    } finally {
      setIsDownloading(false);
      controller.abort();
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
      showToast(`This form (${formCode}) cannot be saved to the vault automatically yet.`, "error");
      return;
    }
    const payload = buildPdfPayload();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
    const { controller, timeoutId } = createAbortController(90000); // 90s timeout for full vault save

    setIsSavingToVault(true);
    try {
      const res = await fetch(`${apiUrl}/fill-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: formCode, data: payload }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`${await res.text()} (Endpoint: ${apiUrl})`);
      const blob = await res.blob();

      const file = new File([blob], `${formCode.toUpperCase()}-auto-filled.pdf`, {
        type: "application/pdf",
      });

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
      } else if (role === "HOUSEHOLD_MEMBER" && vaultConfig.jointSponsorName) {
        personName = vaultConfig.jointSponsorName;
      }
      formDataUpload.append("personName", personName);
      const isCompleted = currentStep === totalSteps;
      formDataUpload.append(
        "notes",
        `Automatically generated via ${config?.formTitle || formCode} tool (${isCompleted ? "Completed" : `Progress: ${currentStep}/${totalSteps}`}).`
      );

      const uploadRes = await fetch("/api/documents/upload", {
        method: "POST",
        body: formDataUpload,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || "Upload failed");
      }

      showToast("Successfully saved to Document Vault!", "success");
      await finalizeDraft();
      if (reloadDocuments) await reloadDocuments();
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      console.error("Save to vault error:", err);
      if (err instanceof Error && err.name === "AbortError") {
        showToast(msg(E.DASH_VAULT_SAVE_FAILED), "error");
      } else {
        showToast(err instanceof Error ? err.message : msg(E.DASH_VAULT_SAVE_FAILED), "error");
      }
    } finally {
      setIsSavingToVault(false);
      controller.abort();
    }
  }, [
    user,
    vaultConfig,
    formCode,
    buildPdfPayload,
    config?.formTitle,
    reloadDocuments,
    showToast,
    finalizeDraft,
  ]);

  /* Sidebar (desktop) */
  // Memoize section status calculations to avoid heavy computation during renders
  const sectionStats = useMemo(() => {
    return sections.map((section) => {
      const visibleSectionFields = section.fields.filter(
        (field) => !field.condition || field.condition(formData)
      );

      const answeredCount = visibleSectionFields.filter((field) => {
        if (field.type === "checkbox" && field.options) {
          return field.options.some((opt) => formData[opt.pdfKey || opt.value] === "Yes");
        }
        const value = formData[field.key];
        return value && value.trim() !== "";
      }).length;

      const totalCount = visibleSectionFields.length;
      const isCompleted = totalCount > 0 && answeredCount === totalCount;

      return {
        visibleSectionFields,
        answeredCount,
        totalCount,
        isCompleted,
      };
    });
  }, [sections, formData]);

  /* Sidebar (desktop) */
  const renderSectionList = useCallback(
    ({
      onPick,
      showLabels = !isSidebarCollapsed,
    }: {
      onPick?: () => void;
      showLabels?: boolean;
    }) => (
      <div className="space-y-1.5">
        {sections.map((section, idx) => {
          const stepNum = idx + 1;
          const label = section.title.replace(/^\d+\.\s*/, "");
          const isActive = currentStep === stepNum;

          const stats = sectionStats[idx] || {
            visibleSectionFields: [],
            answeredCount: 0,
            totalCount: 0,
            isCompleted: false,
          };
          const { visibleSectionFields, answeredCount, totalCount, isCompleted } = stats;

          const isSkipped =
            stepNum < currentStep && answeredCount > 0 && answeredCount < totalCount;

          const isUnansweredSkipped = stepNum < currentStep && answeredCount === 0;

          const isDone = isCompleted;
          const isExpanded = expandedSections.has(section.title);

          return (
            <motion.div
              key={section.title}
              whileHover={{ x: isSidebarCollapsed ? 0 : 2 }}
              className="group w-full text-left rounded-xl transition-colors relative cursor-pointer"
              style={{
                backgroundColor: isActive && !isSidebarCollapsed ? "#e8f6f6" : "transparent",
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
                      isActive || isDone ? "0 4px 10px -2px rgba(13, 115, 119, 0.4)" : "none",
                  }}
                >
                  {isDone ? <Check className="w-4 h-4" strokeWidth={3} /> : stepNum}
                </div>

                {showLabels && (
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{
                        color: isActive ? "#0a5a5d" : "#374151",
                      }}
                    >
                      {label}
                    </p>
                    <p className="text-[11px] truncate">
                      {isCompleted ? (
                        <span className="text-emerald-600 font-medium">✓ Completed</span>
                      ) : isSkipped || isUnansweredSkipped ? (
                        <span className="text-amber-600 font-medium">Skipped</span>
                      ) : isActive ? (
                        <span className="text-sky-600 font-medium">In Progress</span>
                      ) : (
                        ""
                      )}
                    </p>
                  </div>
                )}

                {showLabels && (
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
                        if (field.condition && !field.condition(formData)) return null;

                        // Remove numbering from label
                        const cleanLabel = field.label.replace(/^\d+[a-z]?\.\s*/, "");
                        const fieldAnswered = field.type === "checkbox" && field.options
                          ? field.options.some((opt) => formData[opt.pdfKey || opt.value] === "Yes")
                          : formData[field.key] && formData[field.key] !== "";
                        const isActiveQuestion =
                          isActive && visibleFields[currentQuestionIndex]?.key === field.key;

                        return (
                          <motion.button
                            key={field.key}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ x: 2 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const actualIndex = section.fields.findIndex(
                                (f) => f.key === field.key
                              );
                              handleJumpToQuestion(idx, actualIndex);
                            }}
                            className={`w-full text-left text-xs p-2 rounded transition-colors flex items-center gap-2 group ${
                              isActiveQuestion
                                ? "bg-[#0d7377]/10 font-semibold pl-1.5"
                                : "hover:bg-[#e8f6f6]"
                            }`}
                            style={{
                              color: isActiveQuestion
                                ? "#0d7377"
                                : fieldAnswered
                                  ? "#0a5a5d"
                                  : "#6b7280",
                            }}
                          >
                            {fieldAnswered && (
                              <Check className="w-3 h-3" style={{ color: "#0d7377" }} />
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
      sectionStats,
      visibleFields,
      currentQuestionIndex,
    ]
  );

  // Show loading state until ready
  if (!isReady || (user && !draftLoaded)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader size="lg" />
        <p className="text-[#0d7377] text-sm font-medium mt-2">
          {user && !draftLoaded
            ? `Restoring your draft for ${formCode.toUpperCase()}...`
            : `Loading ${formCode.toUpperCase()} Form...`}
        </p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7fbfb]">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center max-w-md shadow-sm">
          <h2 className="text-2xl font-bold text-red-800 mb-3">Form Not Found</h2>
          <p className="text-red-700">
            Sorry, the form &quot;<strong>{formCode.toUpperCase()}</strong>
            &quot; is not available yet.
          </p>
          <p className="text-sm text-gray-600 mt-4">Available: I-130, I-130A, I-864, DS-260</p>
        </div>
      </div>
    );
  }

  if (totalSteps === 0) {
    return <div className="text-center py-20 text-gray-500">No questions in this form.</div>;
  }

  return (
    <div className="w-full min-h-screen flex flex-col" style={{ backgroundColor: "#f7fbfb" }}>
      {/* Sticky Header */}
      <Header
        formTitle={config.formTitle}
        formSubtitle={config.formSubtitle}
        onOpenMenu={() => setIsDrawerOpen(true)}
        showMenu={view === "form"}
        isAutoSaving={isAutoSaving}
        lastSavedAt={lastSavedAt}
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
                {renderSectionList({ onPick: () => setIsDrawerOpen(false), showLabels: true })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Layout - Centered Content */}
      <div className="flex gap-6 px-4 md:px-8 py-0 guide-grid-bg justify-center items-stretch flex-1 min-h-0">
        {/* Desktop Sidebar (stays within header/footer zone) */}
        {view === "form" && !(showSectionIntro && introVisible) && (
          <motion.div
            initial={false}
            animate={{
              width: isSidebarCollapsed ? 24 : 325,
            }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            className="hidden lg:block shrink-0 -ml-4 md:-ml-8"
          >
            <aside
              className="sticky top-16 mt-12 h-[calc(100vh-280px)] w-full overflow-hidden"
              aria-hidden={false}
            >
              <div
                className={[
                  "relative h-full overflow-hidden custom-scrollbar flex flex-col",
                  isSidebarCollapsed ? "" : "rounded-r-2xl border border-l-0 p-4",
                ].join(" ")}
                style={{
                  backgroundColor: isSidebarCollapsed ? "transparent" : "rgba(255, 255, 255, 0.97)",
                  borderColor: isSidebarCollapsed ? "transparent" : "#e8f6f6",
                  backdropFilter: isSidebarCollapsed ? "none" : "blur(10px)",
                  boxShadow: isSidebarCollapsed
                    ? "none"
                    : "4px 0 24px -8px rgba(13, 115, 119, 0.15)",
                }}
              >
                {!isSidebarCollapsed && (
                  <>
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-4 px-1">
                      <h3
                        className="text-[11px] font-bold uppercase tracking-[0.14em]"
                        style={{ color: "#0a5a5d" }}
                      >
                        Sections
                      </h3>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                      {renderSectionList({})}
                    </div>
                  </>
                )}

                <motion.button
                  onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                  className="absolute top-1/2 -translate-y-1/2 -right-2 z-50"
                  style={{
                    width: 28,
                    height: 64,
                    background: "#0d7377",
                    color: "#fff",
                    borderTopRightRadius: 12,
                    borderBottomRightRadius: 12,
                    boxShadow: "2px 2px 10px rgba(0,0,0,0.2)",
                  }}
                >
                  {isSidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
                </motion.button>
              </div>
            </aside>
          </motion.div>
        )}

        {/* Right Content Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 flex items-start justify-center py-6 w-full">
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
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="flex items-center justify-center min-h-[60vh] px-4"
                      >
                        <div className="w-full max-w-2xl">
                          <div className="bg-white border-2 border-[#14a0a6] rounded-2xl shadow-xl p-8 md:p-10">
                            {/* Top Label */}
                            <p className="text-sm uppercase tracking-[0.2em] text-[#14a0a6] font-semibold text-center rounded-full bg-white/10 border border-white/20">
                              Moving on to {currentSection?.title || "Next Section"}
                            </p>

                            {/* Greeting */}
                            {/* <h3 className="mt-4 text-lg font-semibold text-gray-800">
            {getSectionIntroMessage(currentSection.title).greeting}
          </h3> */}

                            {/* Message */}
                            <p className="mt-2 text-sm text-gray-600 leading-relaxed text-center font-semibold">
                              {getSectionIntroMessage(currentSection.title).message}
                            </p>

                            {/* Expandable Tooltip */}
                            <div className="mt-6">
                              <ExpandableTooltip
                                icon={"i"}
                                defaultOpen={false}
                                title="Before you continue"
                                message={`Provide accurate details to ensure faster processing. This information will be used in official forms, so make sure everything is correct. Don’t worry—you’ll still be able to review and edit everything later.`}
                              />
                            </div>

                            {/* Progress */}
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
                                  className="h-full bg-linear-to-r from-[#0d7377] to-[#32e0c4]"
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
                              className="mt-8 w-full py-3 rounded-xl font-semibold text-white shadow-md"
                              style={{
                                background: "linear-gradient(135deg, #0d7377 0%, #14a0a6 100%)",
                              }}
                            >
                              Continue →
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {(!showSectionIntro || !introVisible) && (
                      <motion.div
                        key="form-card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
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
                          progressiveSubQuestionIndices={progressiveSubQuestionIndices}
                        />

                        {/* Navigation Buttons */}
                        <div className="flex flex-row justify-between items-center gap-3 mt-10 pt-6 border-t border-[#e8f6f6]">
                          <button
                            onClick={handlePrevious}
                            disabled={currentStep === 1 && currentQuestionIndex === 0}
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
                              const isLastField = currentQuestionIndex === visibleFields.length - 1;
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
                    isFreePreview={isFreePreview}
                    onUpgradeClick={() => setShowUpgradeModal(true)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {saveError && (
        <div className="px-4 md:px-8 pt-1 pb-4">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-red-50 border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-xs text-red-600">{saveError}</p>
          </div>
        </div>
      )}

      {/* Progress Footer */}
      {view === "form" && (
        <div className="shrink-0">
          <ProgressFooter
            current={currentStep}
            total={totalSteps}
            progress={progress}
            sections={sections}
          />
        </div>
      )}

      {/* Upgrade Modal Hook */}
      {showUpgradeModal && (
        <UpgradeModal feature="smart_form_filler" onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}

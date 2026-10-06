// app/components/forms/reusable/multi-step-form.tsx
"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getFormConfig, extractInheritableCandidateData } from "@/lib/formConfig";
import { getCandidateJourneyKey, getBaseVisaCategory } from "@/lib/candidate/candidateSyncService";
import { Header } from "./Header";
import { ProgressFooter } from "./ProgressFooter";
import { FormStep } from "./FormStep";
import { ReviewPage } from "./ReviewPage";
import type { Field as ConfigField } from "@/lib/formConfig/types";
import { ChevronLeft, ChevronRight, Check, FileText, Lock } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { useCandidate } from "@/app/context/CandidateContext";
import { autoFillForm, mapFormToProfile } from "@/lib/autoFill/mapper";
import { getFormFieldOverrides, firstProfileValue } from "@/lib/autoFill/formOverrides";
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
import { MobileBottomSheet } from "@/app/components/shared/table/MobileBottomSheet";
import { useResolveToolMode } from "@/lib/hooks/useResolveToolMode";
import type { ToolMode, JourneyToolContext, ToolModeProps } from "@/types/tool-mode";

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
    if (raw) {
      const parsed = JSON.parse(raw) as { draft?: FormProgressDraft };
      if (parsed?.draft) return parsed.draft;
    }
    // Fallback to legacy global backup only for journey candidate keys — never for
    // "global" itself (avoids double-read) or "standalone" (must stay isolated).
    if (journeyKey !== "global" && journeyKey !== "standalone") {
      const fallbackRaw = window.localStorage.getItem(buildDraftStorageKey(formCode, "global"));
      if (fallbackRaw) {
        const parsed = JSON.parse(fallbackRaw) as { draft?: FormProgressDraft };
        return parsed?.draft ?? null;
      }
    }
    return null;
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

/**
 * True when a card counts as answered: its own key has a value, its checkbox
 * options hold a "Yes", or any (nested) sub-question is filled — hidden group
 * cards like full_name_group carry their answers in sub-questions only.
 */
const fieldHasAnswer = (
  f: ConfigField | null | undefined,
  data: Record<string, string>
): boolean => {
  if (!f) return false;
  if ((data[f.key] ?? "").trim() !== "") return true;
  if (f.type === "checkbox" && f.options?.some((opt) => data[opt.pdfKey || opt.value] === "Yes")) {
    return true;
  }
  return (f.subQuestions ?? []).some((sub) => fieldHasAnswer(sub as ConfigField, data));
};

export interface MultiStepFormProps extends ToolModeProps {
  formCode: string;
  onClose?: () => void;
  isEmbedded?: boolean;
}

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

export function MultiStepForm({
  formCode,
  mode: propMode,
  journeyContext: propJourneyContext,
  journeyTier: propJourneyTier,
  onClose,
  isEmbedded = false,
}: MultiStepFormProps) {
  const { isJourney, journeyContext } = useResolveToolMode({
    mode: propMode,
    journeyContext: propJourneyContext,
    journeyTier: propJourneyTier,
  });

  const plan = usePlan();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const config = useMemo(() => getFormConfig(formCode), [formCode]);

  const { isFreePreview, hasReachedLimit, limit, atOrPastAnchor, pastAnchor, stepPastAnchor } =
    useFreePreview({
      canUseSmartFormFiller: isJourney ? true : plan.canUse("smart_form_filler"),
      formFields: config?.formFields || [],
      formData,
      configuredLimit: config?.freePreviewLimit,
      untilKey: config?.freePreviewUntilKey,
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
  const candidateCtx = useCandidate();
  // Isolate candidate details strictly to Journey mode
  const activeCandidate = isJourney ? candidateCtx.activeCandidate : null;
  const candidates = isJourney ? candidateCtx.candidates : [];
  const setActiveCandidateId = candidateCtx.setActiveCandidateId;
  const isMultiCandidate = isJourney ? candidateCtx.isMultiCandidate : false;

  const draftJourneyKey = isJourney
    ? (journeyContext?.candidateId
        ? getCandidateJourneyKey(journeyContext.journeyCategory, journeyContext.candidateId)
        : (candidateCtx.activeJourneyKey || "candidate-1"))
    : "standalone";
  const { user, isLoading: isAuthLoading } = useAuth();
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
  const [inheritedInfo, setInheritedInfo] = useState<{
    isInherited: boolean;
    count: number;
    sourceName: string;
  } | null>(null);
  // Mirror of draftStatus for reads inside dependency-free callbacks (handleChange).
  const draftStatusRef = useRef(draftStatus);
  useEffect(() => {
    draftStatusRef.current = draftStatus;
  }, [draftStatus]);
  const { showToast } = useToast();
  const {
    config: vaultConfig,
    reloadDocuments,
    initialize: initializeVault,
  } = useDocumentVaultStore();
  const prevStepRef = useRef(currentStep);
  const saveTimerRef = useRef<number | null>(null);
  const jumpTargetQuestionIndexRef = useRef<number | null>(null);
  // Records the `${formCode}:${userId}` we've already hydrated for. The
  // initialization effect below reads/writes this so it hydrates form state
  // EXACTLY ONCE per (form, user). Auth contexts re-emit a fresh `user` object
  // on token refresh / tab refocus / profile save-back; without this guard
  // every such re-emit would re-run the initializer and overwrite live edits
  // with a staler server draft (or blank the form on a fetch timeout).
  const hydratedKeyRef = useRef<string | null>(null);
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
  // Hydrate form state ONCE per (formCode, user). We wait for auth to settle
  // (isAuthLoading === false) so we hydrate with the correct identity, then
  // mark the key as hydrated so later `user` re-emits can never re-run this and
  // clobber the user's in-progress edits.
  useEffect(() => {
    if (!isClient || !config || isAuthLoading) return;

    const userId = user?.id ?? null;
    const hydrationKey = `${formCode}:${userId ?? "anon"}:${draftJourneyKey}`;
    if (hydratedKeyRef.current === hydrationKey) return;
    // Claim the key synchronously (before any await) so a concurrent re-render
    // or React StrictMode double-invoke can't kick off a second hydration.
    hydratedKeyRef.current = hydrationKey;

    let isMounted = true;
    setDraftLoaded(false);
    setProfileLoaded(false);

    const initializeForm = async () => {
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

        let inheritedPayload: Record<string, string> | null = null;

        // If no existing draft for this candidate, attempt to inherit data from any sibling candidate (JOURNEY mode only).
        // Same-journey siblings (same visa category base) get a full clone — all fields are copied
        // and the user just corrects the candidate-distinct ones (DOB, passport, name etc.).
        // Cross-journey siblings only share petitioner/household fields.
        if (isJourney && !draftData) {
          const activeBase = getBaseVisaCategory(activeCandidate?.visaCategory || "");
          const siblingCandidates = (candidates || []).filter(
            (c) => c.id !== activeCandidate?.id
          );

          // If no structured candidates found or standard candidate-1 fallback
          const candidateKeysToCheck: { key: string; name: string; sameJourney: boolean }[] = [];
          if (siblingCandidates.length > 0) {
            siblingCandidates.forEach((s) => {
              const sKey = getCandidateJourneyKey(s.visaCategory, s.id);
              const sName = s.fullName || s.label || s.name?.first || "Another Candidate";
              const sameJourney = getBaseVisaCategory(s.visaCategory) === activeBase;
              candidateKeysToCheck.push({ key: sKey, name: sName, sameJourney });
            });
          } else {
            // Fallbacks — can't determine visa category, treat as cross-journey (partial inherit)
            if (draftJourneyKey !== "candidate-1" && draftJourneyKey !== "global") {
              candidateKeysToCheck.push({ key: "candidate-1", name: "Candidate 1", sameJourney: false });
              candidateKeysToCheck.push({ key: "global", name: "Primary Candidate", sameJourney: false });
            } else {
              candidateKeysToCheck.push({ key: "ir5_candidate-2", name: "Candidate 2", sameJourney: false });
            }
          }

          for (const candInfo of candidateKeysToCheck) {
            let siblingDraft: FormProgressDraft | null = null;
            if (user) {
              try {
                const sRes = await fetch(
                  `/api/visa-forms/${formCode}/progress?journey_key=${candInfo.key}`,
                  { signal: AbortSignal.timeout(3000) }
                );
                if (sRes.ok) {
                  const sData = (await sRes.json()) as FormProgressResponse;
                  siblingDraft = sData.draft;
                }
              } catch {
                // Ignore network issues for fallback inheritance
              }
            }
            if (!siblingDraft) {
              siblingDraft = readDraftBackup(formCode, candInfo.key);
            }

            if (siblingDraft?.payload && Object.keys(siblingDraft.payload).length > 0) {
              const { inheritedData, inheritedKeys } = extractInheritableCandidateData(
                formCode,
                config.formFields,
                siblingDraft.payload,
                activeCandidate
                  ? {
                      fullName: activeCandidate.fullName,
                      name: activeCandidate.name,
                      dateOfBirth: activeCandidate.dateOfBirth,
                      placeOfBirth: activeCandidate.placeOfBirth,
                      passportNumber: activeCandidate.passportNumber,
                      cnic: activeCandidate.cnic,
                    }
                  : undefined,
                { sameJourney: candInfo.sameJourney }
              );
              if (inheritedKeys.length > 0) {
                inheritedPayload = inheritedData;
                if (isMounted) {
                  setInheritedInfo({
                    isInherited: true,
                    count: inheritedKeys.length,
                    sourceName: candInfo.name,
                  });
                }
                break; // Inherited from first valid sibling
              }
            }
          }
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

          // Journey-mode I-130: auto-seed the relationship from the visa category.
          // Also skip straight to question index 1 (the next question after relationship)
          // when on the first section — the relationship is locked by journey context
          // and the user never needs to choose it.
          let journeySkippedRelationship = false;
          if (isJourney && formCode === "i130") {
            const cat = (journeyContext?.journeyCategory || activeCandidate?.visaCategory || "").toUpperCase();
            let defaultRel: string | null = null;
            if (cat.includes("IR-5") || cat.includes("IR5")) defaultRel = "Parent";
            else if (
              cat.includes("IR-1") ||
              cat.includes("CR-1") ||
              cat.includes("IR1") ||
              cat.includes("CR1")
            )
              defaultRel = "Spouse";
            else if (cat.includes("IR-2") || cat.includes("IR2")) defaultRel = "Child";
            else if (cat.includes("F-4") || cat.includes("F4")) defaultRel = "BrotherSister";

            if (defaultRel) {
              validatedPayload.relationship = defaultRel;
              journeySkippedRelationship = true;
            }
          }

          if (isMounted) {
            setFormData(validatedPayload);
            setCurrentStep(validStep);
            // If we auto-seeded relationship and we're still on step 1 question 0,
            // advance past the locked relationship card.
            const resolvedQuestionIndex =
              journeySkippedRelationship && validStep === 1 && validQuestionIndex === 0
                ? 1
                : validQuestionIndex;
            setCurrentQuestionIndex(resolvedQuestionIndex);
            setView((draftData.view_mode || "form") as ViewType);
            setDraftStatus(draftData.completed ? "completed" : "draft");
            setProgressiveSubQuestionIndices(draftData.progressive_sub_question_indices || {});
            setLastSavedAt(draftData.last_saved_at || null);
          }
        } else {
          // Fresh form initialization (or pre-filled with Candidate 1 shared data)
          const initialData = {
            ...config.getInitialFormData(),
            ...(inheritedPayload || {}),
          };
          const initialSubs: Record<string, number> = {};

          // Journey-mode I-130: auto-seed the relationship from the visa category and
          // skip straight past the locked relationship card (start at question index 1).
          let freshJourneySkippedRelationship = false;
          if (isJourney && formCode === "i130") {
            const cat = (journeyContext?.journeyCategory || activeCandidate?.visaCategory || "").toUpperCase();
            let defaultRel: string | null = null;
            if (cat.includes("IR-5") || cat.includes("IR5")) defaultRel = "Parent";
            else if (
              cat.includes("IR-1") ||
              cat.includes("CR-1") ||
              cat.includes("IR1") ||
              cat.includes("CR1")
            )
              defaultRel = "Spouse";
            else if (cat.includes("IR-2") || cat.includes("IR2")) defaultRel = "Child";
            else if (cat.includes("F-4") || cat.includes("F4")) defaultRel = "BrotherSister";

            if (defaultRel) {
              initialData.relationship = defaultRel;
              freshJourneySkippedRelationship = true;
              // No need to pre-open relationship sub-questions progressively —
              // the user starts at the NEXT question (index 1) entirely.
            }
          }

          if (isMounted) {
            setFormData(initialData);
            setCurrentStep(1);
            // Skip the locked relationship card in journey mode.
            setCurrentQuestionIndex(freshJourneySkippedRelationship ? 1 : 0);
            setView("form");
            setDraftStatus("draft");
            setProgressiveSubQuestionIndices(initialSubs);
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
    // Depend on the stable user ID, not the `user` object — the object gets a
    // new reference on every auth re-emit, which used to re-run this whole
    // initializer and wipe the form. The ref guard above enforces once-per-key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, config, user?.id, formCode, isAuthLoading, draftJourneyKey]);

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
      const profileForOverride: Record<string, unknown> = {
        ...(userProfile as unknown as Record<string, unknown>),
      };

      if (activeCandidate) {
        const candBeneficiary: Record<string, unknown> = {
          ...((profileForOverride.beneficiary as Record<string, unknown>) || {}),
        };
        if (activeCandidate.fullName) {
          candBeneficiary.fullName = activeCandidate.fullName;
        }
        // Structured name is on the candidate's `name` (PersonName), not flat first/last fields.
        const candName = activeCandidate.name;
        if (candName?.first || candName?.middle || candName?.last) {
          candBeneficiary.name = {
            ...((candBeneficiary.name as Record<string, unknown>) || {}),
            ...(candName?.first ? { first: candName.first } : {}),
            ...(candName?.middle ? { middle: candName.middle } : {}),
            ...(candName?.last ? { last: candName.last } : {}),
          };
        }
        if (activeCandidate.dateOfBirth) candBeneficiary.dateOfBirth = activeCandidate.dateOfBirth;
        if (activeCandidate.placeOfBirth) candBeneficiary.placeOfBirth = activeCandidate.placeOfBirth;
        if (activeCandidate.passportNumber) candBeneficiary.passportNumber = activeCandidate.passportNumber;
        if (activeCandidate.cnic) candBeneficiary.cnic = activeCandidate.cnic;

        profileForOverride.beneficiary = candBeneficiary;
      }

      for (const [formKey, paths] of Object.entries(overrides)) {
        const val = firstProfileValue(profileForOverride, paths);
        if (val) merged[formKey] = val;
      }

      return merged;
    });
    setProfileLoaded(true);
  }, [userProfile, isContextProfileLoading, profileLoaded, draftLoaded, activeCandidate, formCode]);

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

    let targetIndex: number;
    if (jumpTargetQuestionIndexRef.current !== null) {
      targetIndex = jumpTargetQuestionIndexRef.current;
      jumpTargetQuestionIndexRef.current = null;
    } else {
      targetIndex = getLastAnsweredIndex(visibleFields, formData);
    }

    setCurrentQuestionIndex(targetIndex);

    // Initialize progressive sub-question index for the current field
    const currentField = visibleFields[targetIndex];
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

  // Automatically initialize/reset progressive sub-question index when formData changes
  useEffect(() => {
    const currentField = visibleFields[currentQuestionIndex];
    if (currentField?.subQuestions && currentField.subQuestions.length > 0) {
      const currentSubCount = progressiveSubQuestionIndices[currentField.key];
      const hasVisibleSubQ = currentField.subQuestions.some(
        (subQ) => !subQ.condition || subQ.condition(formData)
      );

      if (currentSubCount === undefined && hasVisibleSubQ) {
        setProgressiveSubQuestionIndices((prev) => ({
          ...prev,
          [currentField.key]: 0,
        }));
      } else if (currentSubCount !== undefined && !hasVisibleSubQ) {
        setProgressiveSubQuestionIndices((prev) => {
          const copy = { ...prev };
          delete copy[currentField.key];
          return copy;
        });
      }
    }
  }, [formData, visibleFields, currentQuestionIndex, progressiveSubQuestionIndices]);

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

      // The user is editing a form they'd already finalized (Download / Save to
      // Vault marked it "completed", which switches off autosave AND the local
      // backup). Re-open it as a draft so this edit — and every edit after —
      // starts persisting again. Guarded by the ref so it fires only on the
      // first post-completion edit, not on every keystroke.
      if (draftStatusRef.current === "completed") {
        setDraftStatus("draft");
      }

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
            journey_key: draftJourneyKey,
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
    draftJourneyKey,
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
          journey_key: draftJourneyKey,
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
    draftJourneyKey,
    userProfile,
    updateProfile,
  ]);

  const handleNext = () => {
    if (isNavigating) return; // ← Rate limiting
    setNavigationDirection("next");

    // If user is locked out, check if warning needs to be displayed after every 10 questions
    // if (isFreePreview) {
    //   let nextField = null;
    //   if (currentQuestionIndex < visibleFields.length - 1) {
    //     nextField = visibleFields[currentQuestionIndex + 1];
    //   } else if (currentStep < totalSteps) {
    //     const nextSection = sections[currentStep];
    //     if (nextSection) {
    //       const nextVisible = nextSection.fields.filter(
    //         (f) => !f.condition || f.condition(formData)
    //       );
    //       nextField = nextVisible[0];
    //     }
    //   }

    //   const isNextFieldEmpty =
    //     !nextField || !formData[nextField.key] || formData[nextField.key].trim() === "";

    //   if (filledFieldsCount >= 15 && isNextFieldEmpty) {
    //     showToast(
    //       "Free Preview: You've reached the 15-question limit. Redirecting to review page...",
    //       "info",
    //       { duration: 6000 }
    //     );
    //     setView("review");
    //     return;
    //   }
    // }

    const currentField = visibleFields[currentQuestionIndex];
    if (currentField) {
      const minSubCount = currentField.type === "hidden" ? 0 : -1;
      const currentSubCount = progressiveSubQuestionIndices[currentField.key] ?? minSubCount;
      const applicableSubQuestions = (currentField.subQuestions || []).filter(
        (subQ) => !subQ.condition || subQ.condition(formData)
      );

      // Handle sub-questions (including conditional ones)
      if (
        applicableSubQuestions.length > 0 &&
        currentSubCount < applicableSubQuestions.length - 1
      ) {
        setProgressiveSubQuestionIndices((prev) => ({
          ...prev,
          [currentField.key]: currentSubCount + 1,
        }));
        return;
      }
    }

    // Free-preview boundary — checked only once the current card's sub-questions
    // are done, and triggered by flow POSITION (at/past the anchor card) as well
    // as by full completion, so optional blanks (e.g. an empty middle name)
    // can't keep the preview open indefinitely.
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

      const isNextFieldEmpty = !fieldHasAnswer(nextField, formData);

      if ((hasReachedLimit || atOrPastAnchor(currentField?.key)) && isNextFieldEmpty) {
        showToast("Demo limit reached — redirecting you to the review page...", "info", {
          duration: 6000,
        });
        setView("review");
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
      const minSubCount = currentField.type === "hidden" ? 0 : -1;
      const currentSubCount = progressiveSubQuestionIndices[currentField.key] ?? minSubCount;
      if (currentSubCount > minSubCount) {
        // Hide last shown sub-question
        setProgressiveSubQuestionIndices((prev) => ({
          ...prev,
          [currentField.key]: Math.max(minSubCount, currentSubCount - 1),
        }));
        return;
      }
    }

    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;

      // Journey I-130: relationship is auto-seeded and skipped — never navigate back to it.
      const isLockedRelationshipCard =
        isJourney &&
        formCode === "i130" &&
        prevIndex === 0 &&
        currentStep === 1 &&
        visibleFields[0]?.key === "relationship" &&
        !!formData.relationship;

      if (isLockedRelationshipCard) {
        // Already at the first meaningful question — go back to section intro or
        // previous step instead of showing the locked relationship card.
        if (cameFromIntro) {
          setShowSectionIntro(true);
          setIntroVisible(true);
          setCameFromIntro(false);
        }
        return;
      }

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
      const targetSection = sections[stepIdx];
      const targetField = targetSection?.fields.filter(
        (f) => !f.condition || f.condition(formData)
      )[questionIdx];

      const isTargetEmpty = !fieldHasAnswer(targetField, formData);

      if (isTargetEmpty && (hasReachedLimit || pastAnchor(targetField?.key))) {
        showToast(
          "Demo limit reached. Upgrade to Premium or Executive to answer more questions.",
          "info",
          { duration: 5000 }
        );
        setView("review");
        return;
      }
      const targetStep = stepIdx + 1;
      if (currentStep === targetStep) {
        setCurrentQuestionIndex(questionIdx);
      } else {
        jumpTargetQuestionIndexRef.current = questionIdx;
        setCurrentStep(targetStep);
      }
      setView("form");
      setIsDrawerOpen(false);
    },
    [hasReachedLimit, pastAnchor, limit, sections, formData, currentStep, showToast]
  );

  const handleGoToStep = useCallback(
    (step: number) => {
      const targetSection = sections[step - 1];
      const hasAnyAnswered = targetSection?.fields.some(
        (f) => formData[f.key] && formData[f.key].trim() !== ""
      );

      if (!hasAnyAnswered && (hasReachedLimit || stepPastAnchor(step - 1))) {
        showToast(
          "Demo limit reached. Upgrade to Premium or Executive to access new sections.",
          "info",
          { duration: 5000 }
        );
        setView("review");
        return;
      }
      setCurrentStep(step);
      setView("form");
    },
    [hasReachedLimit, stepPastAnchor, limit, sections, formData]
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
        const maxIdx = overConfig.maxIndex ?? count + 1;
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

    // Open the tab synchronously inside the click gesture. Mobile browsers block
    // a window.open() that runs after an await (the gesture has expired by then),
    // which is why preview worked on desktop but was blocked on mobile. Note: we
    // deliberately do NOT pass "noopener" here, otherwise open() returns null and
    // we lose the handle we need to redirect once the PDF is ready.
    const previewWindow = window.open("", "_blank");

    setIsPreviewing(true);
    try {
      const res = await fetch(`${apiUrl}/fill-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: formCode, data: payload, onlyFirstPage: isFreePreview }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        if (previewWindow) previewWindow.close();
        throw new Error(`${await res.text()} (Endpoint: ${apiUrl})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (previewWindow) {
        // Tab opened successfully in the gesture: point it at the PDF.
        previewWindow.location.href = url;
      } else {
        // Popup was blocked even synchronously: fall back to same-tab open.
        window.location.href = url;
      }
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (previewWindow) previewWindow.close();
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
      if (draftJourneyKey && draftJourneyKey !== "global") {
        formDataUpload.append("journeyId", draftJourneyKey);
      }

      let personName = "Unknown";
      if (role === "PETITIONER" && vaultConfig.petitionerName) {
        personName = vaultConfig.petitionerName;
      } else if (role === "BENEFICIARY") {
        personName = activeCandidate?.fullName || vaultConfig.beneficiaryName || "Beneficiary";
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
              className="group relative w-full cursor-pointer rounded-xl text-left transition-colors"
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
                  className="flex shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all"
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
                  {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : stepNum}
                </div>

                {showLabels && (
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-semibold"
                      style={{
                        color: isActive ? "#0a5a5d" : "#374151",
                      }}
                    >
                      {label}
                    </p>
                    <p className="truncate text-[11px]">
                      {isCompleted ? (
                        <span className="font-medium text-emerald-600">✓ Completed</span>
                      ) : isSkipped || isUnansweredSkipped ? (
                        <span className="font-medium text-amber-600">Skipped</span>
                      ) : isActive ? (
                        <span className="font-medium text-sky-600">In Progress</span>
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
                    className="shrink-0 rounded p-1 transition-colors hover:bg-[#d4edee]"
                    style={{ color: "#0a5a5d" }}
                  >
                    <ChevronRight className="h-4 w-4" />
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
                    <div className="space-y-1 border-t border-[#e8f6f6] bg-[#f9fdfb] px-3 py-2">
                      {visibleSectionFields.map((field, vIdx) => {
                        // Remove numbering from label
                        const cleanLabel = field.label.replace(/^\d+[a-z]?\.\s*/, "");
                        const fieldAnswered =
                          field.type === "checkbox" && field.options
                            ? field.options.some(
                                (opt) => formData[opt.pdfKey || opt.value] === "Yes"
                              )
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
                              handleJumpToQuestion(idx, vIdx);
                            }}
                            className={`group flex w-full items-center gap-2 rounded p-2 text-left text-xs transition-colors ${
                              isActiveQuestion
                                ? "bg-[#0d7377]/10 pl-1.5 font-semibold"
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
                              <Check className="h-3 w-3" style={{ color: "#0d7377" }} />
                            )}
                            <span className="line-clamp-1 truncate">
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
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Loader size="lg" />
        <p className="mt-2 text-sm font-medium text-[#0d7377]">
          {user && !draftLoaded
            ? `Restoring your draft for ${formCode.toUpperCase()}...`
            : `Loading ${formCode.toUpperCase()} Form...`}
        </p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7fbfb]">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-10 text-center shadow-sm">
          <h2 className="mb-3 text-2xl font-bold text-red-800">Form Not Found</h2>
          <p className="text-red-700">
            Sorry, the form &quot;<strong>{formCode.toUpperCase()}</strong>
            &quot; is not available yet.
          </p>
          <p className="mt-4 text-sm text-gray-600">Available: I-130, I-130A, I-864, DS-260</p>
        </div>
      </div>
    );
  }

  if (totalSteps === 0) {
    return <div className="py-20 text-center text-gray-500">No questions in this form.</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col" style={{ backgroundColor: "#f7fbfb" }}>
      {/* Sticky Header */}
      <Header
        formTitle={config.formTitle}
        formSubtitle={config.formSubtitle}
        onOpenMenu={() => setIsDrawerOpen(true)}
        showMenu={view === "form"}
        isAutoSaving={isAutoSaving}
        lastSavedAt={lastSavedAt}
        activeCandidate={activeCandidate}
        candidates={candidates}
        onSelectCandidate={(id) => setActiveCandidateId(id)}
        isMultiCandidate={isMultiCandidate}
        isStandalone={!isJourney}
        isEmbedded={isEmbedded}
        onClose={onClose}
      />

      {/* Mobile Bottom Tray */}
      <MobileBottomSheet
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Navigation"
      >
        {renderSectionList({
          onPick: () => setIsDrawerOpen(false),
          showLabels: true,
        })}
      </MobileBottomSheet>

      {/* Main Layout - Centered Content */}
      <div className="guide-grid-bg flex min-h-0 flex-1 items-stretch justify-center gap-6 px-4 py-0 md:px-8">
        {/* Desktop Sidebar (stays within header/footer zone) */}
        {view === "form" && (
          <motion.div
            initial={false}
            animate={{
              width: isSidebarCollapsed ? 24 : 325,
            }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            className="-ml-4 hidden shrink-0 md:-ml-8 lg:block"
          >
            <aside
              className="sticky top-16 mt-12 h-[calc(100vh-280px)] w-full overflow-hidden"
              aria-hidden={false}
            >
              <div
                className={[
                  "custom-scrollbar relative flex h-full flex-col overflow-hidden",
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
                    <div className="mb-4 flex items-center justify-between px-1">
                      <h3
                        className="text-[11px] font-bold tracking-[0.14em] uppercase"
                        style={{ color: "#0a5a5d" }}
                      >
                        Sections
                      </h3>
                    </div>

                    {/* Content */}
                    <div className="custom-scrollbar flex-1 overflow-y-auto pr-1">
                      {renderSectionList({})}
                    </div>
                  </>
                )}

                <motion.button
                  onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                  className="absolute top-1/2 -right-2 z-50 -translate-y-1/2"
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
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex w-full flex-1 items-start justify-center py-6">
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
                        className="flex min-h-[60vh] items-center justify-center px-4"
                      >
                        <div className="w-full max-w-2xl">
                          <div className="rounded-2xl border-2 border-[#14a0a6] bg-white p-8 shadow-xl md:p-10">
                            {/* Top Label */}
                            <p className="rounded-full border border-white/20 bg-white/10 text-center text-xs font-semibold tracking-[0.2em] text-[#14a0a6] uppercase sm:text-sm">
                              Moving on to {currentSection?.title || "Next Section"}
                            </p>

                            {/* Greeting */}
                            {/* <h3 className="mt-4 text-lg font-semibold text-gray-800">
            {getSectionIntroMessage(currentSection.title).greeting}
          </h3> */}

                            {/* Message */}
                            <p className="mt-2 text-center text-xs leading-relaxed font-semibold text-gray-600 sm:text-sm">
                              {getSectionIntroMessage(currentSection.title).message}
                            </p>

                            {/* Expandable Tooltip */}
                            <div className="mt-6">
                              <ExpandableTooltip
                                icon={"i"}
                                defaultOpen={false}
                                title="Before you continue"
                                message={`Provide accurate details to ensure faster processing. This information will be used in official forms, so make sure everything is correct. Don't worry-you'll still be able to review and edit everything later.`}
                              />
                            </div>

                            {/* Progress */}
                            <div className="mt-6">
                              <div className="mb-2 flex justify-between text-xs text-gray-500">
                                <span>Section Progress</span>
                                <span>
                                  {currentStep}/{totalSteps}
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
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
                              className="mt-8 w-full rounded-xl py-3 font-semibold text-white shadow-md"
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
                        {inheritedInfo?.isInherited && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start justify-between gap-3 rounded-xl border border-teal-200 bg-linear-to-r from-teal-50 to-emerald-50/50 p-3.5 shadow-xs"
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="rounded-lg bg-teal-100 p-1.5 text-teal-800 shrink-0 mt-0.5">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-teal-950">
                                  Smart Pre-Fill Active ({inheritedInfo.count} fields copied)
                                </p>
                                <p className="text-[11px] text-teal-800 leading-relaxed mt-0.5">
                                  Shared petitioner and household answers were automatically populated from{" "}
                                  <strong>{inheritedInfo.sourceName}</strong>. Candidate-distinct details (Name, DOB,
                                  Passport #) are marked with caution badges for individual review.
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setInheritedInfo(null)}
                              className="text-xs font-semibold text-teal-700 hover:text-teal-900 shrink-0 px-2 py-1 rounded hover:bg-teal-100/60"
                            >
                              Dismiss
                            </button>
                          </motion.div>
                        )}

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
                          formCode={formCode}
                          activeCandidate={activeCandidate}
                        />

                        {/* Navigation Buttons */}
                        <div className="mt-10 flex flex-row items-center justify-between gap-3 border-t border-[#e8f6f6] pt-6">
                          <button
                            onClick={handlePrevious}
                            disabled={currentStep === 1 && currentQuestionIndex === 0}
                            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium whitespace-nowrap transition-all hover:border-[#0d7377] hover:text-[#0d7377] disabled:cursor-not-allowed disabled:opacity-40"
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
                            className="w-full rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all md:px-8"
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
                  className="animated-border rounded-2xl border-2 bg-white px-4 py-5 md:px-8 md:py-7 -mx-2 md:-mx-8 lg:-mx-16"
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
                    freePreviewLimit={limit}
                    onUpgradeClick={() => setShowUpgradeModal(true)}
                    formCode={formCode}
                    activeCandidate={activeCandidate}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {saveError && (
        <div className="px-4 pt-1 pb-4 md:px-8">
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
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

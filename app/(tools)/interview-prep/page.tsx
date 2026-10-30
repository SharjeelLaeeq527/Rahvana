"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useRouter } from "next/navigation";
import { ResultPage } from "./result/ResultPage";
import { Loader } from "@/components/ui/spinner";
import { InterviewPrepOutput, type InterviewSession } from "../../../lib/interview-prep/types";
import { useAuth } from "@/app/context/AuthContext";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { mapProfileToGenericForm, mapFormToProfile } from "@/lib/autoFill/mapper";
import { ReviewStep } from "@/app/components/interview-prep/review-step";
import {
  CategorySelectionStep,
  type CategoryWithPurchaseStatus,
} from "@/app/components/interview-prep/category-selection-step";
import { DynamicQuestionStep } from "@/app/components/interview-prep/dynamic-question-step";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import type { InterviewFormData } from "@/app/components/interview-prep/types";
import { ResultGate } from "@/app/components/entitlements/ResultGate";
import { CreditLaunchModal } from "@/app/components/wallet/CreditLaunchModal";
import { useStandaloneToolUnlock } from "@/lib/wallet/useStandaloneToolUnlock";
import { useWallet } from "@/app/context/WalletContext";
import { usePlan } from "@/app/context/PlanContext";
import { useToast } from "@/app/components/shared/ToastProvider";
import { useCandidate } from "@/app/context/CandidateContext";
import { Users } from "lucide-react";
import MyInterviewSessions from "./my-sessions/page";
import {
  resolveCategorySlug,
  isMultiCandidateCategorySlug,
} from "@/lib/interview-prep/journey-category-map";
import { useJourneyEnvironment } from "@/app/context/JourneyEnvironmentContext";
import type { DynamicQuestionnaire } from "@/data/interview-categories/schema";
import { E, msg } from "@/lib/errors";

type PurchaseRequiredAddon = {
  id: string;
  name: string;
  price: number;
};

type PurchaseExhaustedData = {
  addon_id: string;
  message: string;
};

type PurchaseErrorResponse = {
  success: false;
  error: "PURCHASE_REQUIRED" | "PURCHASE_EXHAUSTED";
  message?: string;
  addon?: PurchaseRequiredAddon;
  repurchase?: PurchaseExhaustedData;
};

export interface InterviewPreparationProps {
  isEmbedded?: boolean;
  journeyId?: string | null;
  journeyCategory?: string | null;
  toolHref?: string | null;
  sessionId?: string | null;
  categorySlug?: string | null;
  initialCategorySlug?: string | null;
  initialView?: "prep" | "sessions";
  onClose?: () => void;
  journeyTier?: string | null;
}

export default function InterviewPreparation({
  isEmbedded: propIsEmbedded,
  journeyId: propJourneyId,
  journeyCategory: propJourneyCategory,
  toolHref,
  sessionId: propSessionId,
  categorySlug: propCategorySlug,
  initialCategorySlug: propInitialCategorySlug,
  initialView = "prep",
  onClose,
  journeyTier: propJourneyTier,
}: InterviewPreparationProps = {}) {
  const router = useRouter();
  const journeyEnv = useJourneyEnvironment();

  const isEmbedded = Boolean(propIsEmbedded || journeyEnv.isInsideJourney);
  // Standalone only: buying with credits replaces the per-category checkout.
  // Journey runs pass null so they never read wallet unlocks.
  const ipWallet = useStandaloneToolUnlock(isEmbedded ? null : "interview-prep");
  const { refreshWallet } = useWallet();
  const [showCreditModal, setShowCreditModal] = useState(false);
  const createdSessionRef = useRef<InterviewSession | null>(null);
  const plan = usePlan();
  // Journey runs ask the categories API without wallet data.
  const categoriesScopeQuery = isEmbedded ? "scope=journey" : "";

  const getEffectiveParam = (key: string): string | null => {
    if (toolHref && toolHref.includes("?")) {
      const search = toolHref.split("?")[1];
      const p = new URLSearchParams(search);
      if (p.has(key)) return p.get(key);
    }
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.has(key)) return p.get(key);
    }
    return null;
  };

  const effectiveJourneyTier =
    propJourneyTier ||
    getEffectiveParam("journey_tier") ||
    getEffectiveParam("tier") ||
    null;

  const effectiveJourneyId =
    propJourneyId ||
    getEffectiveParam("journey_id") ||
    journeyEnv.journeySlug ||
    journeyEnv.journeyDataKey ||
    null;

  const journeySlugOrKey =
    propJourneyCategory ||
    propInitialCategorySlug ||
    propCategorySlug ||
    getEffectiveParam("category_slug") ||
    journeyEnv.journeyCategory ||
    journeyEnv.journeyDataKey ||
    journeyEnv.journeySlug ||
    effectiveJourneyId;

  const targetCategorySlug =
    propCategorySlug ||
    propInitialCategorySlug ||
    getEffectiveParam("category_slug") ||
    resolveCategorySlug(propJourneyCategory) ||
    resolveCategorySlug(journeyEnv.journeyCategory) ||
    resolveCategorySlug(journeyEnv.journeyDataKey) ||
    resolveCategorySlug(journeyEnv.journeySlug) ||
    (journeySlugOrKey ? resolveCategorySlug(journeySlugOrKey) : null);

  const [viewMode, setViewMode] = useState<"prep" | "sessions">(initialView);
  const [entryMode, setEntryMode] = useState<"pending" | "tool" | "redirect">("pending");
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithPurchaseStatus | null>(null);

  const [availableCategories, setAvailableCategories] = useState<CategoryWithPurchaseStatus[]>([]);
  const [questionnaire, setQuestionnaire] = useState<DynamicQuestionnaire | null>(null);
  const [noDataMessage, setNoDataMessage] = useState<string | null>(null);

  const [step, setStep] = useState<number>(0);
  const [showWhatsThis, setShowWhatsThis] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const hasInitializedModal = useRef(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const [formData, setFormData] = useState<Partial<InterviewFormData>>({
    caseType: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>("Loading...");

  const [sessionId, setSessionId] = useState<string | null>(propSessionId || null);
  const [generatedResults, setGeneratedResults] = useState<InterviewPrepOutput | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [sessionRestorationAttempted, setSessionRestorationAttempted] = useState(false);

  // Journey session tracking
  const [sessionSource, setSessionSource] = useState<"journey" | "tool">(
    isEmbedded ? "journey" : "tool"
  );
  const [journeyId, setJourneyId] = useState<string | null>(effectiveJourneyId);
  const [isJourneySession, setIsJourneySession] = useState(isEmbedded);

  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>("United States");

  const [repurchaseAddonId, setRepurchaseAddonId] = useState<string | null>(null);

  const purchaseReturnHandledRef = useRef(false);

  type RestorableSession = {
    id: string;
    category_slug: string;
    updated_at?: string;
    answers?: Array<{ question_key: string; answer_value: unknown }>;
    results?: InterviewPrepOutput;
    source?: "journey" | "tool";
    journey_id?: string | null;
  };

  // Confirmation modal state for session restoration
  const [restoreSessionModalOpen, setRestoreSessionModalOpen] = useState(false);
  const [pendingRestoreSession, setPendingRestoreSession] = useState<RestorableSession | null>(
    null
  );
  const [isRedirectingSession, setIsRedirectingSession] = useState(false);
  const [existingSessions, setExistingSessions] = useState<any[]>([]);

  const { user } = useAuth();
  const { profile, isProfileLoading, updateProfile } = useUserProfile();
  const { showToast } = useToast();

  let candidateCtx;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    candidateCtx = useCandidate();
  } catch {
    candidateCtx = undefined;
  }
  const activeCandidate = candidateCtx?.activeCandidate;
  const activeCandidateId =
    candidateCtx?.activeCandidateId ||
    journeyEnv.candidateId ||
    getEffectiveParam("candidate_id") ||
    "candidate-1";
  const isMultiCandidate = candidateCtx?.isMultiCandidate || false;

  const STANDALONE_SESSION_KEY = "standalone_interview_prep_session_id";
  const getSessionIdKey = (cId: string) => `interviewPrepSessionId_${cId}`;
  const getSessionSourceKey = (cId: string) => `interviewPrepSessionSource_${cId}`;
  const getSessionJourneyKey = (cId: string) => `interviewPrepJourneyId_${cId}`;
  const getStandaloneSessionKey = (cId: string) => `standalone_interview_prep_session_id_${cId}`;

  const getStoredSessionId = (cId: string, isJourney: boolean = false) => {
    if (typeof window === "undefined") return null;
    if (!isJourney) {
      if (cId && cId !== "candidate-1") {
        return (
          localStorage.getItem(getStandaloneSessionKey(cId)) ||
          localStorage.getItem(STANDALONE_SESSION_KEY)
        );
      }
      return localStorage.getItem(STANDALONE_SESSION_KEY);
    }
    return (
      localStorage.getItem(getSessionIdKey(cId)) ||
      (cId === "candidate-1" ? localStorage.getItem("interviewPrepSessionId") : null)
    );
  };

  const getStoredSessionSource = (cId: string, isJourney: boolean = false) => {
    if (typeof window === "undefined") return null;
    if (!isJourney) return "tool";
    return (
      (localStorage.getItem(getSessionSourceKey(cId)) as "journey" | "tool" | null) ||
      (cId === "candidate-1"
        ? (localStorage.getItem("interviewPrepSessionSource") as "journey" | "tool" | null)
        : null)
    );
  };

  const setStoredSession = (
    cId: string,
    sid: string,
    source: "journey" | "tool",
    jId?: string | null
  ) => {
    if (typeof window === "undefined") return;
    if (source === "tool" && !jId) {
      localStorage.setItem(STANDALONE_SESSION_KEY, sid);
      if (cId) {
        localStorage.setItem(getStandaloneSessionKey(cId), sid);
      }
      return;
    }
    localStorage.setItem(getSessionIdKey(cId), sid);
    localStorage.setItem(getSessionSourceKey(cId), source);
    if (jId) {
      localStorage.setItem(getSessionJourneyKey(cId), jId);
    }
    if (cId === "candidate-1") {
      localStorage.setItem("interviewPrepSessionId", sid);
      localStorage.setItem("interviewPrepSessionSource", source);
      if (jId) localStorage.setItem("interviewPrepJourneyId", jId);
    }
  };

  const clearStoredSession = (cId: string, isJourney: boolean = false) => {
    if (typeof window === "undefined") return;
    if (!isJourney) {
      localStorage.removeItem(STANDALONE_SESSION_KEY);
      if (cId) {
        localStorage.removeItem(getStandaloneSessionKey(cId));
      }
      return;
    }
    localStorage.removeItem(getSessionIdKey(cId));
    localStorage.removeItem(getSessionSourceKey(cId));
    localStorage.removeItem(getSessionJourneyKey(cId));
    if (cId === "candidate-1") {
      localStorage.removeItem("interviewPrepSessionId");
      localStorage.removeItem("interviewPrepSessionSource");
      localStorage.removeItem("interviewPrepJourneyId");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isEmbedded) {
      setEntryMode("tool");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const hasJourneyOrSession = params.has("journey_id") || params.has("sessionId");
    const isNewSessionFlow = params.get("newSession") === "1";

    if (!hasJourneyOrSession && !isNewSessionFlow) {
      setEntryMode("redirect");
      router.replace("/interview-prep/my-sessions");
      return;
    }

    setEntryMode("tool");
  }, [router, isEmbedded]);

  const saveProgressToProfile = (currentFormData = formData) => {
    if (!user) return;
    // CRITICAL: Standalone interview prep must NOT save to or overwrite the journey case profile!
    // The user's prompt requires complete data isolation between standalone and journey prep.
    if (!isJourneySession && !isEmbedded) return;
    try {
      const profileUpdate = mapFormToProfile(currentFormData as Record<string, unknown>);
      updateProfile(profileUpdate, { silent: true });
    } catch (err) {
      console.error("Error saving progress to profile:", err);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Auto-fill profile data (from central context) - ONLY for Journey sessions
  useEffect(() => {
    if (!isJourneySession && !isEmbedded) return;
    if (isProfileLoading || profileLoaded || !profile) return;

    const mappedData = mapProfileToGenericForm(profile, {
      caseType: formData.caseType,
      beneficiary_country: formData.beneficiary_country,
      age_range: formData.age_range,
      highest_education: formData.highest_education,
      marriage_date: formData.marriage_date,
      marriage_location: formData.marriage_location,
      previous_marriages: formData.previous_marriages,
      relationship_origin_type: formData.relationship_origin_type,
      current_living_arrangement: formData.current_living_arrangement,
      spouse_address: formData.spouse_address,
      communication_frequency: formData.communication_frequency,
      daily_communication: formData.daily_communication,
      shared_activities: formData.shared_activities,
      important_dates_knowledge: formData.important_dates_knowledge,
      met_spouse_family: formData.met_spouse_family,
      family_reaction_to_marriage: formData.family_reaction_to_marriage,
      wedding_attendees: formData.wedding_attendees,
      marriage_type: formData.marriage_type,
      mutual_friends: formData.mutual_friends,
      petitioner_status: formData.petitioner_status,
      petitioner_income_level: formData.petitioner_income_level,
      household_size: formData.household_size,
      beneficiary_employment: formData.beneficiary_employment,
      sponsor_employment: formData.sponsor_employment,
      military_or_defense_background: formData.military_or_defense_background,
      previous_us_visits: formData.previous_us_visits,
      previous_visa_refusal: formData.previous_visa_refusal,
      visa_overstay_history: formData.visa_overstay_history,
      criminal_history: formData.criminal_history,
      english_proficiency: formData.english_proficiency,
      intended_us_state: formData.intended_us_state,
      living_arrangements_in_us: formData.living_arrangements_in_us,
      future_plans: formData.future_plans,
      joint_finances: formData.joint_finances,
      financial_arrangement_description: formData.financial_arrangement_description,
    });

    setFormData((prev) => ({
      ...prev,
      ...mappedData,
    }));
    setProfileLoaded(true);
  }, [profile, isProfileLoading, profileLoaded, formData]);

  // Load available categories based on selected country
  const loadCategories = async (country: string): Promise<CategoryWithPurchaseStatus[]> => {
    try {
      setCategoriesLoading(true);
      setLoadingMessage("Loading visa categories...");
      setLoading(true);

      const params = new URLSearchParams(window.location.search);
      const shouldFilterExistingSessions = !isEmbedded && params.get("newSession") === "1";

      const [categoriesResponse, sessionsResponse] = await Promise.all([
        fetch(
          `/api/interview-prep/categories?country=${encodeURIComponent(country)}${
            categoriesScopeQuery ? `&${categoriesScopeQuery}` : ""
          }`
        ),
        !isEmbedded ? fetch("/api/interview-prep/user-sessions") : null,
      ]);

      const data = await categoriesResponse.json();

      if (
        categoriesResponse.ok &&
        data.success &&
        Array.isArray(data.categories) &&
        data.categories.length > 0
      ) {
        const loadedCategories = data.categories as CategoryWithPurchaseStatus[];
        let filteredCategories = loadedCategories;

        if (isEmbedded && targetCategorySlug) {
          filteredCategories = loadedCategories.filter(
            (category) => category.categorySlug === targetCategorySlug
          );
        } else if (!isEmbedded && sessionsResponse?.ok) {
          const sessionsData = await sessionsResponse.json();
          const rawSessions = Array.isArray(sessionsData.sessions) ? sessionsData.sessions : [];
          setExistingSessions(rawSessions);

          if (shouldFilterExistingSessions) {
            // Single-candidate categories (IR-1) filter out if any session exists.
            // Multi-candidate categories (IR-5, IR-2) are NEVER filtered out because
            // users can sponsor multiple candidates (Mother, Father, Stepparent, Adoptive Parent, etc.)
            const usedCategorySlugs = new Set<string>();
            for (const s of rawSessions) {
              if (!s.category_slug) continue;
              const isMulti = isMultiCandidateCategorySlug(s.category_slug);
              if (!isMulti) {
                usedCategorySlugs.add(s.category_slug);
              }
            }

            filteredCategories = loadedCategories.filter(
              (category) => !usedCategorySlugs.has(category.categorySlug)
            );
          }
        }

        setAvailableCategories(filteredCategories);
        setNoDataMessage(
          filteredCategories.length === 0
            ? "You already have sessions for every available category in this country."
            : null
        );

        return filteredCategories;
      }

      setAvailableCategories([]);
      setNoDataMessage(
        shouldFilterExistingSessions
          ? "You already have sessions for every available category in this country."
          : "No Visa Categories available for your selected country right now."
      );

      return [];
    } catch (err) {
      console.error("Error loading categories:", err);

      setError(msg(E.TOOL_INTERVIEW_CATEGORIES_FAILED));
      setNoDataMessage(null);

      return [];
    } finally {
      setCategoriesLoading(false);
      setLoading(false);
      setLoadingMessage("");
    }
  };

  // Fetch categories
  useEffect(() => {
    if (!selectedCountry) return;
    void loadCategories(selectedCountry);
  }, []);

  useEffect(() => {
    if (isEmbedded && targetCategorySlug && availableCategories.length > 0) {
      const matching = availableCategories.filter((c) => c.categorySlug === targetCategorySlug);
      if (matching.length > 0 && (!selectedCategory || selectedCategory.categorySlug !== targetCategorySlug)) {
        setSelectedCategory(matching[0]);
      }
    }
  }, [isEmbedded, targetCategorySlug, availableCategories, selectedCategory]);

  const restoreSessionData = async (
    session: RestorableSession,
    getCategoryFn: (slug: string) => CategoryWithPurchaseStatus | undefined
  ) => {
    try {
      setSessionId(session.id);
      const categorySlug = session.category_slug;
      let category = getCategoryFn(categorySlug);

      if (!category) {
        try {
          const catRes = await fetch(`/api/interview-prep/categories`);
          const catResData = await catRes.json().catch(() => null);
          if (catResData?.success && Array.isArray(catResData.categories)) {
            category = catResData.categories.find(
              (c: { categorySlug: string }) => c.categorySlug === categorySlug
            );
          }
        } catch {
          // ignore
        }
      }

      if (!category && availableCategories.length > 0) {
        clearStoredSession(activeCandidateId);
        return;
      }

      if (category) {
        setSelectedCategory(category);

        // Load questionnaire for the restored category
        const catDataResponse = await fetch(`/api/interview-prep?category_slug=${categorySlug}`);
        const catData = catDataResponse.ok ? await catDataResponse.json().catch(() => null) : null;

        if (catData?.success) {
          setQuestionnaire({
            categorySlug: category.categorySlug,
            version: catData.questionnaire?.version || "1.0.0",
            lastUpdated: new Date().toISOString(),
            sections: catData.questionnaire?.sections || [],
          });

          // Restore form data (questionnaire answers)
          if (session.answers && Array.isArray(session.answers)) {
            const answersMap: Record<string, unknown> = {};
            session.answers.forEach((answer: { question_key: string; answer_value: unknown }) => {
              answersMap[answer.question_key] = answer.answer_value;
            });
            setFormData((prev) => ({
              ...prev,
              ...answersMap,
            }));
          }

          // If results were already generated, restore them and jump to results step
          if (session.results) {
            setGeneratedResults(session.results);
            setStep((catData.questionnaire?.sections?.length || 0) + 2); // Show results
          } else {
            setStep(1); // Show first question section
          }
        }
      }
    } catch (err) {
      console.error("Error restoring session data:", err);
    }
  };

  const handleSelectSessionFromHistory = async (targetSessionId: string) => {
    try {
      setLoading(true);
      setLoadingMessage("Loading session...");
      const response = await fetch(`/api/interview-prep/sessions/${targetSessionId}`);
      const sessionData = await response.json();

      if (response.ok && sessionData.session) {
        setSessionId(targetSessionId);
        const categorySlug =
          sessionData.session.category_slug || targetCategorySlug || "ir-1-spouse";

        const catDataResponse = await fetch(`/api/interview-prep?category_slug=${categorySlug}`);
        const catData = await catDataResponse.json();

        if (catData.success) {
          setQuestionnaire({
            categorySlug,
            version: catData.questionnaire?.version || "1.0.0",
            lastUpdated: new Date().toISOString(),
            sections: catData.questionnaire?.sections || [],
          });
        }

        if (sessionData.session.interview_prep_results) {
          setGeneratedResults(sessionData.session.interview_prep_results.generated_questions);
          setStep((catData.questionnaire?.sections?.length || 0) + 2);
        } else {
          if (sessionData.session.answers && Array.isArray(sessionData.session.answers)) {
            const answersMap: Record<string, unknown> = {};
            sessionData.session.answers.forEach((a: any) => {
              answersMap[a.question_key] = a.answer_value;
            });
            setFormData((prev) => ({ ...prev, ...answersMap }));
          }
          setStep(1);
        }

        setViewMode("prep");
      }
    } catch (err) {
      console.error("Error loading selected session:", err);
      showToast("Failed to load session", "error");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleNewSessionFromHistory = async () => {
    setViewMode("prep");
    setSessionId(null);
    setGeneratedResults(null);
    setFormData({ caseType: "" });
    setStep(0);
    if (targetCategorySlug && availableCategories.length > 0) {
      const cat = availableCategories.find((c) => c.categorySlug === targetCategorySlug);
      if (cat) {
        setSelectedCategory(cat);
      }
    }
  };

  // Check for existing/incomplete session on initial mount
  useEffect(() => {
    if (sessionRestorationAttempted) return;

    const restoreIncompleteSession = async () => {
      try {
        const jId = effectiveJourneyId || getEffectiveParam("journey_id");
        const sessionIdParam = propSessionId || getEffectiveParam("sessionId");
        const isNewSessionFlow = getEffectiveParam("newSession") === "1";

        if (!isNewSessionFlow && !jId && !sessionIdParam && !isEmbedded) {
          setSessionRestorationAttempted(true);
          return;
        }

        if (isNewSessionFlow && !jId && !sessionIdParam && !isEmbedded) {
          setSessionSource("tool");
          setIsJourneySession(false);
          setSessionRestorationAttempted(true);
          setLoading(false);
          setLoadingMessage("");
          return;
        }

        setLoading(true);
        setLoadingMessage("Checking for existing sessions...");

        // Check for active journey session
        if (jId || isEmbedded) {
          let journeyData: any = null;
          if (jId) {
            const candParam = journeyEnv.candidateId || activeCandidateId;
            const journeyResponse = await fetch(
              `/api/interview-prep/active-journey-session?journey_id=${encodeURIComponent(jId)}${
                candParam ? `&candidate_id=${encodeURIComponent(candParam)}` : ""
              }`
            );
            journeyData = await journeyResponse.json();
          }

          if (journeyData && journeyData.success && journeyData.hasActiveJourney && journeyData.session) {
            setSessionId(journeyData.session.id);
            setJourneyId(journeyData.journey_id);
            setSessionSource("journey");
            setIsJourneySession(true);

            setStoredSession(
              activeCandidateId,
              journeyData.session.id,
              "journey",
              journeyData.journey_id
            );

            const categorySlug =
              journeyData.session.category_slug || targetCategorySlug || "ir-1-spouse";
            const catDataResponse = await fetch(`/api/interview-prep?category_slug=${categorySlug}`);
            const catData = catDataResponse.ok ? await catDataResponse.json().catch(() => null) : null;

            if (catData.success) {
              const categoriesResponse = await fetch(
              `/api/interview-prep/categories?${categoriesScopeQuery}`
            );
              const categoriesData = await categoriesResponse.json();

              if (categoriesData?.success && categoriesData.categories) {
                const category = categoriesData.categories.find(
                  (c: { categorySlug: string }) => c.categorySlug === categorySlug
                );
                if (category) {
                  setSelectedCategory(category);
                  setQuestionnaire({
                    categorySlug: category.categorySlug,
                    version: catData.questionnaire?.version || "1.0.0",
                    lastUpdated: new Date().toISOString(),
                    sections: catData.questionnaire?.sections || [],
                  });
                  setAvailableCategories(categoriesData.categories);

                  if (journeyData.session.answers && Array.isArray(journeyData.session.answers)) {
                    const answersMap: Record<string, unknown> = {};
                    journeyData.session.answers.forEach(
                      (answer: { question_key: string; answer_value: unknown }) => {
                        answersMap[answer.question_key] = answer.answer_value;
                      }
                    );
                    setFormData((prev) => ({ ...prev, ...answersMap }));
                  }

                  if (journeyData.session.output && journeyData.session.output.length > 0) {
                    setGeneratedResults({
                      sessionId: journeyData.session.id,
                      questions: journeyData.session.output,
                      summary: {
                        totalQuestions: journeyData.session.output.length,
                        applicableQuestions: journeyData.session.output.length,
                        categories: Array.from(
                          new Set(
                            journeyData.session.output.map((q: { category: string }) => q.category)
                          )
                        ),
                      },
                    });
                    setStep((catData.questionnaire?.sections?.length || 0) + 2);
                  } else {
                    setStep(1);
                  }
                }
              }
            }

            setSessionRestorationAttempted(true);
            setLoading(false);
            setLoadingMessage("");
            return;
          }

          if (targetCategorySlug) {
            const categoriesResponse = await fetch(
              `/api/interview-prep/categories?${categoriesScopeQuery}`
            );
            const categoriesData = await categoriesResponse.json();
            if (categoriesData.success && categoriesData.categories) {
              setAvailableCategories(categoriesData.categories);
              const matchedCat = categoriesData.categories.find(
                (c: { categorySlug: string }) => c.categorySlug === targetCategorySlug
              );
              if (matchedCat) {
                setSelectedCategory(matchedCat);
              }
            }
            setSessionRestorationAttempted(true);
            setLoading(false);
            setLoadingMessage("");
            return;
          }
        }

        // Check for sessionId parameter (session revisit or resume)
        if (sessionIdParam) {
          setLoading(true);
          setLoadingMessage("Loading your interview session...");
          const userEmail =
            typeof window !== "undefined"
              ? localStorage.getItem("userEmail") || "test@example.com"
              : "test@example.com";
          const response = await fetch(
            `/api/interview-prep/sessions/${sessionIdParam}?userEmail=${encodeURIComponent(userEmail)}`
          );
          const sessionData = await response.json();

          if (response.ok && sessionData.session) {
            const sess = sessionData.session;
            // Strict isolation: do not load journey sessions into standalone, or vice versa
            if ((isEmbedded && sess.source === "tool") || (!isEmbedded && sess.source === "journey")) {
              setLoading(false);
              setLoadingMessage("");
              setSessionRestorationAttempted(true);
              return;
            }

            setSessionId(sessionIdParam);
            const source = sess.source || (isEmbedded ? "journey" : "tool");
            setSessionSource(source);
            if (source === "journey") {
              setIsJourneySession(true);
              setJourneyId(sess.journey_id);
            }
            if (sess.candidate_id) {
              setStoredSession(sess.candidate_id, sessionIdParam, source, sess.journey_id);
            }

            // If session already has generated results, show results step
            if (sess.interview_prep_results) {
              setGeneratedResults(sess.interview_prep_results.generated_questions);
              setStep(questionnaire ? questionnaire.sections.length + 2 : 4);
              setLoading(false);
              setLoadingMessage("");
              setSessionRestorationAttempted(true);
              return;
            }

            // Incomplete session without results: restore questionnaire and any saved answers
            await restoreSessionData(sess, (categorySlug: string) => {
              const category = availableCategories.find((c) => c.categorySlug === categorySlug);
              return category;
            });
            setLoading(false);
            setLoadingMessage("");
            setSessionRestorationAttempted(true);
            return;
          }
        }

        // Check candidate-scoped storage for incomplete session
        const savedSessionId = getStoredSessionId(activeCandidateId, isEmbedded);
        const savedSessionSource = getStoredSessionSource(activeCandidateId, isEmbedded);

        if (savedSessionId && step === 0) {
          const response = await fetch(`/api/interview-prep/sessions/${savedSessionId}`);
          const sessionData = await response.json();

          if (response.ok && sessionData.session && sessionData.session.completed === false) {
            const session = sessionData.session;
            // Strict isolation check: reject cross-source stored sessions
            if ((isEmbedded && session.source === "tool") || (!isEmbedded && session.source === "journey")) {
              clearStoredSession(activeCandidateId, isEmbedded);
            } else {
              const source = session.source || savedSessionSource || (isEmbedded ? "journey" : "tool");
              setSessionSource(source);
              if (source === "journey") {
                setIsJourneySession(true);
                setJourneyId(session.journey_id);
              }

              await restoreSessionData(session, (categorySlug: string) => {
                const category = availableCategories.find((c) => c.categorySlug === categorySlug);
                return category;
              });
              setLoading(false);
              setSessionRestorationAttempted(true);
              return;
            }
          } else {
            clearStoredSession(activeCandidateId, isEmbedded);
          }
        }

        // Check database for latest incomplete tool session
        if (!savedSessionId && step === 0 && !isEmbedded && typeof window !== "undefined") {
          const candParam = activeCandidateId;
          const latestResponse = await fetch(
            `/api/interview-prep/latest-incomplete-session${
              candParam ? `?candidate_id=${encodeURIComponent(candParam)}` : ""
            }`
          );
          const latestData = await latestResponse.json();

          if (
            latestData.success &&
            latestData.session &&
            !latestData.session.results &&
            latestData.session.source !== "journey"
          ) {
            setPendingRestoreSession(latestData.session);
            setRestoreSessionModalOpen(true);
          }
        }

        setSessionRestorationAttempted(true);
      } catch (err) {
        console.error("Error checking for incomplete session:", err);
        setLoading(false);
        setLoadingMessage("");
        setSessionRestorationAttempted(true);
      }
    };

    if (typeof window !== "undefined") {
      restoreIncompleteSession();
    }
  }, []);

  useEffect(() => {
    if (hasInitializedModal.current || isEmbedded) return;
    if (!initialCheckDone) return;
    if (sessionId) return;

    hasInitializedModal.current = true;

    const localHide =
      typeof window !== "undefined" &&
      localStorage.getItem("dont_show_interview_narrative") === "true";

    if (!localHide) {
      setShowWhatsThis(true);
    } else {
      setShowWhatsThis(false);
    }
  }, [initialCheckDone, sessionId, isEmbedded]);

  useEffect(() => {
    if (sessionRestorationAttempted && !initialCheckDone) {
      setInitialCheckDone(true);
      setLoading(false);
      setLoadingMessage("");
    }
  }, [sessionRestorationAttempted, initialCheckDone]);

  useEffect(() => {
    if (!initialCheckDone || sessionId || purchaseReturnHandledRef.current) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const purchaseSuccess = params.get("purchase_success") === "true";

    if (!purchaseSuccess) {
      return;
    }

    purchaseReturnHandledRef.current = true;

    const restorePurchasedCategory = async () => {
      const pendingCategory = localStorage.getItem("interview_prep_pending_category");

      const pendingCountry =
        localStorage.getItem("interview_prep_pending_country") ||
        localStorage.getItem("interview_prep_selected_country") ||
        selectedCountry ||
        "all";

      if (!pendingCategory) {
        if (!isEmbedded) router.replace("/interview-prep");
        return;
      }

      const refreshedCategories = await loadCategories(pendingCountry);

      const purchasedCategory = refreshedCategories.find(
        (category) => category.categorySlug === pendingCategory
      );

      if (purchasedCategory) {
        setSelectedCategory(purchasedCategory);
        setError(null);
        setRepurchaseAddonId(null);
        setStep(0);
      }

      localStorage.removeItem("interview_prep_pending_category");
      localStorage.removeItem("interview_prep_pending_country");

      if (!isEmbedded) router.replace("/interview-prep");
    };

    void restorePurchasedCategory();
  }, [initialCheckDone, sessionId, router, selectedCountry, isEmbedded]);

  const handleCloseIntro = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem("dont_show_interview_narrative", "true");
    }
    setShowWhatsThis(false);
  };

  const handleInputChange = (key: string, value: unknown) => {
    const updatedFormData = { ...formData, [key]: value };
    setFormData(updatedFormData);
    if (error) {
      setError(null);
    }

    saveProgressToProfile(updatedFormData);

    if (sessionId) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const answers: Record<string, unknown> = {};
          Object.keys(formData).forEach((k) => {
            if (k !== "caseType" && k !== "visaCategory") {
              answers[k] = formData[k as keyof typeof formData];
            }
          });
          answers[key] = value;

          const answersResponse = await fetch(`/api/interview-prep/sessions/${sessionId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "update-answers",
              answers,
            }),
          });

          if (!answersResponse.ok) {
            console.error("Failed to save answer:", await answersResponse.text());
          }
        } catch (err) {
          console.error("Error saving answer:", err);
        }
      }, 500);
    }
  };

  const handleCategorySelect = (category: CategoryWithPurchaseStatus) => {
    setSelectedCategory(category);
    setError(null);
    setRepurchaseAddonId(null);
  };

  const redirectToInterviewPrepPurchase = () => {
    if (!selectedCategory) {
      return;
    }

    // Standalone: unlock with credits instead (unlimited sessions, every category).
    if (ipWallet.item) {
      setShowCreditModal(true);
      return;
    }

    // Inside a journey the journey plan decides access; per-category add-ons are no
    // longer sold, so the way in is a plan upgrade.
    router.push("/pricing?mode=plans");
  };

  const handlePurchaseRequired = () => {
    setError(null);
    setRepurchaseAddonId(null);
    redirectToInterviewPrepPurchase();
  };

  const handlePurchaseExhausted = (repurchase: PurchaseExhaustedData) => {
    setRepurchaseAddonId(repurchase.addon_id);
    setError(null);

    showToast(
      "You have used the interview prep session your purchase included for this category.",
      "info"
    );

    redirectToInterviewPrepPurchase();
  };

  const activateSession = async (session: InterviewSession, categorySlug: string) => {
    setSessionId(session.id);
    const src = isEmbedded ? "journey" : "tool";
    setSessionSource(src);
    setIsJourneySession(isEmbedded);
    setStoredSession(activeCandidateId, session.id, src, effectiveJourneyId);

    const catDataResponse = await fetch(`/api/interview-prep?category_slug=${categorySlug}`);
    const catData = await catDataResponse.json();

    if (!catData.success) {
      setError("Failed to load questionnaire");
      return;
    }

    setQuestionnaire({
      categorySlug,
      version: catData.questionnaire?.version || "1.0.0",
      lastUpdated: new Date().toISOString(),
      sections: catData.questionnaire?.sections || [],
    });

    setError(null);
    setStep(1);
  };

  const resolveTargetCandidateId = (categorySlug: string) => {
    const isMulti = isMultiCandidateCategorySlug(categorySlug);
    if (!isMulti || isEmbedded) {
      return journeyEnv.candidateId || activeCandidateId || "candidate-1";
    }

    const catSessions = existingSessions.filter((s) => s.category_slug === categorySlug);
    const usedCandIds = new Set(catSessions.map((s) => s.candidate_id || "candidate-1"));

    // If currently active candidate in context hasn't used this category yet, use it
    if (activeCandidateId && !usedCandIds.has(activeCandidateId)) {
      return activeCandidateId;
    }

    // Otherwise calculate next candidate-N
    let maxNum = 0;
    for (const s of catSessions) {
      const cId = s.candidate_id || "candidate-1";
      const match = cId.match(/candidate-?([0-9]+)/i);
      const num = match ? parseInt(match[1], 10) : 1;
      if (num > maxNum) maxNum = num;
    }
    for (const cId of usedCandIds) {
      const match = cId.match(/candidate-?([0-9]+)/i);
      const num = match ? parseInt(match[1], 10) : 1;
      if (num > maxNum) maxNum = num;
    }
    return `candidate-${Math.max(maxNum + 1, 1)}`;
  };

  const handleCategorySelectionNext = async () => {
    if (!selectedCategory) {
      setError(msg(E.TOOL_INTERVIEW_SELECT_CATEGORY));
      return;
    }

    const isMulti = isMultiCandidateCategorySlug(selectedCategory.categorySlug);
    const isNewSessionFlow =
      !isEmbedded &&
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("newSession") === "1";

    // In standalone mode, if the user doesn't already have an active session for this
    // category and it requires purchase (no legacy prepaid session), open the credit modal.
    // For multi-candidate categories in "new session" flow, starting a new candidate session
    // always costs 200 credits if there is no legacy prepaid remaining.
    if (
      !isEmbedded &&
      (isMulti
        ? (isNewSessionFlow || selectedCategory.requiresPurchase)
        : (!selectedCategory.activeSessionCount && selectedCategory.requiresPurchase))
    ) {
      setShowCreditModal(true);
      return;
    }

    try {
      setLoading(true);

      const categorySlug = selectedCategory.categorySlug;
      const targetCandidateId = resolveTargetCandidateId(categorySlug);

      const sessionResponse = await fetch("/api/interview-prep", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category_slug: categorySlug,
          user_email: localStorage.getItem("userEmail") || "test@example.com",
          user_name: localStorage.getItem("userName") || "User",
          source: isEmbedded ? "journey" : "tool",
          journey_id: effectiveJourneyId || undefined,
          journey_category: isEmbedded
            ? propJourneyCategory || journeyEnv.journeyCategory || undefined
            : undefined,
          candidate_id: targetCandidateId,
          forceNew: isNewSessionFlow,
        }),
      });

      const sessionResult = await sessionResponse.json();

      if (sessionResponse.status === 402) {
        setShowCreditModal(true);
        return;
      }

      // Journey session refused by the server (not this user's journey, journey
      // closed, or the journey plan does not include Interview Prep).
      if (
        isEmbedded &&
        (sessionResponse.status === 403 || sessionResponse.status === 404) &&
        typeof sessionResult?.message === "string"
      ) {
        setError(sessionResult.message);
        return;
      }

      if (!sessionResponse.ok || !sessionResult.success) {
        setError(sessionResult.message || msg(E.TOOL_INTERVIEW_SESSION_FAILED));
        return;
      }

      // Session already exists
      if (sessionResult.alreadyExists) {
        if (sessionResult.source === "journey") {
          await activateSession(sessionResult.session, categorySlug);
          return;
        }

        if (isEmbedded) {
          showToast("Session already exists for this category. Loading your session.", "info");
          if (sessionResult.session?.id) {
            await handleSelectSessionFromHistory(sessionResult.session.id);
            return;
          }
          setViewMode("sessions");
          return;
        }

        setIsRedirectingSession(true);
        setLoadingMessage("Redirecting to your existing session...");
        router.push("/interview-prep/my-sessions?message=session-exists");
        return;
      }

      // New session created
      await activateSession(sessionResult.session, categorySlug);
    } catch (err) {
      console.error("Error in category selection next:", err);
      setError(err instanceof Error ? err.message : msg(E.TOOL_INTERVIEW_SESSION_FAILED));
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const nextStep = async () => {
    if (step === 0 && !selectedCategory) {
      setError(msg(E.TOOL_INTERVIEW_SELECT_CATEGORY));
      return;
    }

    saveProgressToProfile();
    setStep((prev) => prev + 1);
    if (error) {
      setError(null);
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
    if (error) {
      setError(null);
    }

    if (sessionId) {
      const answers: Record<string, unknown> = {};
      Object.keys(formData).forEach((k) => {
        if (k !== "caseType" && k !== "visaCategory") {
          answers[k] = formData[k as keyof typeof formData];
        }
      });

      fetch(`/api/interview-prep/sessions/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-answers", answers }),
      }).catch((err) => console.error("Error saving answers on back:", err));
    }
  };

  const handleSubmit = async () => {
    if (!sessionId) {
      setError(msg(E.TOOL_INTERVIEW_NO_SESSION));
      return;
    }

    saveProgressToProfile();
    setLoading(true);
    setError(null);

    try {
      const submitResponse = await fetch(`/api/interview-prep/sessions/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "generate",
        }),
      });

      if (submitResponse.ok) {
        const responseData = await submitResponse.json();
        await new Promise((resolve) => setTimeout(resolve, 1200));

        setGeneratedResults(responseData.output);

        const completeResponse = await fetch(`/api/interview-prep/sessions/${sessionId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "complete",
          }),
        });

        if (!completeResponse.ok) {
          console.error("Failed to mark session as completed");
        }

        clearStoredSession(activeCandidateId, isEmbedded);
        setStep((prev) => prev + 1);

        await new Promise((resolve) => setTimeout(resolve, 100));
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const errorData = await submitResponse.text();
        console.error("Submit response error:", errorData);
        throw new Error(msg(E.TOOL_INTERVIEW_GENERATE_FAILED));
      }
    } catch (err) {
      console.error("Error submitting for interview prep:", err);
      setError(err instanceof Error ? err.message : msg(E.TOOL_INTERVIEW_GENERATE_FAILED));
    } finally {
      setLoading(false);
    }
  };

  // Render the appropriate step
  // Legacy per-category purchase ("interview-prep:<slug>") or the bare
  // all-categories add-on: standalone access to THIS category only.
  const selectedSlug = selectedCategory?.categorySlug;
  const hasLegacyCategoryPurchase =
    !isEmbedded &&
    !!selectedSlug &&
    plan.purchasedAddons.some(
      (id) => id === "interview-prep" || id === `interview-prep:${selectedSlug}`
    );

  const renderStep = () => {
    if (isRedirectingSession) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader size="md" />
          <p className="text-slate-600">Redirecting to my sessions...</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader size="md" />
          <p className="text-slate-600">{loadingMessage || "Loading..."}</p>
        </div>
      );
    }

    if (categoriesLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader size="md" />
          <p className="text-slate-600">{loadingMessage || "Loading visa categories..."}</p>
        </div>
      );
    }

    // Step 0: Category Selection
    if (step === 0) {
      const displayCategories =
        isEmbedded && targetCategorySlug
          ? availableCategories.filter((c) => c.categorySlug === targetCategorySlug)
          : availableCategories;

      return (
        <CategorySelectionStep
          categories={displayCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
          onNext={handleCategorySelectionNext}
          onBack={() => {
            setSelectedCategory(null);
            setError(null);
            setAvailableCategories([]);
          }}
          onPurchaseAgain={
            repurchaseAddonId ? () => redirectToInterviewPrepPurchase() : undefined
          }
          onOpenMySessions={() => {
            if (isEmbedded) {
              setViewMode("sessions");
            } else {
              router.push("/interview-prep/my-sessions");
            }
          }}
          isJourney={isEmbedded || isJourneySession}
          journeyTier={effectiveJourneyTier}
          error={error}
        />
      );
    }

    // Steps 1-N: Dynamic Question Sections
    if (step > 0 && questionnaire && step <= questionnaire.sections.length) {
      const sectionIndex = step - 1;
      const section = questionnaire.sections[sectionIndex];

      return (
        <DynamicQuestionStep
          section={section}
          formData={formData as unknown as Record<string, unknown>}
          onChange={handleInputChange}
          onNext={nextStep}
          onBack={prevStep}
          setError={setError}
        />
      );
    }

    // Step N+1: Review
    if (questionnaire && step === questionnaire.sections.length + 1) {
      return (
        <ReviewStep
          formData={formData as InterviewFormData}
          error={error}
          loading={loading}
          onSubmit={handleSubmit}
          onBack={prevStep}
          categorySlug={questionnaire.categorySlug}
          sections={questionnaire.sections}
        />
      );
    }

    // Step N+2: Results
    if (questionnaire && step === questionnaire.sections.length + 2) {
      if (!sessionId) {
        return (
          <div className="text-center py-8">
            <p className="text-slate-600">Loading results...</p>
          </div>
        );
      }
      return (
        <ResultGate
          feature="basic_interview_prep"
          standaloneToolId={isEmbedded ? undefined : "interview-prep"}
          standaloneGranted={hasLegacyCategoryPurchase}
          title="Your Interview Prep Plan Is Ready"
          description="Upgrade to Basic or above to unlock your personalised interview questions and preparation guide."
          minHeight="400px"
        >
          <ResultPage
            sessionId={sessionId}
            results={generatedResults}
            isStandalone={!isEmbedded}
            standaloneGranted={hasLegacyCategoryPurchase}
            onRestart={() => {
              setStep(0);
              setSessionId(null);
              setSelectedCategory(null);
              setFormData({ caseType: "" });
              setGeneratedResults(null);
              if (!isEmbedded) {
                router.push("/interview-prep");
              }
            }}
          />
        </ResultGate>
      );
    }

    return <div>Unknown step</div>;
  };

  const getSectionColor = (sectionId: string): { color: string; lightColor: string } => {
    const colorMap: Record<string, { color: string; lightColor: string }> = {
      marriage_and_basic_info: { color: "#db8090", lightColor: "#fce8ec" },
      relationship_origin: { color: "#db8090", lightColor: "#fce8ec" },
      relationship_strength: { color: "#9c6f38", lightColor: "#f3ede7" },
      family_and_social: { color: "#89a4a0", lightColor: "#e8f0ed" },
      petitioner_and_plans: { color: "#0d7377", lightColor: "#e8f6f6" },
      background_check: { color: "#db8090", lightColor: "#fce8ec" },
    };
    return colorMap[sectionId] || { color: "#0d7377", lightColor: "#e8f6f6" };
  };

  const renderProgressSections = () => {
    if (!questionnaire || step === 0) return null;

    const sections = questionnaire.sections;
    const currentSectionIndex = step - 1;
    const totalSteps = sections.length + 2;
    const progressPercentage = Math.round(((step - 1) / totalSteps) * 100);

    const currentSection = sections[currentSectionIndex];
    const currentColor = currentSection ? getSectionColor(currentSection.id).color : "#0d7377";

    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-slate-700">
            Step {step} of {totalSteps}
          </span>
          <span className="text-sm font-medium text-slate-700">{progressPercentage}% Complete</span>
        </div>

        <div className="w-full bg-slate-200 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all duration-500 ease-in-out"
            style={{
              width: `${progressPercentage > 100 ? 100 : progressPercentage}%`,
              backgroundColor: currentColor,
            }}
          ></div>
        </div>

        {/* Desktop View */}
        <div className="mt-4 hidden md:grid md:grid-cols-4 lg:grid-cols-5 gap-3">
          {sections.map((section, index) => {
            const isActive = index === currentSectionIndex;
            const isCompleted = index < currentSectionIndex;
            const { color, lightColor } = getSectionColor(section.id);

            return (
              <div
                key={index}
                className="p-3 rounded-lg text-center text-xs font-medium transition-all border-2"
                style={
                  isActive
                    ? { backgroundColor: color, borderColor: color, color: "white" }
                    : isCompleted
                      ? { backgroundColor: lightColor, borderColor: lightColor, color }
                      : { backgroundColor: "#f1f5f9", borderColor: "#e2e8f0", color: "#64748b" }
                }
              >
                <div className="font-semibold truncate">
                  {section.title.substring(0, 20)}
                  {section.title.length > 20 ? "..." : ""}
                </div>
                <div className="text-[10px] mt-1 opacity-80">Step {index + 1}</div>
              </div>
            );
          })}

          {/* Review Step Indicator */}
          <div
            className="p-3 rounded-lg text-center text-xs font-medium transition-all border-2"
            style={
              step === sections.length + 1
                ? { backgroundColor: "#0d7377", borderColor: "#0d7377", color: "white" }
                : step > sections.length + 1
                  ? { backgroundColor: "#e8f6f6", borderColor: "#e8f6f6", color: "#0d7377" }
                  : { backgroundColor: "#f1f5f9", borderColor: "#e2e8f0", color: "#64748b" }
            }
          >
            <div className="font-semibold">Review</div>
            <div className="text-[10px] mt-1 opacity-80">Step {sections.length + 1}</div>
          </div>

          {/* Results Step Indicator */}
          <div
            className="p-3 rounded-lg text-center text-xs font-medium transition-all border-2"
            style={
              step === sections.length + 2
                ? { backgroundColor: "#0d7377", borderColor: "#0d7377", color: "white" }
                : { backgroundColor: "#f1f5f9", borderColor: "#e2e8f0", color: "#64748b" }
            }
          >
            <div className="font-semibold">Results</div>
            <div className="text-[10px] mt-1 opacity-80">Step {sections.length + 2}</div>
          </div>
        </div>

        {/* Mobile View with Sheet */}
        <div className="mt-4 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="w-full flex justify-between items-center bg-slate-50 border-slate-200 shadow-sm text-slate-700"
              >
                <span>View All Steps</span>
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: currentColor + "20", color: currentColor }}
                >
                  {step}/{totalSteps}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-xl pb-8">
              <SheetHeader className="pb-4">
                <SheetTitle>Interview Preparations Steps</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[60vh] pb-4">
                {sections.map((section, index) => {
                  const isActive = index === currentSectionIndex;
                  const isCompleted = index < currentSectionIndex;
                  const { color, lightColor } = getSectionColor(section.id);

                  return (
                    <div
                      key={index}
                      className="p-3 rounded-lg text-center text-xs font-medium transition-all border-2"
                      style={
                        isActive
                          ? {
                              backgroundColor: color,
                              borderColor: color,
                              color: "white",
                              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                            }
                          : isCompleted
                            ? { backgroundColor: lightColor, borderColor: lightColor, color }
                            : {
                                backgroundColor: "#f1f5f9",
                                borderColor: "#e2e8f0",
                                color: "#64748b",
                              }
                      }
                    >
                      <div className="font-semibold truncate">
                        {section.title.substring(0, 20)}
                        {section.title.length > 20 ? "..." : ""}
                      </div>
                      <div className="text-[10px] mt-1 opacity-80">Step {index + 1}</div>
                    </div>
                  );
                })}

                {/* Review Step Indicator */}
                <div
                  className="p-3 rounded-lg text-center text-xs font-medium transition-all border-2"
                  style={
                    step === sections.length + 1
                      ? {
                          backgroundColor: "#0d7377",
                          borderColor: "#0d7377",
                          color: "white",
                          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        }
                      : step > sections.length + 1
                        ? { backgroundColor: "#e8f6f6", borderColor: "#e8f6f6", color: "#0d7377" }
                        : { backgroundColor: "#f1f5f9", borderColor: "#e2e8f0", color: "#64748b" }
                  }
                >
                  <div className="font-semibold">Review</div>
                  <div className="text-[10px] mt-1 opacity-80">Step {sections.length + 1}</div>
                </div>

                {/* Results Step Indicator */}
                <div
                  className="p-3 rounded-lg text-center text-xs font-medium transition-all border-2"
                  style={
                    step === sections.length + 2
                      ? {
                          backgroundColor: "#0d7377",
                          borderColor: "#0d7377",
                          color: "white",
                          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        }
                      : { backgroundColor: "#f1f5f9", borderColor: "#e2e8f0", color: "#64748b" }
                  }
                >
                  <div className="font-semibold">Results</div>
                  <div className="text-[10px] mt-1 opacity-80">Step {sections.length + 2}</div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    );
  };

  // Render Session History embedded view
  if (viewMode === "sessions") {
    return (
      <MyInterviewSessions
        isEmbedded={true}
        journeyId={effectiveJourneyId}
        journeyCategory={journeySlugOrKey}
        categorySlug={targetCategorySlug}
        onSelectSession={handleSelectSessionFromHistory}
        onNewSession={handleNewSessionFromHistory}
        onBackToPrep={() => setViewMode("prep")}
      />
    );
  }

  return (
    <>
      {showCreditModal && (
        <CreditLaunchModal
          item={{
            ...(ipWallet.item || {
              resourceType: "tool" as const,
              resourceId: "interview-prep",
              name: "Interview Prep",
              credits: 200,
              legacyAddonId: "interview-prep",
              legacyGrantsUnlock: false,
              launchable: false,
            }),
            name: selectedCategory
              ? `Interview Prep (${selectedCategory.displayName || selectedCategory.categoryName})`
              : "Interview Prep Session",
            credits: 200,
          }}
          onClose={() => setShowCreditModal(false)}
          onConfirm={async () => {
            if (!selectedCategory) {
              return { success: false, error: "Please select a category first." };
            }
            const targetCandidateId = resolveTargetCandidateId(selectedCategory.categorySlug);

            const sessionResponse = await fetch("/api/interview-prep", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                category_slug: selectedCategory.categorySlug,
                user_email: localStorage.getItem("userEmail") || "test@example.com",
                user_name: localStorage.getItem("userName") || "User",
                source: "tool",
                candidate_id: targetCandidateId,
                forceNew: true,
              }),
            });
            const sessionResult = await sessionResponse.json();
            if (sessionResponse.status === 402) {
              return {
                success: false,
                error: "INSUFFICIENT_CREDITS",
                required: sessionResult.required ?? 200,
                available: sessionResult.available ?? 0,
                deficit: sessionResult.deficit ?? 200,
                topupAmount: sessionResult.topupAmount ?? 200,
              };
            }
            if (!sessionResponse.ok || !sessionResult.success) {
              return {
                success: false,
                error: sessionResult.message || msg(E.TOOL_INTERVIEW_SESSION_FAILED),
              };
            }

            // Pre-load category questionnaire so Step 1 renders immediately upon modal close
            const catDataResponse = await fetch(
              `/api/interview-prep?category_slug=${selectedCategory.categorySlug}`
            );
            const catData = await catDataResponse.json();
            if (catData.success && catData.questionnaire) {
              setQuestionnaire({
                categorySlug: selectedCategory.categorySlug,
                version: catData.questionnaire?.version || "1.0.0",
                lastUpdated: new Date().toISOString(),
                sections: catData.questionnaire?.sections || [],
              });
            }

            createdSessionRef.current = sessionResult.session;
            return { success: true };
          }}
          onLaunched={() => {
            setShowCreditModal(false);
            void refreshWallet();
            if (createdSessionRef.current && selectedCategory) {
              const session = createdSessionRef.current;
              createdSessionRef.current = null;
              const sessionCandId = session.candidate_id || "candidate-1";

              // Sync candidate to CandidateContext if not already present
              if (
                candidateCtx?.addCandidate &&
                !candidateCtx.candidates.some((c) => c.id === sessionCandId)
              ) {
                try {
                  candidateCtx.addCandidate({
                    relation: "Other",
                    fullName: `Candidate ${sessionCandId.replace(/[^0-9]/g, "")}`,
                    visaCategory: selectedCategory.displayName || "IR-5",
                  });
                } catch (err) {
                  console.warn("Could not sync candidate to context:", err);
                }
              }
              if (candidateCtx?.setActiveCandidateId) {
                candidateCtx.setActiveCandidateId(sessionCandId);
              }

              setSessionId(session.id);
              setSessionSource("tool");
              setIsJourneySession(false);
              setStoredSession(sessionCandId, session.id, "tool", null);
              setExistingSessions((prev) => [session, ...prev]);
              setError(null);
              setStep(1);
              showToast("Interview Prep session started! 200 credits deducted.", "success");
            }
          }}
        />
      )}
      {entryMode !== "tool" ? (
        <div className="site-main-px site-main-py mt-12 flex min-h-[60vh] items-center justify-center">
          <Loader size="md" text="Loading interview prep..." />
        </div>
      ) : (
        <>
          <div className={`site-main-px ${isEmbedded ? "py-4" : "site-main-py"} ${isEmbedded ? "mt-2" : "mt-12"}`}>
            {isEmbedded && (
              <div className="mb-6 flex justify-center">
                <div className="inline-flex rounded-full bg-slate-100 p-1 border border-slate-200 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode("prep")}
                    className={`rounded-full px-5 py-1.5 text-sm font-semibold transition-all ${
                      viewMode === "prep"
                        ? "bg-[#0d7377] text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Interview Preparation
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("sessions")}
                    className={`rounded-full px-5 py-1.5 text-sm font-semibold transition-all ${
                      viewMode === "sessions"
                        ? "bg-[#0d7377] text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Session History
                  </button>
                </div>
              </div>
            )}

            <div className="text-center mb-8">
              {isMultiCandidate && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-3">
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    Beneficiary: {activeCandidate.fullName || activeCandidate.label} ({activeCandidate.relation})
                  </span>
                </div>
              )}
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Interview Preparation Tool</h1>
              <p className="text-slate-600">
                {selectedCategory
                  ? selectedCategory.description
                  : "Prepare for your visa interview with personalized questions"}
              </p>
            </div>

            {renderProgressSections()}

            <Card className="p-6 shadow-lg">
              {!initialCheckDone ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader size="md" />
                  <p className="text-slate-600">{loadingMessage || "Loading..."}</p>
                </div>
              ) : (
                renderStep()
              )}
            </Card>
          </div>

          {/* Session Restoration Confirmation Modal */}
          <ConfirmationModal
            open={restoreSessionModalOpen}
            onOpenChange={(open) => {
              setRestoreSessionModalOpen(open);
              if (!open) setPendingRestoreSession(null);
            }}
            title="Resume Interview Session"
            description={`We found an incomplete interview session from ${pendingRestoreSession?.updated_at ? new Date(pendingRestoreSession.updated_at).toLocaleDateString() : ""}. Would you like to continue where you left off?`}
            confirmText="Resume Session"
            confirmVariant="primary"
            onConfirm={async () => {
              if (pendingRestoreSession) {
                try {
                  setLoading(true);
                  setLoadingMessage("Restoring your interview session...");
                  setStoredSession(activeCandidateId, pendingRestoreSession.id, "tool");

                  await restoreSessionData(pendingRestoreSession, (categorySlug: string) => {
                    const category = availableCategories.find(
                      (c) => c.categorySlug === categorySlug
                    );
                    return category;
                  });

                  setRestoreSessionModalOpen(false);
                } catch (error) {
                  console.error("Error restoring session:", error);
                  setRestoreSessionModalOpen(false);
                } finally {
                  setLoading(false);
                }
              }
            }}
          />
        </>
      )}
    </>
  );
}

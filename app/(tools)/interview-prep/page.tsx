"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useRouter } from "next/navigation";
import { ResultPage } from "./result/ResultPage";
import { Loader } from "@/components/ui/spinner";
import { InterviewPrepOutput } from "../../../lib/interview-prep/types";
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
import { useToast } from "@/app/components/shared/ToastProvider";
import { useCandidate } from "@/app/context/CandidateContext";
import { Users } from "lucide-react";

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

export default function InterviewPreparation() {
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

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [generatedResults, setGeneratedResults] = useState<InterviewPrepOutput | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [sessionRestorationAttempted, setSessionRestorationAttempted] = useState(false);

  // Journey session tracking
  const [sessionSource, setSessionSource] = useState<"journey" | "tool">("tool");
  const [journeyId, setJourneyId] = useState<string | null>(null);
  const [isJourneySession, setIsJourneySession] = useState(false);

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

  // NEW: Confirmation modal state for session restoration
  const [restoreSessionModalOpen, setRestoreSessionModalOpen] = useState(false);
  const [pendingRestoreSession, setPendingRestoreSession] = useState<RestorableSession | null>(
    null
  );
  const [isRedirectingSession, setIsRedirectingSession] = useState(false);

  const { user } = useAuth();
  const { profile, isProfileLoading, updateProfile } = useUserProfile();
  const { showToast } = useToast();
  const { activeCandidate, activeCandidateId, isMultiCandidate } = useCandidate();

  const STANDALONE_SESSION_KEY = "standalone_interview_prep_session_id";
  const getSessionIdKey = (cId: string) => `interviewPrepSessionId_${cId}`;
  const getSessionSourceKey = (cId: string) => `interviewPrepSessionSource_${cId}`;
  const getSessionJourneyKey = (cId: string) => `interviewPrepJourneyId_${cId}`;

  const getStoredSessionId = (cId: string, isJourney: boolean = false) => {
    if (typeof window === "undefined") return null;
    if (!isJourney) {
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

    const params = new URLSearchParams(window.location.search);
    const hasJourneyOrSession = params.has("journey_id") || params.has("sessionId");
    const isNewSessionFlow = params.get("newSession") === "1";

    if (!hasJourneyOrSession && !isNewSessionFlow) {
      setEntryMode("redirect");
      router.replace("/interview-prep/my-sessions");
      return;
    }

    setEntryMode("tool");
  }, [router]);

  const saveProgressToProfile = (currentFormData = formData) => {
    if (!user) return;
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

  // Auto-fill profile data (from central context)
  useEffect(() => {
    if (isProfileLoading || profileLoaded || !profile) return;

    // Map profile data to form structure
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
      const shouldFilterExistingSessions = params.get("newSession") === "1";

      const [categoriesResponse, sessionsResponse] = await Promise.all([
        fetch(`/api/interview-prep/categories?country=${encodeURIComponent(country)}`),
        shouldFilterExistingSessions ? fetch("/api/interview-prep/user-sessions") : null,
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

        if (shouldFilterExistingSessions && sessionsResponse?.ok) {
          const sessionsData = await sessionsResponse.json();
          const usedCategorySlugs = new Set<string>(
            Array.isArray(sessionsData.sessions)
              ? sessionsData.sessions
                  .map((session: { category_slug?: string }) => session.category_slug)
                  .filter((slug: string | undefined): slug is string => Boolean(slug))
              : []
          );

          filteredCategories = loadedCategories.filter(
            (category) => !usedCategorySlugs.has(category.categorySlug)
          );
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

  const restoreSessionData = async (
    session: RestorableSession,
    getCategoryFn: (slug: string) => CategoryWithPurchaseStatus | undefined
  ) => {
    try {
      setSessionId(session.id);
      const categorySlug = session.category_slug;
      const category = getCategoryFn(categorySlug);

      if (!category && availableCategories.length > 0) {
        clearStoredSession(activeCandidateId);
        return;
      }

      if (category) {
        setSelectedCategory(category);

        // Load questionnaire for the restored category
        const catDataResponse = await fetch(`/api/interview-prep?category_slug=${categorySlug}`);
        const catData = await catDataResponse.json();

        if (catData.success) {
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

  // Check for existing/incomplete session on initial mount only
  useEffect(() => {
    if (sessionRestorationAttempted) return; // Skip if already attempted

    const restoreIncompleteSession = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const journeyId = urlParams.get("journey_id");
        const sessionIdParam = urlParams.get("sessionId");
        const isNewSessionFlow = urlParams.get("newSession") === "1";

        if (!isNewSessionFlow && !journeyId && !sessionIdParam) {
          setSessionRestorationAttempted(true);
          return;
        }

        if (isNewSessionFlow && !journeyId && !sessionIdParam) {
          setSessionSource("tool");
          setIsJourneySession(false);
          setSessionRestorationAttempted(true);
          setLoading(false);
          setLoadingMessage("");
          return;
        }

        // Set loading immediately to prevent modals from flashing
        setLoading(true);
        setLoadingMessage("Checking for existing sessions...");

        console.log("Journey ID from URL:", journeyId);

        // FIRST: Check for active journey session (IR-1)
        // Journey sessions take priority over tool-based sessions
        const journeyResponse = await fetch(
          `/api/interview-prep/active-journey-session?journey_id=${journeyId}`
        );
        const journeyData = await journeyResponse.json();

        if (journeyData.success && journeyData.hasActiveJourney && journeyData.session) {
          // Found an active journey session - use it
          console.log("[InterviewPrep] Found active journey session:", journeyData.journey_id);

          setSessionId(journeyData.session.id);
          setJourneyId(journeyData.journey_id);
          setSessionSource("journey");
          setIsJourneySession(true);

          // Store in candidate-scoped storage for persistence
          setStoredSession(
            activeCandidateId,
            journeyData.session.id,
            "journey",
            journeyData.journey_id
          );

          // Load category data and restore session state
          const categorySlug = journeyData.session.category_slug || "ir-1-spouse";
          const catDataResponse = await fetch(`/api/interview-prep?category_slug=${categorySlug}`);
          const catData = await catDataResponse.json();

          if (catData.success) {
            // Find and set the category (don't filter by country - journey categories are always available)
            const categoriesResponse = await fetch(`/api/interview-prep/categories`);
            const categoriesData = await categoriesResponse.json();

            if (categoriesData.success && categoriesData.categories) {
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

                // Restore form data if available
                if (journeyData.session.answers && Array.isArray(journeyData.session.answers)) {
                  const answersMap: Record<string, unknown> = {};
                  journeyData.session.answers.forEach(
                    (answer: { question_key: string; answer_value: unknown }) => {
                      answersMap[answer.question_key] = answer.answer_value;
                    }
                  );
                  setFormData((prev) => ({ ...prev, ...answersMap }));
                }

                // If results were generated, show them; otherwise show questionnaire
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
                  setStep((catData.questionnaire?.sections?.length || 0) + 2); // Show results
                } else {
                  setStep(1); // Start questionnaire
                }
              }
            }
          }

          setSessionRestorationAttempted(true);
          setLoading(false);
          setLoadingMessage("");
          return;
        }

        // No active journey session - proceed with tool-based session flow
        setSessionSource("tool");
        setIsJourneySession(false);

        // Check for sessionId query parameter first (for completed session revisit)
        // const urlParams = new URLSearchParams(window.location.search);
        if (sessionIdParam) {
          setLoading(true);
          setLoadingMessage("Loading your completed interview...");
          const userEmail =
            typeof window !== "undefined"
              ? localStorage.getItem("userEmail") || "test@example.com"
              : "test@example.com";
          const response = await fetch(
            `/api/interview-prep/sessions/${sessionIdParam}?userEmail=${encodeURIComponent(userEmail)}`
          );
          const sessionData = await response.json();

          if (response.ok && sessionData.session && sessionData.session.interview_prep_results) {
            // Found a completed session, load results directly
            setSessionId(sessionIdParam);
            setGeneratedResults(sessionData.session.interview_prep_results.generated_questions);
            setStep(questionnaire ? questionnaire.sections.length + 2 : 4);
            setLoading(false);
            setLoadingMessage("");
            setSessionRestorationAttempted(true);

            // Track session source from restored session
            if (sessionData.session.source === "journey") {
              setSessionSource("journey");
              setIsJourneySession(true);
              setJourneyId(sessionData.session.journey_id);
            }
            return;
          }
        }

        // Check for saved session in candidate-scoped storage first (current browser/session)
        const savedSessionId = getStoredSessionId(activeCandidateId);
        const savedSessionSource = getStoredSessionSource(activeCandidateId);

        if (savedSessionId && step === 0) {
          const response = await fetch(`/api/interview-prep/sessions/${savedSessionId}`);
          const sessionData = await response.json();

          if (response.ok && sessionData.session && sessionData.session.completed === false) {
            // Track session source
            const source = sessionData.session.source || savedSessionSource || "tool";
            setSessionSource(source);
            if (source === "journey") {
              setIsJourneySession(true);
              setJourneyId(sessionData.session.journey_id);
            }

            await restoreSessionData(sessionData.session, (categorySlug: string) => {
              const category = availableCategories.find((c) => c.categorySlug === categorySlug);
              return category;
            });
            setLoading(false);
            setSessionRestorationAttempted(true);
            return;
          } else {
            clearStoredSession(activeCandidateId);
          }
        }

        // Check for latest incomplete session from database (cross-device/browser recovery)
        // This runs automatically if no saved session in localStorage
        if (!savedSessionId && step === 0 && typeof window !== "undefined") {
          const latestResponse = await fetch(`/api/interview-prep/latest-incomplete-session`);
          const latestData = await latestResponse.json();

          // Only restore if session has NO generated results (truly at questionnaire stage)
          // Also skip journey sessions here - they're handled above
          if (
            latestData.success &&
            latestData.session &&
            !latestData.session.results &&
            latestData.session.source !== "journey"
          ) {
            // Found an incomplete tool-based session - offer to restore it via modal
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on initial mount to avoid auto-restoring when categories load

  useEffect(() => {
    if (hasInitializedModal.current) return;
    if (!initialCheckDone) return; // Wait for session check to complete
    if (sessionId) return; // Don't show if session was restored

    hasInitializedModal.current = true;

    const localHide =
      typeof window !== "undefined" &&
      localStorage.getItem("dont_show_interview_narrative") === "true";

    // show only if not hidden by session or localStorage
    if (!localHide) {
      setShowWhatsThis(true);
    } else {
      setShowWhatsThis(false);
    }
  }, [initialCheckDone, sessionId]);

  // When session restoration check completes, mark initial check as done
  useEffect(() => {
    if (sessionRestorationAttempted && !initialCheckDone) {
      setInitialCheckDone(true);
      setLoading(false);
      setLoadingMessage("");
    }
  }, [sessionRestorationAttempted, initialCheckDone]);

  useEffect(() => {
    if (!initialCheckDone) {
      return;
    }

    if (sessionId) {
      return;
    }

    if (purchaseReturnHandledRef.current) {
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
        router.replace("/interview-prep");
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

      router.replace("/interview-prep");
    };

    void restorePurchasedCategory();
  }, [initialCheckDone, sessionId, router, selectedCountry]);

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

    // Debounce the save operation to prevent rapid API calls
    if (sessionId) {
      // Clear the existing timeout if there is one
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set a new timeout to save the answers after 500ms
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          // Filter out non-question fields before saving and cast to any for API
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
      }, 500); // Wait 500ms before saving
    }
  };

  // Handle category selection
  const handleCategorySelect = (category: CategoryWithPurchaseStatus) => {
    setSelectedCategory(category);
    setError(null);
    setRepurchaseAddonId(null);
  };

  const redirectToInterviewPrepPurchase = (categoryAddonId: string) => {
    if (!selectedCategory) {
      return;
    }

    const categorySlug = selectedCategory.categorySlug;

    localStorage.setItem("interview_prep_pending_category", categorySlug);

    if (selectedCountry) {
      localStorage.setItem("interview_prep_pending_country", selectedCountry);
    }

    const params = new URLSearchParams({
      mode: "tools",

      // Keep the category-specific entitlement ID.
      addons: categoryAddonId,

      step: "review",
      interview_category: categorySlug,
    });

    router.push(`/pricing?${params.toString()}`);
  };

  const handlePurchaseRequired = (addon: PurchaseRequiredAddon) => {
    setError(null);
    setRepurchaseAddonId(null);

    redirectToInterviewPrepPurchase(addon.id);
  };

  const handlePurchaseExhausted = (repurchase: PurchaseExhaustedData) => {
    setRepurchaseAddonId(repurchase.addon_id);
    setError(null);

    showToast(
      "You have already used your purchased interview prep session for this category. Purchase another session to continue.",
      "info"
    );

    redirectToInterviewPrepPurchase(repurchase.addon_id);
  };

  // Handle progressing from category selection to questions
  const handleCategorySelectionNext = async () => {
    if (!selectedCategory) {
      setError(msg(E.TOOL_INTERVIEW_SELECT_CATEGORY));
      return;
    }

    try {
      if (selectedCategory.purchaseExhausted && selectedCategory.addonId) {
        showToast(
          "You have already used your purchased interview prep session for this category. Purchase another session to continue.",
          "info"
        );
        redirectToInterviewPrepPurchase(selectedCategory.addonId);
        return;
      }

      setLoading(true);

      const categorySlug = selectedCategory.categorySlug;

      // Always ask backend first
      const sessionResponse = await fetch("/api/interview-prep", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category_slug: categorySlug,
          user_email: localStorage.getItem("userEmail") || "test@example.com",
          user_name: localStorage.getItem("userName") || "User",
        }),
      });

      const sessionResult = await sessionResponse.json();

      // Handle purchase required (402 status)
      if (sessionResponse.status === 402) {
        const purchaseError = sessionResult as PurchaseErrorResponse;

        if (purchaseError.error === "PURCHASE_REQUIRED" && purchaseError.addon) {
          handlePurchaseRequired(purchaseError.addon);
          return;
        }

        if (purchaseError.error === "PURCHASE_EXHAUSTED" && purchaseError.repurchase) {
          handlePurchaseExhausted(purchaseError.repurchase);
          return;
        }

        setError(purchaseError.message || msg(E.TOOL_INTERVIEW_SESSION_FAILED));

        return;
      }

      if (!sessionResponse.ok || !sessionResult.success) {
        setError(msg(E.TOOL_INTERVIEW_SESSION_FAILED));
        return;
      }

      // SESSION ALREADY EXISTS
      if (sessionResult.alreadyExists) {
        // If it's a journey session (active journey), use it directly
        if (sessionResult.source === "journey") {
          const existingSession = sessionResult.session;
          setSessionId(existingSession.id);
          setSessionSource("journey");
          setIsJourneySession(true);
          setJourneyId(existingSession.journey_id || null);

          setStoredSession(
            activeCandidateId,
            existingSession.id,
            "journey",
            existingSession.journey_id
          );

          const existCatDataResponse = await fetch(
            `/api/interview-prep?category_slug=${categorySlug}`
          );
          const existCatData = await existCatDataResponse.json();

          if (existCatData.success) {
            setQuestionnaire({
              categorySlug: selectedCategory.categorySlug,
              version: existCatData.questionnaire?.version || "1.0.0",
              lastUpdated: new Date().toISOString(),
              sections: existCatData.questionnaire?.sections || [],
            });
            setError(null);
            setStep(1);
          }
          return;
        }

        // Tool session already exists for this category - redirect to My Sessions
        setIsRedirectingSession(true);
        setLoadingMessage("Redirecting to your existing session...");
        router.push("/interview-prep/my-sessions?message=session-exists");
        return;
      }

      // NEW SESSION CREATED
      const newSessionId = sessionResult.session.id;

      setSessionId(newSessionId);

      // Track session source (tool-based session created via category selection)
      setSessionSource("tool");
      setIsJourneySession(false);

      // Store session info in candidate-scoped storage
      setStoredSession(activeCandidateId, newSessionId, "tool");

      // Load questionnaire
      const catDataResponse = await fetch(`/api/interview-prep?category_slug=${categorySlug}`);

      const catData = await catDataResponse.json();

      if (!catData.success) {
        setError("Failed to load questionnaire");
        return;
      }

      setQuestionnaire({
        categorySlug: selectedCategory.categorySlug,
        version: catData.questionnaire?.version || "1.0.0",
        lastUpdated: new Date().toISOString(),
        sections: catData.questionnaire?.sections || [],
      });

      setError(null);

      // Move to first section
      setStep(1);
    } catch (err) {
      console.error("Error in category selection next:", err);

      setError(err instanceof Error ? err.message : msg(E.TOOL_INTERVIEW_SESSION_FAILED));
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const nextStep = async () => {
    // At step 0, validate category selection
    if (step === 0 && !selectedCategory) {
      setError(msg(E.TOOL_INTERVIEW_SELECT_CATEGORY));
      return;
    }

    saveProgressToProfile();
    // For other steps, we are handling validation through the child component (DynamicQuestionStep)
    // This function just advances to the next step after validation passes
    setStep((prev) => prev + 1);
    if (error) {
      setError(null);
    }
  };

  const prevStep = () => {
    // Navigate immediately — don't wait for the save
    setStep((prev) => prev - 1);
    if (error) {
      setError(null);
    }

    // Save answers in the background (fire-and-forget)
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
      // Submit for generating interview prep
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

        // Longer delay to ensure loading state is visible
        await new Promise((resolve) => setTimeout(resolve, 1200));

        // Store the generated results locally instead of navigating
        setGeneratedResults(responseData.output);

        // Mark the session as completed
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

        // Remove the session from candidate-scoped storage since it's now completed
        clearStoredSession(activeCandidateId);

        // Increment step to show results on the same page
        setStep((prev) => prev + 1);

        // Auto-scroll to top to show results
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
  const renderStep = () => {
    if (isRedirectingSession) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader size="md" />
          <p className="text-slate-600">Redirecting to my sessions...</p>
        </div>
      );
    }

    // Loading state with context-aware messages
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
      return (
        <CategorySelectionStep
          categories={availableCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
          onNext={handleCategorySelectionNext}
          onBack={() => {
            setSelectedCategory(null);
            setError(null);
            setAvailableCategories([]);
          }}
          onPurchaseAgain={
            repurchaseAddonId ? () => redirectToInterviewPrepPurchase(repurchaseAddonId) : undefined
          }
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
          title="Your Interview Prep Plan Is Ready"
          description="Upgrade to Basic or above to unlock your personalised interview questions and preparation guide."
          minHeight="400px"
        >
          <ResultPage
            sessionId={sessionId}
            results={generatedResults}
            onRestart={() => {
              setStep(0);
              setSessionId(null);
              setSelectedCategory(null);
              setFormData({ caseType: "" });
              router.push("/interview-prep");
            }}
          />
        </ResultGate>
      );
    }

    return <div>Unknown step</div>;
  };

  // Section color palette - matches review-step.tsx and dynamic-question-step.tsx
  const getSectionColor = (sectionId: string): { color: string; lightColor: string } => {
    const colorMap: Record<string, { color: string; lightColor: string }> = {
      // Step 1: Marriage & Basic Info - Rose
      marriage_and_basic_info: { color: "#db8090", lightColor: "#fce8ec" },
      // Step 2: Relationship Origin - Rose
      relationship_origin: { color: "#db8090", lightColor: "#fce8ec" },
      // Step 3: Relationship Strength - Amber
      relationship_strength: { color: "#9c6f38", lightColor: "#f3ede7" },
      // Step 4: Family & Social - Sage
      family_and_social: { color: "#89a4a0", lightColor: "#e8f0ed" },
      // Step 5: Petitioner & Plans - Teal
      petitioner_and_plans: { color: "#0d7377", lightColor: "#e8f6f6" },
      // Step 6: Background Check - Rose
      background_check: { color: "#db8090", lightColor: "#fce8ec" },
    };
    return colorMap[sectionId] || { color: "#0d7377", lightColor: "#e8f6f6" };
  };

  const renderProgressSections = () => {
    if (!questionnaire || step === 0) return null;

    const sections = questionnaire.sections;
    const currentSectionIndex = step - 1;
    const totalSteps = sections.length + 2; // +2 for review and results
    const progressPercentage = Math.round(((step - 1) / totalSteps) * 100);

    // Get current section's color for progress bar
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

  return (
    <>
      {entryMode !== "tool" ? (
        <div className="site-main-px site-main-py mt-12 flex min-h-[60vh] items-center justify-center">
          <Loader size="md" text="Loading interview prep..." />
        </div>
      ) : (
        <>
          <div className="site-main-px site-main-py mt-12">
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

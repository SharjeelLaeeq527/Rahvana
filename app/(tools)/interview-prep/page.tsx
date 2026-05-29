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
import { CategorySelectionStep } from "@/app/components/interview-prep/category-selection-step";
import { DynamicQuestionStep } from "@/app/components/interview-prep/dynamic-question-step";
import CountrySelectionModal from "../../components/interview-prep/CountrySelectionModal";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import type { InterviewFormData } from "@/app/components/interview-prep/types";
import { ResultGate } from "@/app/components/entitlements/ResultGate";

import type {
  InterviewCategoryConfig,
  DynamicQuestionnaire,
} from "@/data/interview-categories/schema";

export default function InterviewPreparation() {
  const [selectedCategory, setSelectedCategory] = useState<InterviewCategoryConfig | null>(null);
  const [questionnaire, setQuestionnaire] = useState<DynamicQuestionnaire | null>(null);
  const [availableCategories, setAvailableCategories] = useState<InterviewCategoryConfig[]>([]);
  const [showCountryModal, setShowCountryModal] = useState<boolean>(true);
  const [noDataMessage, setNoDataMessage] = useState<string | null>(null);

  const [step, setStep] = useState<number>(0);
  const [formData, setFormData] = useState<Partial<InterviewFormData>>({
    caseType: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [generatedResults, setGeneratedResults] = useState<InterviewPrepOutput | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [sessionRestorationAttempted, setSessionRestorationAttempted] = useState(false);

  type RestorableSession = {
    id: string;
    category_slug: string;
    updated_at?: string;
    answers?: Array<{ question_key: string; answer_value: unknown }>;
    results?: InterviewPrepOutput;
  };

  // NEW: Confirmation modal state for session restoration
  const [restoreSessionModalOpen, setRestoreSessionModalOpen] = useState(false);
  const [pendingRestoreSession, setPendingRestoreSession] =
    useState<RestorableSession | null>(null);
  const [isRedirectingSession, setIsRedirectingSession] = useState(false);

  const { user } = useAuth();
  const { profile, isProfileLoading, updateProfile } = useUserProfile();

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
  const loadCategories = async (country: string) => {
    try {
      setLoadingMessage("Loading visa categories...");
      setLoading(true);
      const response = await fetch(
        `/api/interview-prep/categories?country=${encodeURIComponent(country)}`
      );
      const data = await response.json();

      if (data.success) {
        if (data.categories && data.categories.length > 0) {
          setAvailableCategories(data.categories);
          setNoDataMessage(null);
          setShowCountryModal(false);
        } else {
          setAvailableCategories([]);
          setNoDataMessage("No Visa Categories available for your selected country right now.");
        }
      } else {
        setAvailableCategories([]);
        setNoDataMessage("No Visa Categories available for your selected country right now.");
      }
    } catch (err) {
      console.error("Error loading categories:", err);
      setError("Failed to load visa categories");
      setNoDataMessage(null);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  // Handle country selection from modal
  const handleCountrySelected = (country: string) => {
    loadCategories(country);
  };

  const restoreSessionData = async (
    session: RestorableSession,
    getCategoryFn: (slug: string) => InterviewCategoryConfig | undefined,
  ) => {
    try {
      setSessionId(session.id);
      const categorySlug = session.category_slug;
      const category = getCategoryFn(categorySlug);

      if (!category && availableCategories.length > 0) {
        localStorage.removeItem("interviewPrepSessionId");
        return;
      }

      if (category) {
        setSelectedCategory(category);

        // Load questionnaire for the restored category
        const catDataResponse = await fetch(
          `/api/interview-prep?category_slug=${categorySlug}`,
        );
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
            session.answers.forEach(
              (answer: { question_key: string; answer_value: unknown }) => {
                answersMap[answer.question_key] = answer.answer_value;
              },
            );
            setFormData((prev) => ({
              ...prev,
              ...answersMap,
            }));
          }

          // If results were already generated, restore them and jump to results step
          if (session.results) {
            setGeneratedResults(session.results);
            setStep((catData.questionnaire?.sections?.length || 0) + 3); // Show results
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
        // Check for sessionId query parameter first (for completed session revisit)
        const urlParams = new URLSearchParams(window.location.search);
        const sessionIdParam = urlParams.get("sessionId");

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
            setStep(questionnaire ? questionnaire.sections.length + 3 : 4);
            setLoading(false);
            setLoadingMessage("");
            setSessionRestorationAttempted(true);
            return;
          }
        }

        // Check for saved session in localStorage first (current browser/session)
        const savedSessionId = localStorage.getItem("interviewPrepSessionId");
        if (savedSessionId && step === 0) {
          const response = await fetch(`/api/interview-prep/sessions/${savedSessionId}`);
          const sessionData = await response.json();

          if (response.ok && sessionData.session && sessionData.session.completed === false) {
            await restoreSessionData(sessionData.session, (categorySlug) => {
              const category = availableCategories.find((c) => c.categorySlug === categorySlug);
              return category;
            });
            setLoading(false);
            setSessionRestorationAttempted(true);
            return;
          } else {
            localStorage.removeItem("interviewPrepSessionId");
          }
        }

        // Check for latest incomplete session from database (cross-device/browser recovery)
        // This runs automatically if no saved session in localStorage
        if (!savedSessionId && step === 0 && typeof window !== "undefined") {
          const latestResponse = await fetch(`/api/interview-prep/latest-incomplete-session`);
          const latestData = await latestResponse.json();

          // Only restore if session has NO generated results (truly at questionnaire stage)
          if (latestData.success && latestData.session && !latestData.session.results) {
            // Found an incomplete session - offer to restore it via modal
            setPendingRestoreSession(latestData.session);
            setRestoreSessionModalOpen(true);
          }
        }

        setSessionRestorationAttempted(true);
      } catch (err) {
        console.error("Error checking for incomplete session:", err);
        setSessionRestorationAttempted(true);
      }
    };

    if (typeof window !== "undefined") {
      restoreIncompleteSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on initial mount to avoid auto-restoring when categories load

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
  const handleCategorySelect = (category: InterviewCategoryConfig) => {
    setSelectedCategory(category);
    setError(null);
  };

  // Handle progressing from category selection to questions
  const handleCategorySelectionNext = async () => {
    if (!selectedCategory) {
      setError("Please select a visa category");
      return;
    }

    try {
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

      if (!sessionResponse.ok || !sessionResult.success) {
        setError("Failed to create interview session");
        return;
      }

      // SESSION ALREADY EXISTS
      // Redirect user to My Sessions page
      if (sessionResult.alreadyExists) {
        setIsRedirectingSession(true);
        setLoadingMessage("Redirecting to your existing session...");

        router.push("/interview-prep/my-sessions");
        return;
      }

      // NEW SESSION CREATED
      const newSessionId = sessionResult.session.id;

      setSessionId(newSessionId);

      // Optional convenience cache
      localStorage.setItem("interviewPrepSessionId", newSessionId);

      // Load questionnaire
      const catDataResponse = await fetch(
        `/api/interview-prep?category_slug=${categorySlug}`,
      );

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

      setError(err instanceof Error ? err.message : "Failed to proceed");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const nextStep = async () => {
    // At step 0, validate category selection
    if (step === 0 && !selectedCategory) {
      setError("Please select a visa category");
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

  const prevStep = async () => {
    // Save answers before moving to previous step if we have a session ID
    if (sessionId) {
      try {
        // Filter out non-question fields before saving
        const answers: Record<string, unknown> = {};
        Object.keys(formData).forEach((k) => {
          if (k !== "caseType" && k !== "visaCategory") {
            answers[k] = formData[k as keyof typeof formData];
          }
        });

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
          console.error("Failed to save answers on step change:", await answersResponse.text());
        }
      } catch (err) {
        console.error("Error saving answers on step change:", err);
      }
    }

    setStep((prev) => prev - 1);
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!sessionId) {
      setError("No session found. Please restart the assessment.");
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

        // Remove the session from localStorage since it's now completed
        localStorage.removeItem("interviewPrepSessionId");

        // Increment step to show results on the same page
        setStep((prev) => prev + 1);

        // Auto-scroll to top to show results
        await new Promise((resolve) => setTimeout(resolve, 100));
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const errorData = await submitResponse.text();
        console.error("Submit response error:", errorData);
        throw new Error("Failed to generate interview prep materials");
      }
    } catch (err) {
      console.error("Error submitting for interview prep:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate interview prep materials. Please try again."
      );
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

    // Step 0: Category Selection
    if (step === 0) {
      return (
        <CategorySelectionStep
          categories={availableCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
          onNext={handleCategorySelectionNext}
          onBack={() => {
            // Back button on category selection (first step)
            router.push("/");
          }}
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

  const renderProgressSections = () => {
    if (!questionnaire || step === 0) return null;

    const sections = questionnaire.sections;
    const currentSectionIndex = step - 1;
    const totalSteps = sections.length + 2; // +2 for review and results
    const progressPercentage = Math.round(((step - 1) / totalSteps) * 100);

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
            className="bg-teal-600 h-3 rounded-full transition-all duration-500 ease-in-out"
            style={{
              width: `${progressPercentage > 100 ? 100 : progressPercentage}%`,
            }}
          ></div>
        </div>

        {/* Desktop View */}
        <div className="mt-4 hidden md:grid md:grid-cols-4 lg:grid-cols-5 gap-3">
          {sections.map((section, index) => {
            const isActive = index === currentSectionIndex;
            const isCompleted = index < currentSectionIndex;

            return (
              <div
                key={index}
                className={`p-3 rounded-lg text-center text-xs font-medium transition-all ${
                  isActive
                    ? "bg-teal-600 text-white border-2 border-teal-600"
                    : isCompleted
                      ? "bg-teal-100 text-teal-800 border-2 border-teal-200"
                      : "bg-slate-100 text-slate-500 border-2 border-slate-200"
                }`}
              >
                <div className="font-semibold truncate">
                  {section.title.substring(0, 20)}
                  {section.title.length > 20 ? "..." : ""}
                </div>
                <div className="text-[10px] mt-1">Step {index + 1}</div>
              </div>
            );
          })}

          {/* Review Step Indicator */}
          <div
            className={`p-3 rounded-lg text-center text-xs font-medium transition-all ${
              step === sections.length + 1
                ? "bg-teal-600 text-white border-2 border-teal-600"
                : step > sections.length + 1
                  ? "bg-teal-100 text-teal-800 border-2 border-teal-200"
                  : "bg-slate-100 text-slate-500 border-2 border-slate-200"
            }`}
          >
            <div className="font-semibold">Review</div>
            <div className="text-[10px] mt-1">Step {sections.length + 1}</div>
          </div>

          {/* Results Step Indicator */}
          <div
            className={`p-3 rounded-lg text-center text-xs font-medium transition-all ${
              step === sections.length + 2
                ? "bg-teal-600 text-white border-2 border-teal-600"
                : "bg-slate-100 text-slate-500 border-2 border-slate-200"
            }`}
          >
            <div className="font-semibold">Results</div>
            <div className="text-[10px] mt-1">Step {sections.length + 2}</div>
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
                <span className="text-xs font-mono bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
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

                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg text-center text-xs font-medium transition-all ${
                        isActive
                          ? "bg-teal-600 text-white border-2 border-teal-600 shadow-md"
                          : isCompleted
                            ? "bg-teal-100 text-teal-800 border-2 border-teal-200"
                            : "bg-slate-100 text-slate-500 border-2 border-slate-200"
                      }`}
                    >
                      <div className="font-semibold truncate">
                        {section.title.substring(0, 20)}
                        {section.title.length > 20 ? "..." : ""}
                      </div>
                      <div className="text-[10px] mt-1">Step {index + 1}</div>
                    </div>
                  );
                })}

                {/* Review Step Indicator */}
                <div
                  className={`p-3 rounded-lg text-center text-xs font-medium transition-all ${
                    step === sections.length + 1
                      ? "bg-teal-600 text-white border-2 border-teal-600 shadow-md"
                      : step > sections.length + 1
                        ? "bg-teal-100 text-teal-800 border-2 border-teal-200"
                        : "bg-slate-100 text-slate-500 border-2 border-slate-200"
                  }`}
                >
                  <div className="font-semibold">Review</div>
                  <div className="text-[10px] mt-1">Step {sections.length + 1}</div>
                </div>

                {/* Results Step Indicator */}
                <div
                  className={`p-3 rounded-lg text-center text-xs font-medium transition-all ${
                    step === sections.length + 2
                      ? "bg-teal-600 text-white border-2 border-teal-600 shadow-md"
                      : "bg-slate-100 text-slate-500 border-2 border-slate-200"
                  }`}
                >
                  <div className="font-semibold">Results</div>
                  <div className="text-[10px] mt-1">Step {sections.length + 2}</div>
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
      <CountrySelectionModal
        isOpen={showCountryModal}
        onCountrySelected={handleCountrySelected}
        isLoading={loading && showCountryModal}
        noDataMessage={noDataMessage || undefined}
      />

      <div className="site-main-px site-main-py mt-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Interview Preparation Tool</h1>
          <p className="text-slate-600">
            {selectedCategory
              ? selectedCategory.description
              : "Prepare for your visa interview with personalized questions"}
          </p>

          <button
            onClick={() => (window.location.href = "/interview-prep/my-sessions")}
            suppressHydrationWarning
            className="text-teal-600 hover:text-teal-700 mt-4 cursor-pointer hover:underline text-base font-medium"
          >
            See my interview sessions →
          </button>
        </div>

        {renderProgressSections()}

        <Card className="p-6 shadow-lg">
          {loading && !sessionId ? (
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
              localStorage.setItem("interviewPrepSessionId", pendingRestoreSession.id);

              await restoreSessionData(
                pendingRestoreSession,
                (categorySlug: string) => {
                  const category = availableCategories.find(
                    (c) => c.categorySlug === categorySlug,
                  );
                  return category;
                },
              );

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
  );
}

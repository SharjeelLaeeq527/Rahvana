"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useRouter } from "next/navigation";
import { ResultPage } from "./result/ResultPage";
import { Loader } from "@/components/ui/spinner";

import { InterviewPrepOutput } from "../../../lib/interview-prep/types";

import { useAuth } from "@/app/context/AuthContext";
import { createBrowserClient } from "@supabase/ssr";
import { mapProfileToGenericForm } from "@/lib/autoFill/mapper";
import { MasterProfile } from "@/types/profile";
import { ReviewStep } from "@/app/components/interview-prep/review-step";
import { CategorySelectionStep } from "@/app/components/interview-prep/category-selection-step";
import { DynamicQuestionStep } from "@/app/components/interview-prep/dynamic-question-step";
import CountrySelectionModal from "../../components/interview-prep/CountrySelectionModal";
import type { InterviewFormData } from "@/app/components/interview-prep/types";

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
  const [generatedResults, setGeneratedResults] =
    useState<InterviewPrepOutput | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const [profileLoaded, setProfileLoaded] = useState(false);
  const { user } = useAuth();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Auto-fill profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from("user_profiles")
          .select("profile_details")
          .eq("id", user.id)
          .single();

        if (data?.profile_details && !profileLoaded) {
          const profile = data.profile_details as MasterProfile;

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
            military_or_defense_background:
              formData.military_or_defense_background,
            previous_us_visits: formData.previous_us_visits,
            previous_visa_refusal: formData.previous_visa_refusal,
            visa_overstay_history: formData.visa_overstay_history,
            criminal_history: formData.criminal_history,
            english_proficiency: formData.english_proficiency,
            intended_us_state: formData.intended_us_state,
            living_arrangements_in_us: formData.living_arrangements_in_us,
            future_plans: formData.future_plans,
            joint_finances: formData.joint_finances,
            financial_arrangement_description:
              formData.financial_arrangement_description,
          });

          setFormData((prev) => ({
            ...prev,
            ...mappedData,
          }));
          setProfileLoaded(true);
        }
      } catch (err) {
        console.error("Error auto-filling profile:", err);
      }
    };

    fetchProfile();
  }, [user, profileLoaded, supabase, formData]);

  // Load available categories based on selected country
  const loadCategories = async (country: string) => {
    try {
      setLoadingMessage("Loading visa categories...");
      setLoading(true);
      const response = await fetch(`/api/interview-prep/categories?country=${encodeURIComponent(country)}`);
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

  // Check for existing session on component mount
  useEffect(() => {
    const checkExistingSession = async () => {
      // Check for sessionId query parameter (for session revisit)
      const urlParams = new URLSearchParams(window.location.search);
      const sessionIdParam = urlParams.get("sessionId");

      if (sessionIdParam) {
        try {
          setLoading(true);
          setLoadingMessage("Loading your completed interview...");
          const userEmail =
            typeof window !== "undefined"
              ? localStorage.getItem("userEmail") || "test@example.com"
              : "test@example.com";
          const response = await fetch(
            `/api/interview-prep/sessions/${sessionIdParam}?userEmail=${encodeURIComponent(userEmail)}`,
          );
          const sessionData = await response.json();

          if (
            response.ok &&
            sessionData.session &&
            sessionData.session.interview_prep_results
          ) {
            // Found a completed session, load results directly
            setSessionId(sessionIdParam);
            setGeneratedResults(
              sessionData.session.interview_prep_results.generated_questions,
            );
            setStep(questionnaire ? questionnaire.sections.length + 3 : 4);
            setLoading(false);
            setLoadingMessage("");
            return;
          }
        } catch (err) {
          console.error("Error loading session for revisit:", err);
        }
      }

      // Check for saved session in localStorage (for resume functionality)
      const savedSessionId = localStorage.getItem("interviewPrepSessionId");

      // Only restore if user hasn't started navigating yet (step 0) or questionnaire not loaded
      if (savedSessionId && (step === 0 || !questionnaire)) {
        try {
          setLoading(true);
          const response = await fetch(
            `/api/interview-prep/sessions/${savedSessionId}`,
          );
          const sessionData = await response.json();

          if (
            response.ok &&
            sessionData.session &&
            sessionData.session.completed === false
          ) {
            // Found an incomplete session, restore it
            setSessionId(savedSessionId);
            
            // Restore category selection and load questionnaire
            const categorySlug = sessionData.session.category_slug;
            const category = availableCategories.find(c => c.categorySlug === categorySlug);
            
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
                
                setFormData((prev) => ({
                  ...prev,
                  ...sessionData.session.answers,
                }));

                setStep(1); // Start at first question section
              }
            } else {
              localStorage.removeItem("interviewPrepSessionId");
            }
          } else {
            localStorage.removeItem("interviewPrepSessionId");
          }
        } catch (err) {
          console.error("Error restoring session:", err);
          localStorage.removeItem("interviewPrepSessionId");
        } finally {
          setLoading(false);
        }
      }
    };

    if (typeof window !== "undefined") {
      checkExistingSession();
    }
  }, [availableCategories, questionnaire, step]);

  const handleInputChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (error) {
      setError(null);
    }

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
          Object.keys(formData).forEach(k => {
            if (k !== 'caseType' && k !== 'visaCategory') {
              answers[k] = formData[k as keyof typeof formData];
            }
          });
          answers[key] = value;
          
          const answersResponse = await fetch(
            `/api/interview-prep/sessions/${sessionId}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: "update-answers",
                answers,
              }),
            },
          );

          if (!answersResponse.ok) {
            console.error(
              "Failed to save answer:",
              await answersResponse.text(),
            );
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
      setLoadingMessage("Creating your interview session...");
      
      const categorySlug = selectedCategory.categorySlug;
      
      // Check if there's an incomplete session for this category in localStorage
      const savedSessionId = localStorage.getItem("interviewPrepSessionId");
      let sessionId = savedSessionId;
      let isRestoring = false;

      if (savedSessionId) {
        try {
          const response = await fetch(
            `/api/interview-prep/sessions/${savedSessionId}`,
          );
          const sessionData = await response.json();

          if (
            response.ok &&
            sessionData.session &&
            sessionData.session.completed === false &&
            sessionData.session.category_slug === categorySlug
          ) {
            // Found an incomplete session for the same category - restore it!
            isRestoring = true;
            setLoadingMessage("Restoring your interview session...");
            setSessionId(savedSessionId);
          } else {
            // Session doesn't match or is completed, clear it and create new
            localStorage.removeItem("interviewPrepSessionId");
            sessionId = null;
          }
        } catch (err) {
          console.error("Error checking existing session:", err);
          localStorage.removeItem("interviewPrepSessionId");
          sessionId = null;
        }
      }

      // If not restoring, create a new session
      if (!isRestoring) {
        const sessionResponse = await fetch("/api/interview-prep", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category_slug: categorySlug,
            user_email: localStorage.getItem("userEmail") || "test@example.com",
            user_name: localStorage.getItem("userName") || "User",
          }),
        });

        const sessionResult = await sessionResponse.json();
        if (!sessionResult.success) {
          setError("Failed to create interview session");
          setLoading(false);
          return;
        }
        sessionId = sessionResult.session.id;
        setSessionId(sessionResult.session.id);
        localStorage.setItem("interviewPrepSessionId", sessionResult.session.id);
      }

      // Load questionnaire for this category via API
      const catDataResponse = await fetch(`/api/interview-prep?category_slug=${categorySlug}`);
      const catData = await catDataResponse.json();
      
      if (catData.success) {
        setQuestionnaire({
          categorySlug: selectedCategory.categorySlug,
          version: catData.questionnaire?.version || "1.0.0",
          lastUpdated: new Date().toISOString(),
          sections: catData.questionnaire?.sections || [],
        });
        
        // If restoring, also restore the form data
        if (isRestoring && sessionId) {
          try {
            const answersResponse = await fetch(
              `/api/interview-prep/sessions/${sessionId}`,
            );
            const sessionDetails = await answersResponse.json();
            
            if (sessionDetails.session && sessionDetails.session.answers) {
              const restoredAnswers: Record<string, unknown> = {};
              sessionDetails.session.answers.forEach((answer: {question_key: string, answer_value: unknown}) => {
                restoredAnswers[answer.question_key] = answer.answer_value;
              });
              
              setFormData((prev) => ({
                ...prev,
                ...restoredAnswers,
              }));
            }
          } catch (err) {
            console.error("Error restoring answers:", err);
          }
        }
        
        setError(null);
        setStep(1); // Move to first question section
      } else {
        setError("Failed to load questionnaire");
      }
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
        Object.keys(formData).forEach(k => {
          if (k !== 'caseType' && k !== 'visaCategory') {
            answers[k] = formData[k as keyof typeof formData];
          }
        });
        
        const answersResponse = await fetch(
          `/api/interview-prep/sessions/${sessionId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "update-answers",
              answers,
            }),
          },
        );

        if (!answersResponse.ok) {
          console.error(
            "Failed to save answers on step change:",
            await answersResponse.text(),
          );
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

    setLoading(true);
    setError(null);

    try {
      // Submit for generating interview prep
      const submitResponse = await fetch(
        `/api/interview-prep/sessions/${sessionId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "generate",
          }),
        },
      );

      if (submitResponse.ok) {
        const responseData = await submitResponse.json();

        // Longer delay to ensure loading state is visible
        await new Promise((resolve) => setTimeout(resolve, 1200));

        // Store the generated results locally instead of navigating
        setGeneratedResults(responseData.output);

        // Mark the session as completed
        const completeResponse = await fetch(
          `/api/interview-prep/sessions/${sessionId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "complete",
            }),
          },
        );

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
          : "Failed to generate interview prep materials. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Render the appropriate step
  const renderStep = () => {
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
          error={error}
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
          <span className="text-sm font-medium text-slate-700">
            {progressPercentage}% Complete
          </span>
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
                  <div className="text-[10px] mt-1">
                    Step {sections.length + 1}
                  </div>
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
                  <div className="text-[10px] mt-1">
                    Step {sections.length + 2}
                  </div>
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
      
      <div className="container mx-auto py-8 px-4 md:px-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Interview Preparation Tool
          </h1>
          <p className="text-slate-600">
            {selectedCategory 
              ? selectedCategory.description
            : "Prepare for your visa interview with personalized questions"}
        </p>
      </div>

      {renderProgressSections()}

      <Card className="p-6 shadow-lg">
        {loading && !sessionId ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader size="md" />
            <p className="text-slate-600">{step === 0 ? "Loading categories..." : "Loading..."}</p>
          </div>
        ) : (
          renderStep()
        )}
      </Card>
      </div>
    </>
  );
}

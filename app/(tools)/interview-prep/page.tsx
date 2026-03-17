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
import { CaseTypeStep } from "@/app/components/interview-prep/case-type-step";
import { QuestionStep } from "@/app/components/interview-prep/question-step";
import { ReviewStep } from "@/app/components/interview-prep/review-step";
import type { CaseType, InterviewFormData } from "@/app/components/interview-prep/types";

const mapAnswersToFormData = (
  answers: Array<{ question_key: string; answer_value: unknown }>,
): Partial<InterviewFormData> => {
  const mapped: Partial<InterviewFormData> = {};
  answers.forEach((a) => {
    mapped[a.question_key as keyof InterviewFormData] = a.answer_value as never;
  });
  return mapped;
};

export default function InterviewPreparation() {
  const [step, setStep] = useState<number>(0);
  const [formData, setFormData] = useState<InterviewFormData>({
    caseType: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

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

  // Load questions from the JSON file
  interface QuestionDefinition {
    key: string;
    label: string;
    type: string;
    options?: string | string[];
    required?: boolean;
  }

  interface QuestionnaireData {
    sections: Array<{
      id: string;
      title: string;
      description: string;
      questions: QuestionDefinition[];
    }>;
  }

  const [questionnaireData, setQuestionnaireData] =
    useState<QuestionnaireData | null>(null);

  useEffect(() => {
    if (!questionnaireData) {
      import("../../../data/interview-intake-questionnaire.json")
        .then((data) =>
          setQuestionnaireData(data.default || (data as QuestionnaireData)),
        )
        .catch((err) =>
          console.error("Error loading questionnaire data:", err),
        );
    }
  }, [questionnaireData]);

  // Check for existing session on component mount
  useEffect(() => {
    const checkExistingSession = async () => {
      // Check for sessionId query parameter (for session revisit)
      const urlParams = new URLSearchParams(window.location.search);
      const sessionIdParam = urlParams.get("sessionId");

      if (sessionIdParam) {
        try {
          setLoading(true);
          // Get email from localStorage or use a default for now
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
            setStep(
              questionnaireData ? questionnaireData.sections.length + 2 : 3,
            ); // Go directly to results page
            return;
          }
        } catch (err) {
          console.error("Error loading session for revisit:", err);
        }
      }

      // Check for saved session in localStorage (for resume functionality)
      const savedSessionId = localStorage.getItem("interviewPrepSessionId");

      if (savedSessionId) {
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
            setFormData((prev) => ({
              ...prev,
              caseType: sessionData.session.case_type,
              ...sessionData.session.answers,
            }));

            setStep(0);
          } else {
            // Session doesn't exist or is already completed, remove from localStorage
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
  }, [questionnaireData]);

  const handleCaseTypeChange = (caseType: CaseType) => {
    setFormData((prev) => ({ ...prev, caseType }));
    setError(null);
  };

  const handleInputChange = (id: keyof InterviewFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
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
          // Create updated form data with the new value
          const updatedFormData = { ...formData };
          (updatedFormData as Record<string, unknown>)[id as string] = value;
          // Filter out non-question fields before saving
          const {
            caseType: _caseType,
            visaCategory: _visaCategory,
            ...answers
          } = updatedFormData;
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

  const nextStep = async () => {
    // Validate current step if needed
    if (step === 0 && !formData.caseType) {
      setError("Please select a case type");
      return;
    }

    // If we're on the first step (case type selection), check for existing session first
    if (step === 0 && formData.caseType) {
      try {
        setLoading(true);
        const storedSessionId = localStorage.getItem("interviewPrepSessionId");

        // 🔹 CHECK FOR EXISTING SESSION FIRST
        if (storedSessionId) {
          const existingRes = await fetch(
            `/api/interview-prep/sessions/${storedSessionId}`,
          );
          const existingData = await existingRes.json();

          if (
            existingRes.ok &&
            existingData.session &&
            existingData.session.completed === false &&
            existingData.session.case_type === formData.caseType
          ) {
            // ✅ Resume existing session
            setSessionId(existingData.session.id);

            // Restore answers to form data
            const restoredAnswers = mapAnswersToFormData(
              existingData.session.answers || [],
            );

            setFormData((prev) => ({
              ...prev,
              caseType: existingData.session.case_type,
              ...restoredAnswers,
            }));

            // Force re-render to populate form fields
            setTimeout(() => {
              setFormData((prev) => ({ ...prev }));
            }, 0);

            setStep(1);
            setLoading(false);
            return;
          }

          // Completed or case type mismatch → clear localStorage
          localStorage.removeItem("interviewPrepSessionId");
        }
        const sessionResponse = await fetch("/api/interview-prep", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            case_type: formData.caseType,
            // user_email:
            //   typeof window !== "undefined"
            //     ? localStorage.getItem("userEmail") || "test@example.com"
            //     : "test@example.com",
            // user_name:
            //   typeof window !== "undefined"
            //     ? localStorage.getItem("userName") || "John Doe"
            //     : "John Doe",
          }),
        });

        const sessionResult = await sessionResponse.json();

        if (sessionResponse.ok) {
          setSessionId(sessionResult.session.id);
          // Save session ID to localStorage for resume later functionality
          localStorage.setItem(
            "interviewPrepSessionId",
            sessionResult.session.id,
          );

          // Save initial answers, excluding non-question fields
          const {
            caseType: _caseType,
            visaCategory: _visaCategory,
            ...answers
          } = formData;
          const answersResponse = await fetch(
            `/api/interview-prep/sessions/${sessionResult.session.id}`,
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
              "Failed to save initial answers:",
              await answersResponse.text(),
            );
          }
        } else {
          throw new Error(sessionResult.error || "Failed to create session");
        }
      } catch (err) {
        console.error("Error creating/resuming session:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to create/resume session. Please try again.",
        );
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    if (step > 0 && questionnaireData) {
      const currentSectionIndex = step - 1;
      const currentSection = questionnaireData.sections[currentSectionIndex];

      if (currentSection) {
        for (const question of currentSection.questions as Array<{
          key: keyof InterviewFormData;
          label: string;
          type: "text" | "textarea" | "number" | "date" | "boolean" | "select";
          options?: string[];
          required?: boolean;
        }>) {
          const fieldValue = formData[question.key];

          // Skip validation for optional questions
          if (!question.required) {
            continue;
          }

          if (question.type === "boolean") {
            // Skip validation for boolean questions since false/unselected is a valid state
          } else if (question.type === "select") {
            if (
              fieldValue === undefined ||
              fieldValue === null ||
              fieldValue === ""
            ) {
              setError(`Please select an option for: ${question.label}`);
              return;
            }
          } else {
            if (
              fieldValue === undefined ||
              fieldValue === null ||
              fieldValue === ""
            ) {
              setError(`Please fill in all required fields: ${question.label}`);
              return;
            }
          }

          if (
            question.type === "number" &&
            typeof fieldValue === "number" &&
            isNaN(Number(fieldValue))
          ) {
            setError(`Please enter a valid number for ${question.label}`);
            return;
          }

          if (
            question.type === "date" &&
            typeof fieldValue === "string" &&
            fieldValue === ""
          ) {
            setError(`Please enter a valid date for ${question.label}`);
            return;
          }

          if (
            question.type === "number" &&
            typeof fieldValue === "number" &&
            fieldValue < 0
          ) {
            setError(
              `Please enter a valid positive number for ${question.label}`,
            );
            return;
          }

          // Additional validation for date type
          if (
            question.type === "date" &&
            typeof fieldValue === "string" &&
            fieldValue !== "" &&
            !isNaN(Date.parse(fieldValue))
          ) {
            const dateValue = new Date(fieldValue);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // For DOB fields, ensure date is in the past
            if (question.key.includes("date") && dateValue >= today) {
              setError(`Date must be in the past for ${question.label}`);
              return;
            }
          }
        }
      }
    }

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
        const {
          caseType: _caseType,
          visaCategory: _visaCategory,
          ...answers
        } = formData;
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
    if (!questionnaireData) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4  mx-2">
          <Loader size="md" />
        </div>
      );
    }

    const renderWithNotification = (content: React.ReactNode) => (
      <div>{content}</div>
    );

    if (step === 0) {
      return (
        <CaseTypeStep
          formData={formData}
          error={error}
          onCaseTypeChange={handleCaseTypeChange}
          onNext={nextStep}
          onBack={() => router.back()}
        />
      );
    }

    if (step > 0 && step <= questionnaireData.sections.length) {
      const sectionIndex = step - 1;
      const section = questionnaireData.sections[sectionIndex];

      return renderWithNotification(
        <QuestionStep
          title={section.title}
          description={section.description}
          questions={section.questions.map((q: QuestionDefinition) => ({
            key: q.key as keyof InterviewFormData,
            label: q.label,
            type: q.type as
              | "text"
              | "textarea"
              | "number"
              | "date"
              | "boolean"
              | "select",
            options: q.options || undefined,
            required: q.required,
          }))}
          formData={formData}
          error={error}
          onChange={handleInputChange}
          setFormData={setFormData}
          onNext={nextStep}
          onBack={prevStep}
        />,
      );
    }

    // Check if we're on the review page (after completing all questions)
    if (step === questionnaireData.sections.length + 1) {
      return renderWithNotification(
        <ReviewStep
          formData={formData}
          error={error}
          loading={loading}
          onSubmit={handleSubmit}
          onBack={prevStep}
        />,
      );
    }

    // Check if we're on the results page (after submitting)
    if (step === questionnaireData.sections.length + 2) {
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
            router.push("/interview-prep");
          }}
        />
      );
    }

    return renderWithNotification(
      <ReviewStep
        formData={formData}
        error={error}
        loading={loading}
        onSubmit={handleSubmit}
        onBack={prevStep}
      />,
    );
  };

  const renderProgressSections = () => {
    if (!questionnaireData || step === 0) return null;

    const sections = questionnaireData.sections;
    const currentSectionIndex = step - 1;
    const totalSteps = questionnaireData.sections.length + 2; // +2 for review and results steps
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
          {sections.map(
            (
              section: { title: string; questions: QuestionDefinition[] },
              index: number,
            ) => {
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
            },
          )}

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
                {sections.map(
                  (
                    section: { title: string; questions: QuestionDefinition[] },
                    index: number,
                  ) => {
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
                  },
                )}

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
    <div className="container mx-auto py-8 px-4 md:px-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Interview Preparation Tool
        </h1>
        <p className="text-slate-600">
          Prepare for your IR-1/CR-1 visa interview with personalized questions
          and answers
        </p>
      </div>

      {renderProgressSections()}

      <Card className="p-6 shadow-lg">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader size="md" />
          </div>
        ) : (
          renderStep()
        )}
      </Card>
    </div>
  );
}

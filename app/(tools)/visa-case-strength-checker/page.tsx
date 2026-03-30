"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResultPage } from "./result/ResultPage";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/app/context/AuthContext";
import {
  mapProfileToVisaChecker,
  mapFormToProfile,
} from "@/lib/autoFill/mapper";
import type {
  MasterProfile,
  QuestionnaireData,
  QuestionDefinition,
  QuestionnaireSection,
} from "@/types/profile";

import { CaseType, FormData } from "./types";
import CaseTypeStep from "./components/CaseTypeStep";
import QuestionStep from "./components/QuestionStep";
import ReviewStep from "./components/ReviewStep";

export default function VisaCaseStrengthChecker() {
  const [step, setStep] = useState<number>(0);
  const [formData, setFormData] = useState<FormData>({
    caseType: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef<boolean>(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const { isAuthenticated } = useAuth();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { user } = useAuth();
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  const [isRestoredSession, setIsRestoredSession] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Auto-fill profile data & Restore saved session
  useEffect(() => {
    const fetchProfile = async () => {
      // CRITICAL: If user is not logged in, clear all data
      if (!user?.id) {
        // User logged out - clear form data
        setFormData({
          caseType: "",
          sponsor_full_name: "",
          beneficiary_full_name: "",
          sponsor_dob: "",
          beneficiary_dob: "",
          country_of_residence: "",
          relationship_start_date: "",
          marriage_date: "",
          spousal_relationship_type: "",
          intended_us_state_of_residence: "",
          i130_status: "",
          highest_education_level: "",
          highest_education_field: "",
          current_occupation_role: "",
          industry_sector: "",
          prior_military_service: false,
          specialized_weapons_training: false,
          unofficial_armed_groups: false,
          employer_type: "",
          how_did_you_meet: "",
          number_of_in_person_visits: 0,
          cohabitation_proof: false,
          shared_financial_accounts: false,
          wedding_photos_available: false,
          communication_logs: false,
          money_transfer_receipts_available: false,
          driving_license_copy_available: false,
          children_together: false,
          previous_visa_applications: false,
          previous_visa_denial: false,
          overstay_or_violation: false,
          criminal_record: false,
          sponsor_annual_income: 0,
          household_size: 0,
          has_tax_returns: false,
          has_employment_letter: false,
          has_paystubs: false,
          joint_sponsor_available: false,
          i864_affidavit_submitted: false,
          i864_supporting_financial_documents: false,
          urdu_marriage_certificate: false,
          english_translation_certificate: false,
          nadra_marriage_registration_cert: false,
          family_registration_certificate: false,
          birth_certificates: false,
          prior_marriages_exist: false,
          prior_marriage_termination_docs: false,
          passports_available: false,
          passport_copy_available: false,
          valid_police_clearance_certificate: false,
          ds260_confirmation: false,
          interview_letter: false,
          courier_registration: false,
          medical_report_available: false,
          polio_vaccination_certificate: false,
          passport_photos_2x2: false,
        });
        setProfileLoaded(false);
        setLastUserId(null);
        return;
      }

      // If user changed, reset profileLoaded flag
      if (lastUserId !== user.id) {
        setProfileLoaded(false);
        setLastUserId(user.id);
      }

      // Skip if already loaded for this user
      if (profileLoaded && lastUserId === user.id) {
        return;
      }

      try {
        const { data } = await supabase
          .from("user_profiles")
          .select("profile_details")
          .eq("id", user.id)
          .single();

        if (data?.profile_details) {
          const profile = data.profile_details as MasterProfile;

          // 1. Check for specific Saved Case Strength Session
          if (
            profile.caseStrength?.lastSessionId &&
            profile.caseStrength?.answers
          ) {
            // Restore specific tool state
            setFormData({
              caseType: (profile.caseStrength.caseType as CaseType) || "",
              ...profile.caseStrength.answers,
            } as FormData);
            setSessionId(profile.caseStrength.lastSessionId);
            setProfileLoaded(true);
            setIsRestoredSession(true);

            // If we have a sessionId, we assume the user might have completed or wants to see results
            // But strictly speaking, sessionId just means a session exists.
            // The user wants "Direct Result" like Visa Eligibility.
            // In Visa Eligibility, we check if enough data exists.
            // Here, if we have a saved sessionId, it implies we saved result state?
            // Let's perform a check: if we have answers and sessionId, try to jump to results.
            // Note: questionnaireData might not be loaded yet, so we can't set step to length+2 reliably here.
            // We will set a flag or rely on the other useEffect.
            return;
          }

          // 2. Fallback: Generic Auto-fill
          const mappedData = mapProfileToVisaChecker(profile);

          setFormData((prev) => {
            const newData = { ...prev };
            let hasUpdates = false;

            Object.entries(mappedData).forEach(([key, value]) => {
              if (
                newData[key as keyof FormData] === undefined ||
                newData[key as keyof FormData] === ""
              ) {
                (
                  newData as {
                    [k: string]: string | number | boolean | undefined;
                  }
                )[key] = value as string | number | boolean | undefined;
                hasUpdates = true;
              }
            });

            return hasUpdates ? newData : prev;
          });
          setProfileLoaded(true);
        }
      } catch (err) {
        console.error("Error auto-filling profile:", err);
      }
    };

    fetchProfile();
  }, [user?.id, profileLoaded, lastUserId, supabase]);

  const [questionnaireData, setQuestionnaireData] =
    useState<QuestionnaireData | null>(null);

  useEffect(() => {
    if (!questionnaireData) {
      import("../../../data/visa-case-strength-checker.json")
        .then((m) => {
          const data = m.default || m;
          setQuestionnaireData(data as QuestionnaireData);
        })
        .catch((err) =>
          console.error("Error loading questionnaire data:", err),
        );
    }
  }, [questionnaireData]);

  const handleCaseTypeChange = (caseType: CaseType) => {
    setFormData((prev) => ({ ...prev, caseType }));
    setError(null);
  };

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const storedSession = localStorage.getItem("visaCheckerSessionId");

    if (storedSession) {
      setSessionId(storedSession);
    }
  }, []);

  useEffect(() => {
    if (
      isRestoredSession &&
      sessionId &&
      questionnaireData &&
      !isEditing
    ) {
      // Restore flags but don't auto-jump
      setIsRestoredSession(false);
    }
  }, [sessionId, questionnaireData, step, isEditing, isRestoredSession]);

  // Define valid question keys to validate against the enum
  const validQuestionKeys: (keyof FormData)[] = [
    // Basic Profile
    "sponsor_full_name",
    "beneficiary_full_name",
    "sponsor_dob",
    "beneficiary_dob",
    "country_of_residence",
    "marriage_date",
    "relationship_start_date",
    "spousal_relationship_type",
    "intended_us_state_of_residence",
    "i130_status",
    // Education & Employment Background
    "highest_education_level",
    "highest_education_field",
    "current_occupation_role",
    "industry_sector",
    "prior_military_service",
    "specialized_weapons_training",
    "unofficial_armed_groups",
    "employer_type",
    // Relationship Strength
    "how_did_you_meet",
    "number_of_in_person_visits",
    "cohabitation_proof",
    "shared_financial_accounts",
    "wedding_photos_available",
    "communication_logs",
    "money_transfer_receipts_available",
    "driving_license_copy_available",
    "children_together",
    // Immigration History
    "previous_visa_applications",
    "previous_visa_denial",
    "overstay_or_violation",
    "criminal_record",
    "prior_marriages_exist",
    "prior_marriage_termination_docs",
    // Financial Profile
    "sponsor_annual_income",
    "household_size",
    "has_tax_returns",
    "has_employment_letter",
    "has_paystubs",
    "joint_sponsor_available",
    "i864_affidavit_submitted",
    "i864_supporting_financial_documents",
    // Core Identity Documents
    "urdu_marriage_certificate",
    "english_translation_certificate",
    "nadra_marriage_registration_cert",
    "family_registration_certificate",
    "birth_certificates",
    // Passport & Police Documents
    "passports_available",
    "passport_copy_available",
    "valid_police_clearance_certificate",
    // Interview & Medical Documents
    "ds260_confirmation",
    "interview_letter",
    "courier_registration",
    "medical_report_available",
    "polio_vaccination_certificate",

    "passport_photos_2x2",
  ];

  const isValidQuestionKey = (key: string): key is keyof FormData => {
    return validQuestionKeys.includes(key as keyof FormData);
  };

  const handleInputChange = (id: keyof FormData, value: unknown) => {
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
          const updatedFormData = { ...formData, [id]: value };
          // Filter out non-question fields before saving and validate question keys
          const answers = Object.fromEntries(
            Object.entries(updatedFormData)
              .filter(([key]) => key !== "caseType")
              .filter(([key]) => isValidQuestionKey(key)),
          );
          const answersResponse = await fetch(
            `/api/visa-checker/session/${sessionId}/answers`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
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
    // Prevent rapid/double clicks from bypassing validation
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setIsNavigating(true);

    // Validate current step if needed
    if (step === 0 && !formData.caseType) {
      setError("Please select a case type");
      isNavigatingRef.current = false;
      setIsNavigating(false);
      return;
    }

    // If we're on the first step (case type selection), create a session
    if (step === 0 && formData.caseType) {
      try {
        setLoading(true);
        const sessionResponse = await fetch("/api/visa-checker/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            caseType: formData.caseType,
          }),
        });

        const sessionResult = await sessionResponse.json();

        if (sessionResponse.ok) {
          setSessionId(sessionResult.sessionId);
          // Save session ID to localStorage for resume later functionality
          localStorage.setItem("visaCheckerSessionId", sessionResult.sessionId);

          /* 
             User requested removal of "Save for Later" logic that was causing errors.
             We are now using Profile-based persistence.
             The following block was causing invalid enum errors.
             
          // Save initial answers, excluding non-question fields and validating question keys
          const answers = Object.fromEntries(
            Object.entries(formData)
              .filter(([key]) => key !== 'caseType')
              .filter(([key]) => isValidQuestionKey(key))
          );
          const answersResponse = await fetch(
            `/api/visa-checker/session/${sessionResult.sessionId}/answers`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
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
          */
        } else {
          throw new Error(sessionResult.error || "Failed to create session");
        }
      } catch (err) {
        console.error("Error creating session:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to create session. Please try again.",
        );
        setLoading(false);
        isNavigatingRef.current = false;
        setIsNavigating(false);
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
          id: keyof FormData;
          label: string;
          type: "text" | "textarea" | "number" | "date" | "boolean" | "select";
          options?: string[];
          risk_tag?: string;
        }>) {
          const fieldValue = formData[question.id];

          // Skip validation for few questions as they're optional
          if (
            question.id === "intended_us_state_of_residence" ||
            question.id === "highest_education_field" ||
            question.id === "prior_military_service" ||
            question.id === "specialized_weapons_training" ||
            question.id === "unofficial_armed_groups"
          ) {
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
              isNavigatingRef.current = false;
              setIsNavigating(false);
              return;
            }
          } else {
            if (
              fieldValue === undefined ||
              fieldValue === null ||
              fieldValue === ""
            ) {
              setError(`Please fill in all required fields: ${question.label}`);
              isNavigatingRef.current = false;
              setIsNavigating(false);
              return;
            }
          }

          if (
            question.type === "number" &&
            typeof fieldValue === "number" &&
            isNaN(Number(fieldValue))
          ) {
            setError(`Please enter a valid number for ${question.label}`);
            isNavigatingRef.current = false;
            setIsNavigating(false);
            return;
          }

          if (
            question.type === "date" &&
            typeof fieldValue === "string" &&
            fieldValue === ""
          ) {
            setError(`Please enter a valid date for ${question.label}`);
            isNavigatingRef.current = false;
            setIsNavigating(false);
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
            isNavigatingRef.current = false;
            setIsNavigating(false);
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
            if (question.id.includes("dob") && dateValue >= today) {
              setError(
                `Date of birth must be in the past for ${question.label}`,
              );
              isNavigatingRef.current = false;
              setIsNavigating(false);
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
    // Release the navigation lock after a short delay to allow React to re-render
    setTimeout(() => {
      isNavigatingRef.current = false;
      setIsNavigating(false);
    }, 400);
  };

  const prevStep = async () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setIsNavigating(true);

    // Save answers before moving to previous step if we have a session ID
    if (sessionId) {
      try {
        // Filter out non-question fields before saving and validate question keys
        const answers = Object.fromEntries(
          Object.entries(formData)
            .filter(([key]) => key !== "caseType")
            .filter(([key]) => isValidQuestionKey(key)),
        );
        const answersResponse = await fetch(
          `/api/visa-checker/session/${sessionId}/answers`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
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

    setTimeout(() => {
      isNavigatingRef.current = false;
      setIsNavigating(false);
    }, 400);
  };

  const handleSaveForLater = async () => {
    if (!sessionId) {
      setError("No session found to save. Please start the assessment first.");
      return;
    }

    try {
      setLoading(true);
      // Force save all current answers, filtering out non-question fields and validating question keys
      const answers = Object.fromEntries(
        Object.entries(formData)
          .filter(([key]) => key !== "caseType")
          .filter(([key]) => isValidQuestionKey(key)),
      );
      const answersResponse = await fetch(
        `/api/visa-checker/session/${sessionId}/answers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answers,
          }),
        },
      );

      if (answersResponse.ok) {
        // Save session ID to localStorage
        localStorage.setItem("visaCheckerSessionId", sessionId);
        setSaveNotification(
          "Your progress has been saved. You can return later to continue.",
        );
        // Clear notification after 5 seconds
        setTimeout(() => setSaveNotification(null), 5000);
      } else {
        console.error("Failed to save answers:", await answersResponse.text());
        setError("Failed to save your progress. Please try again.");
      }
    } catch (err) {
      console.error("Error saving progress:", err);
      setError("Error saving progress. Please try again.");
    } finally {
      setLoading(false);
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
      // Submit for scoring
      const submitResponse = await fetch(
        `/api/visa-checker/session/${sessionId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      if (submitResponse.ok) {
        // Remove the session from localStorage since it's now completed
        localStorage.removeItem("visaCheckerSessionId");

        // Navigate to results page after successful submit
        setStep((prev) => prev + 1);
        // Scroll to top when results appear
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const errorData = await submitResponse.text();
        console.error("Submit response error:", errorData);
        throw new Error("Failed to submit for scoring");
      }
    } catch (err) {
      console.error("Error submitting analysis:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit analysis. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToProfile = async () => {
    try {
      setLoading(true);

      // 1. Map to generic profile for cross-tool sharing
      const profileUpdate = mapFormToProfile(
        formData as unknown as Record<string, unknown>,
      );

      // 2. Prepare specific caseStrength state
      const caseStrengthData = {
        caseType: formData.caseType,
        answers: formData,
        lastSessionId: sessionId,
      };

      const { error } = await supabase.from("user_profiles").upsert(
        {
          id: user?.id,
          profile_details: {
            ...profileUpdate,
            caseStrength: caseStrengthData,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      if (error) throw error;

      // setSaveNotification("Profile updated & results saved!"); // We don't have this state exposed well to ResultPage maybe?
      // ResultPage has its own notification logic now.
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
      throw err; // Re-throw so ResultPage knows it failed
    } finally {
      setLoading(false);
    }
  };

  // Render the appropriate step
  const renderStep = () => {
    if (step === 0) {
      return (
        <CaseTypeStep
          formData={formData}
          error={error}
          onCaseTypeChange={handleCaseTypeChange}
          onNext={nextStep}
          isAuthenticated={isAuthenticated}
          loading={loading || isNavigating}
          onBack={() => window.history.back()}
        />
      );
    }

    if (!questionnaireData) {
      return (
        <div className="flex justify-center items-center min-h-60">
          Loading questionnaire...
        </div>
      );
    }

    const renderWithNotification = (content: React.ReactNode) => (
      <div>
        {saveNotification && (
          <Alert className="mb-4">
            <AlertDescription>{saveNotification}</AlertDescription>
          </Alert>
        )}
        {content}
      </div>
    );

    if (step > 0 && step <= questionnaireData.sections.length) {
      const sectionIndex = step - 1;
      const section = questionnaireData.sections[sectionIndex];

      return renderWithNotification(
        <QuestionStep
          title={section.title}
          description={`Please answer the following questions for ${section.title}`}
          questions={section.questions
            .filter((q: QuestionDefinition) => {
              if (q.id === "prior_marriage_termination_docs") {
                return formData.prior_marriages_exist === true;
              }
              return true;
            })
            .map((q: QuestionDefinition) => ({
              id: q.id as keyof FormData,
              label: q.label,
              type: q.type as
                | "text"
                | "textarea"
                | "number"
                | "date"
                | "boolean"
                | "select",
              options: q.options || undefined,
            }))}
          formData={formData}
          error={error}
          loading={loading || isNavigating}
          onChange={handleInputChange}
          setFormData={setFormData}
          onNext={nextStep}
          onBack={prevStep}
          onSaveForLater={handleSaveForLater}
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
          onSaveToProfile={user ? handleSaveToProfile : undefined}
        />,
      );
    }

    // Check if we're on the results page (after submitting)
    if (step === questionnaireData.sections.length + 2) {
      if (!sessionId) {
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading results...</p>
          </div>
        );
      }
      return (
        <ResultPage
          sessionId={sessionId}
          onRestart={async () => {
            // Clear all local state
            setLoading(false);
            setIsNavigating(false);
            setSessionId(null);
            setStep(0);
            setFormData({ caseType: "" });
            setIsEditing(false);
            setIsRestoredSession(false);
            localStorage.removeItem("visaCheckerSessionId");

            // Also clear the dead session from user's saved profile so it doesn't get auto-restored
            if (user?.id) {
              try {
                await supabase.from("user_profiles").upsert(
                  {
                    id: user.id,
                    profile_details: {
                      caseStrength: null,
                    },
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: "id" },
                );
              } catch {
                // Non-critical - just ignore if profile update fails
              }
            }
          }}
          onEdit={() => {
            setIsEditing(true);
            // Go back to first question step (Case Type is 0, First Q is 1)
            setStep(1);
          }}
          onSaveToProfile={handleSaveToProfile}
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
    const progressPercentage = Math.max(
      0,
      Math.min(100, Math.round((step / totalSteps) * 100)),
    );

    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-muted-foreground">
            Step {step} of {totalSteps}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {progressPercentage}% Complete
          </span>
        </div>

        <div className="w-full bg-secondary rounded-full h-3">
          <div
            className="bg-primary h-3 rounded-full transition-all duration-500 ease-in-out"
            style={{
              width: `${progressPercentage > 100 ? 100 : progressPercentage}%`,
            }}
          ></div>
        </div>

        <div className="mt-4 hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {sections.map((section: QuestionnaireSection, index: number) => {
            const isActive = index === currentSectionIndex;
            const isCompleted = index < currentSectionIndex;

            return (
              <div
                key={index}
                className={`p-3 rounded-lg text-center text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground border-2 border-primary"
                    : isCompleted
                      ? "bg-primary/20 text-primary border-2 border-primary/30"
                      : "bg-muted text-muted-foreground border-2 border-border"
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
                ? "bg-primary text-primary-foreground border-2 border-primary"
                : step > sections.length + 1
                  ? "bg-primary/20 text-primary border-2 border-primary/30"
                  : "bg-muted text-muted-foreground border-2 border-border"
            }`}
          >
            <div className="font-semibold">Review</div>
            <div className="text-[10px] mt-1">Step {sections.length + 1}</div>
          </div>

          {/* Results Step Indicator */}
          <div
            className={`p-3 rounded-lg text-center text-xs font-medium transition-all ${
              step === sections.length + 2
                ? "bg-primary text-primary-foreground border-2 border-primary"
                : "bg-muted text-muted-foreground border-2 border-border"
            }`}
          >
            <div className="font-semibold">Results</div>
            <div className="text-[10px] mt-1">Step {sections.length + 2}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-4 md:py-8 max-w-4xl">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
          Visa Case Strength Checker
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Assess your IR-1/CR-1 visa case strength with our guided questionnaire
        </p>
      </div>

      {renderProgressSections()}

      <Card className="p-4 md:p-8 shadow-lg border border-border mx-2">
        {renderStep()}
      </Card>
    </div>
  );
}

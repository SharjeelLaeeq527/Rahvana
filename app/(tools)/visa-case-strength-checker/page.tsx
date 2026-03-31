"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { ResultPage } from "./result/ResultPage";
import CaseTypeStep from "./components/CaseTypeStep";
import QuestionStep from "./components/QuestionStep";
import ReviewStep from "./components/ReviewStep";
import { Questionnaire } from "@/lib/visa-checker/engine-types";
import { createBrowserClient } from "@supabase/ssr";
import { 
  mapProfileToVisaChecker, 
  mapFormToProfile 
} from "@/lib/autoFill/mapper";
import type { MasterProfile } from "@/types/profile";

export default function VisaCaseStrengthChecker() {
  const [step, setStep] = useState<number>(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({
    caseType: "",
  });
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [profileLoaded, setProfileLoaded] = useState(false);
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Load Questionnaire when caseType changes
  useEffect(() => {
    if (formData.caseType) {
      const slug = String(formData.caseType).toLowerCase().replace(/\//g, "-");
      setLoading(true);
      fetch(`/api/visa-checker/categories/${slug}/questionnaire`)
        .then(res => res.json())
        .then(data => {
          setQuestionnaire(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error loading questionnaire:", err);
          setError("Failed to load questionnaire for this visa category.");
          setLoading(false);
        });
    }
  }, [formData.caseType, supabase]);

  // Auto-fill profile data & Restore saved session
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      if (profileLoaded) return;

      try {
        const { data } = await supabase
          .from("user_profiles")
          .select("profile_details")
          .eq("id", user.id)
          .single();

        if (data?.profile_details) {
          const profile = data.profile_details as MasterProfile;

          // 1. Check for specific Saved Case Strength Session
          if (profile.caseStrength?.lastSessionId && profile.caseStrength?.answers) {
            setFormData({
              caseType: String(profile.caseStrength.caseType || ""),
              ...profile.caseStrength.answers,
            });
            setSessionId(profile.caseStrength.lastSessionId);
            setProfileLoaded(true);
            return;
          }

          // 2. Fallback: Generic Auto-fill
          const mappedData = mapProfileToVisaChecker(profile);
          setFormData(prev => ({
            ...prev,
            ...mappedData
          }));
          setProfileLoaded(true);
        }
      } catch (err) {
        console.error("Error auto-filling profile:", err);
      }
    };

    fetchProfile();
  }, [user?.id, profileLoaded, supabase]);

  const handleCaseTypeChange = (caseType: string) => {
    setFormData({ caseType });
    setError(null);
  };

  const handleSaveToProfile = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const profileUpdate = mapFormToProfile(formData);
      const caseStrengthData = {
        caseType: formData.caseType,
        answers: formData,
        lastSessionId: sessionId,
      };

      const { error } = await supabase.from("user_profiles").upsert(
        {
          id: user.id,
          profile_details: {
            ...profileUpdate,
            caseStrength: caseStrengthData,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (error) throw error;
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const validateCurrentStep = () => {
    if (step === 0) {
      if (!formData.caseType) {
        setError("Please select a visa category.");
        return false;
      }
      return true;
    }

    if (questionnaire && step <= questionnaire.sections.length) {
      const section = questionnaire.sections[step - 1];
      for (const q of section.questions) {
        // Skip validation for hidden questions
        if (q.visible_if) {
          // Simple visibility check (matching QuestionStep.tsx logic)
          const match = q.visible_if.match(/^(\w+)\s*(==|!=|IN)\s*(.+)$/);
          if (match) {
            const [, key, op, valStr] = match;
            const currentVal = formData[key];
            const targetVal = valStr.trim().replace(/^'|'$/g, "");
            let visible = true;
            
            if (op === "==") {
              if (targetVal === "true") visible = currentVal === true;
              else if (targetVal === "false") visible = currentVal === false;
              else visible = String(currentVal ?? "") === targetVal;
            } else if (op === "!=") {
              if (targetVal === "true") visible = currentVal !== true;
              else if (targetVal === "false") visible = currentVal !== false;
              else visible = String(currentVal ?? "") !== targetVal;
            } else if (op === "IN") {
              const options = valStr
                .replace(/^\(|\)$/g, "")
                .split(",")
                .map((s) => s.trim().replace(/^'|'$/g, ""));
              visible = options.includes(String(currentVal ?? ""));
            }

            if (!visible) continue;
          }
        }

        const val = formData[q.id];
        if (q.type !== "boolean" && (val === undefined || val === null || val === "")) {
          setError(`Please provide an answer for: ${q.label}`);
          return false;
        }
      }
    }
    return true;
  };

  const nextStep = async () => {
    if (!validateCurrentStep()) return;

    // Create session if on first step
    if (step === 0 && !sessionId) {
      setLoading(true);
      try {
        const res = await fetch("/api/visa-checker/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caseType: formData.caseType }),
        });
        const data = await res.json();
        if (res.ok) {
          setSessionId(data.sessionId);
        } else {
          throw new Error(data.error || "Failed to create session");
        }
      } catch (err) {
        setError(String(err));
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    setStep(prev => prev + 1);
    setError(null);
  };

  const prevStep = () => {
    if (step === 0) {
      window.history.back();
    } else {
      setStep(prev => prev - 1);
      setError(null);
    }
  };

  const renderCurrentStep = () => {
    if (step === 0) {
      return (
        <CaseTypeStep
          formData={{ caseType: String(formData.caseType) }}
          error={error || undefined}
          onCaseTypeChange={handleCaseTypeChange}
          onNext={nextStep}
          isAuthenticated={isAuthenticated}
          loading={loading}
          onBack={prevStep}
        />
      );
    }

    if (!questionnaire) return <div className="p-20 text-center">Loading...</div>;

    if (step <= questionnaire.sections.length) {
      return (
        <QuestionStep
          questionnaire={questionnaire}
          section={questionnaire.sections[step - 1]}
          formData={formData}
          error={error || undefined}
          loading={loading}
          onChange={(id, val) => setFormData(prev => ({ ...prev, [id]: val }))}
          setFormData={setFormData}
          onNext={nextStep}
          onBack={prevStep}
        />
      );
    }

    if (step === questionnaire.sections.length + 1) {
      return (
        <ReviewStep
          questionnaire={questionnaire}
          formData={formData}
          error={error || undefined}
          loading={loading}
          onSubmit={async () => {
            if (!sessionId) return;
            setLoading(true);
            try {
              const answers = { ...formData };
              delete answers.caseType;

              await fetch(`/api/visa-checker/session/${sessionId}/answers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers }),
              });

              const res = await fetch(`/api/visa-checker/session/${sessionId}/submit`, {
                method: "POST",
              });
              
              if (res.ok) {
                setStep(prev => prev + 1);
              } else {
                throw new Error("Failed to analyze results.");
              }
            } catch (err) {
              setError(String(err));
            } finally {
              setLoading(false);
            }
          }}
          onBack={prevStep}
          onSaveToProfile={user ? handleSaveToProfile : undefined} 
        />
      );
    }

    if (step === questionnaire.sections.length + 2) {
      return (
        <ResultPage
          sessionId={sessionId!}
          onRestart={() => window.location.reload()}
          onEdit={() => setStep(questionnaire.sections.length + 1)}
          onSaveToProfile={user ? handleSaveToProfile : undefined}
        />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {renderCurrentStep()}
      </div>
    </div>
  );
}

import React from "react";
import { Button } from "@/components/ui/button";
import { ReviewStepProps } from "../types";
import { Section, Question } from "@/lib/visa-checker/engine-types";

const ReviewStep = ({
  questionnaire,
  formData,
  error,
  loading,
  onSubmit,
  onBack,
  onSaveToProfile,
}: ReviewStepProps) => {
  const formatValue = (value: unknown, type: string) => {
    if (type === "boolean") {
      return value === true ? "Yes" : "No";
    }
    
    if (value === undefined || value === null || value === "") return "Not provided";
    
    if (type === "date") {
      try {
        return new Date(value as string).toLocaleDateString();
      } catch {
        return String(value);
      }
    }
    
    if (type === "number") {
      return Number(value).toLocaleString();
    }
    
    return String(value);
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-3">Review Your Information</h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Please review all the information you&apos;ve entered for your {questionnaire.title} before submitting.
        </p>
      </div>

      {onSaveToProfile && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-blue-900">Sync with your Profile</h3>
            <p className="text-sm text-blue-700 mt-1">
              Save these details to your main profile to auto-fill future forms.
            </p>
          </div>
          <Button
            onClick={onSaveToProfile}
            variant="outline"
            className="bg-white hover:bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap"
          >
            Update Main Profile
          </Button>
        </div>
      )}

      <div className="space-y-6">
        {questionnaire.sections.map((section: Section) => (
          <div key={section.id} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <div className="bg-teal-100 text-teal-800 w-10 h-10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              {section.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {section.questions.map((q: Question) => (
                <div key={q.id}>
                  <p className="text-sm font-medium text-slate-500 mb-1">{q.label}</p>
                  <p className="text-lg font-semibold text-slate-900">{formatValue(formData[q.id], q.type)}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border-l-4 border-destructive rounded-lg text-destructive">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-destructive mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="flex flex-row justify-between gap-2 sm:gap-4 pt-4">
        <Button
          onClick={onBack}
          variant="outline"
          disabled={loading}
          className="bg-white hover:bg-slate-50 text-secondary-foreground border-input py-6 text-lg"
        >
          ← Previous
        </Button>
        <Button
          onClick={onSubmit}
          disabled={loading}
          className="bg-teal-600 hover:bg-teal-700 text-white py-6 text-xl px-8 shadow-lg shadow-teal-100 transition-all hover:scale-[1.02]"
        >
          {loading ? "Analyzing..." : "Confirm & Submit Assessment"}
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;

"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleSwitch } from "@/app/components/interview-prep/ToggleSwitch";
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
import CountryAutocomplete from "@/app/components/shared/CountryAutoComplete";

type CaseType = "Spouse";

interface FormData {
  caseType: CaseType | "";
  // Basic Profile
  sponsor_full_name?: string;
  beneficiary_full_name?: string;
  sponsor_dob?: string;
  beneficiary_dob?: string;
  country_of_residence?: string;
  relationship_start_date?: string;
  marriage_date?: string;
  spousal_relationship_type?: string;
  intended_us_state_of_residence?: string;
  // Education & Employment Background
  highest_education_level?: string;
  highest_education_field?: string;
  current_occupation_role?: string;
  industry_sector?: string;
  prior_military_service?: boolean;
  specialized_weapons_training?: boolean;
  unofficial_armed_groups?: boolean;
  employer_type?: string;
  // Relationship Strength
  how_did_you_meet?: string;
  number_of_in_person_visits?: number;
  cohabitation_proof?: boolean;
  shared_financial_accounts?: boolean;
  wedding_photos_available?: boolean;
  communication_logs?: boolean;
  money_transfer_receipts_available?: boolean;
  driving_license_copy_available?: boolean;
  // Immigration History
  previous_visa_applications?: boolean;
  previous_visa_denial?: boolean;
  overstay_or_violation?: boolean;
  criminal_record?: boolean;
  // Financial Profile
  sponsor_annual_income?: number;
  household_size?: number;
  has_tax_returns?: boolean;
  has_employment_letter?: boolean;
  has_paystubs?: boolean;
  joint_sponsor_available?: boolean;
  i864_affidavit_submitted?: boolean;
  i864_supporting_financial_documents?: boolean;
  // Core Identity Documents
  urdu_marriage_certificate?: boolean;
  english_translation_certificate?: boolean;
  union_council_certificate?: boolean;
  family_registration_certificate?: boolean;
  birth_certificates?: boolean;
  // Passport & Police Documents
  passports_available?: boolean;
  passport_copy_available?: boolean;
  valid_police_clearance_certificate?: boolean;
  // Interview & Medical Documents
  ds260_confirmation?: boolean;
  interview_letter?: boolean;
  courier_registration?: boolean;
  medical_report_available?: boolean;
  polio_vaccination_certificate?: boolean;
  covid_vaccination_certificate?: boolean;
  passport_photos_2x2?: boolean;
}

interface CaseTypeStepProps {
  formData: FormData;
  error: string | null;
  onCaseTypeChange: (caseType: CaseType) => void;
  isAuthenticated: boolean;
  loading?: boolean;
  onNext: () => void;
  onBack: () => void;
}

const CaseTypeStep = ({
  formData,
  error,
  onCaseTypeChange,
  isAuthenticated,
  loading = false,
  onNext,
  onBack,
}: CaseTypeStepProps) => (
  <div className="space-y-8">
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold text-slate-900 mb-3">
        Select Case Type
      </h2>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
        Please select the type of visa case you want to assess.
      </p>
      {isAuthenticated && (
        <div className="mt-4">
          <button
            onClick={() =>
              (window.location.href = "/visa-case-strength-checker/my-cases")
            }
            suppressHydrationWarning
            className="text-teal-600 hover:text-teal-700 hover:underline text-base font-medium"
          >
            See your cases →
          </button>
        </div>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* ACTIVE: SPOUSE */}
      <button
        type="button"
        suppressHydrationWarning
        className={`p-5 md:p-8 border-2 rounded-xl text-center transition-all cursor-pointer ${
          formData.caseType === "Spouse"
            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        }`}
        onClick={() => onCaseTypeChange("Spouse")}
      >
        <div className="mx-auto bg-primary/10 text-primary w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 md:h-8 md:w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="font-bold text-lg md:text-xl mb-2 text-foreground">
          Spouse Visa
        </h3>
        <p className="text-base text-muted-foreground">
          IR-1 / CR-1 – Spouse of U.S. Citizen
        </p>
      </button>

      {/* COMING SOON: PARENT */}
      <div className="p-8 border-2 rounded-xl text-center bg-muted/30 border-border opacity-70">
        <div className="mx-auto bg-muted text-muted-foreground w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="font-bold text-xl mb-2 text-muted-foreground">
          Parent Visa
        </h3>
        <p className="text-base text-muted-foreground">
          IR-5 – Parent of U.S. Citizen
        </p>
        <span className="inline-block mt-3 px-3 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground">
          Coming Soon
        </span>
      </div>

      {/* COMING SOON: CHILD */}
      <div className="p-8 border-2 rounded-xl text-center bg-muted/30 border-border opacity-70">
        <div className="mx-auto bg-muted text-muted-foreground w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <h3 className="font-bold text-xl mb-2 text-muted-foreground">
          Child Visa
        </h3>
        <p className="text-base text-muted-foreground">
          IR-2 – Unmarried Child of U.S. Citizen
        </p>
        <span className="inline-block mt-3 px-3 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground">
          Coming Soon
        </span>
      </div>

      {/* COMING SOON: FAMILY */}
      <div className="p-8 border-2 rounded-xl text-center bg-muted/30 border-border opacity-70">
        <div className="mx-auto bg-muted text-muted-foreground w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="font-bold text-xl mb-2 text-muted-foreground">
          Family Visa
        </h3>
        <p className="text-base text-muted-foreground">
          F1 / F2A / F2B / F3 / F4 – Family Preference Visas
        </p>
        <span className="inline-block mt-3 px-3 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground">
          Coming Soon
        </span>
      </div>

      {/* COMING SOON: K1 */}
      <div className="p-8 border-2 rounded-xl text-center bg-muted/30 border-border opacity-70">
        <div className="mx-auto bg-muted text-muted-foreground w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="font-bold text-xl mb-2 text-muted-foreground">
          K1 Visa
        </h3>
        <p className="text-base text-muted-foreground">
          K1 – Fiance(e) of US Citizen
        </p>
        <span className="inline-block mt-3 px-3 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground">
          Coming Soon
        </span>
      </div>

      {/* COMING SOON: B1/B2 */}
      <div className="p-8 border-2 rounded-xl text-center bg-muted/30 border-border opacity-70">
        <div className="mx-auto bg-muted text-muted-foreground w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="font-bold text-xl mb-2 text-muted-foreground">
          B1/B2 Visa
        </h3>
        <p className="text-base text-muted-foreground">
          B1 / B2 – Visitor Visa
        </p>
        <span className="inline-block mt-3 px-3 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground">
          Coming Soon
        </span>
      </div>
    </div>

    {error && (
      <div className="p-4 bg-destructive/10 border-l-4 border-destructive rounded-lg text-destructive">
        <div className="flex items-start">
          <svg
            className="h-5 w-5 text-destructive mt-0.5 mr-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    )}

    <div className="flex flex-row justify-between gap-2 sm:gap-4 pt-6">
      <Button
        onClick={onBack}
        suppressHydrationWarning
        variant="outline"
        className="bg-white hover:bg-slate-50 text-secondary-foreground border-input py-6 text-lg"
      >
        ← Back
      </Button>

      <Button
        onClick={onNext}
        suppressHydrationWarning
        className="bg-teal-600 hover:bg-teal-700 text-white py-4 md:py-6 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={!formData.caseType || loading}
      >
        {loading ? "Creating Session..." : "Next →"}
      </Button>
    </div>
  </div>
);

interface QuestionStepProps {
  title: string;
  description: string;
  questions: Array<{
    id: keyof FormData;
    label: string;
    type: "text" | "textarea" | "number" | "date" | "boolean" | "select";
    options?: string | string[];
    risk_tag?: string;
  }>;
  formData: FormData;
  error: string | null;
  loading?: boolean;
  onChange: (id: keyof FormData, value: unknown) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onNext: () => void;
  onBack: () => void;
  onSaveForLater?: () => void;
}

const QuestionStep = ({
  title,
  description,
  questions,
  formData,
  error,
  loading = false,
  onChange,
  setFormData,
  onNext,
  onBack,
  // onSaveForLater,
}: QuestionStepProps) => {
  const renderInput = (question: {
    id: keyof FormData;
    label: string;
    type: "text" | "textarea" | "number" | "date" | "boolean" | "select";
    options?: string | string[];
    risk_tag?: string;
  }) => {
    const value = formData[question.id] as
      | string
      | number
      | boolean
      | undefined;

    if (question.id === "country_of_residence") {
      return (
        <CountryAutocomplete
          formData={formData as unknown as Record<string, unknown>}
          setFormData={(data) => setFormData((prev) => ({ ...prev, ...data }))}
          hideLabel
          inputClassName="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-colors bg-background"
          placeholder="Start typing country..."
        />
      );
    }

    switch (question.type) {
      case "text":
      case "number":
      case "date":
        return (
          <input
            type={question.type}
            suppressHydrationWarning
            value={
              typeof value === "number"
                ? value.toString()
                : typeof value === "string"
                  ? value
                  : ""
            }
            onClick={(e) => {
              if (question.type === "date") {
                (e.currentTarget as HTMLInputElement).showPicker?.();
              }
            }}
            onChange={(e) =>
              onChange(
                question.id,
                question.type === "number"
                  ? Number(e.target.value)
                  : e.target.value,
              )
            }
            className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-colors bg-background"
            placeholder={`Enter ${question.label.toLowerCase()}`}
          />
        );
      case "textarea":
        return (
          <textarea
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(question.id, e.target.value)}
            className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-colors bg-background"
            placeholder={`Enter details for ${question.label.toLowerCase()}`}
            rows={4}
          />
        );
      case "boolean":
        return (
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-foreground">
              {question.label}
            </span>
            <ToggleSwitch
              checked={!!value}
              onChange={(checked) => onChange(question.id, checked)}
            />
          </div>
        );
      case "select":
        if (Array.isArray(question.options)) {
          return (
            <Select
              value={typeof value === "string" ? value : ""}
              onValueChange={(newValue) => onChange(question.id, newValue)}
            >
              <SelectTrigger className="w-full h-14">
                <SelectValue
                  placeholder={`Select ${question.label.toLowerCase()}`}
                />
              </SelectTrigger>
              <SelectContent>
                {question.options.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-3">{title}</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      <div className="space-y-8">
        {questions.map((question) => {
          // Hide US state question based on relationship type
          if (question.id === "intended_us_state_of_residence") {
            const relationshipType = formData.spousal_relationship_type;
            if (
              !relationshipType ||
              relationshipType === "Select" ||
              relationshipType === "No biological relation"
            ) {
              return null;
            }
          }

          // Hide field of study question unless education level qualifies
          if (question.id === "highest_education_field") {
            const educationLevel = formData.highest_education_level;
            const qualifyingLevels = [
              "Bachelor's degree",
              "Master's degree",
              "Doctorate (PhD)",
            ];

            if (!educationLevel || !qualifyingLevels.includes(educationLevel)) {
              return null;
            }
          }

          // Hide military / defense additional questions unless industry sector meets criteria
          if (
            question.id === "prior_military_service" ||
            question.id === "specialized_weapons_training" ||
            question.id === "unofficial_armed_groups"
          ) {
            const industrySector = formData.industry_sector;
            const qualifyingSectors = ["Military/Defense"];

            if (
              !industrySector ||
              !qualifyingSectors.includes(industrySector)
            ) {
              return null;
            }
          }

          let modifiedQuestion = question;
          if (question.id === "intended_us_state_of_residence") {
            modifiedQuestion = { ...question, type: "text" };
          }

          return (
            <div
              key={question.id}
              className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200"
            >
              {question.type !== "boolean" && (
                <label className="block text-lg font-semibold text-slate-800">
                  {modifiedQuestion.label}
                </label>
              )}
              {renderInput(modifiedQuestion)}
            </div>
          );
        })}

        {error && (
          <div className="p-4 bg-destructive/10 border-l-4 border-destructive rounded-lg text-destructive">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-destructive mt-0.5 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="flex flex-row justify-between gap-2 sm:gap-4 pt-6">
          <Button
            onClick={onBack}
            variant="outline"
            disabled={loading}
            className="bg-white hover:bg-slate-50 text-secondary-foreground border-input py-6 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            ← Previous
          </Button>
          <div className="flex flex-row gap-3">
            <Button
              onClick={onNext}
              suppressHydrationWarning
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 text-white py-4 md:py-6 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Please wait..." : "Next →"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ReviewStepProps {
  formData: FormData;
  error: string | null;
  loading: boolean;
  onSubmit: () => void;
  onBack: () => void;
  onSaveForLater?: () => void;
  onSaveToProfile?: () => Promise<void>;
}

const ReviewStep = ({
  formData,
  error,
  loading,
  onSubmit,
  onBack,
  // onSaveForLater,
  onSaveToProfile,
}: ReviewStepProps) => {
  // Helper function to format boolean values
  const formatBoolean = (value: boolean | undefined) => {
    if (value === undefined) return "Not answered";
    return value ? "Yes" : "No";
  };

  // Helper function to format dates
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "Not provided";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-3">
          Review Your Information
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Please review all the information you&apos;ve entered before
          submitting for analysis.
        </p>
      </div>

      {/* Save to Profile Option */}
      {onSaveToProfile && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-blue-900">
              Sync with your Profile
            </h3>
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

      <div className="space-y-8">
        {/* Case Type Section */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <div className="bg-teal-100 text-teal-800 w-10 h-10 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
              </svg>
            </div>
            Case Type
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-base text-slate-600 mb-1">Selected Type</p>
              <p className="text-lg font-semibold capitalize">
                {formData.caseType}
              </p>
            </div>
          </div>
        </div>

        {/* Basic Profile Section */}
        {(formData.sponsor_dob ||
          formData.beneficiary_dob ||
          formData.country_of_residence ||
          formData.relationship_start_date ||
          formData.marriage_date ||
          formData.spousal_relationship_type ||
          formData.intended_us_state_of_residence) && (
          <div className="bg-muted/30 rounded-xl p-6 border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
              <div className="bg-primary/20 text-primary w-10 h-10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  ></path>
                </svg>
              </div>
              Basic Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.sponsor_dob && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Sponsor DOB
                  </p>
                  <p className="text-lg font-semibold">
                    {formatDate(formData.sponsor_dob)}
                  </p>
                </div>
              )}
              {formData.beneficiary_dob && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Beneficiary DOB
                  </p>
                  <p className="text-lg font-semibold">
                    {formatDate(formData.beneficiary_dob)}
                  </p>
                </div>
              )}
              {formData.country_of_residence && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Country of Residence
                  </p>
                  <p className="text-lg font-semibold">
                    {formData.country_of_residence}
                  </p>
                </div>
              )}
              {formData.spousal_relationship_type && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Spousal Relationship Type
                  </p>
                  <p className="text-lg font-semibold">
                    {formData.spousal_relationship_type}
                  </p>
                </div>
              )}
              {formData.intended_us_state_of_residence && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Intended US State of Residence
                  </p>
                  <p className="text-lg font-semibold">
                    {formData.intended_us_state_of_residence}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 bg-card rounded-xl p-6 border border-border">
              <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
                <div className="bg-primary/20 text-primary w-10 h-10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 14l9-5-9-5-9 5 9 5z"
                    ></path>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 14l9-5-9-5-9 5 9 5z"
                    ></path>
                  </svg>
                </div>
                Education & Employment Background
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formData.highest_education_level && (
                  <div>
                    <p className="text-base text-muted-foreground mb-1">
                      Highest Education Level
                    </p>
                    <p className="text-lg font-semibold">
                      {formData.highest_education_level}
                    </p>
                  </div>
                )}
                {formData.highest_education_field && (
                  <div>
                    <p className="text-base text-muted-foreground mb-1">
                      Highest Education Field
                    </p>
                    <p className="text-lg font-semibold">
                      {formData.highest_education_field}
                    </p>
                  </div>
                )}
                {formData.current_occupation_role && (
                  <div>
                    <p className="text-base text-muted-foreground mb-1">
                      Current Occupation Role
                    </p>
                    <p className="text-lg font-semibold">
                      {formData.current_occupation_role}
                    </p>
                  </div>
                )}
                {formData.industry_sector && (
                  <div>
                    <p className="text-base text-muted-foreground mb-1">
                      Industry Sector
                    </p>
                    <p className="text-lg font-semibold">
                      {formData.industry_sector}
                    </p>
                  </div>
                )}
                {formData.prior_military_service !== undefined && (
                  <div>
                    <p className="text-base text-muted-foreground mb-1">
                      Prior Military Service
                    </p>
                    <p className="text-lg font-semibold">
                      {formatBoolean(formData.prior_military_service)}
                    </p>
                  </div>
                )}
                {formData.specialized_weapons_training !== undefined && (
                  <div>
                    <p className="text-base text-muted-foreground mb-1">
                      Specialized Weapons Training
                    </p>
                    <p className="text-lg font-semibold">
                      {formatBoolean(formData.specialized_weapons_training)}
                    </p>
                  </div>
                )}
                {formData.unofficial_armed_groups !== undefined && (
                  <div>
                    <p className="text-base text-muted-foreground mb-1">
                      Unofficial Armed Groups
                    </p>
                    <p className="text-lg font-semibold">
                      {formatBoolean(formData.unofficial_armed_groups)}
                    </p>
                  </div>
                )}
                {formData.employer_type && (
                  <div>
                    <p className="text-base text-muted-foreground mb-1">
                      Employer Type
                    </p>
                    <p className="text-lg font-semibold">
                      {formData.employer_type}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Relationship Strength Section */}
        {(formData.how_did_you_meet ||
          formData.number_of_in_person_visits !== undefined ||
          formData.cohabitation_proof !== undefined ||
          formData.shared_financial_accounts !== undefined ||
          formData.wedding_photos_available !== undefined ||
          formData.communication_logs !== undefined ||
          formData.money_transfer_receipts_available !== undefined ||
          formData.driving_license_copy_available !== undefined) && (
          <div className="bg-muted/30 rounded-xl p-6 border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
              <div className="bg-primary/20 text-primary w-10 h-10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  ></path>
                </svg>
              </div>
              Relationship Strength
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.how_did_you_meet && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    How Did You Meet
                  </p>
                  <p className="text-lg font-semibold">
                    {formData.how_did_you_meet}
                  </p>
                </div>
              )}
              {formData.number_of_in_person_visits !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Number of In-Person Visits
                  </p>
                  <p className="text-lg font-semibold">
                    {formData.number_of_in_person_visits}
                  </p>
                </div>
              )}
              {formData.cohabitation_proof !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Cohabitation Proof
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.cohabitation_proof)}
                  </p>
                </div>
              )}
              {formData.shared_financial_accounts !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Shared Financial Accounts
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.shared_financial_accounts)}
                  </p>
                </div>
              )}
              {formData.wedding_photos_available !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Wedding Photos Available
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.wedding_photos_available)}
                  </p>
                </div>
              )}
              {formData.communication_logs !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Communication Logs
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.communication_logs)}
                  </p>
                </div>
              )}
              {formData.money_transfer_receipts_available !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Money Transfer Receipts Available
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.money_transfer_receipts_available)}
                  </p>
                </div>
              )}
              {formData.driving_license_copy_available !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Driving License Copy Available
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.driving_license_copy_available)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Immigration History Section */}
        {(formData.previous_visa_applications !== undefined ||
          formData.previous_visa_denial !== undefined ||
          formData.overstay_or_violation !== undefined ||
          formData.criminal_record !== undefined) && (
          <div className="bg-muted/30 rounded-xl p-6 border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
              <div className="bg-primary/20 text-primary w-10 h-10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9"
                  ></path>
                </svg>
              </div>
              Immigration History
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.previous_visa_applications !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Previous Visa Applications
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.previous_visa_applications)}
                  </p>
                </div>
              )}
              {formData.previous_visa_denial !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Previous Visa Denial
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.previous_visa_denial)}
                  </p>
                </div>
              )}
              {formData.overstay_or_violation !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Overstay or Violation
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.overstay_or_violation)}
                  </p>
                </div>
              )}
              {formData.criminal_record !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Criminal Record
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.criminal_record)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Financial Profile Section */}
        {(formData.sponsor_annual_income ||
          formData.household_size ||
          formData.has_tax_returns !== undefined ||
          formData.has_employment_letter !== undefined ||
          formData.has_paystubs !== undefined ||
          formData.joint_sponsor_available !== undefined ||
          formData.i864_affidavit_submitted !== undefined ||
          formData.i864_supporting_financial_documents !== undefined) && (
          <div className="bg-muted/30 rounded-xl p-6 border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
              <div className="bg-primary/20 text-primary w-10 h-10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              Financial Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.sponsor_annual_income && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Sponsor Annual Income
                  </p>
                  <p className="text-lg font-semibold">
                    ${formData.sponsor_annual_income?.toLocaleString()}
                  </p>
                </div>
              )}
              {formData.household_size && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Household Size
                  </p>
                  <p className="text-lg font-semibold">
                    {formData.household_size}
                  </p>
                </div>
              )}
              {formData.has_tax_returns !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Has Tax Returns
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.has_tax_returns)}
                  </p>
                </div>
              )}
              {formData.has_employment_letter !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Has Employment Letter
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.has_employment_letter)}
                  </p>
                </div>
              )}
              {formData.has_paystubs !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Has Paystubs
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.has_paystubs)}
                  </p>
                </div>
              )}
              {formData.joint_sponsor_available !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Joint Sponsor Available
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.joint_sponsor_available)}
                  </p>
                </div>
              )}
              {formData.i864_affidavit_submitted !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    I-864 Affidavit Submitted
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.i864_affidavit_submitted)}
                  </p>
                </div>
              )}
              {formData.i864_supporting_financial_documents !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    I-864 Supporting Financial Documents
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(
                      formData.i864_supporting_financial_documents,
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Core Identity Documents Section */}
        {(formData.urdu_marriage_certificate !== undefined ||
          formData.english_translation_certificate !== undefined ||
          formData.union_council_certificate !== undefined ||
          formData.family_registration_certificate !== undefined ||
          formData.birth_certificates !== undefined) && (
          <div className="bg-muted/30 rounded-xl p-6 border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
              <div className="bg-primary/20 text-primary w-10 h-10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
              </div>
              Core Identity Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.urdu_marriage_certificate !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Urdu Marriage Certificate
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.urdu_marriage_certificate)}
                  </p>
                </div>
              )}
              {formData.english_translation_certificate !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    English Translation Certificate
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.english_translation_certificate)}
                  </p>
                </div>
              )}
              {formData.union_council_certificate !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Union Council Certificate
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.union_council_certificate)}
                  </p>
                </div>
              )}
              {formData.family_registration_certificate !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Family Registration Certificate
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.family_registration_certificate)}
                  </p>
                </div>
              )}
              {formData.birth_certificates !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Birth Certificates
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.birth_certificates)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Passport & Police Documents Section */}
        {(formData.passports_available !== undefined ||
          formData.passport_copy_available !== undefined ||
          formData.valid_police_clearance_certificate !== undefined) && (
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <div className="bg-teal-100 text-teal-800 w-10 h-10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  ></path>
                </svg>
              </div>
              Passport & Police Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.passports_available !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Passports Available
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.passports_available)}
                  </p>
                </div>
              )}
              {formData.passport_copy_available !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Passport Copy Available
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.passport_copy_available)}
                  </p>
                </div>
              )}
              {formData.valid_police_clearance_certificate !== undefined && (
                <div>
                  <p className="text-base text-slate-600 mb-1">
                    Valid Police Clearance Certificate
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.valid_police_clearance_certificate)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interview & Medical Documents Section */}
        {(formData.ds260_confirmation !== undefined ||
          formData.interview_letter !== undefined ||
          formData.courier_registration !== undefined ||
          formData.medical_report_available !== undefined ||
          formData.polio_vaccination_certificate !== undefined ||
          formData.covid_vaccination_certificate !== undefined ||
          formData.passport_photos_2x2 !== undefined) && (
          <div className="bg-muted/30 rounded-xl p-6 border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
              <div className="bg-primary/20 text-primary w-10 h-10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  ></path>
                </svg>
              </div>
              Interview & Medical Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.ds260_confirmation !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    DS-260 Confirmation
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.ds260_confirmation)}
                  </p>
                </div>
              )}
              {formData.interview_letter !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Interview Letter
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.interview_letter)}
                  </p>
                </div>
              )}
              {formData.courier_registration !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Courier Registration
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.courier_registration)}
                  </p>
                </div>
              )}
              {formData.medical_report_available !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Medical Report Available
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.medical_report_available)}
                  </p>
                </div>
              )}
              {formData.polio_vaccination_certificate !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Polio Vaccination Certificate
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.polio_vaccination_certificate)}
                  </p>
                </div>
              )}
              {formData.covid_vaccination_certificate !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    COVID Vaccination Certificate
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.covid_vaccination_certificate)}
                  </p>
                </div>
              )}
              {formData.passport_photos_2x2 !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Passport Photos (2x2)
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.passport_photos_2x2)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 border-l-4 border-destructive rounded-lg text-destructive">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-destructive mt-0.5 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="flex flex-row justify-between gap-2 sm:gap-4 pt-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="bg-white hover:bg-slate-50 text-secondary-foreground border-input py-6 text-lg"
          >
            ← Previous
          </Button>
          <div className="flex flex-row gap-3">
            <Button
              onClick={onSubmit}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground py-4 md:py-6 text-lg"
            >
              {loading ? "Submitting..." : "Submit for Analysis →"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
          union_council_certificate: false,
          family_registration_certificate: false,
          birth_certificates: false,
          passports_available: false,
          passport_copy_available: false,
          valid_police_clearance_certificate: false,
          ds260_confirmation: false,
          interview_letter: false,
          courier_registration: false,
          medical_report_available: false,
          polio_vaccination_certificate: false,
          covid_vaccination_certificate: false,
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
      setStep(1); // first question
    }
  }, []);

  // Auto-jump to results if session restored
  useEffect(() => {
    if (
      isRestoredSession &&
      sessionId &&
      questionnaireData &&
      step !== questionnaireData.sections.length + 2 &&
      !isEditing
    ) {
      // Only jump if we have substantial data?
      // For now, if sessionId is present (restored from profile), we jump.
      setStep(questionnaireData.sections.length + 2);
      setIsRestoredSession(false);
    }
  }, [sessionId, questionnaireData, step, isEditing, isRestoredSession]);

  // Define valid question keys to validate against the enum
  const validQuestionKeys: (keyof FormData)[] = [
    // Basic Profile
    "sponsor_dob",
    "beneficiary_dob",
    "country_of_residence",
    "marriage_date",
    "spousal_relationship_type",
    "intended_us_state_of_residence",
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
    // Immigration History
    "previous_visa_applications",
    "previous_visa_denial",
    "overstay_or_violation",
    "criminal_record",
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
    "union_council_certificate",
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
    "covid_vaccination_certificate",
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
            return;
          }

          if (
            question.type === "date" &&
            typeof fieldValue === "string" &&
            fieldValue === ""
          ) {
            setError(`Please enter a valid date for ${question.label}`);
            isNavigatingRef.current = false;
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

    if (step > 0 && step <= questionnaireData.sections.length) {
      const sectionIndex = step - 1;
      const section = questionnaireData.sections[sectionIndex];

      return renderWithNotification(
        <QuestionStep
          title={section.title}
          description={`Please answer the following questions for ${section.title}`}
          questions={section.questions.map((q: QuestionDefinition) => ({
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
          onRestart={() => {
            setSessionId("");
            setStep(0);
            setFormData({} as FormData);
            setSessionId(null);
            setIsEditing(false);
            localStorage.removeItem("visaCheckerSessionId");
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

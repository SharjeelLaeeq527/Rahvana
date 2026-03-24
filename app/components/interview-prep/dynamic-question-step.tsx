"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleSwitch } from "./ToggleSwitch";
import type {
  DynamicQuestion,
  QuestionnaireSection,
} from "@/data/interview-categories/schema";

interface DynamicQuestionStepProps {
  section: QuestionnaireSection;
  formData: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onNext: () => void;
  onBack: () => void;
  error?: string | null;
  setError: (msg: string | null) => void;
}

export function DynamicQuestionStep({
  section,
  formData,
  onChange,
  onNext,
  onBack,
  error,
  setError,
}: DynamicQuestionStepProps) {
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const formatFieldName = (fieldKey: string): string => {
    return fieldKey
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!section) {
    return null;
  }

  const validateQuestion = (
    question: DynamicQuestion,
    value: unknown,
  ): string | null => {
    const fieldName = formatFieldName(question.key);
    const shouldValidateRequired = question.type !== "boolean";

    if (question.required && shouldValidateRequired) {
      if (value === undefined || value === null) {
        return `Error: ${fieldName} is required`;
      }

      if (typeof value === "string" && value.trim() === "") {
        return `Error: ${fieldName} is required`;
      }
    }

    if (value !== undefined && value !== null && value !== "") {
      if (question.validation) {
        if (
          typeof value === "string" &&
          question.validation.maxLength &&
          value.length > question.validation.maxLength
        ) {
          return `Error: ${fieldName} must be no more than ${question.validation.maxLength} characters`;
        }

        if (
          typeof value === "number" &&
          question.validation.min !== undefined &&
          value < question.validation.min
        ) {
          return `Error: ${fieldName} must be at least ${question.validation.min}`;
        }

        if (
          typeof value === "number" &&
          question.validation.max !== undefined &&
          value > question.validation.max
        ) {
          return `Error: ${fieldName} must be no more than ${question.validation.max}`;
        }
      }
    }

    return null;
  };

  const handleInputChange = (key: string, value: unknown) => {
    onChange(key, value);

    // Reset dependent fields when parent changes
    if (key === "current_employment_status" && value === false) {
      onChange("current_employer_role", "");
      onChange("work_experience_years", "");
      onChange("work_experience_details", "");
    }

    // Reset home country fields when plan_to_return_home changes to false
    if (key === "plan_to_return_home" && value === false) {
      onChange("why_will_return", "");
      onChange("job_prospects_home_country", "");
      onChange("family_in_home_country", false);
      onChange("family_details", "");
      onChange("property_or_assets_home", false);
      onChange("property_details", "");
    }

    // Reset USA stay fields when plan_to_return_home changes to true
    if (key === "plan_to_return_home" && value === true) {
      onChange("consider_staying_usa", false);
      onChange("usa_stay_plans", "");
    }

    // Auto-scroll slightly (25px from top) when answer changes
    const el = questionRefs.current[key];
    if (el) {
      const rect = el.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const top = rect.top + scrollTop - 25;

      window.scrollTo({
        top,
        behavior: "smooth",
      });
    }
  };

  const shouldSkipQuestion = (question: DynamicQuestion): boolean => {
    if (!question.dependsOn) {
      return false;
    }

    const fieldValue = formData[question.dependsOn.key];

    if (question.dependsOn.value !== undefined) {
      return fieldValue !== question.dependsOn.value;
    }

    if (question.dependsOn.valueIn) {
      return !question.dependsOn.valueIn.includes(fieldValue);
    }

    if (question.dependsOn.notValue !== undefined) {
      return fieldValue === question.dependsOn.notValue;
    }

    return false;
  };

  const handleNext = () => {
    let hasErrors = false;
    let firstErrorMessage = "";

    for (const question of section.questions) {
      if (shouldSkipQuestion(question)) {
        continue;
      }

      if (question.required && question.type !== "boolean") {
        const value = formData[question.key];
        const errorMsg = validateQuestion(question, value);

        if (errorMsg) {
          if (!firstErrorMessage) {
            firstErrorMessage = errorMsg;
            const el = questionRefs.current[question.key];
            if (el) {
              const rect = el.getBoundingClientRect();
              const scrollTop =
                window.pageYOffset || document.documentElement.scrollTop;
              const top = rect.top + scrollTop - 100;
              window.scrollTo({ top, behavior: "smooth" });
            }
          }
          hasErrors = true;
          break;
        }
      }
    }

    if (hasErrors) {
      setError("Please complete all required fields before proceeding.");
      return;
    }

    setError(null);
    onNext();
  };

  const renderQuestion = (question: DynamicQuestion) => {
    const value = formData[question.key];

    switch (question.type) {
      case "text":
        return (
          <Input
            value={(value as string) || ""}
            onChange={(e) => handleInputChange(question.key, e.target.value)}
            placeholder={question.placeholder}
            type="text"
            className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          />
        );
      case "textarea":
        return (
          <Textarea
            value={(value as string) || ""}
            onChange={(e) => handleInputChange(question.key, e.target.value)}
            placeholder={question.placeholder}
            rows={4}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          />
        );
      case "number":
        return (
          <Input
            value={(value as number) || ""}
            onChange={(e) =>
              handleInputChange(
                question.key,
                e.target.value === "" ? "" : parseFloat(e.target.value),
              )
            }
            placeholder={question.placeholder}
            type="number"
            min={question.validation?.min}
            max={question.validation?.max}
            className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          />
        );
      case "date":
        return (
          <Input
            value={(value as string) || ""}
            onChange={(e) => handleInputChange(question.key, e.target.value)}
            type="date"
            className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
            onClick={(e) => {
              (e.currentTarget as HTMLInputElement).showPicker?.();
            }}
          />
        );
      case "boolean":
        return (
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-base font-medium text-foreground">
              {question.label}
            </span>
            <ToggleSwitch
              checked={(value as boolean) || false}
              onChange={(checked) =>
                handleInputChange(question.key, checked)
              }
            />
          </div>
        );
      case "select":
        return (
          <Select
            value={(value as string) || ""}
            onValueChange={(val) => handleInputChange(question.key, val)}
          >
            <SelectTrigger className="w-full h-12 p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            value={(value as string) || ""}
            onChange={(e) => handleInputChange(question.key, e.target.value)}
            className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          />
        );
    }
  };

  return (
    <div className="space-y-8 mx-2">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-3">
          {section.title}
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {section.description}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-red-500 mt-0.5 mr-3"
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

      <div className="space-y-6">
        {section.questions.map((question) => {
          if (shouldSkipQuestion(question)) {
            return null;
          }

          return (
            <div
              key={question.key}
              ref={(el: HTMLDivElement | null) => {
                questionRefs.current[question.key] = el;
              }}
              className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200"
            >
              {question.type !== "boolean" && (
                <label className="block text-lg font-semibold text-foreground">
                  {question.label}
                  {question.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
              )}
              {renderQuestion(question)}
              {question.helpText && question.type !== "boolean" && (
                <p className="text-xs text-slate-500 mt-2">{question.helpText}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-6">
        <Button
          onClick={onBack}
          variant="outline"
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 px-6 py-3 text-base"
        >
          ← Back
        </Button>
        <Button
          onClick={handleNext}
          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 text-base"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}

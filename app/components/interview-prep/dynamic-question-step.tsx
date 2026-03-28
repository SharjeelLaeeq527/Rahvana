"use client";

import { useRef, useState } from "react";
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const processTemplate = (template: string): string => {
    if (!template) return template;
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = formData[key];
      return value !== undefined && value !== null ? String(value) : match;
    });
  };

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
        return `${fieldName} is required`;
      }

      if (typeof value === "string" && value.trim() === "") {
        return `${fieldName} is required`;
      }
    }

    if (value !== undefined && value !== null && value !== "") {
      if (question.validation) {
        if (
          typeof value === "string" &&
          question.validation.maxLength &&
          value.length > question.validation.maxLength
        ) {
          return `${fieldName} must be no more than ${question.validation.maxLength} characters`;
        }

        if (
          typeof value === "number" &&
          question.validation.min !== undefined &&
          value < question.validation.min
        ) {
          return `${fieldName} must be at least ${question.validation.min}`;
        }

        if (
          typeof value === "number" &&
          question.validation.max !== undefined &&
          value > question.validation.max
        ) {
          return `${fieldName} must be no more than ${question.validation.max}`;
        }
      }
    }

    return null;
  };

  const handleInputChange = (key: string, value: unknown) => {
    onChange(key, value);

    // Clear error for this field when user starts typing
    if (fieldErrors[key]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[key];
      setFieldErrors(newErrors);
    }

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

    // Reset Italy stay fields when plan_to_return_home changes to true
    if (key === "plan_to_return_home" && value === true) {
      onChange("consider_staying_it", false);
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
    const newFieldErrors: Record<string, string> = {};
    let hasErrors = false;
    let firstErrorKey = "";

    for (const question of section.questions) {
      if (shouldSkipQuestion(question)) {
        continue;
      }

      if (question.required && question.type !== "boolean") {
        const value = formData[question.key];
        const errorMsg = validateQuestion(question, value);

        if (errorMsg) {
          newFieldErrors[question.key] = errorMsg;
          hasErrors = true;
          if (!firstErrorKey) {
            firstErrorKey = question.key;
          }
        }
      }
    }

    setFieldErrors(newFieldErrors);

    if (hasErrors) {
      const el = questionRefs.current[firstErrorKey];
      if (el) {
        const rect = el.getBoundingClientRect();
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const top = rect.top + scrollTop - 100;
        window.scrollTo({ top, behavior: "smooth" });
      }
      return;
    }

    setError(null);
    onNext();
  };

  const renderQuestion = (question: DynamicQuestion) => {
    const value = formData[question.key];
    const fieldError = fieldErrors[question.key];
    const hasError = !!fieldError;
    const borderClass = hasError ? "border-red-500" : "border-border";
    const focusClass = hasError 
      ? "focus:ring-2 focus:ring-red-500 focus:border-red-500" 
      : "focus:ring-2 focus:ring-teal-500 focus:border-teal-500";

    switch (question.type) {
      case "text":
        return (
          <Input
            value={(value as string) || ""}
            onChange={(e) => handleInputChange(question.key, e.target.value)}
            placeholder={question.placeholder}
            type="text"
            className={`w-full p-3 border rounded-lg bg-background text-foreground ${borderClass} ${focusClass} transition-colors`}
          />
        );
      case "textarea":
        return (
          <Textarea
            value={(value as string) || ""}
            onChange={(e) => handleInputChange(question.key, e.target.value)}
            placeholder={question.placeholder}
            rows={4}
            className={`w-full p-3 border rounded-lg ${borderClass} ${focusClass} transition-colors`}
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
            className={`w-full p-3 border rounded-lg bg-background text-foreground ${borderClass} ${focusClass} transition-colors`}
          />
        );
      case "date":
        return (
          <Input
            value={(value as string) || ""}
            onChange={(e) => handleInputChange(question.key, e.target.value)}
            type="date"
            className={`w-full p-3 border rounded-lg bg-background text-foreground ${borderClass} ${focusClass} transition-colors`}
            onClick={(e) => {
              (e.currentTarget as HTMLInputElement).showPicker?.();
            }}
          />
        );
      case "boolean":
        return (
          <div className={`flex items-center justify-between p-3 rounded-lg border ${hasError ? "bg-slate-50 border-red-500" : "bg-slate-50 border-slate-200"}`}>
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
            <SelectTrigger className={`w-full h-12 p-3 border rounded-lg bg-background text-foreground ${borderClass} ${focusClass}`}>
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
            className={`w-full p-3 border rounded-lg bg-background text-foreground ${borderClass} ${focusClass} transition-colors`}
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

      <div className="space-y-6">
        {section.questions.map((question) => {
          if (shouldSkipQuestion(question)) {
            return null;
          }

          const fieldError = fieldErrors[question.key];

          return (
            <div
              key={question.key}
              ref={(el: HTMLDivElement | null) => {
                questionRefs.current[question.key] = el;
              }}
              className={`space-y-2 p-4 rounded-xl border ${
                fieldError
                  ? "bg-slate-50 border-red-500"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              {question.type !== "boolean" && (
                <label className="block text-lg font-semibold text-foreground">
                  {processTemplate(question.label)}
                  {question.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
              )}
              {renderQuestion(question)}
              {fieldError && (
                <p className="text-sm text-red-600 font-medium mt-2">
                  {fieldError}
                </p>
              )}
              {!fieldError && question.helpText && question.type !== "boolean" && (
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

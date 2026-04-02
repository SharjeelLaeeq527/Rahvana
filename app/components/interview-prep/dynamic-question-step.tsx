"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";
import {
  Heart,
  Users,
  Briefcase,
  Home,
  Shield,
  DollarSign,
  FileText,
  CheckCircle2,
  BookOpen,
  GraduationCap,
} from "lucide-react";
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
  setError: (msg: string | null) => void;
}

// Section-based icon mapping - using consistent teal color
const SECTION_CONFIG: Record<string, { icon: React.ReactNode }> = {
  marriage_and_basic_info: {
    icon: <Heart className="w-8 h-8" />,
  },
  relationship_origin: {
    icon: <Users className="w-8 h-8" />,
  },
  relationship_strength: {
    icon: <Heart className="w-8 h-8" />,
  },
  financial_profile: {
    icon: <DollarSign className="w-8 h-8" />,
  },
  immigration_history: {
    icon: <Shield className="w-8 h-8" />,
  },
  documentation: {
    icon: <FileText className="w-8 h-8" />,
  },
  work_and_education: {
    icon: <Briefcase className="w-8 h-8" />,
  },
  living_situation: {
    icon: <Home className="w-8 h-8" />,
  },
  education_background: {
    icon: <GraduationCap className="w-8 h-8" />,
  },
  visa_and_interview: {
    icon: <FileText className="w-8 h-8" />,
  },
  health_and_medical: {
    icon: <CheckCircle2 className="w-8 h-8" />,
  },
  employment_and_income: {
    icon: <Briefcase className="w-8 h-8" />,
  },
};

// Fallback icon
const DEFAULT_CONFIG = {
  icon: <BookOpen className="w-8 h-8" />,
};

// Color Palette
const COLORS = {
  primary: "#0d7377",
  primaryLight: "#0d737720",
  primaryLightest: "#0d737710",
  secondary: "#afdbdb",
  accent: "#cdadcc",
  warning: "#db8090",
  warningLight: "#db809020",
  neutral: "#89a4a0",
  border: "#e5e7eb",
};

export function DynamicQuestionStep({
  section,
  formData,
  onChange,
  onNext,
  onBack,
  setError,
}: DynamicQuestionStepProps) {
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Get section-specific icon
  const sectionConfig = SECTION_CONFIG[section.id] || DEFAULT_CONFIG;

  const processTemplate = (template: string): string => {
    if (!template) return template;
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = formData[key];
      return value !== undefined && value !== null ? String(value) : match;
    });
  };

  const formatFieldName = (fieldKey: string): string => {
    return fieldKey
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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

    if (fieldErrors[key]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[key];
      setFieldErrors(newErrors);
    }

    if (key === "current_employment_status" && value === false) {
      onChange("current_employer_role", "");
      onChange("work_experience_years", "");
      onChange("work_experience_details", "");
    }

    if (key === "plan_to_return_home" && value === false) {
      onChange("why_will_return", "");
      onChange("job_prospects_home_country", "");
      onChange("family_in_home_country", false);
      onChange("family_details", "");
      onChange("property_or_assets_home", false);
      onChange("property_details", "");
    }

    if (key === "plan_to_return_home" && value === true) {
      onChange("consider_staying_it", false);
      onChange("usa_stay_plans", "");
    }

    const el = questionRefs.current[key];
    if (el) {
      const rect = el.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const top = rect.top + scrollTop - 150;

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

    switch (question.type) {
      case "text":
        return (
          <Input
            value={(value as string) || ""}
            onChange={(e) => handleInputChange(question.key, e.target.value)}
            placeholder={question.placeholder}
            type="text"
            className="w-full px-4 py-3 border-2 rounded-lg text-base"
            style={{
              borderColor: fieldError ? COLORS.warning : COLORS.border,
            }}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={(value as string) || ""}
            onChange={(e) => handleInputChange(question.key, e.target.value)}
            placeholder={question.placeholder}
            rows={4}
            className="w-full px-4 py-3 border-2 rounded-lg text-base"
            style={{
              borderColor: fieldError ? COLORS.warning : COLORS.border,
            }}
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
            className="w-full px-4 py-3 border-2 rounded-lg text-base"
            style={{
              borderColor: fieldError ? COLORS.warning : COLORS.border,
            }}
          />
        );

      case "date":
        return (
          <Input
            value={(value as string) || ""}
            onChange={(e) => handleInputChange(question.key, e.target.value)}
            type="date"
            className="w-full px-4 py-3 border-2 rounded-lg text-base"
            style={{
              borderColor: fieldError ? COLORS.warning : COLORS.border,
            }}
          />
        );

      case "boolean":
        return (
          <div className="grid grid-cols-2 gap-3">
            {["Yes", "No"].map((option) => (
              <button
                key={option}
                onClick={() =>
                  handleInputChange(question.key, option === "Yes")
                }
                className="p-4 rounded-xl border-2 transition-all font-semibold text-base"
                style={{
                  borderColor:
                    (option === "Yes" && value === true) ||
                    (option === "No" && value === false)
                      ? COLORS.primary
                      : COLORS.border,
                  backgroundColor:
                    (option === "Yes" && value === true) ||
                    (option === "No" && value === false)
                      ? COLORS.primaryLight
                      : "white",
                  color:
                    (option === "Yes" && value === true) ||
                    (option === "No" && value === false)
                      ? COLORS.primary
                      : "#374151",
                }}
              >
                {option}
              </button>
            ))}
          </div>
        );

      case "select":
        const optionCount = question.options?.length || 0;

        // For 2 or 4 options: Use button-based selection (like page.tsx)
        if (optionCount === 2 || optionCount === 4) {
          return (
            <div
              className={`grid gap-3 ${
                optionCount === 2 ? "grid-cols-2" : "grid-cols-2"
              }`}
            >
              {question.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => handleInputChange(question.key, option)}
                  className="p-4 rounded-xl border-2 transition-all font-semibold text-base"
                  style={{
                    borderColor:
                      value === option ? COLORS.primary : COLORS.border,
                    backgroundColor:
                      value === option ? COLORS.primaryLight : "white",
                    color: value === option ? COLORS.primary : "#374151",
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          );
        }

        // For 3, 5 or more options: Use CustomDropdown
        return (
          <CustomDropdown
            value={(value as string) || ""}
            onChange={(val) => handleInputChange(question.key, val)}
            options={
              question.options?.map((opt) => ({ value: opt, label: opt })) || []
            }
            placeholder="Select an option"
          />
        );

      default:
        return (
          <Input
            value={(value as string) || ""}
            onChange={(e) => handleInputChange(question.key, e.target.value)}
            className="w-full px-4 py-3 border-2 rounded-lg text-base"
            style={{
              borderColor: fieldError ? COLORS.warning : COLORS.border,
            }}
          />
        );
    }
  };

  return (
    <div className="bg-white">
      <div className="site-main-px site-main-py">
        {/* Section Header with Icon */}
        <div className="mb-10 sm:mb-14 text-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg text-white"
            style={{ backgroundColor: COLORS.primary }}
          >
            {sectionConfig.icon}
          </div>

          <h2
            className="text-3xl sm:text-4xl font-bold mb-3"
            style={{ color: COLORS.primary }}
          >
            {section.title}
          </h2>

          <p className="text-lg text-slate-600 leading-relaxed max-w-xl mx-auto">
            {section.description}
          </p>
        </div>

        {/* Questions Container */}
        <div className="space-y-8 mb-8">
          <div className="space-y-8">
            {section.questions.map((question) => {
              if (shouldSkipQuestion(question)) {
                return null;
              }

              const fieldError = fieldErrors[question.key];

              return (
                <div
                  key={question.key}
                  ref={(el) => {
                    questionRefs.current[question.key] = el;
                  }}
                  className="space-y-4"
                >
                  {question.type !== "boolean" && (
                    <div>
                      <label
                        className="text-lg font-semibold block"
                        style={{ color: COLORS.primary }}
                      >
                        {processTemplate(question.label)}
                        {question.required && (
                          <span style={{ color: COLORS.warning }}> *</span>
                        )}
                      </label>
                      {question.helpText && (
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                          {question.helpText}
                        </p>
                      )}
                    </div>
                  )}

                  {question.type === "boolean" && (
                    <div>
                      <label
                        className="text-lg font-semibold block"
                        style={{ color: COLORS.primary }}
                      >
                        {processTemplate(question.label)}
                        {question.required && (
                          <span style={{ color: COLORS.warning }}> *</span>
                        )}
                      </label>
                    </div>
                  )}

                  <div className="mt-4">{renderQuestion(question)}</div>

                  {fieldError && (
                    <p
                      className="text-sm font-medium mt-3"
                      style={{ color: COLORS.warning }}
                    >
                      {fieldError}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 justify-between pt-6 border-t border-slate-200">
          <button
            onClick={onBack}
            className="px-6 py-2 rounded-lg font-semibold text-sm border-2 transition-all bg-white hover:bg-slate-50"
            style={{
              borderColor: COLORS.primary,
              color: COLORS.primary,
            }}
          >
            ← Back
          </button>

          <button
            onClick={handleNext}
            className="px-6 py-2 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90"
            style={{
              backgroundColor: COLORS.primary,
            }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

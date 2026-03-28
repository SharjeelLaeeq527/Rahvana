import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleSwitch } from "@/app/components/interview-prep/ToggleSwitch";
import CountryAutocomplete from "@/app/components/shared/CountryAutoComplete";
import { QuestionStepProps, FormData } from "../types";

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
}: QuestionStepProps) => {
  // Refs for each question to scroll
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleChange = (id: keyof FormData, value: unknown) => {
    const oldValue = formData[id];
    if (oldValue === value) return;

    onChange(id, value);

    // Auto-scroll slightly (25px from top)
    const el = questionRefs.current[id];
    if (el) {
      const rect = el.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const top = rect.top + scrollTop - 25; // 25px offset from top

      window.scrollTo({
        top,
        behavior: "smooth",
      });
    }
  };

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
          setFormData={(data) =>
            setFormData((prev) => ({ ...prev, ...(data as Partial<FormData>) }))
          }
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
              handleChange(
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
            onChange={(e) => handleChange(question.id, e.target.value)}
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
              onChange={(checked) => handleChange(question.id, checked)}
            />
          </div>
        );
      case "select":
        if (Array.isArray(question.options)) {
          return (
            <Select
              value={typeof value === "string" ? value : ""}
              onValueChange={(newValue) => handleChange(question.id, newValue)}
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
          // Conditional hiding logic
          if (question.id === "intended_us_state_of_residence") {
            const relationshipType = formData.spousal_relationship_type;
            if (
              !relationshipType ||
              relationshipType === "Select" ||
              relationshipType === "No biological relation"
            )
              return null;
          }

          if (question.id === "highest_education_field") {
            const educationLevel = formData.highest_education_level;
            const qualifyingLevels = [
              "Bachelor's degree",
              "Master's degree",
              "Doctorate (PhD)",
            ];
            if (!educationLevel || !qualifyingLevels.includes(educationLevel))
              return null;
          }

          if (
            [
              "prior_military_service",
              "specialized_weapons_training",
              "unofficial_armed_groups",
            ].includes(question.id as string)
          ) {
            const industrySector = formData.industry_sector;
            if (!industrySector || industrySector !== "Military/Defense")
              return null;
          }

          return (
            <div
              key={question.id}
              ref={(el: HTMLDivElement | null) => {
                questionRefs.current[question.id] = el;
              }}
              className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200"
            >
              {question.type !== "boolean" && (
                <label className="block text-lg font-semibold text-slate-800">
                  {question.label}
                </label>
              )}
              {renderInput(question)}
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

export default QuestionStep;

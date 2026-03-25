"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CountryAutocomplete from "@/app/components/shared/CountryAutoComplete";
import { ToggleSwitch } from "@/app/components/interview-prep/ToggleSwitch";
import type { QuestionStepProps } from "./types";

export function QuestionStep({
  title,
  description,
  questions,
  formData,
  error,
  onChange,
  setFormData,
  onNext,
  onBack,
}: QuestionStepProps) {
  // Refs for each question to scroll
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Handle input change and scroll slightly
  const handleChange = (key: keyof typeof formData, value: unknown) => {
    const oldValue = formData[key];
    if (oldValue === value) return; // avoid duplicate scroll

    onChange(key, value);

    const el = questionRefs.current[key];
    if (el) {
      const rect = el.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const top = rect.top + scrollTop - 50; // 50px offset from top
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const renderInput = (question: {
    key: keyof typeof formData;
    label: string;
    type: "text" | "textarea" | "number" | "date" | "boolean" | "select";
    options?: string | string[];
    required?: boolean;
  }) => {
    const value = formData[question.key];

    if (question.key === "beneficiary_country") {
      return (
        <CountryAutocomplete
          formData={formData as unknown as Record<string, unknown>}
          setFormData={(data) => setFormData((prev) => ({ ...prev, ...data }))}
          valueKey="beneficiary_country"
          hideLabel
          inputClassName="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
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
            value={value !== undefined ? String(value) : ""}
            onClick={(e) => {
              if (question.type === "date")
                (e.currentTarget as HTMLInputElement).showPicker?.();
            }}
            onChange={(e) =>
              handleChange(
                question.key,
                question.type === "number"
                  ? Number(e.target.value)
                  : e.target.value,
              )
            }
            className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
            placeholder={`Enter ${question.label.toLowerCase()}`}
          />
        );
      case "textarea":
        return (
          <textarea
            value={typeof value === "string" ? value : ""}
            onChange={(e) => handleChange(question.key, e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
            placeholder={`Enter details for ${question.label.toLowerCase()}`}
            rows={4}
          />
        );
      case "boolean":
        return (
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-slate-800">
              {question.label}
            </span>
            <ToggleSwitch
              checked={!!value}
              onChange={(checked) => handleChange(question.key, checked)}
            />
          </div>
        );
      case "select":
        if (Array.isArray(question.options)) {
          return (
            <Select
              value={typeof value === "string" ? value : ""}
              onValueChange={(v) => handleChange(question.key, v)}
            >
              <SelectTrigger className="w-full h-14">
                <SelectValue
                  placeholder={`Select ${question.label.toLowerCase()}`}
                />
              </SelectTrigger>
              <SelectContent>
                {question.options.map((option) => (
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-3">{title}</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      <div className="space-y-6">
        {questions.map((question) => (
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
            {renderInput(question)}
          </div>
        ))}

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

        <div className="flex justify-between pt-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Previous
          </Button>
          <div className="flex space-x-2">
            <Button
              onClick={onNext}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

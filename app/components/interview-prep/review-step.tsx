"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { ReviewStepProps } from "./types";
import { ChevronDown, ChevronUp, FileCheck } from "lucide-react";
import { QUESTIONNAIRES } from "@/data/interview-categories";
import { getSectionUI } from "@/lib/interview-prep/section-ui";
import type { SectionUIConfig } from "@/types/review";

export function ReviewStep({
  formData,
  error,
  loading,
  onSubmit,
  onBack,
  categorySlug,
  sections: liveSections,
}: ReviewStepProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);

      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }

      return next;
    });
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return "Not provided";
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    if (typeof value === "string") {
      try {
        const date = new Date(value);

        if (!Number.isNaN(date.getTime()) && value.includes("-")) {
          return date.toLocaleDateString();
        }
      } catch {
        // Ignore invalid date
      }

      return value;
    }

    return String(value);
  };

  const questionnaire = categorySlug ? QUESTIONNAIRES[categorySlug] : undefined;
  const questionnaireSections = liveSections?.length ? liveSections : questionnaire?.sections;

  if (!questionnaireSections) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        Questionnaire not found for "{categorySlug}".
      </div>
    );
  }

  const sections = questionnaireSections
    .map((section) => {
      const fields = section.questions
        .map((question) => {
          const value = formData[question.key as keyof typeof formData];

          if (
            value === null ||
            value === undefined ||
            value === "" ||
            (typeof value === "string" && value.trim() === "")
          ) {
            return null;
          }

          return {
            key: question.key,
            label: question.label,
            value: formatValue(value),
          };
        })
        .filter(
          (
            field
          ): field is {
            key: string;
            label: string;
            value: string;
          } => field !== null
        );

      return {
        id: section.id,
        title: section.title,
        order: section.order,
        ui: (section as { ui?: SectionUIConfig }).ui,
        fields,
      };
    })
    .filter((section) => section.fields.length > 0)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="rounded-2xl border-2 p-6 md:p-8"
        style={{
          background: "linear-gradient(135deg, #0d7377 0%, #14a0a6 100%)",
          borderColor: "rgba(13,115,119,0.2)",
          boxShadow: "0 8px 30px -8px rgba(13,115,119,0.3)",
        }}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <FileCheck className="h-7 w-7 text-white" />
          </div>

          <div>
            <h2 className="mb-2 text-2xl font-bold text-white md:text-3xl">
              Review Your Information
            </h2>

            <p className="text-sm text-white/90 md:text-base">
              Please review your responses before generating your interview preparation.
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.length > 0 ? (
          sections.map((section, idx) => {
            const { Icon, bgColor, iconColor, valueBg, valueColor } = getSectionUI(section.ui);

            const isExpanded = expandedSections.has(idx);

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="overflow-hidden rounded-xl border-2 transition-all hover:shadow-lg"
                style={{
                  borderColor: isExpanded ? "rgba(13,115,119,0.3)" : "rgba(0,0,0,0.08)",
                  backgroundColor: isExpanded ? "#ffffff" : "#fafafa",
                }}
              >
                {/* Header */}
                <div
                  className="flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50 md:px-6"
                  onClick={() => toggleSection(idx)}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bgColor} ${iconColor}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-gray-900 md:text-lg">
                      {section.title}
                    </h3>

                    <p className="mt-0.5 text-xs text-gray-600 md:text-sm">
                      {section.fields.length} {section.fields.length === 1 ? "field" : "fields"}{" "}
                      answered
                    </p>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-gray-400" />
                  )}
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{
                        height: 0,
                        opacity: 0,
                      }}
                      animate={{
                        height: "auto",
                        opacity: 1,
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                      }}
                      transition={{
                        duration: 0.3,
                      }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-gray-100 px-5 pb-5 md:px-6">
                        <div className="space-y-3 pt-4">
                          {section.fields.map((field) => (
                            <div
                              key={field.key}
                              className="flex flex-col gap-2 border-b border-gray-50 pb-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between"
                            >
                              <span className="flex-1 text-sm font-semibold text-gray-700">
                                {field.label}
                              </span>

                              <span
                                className="max-w-xs rounded-lg px-3 py-1.5 text-right text-sm font-medium"
                                style={{
                                  backgroundColor: valueBg,
                                  color: valueColor,
                                }}
                              >
                                {field.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        ) : (
          <div className="rounded-lg border border-[#f0d6dc] bg-[#fff7f8] p-4 text-[#9e4a5a]">
            <p>No information entered yet.</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border-l-4 border-[#db8090] bg-[#fff7f8] p-4 text-[#9e4a5a]">
            <div className="flex items-start">
              <svg
                className="mr-3 mt-0.5 h-5 w-5 text-[#db8090]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                />
              </svg>

              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col justify-between gap-4 pt-6 sm:flex-row">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-[#f0d6dc] px-6 py-3 text-base text-slate-700 hover:bg-[#fff7f8]"
          >
            ← Back
          </Button>

          <Button
            onClick={onSubmit}
            disabled={loading}
            className="bg-[#0d7377] px-6 py-3 text-base shadow-lg shadow-[#0d7377]/20 hover:bg-[#0a5a5d] disabled:opacity-50"
          >
            {loading ? "Generating Interview Prep..." : "Generate Interview Prep"}
          </Button>
        </div>
      </div>
    </div>
  );
}

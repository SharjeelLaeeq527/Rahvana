"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { ReviewStepProps } from "./types";
import {
  User,
  Heart,
  PhoneCall,
  Users,
  Home,
  DollarSign,
  Globe,
  Shield,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileCheck,
} from "lucide-react";
import ir1SpouseQuestionnaire from "@/data/interview-categories/ir-1-spouse/questionnaire.json";

interface QuestionnaireSection {
  id: string;
  title: string;
  order: number;
  questions: Array<{ key: string; label: string }>;
}

// Icon mapping for IR-1 Spouse sections with varied color palette
// Colors match dynamic-question-step.tsx for consistency
const getSectionIcon = (sectionId: string) => {
  const iconMap: Record<
    string,
    { Icon: typeof User; bgColor: string; iconColor: string; valueBg: string; valueColor: string }
  > = {
    // Step 1: Marriage & Basic Info - Rose (matches dynamic-question-step)
    marriage_and_basic_info: {
      Icon: Heart,
      bgColor: "bg-[#fce8ec]",
      iconColor: "text-[#db8090]",
      valueBg: "#fce8ec",
      valueColor: "#9e4a5a",
    },
    basic_case_information: {
      Icon: User,
      bgColor: "bg-[#fce8ec]",
      iconColor: "text-[#db8090]",
      valueBg: "#fce8ec",
      valueColor: "#9e4a5a",
    },
    basic_profile: {
      Icon: User,
      bgColor: "bg-[#fce8ec]",
      iconColor: "text-[#db8090]",
      valueBg: "#fce8ec",
      valueColor: "#9e4a5a",
    },
    petitioner_details: {
      Icon: User,
      bgColor: "bg-[#fce8ec]",
      iconColor: "text-[#db8090]",
      valueBg: "#fce8ec",
      valueColor: "#9e4a5a",
    },
    // Step 2: Relationship Origin - Rose (matches dynamic-question-step)
    relationship_origin: {
      Icon: Heart,
      bgColor: "bg-[#fce8ec]",
      iconColor: "text-[#db8090]",
      valueBg: "#fce8ec",
      valueColor: "#9e4a5a",
    },
    relationship_details: {
      Icon: Heart,
      bgColor: "bg-[#fce8ec]",
      iconColor: "text-[#db8090]",
      valueBg: "#fce8ec",
      valueColor: "#9e4a5a",
    },
    // Step 3: Relationship Strength - Amber (matches dynamic-question-step)
    relationship_strength: {
      Icon: Heart,
      bgColor: "bg-[#f3ede7]",
      iconColor: "text-[#9c6f38]",
      valueBg: "#f3ede7",
      valueColor: "#7a5a2e",
    },
    married_life: {
      Icon: PhoneCall,
      bgColor: "bg-[#f3ede7]",
      iconColor: "text-[#9c6f38]",
      valueBg: "#f3ede7",
      valueColor: "#7a5a2e",
    },
    married_life_daily_interaction: {
      Icon: PhoneCall,
      bgColor: "bg-[#f3ede7]",
      iconColor: "text-[#9c6f38]",
      valueBg: "#f3ede7",
      valueColor: "#7a5a2e",
    },
    communication_and_relationship: {
      Icon: PhoneCall,
      bgColor: "bg-[#f3ede7]",
      iconColor: "text-[#9c6f38]",
      valueBg: "#f3ede7",
      valueColor: "#7a5a2e",
    },
    // Step 4: Family & Social - Sage (matches dynamic-question-step)
    family_and_social: {
      Icon: Users,
      bgColor: "bg-[#e8f0ed]",
      iconColor: "text-[#89a4a0]",
      valueBg: "#e8f0ed",
      valueColor: "#5a7570",
    },
    family_social_knowledge: {
      Icon: Users,
      bgColor: "bg-[#e8f0ed]",
      iconColor: "text-[#89a4a0]",
      valueBg: "#e8f0ed",
      valueColor: "#5a7570",
    },
    // Step 5: Petitioner & Plans - Teal (matches dynamic-question-step)
    petitioner_and_plans: {
      Icon: DollarSign,
      bgColor: "bg-[#e8f6f6]",
      iconColor: "text-[#0d7377]",
      valueBg: "#e8f6f6",
      valueColor: "#0a5a5d",
    },
    living_and_family_info: {
      Icon: Home,
      bgColor: "bg-[#e8f6f6]",
      iconColor: "text-[#0d7377]",
      valueBg: "#e8f6f6",
      valueColor: "#0a5a5d",
    },
    living_arrangements_household_plans: {
      Icon: Home,
      bgColor: "bg-[#e8f6f6]",
      iconColor: "text-[#0d7377]",
      valueBg: "#e8f6f6",
      valueColor: "#0a5a5d",
    },
    finances_and_household: {
      Icon: DollarSign,
      bgColor: "bg-[#e8f6f6]",
      iconColor: "text-[#0d7377]",
      valueBg: "#e8f6f6",
      valueColor: "#0a5a5d",
    },
    finances_household_management: {
      Icon: DollarSign,
      bgColor: "bg-[#e8f6f6]",
      iconColor: "text-[#0d7377]",
      valueBg: "#e8f6f6",
      valueColor: "#0a5a5d",
    },
    financial_dependency: {
      Icon: DollarSign,
      bgColor: "bg-[#e8f6f6]",
      iconColor: "text-[#0d7377]",
      valueBg: "#e8f6f6",
      valueColor: "#0a5a5d",
    },
    financial_support_dependency_status: {
      Icon: DollarSign,
      bgColor: "bg-[#e8f6f6]",
      iconColor: "text-[#0d7377]",
      valueBg: "#e8f6f6",
      valueColor: "#0a5a5d",
    },
    // Step 6: Background Check - Rose (matches dynamic-question-step)
    background_check: {
      Icon: Shield,
      bgColor: "bg-[#fce8ec]",
      iconColor: "text-[#db8090]",
      valueBg: "#fce8ec",
      valueColor: "#9e4a5a",
    },
    travel_background_history: {
      Icon: Globe,
      bgColor: "bg-[#fce8ec]",
      iconColor: "text-[#db8090]",
      valueBg: "#fce8ec",
      valueColor: "#9e4a5a",
    },
    travel_and_background_history: {
      Icon: Globe,
      bgColor: "bg-[#fce8ec]",
      iconColor: "text-[#db8090]",
      valueBg: "#fce8ec",
      valueColor: "#9e4a5a",
    },
  };

  return (
    iconMap[sectionId] || {
      Icon: FileCheck,
      bgColor: "bg-[#e8f6f6]",
      iconColor: "text-[#0d7377]",
      valueBg: "#e8f6f6",
      valueColor: "#0a5a5d",
    }
  );
};

export function ReviewStep({
  formData,
  error,
  loading,
  onSubmit,
  onBack,
  categorySlug,
  readOnly = false,
}: ReviewStepProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Helper function to format values
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
        if (!isNaN(date.getTime()) && value.includes("-")) {
          return date.toLocaleDateString();
        }
      } catch {
        // Not a date
      }
      return value;
    }
    return String(value);
  };

  // Get questionnaire sections for IR-1 Spouse
  const questionnaire: { sections: QuestionnaireSection[] } | null = ir1SpouseQuestionnaire;

  // Build sections with their fields
  const sections = questionnaire?.sections
    ?.map((section) => {
      const sectionFields = section.questions
        .map((q) => {
          const value = formData[q.key as keyof typeof formData];
          // Only filter out truly empty values - keep boolean false as "No"
          if (
            value === null ||
            value === undefined ||
            value === "" ||
            (typeof value === "string" && value.trim() === "")
          ) {
            return null;
          }
          return {
            key: q.key,
            label: q.label,
            value: formatValue(value),
          };
        })
        .filter(Boolean) as Array<{
        key: string;
        label: string;
        value: string;
      }>;

      return {
        id: section.id,
        title: section.title,
        order: section.order,
        fields: sectionFields,
      };
    })
    .filter((section) => section.fields.length > 0)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="rounded-2xl p-6 md:p-8 border-2"
        style={{
          background: "linear-gradient(135deg, #0d7377 0%, #14a0a6 100%)",
          borderColor: "rgba(13, 115, 119, 0.2)",
          boxShadow: "0 8px 30px -8px rgba(13, 115, 119, 0.3)",
        }}
      >
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm">
            <FileCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Review Your Information
            </h2>
            <p className="text-sm md:text-base text-white/90">
              {readOnly
                ? "Your spouse's responses. Only the beneficiary can generate the interview prep."
                : "Please review your responses before generating your interview preparation."}
            </p>
          </div>
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-3">
        {sections && sections.length > 0 ? (
          sections.map((section, idx) => {
            const { Icon, bgColor, iconColor, valueBg, valueColor } = getSectionIcon(section.id);
            const isExpanded = expandedSections.has(idx);
            const answeredFields = section.fields.length;

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="border-2 rounded-xl overflow-hidden transition-all hover:shadow-lg"
                style={{
                  borderColor: isExpanded ? "rgba(13, 115, 119, 0.3)" : "rgba(0, 0, 0, 0.08)",
                  backgroundColor: isExpanded ? "#ffffff" : "#fafafa",
                }}
              >
                {/* Section Header */}
                <div
                  className="px-5 md:px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleSection(idx)}
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${bgColor} ${iconColor}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-bold text-gray-900 truncate">
                      {section.title}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                      {answeredFields} {answeredFields === 1 ? "field" : "fields"} answered
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Section Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 md:px-6 pb-5 border-t border-gray-100">
                        <div className="pt-4 space-y-3">
                          {section.fields.map((field) => (
                            <div
                              key={field.key}
                              className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 pb-3 border-b border-gray-50 last:border-b-0"
                            >
                              <span className="font-semibold text-gray-700 text-sm flex-1">
                                {field.label}
                              </span>
                              <span
                                className="text-sm text-right max-w-xs font-medium px-3 py-1.5 rounded-lg"
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
          <div className="bg-[#fff7f8] border border-[#f0d6dc] rounded-lg p-4 text-[#9e4a5a]">
            <p>No information entered yet.</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-[#fff7f8] border-l-4 border-[#db8090] rounded-lg text-[#9e4a5a]">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-[#db8090] mt-0.5 mr-3"
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-[#f0d6dc] text-slate-700 hover:bg-[#fff7f8] px-6 py-3 text-base"
          >
            ← Back
          </Button>
          {readOnly ? (
            <div className="rounded-lg border border-[#a8d9be] bg-[#e8f5ef] px-5 py-3 text-sm text-[#15744f] flex items-center">
              View only — only the beneficiary can generate the interview prep.
            </div>
          ) : (
            <Button
              onClick={onSubmit}
              disabled={loading}
              className="bg-[#0d7377] hover:bg-[#0a5a5d] px-6 py-3 text-base disabled:opacity-50 shadow-lg shadow-[#0d7377]/20"
            >
              {loading ? "Generating Interview Prep..." : "Generate Interview Prep"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

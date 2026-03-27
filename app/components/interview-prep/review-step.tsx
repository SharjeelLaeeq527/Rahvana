"use client";

import { Button } from "@/components/ui/button";
import type { ReviewStepProps } from "./types";
import {
  User,
  Heart,
  Users,
  Target,
  Shield,
  CheckCircle2,
  Info,
  PhoneCall,
  Briefcase,
} from "lucide-react";
import ir1SpouseQuestionnaire from "@/data/interview-categories/ir-1-spouse/questionnaire.json";
import ir2ChildQuestionnaire from "@/data/interview-categories/ir-2-child/questionnaire.json";
import ir5ParentQuestionnaire from "@/data/interview-categories/ir-5-parent/questionnaire.json";
import f1StudentQuestionnaire from "@/data/interview-categories/f1-student/questionnaire.json";
import ukStudentQuestionnaire from "@/data/interview-categories/uk-student/questionnaire.json";
import caStudentQuestionnaire from "@/data/interview-categories/ca-student/questionnaire.json";
import auStudentQuestionnaire from "@/data/interview-categories/au-student/questionnaire.json";

interface QuestionnaireSection {
  id: string;
  title: string;
  order: number;
  questions: Array<{ key: string; label: string }>;
}

// Icon mapping for different section IDs
const getSectionIcon = (sectionId: string) => {
  const iconMap: Record<
    string,
    { Icon: typeof User; bgColor: string; iconColor: string }
  > = {
    basic_case_information: {
      Icon: User,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    basic_profile: {
      Icon: User,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    relationship_origin: {
      Icon: Heart,
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
    },
    relationship_details: {
      Icon: Heart,
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
    },
    married_life_daily_interaction: {
      Icon: PhoneCall,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    communication_and_relationship: {
      Icon: PhoneCall,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    family_social_knowledge: {
      Icon: Users,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    living_and_family_info: {
      Icon: Users,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    travel_background_history: {
      Icon: Shield,
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    background_future_plans: {
      Icon: Target,
      bgColor: "bg-cyan-100",
      iconColor: "text-cyan-600",
    },
    petitioner_information: {
      Icon: Briefcase,
      bgColor: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    finances_household_management: {
      Icon: CheckCircle2,
      bgColor: "bg-teal-100",
      iconColor: "text-teal-600",
    },
    intent: {
      Icon: Target,
      bgColor: "bg-cyan-100",
      iconColor: "text-cyan-600",
    },
    security: {
      Icon: Shield,
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
    },
  };

  return (
    iconMap[sectionId] || {
      Icon: Info,
      bgColor: "bg-gray-100",
      iconColor: "text-gray-600",
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
}: ReviewStepProps) {
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
      // Try to format as date if it looks like a date
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

  // Get questionnaire sections dynamically based on categorySlug
  const questionnaire: { sections: QuestionnaireSection[] } | null = (() => {
    if (categorySlug === "ir-1-spouse") {
      return ir1SpouseQuestionnaire;
    } else if (categorySlug === "ir-2-child") {
      return ir2ChildQuestionnaire;
    } else if (categorySlug === "ir-5-parent") {
      return ir5ParentQuestionnaire;
    } else if (categorySlug === "f1-student") {
      return f1StudentQuestionnaire;
    } else if (categorySlug === "uk-student") {
      return ukStudentQuestionnaire;
    } else if (categorySlug === "ca-student") {
      return caStudentQuestionnaire;
    } else if (categorySlug === "au-student") {
      return auStudentQuestionnaire;
    }
    return null;
  })();

  // Build sections with their fields
  const sections = questionnaire?.sections
    ?.map((section) => {
      const sectionFields = section.questions
        .map((q) => {
          const value = formData[q.key as keyof typeof formData];
          if (
            value === null ||
            value === undefined ||
            value === "" ||
            value === false ||
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

  const renderSection = (section: {
    id: string;
    title: string;
    order: number;
    fields: Array<{ key: string; label: string; value: string }>;
  }) => {
    const { Icon, bgColor, iconColor } = getSectionIcon(section.id);

    return (
      <div
        key={section.id}
        className="bg-muted/20 rounded-xl p-6 border border-border"
      >
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-3">
          <div
            className={`${bgColor} ${iconColor} w-10 h-10 rounded-full flex items-center justify-center`}
          >
            <Icon className="w-5 h-5" />
          </div>
          {section.title}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {section.fields.map(
            (field: { key: string; label: string; value: string }) => (
              <div key={field.key}>
                <p className="text-sm text-muted-foreground">{field.label}</p>
                <p className="font-medium text-foreground break-normal">
                  {field.value}
                </p>
              </div>
            ),
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-3">
          Review Your Information
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Please review all the information you&apos;ve entered before
          submitting for interview preparation.
        </p>
      </div>

      <div className="space-y-6">
        {/* Case Type Section */}
        <div className="bg-muted/20 rounded-xl p-6 border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            Case Type
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Selected Type</p>
              <p className="font-medium capitalize">
                {categorySlug === "ir-1-spouse"
                  ? "IR-1 Spouse"
                  : categorySlug === "ir-2-child"
                    ? "IR-2 Child"
                    : categorySlug === "ir-5-parent"
                      ? "IR-5 Parent"
                      : categorySlug === "f1-student"
                        ? "F1 Student"
                        : categorySlug === "uk-student"
                          ? "UK Student"
                          : categorySlug === "ca-student"
                            ? "CA Student" 
                            : categorySlug === "au-student"
                              ? "AU Student"
                              : categorySlug || formData.caseType}
              </p>
            </div>
          </div>
        </div>

        {/* Render questionnaire sections dynamically */}
        {sections && sections.length > 0 ? (
          sections.map((section) => renderSection(section))
        ) : (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-yellow-800">
            <p>No information entered yet.</p>
          </div>
        )}

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

        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 px-6 py-3 text-base"
          >
            ← Back
          </Button>
          <Button
            onClick={onSubmit}
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 px-6 py-3 text-base disabled:opacity-50"
          >
            {loading
              ? "Generating Interview Prep..."
              : "Generate Interview Prep"}
          </Button>
        </div>
      </div>
    </div>
  );
}

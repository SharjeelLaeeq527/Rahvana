// Category Selection Step - Displays available visa categories for user selection.

"use client";

import { Button } from "@/components/ui/button";
import { Heart, Users, GraduationCap, Shield, Plane } from "lucide-react";
import type { InterviewCategoryConfig } from "@/data/interview-categories/schema";

interface CategorySelectionStepProps {
  categories: InterviewCategoryConfig[];
  selectedCategory: InterviewCategoryConfig | null;
  onSelectCategory: (category: InterviewCategoryConfig) => void;
  onNext: () => void;
  onBack: () => void;
  error?: string | null;
}

const getThemeColor = (themeColor: string) => {
  const colorMap: Record<string, { bg: string; text: string; border: string; hover: string; ring: string }> = {
    teal: {
      bg: "bg-teal-100",
      text: "text-teal-800",
      border: "border-teal-600",
      hover: "hover:border-teal-400 hover:bg-slate-50",
      ring: "ring-teal-200",
    },
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      border: "border-blue-600",
      hover: "hover:border-blue-400 hover:bg-slate-50",
      ring: "ring-blue-200",
    },
    purple: {
      bg: "bg-purple-100",
      text: "text-purple-800",
      border: "border-purple-600",
      hover: "hover:border-purple-400 hover:bg-slate-50",
      ring: "ring-purple-200",
    },
    green: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-600",
      hover: "hover:border-green-400 hover:bg-slate-50",
      ring: "ring-green-200",
    },
    orange: {
      bg: "bg-orange-100",
      text: "text-orange-800",
      border: "border-orange-600",
      hover: "hover:border-orange-400 hover:bg-slate-50",
      ring: "ring-orange-200",
    },
  };

  return colorMap[themeColor] || colorMap.teal;
};

const getIcon = (iconName: string) => {
  switch (iconName) {
    case "Heart":
      return <Heart className="h-8 w-8" />;
    case "Users":
      return <Users className="h-8 w-8" />;
    case "GraduationCap":
      return <GraduationCap className="h-8 w-8" />;
    case "Shield":
      return <Shield className="h-8 w-8" />;
    case "Plane":
      return <Plane className="h-8 w-8" />;
    default:
      return <Heart className="h-8 w-8" />;
  }
};

export function CategorySelectionStep({
  categories,
  selectedCategory,
  onSelectCategory,
  onNext,
  onBack,
  error,
}: CategorySelectionStepProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">No categories available at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 mx-2">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-3">
          Select Your Visa Category
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Choose the visa type that best matches your immigration case
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => {
          const themeColor = getThemeColor(category.ui.themeColor);
          const isSelected = selectedCategory?.categorySlug === category.categorySlug;

          return (
            <button
              key={category.categorySlug}
              type="button"
              className={`p-8 border-2 rounded-xl text-center transition-all cursor-pointer ${
                isSelected
                  ? `${themeColor.border} bg-teal-50/20 ring-2 ${themeColor.ring}`
                  : `border-border ${themeColor.hover}`
              }`}
              onClick={() => onSelectCategory(category)}
            >
              <div className={`mx-auto ${themeColor.bg} ${themeColor.text} w-16 h-16 rounded-full flex items-center justify-center mb-4`}>
                {getIcon(category.ui.icon)}
              </div>
              <h3 className="font-bold text-xl mb-2 text-foreground">
                {category.displayName}
              </h3>
              <p className="text-base text-muted-foreground">
                {category.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-row justify-between gap-4 pt-6">
        <Button
          onClick={onBack}
          variant="outline"
          className="bg-muted hover:bg-muted/80 text-muted-foreground border-border px-6 py-3 text-base"
        >
          ← Back
        </Button>

        <Button
          onClick={onNext}
          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 text-base"
          disabled={!selectedCategory}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
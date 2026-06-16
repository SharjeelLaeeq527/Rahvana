// Category Selection Step - Displays available visa categories for user selection.
"use client";

import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import type { InterviewCategoryConfig } from "@/data/interview-categories/schema";

interface CategorySelectionStepProps {
  categories: InterviewCategoryConfig[];
  selectedCategory: InterviewCategoryConfig | null;
  onSelectCategory: (category: InterviewCategoryConfig) => void;
  onNext: () => void;
  onBack: () => void;
  error?: string | null;
}

// Color palette mapping for categories
const getThemeColor = (themeColor: string) => {
  const colorMap: Record<
    string,
    {
      gradient: string;
      iconBg: string;
      iconColor: string;
      border: string;
      borderSelected: string;
      glowColor: string;
    }
  > = {
    teal: {
      gradient: "linear-gradient(145deg, #ffffff 0%, #fafffe 40%, #f0faf9 70%, #edf7f6 100%)",
      iconBg: "#afdbdb",
      iconColor: "#0d7377",
      border: "rgba(13, 115, 119, 0.08)",
      borderSelected: "rgba(13, 115, 119, 0.4)",
      glowColor: "rgba(175, 219, 219, 0.2)",
    },
    blue: {
      gradient: "linear-gradient(145deg, #ffffff 0%, #f8fbff 40%, #eef5ff 70%, #e8f0ff 100%)",
      iconBg: "#afdbdb",
      iconColor: "#0d7377",
      border: "rgba(13, 115, 119, 0.08)",
      borderSelected: "rgba(13, 115, 119, 0.4)",
      glowColor: "rgba(175, 219, 219, 0.2)",
    },
    purple: {
      gradient: "linear-gradient(145deg, #ffffff 0%, #fdfbff 40%, #f8f0ff 70%, #f3e8ff 100%)",
      iconBg: "#cdadcc",
      iconColor: "#6b5b7b",
      border: "rgba(107, 91, 123, 0.08)",
      borderSelected: "rgba(107, 91, 123, 0.4)",
      glowColor: "rgba(205, 173, 204, 0.2)",
    },
    green: {
      gradient: "linear-gradient(145deg, #ffffff 0%, #f8fdfb 40%, #edf7f2 70%, #e8f0ed 100%)",
      iconBg: "#89a4a0",
      iconColor: "#5a7570",
      border: "rgba(137, 164, 160, 0.08)",
      borderSelected: "rgba(137, 164, 160, 0.4)",
      glowColor: "rgba(137, 164, 160, 0.2)",
    },
    orange: {
      gradient: "linear-gradient(145deg, #ffffff 0%, #fdfaf7 40%, #f9f0e7 70%, #f3ede7 100%)",
      iconBg: "#f3ede7",
      iconColor: "#9c6f38",
      border: "rgba(156, 111, 56, 0.08)",
      borderSelected: "rgba(156, 111, 56, 0.4)",
      glowColor: "rgba(243, 237, 231, 0.3)",
    },
    rose: {
      gradient: "linear-gradient(145deg, #ffffff 0%, #fffafa 40%, #fef0f2 70%, #fce8ec 100%)",
      iconBg: "#fce8ec",
      iconColor: "#db8090",
      border: "rgba(219, 128, 144, 0.08)",
      borderSelected: "rgba(219, 128, 144, 0.4)",
      glowColor: "rgba(219, 128, 144, 0.15)",
    },
  };

  return colorMap[themeColor] || colorMap.teal;
};

const getIcon = (iconName: string) => {
  return <Heart className="h-7 w-7" />;
};

// Watermark icon for decorative element
const getWatermarkIcon = (iconName: string) => {
  return <Heart className="w-24 h-24" strokeWidth={1} />;
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
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-3">Select Your Visa Category</h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Choose the visa type that best matches your immigration case
        </p>
      </div>

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

      {/* Category Cards */}
      <div className="max-w-[650px] mx-auto space-y-4">
        {categories.map((category) => {
          const theme = getThemeColor(category.ui.themeColor);
          const isSelected = selectedCategory?.categorySlug === category.categorySlug;

          return (
            <button
              key={category.categorySlug}
              type="button"
              className="w-full rounded-2xl px-10 py-14 text-left transition-all cursor-pointer relative overflow-hidden"
              style={{
                background: theme.gradient,
                border: `2px solid ${isSelected ? theme.borderSelected : theme.border}`,
                boxShadow: isSelected
                  ? `0 8px 30px -8px ${theme.glowColor}, 0 0 0 1px ${theme.borderSelected}`
                  : `0 4px 20px -8px rgba(0, 0, 0, 0.05)`,
              }}
              onClick={() => onSelectCategory(category)}
            >
              {/* Decorative radial glow */}
              <div
                className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-40"
                style={{ backgroundColor: theme.glowColor }}
              />

              {/* Watermark icon */}
              <div
                className="pointer-events-none absolute -bottom-4 -right-4 opacity-[0.04]"
                style={{ color: theme.iconColor }}
              >
                {getWatermarkIcon(category.ui.icon)}
              </div>

              <div className="relative z-10 flex items-center gap-5">
                {/* Icon badge */}
                <div
                  className="flex items-center justify-center w-14 h-14 rounded-xl shrink-0"
                  style={{
                    backgroundColor: theme.iconBg,
                    color: theme.iconColor,
                  }}
                >
                  {getIcon(category.ui.icon)}
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl text-slate-900 mb-1">{category.displayName}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{category.description}</p>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div
                    className="flex items-center justify-center w-6 h-6 rounded-full shrink-0"
                    style={{ backgroundColor: theme.iconColor }}
                  >
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-row justify-between gap-4 pt-6">
        <Button
          onClick={onBack}
          variant="outline"
          className="border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-3 text-base"
        >
          ← Back
        </Button>

        <Button
          onClick={onNext}
          className="bg-[#0d7377] hover:bg-[#0a5a5d] text-white px-6 py-3 text-base shadow-lg shadow-[#0d7377]/20"
          disabled={!selectedCategory}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}

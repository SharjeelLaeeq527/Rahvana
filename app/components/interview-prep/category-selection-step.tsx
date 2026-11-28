
// Category Selection Step - Displays available visa categories for user selection.
"use client";

import { Button } from "@/components/ui/button";
import {
  Heart,
  UsersRound,
  Baby,
  UserRound,
  type LucideIcon,
  FileText,
} from "lucide-react";
import type { InterviewCategoryConfig } from "@/data/interview-categories/schema";

export interface CategoryWithPurchaseStatus extends InterviewCategoryConfig {
  isPurchased: boolean;
  requiresPurchase: boolean;
  purchaseExhausted?: boolean;
  purchaseCount?: number;
  usedSessionCount?: number;
  activeSessionCount?: number;
  remainingPurchases?: number;
  addonId?: string;
  price?: number;
}

interface CategorySelectionStepProps {
  categories: CategoryWithPurchaseStatus[];
  selectedCategory: CategoryWithPurchaseStatus | null;
  onSelectCategory: (category: CategoryWithPurchaseStatus) => void;
  onNext: () => void;
  onBack: () => void;
  onPurchaseAgain?: () => void;
  onOpenMySessions?: () => void;
  error?: string | null;
  isJourney?: boolean;
  journeyTier?: string | null;
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
      gradient:
        "linear-gradient(145deg, #ffffff 0%, #fafffe 40%, #f0faf9 70%, #edf7f6 100%)",
      iconBg: "#afdbdb",
      iconColor: "#0d7377",
      border: "rgba(13, 115, 119, 0.08)",
      borderSelected: "rgba(13, 115, 119, 0.4)",
      glowColor: "rgba(175, 219, 219, 0.2)",
    },

    blue: {
      gradient:
        "linear-gradient(145deg, #ffffff 0%, #f8fbff 40%, #eef5ff 70%, #e8f0ff 100%)",
      iconBg: "#dbeafe",
      iconColor: "#2563eb",
      border: "rgba(37, 99, 235, 0.08)",
      borderSelected: "rgba(37, 99, 235, 0.4)",
      glowColor: "rgba(147, 197, 253, 0.2)",
    },

    purple: {
      gradient:
        "linear-gradient(145deg, #ffffff 0%, #fdfbff 40%, #f8f0ff 70%, #f3e8ff 100%)",
      iconBg: "#cdadcc",
      iconColor: "#6b5b7b",
      border: "rgba(107, 91, 123, 0.08)",
      borderSelected: "rgba(107, 91, 123, 0.4)",
      glowColor: "rgba(205, 173, 204, 0.2)",
    },

    green: {
      gradient:
        "linear-gradient(145deg, #ffffff 0%, #f8fdfb 40%, #edf7f2 70%, #e8f0ed 100%)",
      iconBg: "#89a4a0",
      iconColor: "#5a7570",
      border: "rgba(137, 164, 160, 0.08)",
      borderSelected: "rgba(137, 164, 160, 0.4)",
      glowColor: "rgba(137, 164, 160, 0.2)",
    },

    orange: {
      gradient:
        "linear-gradient(145deg, #ffffff 0%, #fdfaf7 40%, #f9f0e7 70%, #f3ede7 100%)",
      iconBg: "#f3ede7",
      iconColor: "#9c6f38",
      border: "rgba(156, 111, 56, 0.08)",
      borderSelected: "rgba(156, 111, 56, 0.4)",
      glowColor: "rgba(243, 237, 231, 0.3)",
    },

    rose: {
      gradient:
        "linear-gradient(145deg, #ffffff 0%, #fffafa 40%, #fef0f2 70%, #fce8ec 100%)",
      iconBg: "#fce8ec",
      iconColor: "#db8090",
      border: "rgba(219, 128, 144, 0.08)",
      borderSelected: "rgba(219, 128, 144, 0.4)",
      glowColor: "rgba(219, 128, 144, 0.15)",
    },
  };

  return colorMap[themeColor] || colorMap.teal;
};

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  heart: Heart,
  "users-round": UsersRound,
  baby: Baby,
};

const getCategoryIcon = (iconName: string): LucideIcon => {
  return CATEGORY_ICON_MAP[iconName] ?? UserRound;
};

const getIcon = (iconName: string) => {
  const Icon = getCategoryIcon(iconName);
  return <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.9} />;
};

const getWatermarkIcon = (iconName: string) => {
  const Icon = getCategoryIcon(iconName);
  return <Icon className="h-24 w-24" strokeWidth={1} />;
};

export function CategorySelectionStep({
  categories,
  selectedCategory,
  onSelectCategory,
  onNext,
  onBack,
  onPurchaseAgain,
  onOpenMySessions,
  error,
  isJourney = false,
  journeyTier,
}: CategorySelectionStepProps) {
  const visibleCategories = categories;

  if (visibleCategories.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm sm:px-10 sm:py-14">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileText className="h-8 w-8" />
        </div>

        <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
          No categories available
        </h3>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
          You already have sessions for the available categories here. Open My
          Sessions to resume one, or choose a different country to see new
          options.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3 sm:mt-8">
          <Button
            type="button"
            onClick={() => {
              if (onOpenMySessions) {
                onOpenMySessions();
              } else {
                window.location.href = "/interview-prep/my-sessions";
              }
            }}
            className="rounded-full bg-primary px-5 text-white shadow-sm shadow-primary/20 hover:bg-primary/90"
          >
            Open My Sessions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-0 space-y-6 sm:mx-2 sm:space-y-8">
      {/* Error Message */}
      {error && (
        <div className="rounded-lg border-l-4 border-[#db8090] bg-[#fff7f8] p-4 text-[#9e4a5a]">
          <div className="flex items-start">
            <svg
              className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-[#db8090]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>

            <div className="min-w-0 flex-1">
              <span>{error}</span>

              {onPurchaseAgain && (
                <div className="mt-3">
                  <Button
                    type="button"
                    onClick={onPurchaseAgain}
                    className="bg-[var(--tool-accent,#0d7377)] text-white hover:bg-[var(--tool-accent,#0d7377)] hover:brightness-95"
                  >
                    Purchase Another Session
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Cards */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        {visibleCategories.map((category) => {
          const theme = getThemeColor(category.ui.themeColor);
          const isSelected =
            selectedCategory?.categorySlug === category.categorySlug;

          return (
            <button
              key={category.categorySlug}
              type="button"
              className="relative w-full cursor-pointer overflow-hidden rounded-2xl px-4 py-5 text-left transition-all duration-200 sm:px-6 sm:py-8 lg:py-10"
              style={{
                background: theme.gradient,
                border: `2px solid ${
                  isSelected ? theme.borderSelected : theme.border
                }`,
                boxShadow: isSelected
                  ? `0 8px 30px -8px ${theme.glowColor}, 0 0 0 1px ${theme.borderSelected}`
                  : `0 4px 20px -8px rgba(0, 0, 0, 0.05)`,
              }}
              onClick={() => onSelectCategory(category)}
              aria-pressed={isSelected}
            >
              {/* Decorative radial glow */}
              <div
                className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-40 blur-3xl"
                style={{ backgroundColor: theme.glowColor }}
              />

              {/* Watermark icon */}
              <div
                className="pointer-events-none absolute -bottom-4 -right-4 opacity-[0.04]"
                style={{ color: theme.iconColor }}
              >
                {getWatermarkIcon(category.ui.icon)}
              </div>

              <div className="relative z-10">
                {/* Header: Icon + Title + Selection */}
                <div className="flex items-start gap-3 sm:gap-5">
                  {/* Icon badge */}
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14"
                    style={{
                      backgroundColor: theme.iconBg,
                      color: theme.iconColor,
                    }}
                  >
                    {getIcon(category.ui.icon)}
                  </div>

                  {/* Title and status badge */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="mb-2 pr-1 text-base font-bold leading-tight text-slate-900 sm:text-xl">
                      {category.displayName}
                    </h3>

                    {/* Purchase / Journey Status Badge */}
                    <div>
                      {isJourney ? (
                        journeyTier &&
                        journeyTier.toLowerCase() !== "free" ? (
                          <span className="inline-flex max-w-full items-center rounded-full bg-green-100 px-2 py-1 text-[10px] font-medium leading-tight text-green-800 sm:text-xs">
                            <svg
                              className="mr-1 h-3 w-3 shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 001.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Included in Journey
                          </span>
                        ) : (
                          <span className="inline-flex max-w-full items-center rounded-full bg-amber-100 px-2 py-1 text-[10px] font-medium leading-tight text-amber-800 sm:text-xs">
                            <svg
                              className="mr-1 h-3 w-3 shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Requires Basic Journey Plan
                          </span>
                        )
                      ) : (
                        <span className="inline-flex max-w-full items-center rounded-full bg-orange-100 px-2 py-1 text-[10px] font-medium leading-tight text-orange-800 sm:text-xs">
                          <svg
                            className="mr-1 h-3 w-3 shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          200 Credits / Session
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Selection indicator */}
                  {isSelected && (
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: theme.iconColor }}
                    >
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="mt-4 text-[13px] leading-relaxed text-slate-600 sm:mt-5 sm:text-sm">
                  {category.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-end gap-3 pt-3 sm:gap-4 sm:pt-6">
        <Button
          type="button"
          onClick={onNext}
          className="w-full rounded-full bg-[var(--tool-accent,#0d7377)] px-8 py-3 text-base text-white shadow-sm hover:bg-[var(--tool-accent,#0d7377)] hover:brightness-95 sm:w-auto"
          disabled={!selectedCategory}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}

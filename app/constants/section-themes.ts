import type { ReviewThemeName } from "@/types/review";

export const SECTION_THEMES: Record<
  ReviewThemeName,
  {
    // ReviewStep
    bgColor: string;
    iconColor: string;
    valueBg: string;
    valueColor: string;

    // DynamicQuestionStep
    primary: string;
    primaryLight: string;
  }
> = {
  teal: {
    bgColor: "bg-teal-100",
    iconColor: "text-teal-700",
    valueBg: "#E8F6F6",
    valueColor: "#0D7377",

    primary: "#0D7377",
    primaryLight: "#E8F6F6",
  },

  rose: {
    bgColor: "bg-rose-100",
    iconColor: "text-rose-700",
    valueBg: "#FCE8EC",
    valueColor: "#DB8090",

    primary: "#DB8090",
    primaryLight: "#FCE8EC",
  },

  amber: {
    bgColor: "bg-amber-100",
    iconColor: "text-amber-700",
    valueBg: "#F3EDE7",
    valueColor: "#9C6F38",

    primary: "#9C6F38",
    primaryLight: "#F3EDE7",
  },

  sage: {
    bgColor: "bg-green-100",
    iconColor: "text-green-700",
    valueBg: "#E8F0ED",
    // Darker sage: the old #89A4A0 was too pale for white button text and
    // made an enabled Next button look disabled.
    valueColor: "#4F6F69",

    primary: "#4F6F69",
    primaryLight: "#E8F0ED",
  },

  purple: {
    bgColor: "bg-violet-100",
    iconColor: "text-violet-700",
    valueBg: "#EFE8F3",
    valueColor: "#6B5B7B",

    primary: "#6B5B7B",
    primaryLight: "#EFE8F3",
  },
};
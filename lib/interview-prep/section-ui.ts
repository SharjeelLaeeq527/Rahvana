import { SECTION_THEMES } from "@/app/constants/section-themes";
import {
  REVIEW_ICONS,
  ReviewIconName,
} from "@/app/constants/review-icons";
import type {
  ReviewThemeName,
  SectionUIConfig,
} from "@/types/review";

export function getSectionUI(config?: SectionUIConfig) {
  const theme =
    SECTION_THEMES[
      (config?.theme as ReviewThemeName) ?? "teal"
    ];

  const Icon =
    REVIEW_ICONS[
      (config?.icon as ReviewIconName) ?? "FileCheck"
    ];

  return {
    Icon,
    ...theme,
  };
}
import React from "react";
import type { QuickAccessItem } from "@/app/context/QuickAccessContext";

export interface ToolRule {
  label: string;
  value: React.ReactNode;
}

export interface ToolFaq {
  question: string;
  answer: React.ReactNode;
}

export interface ToolSource {
  title: string;
  domain?: string;
  url?: string;
}

export interface ToolHistoryAction {
  /** Label to show on the button, default: "History" */
  label?: string;
  /** Number of history items shown in the badge */
  count?: number;
  /** Whether the history panel is currently open */
  isOpen?: boolean;
  /** Callback when the user clicks the history button */
  onClick: () => void;
  /** Disabled state */
  disabled?: boolean;
}

export interface ToolThemePalette {
  /** Primary accent color used for buttons, badges, and focus rings (e.g., #7A5A3A) */
  accent: string;
  /** Deep tone used for the top hero band background (e.g., #3C2A19) */
  accentDark: string;
  /** Light pastel tint used for the answer panel and highlights (e.g., #F3EBE0) */
  accentTint: string;
}

export type ToolThemeKey =
  | "sponsor"
  | "photo"
  | "interview"
  | "g221"
  | "cspa"
  | "dq"
  | "uscis"
  | "pdf"
  | "sign"
  | "forms"
  | "medical"
  | "default";

export type DrawerTabKey = "rules" | "faq" | "src";

export interface ToolLayoutProps {
  /** Main tool title displayed in the hero band */
  title: React.ReactNode;
  /** Short descriptive tagline below the title */
  tagline?: React.ReactNode;
  /** Optional category badge or eyebrow text in the hero header */
  category?: React.ReactNode;
  /** Optional price, credits, or duration indicator (e.g. "Included in Premium · about 1 min") */
  priceOrDuration?: React.ReactNode;

  /** Whether to show the top hero band header. Defaults to true. */
  showHeader?: boolean;

  /** Predefined theme key or custom { accent, accentDark, accentTint } palette */
  theme?: ToolThemeKey | ToolThemePalette;

  /** QuickAccess metadata enabling the hero bookmark button */
  quickAccessItem?: QuickAccessItem;

  /** History action button displayed next to the Save button in the hero header */
  historyAction?: ToolHistoryAction;

  /** Hide the hero "Rules & help" button (the drawer stays reachable from the links under the card) */
  hideHelpButton?: boolean;

  /** Optional custom action elements in the hero header */
  headerActions?: React.ReactNode;

  /**
   * Layout mode:
   * - "split": Two-column layout with left work area and right answer aside (Option C standard).
   * - "single": Single centered / full-width workbench (ideal for multi-step wizards or wide uploaders).
   * Defaults to "split" if `answer` is provided, otherwise "single".
   */
  layout?: "split" | "single";

  /** The primary work area (left column in "split" mode, or entire card in "single" mode) */
  children: React.ReactNode;

  /** Optional right-hand answer / verdict aside (for "split" mode) */
  answer?: React.ReactNode;

  /** Custom styling classes */
  className?: string;
  benchClassName?: string;
  workClassName?: string;
  answerClassName?: string;

  /**
   * Bottom bar & Slide-over Drawer options.
   * Every item here is completely OPTIONAL. If omitted or empty, the corresponding
   * bottom button and drawer tab will not be rendered.
   */
  rules?: ToolRule[];
  faqs?: ToolFaq[];
  sources?: ToolSource[];
  disclaimer?: React.ReactNode;
  hideBottomBar?: boolean;

  /** Slide-over drawer CTA customization */
  ctaText?: string;
  ctaButtonText?: string;
  ctaHref?: string;
}

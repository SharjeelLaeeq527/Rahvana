import { ToolThemeKey, ToolThemePalette } from "./types";

export const TOOL_THEMES: Record<ToolThemeKey, ToolThemePalette> = {
  // Snap & Sign: Warm Leather & Ink
  sign: {
    accent: "#7A5A3A",
    accentDark: "#3C2A19",
    accentTint: "#F3EBE0",
  },
  // Sponsorship Calculator: Forest Green / Prosperity
  sponsor: {
    accent: "#3E7C4F",
    accentDark: "#1F4A2E",
    accentTint: "#E6F1E6",
  },
  // Photo Booth: Berry / Magenta
  photo: {
    accent: "#A8455E",
    accentDark: "#5A1F30",
    accentTint: "#F7E6EA",
  },
  // Interview Prep: Regal Purple
  interview: {
    accent: "#6A4C93",
    accentDark: "#33245A",
    accentTint: "#EDE7F6",
  },
  // 221(g) Planner: Terracotta / Urgency
  g221: {
    accent: "#9A4130",
    accentDark: "#4E1D14",
    accentTint: "#F6E6E1",
  },
  // CSPA Checker: Deep Slate Teal
  cspa: {
    accent: "#2F6E73",
    accentDark: "#12393C",
    accentTint: "#E1EFEF",
  },
  // DQ Status: Warm Bronze / Amber
  dq: {
    accent: "#A06A14",
    accentDark: "#4D3309",
    accentTint: "#F5ECD8",
  },
  // USCIS Case Status: Classic Steel Navy
  uscis: {
    accent: "#3D5A80",
    accentDark: "#1B2B44",
    accentTint: "#E5EBF3",
  },
  // PDF Toolkit: Cool Graphite / Slate
  pdf: {
    accent: "#55616C",
    accentDark: "#262E36",
    accentTint: "#EBEDEF",
  },
  // Smart Form Filler: Olive / Document Green
  forms: {
    accent: "#5F6F2A",
    accentDark: "#2E3712",
    accentTint: "#EEF0E0",
  },
  // Medical Appointment / Booking: Rahvana Brand Teal
  medical: {
    accent: "#0F8F80",
    accentDark: "#0A4F49",
    accentTint: "#E1F2EE",
  },
  // Default Rahvana Theme
  default: {
    accent: "#0F8F80",
    accentDark: "#0A4F49",
    accentTint: "#E1F2EE",
  },
};

export function resolveToolTheme(theme?: ToolThemeKey | ToolThemePalette): ToolThemePalette {
  if (!theme) return TOOL_THEMES.default;
  if (typeof theme === "string") {
    return TOOL_THEMES[theme] || TOOL_THEMES.default;
  }
  return {
    accent: theme.accent || TOOL_THEMES.default.accent,
    accentDark: theme.accentDark || TOOL_THEMES.default.accentDark,
    accentTint: theme.accentTint || TOOL_THEMES.default.accentTint,
  };
}

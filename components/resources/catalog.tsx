"use client";

/**
 * Resources catalog UI (My Resources tabs + the standalone /tools, /guides, /services pages).
 *
 * Same visual language as the shared tool layout (components/tools/layout): paper background,
 * deep colour band with the Rahvana bird watermark, serif headings, warm hairline borders, and
 * one accent palette per resource so a card already looks like the tool it opens. Purely
 * presentational: ownership, credit and launch logic stay in the pages.
 */

import React from "react";
import Link from "next/link";
import { ArrowRight, Lock, Search } from "lucide-react";
import { TOOL_THEMES } from "@/components/tools/layout/toolThemes";
import { WATERMARK_SVG } from "@/components/tools/layout/ToolHeader";
import type { ToolThemePalette } from "@/components/tools/layout/types";
import CreditTypeIcon, { type CreditIconKind } from "@/components/resources/CreditTypeIcon";
import ResourceSectionHeader from "@/components/resources/ResourceSectionHeader";

export type CatalogPalette = ToolThemePalette;

// ─── Palettes ───────────────────────────────────────────────────────────────

/** Tools use the exact theme of the tool page they open. Keyed by the /tools card id. */
export const TOOL_CARD_PALETTES: Record<string, CatalogPalette> = {
  "221g-planner": TOOL_THEMES.g221,
  "interview-prep": TOOL_THEMES.interview,
  "cspa-age-checker": TOOL_THEMES.cspa,
  "sponsorship-calculator": TOOL_THEMES.sponsor,
  "queue-watch": TOOL_THEMES.dq,
  "uscis-case-status": TOOL_THEMES.uscis,
  "photo-booth": TOOL_THEMES.photo,
  "pdf-toolkit": TOOL_THEMES.pdf,
  "snap-sign": TOOL_THEMES.sign,
  "form-forge": TOOL_THEMES.forms,
};

/** Guides: one palette per guide category. */
export const GUIDE_CATEGORY_PALETTES: Record<string, CatalogPalette> = {
  "Pakistan Document": { accent: "#2E6B4F", accentDark: "#143A29", accentTint: "#E3EFE8" },
  "Medical & Exam": TOOL_THEMES.medical,
};

/** Services: the same accents as the service wizards (components/tools/service-skin). */
export const SERVICE_CATEGORY_PALETTES: Record<string, CatalogPalette> = {
  "expert-help": TOOL_THEMES.default,
  "pakistan-docs-services": { accent: "#4A5BB5", accentDark: "#232E6B", accentTint: "#E6E9F7" },
  medical: { accent: "#C4534B", accentDark: "#6E2420", accentTint: "#FBE7E4" },
  documents: { accent: "#B47A12", accentDark: "#5E3F07", accentTint: "#F9EDD3" },
};

export const CATALOG_BAND_PALETTE = TOOL_THEMES.default;

export function catalogPaletteVars(palette: CatalogPalette): React.CSSProperties {
  return {
    "--cat-accent": palette.accent,
    "--cat-accent-dark": palette.accentDark,
    "--cat-accent-tint": palette.accentTint,
  } as React.CSSProperties;
}

// ─── Buttons ────────────────────────────────────────────────────────────────

/** Filled accent button (inside a CatalogCard, or any element that sets catalogPaletteVars). */
export const CATALOG_BTN_PRIMARY =
  "inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[var(--cat-accent,#0F8F80)] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--cat-accent-dark,#0A4F49)] focus-visible:ring-2 focus-visible:ring-[var(--cat-accent,#0F8F80)]/40 focus-visible:ring-offset-2 focus-visible:outline-none";

/** Quiet outlined button that picks up the accent on hover. */
export const CATALOG_BTN_GHOST =
  "inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#DDD9CE] bg-white px-3.5 text-[13px] font-semibold text-[#16302C] transition-colors hover:border-[var(--cat-accent,#0F8F80)] hover:text-[var(--cat-accent-dark,#0A4F49)] focus-visible:ring-2 focus-visible:ring-[var(--cat-accent,#0F8F80)]/40 focus-visible:outline-none";

/** "Open tool ->" footer cue for cards that are links. */
export function CatalogOpenCue({ label }: { label: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--cat-accent-dark)]">
      {label}
      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </span>
  );
}

/** Credit price (seed jar + amount) in the card's accent instead of the default teal. */
export function CatalogPrice({
  kind,
  amount,
  suffix,
  size = 26,
}: {
  kind: CreditIconKind;
  amount: number;
  suffix?: string;
  size?: number;
}) {
  return (
    <span className="inline-flex [&_span]:text-[var(--cat-accent-dark)]">
      <CreditTypeIcon kind={kind} size={size} amount={amount} suffix={suffix} />
    </span>
  );
}

// ─── Badges ─────────────────────────────────────────────────────────────────

const BADGE_TONES = {
  accent: "bg-[var(--cat-accent-tint)] text-[var(--cat-accent-dark)]",
  neutral: "bg-[#16302C]/[0.06] text-[#16302C]/70",
  success: "bg-[#E3F1E6] text-[#1F5A33]",
  warning: "bg-[#FBEFD9] text-[#7A4A06]",
  info: "bg-[#E5EBF3] text-[#1B2B44]",
} as const;

export function CatalogBadge({
  tone = "accent",
  icon,
  children,
}: {
  tone?: keyof typeof BADGE_TONES;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] leading-none font-medium ${BADGE_TONES[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}

// ─── Card ───────────────────────────────────────────────────────────────────

export interface CatalogCardProps {
  palette: CatalogPalette;
  /** A lucide icon element, e.g. <Camera />. Sized by the card. */
  icon: React.ReactNode;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  titleAttr?: string;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  badges?: React.ReactNode;
  /** Top-right controls (favourite, info tooltip, delete...). Clicks stay inside. */
  topRight?: React.ReactNode;
  /** Extra body content under the description (progress bar, counts...). */
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** Makes the whole card a link. */
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  locked?: boolean;
  disabled?: boolean;
  index?: number;
}

function sizeIcon(icon: React.ReactNode, className: string) {
  return React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className })
    : icon;
}

export function CatalogCard({
  palette,
  icon,
  eyebrow,
  title,
  titleAttr,
  subtitle,
  description,
  badges,
  topRight,
  children,
  footer,
  href,
  onClick,
  locked = false,
  disabled = false,
}: CatalogCardProps) {
  const interactive = !disabled && (!!href || !!onClick);
  const className = `group relative flex h-full flex-col rounded-[14px] border border-[#E4E0D6] bg-white text-left text-[#16302C] transition-[border-color,box-shadow] duration-200 ${
    disabled
      ? "cursor-not-allowed opacity-70"
      : "hover:border-[#CFC9BB] hover:shadow-[0_6px_18px_-10px_rgba(22,48,44,0.25)]"
  } ${interactive ? "cursor-pointer" : ""}`;
  const style = catalogPaletteVars(palette);

  const body = (
    <>
      <div className="flex grow flex-col px-5 pt-5 pb-4">
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cat-accent-tint)] text-[var(--cat-accent-dark)]">
            {sizeIcon(icon, "h-5 w-5 stroke-[1.75]")}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 title={titleAttr} className="text-[16px] leading-snug font-semibold text-[#16302C]">
              {title}
            </h3>
            {(eyebrow || locked) && (
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-[#16302C]/55">
                {eyebrow && <span>{eyebrow}</span>}
                {locked && (
                  <span className="inline-flex items-center gap-1 text-[#16302C]/60">
                    <Lock className="h-3 w-3" />
                    Locked
                  </span>
                )}
              </p>
            )}
          </div>
          {topRight && (
            <div className="relative z-20 -mt-1 -mr-1 flex items-center">{topRight}</div>
          )}
        </div>

        {subtitle && <p className="mt-3 text-xs leading-snug text-[#16302C]/55">{subtitle}</p>}
        {badges && <div className="mt-3 flex flex-wrap gap-1.5">{badges}</div>}
        {description && (
          <p className="mt-3 grow text-[13.5px] leading-relaxed text-[#16302C]/70">{description}</p>
        )}
        {children}
      </div>

      {footer && (
        <div className="relative z-20 mt-auto border-t border-[#EEEBE3] px-5 py-3">{footer}</div>
      )}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} onClick={onClick} className={className} style={style}>
        {body}
      </Link>
    );
  }

  const clickable = !!onClick && !disabled;
  return (
    <div
      className={className}
      style={style}
      onClick={clickable ? onClick : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onClick?.(e as unknown as React.MouseEvent);
              }
            }
          : undefined
      }
    >
      {body}
    </div>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────────

export function CatalogGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">{children}</div>
  );
}

export function CatalogEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-full rounded-[20px] border border-dashed border-[#DDD9CE] bg-white/60 px-6 py-12 text-center text-sm text-[#16302C]/60">
      {children}
    </div>
  );
}

/** A titled block of cards ("My Tools", "Browse Tools"...). */
export function CatalogSection({
  title,
  subtitle,
  count,
  actions,
  className = "",
  children,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`mt-14 first:mt-0 ${className}`}>
      <ResourceSectionHeader title={title} subtitle={subtitle} count={count} actions={actions} />
      {children}
    </section>
  );
}

/** Deep colour band at the top of a catalog page (same band as a tool page). */
export function CatalogBand({
  eyebrow,
  title,
  tagline,
  children,
  roomForToolbar = false,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  tagline?: React.ReactNode;
  children?: React.ReactNode;
  roomForToolbar?: boolean;
}) {
  return (
    <section
      className={`relative overflow-hidden px-4 text-white sm:px-6 ${
        roomForToolbar ? "pt-14 pb-20 sm:pt-16 sm:pb-22" : "pt-14 pb-14 sm:pt-16 sm:pb-16"
      }`}
      style={{
        backgroundColor: CATALOG_BAND_PALETTE.accentDark,
        backgroundImage: `url("${WATERMARK_SVG}")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right max(24px, calc(50% - 560px)) bottom 18px",
        backgroundSize: "150px auto",
      }}
    >
      <div className="relative mx-auto max-w-6xl">
        {eyebrow && (
          <p className="text-[11px] font-semibold tracking-[0.2em] text-white/60 uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 font-serif text-3xl leading-tight font-semibold tracking-tight sm:text-4xl md:text-[44px]">
          {title}
        </h1>
        {tagline && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-[15px]">
            {tagline}
          </p>
        )}
        {children && <div className="mt-7">{children}</div>}
      </div>
    </section>
  );
}

/**
 * Full catalog page: clears the site header, draws the band, then the content on paper.
 * `toolbar` (tabs or filters) sits on a white bar overlapping the bottom of the band.
 */
export function CatalogShell({
  eyebrow,
  title,
  tagline,
  bandContent,
  toolbar,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  tagline?: React.ReactNode;
  bandContent?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-[55px] min-h-screen overflow-x-hidden bg-[#F6F4EF] text-[#16302C] antialiased">
      <CatalogBand eyebrow={eyebrow} title={title} tagline={tagline} roomForToolbar={!!toolbar}>
        {bandContent}
      </CatalogBand>
      <main className={`relative z-10 px-4 pb-24 sm:px-6 ${toolbar ? "-mt-8" : "pt-10"}`}>
        <div className="mx-auto max-w-6xl">
          {toolbar && <div className="mb-10">{toolbar}</div>}
          {children}
        </div>
      </main>
    </div>
  );
}

/** White bar that overlaps the band (holds tabs or category filters). */
export function CatalogToolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] border border-[#DDD9CE] bg-white p-2 shadow-[0_14px_40px_-16px_rgba(22,48,44,0.28)]">
      {children}
    </div>
  );
}

/** Search field for the band. */
export function CatalogSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative max-w-xl">
      <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[#16302C]/45" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-full border border-white/20 bg-white py-3.5 pr-4 pl-12 text-[15px] text-[#16302C] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)] transition placeholder:text-[#16302C]/45 focus:ring-4 focus:ring-white/25 focus:outline-none"
      />
    </div>
  );
}

/**
 * Pill filters. "bar" = inside a CatalogToolbar (quiet inactive pills);
 * "loose" = on the paper background (outlined inactive pills).
 */
export function CatalogFilters<T extends string>({
  options,
  value,
  onChange,
  variant = "bar",
  label,
}: {
  options: { id: T; label: React.ReactNode }[];
  value: T;
  onChange: (id: T) => void;
  variant?: "bar" | "loose";
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden"
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={`shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              active
                ? "border-[#16302C] bg-[#16302C] text-white"
                : variant === "bar"
                  ? "border-transparent bg-transparent text-[#16302C]/65 hover:bg-[#F6F4EF] hover:text-[#16302C]"
                  : "border-[#DDD9CE] bg-white text-[#16302C]/70 hover:border-[#16302C]/35 hover:text-[#16302C]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

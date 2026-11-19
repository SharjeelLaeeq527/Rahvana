"use client";

import React, { useState } from "react";
import { resolveToolTheme } from "./toolThemes";
import { ToolHeader } from "./ToolHeader";
import { ToolDrawer } from "./ToolDrawer";
import { ToolBottomBar } from "./ToolBottomBar";
import type { ToolLayoutProps, DrawerTabKey } from "./types";

export function ToolLayout({
  title,
  tagline,
  category,
  // priceOrDuration,
  theme,
  quickAccessItem,
  headerActions,
  layout,
  children,
  answer,
  className = "",
  benchClassName = "",
  workClassName = "",
  answerClassName = "",
  rules = [],
  faqs = [],
  sources = [],
  disclaimer,
  hideBottomBar = false,
  ctaText,
  ctaButtonText,
  ctaHref,
}: ToolLayoutProps) {
  const palette = resolveToolTheme(theme);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DrawerTabKey>("rules");

  const hasRules = rules.length > 0;
  const hasFaqs = faqs.length > 0;
  const hasSources = sources.length > 0;
  const hasDrawerContent = hasRules || hasFaqs || hasSources;

  // Determine which layout to render
  const effectiveLayout = layout || (answer ? "split" : "single");

  const handleOpenDrawerWithTab = (tab: DrawerTabKey) => {
    setActiveTab(tab);
    setDrawerOpen(true);
  };

  const handleOpenDrawerDefault = () => {
    if (hasRules) {
      setActiveTab("rules");
    } else if (hasFaqs) {
      setActiveTab("faq");
    } else if (hasSources) {
      setActiveTab("src");
    }
    setDrawerOpen(true);
  };

  return (
    <div
      className={`min-h-screen bg-[#F6F4EF] text-[#16302C] antialiased ${className}`}
      style={
        {
          "--tool-accent": palette.accent,
          "--tool-accent-dark": palette.accentDark,
          "--tool-accent-tint": palette.accentTint,
        } as React.CSSProperties
      }
    >
      {/* ── 1. Hero Color Band (var(--ad) deep background + watermark) ────── */}
      <ToolHeader
        title={title}
        tagline={tagline}
        category={category}
        // priceOrDuration={priceOrDuration}
        theme={palette}
        quickAccessItem={quickAccessItem}
        hasDrawerContent={hasDrawerContent}
        onOpenDrawer={handleOpenDrawerDefault}
        headerActions={headerActions}
      />

      {/* ── 2. The Bench Workspace Card (Overlaps the hero band with -mt-12) ─ */}
      <main className="relative z-10 -mt-12 sm:-mt-14 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div
            className={`overflow-hidden rounded-[22px] border border-[#DDD9CE] bg-white shadow-[0_14px_40px_-16px_rgba(22,48,44,0.28)] transition-all duration-300 ${
              effectiveLayout === "split"
                ? "grid grid-cols-1 lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]"
                : "block"
            } ${benchClassName}`}
          >
            {/* Work Area (Inputs, Forms, Uploader, Practice questions) */}
            <div
              className={`min-w-0 bg-white p-6 sm:p-8 lg:p-10 ${workClassName}`}
            >
              {children}
            </div>

            {/* Answer / Verdict Aside (Only in split mode) */}
            {effectiveLayout === "split" && answer && (
              <aside
                className={`min-w-0 border-t lg:border-t-0 lg:border-l border-[#DDD9CE]/70 p-6 sm:p-8 lg:p-9 flex flex-col gap-5 ${answerClassName}`}
                style={{ backgroundColor: palette.accentTint }}
                aria-live="polite"
              >
                {answer}
              </aside>
            )}
          </div>

          {/* ── 3. Optional Bottom Bar (.under) ───────────────────────────── */}
          {!hideBottomBar && (
            <ToolBottomBar
              rules={rules}
              faqs={faqs}
              sources={sources}
              disclaimer={disclaimer}
              onOpenDrawerTab={handleOpenDrawerWithTab}
            />
          )}
        </div>
      </main>

      {/* ── 4. Slide-over Help / Rules / FAQs Drawer ────────────────────────── */}
      <ToolDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={title}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        rules={rules}
        faqs={faqs}
        sources={sources}
        accentColor={palette.accent}
        ctaText={ctaText}
        ctaButtonText={ctaButtonText}
        ctaHref={ctaHref}
      />
    </div>
  );
}

export default ToolLayout;

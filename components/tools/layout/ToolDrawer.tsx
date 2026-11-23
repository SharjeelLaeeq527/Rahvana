"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { X, ExternalLink, ChevronDown } from "lucide-react";
import type { ToolRule, ToolFaq, ToolSource, DrawerTabKey } from "./types";

interface ToolDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  activeTab: DrawerTabKey;
  onTabChange: (tab: DrawerTabKey) => void;
  rules?: ToolRule[];
  faqs?: ToolFaq[];
  sources?: ToolSource[];
  accentColor?: string;
  ctaText?: string;
  ctaButtonText?: string;
  ctaHref?: string;
}

export function ToolDrawer({
  isOpen,
  onClose,
  title,
  activeTab,
  onTabChange,
  rules = [],
  faqs = [],
  sources = [],
  accentColor = "#0F8F80",
  ctaText = "Stuck on your case?",
  ctaButtonText = "Book an expert",
  ctaHref = "/book-consultation",
}: ToolDrawerProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Compute available tabs
  const availableTabs: { key: DrawerTabKey; label: string }[] = [];
  if (rules.length > 0) availableTabs.push({ key: "rules", label: "Rules" });
  if (faqs.length > 0) availableTabs.push({ key: "faq", label: "Questions" });
  if (sources.length > 0) availableTabs.push({ key: "src", label: "Sources" });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop scrim */}
      <div
        className="fixed inset-0 bg-[#16302C]/35 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer surface */}
      <aside
        className="relative z-10 flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl transition-transform animate-in slide-in-from-right duration-300"
        style={{
          boxShadow: "-20px 0 50px -20px rgba(0, 0, 0, 0.35)",
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-[#DDD9CE] px-6 py-4">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-[#16302C]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#66787A] transition-colors hover:bg-slate-100 hover:text-[#16302C]"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switcher (rendered only if > 1 tab available) */}
        {availableTabs.length > 0 && (
          <div className="flex gap-6 border-b border-[#DDD9CE] px-6">
            {availableTabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onTabChange(tab.key)}
                  className={`relative py-3.5 text-sm font-semibold transition-colors ${
                    active ? "text-[#16302C]" : "text-[#66787A] hover:text-[#16302C]"
                  }`}
                >
                  {tab.label}
                  {active && (
                    <span
                      className="absolute right-0 bottom-0 left-0 h-[2.5px] rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Tab content area */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === "rules" && rules.length > 0 && (
            <div className="divide-y divide-[#16302C]/10 border-y border-[#16302C]/10">
              {rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-baseline justify-between gap-4 py-3 text-sm"
                >
                  <span className="text-[#66787A]">{rule.label}</span>
                  <b className="text-right font-semibold text-[#16302C]">{rule.value}</b>
                </div>
              ))}
            </div>
          )}

          {activeTab === "faq" && faqs.length > 0 && (
            <div className="divide-y divide-[#DDD9CE]">
              {faqs.map((faq, idx) => (
                <details
                  key={idx}
                  className="group py-3 text-sm"
                  defaultOpen={idx === 0}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-[#16302C] select-none hover:text-[#0A4F49]">
                    <span>{faq.question}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#66787A] transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="mt-2.5 text-[13.5px] leading-relaxed text-[#66787A]">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          )}

          {activeTab === "src" && sources.length > 0 && (
            <div className="divide-y divide-[#DDD9CE]">
              {sources.map((src, idx) => (
                <a
                  key={idx}
                  href={src.url || "#"}
                  target={src.url ? "_blank" : undefined}
                  rel={src.url ? "noopener noreferrer" : undefined}
                  className="group block py-3.5 text-sm font-semibold text-[#16302C] transition-colors hover:text-[#0A4F49]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{src.title}</span>
                    {src.url && (
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#66787A] group-hover:text-[#0A4F49]" />
                    )}
                  </div>
                  {src.domain && (
                    <small className="block text-xs font-normal text-[#66787A]">
                      {src.domain}
                    </small>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="border-t border-[#DDD9CE] p-6 bg-[#FAFAF8]">
          <div className="rounded-xl bg-[#0A4F49] p-4 text-sm text-white">
            <span className="block text-white/90">{ctaText}</span>
            <Link
              href={ctaHref}
              className="mt-1.5 inline-block font-bold text-white underline underline-offset-4 hover:opacity-90"
            >
              {ctaButtonText} &rarr;
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, BookOpen, Check, Users, ChevronDown, ArrowLeft } from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import Link from "next/link";
import type { CandidateProfile } from "@/types/candidate";

interface HeaderProps {
  formTitle?: string;
  formSubtitle?: string;
  onOpenMenu?: () => void;
  showMenu?: boolean;
  isAutoSaving?: boolean;
  lastSavedAt?: string | null;
  activeCandidate?: CandidateProfile | null;
  candidates?: CandidateProfile[];
  onSelectCandidate?: (id: string) => void;
  isMultiCandidate?: boolean;
}

export function Header({
  formTitle,
  formSubtitle,
  onOpenMenu,
  showMenu,
  isAutoSaving,
  lastSavedAt,
  activeCandidate,
  candidates,
  onSelectCandidate,
  isMultiCandidate = false,
}: HeaderProps) {
  const [isCandidateDropdownOpen, setIsCandidateDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCandidateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasMultiple = (candidates && candidates.length > 1) || isMultiCandidate;

  return (
    <div
      className="sticky top-0 backdrop-blur-xl border-b z-40 bg-white/90"
      style={{
        borderColor: "rgba(13, 115, 119, 0.12)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Return to Journey & Form Title */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger for mobile */}
            {showMenu && (
              <button
                onClick={onOpenMenu}
                className="lg:hidden p-2 rounded-lg hover:bg-[#e8f6f6] text-[#0d7377] transition"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Back to Journey Link */}
            <Link
              href="/journey"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-[#0d7377] hover:bg-teal-50/80 border border-slate-200 transition-all shrink-0"
              title="Return to your main journey dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Journey</span>
            </Link>

            {/* Icon */}
            <div
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
              style={{
                background: "linear-gradient(135deg, #0d7377 0%, #14a0a6 100%)",
              }}
            >
              <BookOpen className="w-4 h-4 text-white" />
            </div>

            {/* Form Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-base font-bold text-gray-900 truncate">
                  {formTitle || "Form"}
                </h1>
              </div>
              {formSubtitle && (
                <p className="text-[11px] md:text-xs text-gray-500 truncate hidden sm:block">
                  {formSubtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: Candidate Switcher & Save Status */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Candidate Context Pill / Switcher */}
            {activeCandidate && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => hasMultiple && setIsCandidateDropdownOpen((prev) => !prev)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    hasMultiple
                      ? "bg-teal-50/70 border-teal-200 text-[#0a5a5d] hover:bg-teal-100/70 cursor-pointer"
                      : "bg-slate-50 border-slate-200 text-slate-700 cursor-default"
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-[#0d7377] shrink-0" />
                  <span className="max-w-[130px] md:max-w-[180px] truncate font-bold">
                    {activeCandidate.fullName || activeCandidate.label || activeCandidate.name?.first || "Candidate"}
                  </span>
                  {activeCandidate.relation && (
                    <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-100/80 px-1.5 py-0.2 rounded">
                      {activeCandidate.relation}
                    </span>
                  )}
                  {hasMultiple && (
                    <ChevronDown className="w-3.5 h-3.5 text-teal-600 shrink-0 opacity-70" />
                  )}
                </button>

                {/* Candidate Switcher Dropdown */}
                <AnimatePresence>
                  {isCandidateDropdownOpen && candidates && candidates.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-1.5 z-50 overflow-hidden"
                    >
                      <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        Switch Candidate Filing
                      </div>
                      <div className="py-1 space-y-0.5 max-h-60 overflow-y-auto">
                        {candidates.map((cand) => {
                          const isSelected = cand.id === activeCandidate.id;
                          return (
                            <button
                              key={cand.id}
                              type="button"
                              onClick={() => {
                                onSelectCandidate?.(cand.id);
                                setIsCandidateDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                                isSelected
                                  ? "bg-[#0d7377] text-white"
                                  : "text-slate-700 hover:bg-teal-50"
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="truncate font-bold">
                                  {cand.fullName || cand.label || cand.name?.first || cand.id}
                                </div>
                                <div
                                  className={`text-[10px] ${
                                    isSelected ? "text-teal-100" : "text-slate-400"
                                  }`}
                                >
                                  {cand.relation ? `${cand.relation} • ` : ""}
                                  {cand.visaCategory || "Beneficiary"}
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Save Status Indicator */}
            {(isAutoSaving || lastSavedAt) && (
              <div className="flex items-center">
                {isAutoSaving ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
                    <Loader size="sm" />
                    <span className="hidden sm:inline">Saving</span>
                  </div>
                ) : lastSavedAt ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-teal-50 border border-teal-200 text-[#0a5a5d] text-xs font-medium">
                    <Check className="w-3.5 h-3.5 text-[#0d7377] stroke-[3]" />
                    <span className="hidden sm:inline">Saved</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

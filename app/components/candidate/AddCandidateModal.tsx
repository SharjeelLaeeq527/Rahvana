// app/components/candidate/AddCandidateModal.tsx
// ============================================================================
// Add Candidate / Beneficiary Modal
// Allows petitioner to add a 2nd parent (IR-5) or additional children (IR-2)
// Supports Free Preview mode with paywall-aware tier tagging.
// ============================================================================

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  UserPlus,
  Users,
  Heart,
  Baby,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useCandidate } from "@/app/context/CandidateContext";
import type { CandidateRelation } from "@/types/candidate";
import { getVisaCategoryForRelation } from "@/lib/candidate/candidateSyncService";

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  visaCategory?: string;
}

export function AddCandidateModal({
  isOpen,
  onClose,
  visaCategory = "IR-5",
}: AddCandidateModalProps) {
  const { addCandidate, candidates } = useCandidate();

  const isIr5 = visaCategory.toUpperCase().includes("IR-5") || visaCategory.toUpperCase().includes("IR5");
  const isIr2 = visaCategory.toUpperCase().includes("IR-2") || visaCategory.toUpperCase().includes("IR2");

  // Determine smart default relation
  const hasMother = candidates.some((c) => c.relation === "Mother");
  const hasFather = candidates.some((c) => c.relation === "Father");

  const defaultRelation: CandidateRelation = isIr5
    ? hasMother && !hasFather
      ? "Father"
      : "Mother"
    : isIr2
      ? "Child"
      : "Mother";

  const [relation, setRelation] = useState<CandidateRelation>(defaultRelation);
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const targetVisa = getVisaCategoryForRelation(relation, visaCategory);
      addCandidate({
        relation,
        fullName: fullName.trim() || undefined,
        visaCategory: targetVisa,
        isPreview: true, // Free preview mode for testing
        tier: "free",
      });
      onClose();
    } catch (err) {
      console.error("[AddCandidateModal] Error adding candidate:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const relationOptions: {
    value: CandidateRelation;
    label: string;
    visaBadge: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { value: "Mother", label: "Mother", visaBadge: "IR-5 Parent", icon: Heart },
    { value: "Father", label: "Father", visaBadge: "IR-5 Parent", icon: Users },
    { value: "Stepparent", label: "Stepparent", visaBadge: "IR-5 Parent", icon: Users },
    { value: "AdoptiveParent", label: "Adoptive Parent", visaBadge: "IR-5 Parent", icon: Heart },
    { value: "Spouse", label: "Spouse", visaBadge: "IR-1 Spouse", icon: Heart },
    { value: "Child", label: "Child", visaBadge: "IR-2 Child", icon: Baby },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative flex flex-col w-full max-w-lg md:max-w-md max-h-[calc(100dvh-2rem)] sm:max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="shrink-0 bg-gradient-to-br from-[#0d7377]/10 via-[#0d7377]/5 to-transparent px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0d7377] text-white flex items-center justify-center shadow-md shadow-[#0d7377]/20 shrink-0">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800">
                  Add Beneficiary Profile
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Multi-profile petitioner support
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-4.5 overscroll-contain">
              {/* Free preview badge / notice */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-teal-50/80 border border-teal-200/70 text-xs text-teal-800 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-teal-900 text-xs sm:text-sm">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 shrink-0" />
                  <span>Multi-Profile Preview Experience</span>
                </div>
                <p className="text-teal-700 leading-relaxed text-[11px] sm:text-[11.5px]">
                  You can switch between candidate profiles right from the header tray.
                  Petitioner sponsor information (income, affidavit metrics, tax records) will be automatically synced.
                </p>
              </div>

              {/* Relation selector */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 sm:mb-2">
                  Relationship to Petitioner
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {relationOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = relation === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRelation(opt.value)}
                        className={`flex flex-col items-start gap-1 p-2.5 sm:p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                          isSelected
                            ? "border-[#0d7377] bg-[#0d7377]/5 text-[#0d7377] ring-1 ring-[#0d7377]"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2 w-full">
                          <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isSelected ? "text-[#0d7377]" : "text-slate-400"}`} />
                          <span className="truncate">{opt.label}</span>
                        </div>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                          isSelected ? "bg-[#0d7377]/15 text-[#0d7377]" : "bg-slate-100 text-slate-500"
                        }`}>
                          {opt.visaBadge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Candidate full name */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 sm:mb-1.5">
                  Beneficiary Full Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={relation === "Mother" ? "e.g. Fatima Bibi" : relation === "Father" ? "e.g. Mohammad Ali" : "e.g. Full Name"}
                  className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0d7377] focus:ring-2 focus:ring-[#0d7377]/10 transition-all"
                />
              </div>

              {/* Feature highlights */}
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Separate roadmap milestones & checklist tracking</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Independent DS-260, medical exam, and interview prep</span>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="shrink-0 flex items-center justify-end gap-2.5 sm:gap-3 px-5 sm:px-6 py-3 sm:py-3.5 bg-slate-50/90 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-bold text-white bg-[#0d7377] hover:bg-[#0a5c5f] rounded-lg shadow-sm shadow-[#0d7377]/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Candidate Profile"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

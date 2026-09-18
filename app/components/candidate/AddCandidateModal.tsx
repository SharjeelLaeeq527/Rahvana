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
      : "Other";

  const [relation, setRelation] = useState<CandidateRelation>(defaultRelation);
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      addCandidate({
        relation,
        fullName: fullName.trim() || undefined,
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

  const relationOptions: { value: CandidateRelation; label: string; icon: React.ComponentType<{ className?: string }> }[] = isIr5
    ? [
        { value: "Mother", label: "Mother", icon: Heart },
        { value: "Father", label: "Father", icon: Users },
        { value: "Stepparent", label: "Stepparent", icon: Users },
        { value: "AdoptiveParent", label: "Adoptive Parent", icon: Heart },
      ]
    : isIr2
      ? [
          { value: "Child", label: "Child (Son / Daughter)", icon: Baby },
          { value: "Other", label: "Other Relative", icon: Users },
        ]
      : [
          { value: "Mother", label: "Mother", icon: Heart },
          { value: "Father", label: "Father", icon: Users },
          { value: "Child", label: "Child", icon: Baby },
          { value: "Other", label: "Other Relative", icon: Users },
        ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-[#0d7377]/10 via-[#0d7377]/5 to-transparent px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0d7377] text-white flex items-center justify-center shadow-md shadow-[#0d7377]/20">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {isIr5 ? "Add Parent Profile" : isIr2 ? "Add Child Profile" : "Add Beneficiary Profile"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
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
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Free preview badge / notice */}
            <div className="p-3.5 rounded-xl bg-teal-50/80 border border-teal-200/70 text-xs text-teal-800 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-teal-900">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Multi-Profile Preview Experience</span>
              </div>
              <p className="text-teal-700 leading-relaxed text-[11.5px]">
                You can switch between candidate profiles right from the header tray.
                Petitioner sponsor information (income, affidavit metrics, tax records) will be automatically synced.
              </p>
            </div>

            {/* Relation selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
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
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                        isSelected
                          ? "border-[#0d7377] bg-[#0d7377]/5 text-[#0d7377] ring-1 ring-[#0d7377]"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? "text-[#0d7377]" : "text-slate-400"}`} />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Candidate full name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Beneficiary Full Name <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={relation === "Mother" ? "e.g. Fatima Bibi" : relation === "Father" ? "e.g. Mohammad Ali" : "e.g. Full Name"}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0d7377] focus:ring-2 focus:ring-[#0d7377]/10 transition-all"
              />
            </div>

            {/* Feature highlights */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Separate roadmap milestones & checklist tracking</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Independent DS-260, medical exam, and interview prep</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#0d7377] hover:bg-[#0a5c5f] rounded-lg shadow-sm shadow-[#0d7377]/20 transition-all disabled:opacity-50"
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

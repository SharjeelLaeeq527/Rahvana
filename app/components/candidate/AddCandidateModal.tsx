// app/components/candidate/AddCandidateModal.tsx
// ============================================================================
// Add Candidate / Beneficiary Modal
// Allows petitioner to add a 2nd parent (IR-5) or additional children (IR-2).
// All candidates are treated equally (no per-candidate preview / upsell).
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  UserPlus,
  Users,
  Heart,
  Baby,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCandidate } from "@/app/context/CandidateContext";
import type { CandidateRelation } from "@/types/candidate";
import { getVisaCategoryForRelation, getBaseVisaCategory } from "@/lib/candidate/candidateSyncService";
import { getJourneyHrefByType } from "@/lib/constants/routes";
import { IR2_ENABLED } from "@/lib/feature-flags";

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
  const router = useRouter();

  // A petitioner can sponsor across categories (a parent AND a spouse AND a child), so every
  // relation is offered. The ONLY cardinality rule is USCIS's "one spouse at a time": a second
  // Spouse can never be added, so Spouse is hidden once a spouse candidate already exists.
  // Check both relation AND visa category to catch all IR-1 variants.
  const hasSpouse = candidates.some(
    (c) => c.relation === "Spouse" || getBaseVisaCategory(c.visaCategory) === "IR-1"
  );
  const hasMother = candidates.some((c) => c.relation === "Mother");
  const hasFather = candidates.some((c) => c.relation === "Father");

  // Smart default relation: fill the missing parent first, else Mother.
  const defaultRelation: CandidateRelation = hasMother && !hasFather ? "Father" : "Mother";

  const [relation, setRelation] = useState<CandidateRelation>(defaultRelation);
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const prevIsOpenRef = React.useRef(isOpen);
  useEffect(() => {
    // Only reset state on transition from closed to open
    if (isOpen && !prevIsOpenRef.current) {
      setRelation(defaultRelation);
      setFullName("");
      setIsSubmitting(false);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, defaultRelation]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Guard against a second spouse (belt-and-suspenders; Spouse is hidden when one exists,
    // and CandidateContext.addCandidate throws too).
    if (relation === "Spouse" && hasSpouse) {
      return;
    }
    setIsSubmitting(true);

    try {
      const targetVisa = getVisaCategoryForRelation(relation, visaCategory);
      addCandidate({
        relation,
        fullName: fullName.trim() || undefined,
        visaCategory: targetVisa,
        // Every candidate/parent is a real beneficiary and is treated equally.
        // We do NOT flag added parents as "preview" based on creation order.
        isPreview: false,
        tier: "free",
      });
      onClose();

      // Navigate to the new candidate's journey when it belongs to a different category than
      // the page we are on (e.g. adding a Spouse/IR-1 while viewing an IR-5 journey). The URL
      // is authoritative for the category (PROJECT_KNOWLEDGE 4.7), so we move the URL here on
      // an explicit add instead of letting the journey page auto-redirect off the candidate.
      const targetRoute = getJourneyHrefByType(targetVisa);
      if (targetRoute && typeof window !== "undefined" && !window.location.pathname.includes(targetRoute)) {
        router.push(targetRoute);
      }
    } catch (err) {
      console.error("[AddCandidateModal] Error adding candidate:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allRelationOptions: {
    value: CandidateRelation;
    label: string;
    visaBadge: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { value: "Mother", label: "Mother", visaBadge: "IR-5 Parent", icon: Heart },
    { value: "Father", label: "Father", visaBadge: "IR-5 Parent", icon: Users },
    { value: "Stepparent", label: "Stepparent", visaBadge: "IR-5 Parent", icon: Users },
    { value: "AdoptiveParent", label: "Adoptive Parent", visaBadge: "IR-5 Parent", icon: Heart },
    { value: "Child", label: "Child", visaBadge: "IR-2 Child", icon: Baby },
    { value: "Spouse", label: "Spouse", visaBadge: "IR-1 Spouse", icon: Heart },
  ];

  // Category-agnostic: offer every relation (the exact visa category is derived from the
  // relation via getVisaCategoryForRelation). The only exclusion is a SECOND spouse - USCIS
  // permits only one spouse at a time - so Spouse is dropped once one already exists.
  // Child (IR-2) is offered only while IR-2 is switched on (lib/feature-flags); otherwise it would
  // create a candidate whose journey route redirects away.
  const relationOptions = allRelationOptions.filter(
    (o) => !(o.value === "Spouse" && hasSpouse) && !(o.value === "Child" && !IR2_ENABLED)
  );

  const modal = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto p-3 sm:p-4 md:p-6">
        {/* Isolated Backdrop Overlay */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-hidden="true"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="relative z-10 my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[85vh] md:max-w-md"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-gradient-to-br from-[#0d7377]/10 via-[#0d7377]/5 to-transparent px-5 py-3.5 sm:px-6 sm:py-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0d7377] text-white shadow-md shadow-[#0d7377]/20 sm:h-10 sm:w-10">
                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 sm:text-base">
                  Add Beneficiary Profile
                </h3>
                <p className="text-[11px] text-slate-500 sm:text-xs">
                  Multi-profile petitioner support
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-4.5 overscroll-contain">
              {/* Multi-profile notice */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-teal-50/80 border border-teal-200/70 text-xs text-teal-800 space-y-1">
                <div className="font-semibold text-teal-900 text-xs sm:text-sm">
                  Multi-Profile Support
                </div>
                <p className="text-teal-700 leading-relaxed text-[11px] sm:text-[11.5px]">
                  Switch between beneficiary profiles anytime from this journey. Petitioner sponsor information (income, affidavit metrics, tax records) is shared automatically across all profiles.
                </p>
              </div>

              {/* Relation selector */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold tracking-wider text-slate-600 uppercase sm:mb-2 sm:text-xs">
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setRelation(opt.value);
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                        }}
                        className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left text-xs font-semibold transition-all sm:p-3 ${
                          isSelected
                            ? "border-[#0d7377] bg-[#0d7377]/5 text-[#0d7377] ring-1 ring-[#0d7377]"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex w-full items-center gap-1.5 sm:gap-2">
                          <Icon
                            className={`h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 ${isSelected ? "text-[#0d7377]" : "text-slate-400"}`}
                          />
                          <span className="truncate">{opt.label}</span>
                        </div>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                            isSelected
                              ? "bg-[#0d7377]/15 text-[#0d7377]"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {opt.visaBadge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Candidate full name */}
              <div>
                <label className="mb-1 block text-[11px] font-bold tracking-wider text-slate-600 uppercase sm:mb-1.5 sm:text-xs">
                  Beneficiary Full Name{" "}
                  <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={
                    relation === "Mother"
                      ? "e.g. Fatima Bibi"
                      : relation === "Father"
                        ? "e.g. Mohammad Ali"
                        : "e.g. Full Name"
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 transition-all placeholder:text-slate-400 focus:border-[#0d7377] focus:ring-2 focus:ring-[#0d7377]/10 focus:outline-none sm:px-3.5 sm:py-2.5 sm:text-sm"
                />
              </div>

              {/* Feature highlights */}
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center gap-2 text-[11px] text-slate-600 sm:text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>Separate roadmap milestones & checklist tracking</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-600 sm:text-xs">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                  <span>Independent DS-260, medical exam, and interview prep</span>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/90 px-5 py-3 sm:gap-3 sm:px-6 sm:py-3.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200/70 hover:text-slate-800 sm:px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-[#0d7377] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-[#0d7377]/20 transition-all hover:bg-[#0a5c5f] disabled:opacity-50 sm:px-5 sm:py-2.5"
              >
                {isSubmitting ? "Creating..." : "Create Candidate Profile"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  // Portal to <body> so the overlay escapes the sticky / overflow-hidden card it is
  // triggered from (CandidateSwitcherTray lives inside a sticky, overflow-hidden Card in
  // the Document Vault). Without this the fixed overlay's stacking context breaks and the
  // page behind bleeds through the modal.
  if (typeof document !== "undefined") {
    return createPortal(modal, document.body);
  }
  return null;
}

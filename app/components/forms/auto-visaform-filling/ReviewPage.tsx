"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Field } from "@/lib/formConfig/types";
import type { CandidateProfile } from "@/types/candidate";
import { getFieldCandidateScope } from "@/lib/formConfig/candidateScope";
import {
  CheckCircle2,
  Circle,
  Edit3,
  ChevronDown,
  ChevronUp,
  Eye,
  Download,
  Save,
  ArrowLeft,
  FileCheck2,
  Lock,
  User,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const isFieldAnswered = (field: Field, formData: Record<string, string>): boolean => {
  if (field.type === "checkbox" && field.options) {
    return field.options.some((opt) => formData[opt.pdfKey || opt.value] === "Yes");
  }
  const value = formData[field.key];
  return !!(value && value.trim() !== "");
};

const getDisplayValue = (field: Field, formData: Record<string, string>): string => {
  if (field.type === "checkbox" && field.options) {
    return field.options
      .filter((opt) => formData[opt.pdfKey || opt.value] === "Yes")
      .map((opt) => opt.label)
      .join(", ");
  }
  return formData[field.key] ?? "";
};

interface ReviewGroup {
  type: "group";
  key: string;
  label: string;
  fields: Field[];
}
interface ReviewFieldItem {
  type: "field";
  key: string;
  label: string;
  field: Field;
}
type ReviewItem = ReviewGroup | ReviewFieldItem;

const getReviewItems = (fields: Field[], formData: Record<string, string>): ReviewItem[] => {
  const items: ReviewItem[] = [];
  const processField = (field: Field) => {
    if (field.condition && !field.condition(formData)) return;
    if (field.type === "hidden" && field.subQuestions && field.subQuestions.length > 0) {
      const visibleSubQuestions: Field[] = [];
      const collectSubs = (subField: Field) => {
        if (subField.condition && !subField.condition(formData)) return;
        if (subField.type !== "hidden" || subField.label) visibleSubQuestions.push(subField);
        if (subField.subQuestions) subField.subQuestions.forEach((s) => collectSubs(s as unknown as Field));
      };
      field.subQuestions.forEach((s) => collectSubs(s as unknown as Field));
      if (visibleSubQuestions.length > 0)
        items.push({ type: "group", key: field.key, label: field.label, fields: visibleSubQuestions });
    } else if (field.type !== "hidden") {
      items.push({ type: "field", key: field.key, label: field.label, field });
    } else if (field.label) {
      items.push({ type: "field", key: field.key, label: field.label, field });
    }
  };
  fields.forEach(processField);
  return items;
};

/* ─── FieldCard ─────────────────────────────────────────────────────────────*/

interface FieldCardProps {
  fieldKey: string;
  label: string;
  val: string;
  hasVal: boolean;
  isChecked: boolean;
  isCandidateField: boolean;
  candidateName: string;
  onToggle: () => void;
  size?: "sm" | "md";
}

function FieldCard({
  label,
  val,
  hasVal,
  isChecked,
  isCandidateField,
  candidateName,
  onToggle,
}: FieldCardProps) {
  const cardStyles = isChecked
    ? "bg-[#f0fbf6] border-[#a3e4c8] shadow-sm"
    : !hasVal
    ? "bg-amber-50/40 border-amber-200 shadow-sm"
    : isCandidateField
    ? "bg-sky-50/45 border-sky-200/90 shadow-sm"
    : "bg-white border-slate-200 shadow-sm";

  const btnStyles = isChecked
    ? "bg-[#0d7857] text-white hover:bg-[#096245] shadow-xs"
    : "bg-white text-slate-600 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 shadow-2xs";

  const chipStyles = isChecked
    ? "bg-[#e6f7ef] text-[#09573c] font-medium border border-[#b2e8d2]"
    : isCandidateField
    ? "bg-sky-100/70 text-sky-950 font-medium border border-sky-200/70"
    : "bg-slate-100 text-slate-800 border border-slate-200/50";

  return (
    <div
      onClick={onToggle}
      className={`p-4 rounded-xl border transition-all flex flex-col justify-between cursor-pointer hover:shadow-md ${cardStyles}`}
    >
      <div>
        {/* Zone 1: pill (beneficiary only) */}
        {isCandidateField && (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#0369a1] bg-[#e0f2fe] border border-[#7dd3fc] px-2 py-0.5 rounded-full tracking-wide uppercase shadow-2xs">
              <User className="w-2.5 h-2.5 text-[#0284c7]" />
              {candidateName}
            </span>
          </div>
        )}

        {/* Zone 2: label */}
        <p className="text-xs font-semibold text-slate-700 leading-snug">
          {label}
        </p>
      </div>

      <div>
        {/* Zone 3: value — clean breathing room before answer */}
        <div className="pt-3 border-t border-slate-100/80 mt-3.5">
          {hasVal ? (
            <span title={val} className={`text-xs font-medium px-2.5 py-1 rounded-md block truncate ${chipStyles}`}>
              {val}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-amber-100/90 text-amber-800 border border-amber-200">
              <AlertTriangle className="w-2.5 h-2.5 shrink-0 text-amber-600" />
              Not provided
            </span>
          )}
        </div>

        {/* Zone 4: verify button — full width, pinned bottom */}
        <div className="pt-2.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={`w-full inline-flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${btnStyles}`}
          >
            {isChecked ? (
              <><CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />Verified</>
            ) : (
              <><Circle className="w-3.5 h-3.5 text-slate-400" />Verify</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── props ────────────────────────────────────────────────────────────────── */

export interface ReviewPageProps {
  formData: Record<string, string>;
  sections: { title: string; fields: Field[] }[];
  onEditStep: (step: number) => void;
  onBackToForm: () => void;
  onPreviewPDF: () => void;
  onDownloadPDF: () => void;
  onSaveToVault?: () => void;
  isPreviewing?: boolean;
  isDownloading?: boolean;
  isSavingToVault?: boolean;
  isFreePreview?: boolean;
  onUpgradeClick?: () => void;
  formCode?: string;
  activeCandidate?: CandidateProfile | null;
}

/* ─── component ─────────────────────────────────────────────────────────────*/

export function ReviewPage({
  formData,
  sections,
  onEditStep,
  onBackToForm,
  onPreviewPDF,
  onDownloadPDF,
  onSaveToVault,
  isPreviewing,
  isDownloading,
  isSavingToVault,
  isFreePreview = false,
  onUpgradeClick,
  formCode = "i130",
  activeCandidate,
}: ReviewPageProps) {
  const { t } = useLanguage();

  const [verifiedFields, setVerifiedFields] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<"all" | "beneficiary" | "unanswered" | "unverified">("all");

  // Extract all fields per section to calculate total & progress
  const sectionFieldMap = useMemo(() => {
    return sections.map((section, idx) => {
      const reviewItems = getReviewItems(section.fields, formData);
      const allFields: Field[] = [];
      reviewItems.forEach((item) => {
        if (item.type === "group") allFields.push(...item.fields);
        else allFields.push(item.field);
      });
      return {
        sectionIdx: idx,
        section,
        reviewItems,
        allFields,
        fieldKeys: allFields.map((f) => f.key),
      };
    });
  }, [sections, formData]);

  const totalAnswerCount = useMemo(() => {
    return sectionFieldMap.reduce((acc, curr) => acc + curr.allFields.length, 0);
  }, [sectionFieldMap]);

  const verifiedAnswerCount = useMemo(() => {
    let count = 0;
    sectionFieldMap.forEach((item) => {
      item.allFields.forEach((f) => {
        if (verifiedFields.has(f.key)) count++;
      });
    });
    return count;
  }, [sectionFieldMap, verifiedFields]);

  const beneficiaryFieldCount = useMemo(() => {
    if (!activeCandidate) return 0;
    let count = 0;
    sectionFieldMap.forEach((item) => {
      item.allFields.forEach((f) => {
        if (getFieldCandidateScope(formCode, f, item.section.title) === "candidate_distinct") {
          count++;
        }
      });
    });
    return count;
  }, [sectionFieldMap, formCode, activeCandidate]);

  const unansweredFieldCount = useMemo(() => {
    let count = 0;
    sectionFieldMap.forEach((item) => {
      item.allFields.forEach((f) => {
        if (!isFieldAnswered(f, formData)) count++;
      });
    });
    return count;
  }, [sectionFieldMap, formData]);

  const unverifiedFieldCount = totalAnswerCount - verifiedAnswerCount;
  const progressPercent =
    totalAnswerCount > 0 ? Math.round((verifiedAnswerCount / totalAnswerCount) * 100) : 0;
  const allConfirmed = totalAnswerCount > 0 && verifiedAnswerCount === totalAnswerCount;

  const candidateName = useMemo(() => {
    if (!activeCandidate) return "Beneficiary";
    if (activeCandidate.fullName) return activeCandidate.fullName.split(" ")[0];

    const firstNameKeys = [
      "pt4_beneficiary_first",
      "beneficiary_first_name",
      "ds260_first_name",
      "applicant_first_name",
      "immigrant_first_name",
    ];
    for (const k of firstNameKeys) {
      const v = formData[k]?.trim();
      if (v) return v;
    }

    if (activeCandidate.label)
      return activeCandidate.label
        .replace(/candidate\s*(\d+)?/i, (_: string, n: string) => (n ? `Beneficiary ${n}` : "Beneficiary"))
        .trim();
    return "Beneficiary";
  }, [activeCandidate, formData]);

  const candidateRelation = useMemo(() => {
    const r = activeCandidate?.relation?.trim().toLowerCase() ?? "";
    const map: Record<string, string> = {
      spouse: "Spouse", wife: "Wife", husband: "Husband",
      child: "Child", son: "Son", daughter: "Daughter",
      mother: "Mother", father: "Father", parent: "Parent",
      brother: "Brother", sister: "Sister", other: "",
    };
    return r in map ? map[r] : (activeCandidate?.relation ?? "");
  }, [activeCandidate]);

  const toggleFieldVerified = (fieldKey: string) => {
    setVerifiedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldKey)) {
        next.delete(fieldKey);
      } else {
        next.add(fieldKey);
      }
      return next;
    });
  };

  const toggleSectionCollapse = (idx: number) => {
    setCollapsedSections((prev) => {
      const n = new Set(prev);
      if (n.has(idx)) n.delete(idx); else n.add(idx);
      return n;
    });
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key); else n.add(key);
      return n;
    });
  };

  return (
    <div className="space-y-8 w-full pb-20">

      {/* Free Preview Banner */}
      {isFreePreview && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500 p-2 text-white shrink-0">
              <Lock size={15} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-950">Free Preview Active</p>
              <p className="text-xs text-amber-700 mt-0.5">You can audit and test-print Page 1 of your completed form PDF.</p>
            </div>
          </div>
          <button
            onClick={onUpgradeClick}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
          >
            Unlock Full PDF
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0d7377] shrink-0 mt-0.5">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">Form Review &amp; Confirmation</h1>
                {activeCandidate && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#e0f2fe] text-[#0369a1] border border-[#7dd3fc]">
                    <User className="w-3 h-3 text-[#0284c7]" />
                    {candidateName}{candidateRelation ? ` · ${candidateRelation}` : ""}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Audit each response below. Click any card or use the Verify button to confirm details before exporting.
              </p>
            </div>
          </div>

          {allConfirmed && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl self-start shadow-sm whitespace-nowrap">
              <ShieldCheck className="w-4 h-4" />
              All Verified · Ready to Export
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs font-semibold mb-2 text-slate-500">
            <span>{verifiedAnswerCount} of {totalAnswerCount} answers verified</span>
            <span className={allConfirmed ? "text-emerald-600 font-bold" : "text-[#0d7377]"}>{progressPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: allConfirmed ? "#16a34a" : "#0d7377" }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Focus Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-0.5">Focus</span>

          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterMode === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Fields ({totalAnswerCount})
          </button>

          {beneficiaryFieldCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterMode("beneficiary")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === "beneficiary"
                  ? "bg-[#0284c7] text-white shadow-xs"
                  : "bg-[#e0f2fe] text-[#0369a1] border border-[#7dd3fc] hover:bg-[#bae6fd]"
              }`}
            >
              <User className="w-3 h-3" />
              Beneficiary Only ({beneficiaryFieldCount})
            </button>
          )}

          {unansweredFieldCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterMode("unanswered")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterMode === "unanswered"
                  ? "bg-amber-500 text-white"
                  : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Not Provided ({unansweredFieldCount})
            </button>
          )}

          {unverifiedFieldCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterMode("unverified")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterMode === "unverified"
                  ? "bg-slate-700 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Pending ({unverifiedFieldCount})
            </button>
          )}
        </div>
      </div>

      {/* Section Cards */}
      <div className="space-y-6">
        {sectionFieldMap.map(({ section, reviewItems, allFields, sectionIdx }) => {
          const stepNum = sectionIdx + 1;
          const total = allFields.length;
          const answeredFields = allFields.filter((f) => isFieldAnswered(f, formData)).length;
          const unanswered = total - answeredFields;
          const verifiedCount = allFields.filter((f) => verifiedFields.has(f.key)).length;
          const isSectionComplete = total > 0 && verifiedCount === total;
          const isCollapsed = collapsedSections.has(sectionIdx);

          const filteredReviewItems = reviewItems.filter((item) => {
            if (filterMode === "all") return true;
            const checkField = (f: Field) => {
              const isCandidate = getFieldCandidateScope(formCode, f, section.title) === "candidate_distinct";
              const isAnswered = isFieldAnswered(f, formData);
              const isVerified = verifiedFields.has(f.key);
              if (filterMode === "beneficiary") return isCandidate;
              if (filterMode === "unanswered") return !isAnswered;
              if (filterMode === "unverified") return !isVerified;
              return true;
            };
            if (item.type === "group") return item.fields.some(checkField);
            return checkField(item.field);
          });

          if (filterMode !== "all" && filteredReviewItems.length === 0) return null;

          return (
            <div
              key={`sec-${sectionIdx}`}
              className="rounded-2xl border bg-white overflow-hidden shadow-sm transition-all"
              style={{ borderColor: isSectionComplete ? "#a3e4c8" : "#e2e8f0" }}
            >
              {/* Section Header */}
              <div
                onClick={() => toggleSectionCollapse(sectionIdx)}
                className={`px-5 py-4 border-b flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  isSectionComplete
                    ? "bg-[#f0fbf6] border-[#a3e4c8]"
                    : "bg-slate-50/50 border-slate-100 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                      isSectionComplete ? "bg-[#0d7857] text-white" : "bg-[#0d7377] text-white"
                    }`}
                  >
                    {isSectionComplete ? "✓" : stepNum}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-bold text-slate-800 truncate">{section.title}</h2>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{verifiedCount} of {total} verified</span>
                      {unanswered > 0 && (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                          <AlertTriangle className="w-3 h-3" />
                          {unanswered} not provided
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEditStep(stepNum); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-[#0d7377] bg-white hover:bg-teal-50 border border-slate-200 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <div className="p-1 text-slate-400">
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Section Body */}
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-5 sm:p-6 space-y-5 bg-slate-50/20"
                  >
                    {/* Nested Groups */}
                    {filteredReviewItems
                      .filter((item): item is ReviewGroup => item.type === "group")
                      .map((item, itemIdx) => {
                        const isGroupExpanded = expandedGroups.has(item.key);
                        const groupFields = item.fields.filter((f) => {
                          if (filterMode === "all") return true;
                          const isCandidate = getFieldCandidateScope(formCode, f, section.title) === "candidate_distinct";
                          const isAnswered = isFieldAnswered(f, formData);
                          const isVerified = verifiedFields.has(f.key);
                          if (filterMode === "beneficiary") return isCandidate;
                          if (filterMode === "unanswered") return !isAnswered;
                          if (filterMode === "unverified") return !isVerified;
                          return true;
                        });
                        const groupVerifiedCount = groupFields.filter((f) => verifiedFields.has(f.key)).length;

                        return (
                          <div key={item.key || `grp-${itemIdx}`} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                            <div
                              onClick={() => toggleGroup(item.key)}
                              className="flex items-center justify-between px-4 py-3.5 cursor-pointer bg-slate-50 hover:bg-slate-100/70 transition-colors border-b border-slate-100"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-sm font-semibold text-slate-800">{item.label}</span>
                                <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                  {groupVerifiedCount}/{groupFields.length} verified
                                </span>
                              </div>
                              {isGroupExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>

                            <AnimatePresence initial={false}>
                              {isGroupExpanded && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: "auto" }}
                                  exit={{ height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {groupFields.map((f, fIdx) => {
                                      const val = getDisplayValue(f, formData);
                                      const hasVal = !!(val && val.trim() !== "");
                                      const isChecked = verifiedFields.has(f.key);
                                      const isCandidateField =
                                        !!activeCandidate &&
                                        getFieldCandidateScope(formCode, f, section.title) === "candidate_distinct";
                                      return (
                                        <FieldCard
                                          key={f.key || `gf-${fIdx}`}
                                          fieldKey={f.key}
                                          label={f.label}
                                          val={val}
                                          hasVal={hasVal}
                                          isChecked={isChecked}
                                          isCandidateField={isCandidateField}
                                          candidateName={candidateName}
                                          onToggle={() => toggleFieldVerified(f.key)}
                                          size="sm"
                                        />
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}

                    {/* Standalone Field Grid */}
                    {filteredReviewItems.filter((item): item is ReviewFieldItem => item.type === "field").length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredReviewItems
                          .filter((item): item is ReviewFieldItem => item.type === "field")
                          .map((item, itemIdx) => {
                            const field = item.field;
                            const val = getDisplayValue(field, formData);
                            const hasVal = !!(val && val.trim() !== "");
                            const isChecked = verifiedFields.has(field.key);
                            const isCandidateField =
                              !!activeCandidate &&
                              getFieldCandidateScope(formCode, field, section.title) === "candidate_distinct";
                            return (
                              <FieldCard
                                key={field.key || `f-${itemIdx}`}
                                fieldKey={field.key}
                                label={field.label}
                                val={val}
                                hasVal={hasVal}
                                isChecked={isChecked}
                                isCandidateField={isCandidateField}
                                candidateName={candidateName}
                                onToggle={() => toggleFieldVerified(field.key)}
                                size="md"
                              />
                            );
                          })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* All Confirmed Banner */}
      <AnimatePresence>
        {allConfirmed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl px-5 py-5 flex items-center gap-4 bg-[#f0fbf6] border border-[#a3e4c8] shadow-sm"
          >
            <ShieldCheck className="w-7 h-7 text-[#0d7857] shrink-0" strokeWidth={2.2} />
            <div>
              <p className="text-sm font-bold text-[#09573c]">Every Answer Audited &amp; Confirmed</p>
              <p className="text-xs text-[#0d7857] mt-0.5">
                Your form is 100% verified. You can now preview, download, or save your completed packet.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Bottom Action Bar */}
      <div
        className="sticky bottom-0 -mx-3 mt-8 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-md md:-mx-6 md:px-6 z-30"
        style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.05)" }}
      >
        {!allConfirmed && (
          <div className="mb-3 flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 max-w-5xl mx-auto">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-800">
              Verify remaining{" "}
              <span className="font-bold text-amber-900">{totalAnswerCount - verifiedAnswerCount}</span>{" "}
              answer{totalAnswerCount - verifiedAnswerCount !== 1 ? "s" : ""} to unlock export options.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
          <button
            onClick={onPreviewPDF}
            disabled={!allConfirmed || isPreviewing || isDownloading || isSavingToVault}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            style={{ background: allConfirmed ? "#334155" : "#94a3b8" }}
          >
            <Eye className="h-4 w-4 shrink-0" />
            {isFreePreview ? (
              <>
                {isPreviewing ? "Previewing..." : "Preview Page 1"}
                <span className="ml-1 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide text-white uppercase">Free</span>
              </>
            ) : isPreviewing ? (
              "Previewing..."
            ) : (
              "Preview PDF"
            )}
          </button>

          <button
            onClick={onDownloadPDF}
            disabled={!allConfirmed || isPreviewing || isDownloading || isSavingToVault}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            style={{ background: allConfirmed ? "#1e293b" : "#94a3b8" }}
          >
            <Download className="h-4 w-4 shrink-0" />
            {isFreePreview ? (
              <>
                {isDownloading ? "Downloading..." : "Download Page 1"}
                <span className="ml-1 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide text-white uppercase">Free</span>
              </>
            ) : isDownloading ? (
              "Download PDF"
            ) : (
              "Download PDF"
            )}
          </button>

          <button
            onClick={onBackToForm}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-800 transition-all hover:bg-slate-200 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back to Form
          </button>

          <button
            onClick={isFreePreview ? onUpgradeClick : onSaveToVault}
            disabled={(!allConfirmed && !isFreePreview) || (!isFreePreview && (isPreviewing || isDownloading || isSavingToVault))}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            style={{
              backgroundColor: allConfirmed || isFreePreview ? "#0d7377" : "#94a3b8",
              boxShadow: allConfirmed ? "0 4px 14px rgba(13,115,119,0.25)" : "none",
            }}
          >
            {isFreePreview ? <Lock className="h-4 w-4 shrink-0" /> : <Save className="h-4 w-4 shrink-0" />}
            {isFreePreview ? "Unlock Save to Vault" : isSavingToVault ? "Saving..." : "Save to Vault"}
          </button>
        </div>

        <div className="mt-3 flex items-center justify-center gap-1 text-center text-[10px] font-semibold text-slate-500">
          <Lock className="h-3 w-3 shrink-0 text-emerald-600" />
          <span>{t("documentVaultPage.components.uploadModal.securityNotice")}</span>
        </div>
      </div>
    </div>
  );
}

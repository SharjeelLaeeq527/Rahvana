"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Field } from "@/lib/formConfig/types";
import {
  CheckCircle,
  Edit3,
  ChevronDown,
  ChevronUp,
  Eye,
  Download,
  Save,
  ArrowLeft,
  FileCheck,
  Lock,
} from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

const isFieldAnswered = (field: Field, formData: Record<string, string>): boolean => {
  if (field.type === "checkbox" && field.options) {
    return field.options.some((opt) => formData[opt.pdfKey || opt.value] === "Yes");
  }
  const value = formData[field.key];
  return !!(value && value.trim() !== "");
};

const getDisplayValue = (field: Field, formData: Record<string, string>): string => {
  if (field.type === "checkbox" && field.options) {
    const selectedLabels = field.options
      .filter((opt) => formData[opt.pdfKey || opt.value] === "Yes")
      .map((opt) => opt.label);
    return selectedLabels.join(", ");
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
    if (field.condition && !field.condition(formData)) {
      return;
    }

    if (field.type === "hidden" && field.subQuestions && field.subQuestions.length > 0) {
      // Gather visible subQuestions
      const visibleSubQuestions: Field[] = [];
      const collectSubs = (subField: Field) => {
        if (subField.condition && !subField.condition(formData)) {
          return;
        }
        if (subField.type !== "hidden" || subField.label) {
          visibleSubQuestions.push(subField);
        }
        if (subField.subQuestions) {
          subField.subQuestions.forEach((subQ) => {
            collectSubs(subQ as unknown as Field);
          });
        }
      };

      field.subQuestions.forEach((subQ) => {
        collectSubs(subQ as unknown as Field);
      });

      if (visibleSubQuestions.length > 0) {
        items.push({
          type: "group",
          key: field.key,
          label: field.label,
          fields: visibleSubQuestions,
        });
      }
    } else if (field.type !== "hidden") {
      items.push({
        type: "field",
        key: field.key,
        label: field.label,
        field,
      });
    } else if (field.label) {
      items.push({
        type: "field",
        key: field.key,
        label: field.label,
        field,
      });
    }
  };

  fields.forEach(processField);
  return items;
};

interface ReviewPageProps {
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
}

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
}: ReviewPageProps) {
  const { t } = useLanguage();
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set([0]) // First section expanded by default
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const completedCount = sections.filter((section) => {
    const reviewItems = getReviewItems(section.fields, formData);
    const visibleFieldItems: Field[] = [];
    reviewItems.forEach((item) => {
      if (item.type === "group") {
        visibleFieldItems.push(...item.fields);
      } else {
        visibleFieldItems.push(item.field);
      }
    });
    return (
      visibleFieldItems.length > 0 && visibleFieldItems.some((f) => isFieldAnswered(f, formData))
    );
  }).length;

  const totalCount = sections.length;
  return (
    <div className="space-y-6">
      {/* Free Preview Banner */}
      {isFreePreview && (
        <div className="animate-in fade-in slide-in-from-top-4 flex flex-col justify-between gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-sm duration-300 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5">
            <div className="shrink-0 rounded-xl bg-amber-100/80 p-2.5 text-amber-700">
              <Lock size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Free Preview Mode (10 Questions Limit)
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-amber-800/85">
                You are currently in Free Preview mode. You can fill up to 10 questions and
                print/preview the <strong>first page</strong> of your completed PDF to test the
                tool.
              </p>
            </div>
          </div>
          <button
            onClick={onUpgradeClick}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-150 hover:from-amber-700 hover:to-amber-600 active:scale-[0.98]"
          >
            Unlock Full PDF
          </button>
        </div>
      )}

      {/* Header with Stats */}
      <div
        className="rounded-2xl border-2 p-6 md:p-8"
        style={{
          background: "linear-gradient(135deg, #0d7377 0%, #14a0a6 100%)",
          borderColor: "rgba(13, 115, 119, 0.2)",
          boxShadow: "0 8px 30px -8px rgba(13, 115, 119, 0.3)",
        }}
      >
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <FileCheck className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="mb-2 text-2xl font-bold text-white md:text-3xl">
                Review Your Information
              </h2>
              <p className="text-sm text-white/90 md:text-base">
                Everything looks good! Please review each section before finalizing.
              </p>
            </div>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="mb-1 text-3xl font-bold text-white">{completedCount}</div>
            <div className="text-sm text-white/80">Sections Completed</div>
          </div>
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="mb-1 text-3xl font-bold text-white">{totalCount}</div>
            <div className="text-sm text-white/80">Total Sections</div>
          </div>
          <div className="col-span-2 rounded-xl bg-white/10 p-4 backdrop-blur-sm md:col-span-1">
            <div className="mb-1 text-3xl font-bold text-white">
              {Math.round((completedCount / totalCount) * 100)}%
            </div>
            <div className="text-sm text-white/80">Completion Rate</div>
          </div>
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-3">
        {sections.map((section, idx) => {
          const stepNum = idx + 1;
          const reviewItems = getReviewItems(section.fields, formData);
          const visibleFieldItems: Field[] = [];
          reviewItems.forEach((item) => {
            if (item.type === "group") {
              visibleFieldItems.push(...item.fields);
            } else {
              visibleFieldItems.push(item.field);
            }
          });
          const totalFields = visibleFieldItems.length;
          const answeredFields = visibleFieldItems.filter((f) =>
            isFieldAnswered(f, formData)
          ).length;
          const hasData = answeredFields > 0;
          const isExpanded = expandedSections.has(idx);

          return (
            <motion.div
              key={`${section.title}-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="overflow-hidden rounded-xl border-2 transition-all hover:shadow-lg"
              style={{
                borderColor: isExpanded ? "rgba(13, 115, 119, 0.3)" : "rgba(0, 0, 0, 0.08)",
                backgroundColor: isExpanded ? "#ffffff" : "#fafafa",
              }}
            >
              {/* Section Header */}
              <div
                className="flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors hover:bg-[#e8f6f6]/50 md:px-6"
                onClick={() => toggleSection(idx)}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: hasData
                      ? "linear-gradient(135deg, #0d7377 0%, #14a0a6 100%)"
                      : "#e8f6f6",
                    color: hasData ? "#fff" : "#0a5a5d",
                  }}
                >
                  {hasData ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-bold">{stepNum}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-bold text-gray-900 md:text-lg">
                    Step {stepNum}: {section.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-600 md:text-sm">
                    {answeredFields} of {totalFields} fields completed
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditStep(stepNum);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-[#0d7377] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#0a5a5d]"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </button>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Section Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-100 px-5 pb-5 md:px-6">
                      <div className="space-y-3 pt-4">
                        {reviewItems.map((item, itemIdx) => {
                          if (item.type === "group") {
                            const isGroupExpanded = expandedGroups.has(item.key);
                            const groupAnsweredCount = item.fields.filter((f) =>
                              isFieldAnswered(f, formData)
                            ).length;
                            const groupTotalCount = item.fields.length;

                            return (
                              <div
                                key={item.key || `group-${itemIdx}`}
                                className="my-2 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm"
                              >
                                {/* Group Header */}
                                <div
                                  onClick={() => toggleGroup(item.key)}
                                  className="flex cursor-pointer items-center justify-between bg-[#e8f6f6]/30 px-4 py-3 transition-colors hover:bg-[#e8f6f6]/60"
                                >
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-[#0d7377]">
                                      {item.label}
                                    </span>
                                    <span className="mt-0.5 text-[11px] font-medium text-gray-500">
                                      {groupAnsweredCount} of {groupTotalCount} fields completed
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-gray-400">
                                    {isGroupExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </div>
                                </div>

                                {/* Group Content */}
                                <AnimatePresence>
                                  {isGroupExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden bg-[#fafdfc]"
                                    >
                                      <div className="space-y-3 border-t border-gray-100/50 px-4 py-3">
                                        {item.fields.map((field, fieldIdx) => {
                                          const value = getDisplayValue(field, formData);
                                          const hasValue = value && value !== "";

                                          return (
                                            <div
                                              key={field.key || `subfield-${fieldIdx}`}
                                              className="flex flex-col gap-2 border-b border-gray-50 pb-2.5 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
                                            >
                                              <span className="text-gray-650 flex-1 pl-2 text-sm font-semibold">
                                                {field.label}
                                              </span>
                                              <span
                                                className="max-w-xs rounded-md px-2.5 py-1 text-right text-sm font-medium text-gray-900"
                                                style={{
                                                  backgroundColor: hasValue ? "#e8f6f6" : "#f5f5f5",
                                                  color: hasValue ? "#0a5a5d" : "#9ca3af",
                                                }}
                                              >
                                                {hasValue ? (
                                                  value
                                                ) : (
                                                  <span className="italic">Not provided</span>
                                                )}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          }

                          const field = item.field;
                          const value = getDisplayValue(field, formData);
                          const hasValue = value && value !== "";

                          return (
                            <div
                              key={field.key || `field-${itemIdx}`}
                              className="flex flex-col gap-2 border-b border-gray-50 pb-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between"
                            >
                              <span className="flex-1 text-sm font-semibold text-gray-700">
                                {field.label}
                              </span>
                              <span
                                className="max-w-xs rounded-lg px-3 py-1.5 text-right text-sm font-medium text-gray-900"
                                style={{
                                  backgroundColor: hasValue ? "#e8f6f6" : "#f5f5f5",
                                  color: hasValue ? "#0a5a5d" : "#9ca3af",
                                }}
                              >
                                {hasValue ? value : <span className="italic">Not provided</span>}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Action Buttons - Sticky Footer */}
      <div
        className="sticky bottom-0 -mx-4 mt-8 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur-sm md:-mx-8 md:px-8"
        style={{
          boxShadow: "0 -4px 20px rgba(0,0,0,0.05)",
        }}
      >
        {/* 2 × 2 Button Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Preview */}
          <button
            onClick={onPreviewPDF}
            disabled={isPreviewing || isDownloading || isSavingToVault}
            className="flex items-center justify-center gap-2 rounded-xl bg-gray-700 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Eye className="h-4 w-4 shrink-0" />

            {isFreePreview ? (
              <>
                {isPreviewing ? "Previewing..." : "Preview Page 1"}
                <span className="ml-1 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide text-white uppercase">
                  Free
                </span>
              </>
            ) : isPreviewing ? (
              "Previewing..."
            ) : (
              "Preview PDF"
            )}
          </button>

          {/* Download */}
          <button
            onClick={onDownloadPDF}
            disabled={isPreviewing || isDownloading || isSavingToVault}
            className="flex items-center justify-center gap-2 rounded-xl bg-gray-700 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4 shrink-0" />

            {isFreePreview ? (
              <>
                {isDownloading ? "Downloading..." : "Download Page 1"}
                <span className="ml-1 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide text-white uppercase">
                  Free
                </span>
              </>
            ) : isDownloading ? (
              "Downloading..."
            ) : (
              "Download PDF"
            )}
          </button>

          {/* Back */}
          <button
            onClick={onBackToForm}
            className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-800 transition-all hover:bg-gray-200"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back to Form
          </button>

          {/* Save */}
          <button
            onClick={isFreePreview ? onUpgradeClick : onSaveToVault}
            disabled={!isFreePreview && (isPreviewing || isDownloading || isSavingToVault)}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0d7377] to-[#14a0a6] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0d7377]/20 transition-all hover:from-[#0a5a5d] hover:to-[#0d7377] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isFreePreview ? (
              <Lock className="h-4 w-4 shrink-0" />
            ) : (
              <Save className="h-4 w-4 shrink-0" />
            )}

            {isFreePreview
              ? "Unlock Save to Vault"
              : isSavingToVault
                ? "Saving..."
                : "Save to Vault"}
          </button>
        </div>

        {/* Security Note */}
        <div className="mt-4 flex items-center justify-center gap-1 text-center text-[10px] font-semibold text-slate-500">
          <Lock className="h-3 w-3 shrink-0 text-emerald-600" />
          <span>{t("documentVaultPage.components.uploadModal.securityNotice")}</span>
        </div>
      </div>
    </div>
  );
}

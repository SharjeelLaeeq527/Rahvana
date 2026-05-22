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
}: ReviewPageProps) {
  const { t } = useLanguage();
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set([0]) // First section expanded by default
  );

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const completedCount = sections.filter((section) =>
    section.fields.some((f) => formData[f.key])
  ).length;

  const totalCount = sections.length;
  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div
        className="rounded-2xl p-6 md:p-8 border-2"
        style={{
          background: "linear-gradient(135deg, #0d7377 0%, #14a0a6 100%)",
          borderColor: "rgba(13, 115, 119, 0.2)",
          boxShadow: "0 8px 30px -8px rgba(13, 115, 119, 0.3)",
        }}
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm">
              <FileCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Review Your Information
              </h2>
              <p className="text-sm md:text-base text-white/90">
                Everything looks good! Please review each section before
                finalizing.
              </p>
            </div>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-3xl font-bold text-white mb-1">
              {completedCount}
            </div>
            <div className="text-sm text-white/80">Sections Completed</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-3xl font-bold text-white mb-1">
              {totalCount}
            </div>
            <div className="text-sm text-white/80">Total Sections</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 col-span-2 md:col-span-1">
            <div className="text-3xl font-bold text-white mb-1">
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
          const hasData = section.fields.some((f) => formData[f.key]);
          const isExpanded = expandedSections.has(idx);
          const answeredFields = section.fields.filter(
            (f) => formData[f.key]
          ).length;
          const totalFields = section.fields.length;

          return (
            <motion.div
              key={`${section.title}-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="border-2 rounded-xl overflow-hidden transition-all hover:shadow-lg"
              style={{
                borderColor: isExpanded
                  ? "rgba(13, 115, 119, 0.3)"
                  : "rgba(0, 0, 0, 0.08)",
                backgroundColor: isExpanded ? "#ffffff" : "#fafafa",
              }}
            >
              {/* Section Header */}
              <div
                className="px-5 md:px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-[#e8f6f6]/50 transition-colors"
                onClick={() => toggleSection(idx)}
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
                  style={{
                    background: hasData
                      ? "linear-gradient(135deg, #0d7377 0%, #14a0a6 100%)"
                      : "#e8f6f6",
                    color: hasData ? "#fff" : "#0a5a5d",
                  }}
                >
                  {hasData ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-bold">{stepNum}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-lg font-bold text-gray-900 truncate">
                    Step {stepNum}: {section.title}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                    {answeredFields} of {totalFields} fields completed
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditStep(stepNum);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0d7377] hover:bg-[#0a5a5d] text-white font-semibold rounded-lg transition-all text-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
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
                    <div className="px-5 md:px-6 pb-5 border-t border-gray-100">
                      <div className="pt-4 space-y-3">
                        {section.fields.map((field, fieldIdx) => {
                          const value = formData[field.key];
                          const hasValue = value && value !== "";

                          return (
                            <div
                              key={field.key || `field-${fieldIdx}`}
                              className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 pb-3 border-b border-gray-50 last:border-b-0"
                            >
                              <span className="font-semibold text-gray-700 text-sm flex-1">
                                {field.label}
                              </span>
                              <span
                                className="text-gray-900 text-sm text-right max-w-xs font-medium px-3 py-1.5 rounded-lg"
                                style={{
                                  backgroundColor: hasValue
                                    ? "#e8f6f6"
                                    : "#f5f5f5",
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
        className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 -mx-4 md:-mx-8 px-4 md:px-8 py-4 mt-8"
        style={{
          boxShadow: "0 -4px 20px rgba(0,0,0,0.05)",
        }}
      >
        <div className="flex flex-col md:flex-row items-start gap-3 max-w-7xl mx-auto">
          <button
            onClick={onBackToForm}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-all text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Form
          </button>

          <div className="flex-1 flex flex-wrap items-start gap-3">
            <button
              onClick={onPreviewPDF}
              disabled={isPreviewing || isDownloading || isSavingToVault}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm"
            >
              <Eye className="w-4 h-4" />
              {isPreviewing ? "Previewing..." : "Preview PDF"}
            </button>

            <button
              onClick={onDownloadPDF}
              disabled={isPreviewing || isDownloading || isSavingToVault}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? "Downloading..." : "Download PDF"}
            </button>

            <div className="flex-[1.5] flex flex-col gap-1.5 min-w-[150px]">
              <button
                onClick={onSaveToVault}
                disabled={isPreviewing || isDownloading || isSavingToVault}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0d7377] to-[#14a0a6] hover:from-[#0a5a5d] hover:to-[#0d7377] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#0d7377]/20 text-sm"
              >
                <Save className="w-4 h-4" />
                {isSavingToVault ? "Saving..." : "Save to Vault"}
              </button>
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-semibold leading-none py-0.5">
                <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>{t("documentVaultPage.components.uploadModal.securityNotice")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

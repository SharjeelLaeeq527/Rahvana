"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Clock,
  Shield,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GroupedDocuments, DocumentChecklistItem } from "@/lib/journey/document-checklist/types";
import { getStepIcon } from "../StepIcon";

interface DocumentChecklistToolProps {
  journeyId: string;
  journeyType: string;
}

export function DocumentChecklistTool({ journeyId, journeyType }: DocumentChecklistToolProps) {
  const [documents, setDocuments] = useState<GroupedDocuments | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDocuments();
  }, [journeyId]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/journeys/${journeyId}/document-checklist`);
      const result = await response.json();

      if (result.success) {
        setDocuments(result.data);

        // Load saved checked items from database
        const savedCheckedItems = result.checkedItems || [];

        // Combine uploaded docs (auto-checked) with manually checked items
        const uploadedKeys = result.data.already_uploaded
          .filter((doc: DocumentChecklistItem) => doc.is_uploaded)
          .map((doc: DocumentChecklistItem) => doc.document_key);

        const allCheckedKeys = new Set<string>([...uploadedKeys, ...savedCheckedItems]);
        setCheckedItems(allCheckedKeys);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCheckedItems = async (checkedKeys: string[]) => {
    try {
      await fetch(`/api/journeys/${journeyId}/document-checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkedItems: checkedKeys }),
      });
    } catch (error) {
      console.error("Error saving checked items:", error);
    }
  };

  const toggleExpand = (documentKey: string) => {
    setExpandedItems((prev) => {
      const next = new Set<string>(prev);
      if (next.has(documentKey)) {
        next.delete(documentKey);
      } else {
        next.add(documentKey);
      }
      return next;
    });
  };

  const handleCheckToggle = (documentKey: string) => {
    setCheckedItems((prev) => {
      const newSet = new Set<string>(prev);
      if (newSet.has(documentKey)) {
        newSet.delete(documentKey);
      } else {
        newSet.add(documentKey);
      }

      // Save to database
      const checkedArray = Array.from(newSet);
      saveCheckedItems(checkedArray);

      return newSet;
    });
  };

  const renderDocumentItem = (item: DocumentChecklistItem, isDisabled: boolean = false) => {
    const isChecked = checkedItems.has(item.document_key);
    const isExpanded = expandedItems.has(item.document_key);
    const hasNotes = !!item.notes;

    const getBorderColor = () => {
      if (isChecked) return "border-[#a8d9be]";
      if (item.expiration_status === "expired") return "border-red-300";
      if (item.expiration_status === "expiring_soon") return "border-[#f0d98a]";
      return "border-[#d0e4f7]";
    };

    const getBgColor = () => {
      if (isChecked) return "bg-[#e8f5ef]";
      if (item.expiration_status === "expired") return "bg-red-50";
      if (item.expiration_status === "expiring_soon") return "bg-[#fef8e8]";
      return "bg-white";
    };

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`overflow-hidden rounded-[14px] border-[1.5px] transition-all sm:rounded-[16px] ${getBorderColor()} ${getBgColor()} ${
          !isDisabled && "hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)]"
        }`}
      >
        {/* Main Content */}
        <div className="flex items-start gap-[12px] p-[14px] sm:gap-[16px] sm:p-[18px_20px]">
          {/* Checkbox */}
          <Checkbox
            id={item.document_key}
            checked={isChecked}
            disabled={isDisabled}
            onCheckedChange={() => handleCheckToggle(item.document_key)}
            className="mt-1 shrink-0"
          />

          {/* Icon */}
          <div
            className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] border transition-colors sm:h-[40px] sm:w-[40px] ${
              isChecked ? "border-[#a8d9be] bg-[#e8f5ef]" : "border-[#d0e4f7] bg-[#e8f1fb]"
            }`}
          >
            <div className="text-primary/70 text-[16px] sm:text-[17px]">
              {getStepIcon(item.icon || "file-text")}
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="mb-[6px] flex items-start justify-between gap-3">
              <label
                htmlFor={item.document_key}
                className="cursor-pointer text-[14px] leading-[1.3] font-semibold break-words text-[#0c1b33] sm:text-[15px]"
              >
                {item.title}
                {item.is_required && <span className="ml-1 text-red-500">*</span>}
              </label>

              {/* Expand button for items with notes */}
              {hasNotes && (
                <button
                  type="button"
                  onClick={() => toggleExpand(item.document_key)}
                  aria-label={
                    isExpanded ? "Hide important information" : "Show important information"
                  }
                  aria-expanded={isExpanded}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border transition-all duration-200 ${
                    isExpanded
                      ? "bg-primary/10 border-primary/25 text-primary"
                      : "hover:text-primary border-[#d0e4f7] bg-[#eef4fb] text-[#4d6680] hover:border-[#b9cee3] hover:bg-[#e3edf8]"
                  } `}
                >
                  {isExpanded ? (
                    <ChevronUp size={16} strokeWidth={2.2} />
                  ) : (
                    <ChevronDown size={16} strokeWidth={2.2} />
                  )}
                </button>
              )}
            </div>

            {/* Subtitle */}
            {item.subtitle && (
              <p className="mb-[8px] text-[12px] leading-[1.4] break-words text-[#6b8097] sm:text-[13px]">
                {item.subtitle}
              </p>
            )}

            {/* Tags & Status Row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Tags */}
              <div className="flex flex-wrap gap-[6px]">
                {item.tags?.map((tag, idx) => {
                  let cls = "bg-[#f4f7fb] text-[#6b8097] border-[#d0e4f7]";
                  if (tag === "pet") {
                    cls = "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]";
                  } else if (tag === "bene") {
                    cls = "bg-[#e8f5ef] text-[#15744f] border-[#a8d9be]";
                  } else if (tag === "both") {
                    cls = "bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]";
                  } else if (tag === "govt") {
                    cls = "bg-[#fff7ed] text-[#b45309] border-[#fed7aa]";
                  } else if (tag === "3p") {
                    cls = "bg-[#eef3fa] text-[#3a4f63] border-[#d0e4f7]";
                  } else if (tag === "medical") {
                    cls = "bg-[#f0f9ff] text-[#0369a1] border-[#bae6fd]";
                  }
                  return (
                    <span
                      key={idx}
                      className={`rounded-full border px-[8px] py-[2px] text-[10px] font-semibold tracking-[0.04em] sm:text-[11px] ${cls}`}
                    >
                      {tag === "pet"
                        ? "Petitioner"
                        : tag === "bene"
                          ? "Beneficiary"
                          : tag === "both"
                            ? "Both"
                            : tag === "govt"
                              ? "Govt"
                              : tag === "3p"
                                ? "Third Party"
                                : tag === "medical"
                                  ? "Medical"
                                  : tag}
                    </span>
                  );
                })}
              </div>

              {/* Expiration Status */}
              {item.is_expirable && item.expiry_date && (
                <div className="flex shrink-0 items-center gap-2">
                  {item.expiration_status === "expired" && (
                    <Badge
                      variant="destructive"
                      className="flex items-center gap-1.5 px-[9px] py-[3px] text-[11px] font-semibold shadow-sm"
                    >
                      <AlertTriangle size={12} />
                      Expired
                    </Badge>
                  )}
                  {item.expiration_status === "expiring_soon" &&
                    item.days_until_expiry !== undefined && (
                      <Badge className="flex items-center gap-1.5 border-[#f0d98a] bg-[#fef8e8] px-[9px] py-[3px] text-[11px] font-semibold text-[#8a6200] shadow-sm hover:bg-[#fef8e8]">
                        <Clock size={12} />
                        {item.days_until_expiry}d left
                      </Badge>
                    )}
                  {item.expiration_status === "valid" && (
                    <Badge className="flex items-center gap-1.5 border-[#a8d9be] bg-[#e8f5ef] px-[9px] py-[3px] text-[11px] font-semibold text-[#15744f] shadow-sm hover:bg-[#e8f5ef]">
                      <CheckCircle2 size={12} />
                      Valid
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Notes Section */}
        <AnimatePresence initial={false}>
          {isExpanded && hasNotes && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.2 },
              }}
              className="overflow-hidden"
            >
              <div className="px-[14px] pt-0 pb-[14px] sm:px-[20px] sm:pb-[18px]">
                <div className="overflow-hidden rounded-[12px] border border-[#dbe7f3] bg-[#f8fbfe]">
                  <div className="p-[13px] sm:p-[15px]">
                    {/* Header */}
                    <div className="mb-[8px] flex items-center gap-[9px]">
                      <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[7px] border border-[#cfe0f0] bg-white shadow-sm">
                        <Info size={14} strokeWidth={2.2} className="text-primary" />
                      </div>

                      <div className="flex min-w-0 items-center gap-[7px]">
                        <span className="text-[11px] font-bold tracking-[0.07em] text-[#0c1b33] uppercase">
                          Guidance
                        </span>

                        <span className="hidden h-[3px] w-[3px] rounded-full bg-[#a8b8c8] sm:block" />

                        <span className="hidden text-[10px] font-medium text-[#7b8da1] sm:block">
                          Important to know
                        </span>
                      </div>
                    </div>

                    {/* Note */}
                    <p className="text-[12px] leading-[1.65] text-[#526579] sm:text-[13px] sm:leading-[1.7]">
                      {item.notes}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-b-2" />
      </div>
    );
  }

  if (!documents) {
    return (
      <Alert>
        <AlertDescription>Unable to load documents</AlertDescription>
      </Alert>
    );
  }

  const totalDocs =
    documents.already_uploaded.length +
    documents.expirable.length +
    documents.post_interview.length;
  const checkedCount = checkedItems.size;
  const progress = totalDocs > 0 ? Math.round((checkedCount / totalDocs) * 100) : 0;

  return (
    <div className="flex flex-col">
      {/* Progress Bar */}
      <div className="mb-[24px] flex items-center gap-[10px] sm:mb-[32px] sm:gap-[12px]">
        <div className="h-[5px] flex-1 overflow-hidden rounded-[10px] bg-[#d0e4f7]">
          <div
            className="from-primary to-primary/70 h-full rounded-[10px] bg-linear-to-r transition-all duration-500 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="shrink-0 text-[11px] font-medium whitespace-nowrap text-[#6b8097] sm:text-[12px]">
          {checkedCount} of {totalDocs} checked
        </div>
      </div>

      {/* Document Groups */}
      <div className="flex flex-col gap-[28px] sm:gap-[32px]">
        {/* Already Uploaded */}
        {documents.already_uploaded.length > 0 && (
          <div className="flex flex-col">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex shrink-0 items-center gap-2.5">
                <CheckCircle2 size={18} className="text-[#15744f]" strokeWidth={2} />

                <span className="text-[11px] font-semibold tracking-[0.08em] text-[#6b8097] uppercase">
                  Already Uploaded / Unexpired
                </span>
              </div>

              <div className="h-px flex-1 bg-[#d0e4f7]" />

              <span className="rounded-full border border-[#a8d9be] bg-[#e8f5ef] px-2.5 py-1 text-[9px] font-semibold tracking-[0.05em] whitespace-nowrap text-[#15744f] uppercase sm:text-[10px]">
                Complete
              </span>
            </div>
            <div className="flex flex-col gap-[10px]">
              {documents.already_uploaded.map((item) => renderDocumentItem(item, true))}
            </div>
          </div>
        )}

        {/* Expirable Documents */}
        {documents.expirable.length > 0 && (
          <div className="flex flex-col">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex shrink-0 items-center gap-2.5">
                <Shield size={18} className="text-[#b45309]" strokeWidth={2} />

                <span className="text-[11px] font-semibold tracking-[0.08em] text-[#6b8097] uppercase">
                  Can Expire / Become Outdated
                </span>
              </div>

              <div className="h-px flex-1 bg-[#d0e4f7]" />

              <span className="rounded-full border border-[#fed7aa] bg-[#fff7ed] px-2.5 py-1 text-[9px] font-semibold tracking-[0.05em] whitespace-nowrap text-[#b45309] uppercase sm:text-[10px]">
                Check Dates
              </span>
            </div>
            <div className="flex flex-col gap-[10px]">
              {documents.expirable.map((item) => renderDocumentItem(item, false))}
            </div>
          </div>
        )}

        {/* Post-Interview Documents */}
        {documents.post_interview.length > 0 && (
          <div className="flex flex-col">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex shrink-0 items-center gap-2.5">
                <FileCheck size={18} className="text-[#2d4a6e]" strokeWidth={2} />

                <span className="text-[11px] font-semibold tracking-[0.08em] text-[#6b8097] uppercase">
                  Required After Interview Appointment
                </span>
              </div>

              <div className="h-px flex-1 bg-[#d0e4f7]" />

              <span className="rounded-full border border-[#d0e4f7] bg-[#e8f1fb] px-2.5 py-1 text-[9px] font-semibold tracking-[0.05em] whitespace-nowrap text-[#2d4a6e] uppercase sm:text-[10px]">
                After Appt
              </span>
            </div>
            <div className="flex flex-col gap-[10px]">
              {documents.post_interview.map((item) => renderDocumentItem(item, false))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

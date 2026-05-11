"use client";

import React from "react";
import { Eye, MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getStepIcon } from "../StepIcon";

interface UploadedDoc {
  id: string;
  documentDefId: string;
  [key: string]: any;
}

interface DocItem {
  id: string;
  icon?: string;
  title: string;
  sub?: string;
  tags?: string[];
  [key: string]: any;
}

interface DocGroup {
  id: string;
  label: string;
  badge: string;
  items: DocItem[];
}

interface DocListSectionProps {
  groups: DocGroup[];
  docsStatus: Record<string, string>;
  uploadedDocuments: UploadedDoc[];
  isDeletingIds: string[];
  isReloadingDocs: boolean;
  getVaultId: (item: DocItem) => string;
  onItemClick: (item: DocItem) => void;
  onPreview: (uploadedDocId: string) => void;
  onDelete: (id: string, name: string) => void;
  progressLabel?: string;
  showTags?: boolean;
}

const TAG_MAP: Record<string, { label: string; cls: string }> = {
  bene: {
    label: "Beneficiary",
    cls: "bg-[#e8f5ef] text-[#15744f] border-[#a8d9be]",
  },
  pet: {
    label: "Petitioner",
    cls: "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]",
  },
  both: { label: "Both", cls: "bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]" },
  govt: {
    label: "Govt Record",
    cls: "bg-[#fff7ed] text-[#b45309] border-[#fed7aa]",
  },
  "3p": {
    label: "Third Party",
    cls: "bg-[#eef3fa] text-[#3a4f63] border-[#d0e4f7]",
  },
};

export function DocListSection({
  groups,
  docsStatus,
  uploadedDocuments,
  isDeletingIds,
  isReloadingDocs,
  getVaultId,
  onItemClick,
  onPreview,
  onDelete,
  progressLabel = "reviewed",
  showTags = false,
}: DocListSectionProps) {
  const totalItems = groups.reduce((acc, g) => acc + g.items.length, 0);
  const reviewedCount = Object.values(docsStatus).filter(
    (s) => s === "reviewed",
  ).length;

  return (
    <div className="flex flex-col">
      {/* Progress bar */}
      <div className="flex items-center gap-[12px] mb-[24px]">
        <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-primary to-primary/70 rounded-[10px] transition-all duration-500"
            style={{
              width:
                totalItems > 0
                  ? `${Math.round((reviewedCount / totalItems) * 100)}%`
                  : "0%",
            }}
          />
        </div>
        <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
          {reviewedCount} of {totalItems} {progressLabel}
        </div>
      </div>

      {/* Groups */}
      <div className="flex flex-col gap-[32px]">
        {groups.map((group) => (
          <div key={group.id} className="flex flex-col">
            {/* Group header */}
            <div className="flex items-center gap-[10px] mb-[14px]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#6b8097]">
                {group.label}
              </span>
              <span
                className={`text-[10px] font-semibold px-[9px] py-[3px] rounded-full uppercase tracking-[0.06em] border ${
                  group.badge === "req" || group.badge === "Required"
                    ? "bg-[#ffeaea] text-[#a01c1c] border-[#f5bebe]"
                    : group.badge === "cond" ||
                        group.badge === "Required if applicable"
                      ? "bg-[#fef8e8] text-[#8a6200] border-[#f0d98a]"
                      : "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]"
                }`}
              >
                {group.badge === "req"
                  ? "Required"
                  : group.badge === "cond"
                    ? "Required if Applicable"
                    : group.badge}
              </span>
              <div className="flex-1 h-px bg-[#d0e4f7]" />
            </div>

            {/* Items */}
            <div className="flex flex-col gap-[10px]">
              {group.items.map((item) => {
                const st = docsStatus[item.id] || "not-started";
                const vaultId = getVaultId(item);
                const uploadedDoc = uploadedDocuments.find(
                  (ud) => ud.documentDefId === vaultId,
                );
                const isUploadedInVault = !!uploadedDoc;
                const isDeleting = uploadedDoc
                  ? isDeletingIds.includes(uploadedDoc.id)
                  : false;

                const displayStatus = isUploadedInVault
                  ? "Uploaded"
                  : isReloadingDocs
                    ? "Checking..."
                    : st === "reviewed"
                      ? "✓ Reviewed"
                      : st === "in-progress"
                        ? "In progress"
                        : "Open guide";

                const statusClasses = isUploadedInVault
                  ? "bg-[#eaf7f2] text-[#1a7a5e] border-[#b5e0d0] font-bold shadow-sm"
                  : isReloadingDocs
                    ? "bg-muted/30 text-muted-foreground border-muted-foreground/20 animate-pulse"
                    : st === "reviewed"
                      ? "bg-[#e8f5ef] text-[#15744f] border-[#a8d9be]"
                      : st === "in-progress"
                        ? "bg-[#fef8e8] text-[#8a6200] border-[#f0d98a]"
                        : "bg-white text-[#6b8097] border-[#d0e4f7] hover:border-primary hover:text-primary";

                const rowClasses = `bg-white border-[1.5px] rounded-[16px] p-[18px_20px] flex items-center gap-[16px] cursor-pointer transition-all hover:border-primary hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)] hover:-translate-y-px active:translate-y-0 text-left w-full ${
                  st === "reviewed"
                    ? "border-[#a8d9be] bg-[#e8f5ef]"
                    : st === "in-progress"
                      ? "border-[#f0d98a] bg-[#fef8e8]"
                      : "border-[#d0e4f7]"
                }`;

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onItemClick(item)}
                    className={rowClasses}
                  >
                    {/* Icon */}
                    <div
                      className={`w-[40px] h-[40px] rounded-[10px] border flex items-center justify-center shrink-0 text-[17px] transition-colors ${
                        st === "reviewed"
                          ? "bg-[#e8f5ef] border-[#a8d9be]"
                          : "bg-[#e8f1fb] border-[#d0e4f7]"
                      }`}
                    >
                      <div className="text-primary/70">
                        {getStepIcon(item.icon || "")}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold text-[#0c1b33] mb-[4px] leading-[1.3]">
                        {item.title}
                      </div>
                      {item.sub && (
                        <div className="text-[13px] text-[#6b8097] leading-[1.4]">
                          {item.sub}
                        </div>
                      )}
                      {showTags && item.tags && item.tags.length > 0 && (
                        <div className="flex gap-[6px] mt-[7px] flex-wrap">
                          {item.tags.map((t: string) => {
                            const tag = TAG_MAP[t];
                            if (!tag) return null;
                            return (
                              <span
                                key={t}
                                className={`text-[11px] font-semibold px-[9px] py-[3px] rounded-full border tracking-[0.04em] ${tag.cls}`}
                              >
                                {tag.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right: status badge + dropdown */}
                    <div className="shrink-0 flex items-center gap-2">
                      {isReloadingDocs && !uploadedDoc ? (
                        <div className="flex items-center gap-1.5 px-[11px] py-[5px] text-[12px] text-muted-foreground font-medium animate-pulse">
                          <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
                          Checking...
                        </div>
                      ) : isDeleting ? (
                        <div className="flex items-center gap-1.5 px-[11px] py-[5px] text-[12px] text-red-500 font-medium animate-pulse">
                          <div className="h-3 w-3 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
                          Deleting...
                        </div>
                      ) : (
                        <div
                          className={`px-[11px] py-[5px] rounded-full border text-[12px] font-medium tracking-normal transition-all ${statusClasses}`}
                        >
                          {displayStatus}
                        </div>
                      )}

                      {uploadedDoc && !isDeleting && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-muted-foreground/20"
                            >
                              <MoreVertical size={18} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            side="top"
                            align="end"
                            className="w-[140px] rounded-xl shadow-xl border-muted/20"
                          >
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onPreview(uploadedDoc.id);
                              }}
                              className="flex items-center gap-2 cursor-pointer font-medium text-[13px] py-2.5"
                            >
                              <Eye size={16} className="text-primary" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(uploadedDoc.id, item.title);
                              }}
                              className="flex items-center gap-2 cursor-pointer font-medium text-[13px] py-2.5 text-red-600 focus:text-red-700 focus:bg-red-50"
                            >
                              <Trash2 size={16} />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

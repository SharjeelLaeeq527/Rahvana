"use client";

import React from "react";
import { ArrowRight, BookOpen, Users, Upload } from "lucide-react";
import { getStepIcon } from "../StepIcon";
import { mapDocumentNameToId } from "@/lib/document-vault/journey-mapping";
import { getHhDocItems } from "./HouseholdMemberTool";
import { DocListSection } from "./DocListSection";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";

interface HouseholdSponsorshipToolProps {
  // State
  hhCount: number;
  jsCount: number;
  hhRelationships: Record<number, string>;
  hhDocsStatus: Record<string, string>;

  // Setters
  setHhCount: (val: number) => void;
  setJsCount: (val: number) => void;
  setHhRelationships: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  setHhDocsStatus: (val: Record<string, string>) => void;

  // Actions
  updateMetadata: (data: any) => void;
  guard: () => boolean;

  // Tutorials
  setUseCeacGuideData: (val: boolean) => void;
  setTutorialIdx: (val: number) => void;
  setIsTutorialOpen: (val: boolean) => void;
  setTutorialPath: (val: "household_member" | "joint_sponsor" | null) => void;

  // Data
  currentStep: any;

  // Document handling
  openUploadModal: (defId: string) => void;
  setActiveUploadId: (id: string | null) => void;
  setActiveUploadType: (type: "doc" | "hh" | "financial" | null) => void;
  setActiveHhDoc: (doc: any) => void;
  setIsHhDocGuideOpen: (open: boolean) => void;
  setDocActionModal: (data: any) => void;
  uploadedDocuments: any[];
  isReloadingDocs: boolean;
  isDeletingIds: string[];
  onPreview: (uploadedDocId: string) => void;
  onDelete: (id: string, name: string) => void;
}

export const HouseholdSponsorshipTool: React.FC<HouseholdSponsorshipToolProps> = ({
  hhCount,
  jsCount,
  hhRelationships,
  hhDocsStatus,
  setHhCount,
  setJsCount,
  setHhRelationships,
  setHhDocsStatus,
  updateMetadata,
  guard,
  setUseCeacGuideData,
  setTutorialIdx,
  setIsTutorialOpen,
  setTutorialPath,
  currentStep,
  openUploadModal,
  setActiveUploadId,
  setActiveUploadType,
  setActiveHhDoc,
  setIsHhDocGuideOpen,
  setDocActionModal,
  uploadedDocuments,
  isReloadingDocs,
  isDeletingIds,
  onPreview,
  onDelete,
}) => {
  const allItems = getHhDocItems(hhCount, hhRelationships);
  const total = allItems.length;
  const reviewed = allItems.filter((item) => hhDocsStatus[item.id] === "reviewed").length;
  const progressPct = total > 0 ? Math.round((reviewed / total) * 100) : 0;

  const pathCards = [
    {
      id: "household_member",
      title: "Household member",
      subtitle: "Someone in your household who can help with income.",
      iconBg: "bg-[#fff7ed] border-[#fed7aa]",
      iconColor: "text-[#b45309]",
    },
    {
      id: "joint_sponsor",
      title: "Joint sponsor",
      subtitle: "A separate sponsor who meets the income requirement.",
      iconBg: "bg-[#f3f0fb] border-[#c9bef2]",
      iconColor: "text-[#4a2d8a]",
    },
  ] as const;



  return (
    <div className="flex flex-col mt-4">
      <div className="flex gap-[7px] flex-wrap mb-7">
        <span className="text-[11px] font-semibold tracking-wider uppercase px-3 py-[2px] rounded-full bg-[#f3f0fb] text-[#4a2d8a] border border-[#c9bef2]">
          CEAC Portal
        </span>
        <span className="text-[11px] font-semibold tracking-wider uppercase px-3 py-[2px] rounded-full bg-[#fff7ed] text-[#b45309] border border-[#fed7aa]">
          Financial Sponsorship
        </span>
        <span className="text-[11px] font-semibold tracking-wider uppercase px-3 py-[2px] rounded-full bg-[#e8f5ef] text-[#15744f] border border-[#a8d9be]">
          Interactive Checklist
        </span>
      </div>

      {/* DISTINCTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-7">
        <div className="bg-[#e8f1fb] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-4.5">
          <div className="text-[10px] font-bold tracking-widest uppercase text-[#2d4a6e] mb-1.5">
            Joint Sponsor
          </div>
          <div className="text-[15px] font-semibold text-[#0c1b33] mb-1.5 leading-tight">
            Use this when a separate person helps with income.
          </div>
          <div className="text-[13px] text-[#3a4f63] leading-relaxed">
            A joint sponsor is a separate sponsor who helps meet the income requirement. In CEAC,
            they are added as their own sponsor and usually <b>do not need relationship proof </b>.
          </div>
        </div>
        <div className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[16px] p-4.5">
          <div className="text-[10px] font-bold tracking-widest uppercase text-[#15744f] mb-1.5">
            Household Member
          </div>
          <div className="text-[15px] font-semibold text-[#0e5c3c] mb-1.5 leading-tight">
            Use this when someone in your home helps with income.
          </div>
          <div className="text-[13px] text-[#3a4f63] leading-relaxed">
            A household member lives with you and helps with income. In CEAC, they are added on your
            form and <b> you will need to explain your relationship to that person </b>.
          </div>
        </div>
      </div>

      {/* PRIMARY LAUNCH MODULE */}
      <div className="bg-[var(--rv-ch2-module-bg)] rounded-[16px] border border-[var(--rv-ch2)]/30 shadow-[0_20px_60px_rgba(12,27,51,0.18)] overflow-hidden mb-6 relative">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-[var(--rv-ch2)] via-[var(--rv-ch2-feature-bg)] to-transparent opacity-70" />
        <div className="p-8 md:p-[32px_34px_28px]">
          <div className="flex items-start gap-4 mb-[22px]">
            <div className="w-[46px] h-[46px] rounded-[11px] bg-[var(--rv-ch2)] border border-[var(--rv-ch2)]/50 flex items-center justify-center shrink-0">
              <Users className="text-white" size={22} />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-widest uppercase text-[var(--rv-ch2-text)]/60 mb-1">
                CEAC Guidance
              </div>
              <div className="text-[clamp(19px,2.8vw,23px)] text-[var(--rv-ch2-text)] leading-tight">
                Add sponsorship participants in CEAC
              </div>
            </div>
          </div>
          <div className="h-px bg-[var(--rv-ch2)]/20 mb-5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[9px] mb-[26px]">
            {[
              "Open the shared CEAC sponsorship flow",
              "Review the common CEAC areas first",
              "Choose household member or joint sponsor inside the guide",
              "Use the right checklist once the path is selected",
            ].map((cue, idx) => (
              <div
                key={idx}
                className="bg-[var(--rv-ch2-feature-bg)] border border-[var(--rv-ch2)]/30 rounded-[10px] p-[11px_13px] flex items-start gap-[9px]"
              >
                <div className="w-[5px] h-[5px] rounded-full bg-[var(--rv-ch2)] shrink-0 mt-[5px]" />
                <div className="text-[13px] text-[var(--rv-ch2-text)] leading-tight">{cue}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              if (!guard()) return;
              setUseCeacGuideData(true);
              setTutorialPath(null);
              setTutorialIdx(0);
              setIsTutorialOpen(true);
            }}
            className="w-full py-4 px-7 text-white rounded-[12px] text-[15px] font-semibold cursor-pointer transition-all shadow-[0_4px_20px_rgba(82,10,80,0.25)] hover:shadow-[0_8px_32px_rgba(82,10,80,0.35)] hover:-translate-y-0.5 active:translate-y-0"
            style={{
              backgroundColor: "var(--rv-ch2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--rv-ch2-dark)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--rv-ch2)";
            }}
          >
            Participant Setup Guide
          </button>
        </div>
      </div>

      {/* SCENARIO BUILDER */}
      <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[22px] mb-[18px]">
        <div className="text-[14px] font-semibold text-[#0c1b33] mb-4">
          Define your scenario, who is involved in the sponsorship?
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold text-[#6b8097] uppercase tracking-wider mb-1.5 ml-0.5">
              Number of joint sponsors
            </label>
            <CustomDropdown
              value={String(jsCount)}
              onChange={(value) => setJsCount(parseInt(value, 10))}
              options={[
                { value: "0", label: "0 - not using a joint sponsor" },
                { value: "1", label: "1 joint sponsor" },
                { value: "2", label: "2 joint sponsors" },
              ]}
              className="w-full [&_button]:w-full [&_button]:min-w-0"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold text-[#6b8097] uppercase tracking-wider mb-1.5 ml-0.5">
              Number of household members
            </label>
            <CustomDropdown
              value={String(hhCount)}
              onChange={(value) => setHhCount(parseInt(value, 10))}
              options={[
                { value: "0", label: "0, no household members" },
                { value: "1", label: "1 household member" },
                { value: "2", label: "2 household members" },
                { value: "3", label: "3 household members" },
              ]}
              className="w-full [&_button]:w-full [&_button]:min-w-0"
            />
          </div>
        </div>

        {hhCount > 0 && (
          <div className="mt-4 pt-4 border-t border-[#d0e4f7]">
            <div className="text-[11px] font-bold text-[#6b8097] uppercase tracking-widest mb-3 ml-0.5">
              Household member relationship to the petitioner
            </div>
            <div className="flex flex-col gap-2">
              {Array.from({ length: hhCount }).map((_, idx) => {
                const num = idx + 1;
                return (
                  <div key={num} className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-[13px] font-medium text-[#3a4f63] min-w-[140px]">
                    </span>
                    <CustomDropdown
                      value={hhRelationships[num] || "other-hh"}
                      onChange={(value) =>
                        setHhRelationships((prev) => ({
                          ...prev,
                          [num]: value,
                        }))
                      }
                      options={[
                        { value: "spouse", label: "Spouse of petitioner" },
                        { value: "child", label: "Child of petitioner" },
                        { value: "parent", label: "Parent of petitioner" },
                        { value: "sibling", label: "Sibling of petitioner" },
                        { value: "other-relative", label: "Other relative" },
                        { value: "other-hh", label: "Other household member" },
                      ]}
                      className="flex-1 [&_button]:w-full [&_button]:min-w-0"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SUMMARY BANNER */}
      {(jsCount > 0 || hhCount > 0) && (
        <div className="bg-[#0c1b33] rounded-[16px] p-[16px_20px] mb-5 flex flex-wrap gap-x-8 gap-y-4">
          <div className="flex flex-col">
            <div className="text-[10px] font-semibold tracking-widest uppercase text-white/40 mb-0.5">
              Joint Sponsors
            </div>
            <div className="text-[14px] font-semibold text-white/90">
              {jsCount === 0 ? "None" : `${jsCount} joint sponsor${jsCount > 1 ? "s" : ""}`}
            </div>
            {jsCount > 0 && (
              <div className="text-[11px] text-white/50 mt-0.5">
                No relationship-proof checklist required
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <div className="text-[10px] font-semibold tracking-widest uppercase text-white/40 mb-0.5">
              Household Members
            </div>
            <div className="text-[14px] font-semibold text-white/90">
              {hhCount === 0 ? "None" : `${hhCount} household member${hhCount > 1 ? "s" : ""}`}
            </div>
            {hhCount > 0 && (
              <div className="text-[11px] text-white/50 mt-0.5">
                Relationship-proof checklist generated below
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROGRESS AND CHECKLIST */}
      {hhCount > 0 ? (
        <div className="flex flex-col gap-6 mt-3">
          {(() => {
            const groups = [
              {
                id: "required",
                label: "Required",
                badge: "req",
                items: allItems.filter((i) => i.group === "required"),
              },
              {
                id: "conditional",
                label: "Required if Applicable",
                badge: "cond",
                items: allItems.filter((i) => i.group === "conditional"),
              },
            ].filter((g) => g.items.length > 0);

            return (
              <DocListSection
                groups={groups}
                docsStatus={hhDocsStatus}
                uploadedDocuments={uploadedDocuments}
                isDeletingIds={isDeletingIds}
                isReloadingDocs={isReloadingDocs}
                getVaultId={(item) => mapDocumentNameToId(item.title)}
                findVaultDoc={(item, docs) => {
                  const defId = mapDocumentNameToId(item.title);
                  return docs.find((ud) => ud.documentDefId === defId);
                }}
                showTags={true}
                onItemClick={(item) => {
                  if (!guard()) return;
                  setDocActionModal({
                    isOpen: true,
                    doc: { ...item, name: item.title },
                    title: item.title,
                    subtitle: item.sub,
                    onReadGuide: () => {
                      if (hhDocsStatus[item.id] === "not-started") {
                        const next = { ...hhDocsStatus, [item.id]: "in-progress" };
                        setHhDocsStatus(next);
                        updateMetadata({ hhDocsStatus: next });
                      }
                      setActiveHhDoc(item);
                      setIsHhDocGuideOpen(true);
                    },
                    onUpload: () => {
                      const defId = mapDocumentNameToId(item.title);
                      setActiveUploadId(item.id);
                      setActiveUploadType("hh");
                      openUploadModal(defId);
                    },
                  });
                }}
                onPreview={onPreview}
                onDelete={onDelete}
              />
            );
          })()}
        </div>
      ) : jsCount > 0 ? (
        <div className="bg-white border-[1.5px] border-dashed border-[#d0e4f7] rounded-[16px] p-[32px_24px] text-center mb-5">
          <div className="text-[14px] font-semibold text-[#6b8097] mb-1.5">
            No relationship-proof checklist needed
          </div>
          <div className="text-[13px] text-[#6b8097]">
            Joint sponsors do not require relationship documentation. Your I-864 forms are the
            primary requirement, see Step 5 for those.
          </div>
        </div>
      ) : (
        <div className="bg-white border-[1.5px] border-dashed border-[#d0e4f7] rounded-[16px] p-[32px_24px] text-center mb-5">
          <div className="text-[14px] font-semibold text-[#6b8097] mb-1.5">
            Set your scenario above
          </div>
          <div className="text-[13px] text-[#6b8097]">
            Select the number of joint sponsors and household members to see the relevant checklist.
          </div>
        </div>
      )}
    </div>
  );
};

"use client";

import React from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { getStepIcon } from "../StepIcon";
import { mapDocumentNameToId } from "@/lib/document-vault/journey-mapping";

export const SCENARIOS: Record<string, any> = {
  "pet-only": {
    label: "Petitioner only (qualifies alone)",
    sponsors: ["Petitioner"],
    householdMembers: [],
    jointSponsors: [],
    forms: "I-864EZ",
    taxYears: 3,
  },
  "pet-hm": {
    label: "Petitioner + Household Member",
    sponsors: ["Petitioner"],
    householdMembers: ["Household Member 1"],
    jointSponsors: [],
    forms: "I-864, I-864A",
    taxYears: 3,
  },
  "pet-js1": {
    label: "Petitioner + 1 Joint Sponsor",
    sponsors: ["Petitioner"],
    householdMembers: [],
    jointSponsors: ["Joint Sponsor 1"],
    forms: "I-864 (×2)",
    taxYears: 3,
  },
  "pet-js2": {
    label: "Petitioner + 2 Joint Sponsors",
    sponsors: ["Petitioner"],
    householdMembers: [],
    jointSponsors: ["Joint Sponsor 1", "Joint Sponsor 2"],
    forms: "I-864 (×3)",
    taxYears: 3,
  },
  "pet-hm-js": {
    label: "Petitioner + HM + Joint Sponsor",
    sponsors: ["Petitioner"],
    householdMembers: ["Household Member 1"],
    jointSponsors: ["Joint Sponsor 1"],
    forms: "I-864, I-864A, I-864",
    taxYears: 3,
  },
};

export const getFinancialDocs = (scKey: string) => {
  const sc = SCENARIOS[scKey] || SCENARIOS["pet-only"];
  const docs: any = { required: [], conditional: [], recommended: [] };

  const taxNote = `${sc.taxYears} most recent years`;
  const allSponsors = [...sc.sponsors, ...sc.jointSponsors];

  allSponsors.forEach((sp) => {
    const isPet = sp === "Petitioner";
    const tagClass = isPet ? "tag-pet" : "tag-js";
    docs.required.push({
      id: `tax-${sp}`,
      icon: "receipt",
      title: `Federal Tax Return — ${sp}`,
      sub: `${taxNote} · Aligns with affidavit income statement`,
      tags: [
        { cls: tagClass, label: sp },
        { cls: "tag-tax", label: "3 Years" },
      ],
      guide: {
        intro: `The federal tax return (Form 1040) is the primary income evidence for ${sp}. It must align with the income figure reported in the affidavit of support.`,
        sections: [
          {
            title: "What is needed",
            body: `Most recent ${taxNote} of federal tax returns. Ensure the income figures are consistent with what was stated in the affidavit form.`,
          },
          {
            title: "Organization",
            body: `Group ${sp}'s tax documents together in one clearly labeled packet.`,
          },
        ],
      },
    });
    docs.required.push({
      id: `w2-${sp}`,
      icon: "file-text",
      title: `W-2 Forms — ${sp}`,
      sub: `${taxNote} · Wage and salary income documentation`,
      tags: [
        { cls: tagClass, label: sp },
        { cls: "tag-tax", label: "3 Years" },
      ],
      guide: {
        intro: `W-2 forms report annual wages and are issued by employers. They support the income figures shown on the tax return.`,
        sections: [
          {
            title: "What is needed",
            body: `W-2 forms for each year of tax evidence gathered. Group with the matching tax year materials.`,
          },
        ],
      },
    });
    docs.required.push({
      id: `transcript-${sp}`,
      icon: "landmark",
      title: `IRS Tax Transcripts — ${sp}`,
      sub: "Official IRS verification of filed tax information",
      tags: [
        { cls: tagClass, label: sp },
        { cls: "tag-tax", label: "3 Years" },
      ],
      guide: {
        intro: `IRS Tax Transcripts are official IRS-issued records confirming what was filed for a given tax year. They are a strong verification tool.`,
        sections: [
          {
            title: "How to obtain",
            body: "Request transcripts at IRS.gov (Get Transcript tool) or via mail using Form 4506-T. Processing time varies.",
          },
          {
            title: "Why it matters",
            body: "Transcripts confirm the authenticity of the tax filing and are particularly useful if the original return is unavailable.",
          },
        ],
      },
    });
    docs.conditional.push({
      id: `paystubs-${sp}`,
      icon: "banknote",
      title: `Pay Stubs — ${sp}`,
      sub: "Current income evidence — most recent 2–3 months",
      tags: [
        { cls: tagClass, label: sp },
        { cls: "tag-cur", label: "Current Income" },
      ],
      guide: {
        intro: `Recent pay stubs support current employment status and ongoing income. They are especially valuable when showing present income is important.`,
        sections: [
          {
            title: "What to include",
            body: "Most recent 2–3 months of pay stubs. Must show gross pay, employer name, and pay period.",
          },
        ],
      },
    });
    docs.conditional.push({
      id: `employment-${sp}`,
      icon: "building",
      title: `Employment Letter — ${sp}`,
      sub: "Confirms current employment and compensation",
      tags: [
        { cls: tagClass, label: sp },
        { cls: "tag-cur", label: "Current Income" },
      ],
      guide: {
        intro: `An employment verification letter supports consistent employment and current salary information.`,
        sections: [
          {
            title: "What it should include",
            body: "Employer letterhead, current position, start date, employment type (full-time/part-time), and current annual salary.",
          },
        ],
      },
    });

    docs.conditional.push({
      id: `assets-${sp}`,
      icon: "wallet",
      title: `Asset Evidence — ${sp}`,
      sub: "Bank statements, property, or investment documentation",
      tags: [
        { cls: tagClass, label: sp },
        { cls: "tag-cur", label: "Assets" },
      ],
      guide: {
        intro: `Asset documentation is relevant when assets are being used to supplement income. Assets must be available to the sponsor and convertible to cash within 12 months.`,
        sections: [
          {
            title: "What to include",
            body: "Recent bank statements, investment account statements, real estate ownership documents, or other liquid asset evidence.",
          },
        ],
      },
    });

    docs.recommended.push({
      id: `packet-${sp}`,
      icon: "folder",
      title: `Organized Income Packet — ${sp}`,
      sub: "All documents grouped cleanly by sponsor for upload readiness",
      tags: [{ cls: isPet ? "tag-pet" : "tag-js", label: sp }],
      guide: {
        intro: `Each sponsor's financial documents should be grouped clearly and separately. This improves upload readiness and makes review cleaner.`,
        sections: [
          {
            title: "How to organize",
            body: `Group tax returns, W-2s, transcripts, pay stubs, and any asset evidence for ${sp} into a single clearly labeled folder or file set.`,
          },
        ],
      },
    });
  });

  sc.householdMembers.forEach((hm: string, i: number) => {
    docs.conditional.push({
      id: `hm-income-${i}`,
      icon: "user",
      title: `Proof of Household Member Income — ${hm}`,
      sub: "Income evidence for household member contributing to sponsorship",
      tags: [{ cls: "tag-hm", label: hm }],
      guide: {
        intro: `If a household member's income is being included in the sponsorship, that person's income evidence must match their I-864A filing.`,
        sections: [
          {
            title: "What is needed",
            body: "Tax returns, W-2s, and current pay stubs for the household member. Must be consistent with the I-864A form answers.",
          },
          {
            title: "Consistency",
            body: "Household member income evidence must align with what was stated in Form I-864A.",
          },
        ],
      },
    });
    docs.conditional.push({
      id: `hm-residence-${i}`,
      icon: "home",
      title: `Proof of Shared Residence — ${hm}`,
      sub: "Evidence of household connection between sponsor and household member",
      tags: [{ cls: "tag-hm", label: hm }],
      guide: {
        intro: `Household member sponsorship support may require evidence that the household member and the petitioner share the same household or have a qualifying relationship.`,
        sections: [
          {
            title: "What to include",
            body: "Lease agreement or property ownership document showing shared address, utility bills in both names, or other evidence of shared household.",
          },
        ],
      },
    });
  });

  docs.recommended.push({
    id: `prior-year-backup`,
    icon: "clipboard",
    title: "Backup Prior-Year Tax Evidence",
    sub: "Additional years of tax evidence for extra reassurance",
    tags: [{ cls: "tag-tax", label: "Tax Evidence" }],
    guide: {
      intro:
        "Having an extra year of tax evidence beyond the required amount can provide additional reassurance during processing.",
      sections: [
        {
          title: "Why it helps",
          body: "An extra year of consistent income history strengthens the overall financial picture and can smooth over any single year anomalies.",
        },
      ],
    },
  });
  docs.recommended.push({
    id: `upload-packet`,
    icon: "hard-drive",
    title: "Upload-Ready Financial Packet",
    sub: "Clean, compressed, properly named files ready for CEAC upload",
    tags: [{ cls: "tag-cur", label: "Upload Ready" }],
    guide: {
      intro:
        "Preparing an upload-ready financial packet reduces errors and delays during the CEAC document upload phase.",
      sections: [
        {
          title: "File preparation",
          body: "Ensure all files are clearly scanned, under 4 MB each, in PDF or JPG format, properly named, and organized by sponsor.",
        },
      ],
    },
  });

  return docs;
};

interface FinancialChecklistToolProps {
  selectedScenario: string;
  setSelectedScenario: (val: string) => void;
  financialDocsStatus: Record<string, string>;
  uploadedDocuments: any[];
  isReloadingDocs: boolean;
  isDeletingIds: string[];
  openUploadModal: (defId: string) => void;
  setActiveUploadId: (id: string | null) => void;
  setActiveUploadType: (type: "doc" | "hh" | "financial" | null) => void;
  setDocActionModal: (data: any) => void;
  updateMetadata: (data: any) => void;
  setActiveFinancialDoc: (doc: any) => void;
  setIsFinancialDocGuideOpen: (open: boolean) => void;
  guard?: () => boolean;
}

export const FinancialChecklistTool: React.FC<FinancialChecklistToolProps> = ({
  selectedScenario,
  setSelectedScenario,
  financialDocsStatus,
  uploadedDocuments,
  isReloadingDocs,
  isDeletingIds,
  openUploadModal,
  setActiveUploadId,
  setActiveUploadType,
  setDocActionModal,
  updateMetadata,
  setActiveFinancialDoc,
  setIsFinancialDocGuideOpen,
  guard,
}) => {
  return (
    <div className="flex flex-col mt-3">
      {/* Scenario switcher */}
      <div className="flex items-center gap-[12px] bg-white border-[1.5px] border-[#d0e4f7] rounded-[10px] p-[14px_18px] mb-[20px] flex-wrap">
        <span className="text-[12px] font-semibold text-[#6b8097] whitespace-nowrap">
          Sponsorship structure:
        </span>
        <select
          className="flex-1 min-w-[180px] p-[8px_12px] border-[1.5px] border-[#d0e4f7] rounded-[8px] font-sans text-[13px] text-[#1c2b3a] bg-[#f4f7fb] outline-none cursor-pointer focus:border-primary"
          value={selectedScenario}
          onChange={(e) => setSelectedScenario(e.target.value)}
        >
          {Object.entries(SCENARIOS).map(([key, sc]) => (
            <option key={key} value={key}>
              {sc.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sponsorship Summary Card */}
      {(() => {
        const sc = SCENARIOS[selectedScenario] || SCENARIOS["pet-only"];
        return (
          <div className="bg-[#e8f1fb] border border-[#d0e4f7] rounded-[10px] p-[18px_20px] mb-[20px]">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#2f6fd4] mb-[10px]">
              Sponsorship Summary
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[8px]">
              {[
                ["Sponsorship setup", sc.label],
                ["Affidavit forms", sc.forms],
                ["Joint sponsors", sc.jointSponsors.length || "None"],
                ["Household members", sc.householdMembers.length || "None"],
                ["Tax evidence needed", "3 most recent years"],
              ].map(([k, v], i) => (
                <div
                  key={i}
                  className="bg-white border border-[#d0e4f7] rounded-[10px] p-[10px_12px]"
                >
                  <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#6b8097] mb-[3px]">
                    {k}
                  </div>
                  <div className="text-[13px] font-semibold text-[#0c1b33]">
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Progress Bar */}
      {(() => {
        const docs = getFinancialDocs(selectedScenario);
        const allItems = [
          ...docs.required,
          ...docs.conditional,
          ...docs.recommended,
        ];
        const reviewedCount = allItems.filter(
          (d) => financialDocsStatus[d.id] === "reviewed",
        ).length;
        const totalCount = allItems.length;
        const pct =
          totalCount > 0 ? Math.round((reviewedCount / totalCount) * 100) : 0;

        return (
          <div className="flex flex-col mb-[24px]">
            <div className="flex items-center gap-[12px] mb-[8px]">
              <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-primary to-primary/70 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
                {reviewedCount} of {totalCount} reviewed
              </div>
            </div>
          </div>
        );
      })()}

      {/* Document Groups */}
      <div className="flex flex-col gap-[36px]">
        {(() => {
          const docs = getFinancialDocs(selectedScenario);
          const groups = [
            {
              id: "required",
              label: "Required",
              badge: "badge-req",
              items: docs.required,
            },
            {
              id: "conditional",
              label: "Required if Applicable",
              badge: "badge-cond",
              items: docs.conditional,
            },
            {
              id: "recommended",
              label: "Recommended to Strengthen Readiness",
              badge: "badge-rec",
              items: docs.recommended,
            },
          ];

          return groups.map((group) => {
            if (group.items.length === 0) return null;
            return (
              <div key={group.id} className="flex flex-col">
                <div className="flex items-center gap-[10px] mb-[14px]">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#6b8097]">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-[#d0e4f7]" />
                </div>

                <div className="flex flex-col gap-[10px]">
                  {group.items.map((doc: any) => {
                    const st = financialDocsStatus[doc.id] || "not-started";
                    const defId = mapDocumentNameToId(doc.title);
                    const isUploadedInVault = uploadedDocuments.some(
                      (ud) => ud.documentDefId === defId,
                    );
                    const uploadedDoc = uploadedDocuments.find(
                      (ud) => ud.documentDefId === defId,
                    );
                    const isReviewed = st === "reviewed";
                    const isInProgress = st === "in-progress";

                    return (
                      <div
                        key={doc.id}
                        onClick={() => {
                          if (guard && !guard()) return;
                          setDocActionModal({
                            isOpen: true,
                            doc,
                            title: doc.title,
                            subtitle: doc.sub,
                            onReadGuide: () => {
                              if (financialDocsStatus[doc.id] !== "reviewed") {
                                updateMetadata({
                                  financialDocsStatus: {
                                    ...financialDocsStatus,
                                    [doc.id]: "in-progress",
                                  },
                                });
                              }
                              setActiveFinancialDoc(doc);
                              setIsFinancialDocGuideOpen(true);
                            },
                            onUpload: () => {
                              setActiveUploadId(doc.id);
                              setActiveUploadType("financial");
                              openUploadModal(defId);
                            },
                          });
                        }}
                        className={`group flex flex-col sm:flex-row sm:items-center gap-[16px] px-[16px] py-[14px] sm:px-[20px] sm:py-[18px] rounded-[14px] border-[1.5px] transition-all cursor-pointer relative shadow-[0_2px_12px_rgba(15,31,56,0.07),0_1px_3px_rgba(15,31,56,0.04)] hover:border-primary hover:shadow-[0_8px_32px_rgba(15,31,56,0.12),0_2px_8px_rgba(15,31,56,0.06)] hover:-translate-y-px active:translate-y-0 active:shadow-[0_2px_12px_rgba(15,31,56,0.07),0_1px_3px_rgba(15,31,56,0.04)] mb-[10px]
                        ${
                          isReviewed
                            ? "bg-[#eaf7ff] border-[#b8daff]"
                            : isInProgress
                              ? "bg-[#fff9e6] border-[#fde68a]/50"
                              : "bg-white border-[#d0e4f7]"
                        }`}
                      >
                        <div
                          className={`w-[40px] h-[40px] rounded-[10px] flex items-center justify-center shrink-0 transition-all duration-300 border text-[18px] relative
                          ${
                            isReviewed
                              ? "bg-[#1a7a5e] text-white border-[#1a7a5e]"
                              : isInProgress
                                ? "bg-white border-[#fde68a] text-[#d97706]"
                                : "bg-[#e8f1fb] border-[#d0e4f7] text-primary/80"
                          }`}
                        >
                          {/* We don't have isLocked easily here without another hook, but StepView passes guard which handles it on click. 
                              For visual hint, we could pass isLocked too, but guard() is enough for enforcement. */}
                          {isReviewed ? (
                            <CheckCircle2 size={18} strokeWidth={2.5} />
                          ) : (
                            getStepIcon(doc.icon)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] sm:text-[15px] font-semibold text-[#0c1b33] mb-[4px]">
                            {doc.title}
                          </div>
                          <div className="text-[13px] sm:text-[13px] text-[#3a4f63] leading-[1.4]">
                            {doc.sub}
                          </div>
                          <div className="flex gap-[6px] mt-[7px] flex-wrap">
                            {doc.tags.map((tag: any, idx: number) => (
                              <span
                                key={idx}
                                className={`text-[11px] font-semibold px-[9px] py-[3px] rounded-full tracking-[0.04em] ${
                                  tag.cls === "tag-pet"
                                    ? "bg-[#e8f1fb] text-[#2d4a6e]"
                                    : tag.cls === "tag-js"
                                      ? "bg-[#f3f0fb] text-[#4a2d8a]"
                                      : tag.cls === "tag-hm"
                                        ? "bg-[#e8f5ef] text-[#15744f]"
                                        : tag.cls === "tag-tax"
                                          ? "bg-[#fff7ed] text-[#b45309]"
                                          : tag.cls === "tag-cur"
                                            ? "bg-[#eef3fa] text-[#3a4f63]"
                                            : "bg-[#f4f7fb] text-[#6b8097]"
                                }`}
                              >
                                {tag.label}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto">
                          {(() => {
                            const isDeleting = uploadedDoc
                              ? isDeletingIds.includes(uploadedDoc.id)
                              : false;

                            if (isDeleting) return null;

                            const displayStatus = isUploadedInVault
                              ? "Uploaded"
                              : isReloadingDocs
                                ? "Checking..."
                                : isReviewed
                                  ? "Reviewed"
                                  : isInProgress
                                    ? "In progress"
                                    : "Not started";

                            const statusClasses = isUploadedInVault
                              ? "bg-[#eaf7f2] text-[#1a7a5e] border-[#b5e0d0] font-bold shadow-sm"
                              : isReloadingDocs
                                ? "bg-muted/30 text-muted-foreground border-muted-foreground/20 animate-pulse"
                                : isReviewed
                                  ? "bg-[#eaf7f2] text-[#1a7a5e] border-[#b5e0d0]"
                                  : isInProgress
                                    ? "bg-[#fff9e6] text-[#d97706] border-[#fde68a]"
                                    : "bg-white text-[#6b8097] border-[#d0e4f7] hover:border-primary hover:text-primary";

                            return (
                              <div
                                className={`text-[11px] font-semibold px-[10px] py-[4px] rounded-full border transition-all ${statusClasses}`}
                              >
                                {displayStatus}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
};

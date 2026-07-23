"use client";

import React from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { getStepIcon } from "../StepIcon";
import { mapDocumentNameToId, isDocUploadedInVault } from "@/lib/document-vault/journey-mapping";
import { DocListSection } from "./DocListSection";

export const DEFAULT_SCENARIOS: Record<string, any> = {
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

export const DEFAULT_TEMPLATES = {
  sponsor_required: [
    {
      id: "tax-${sp}",
      icon: "receipt",
      title: "Federal Tax Return — ${sp}",
      sub: "${taxNote} · Aligns with affidavit income statement",
      tags: [
        { cls: "${tagClass}", label: "${sp}" },
        { cls: "tag-tax", label: "3 Years" },
      ],
      guide: {
        intro:
          "The federal tax return (Form 1040) is the primary income evidence for ${sp}. It must align with the income figure reported in the affidavit of support.",
        sections: [
          {
            title: "What is needed",
            body: "Most recent ${taxNote} of federal tax returns. Ensure the income figures are consistent with what was stated in the affidavit form.",
          },
          {
            title: "Organization",
            body: "Group ${sp}'s tax documents together in one clearly labeled packet.",
          },
        ],
      },
    },
    {
      id: "w2-${sp}",
      icon: "file-text",
      title: "W-2 Forms — ${sp}",
      sub: "${taxNote} · Wage and salary income documentation",
      tags: [
        { cls: "${tagClass}", label: "${sp}" },
        { cls: "tag-tax", label: "3 Years" },
      ],
      guide: {
        intro:
          "W-2 forms report annual wages and are issued by employers. They support the income figures shown on the tax return.",
        sections: [
          {
            title: "What is needed",
            body: "W-2 forms for each year of tax evidence gathered. Group with the matching tax year materials.",
          },
        ],
      },
    },
    {
      id: "transcript-${sp}",
      icon: "landmark",
      title: "IRS Tax Transcripts — ${sp}",
      sub: "Official IRS verification of filed tax information",
      tags: [
        { cls: "${tagClass}", label: "${sp}" },
        { cls: "tag-tax", label: "3 Years" },
      ],
      guide: {
        intro:
          "IRS Tax Transcripts are official IRS-issued records confirming what was filed for a given tax year. They are a strong verification tool.",
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
    },
  ],
  sponsor_conditional: [
    {
      id: "paystubs-${sp}",
      icon: "banknote",
      title: "Pay Stubs — ${sp}",
      sub: "Current income evidence — most recent 2–3 months",
      tags: [
        { cls: "${tagClass}", label: "${sp}" },
        { cls: "tag-cur", label: "Current Income" },
      ],
      guide: {
        intro:
          "Recent pay stubs support current employment status and ongoing income. They are especially valuable when showing present income is important.",
        sections: [
          {
            title: "What to include",
            body: "Most recent 2–3 months of pay stubs. Must show gross pay, employer name, and pay period.",
          },
        ],
      },
    },
    {
      id: "employment-${sp}",
      icon: "building",
      title: "Employment Letter — ${sp}",
      sub: "Confirms current employment and compensation",
      tags: [
        { cls: "${tagClass}", label: "${sp}" },
        { cls: "tag-cur", label: "Current Income" },
      ],
      guide: {
        intro:
          "An employment verification letter supports consistent employment and current salary information.",
        sections: [
          {
            title: "What it should include",
            body: "Employer letterhead, current position, start date, employment type (full-time/part-time), and current annual salary.",
          },
        ],
      },
    },
    {
      id: "assets-${sp}",
      icon: "wallet",
      title: "Asset Evidence — ${sp}",
      sub: "Bank statements, property, or investment documentation",
      tags: [
        { cls: "${tagClass}", label: "${sp}" },
        { cls: "tag-cur", label: "Assets" },
      ],
      guide: {
        intro:
          "Asset documentation is relevant when assets are being used to supplement income. Assets must be available to the sponsor and convertible to cash within 12 months.",
        sections: [
          {
            title: "What to include",
            body: "Recent bank statements, investment account statements, real estate ownership documents, or other liquid asset evidence.",
          },
        ],
      },
    },
  ],
  sponsor_recommended: [
    {
      id: "packet-${sp}",
      icon: "folder",
      title: "Organized Income Packet — ${sp}",
      sub: "All documents grouped cleanly by sponsor for upload readiness",
      tags: [{ cls: "${tagClass}", label: "${sp}" }],
      guide: {
        intro:
          "Each sponsor's financial documents should be grouped clearly and separately. This improves upload readiness and makes review cleaner.",
        sections: [
          {
            title: "How to organize",
            body: "Group tax returns, W-2s, transcripts, pay stubs, and any asset evidence for ${sp} into a single clearly labeled folder or file set.",
          },
        ],
      },
    },
  ],
  household_conditional: [
    {
      id: "hm-income-${i}",
      icon: "user",
      title: "Proof of Household Member Income — ${hm}",
      sub: "Income evidence for household member contributing to sponsorship",
      tags: [{ cls: "tag-hm", label: "${hm}" }],
      guide: {
        intro:
          "If a household member's income is being included in the sponsorship, that person's income evidence must match their I-864A filing.",
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
    },
    {
      id: "hm-residence-${i}",
      icon: "home",
      title: "Proof of Shared Residence — ${hm}",
      sub: "Evidence of household connection between sponsor and household member",
      tags: [{ cls: "tag-hm", label: "${hm}" }],
      guide: {
        intro:
          "Household member sponsorship support may require evidence that the household member and the petitioner share the same household or have a qualifying relationship.",
        sections: [
          {
            title: "What to include",
            body: "Lease agreement or property ownership document showing shared address, utility bills in both names, or other evidence of shared household.",
          },
        ],
      },
    },
  ],
  general_recommended: [
    {
      id: "prior-year-backup",
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
    },
    {
      id: "upload-packet",
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
    },
  ],
};

// Exporting SCENARIOS to preserve exports (in case of other files importing it)
export const SCENARIOS = DEFAULT_SCENARIOS;

export const getFinancialDocs = (scKey: string, toolData?: any) => {
  const scenarios = toolData?.scenarios || DEFAULT_SCENARIOS;
  const templates = toolData?.templates || DEFAULT_TEMPLATES;

  const sc = scenarios[scKey] || scenarios["pet-only"];
  const docs: any = { required: [], conditional: [], recommended: [] };

  const taxNote = `${sc.taxYears} most recent years`;
  const allSponsors = [...(sc.sponsors || []), ...(sc.jointSponsors || [])];

  const subst = (str: string, vars: Record<string, string>) => {
    if (!str) return str;
    return str.replace(/\$\{(\w+)\}/g, (_, key) => vars[key] ?? "");
  };

  const interpolateDoc = (template: any, vars: Record<string, string>) => {
    const clone = JSON.parse(JSON.stringify(template));
    clone.id = subst(clone.id, vars);
    clone.title = subst(clone.title, vars);
    clone.sub = subst(clone.sub, vars);
    if (Array.isArray(clone.tags)) {
      clone.tags = clone.tags.map((tag: any) => ({
        cls: subst(tag.cls, vars),
        label: subst(tag.label, vars),
      }));
    }
    if (clone.guide) {
      clone.guide.intro = subst(clone.guide.intro, vars);
      if (Array.isArray(clone.guide.sections)) {
        clone.guide.sections = clone.guide.sections.map((sec: any) => ({
          title: subst(sec.title, vars),
          body: subst(sec.body, vars),
        }));
      }
    }
    return clone;
  };

  allSponsors.forEach((sp) => {
    const isPet = sp === "Petitioner";
    const tagClass = isPet ? "tag-pet" : "tag-js";
    const vars = { sp, taxNote, tagClass };

    if (Array.isArray(templates.sponsor_required)) {
      templates.sponsor_required.forEach((t: any) => {
        docs.required.push(interpolateDoc(t, vars));
      });
    }
    if (Array.isArray(templates.sponsor_conditional)) {
      templates.sponsor_conditional.forEach((t: any) => {
        docs.conditional.push(interpolateDoc(t, vars));
      });
    }
    if (Array.isArray(templates.sponsor_recommended)) {
      templates.sponsor_recommended.forEach((t: any) => {
        docs.recommended.push(interpolateDoc(t, vars));
      });
    }
  });

  if (Array.isArray(sc.householdMembers)) {
    sc.householdMembers.forEach((hm: string, i: number) => {
      const vars = { hm, i: String(i) };
      if (Array.isArray(templates.household_conditional)) {
        templates.household_conditional.forEach((t: any) => {
          docs.conditional.push(interpolateDoc(t, vars));
        });
      }
    });
  }

  if (Array.isArray(templates.general_recommended)) {
    templates.general_recommended.forEach((t: any) => {
      docs.recommended.push(interpolateDoc(t, {}));
    });
  }

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
  tool?: any;
  onPreview: (uploadedDocId: string) => void;
  onDelete: (id: string, name: string) => void;
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
  tool,
  onPreview,
  onDelete,
}) => {
  const scenarios = tool?.scenarios || DEFAULT_SCENARIOS;

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
          onChange={(e) => {
            const val = e.target.value;
            setSelectedScenario(val);
            updateMetadata({ selectedScenario: val });
          }}
        >
          {Object.entries(scenarios).map(([key, sc]: [string, any]) => (
            <option key={key} value={key}>
              {sc.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sponsorship Summary Card */}
      {(() => {
        const sc = scenarios[selectedScenario] || scenarios["pet-only"];
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
                  <div className="text-[13px] font-semibold text-[#0c1b33]">{v}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Document Groups */}
      <div className="flex flex-col gap-[36px] mt-2">
        {(() => {
          const docs = getFinancialDocs(selectedScenario, tool);
          const groups = [
            {
              id: "required",
              label: "Required",
              badge: "req",
              items: docs.required,
            },
            {
              id: "conditional",
              label: "Required if Applicable",
              badge: "cond",
              items: docs.conditional,
            },
            {
              id: "recommended",
              label: "Recommended to Strengthen Readiness",
              badge: "Recommended",
              items: docs.recommended,
            },
          ].filter((g) => g.items.length > 0);

          return (
            <DocListSection
              groups={groups}
              docsStatus={financialDocsStatus}
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
                if (guard && !guard()) return;
                setDocActionModal({
                  isOpen: true,
                  doc: { ...item, name: item.title },
                  title: item.title,
                  subtitle: item.sub,
                  onReadGuide: () => {
                    if (financialDocsStatus[item.id] !== "reviewed") {
                      updateMetadata({
                        financialDocsStatus: {
                          ...financialDocsStatus,
                          [item.id]: "in-progress",
                        },
                      });
                    }
                    setActiveFinancialDoc(item);
                    setIsFinancialDocGuideOpen(true);
                  },
                  onUpload: () => {
                    const defId = mapDocumentNameToId(item.title);
                    setActiveUploadId(item.id);
                    setActiveUploadType("financial");
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
    </div>
  );
};

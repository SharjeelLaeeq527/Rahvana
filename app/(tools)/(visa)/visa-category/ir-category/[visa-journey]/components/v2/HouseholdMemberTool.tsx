"use client";

import React from "react";
import { Upload } from "lucide-react";
import { getStepIcon } from "./StepIcon";
import { mapDocumentNameToId } from "@/lib/document-vault/journey-mapping";

interface HouseholdMemberToolProps {
  hhCount: number;
  hhRelationships: Record<number, string>;
  hhDocsStatus: Record<string, string>;
  setHhDocsStatus: (val: Record<string, string>) => void;
  updateMetadata: (data: any) => void;
  openUploadModal: (defId: string) => void;
  setActiveUploadId: (id: string | null) => void;
  setActiveUploadType: (type: "doc" | "hh" | "financial" | null) => void;
  setActiveHhDoc: (doc: any) => void;
  setIsHhDocGuideOpen: (open: boolean) => void;
}

export const getHhDocItems = (count: number, rels: Record<number, string>) => {
  const items: any[] = [];
  for (let i = 1; i <= count; i++) {
    const relationship = rels[i] || "spouse";
    const label = `Household Member ${i}`;

    switch (relationship) {
      case "spouse":
        items.push({
          id: `hh${i}-marriage`,
          icon: "marriage",
          title: `Marriage Certificate — ${label}`,
          sub: "Proves the spousal relationship to the petitioner",
          tags: [
            { cls: "tag-hh", label: "Household Member" },
            { cls: "tag-rel", label: "Relationship Proof" },
            { cls: "tag-gov", label: "Govt Record" },
          ],
          guideKey: "marriage-cert-hh",
          group: "required",
        });
        items.push({
          id: `hh${i}-residence`,
          icon: "home",
          title: `Proof of Shared Residence — ${label}`,
          sub: "Confirms both spouses share the same household address",
          tags: [
            { cls: "tag-hh", label: "Household Member" },
            { cls: "tag-res", label: "Shared Residence" },
          ],
          guideKey: "shared-residence",
          group: "required",
        });
        items.push({
          id: `hh${i}-id`,
          icon: "id",
          title: `Identity Document — ${label}`,
          sub: "Government-issued ID confirming the household member's identity",
          tags: [
            { cls: "tag-hh", label: "Household Member" },
            { cls: "tag-id", label: "Identity" },
            { cls: "tag-gov", label: "Govt Record" },
          ],
          guideKey: "id-doc-hh",
          group: "required",
        });
        break;

      case "child":
        items.push({
          id: `hh${i}-birth-hh`,
          icon: "birth",
          title: `Birth Certificate — ${label}`,
          sub: "Proves the parent–child relationship to the petitioner",
          tags: [
            { cls: "tag-hh", label: "Household Member" },
            { cls: "tag-rel", label: "Relationship Proof" },
            { cls: "tag-gov", label: "Govt Record" },
          ],
          guideKey: "birth-cert-hh",
          group: "required",
        });
        items.push({
          id: `hh${i}-residence`,
          icon: "home",
          title: `Proof of Shared Residence — ${label}`,
          sub: "Confirms child lives in the same household",
          tags: [
            { cls: "tag-hh", label: "Household Member" },
            { cls: "tag-res", label: "Shared Residence" },
          ],
          guideKey: "shared-residence",
          group: "required",
        });
        items.push({
          id: `hh${i}-id`,
          icon: "id",
          title: `Identity Document — ${label}`,
          sub: "Government-issued ID for the household member",
          tags: [
            { cls: "tag-hh", label: "Household Member" },
            { cls: "tag-id", label: "Identity" },
            { cls: "tag-gov", label: "Govt Record" },
          ],
          guideKey: "id-doc-hh",
          group: "conditional",
        });
        break;

      case "parent":
        items.push({
          id: `hh${i}-birth-sponsor`,
          icon: "birth",
          title: `Birth Certificate of Petitioner`,
          sub: `Shows ${label} (parent) is listed — establishes the parent–child link`,
          tags: [
            { cls: "tag-hh", label: "Household Member" },
            { cls: "tag-rel", label: "Relationship Proof" },
            { cls: "tag-gov", label: "Govt Record" },
          ],
          guideKey: "birth-cert-sponsor",
          group: "required",
        });
        items.push({
          id: `hh${i}-id`,
          icon: "id",
          title: `Identity Document — ${label}`,
          sub: "Government-issued ID for the household member",
          tags: [
            { cls: "tag-hh", label: "Household Member" },
            { cls: "tag-id", label: "Identity" },
            { cls: "tag-gov", label: "Govt Record" },
          ],
          guideKey: "id-doc-hh",
          group: "required",
        });
        items.push({
          id: `hh${i}-residence`,
          icon: "home",
          title: `Proof of Shared Residence — ${label}`,
          sub: "Confirms parent and petitioner share the same household",
          tags: [
            { cls: "tag-hh", label: "Household Member" },
            { cls: "tag-res", label: "Shared Residence" },
          ],
          guideKey: "shared-residence",
          group: "conditional",
        });
        break;

      case "sibling":
        items.push({
          id: `hh${i}-birth-sponsor`,
          icon: "birth",
          title: "Birth Certificate of Petitioner",
          sub: "Shows shared parentage with the sibling household member",
          tags: [
            { cls: "tag-hh", label: "Household Member" },
            { cls: "tag-rel", label: "Relationship Proof" },
            { cls: "tag-gov", label: "Govt Record" },
          ],
          guideKey: "birth-cert-sponsor",
          group: "required",
        });
        items.push({
          id: `hh${i}-birth-hh`,
          icon: "birth",
          title: `Birth Certificate — ${label}`,
          sub: "Combined with petitioner's birth cert to show shared parentage",
          tags: [
            { cls: "tag-hh", label: "Household Member" },
            { cls: "tag-rel", label: "Relationship Proof" },
            { cls: "tag-gov", label: "Govt Record" },
          ],
          guideKey: "birth-cert-hh",
          group: "required",
        });
        items.push({
          id: `hh${i}-id`,
          icon: "id",
          title: `Identity Document — ${label}`,
          sub: "Government-issued ID for the household member",
          tags: [
            { cls: "tag-hh", label: "Household Member" },
            { cls: "tag-id", label: "Identity" },
            { cls: "tag-gov", label: "Govt Record" },
          ],
          guideKey: "id-doc-hh",
          group: "required",
        });
        items.push({
          id: `hh${i}-residence`,
          icon: "home",
          title: `Proof of Shared Residence — ${label}`,
          sub: "Confirms sibling and petitioner share the same household",
          tags: [
            { cls: "tag-hh", label: "Household Member" },
            { cls: "tag-res", label: "Shared Residence" },
          ],
          guideKey: "shared-residence",
          group: "conditional",
        });
        break;

      case "other-relative":
      case "other-hh":
      default:
        items.push({
          id: `hh${i}-residence`,
          icon: "home",
          title: `Proof of Shared Residence — ${label}`,
          sub: "Demonstrates the shared-household basis for including their income",
          tags: [
            { cls: "tag-hh", label: "Household Member" },
            { cls: "tag-res", label: "Shared Residence" },
          ],
          guideKey: "shared-residence",
          group: "required",
        });
        items.push({
          id: `hh${i}-family-link`,
          icon: "link",
          title: `Supporting Family-Link Evidence — ${label}`,
          sub: "Civil records or affidavit establishing the household connection",
          tags: [
            { cls: "tag-hh", label: "Household Member" },
            { cls: "tag-rel", label: "Relationship Proof" },
          ],
          guideKey: "family-link",
          group: "required",
        });
        items.push({
          id: `hh${i}-id`,
          icon: "id",
          title: `Identity Document — ${label}`,
          sub: "Government-issued ID for the household member",
          tags: [
            { cls: "tag-hh", label: "Household Member" },
            { cls: "tag-id", label: "Identity" },
            { cls: "tag-gov", label: "Govt Record" },
          ],
          guideKey: "id-doc-hh",
          group: "conditional",
        });
        break;
    }
  }
  return items;
};

export const HouseholdMemberTool: React.FC<HouseholdMemberToolProps> = ({
  hhCount,
  hhRelationships,
  hhDocsStatus,
  setHhDocsStatus,
  updateMetadata,
  openUploadModal,
  setActiveUploadId,
  setActiveUploadType,
  setActiveHhDoc,
  setIsHhDocGuideOpen,
}) => {
  const items = getHhDocItems(hhCount, hhRelationships);

  const renderHhDocCard = (item: any) => {
    const st = hhDocsStatus[item.id] || "not-started";
    const stLabel =
      st === "reviewed" ? "✓ Reviewed" : st === "in-progress" ? "In progress" : "Open guide";

    return (
      <div
        key={item.id}
        className={`w-full group bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[17px_20px] flex items-center gap-[15px] text-left transition-all hover:border-primary hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)] ${
          st === "reviewed" ? "bg-[#e8f5ef] border-[#a8d9be]" : st === "in-progress" ? "bg-[#fef8e8] border-[#f0d98a]" : ""
        }`}
      >
        <div
          className={`w-[38px] h-[38px] rounded-[9px] bg-[#e8f1fb] border border-[#d0e4f7] flex items-center justify-center shrink-0 text-[16px] transition-all group-hover:bg-primary/10 group-hover:border-primary/30 ${
            st === "reviewed" ? "bg-[#e8f5ef] border-[#a8d9be]" : ""
          }`}
        >
          {getStepIcon(item.icon)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold text-[#0c1b33] mb-0.5 leading-tight">
            {item.title}
          </div>
          <div className="text-[12px] text-[#6b8097] leading-tight">{item.sub}</div>
          <div className="flex gap-[5px] mt-[6px] flex-wrap">
            {item.tags.map((tag: any, idx: number) => {
              const tagMap: Record<string, string> = {
                "tag-hh": "bg-[#fff7ed] text-[#b45309] border-[#fed7aa]",
                "tag-js": "bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]",
                "tag-rel": "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]",
                "tag-res": "bg-[#e8f5ef] text-[#15744f] border-[#a8d9be]",
                "tag-id": "bg-[#eef3fa] text-[#3a4f63] border-[#d0e4f7]",
                "tag-gov": "bg-[#fff7ed] text-[#b45309] border-[#fed7aa]",
              };
              return (
                <span
                  key={idx}
                  className={`text-[10px] font-semibold px-2 py-[2px] rounded-full tracking-wider border ${
                    tagMap[tag.cls] || "bg-[#f4f7fb] text-[#6b8097]"
                  }`}
                >
                  {tag.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const defId = mapDocumentNameToId(item.title);
              setActiveUploadId(item.id);
              setActiveUploadType("hh");
              openUploadModal(defId);
            }}
            className="rounded-full bg-white px-[11px] py-[5px] border border-[#d0e4f7] text-[12px] font-medium flex items-center justify-center gap-1 text-[#6b8097] hover:border-primary hover:text-primary transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            <Upload size={14} strokeWidth={2.5} />
            <span>Vault</span>
          </button>
          <button
            onClick={() => {
              if (hhDocsStatus[item.id] === "not-started") {
                const next = { ...hhDocsStatus, [item.id]: "in-progress" };
                setHhDocsStatus(next);
              }
              updateMetadata({
                hhDocsStatus: {
                  ...hhDocsStatus,
                  [item.id]: "in-progress",
                },
              });
              setActiveHhDoc(item);
              setIsHhDocGuideOpen(true);
            }}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 transition-all border ${
              st === "reviewed"
                ? "bg-[#e8f5ef] text-[#15744f] border-[#a8d9be]"
                : st === "in-progress"
                  ? "bg-[#fef8e8] text-[#8a6200] border-[#f0d98a]"
                  : "bg-[#f4f7fb] text-[#6b8097] border-[#d0e4f7]"
            }`}
          >
            {stLabel}
          </button>
        </div>
      </div>
    );
  };

  return <div className="flex flex-col gap-3">{items.map((item) => renderHhDocCard(item))}</div>;
};

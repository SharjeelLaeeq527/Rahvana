"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

interface GatheringChecklistToolProps {
  tool: any;
  state: any;
  actions: any;
  gatheringState: {
    gatheringStatus: Record<string, string>;
    setGatheringStatus: (v: any) => void;
    selectedGatheringItem: any;
    setSelectedGatheringItem: (v: any) => void;
    isGatheringGuideOpen: boolean;
    setIsGatheringGuideOpen: (v: boolean) => void;
    gatheringGuideStep: number;
    setGatheringGuideStep: (v: any) => void;
  };
  guard?: () => boolean;
}

export const GatheringChecklistTool: React.FC<GatheringChecklistToolProps> = ({
  tool,
  state,
  actions,
  gatheringState,
  guard,
}) => {
  const {
    gatheringStatus,
    setGatheringStatus,
    selectedGatheringItem,
    setSelectedGatheringItem,
    isGatheringGuideOpen,
    setIsGatheringGuideOpen,
    gatheringGuideStep,
    setGatheringGuideStep,
  } = gatheringState;

  const groups = tool.doc_gathering?.groups || [];
  const allItems = groups.flatMap((g: any) => g.items);
  const total = allItems.length;
  const rev = allItems.filter(
    (it: any) => gatheringStatus[it.id] === "reviewed",
  ).length;
  const pct = total > 0 ? (rev / total) * 100 : 0;

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380 font-sans">
      <div className="flex items-center gap-[12px] mb-[36px]">
        <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-primary to-primary/70 rounded-[10px] transition-all duration-500 ease-in-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
          {rev} of {total} packed
        </div>
      </div>

      <div id="doc-groups">
        {groups.map((group: any) => (
          <div key={group.id} className="mb-[28px] last:mb-0">
            <div className="flex items-center gap-[10px] mb-[12px]">
              <span className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[#6b8097]">
                {group.label}
              </span>
              <span
                className={`text-[9px] font-semibold px-[9px] py-[2px] rounded-full border tracking-[0.06em] whitespace-nowrap ${
                  group.badge === "Required"
                    ? "bg-[#ffeaea] text-[#a01c1c] border-[#f5bebe]"
                    : group.badge === "Recommended"
                      ? "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]"
                      : "bg-[#fef8e8] text-[#8a6200] border-[#f0d98a]"
                }`}
              >
                {group.badge === "Required"
                  ? "Required"
                  : group.badge === "Recommended"
                    ? "Recommended"
                    : "Required if applicable"}
              </span>
              <div className="flex-1 h-px bg-[#d0e4f7]" />
            </div>

            <div className="flex flex-col gap-[9px]">
              {group.items.map((item: any) => {
                const status = gatheringStatus[item.id] || "not-started";
                const isRev = status === "reviewed";
                const isIP = status === "in-progress";

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (guard && !guard()) return;
                      setSelectedGatheringItem(item);
                      setIsGatheringGuideOpen(true);
                      if (status === "not-started") {
                        setGatheringStatus((prev: any) => ({
                          ...prev,
                          [item.id]: "in-progress",
                        }));
                      }
                    }}
                    className={`group border-[1.5px] rounded-[16px] px-[20px] py-[16px] flex items-center gap-[14px] cursor-pointer transition-all hover:-translate-y-[1px] ${
                      isRev
                        ? "bg-[#e8f5ef] border-[#a8d9be]"
                        : isIP
                          ? "bg-[#fef8e8] border-[#f0d98a]"
                          : "bg-white border-[#d0e4f7] hover:border-[#2f6fd4] hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)]"
                    }`}
                  >
                    <div
                      className={`w-[38px] h-[38px] rounded-[9px] border flex items-center justify-center shrink-0 transition-all ${
                        isRev
                          ? "bg-[#e8f5ef] border-[#a8d9be] text-[#15744f]"
                          : "bg-white border-[#d0e4f7] text-[#6b8097]"
                      }`}
                    >
                      {status === "reviewed" ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-[14px] font-semibold leading-tight ${isRev ? "text-[#0e5c3c]" : "text-[#0c1b33]"}`}
                      >
                        {item.title}
                      </div>
                      <div className="text-[11px] text-[#6b8097] mt-0.5">
                        {item.sub}
                      </div>
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
};

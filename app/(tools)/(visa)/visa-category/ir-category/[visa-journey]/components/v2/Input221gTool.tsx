"use client";

import React, { useState } from "react";
import Actual221GFormChecker from "@/app/(tools)/(visa)/221g-action-planner/components/Actual221GFormChecker";
import { FormSelections } from "@/app/(tools)/(visa)/221g-action-planner/types/221g";
import { Check, ChevronRight } from "lucide-react";

interface Input221gToolProps {
  tool: any;
  state: any;
  actions: any;
  guard?: () => boolean;
}

export const Input221gTool: React.FC<Input221gToolProps> = ({
  tool,
  state,
  actions,
  guard,
}) => {
  const [selectedItems, setSelectedItems] = useState<FormSelections>(
    state.metadata?.twentyTwoOneGSelections || {}
  );
  const [isSaved, setIsSaved] = useState(!!state.metadata?.twentyTwoOneGSelections);

  const handleSelectionChange = (newSelected: FormSelections) => {
    setSelectedItems(newSelected);
  };

  const handleSave = () => {
    if (guard && !guard()) return;
    setIsSaved(true);
    actions.updateMetadata({ twentyTwoOneGSelections: selectedItems });
  };

  const handleEdit = () => {
    setIsSaved(false);
  };

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 w-full">
      {tool.intro && (
        <div className="relative bg-[#0e1e38] rounded-[16px] p-6 mb-4 overflow-hidden border border-white/10 shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#8a6200] via-[#f0d98a] to-transparent opacity-85" />
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-2">
            {tool.intro.eyebrow}
          </div>
          <div className="text-[20px] text-white/95 mb-2.5 leading-tight">
            {tool.intro.title}
          </div>
          <div className="text-[13px] text-white/55 leading-relaxed max-w-[560px]">
            {tool.intro.body}
          </div>
        </div>
      )}

      {!isSaved ? (
        <div className="mb-4">
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
             <Actual221GFormChecker
              selectedItems={selectedItems}
              onSelectionChange={handleSelectionChange}
              onNext={() => {}} 
              smartModeEnabled={true}
              consularPost={state.metadata?.interviewLocation || "U.S. Embassy"}
              visaType="Immigrant"
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full mt-4 p-3.5 bg-primary text-white rounded-xl font-bold transition-all shadow-[0_4px_16px_rgba(47,111,212,0.3)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            Generate Action Plan <ChevronRight size={18} />
          </button>
        </div>
      ) : (
        <div className="bg-white border-[1.5px] border-[#4caf50] rounded-[16px] p-6 mb-4 shadow-[0_4px_24px_rgba(12,27,51,0.08)] animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[#4caf50]">
              <div className="w-6 h-6 rounded-full bg-[#e8f5e9] flex items-center justify-center">
                <Check size={14} strokeWidth={2.5} />
              </div>
              <div className="text-[12px] font-bold uppercase tracking-widest">
                Checklist Saved
              </div>
            </div>
            <button
              onClick={handleEdit}
              className="text-[12px] font-bold text-primary hover:underline"
            >
              Edit Checklist
            </button>
          </div>
          <div className="text-[13px] text-[#3a4f63] leading-relaxed">
            Your 221(g) checklist has been recorded. Your custom action plan is ready in the next step.
          </div>
        </div>
      )}

      {tool.disclaimer && (
        <p className="text-[11.5px] text-[#6b8097] leading-[1.65] text-center mt-2">
          {tool.disclaimer}
        </p>
      )}
    </div>
  );
};

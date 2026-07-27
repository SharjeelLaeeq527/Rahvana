"use client";

import React from "react";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";

interface DqRecordingToolProps {
  dqState: {
    dqSaved: boolean;
    setDqSaved: (v: boolean) => void;
    dqDate: string;
    setDqDate: (v: string) => void;
    dqCategory: string;
    setDqCategory: (v: string) => void;
    dqCountry: string;
    setDqCountry: (v: string) => void;
  };
  actions: {
    updateMetadata: (data: Record<string, unknown>) => void;
  };
  guard?: () => boolean;
}

export const DqRecordingTool: React.FC<DqRecordingToolProps> = ({ dqState, actions, guard }) => {
  const {
    dqSaved,
    setDqSaved,
    dqDate,
    setDqDate,
    dqCategory,
    setDqCategory,
    dqCountry,
    setDqCountry,
  } = dqState;
  const [isSaving, setIsSaving] = React.useState(false);

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380">
      <div className="flex gap-[7px] flex-wrap mb-[32px]">
        <span className="text-[11px] font-semibold tracking-wider uppercase px-[12px] py-[3px] rounded-full bg-[#fffbec] text-[#b38600] border border-[#e8d47a]">
          Major Milestone
        </span>
        <span className="text-[11px] font-semibold tracking-wider uppercase px-[12px] py-[3px] rounded-full bg-[#e8f1fb] text-[#2d4a6e] border border-[#d0e4f7]">
          Tracking Active
        </span>
        <span className="text-[11px] font-semibold tracking-wider uppercase px-[12px] py-[3px] rounded-full bg-[#f3f0fb] text-[#4a2d8a] border border-[#c9bef2]">
          Dashboard Update
        </span>
      </div>

      <div className="relative bg-[#1a0a18] rounded-[16px] p-[22px_26px] mb-[18px] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#b38600] via-[#f0d98a] to-transparent opacity-90" />
        <div className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-[5px]">
          NVC — Documentary Qualification Received
        </div>
        <div className="text-[22px] text-white/92 mb-[6px]">
          Your documents have been accepted by NVC
        </div>
        <div className="text-[13px] text-white/55 leading-[1.55]">
          This is a significant milestone. Case is now documentarily complete.
        </div>
      </div>

      {!dqSaved ? (
        <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[22px_24px] mb-[14px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] mb-[16px]">
            <input
              type="date"
              value={dqDate}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDqDate(e.target.value)}
              className="p-2.5 border rounded-lg"
            />
            <div className="p-2.5 border rounded-lg bg-slate-50 text-slate-700 font-medium">
              IR-1
            </div>
          </div>
          <button
            onClick={async () => {
              if (guard && !guard()) return;
              setIsSaving(true);
              try {
                await actions.updateMetadata({
                  dqSaved: true,
                  dqDate,
                  dqCategory: "IR-1",
                  dqCountry,
                });
                setDqSaved(true);
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={isSaving}
            className="w-full bg-primary text-white py-3 rounded-lg font-bold disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save DQ & Activate Tracking"}
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl mb-4 flex justify-between items-center">
          <div className="font-bold text-emerald-800 text-xs">✓ DQ Recorded ({dqDate})</div>
          <button
            onClick={() => {
              setIsSaving(false);
              setDqSaved(false);
            }}
            className="text-primary text-xs font-semibold hover:underline"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

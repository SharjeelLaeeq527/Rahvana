"use client";

import React from "react";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";

interface DqRecordingToolProps {
  dqState: {
    dqSaved: boolean;
    setDqSaved: (value: boolean) => void;
    dqDate: string;
    setDqDate: (value: string) => void;
    dqCategory: string;
    setDqCategory: (value: string) => void;
    dqCountry: string;
    setDqCountry: (value: string) => void;
  };
  actions: {
    updateMetadata: (data: Record<string, unknown>) => void | Promise<void>;
  };
  guard?: () => boolean;
}

const DQ_CATEGORY_OPTIONS = [
  {
    value: "IR-1",
    label: "IR-1",
  },
  {
    value: "IR-5",
    label: "IR-5",
  },
];

export const DqRecordingTool: React.FC<DqRecordingToolProps> = ({
  dqState,
  actions,
  guard,
}) => {
  const {
    dqSaved,
    setDqSaved,
    dqDate,
    setDqDate,
    dqCategory,
    setDqCategory,
    dqCountry,
  } = dqState;

  const [isSaving, setIsSaving] = React.useState(false);

  // Select IR-1 by default when no category has been saved.
  React.useEffect(() => {
    if (!dqCategory) {
      setDqCategory("IR-1");
    }
  }, [dqCategory, setDqCategory]);

  const selectedCategory = dqCategory || "IR-1";

  const handleSave = async () => {
    if (guard && !guard()) return;

    setIsSaving(true);

    try {
      await actions.updateMetadata({
        dqSaved: true,
        dqDate,
        dqCategory: selectedCategory,
        dqCountry,
      });

      setDqSaved(true);
    } catch (error) {
      console.error("Failed to save DQ information:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380">
      <div className="mb-[32px] flex flex-wrap gap-[7px]">
        <span className="rounded-full border border-[#e8d47a] bg-[#fffbec] px-[12px] py-[3px] text-[11px] font-semibold uppercase tracking-wider text-[#b38600]">
          Major Milestone
        </span>

        <span className="rounded-full border border-[#d0e4f7] bg-[#e8f1fb] px-[12px] py-[3px] text-[11px] font-semibold uppercase tracking-wider text-[#2d4a6e]">
          Tracking Active
        </span>

        <span className="rounded-full border border-[#c9bef2] bg-[#f3f0fb] px-[12px] py-[3px] text-[11px] font-semibold uppercase tracking-wider text-[#4a2d8a]">
          Dashboard Update
        </span>
      </div>

      <div className="relative mb-[18px] overflow-hidden rounded-[16px] bg-[#1a0a18] p-[22px_26px]">
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-[#b38600] via-[#f0d98a] to-transparent opacity-90" />

        <div className="mb-[5px] text-[10px] font-bold uppercase tracking-widest text-white/40">
          NVC — Documentary Qualification Received
        </div>

        <div className="mb-[6px] text-[22px] text-white/90">
          Your documents have been accepted by NVC
        </div>

        <div className="text-[13px] leading-[1.55] text-white/55">
          This is a significant milestone. Your case is now documentarily complete.
        </div>
      </div>

      {!dqSaved ? (
        <div className="mb-[14px] rounded-[16px] border-[1.5px] border-[#d0e4f7] bg-white p-[22px_24px]">
          <div className="mb-[16px] grid grid-cols-1 gap-[12px] sm:grid-cols-2">
            <input
              type="date"
              value={dqDate}
              max={new Date().toISOString().split("T")[0]}
              onChange={(event) => setDqDate(event.target.value)}
              className="min-h-[42px] w-full rounded-lg border-[1.5px] border-[#4A7772] bg-white px-3 py-2 text-[13.5px] font-semibold text-[#2E5450] outline-none transition-colors hover:border-[#3C6561] focus:ring-2 focus:ring-[#4A7772]/20"
            />

            <CustomDropdown
              value={selectedCategory}
              onChange={setDqCategory}
              options={DQ_CATEGORY_OPTIONS}
              placeholder="Select visa category"
              className="w-full"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !dqDate}
            className="w-full rounded-lg bg-primary py-3 font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Saving..." : "Save DQ & Activate Tracking"}
          </button>
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div>
            <div className="text-xs font-bold text-emerald-800">
              ✓ DQ Recorded ({dqDate})
            </div>

            <div className="mt-1 text-[11px] font-medium text-emerald-700">
              Category: {selectedCategory}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsSaving(false);
              setDqSaved(false);
            }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};
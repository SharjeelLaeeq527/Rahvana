"use client";

import React from "react";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";
import { IR5_ENABLED, IR2_ENABLED } from "@/lib/feature-flags";
import { useJourneyEnvironment } from "@/app/context/JourneyEnvironmentContext";

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
    dqPost?: string;
    setDqPost?: (value: string) => void;
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
  // IR-2 is hidden on production (see lib/feature-flags) until it launches.
  ...(IR2_ENABLED
    ? [
        {
          value: "IR-2",
          label: "IR-2",
        },
      ]
    : []),
  // IR-5 is hidden on production (see lib/feature-flags) until it launches.
  ...(IR5_ENABLED
    ? [
        {
          value: "IR-5",
          label: "IR-5",
        },
      ]
    : []),
  {
    value: "IR-2",
    label: "IR-2",
  },
];

export const DqRecordingTool: React.FC<DqRecordingToolProps> = ({ dqState, actions, guard }) => {
  const { dqSaved, setDqSaved, dqDate, setDqDate, dqCategory, setDqCategory, dqCountry } = dqState;
  const { journeyCategory } = useJourneyEnvironment();

  const [isSaving, setIsSaving] = React.useState(false);

  // Automatically default to the current journey's visa category (e.g. "IR-2", "IR-5", "IR-1")
  const effectiveCategory = dqCategory || journeyCategory || "IR-1";

  React.useEffect(() => {
    if (!dqCategory && journeyCategory) {
      setDqCategory(journeyCategory);
    }
  }, [dqCategory, journeyCategory, setDqCategory]);

  const handleSave = async () => {
    if (guard && !guard()) return;

    setIsSaving(true);

    try {
      await actions.updateMetadata({
        dqSaved: true,
        dqDate,
        dqCategory: effectiveCategory,
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
    <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col duration-380">
      <div className="mb-[32px] flex flex-wrap gap-[7px]">
        <span className="rounded-full border border-[#e8d47a] bg-[#fffbec] px-[12px] py-[3px] text-[11px] font-semibold tracking-wider text-[#b38600] uppercase">
          Major Milestone
        </span>

        <span className="rounded-full border border-[#d0e4f7] bg-[#e8f1fb] px-[12px] py-[3px] text-[11px] font-semibold tracking-wider text-[#2d4a6e] uppercase">
          Tracking Active
        </span>

        <span className="rounded-full border border-[#c9bef2] bg-[#f3f0fb] px-[12px] py-[3px] text-[11px] font-semibold tracking-wider text-[#4a2d8a] uppercase">
          Dashboard Update
        </span>
      </div>

      <div className="relative mb-[18px] overflow-hidden rounded-[16px] bg-[#1a0a18] p-[22px_26px]">
        <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-[#b38600] via-[#f0d98a] to-transparent opacity-90" />

        <div className="mb-[5px] text-[10px] font-bold tracking-widest text-white/40 uppercase">
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
              className="min-h-[42px] w-full rounded-lg border-[1.5px] border-[#4A7772] bg-white px-3 py-2 text-[13.5px] font-semibold text-[#2E5450] transition-colors outline-none hover:border-[#3C6561] focus:ring-2 focus:ring-[#4A7772]/20"
            />

            {journeyCategory ? (
              <div className="flex min-h-[42px] items-center justify-start rounded-lg border-[1.5px] border-[#d0e4f7] bg-[#f8fbff] px-3.5 py-2">
                <span className="text-[12px] font-medium text-slate-500">Category: </span>
                <span className="text-[13.5px] font-bold text-[#2d4a6e]"> {effectiveCategory}</span>
              </div>
            ) : (
              <CustomDropdown
                value={effectiveCategory}
                onChange={setDqCategory}
                options={DQ_CATEGORY_OPTIONS}
                placeholder="Select visa category"
                className="w-full"
                collapseWhenSingle
              />
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !dqDate}
            className="bg-primary hover:bg-primary/90 w-full rounded-lg py-3 font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Saving..." : "Save DQ & Activate Tracking"}
          </button>
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div>
            <div className="text-xs font-bold text-emerald-800">✓ DQ Recorded ({dqDate})</div>

            <div className="mt-1 text-[11px] font-medium text-emerald-700">
              Category: {effectiveCategory}
            </div>
          </div>

          <button
            type="button"
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

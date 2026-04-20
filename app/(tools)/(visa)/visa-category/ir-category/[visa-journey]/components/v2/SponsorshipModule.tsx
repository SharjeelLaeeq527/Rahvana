"use client";

import React from "react";
import { Calculator, Scale, ArrowRight } from "lucide-react";

interface SponsorshipModuleProps {
  sponsorshipResult: any;
  onOpenCalc: () => void;
  tool: any;
}

export const SponsorshipModule: React.FC<SponsorshipModuleProps> = ({
  sponsorshipResult,
  onOpenCalc,
  tool,
}) => {
  return (
    <div className="w-full">
      {/* Launch Module */}
      <div className="relative bg-[#0e1e38] rounded-[16px] border border-white/7 overflow-hidden mb-[28px] shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)]">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-[#3b7dd8] to-[#3b7dd8]/70 opacity-70" />
        <div className="p-[32px_34px_28px]">
          <div className="flex items-start gap-[16px] mb-[22px]">
            <div className="w-[46px] h-[46px] rounded-[11px] bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Calculator
                size={22}
                className="text-white/75"
                strokeWidth={1.6}
              />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-[4px]">
                {tool.launch_module.label || "Affidavit Support Calculator"}
              </div>
              <div className="text-[clamp(19px,2.8vw,23px)] text-white/90 leading-[1.25]">
                {tool.launch_module.title ||
                  "Determine your sponsorship setup first"}
              </div>
            </div>
          </div>
          <div className="h-px bg-white/9 mb-[20px]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[9px] mb-[26px]">
            {tool.launch_module.features.map((feat: string, i: number) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-[10px] px-[13px] py-[11px] flex items-start gap-[9px]"
              >
                <div className="w-[5px] h-[5px] rounded-full bg-[#6aa8f0]/70 shrink-0 mt-[5px]" />
                <div className="text-[13px] text-white/55 leading-[1.4]">
                  {feat}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={onOpenCalc}
            className="inline-flex items-center justify-center gap-[10px] w-full p-[16px_28px] bg-[#3b7dd8] text-white border-none rounded-[12px] font-sans text-[15px] font-semibold cursor-pointer transition-all hover:bg-[#3b7dd8] hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_20px_rgba(47,111,212,0.35)]"
          >
            {tool.launch_module.buttonText || "Start Sponsorship Calculator"}
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="mb-[28px] w-full">
        <div className="text-[12px] font-semibold tracking-wide uppercase text-[#6b8097] mb-[12px]">
          Your Affidavit of Support Plan
        </div>
        {!sponsorshipResult || Object.keys(sponsorshipResult).length === 0 ? (
          <div className="bg-[#fafcff] border-[1.5px] border-dashed border-[#d0e4f7] rounded-[10px] p-[24px] text-center">
            <div className="text-[14px] text-[#6b8097] leading-[1.6]">
              Complete the sponsorship calculator to generate the correct
              affidavit forms for your case.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-[28px]">
            <div className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[10px] p-[20px] animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-[14px]">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#3b7dd8]">
                  Sponsorship Plan Summary
                </div>
                <div
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    sponsorshipResult.isEligible
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {sponsorshipResult.isEligible ? "Met" : "Shortfall"}
                </div>
              </div>
              <div className="flex flex-col gap-[6px]">
                {[
                  [
                    "Household Size",
                    `${sponsorshipResult?.householdSize || 0} persons`,
                  ],
                  [
                    "Required Income",
                    `$${(sponsorshipResult?.requiredIncome || 0).toLocaleString()}`,
                  ],
                  [
                    "Total Provided Income",
                    `$${(sponsorshipResult?.totalIncome || 0).toLocaleString()}`,
                  ],
                  [
                    "Sponsorship Breakdown",
                    `Primary ($${(sponsorshipResult?.primaryIncome || 0).toLocaleString()})${
                      sponsorshipResult?.hmIncome
                        ? ` + HM ($${sponsorshipResult.hmIncome.toLocaleString()})`
                        : ""
                    }${sponsorshipResult?.jsIncome ? ` + JS ($${sponsorshipResult.jsIncome.toLocaleString()})` : ""}`,
                  ],
                ].map(([k, v], i) => (
                  <div
                    key={i}
                    className="flex justify-between items-start py-[6px] border-b border-[#d0e4f7]/50 last:border-b-0 text-[13px]"
                  >
                    <span className="text-[#6b8097]">{k}</span>
                    <span className="text-[#0c1b33] font-semibold text-right max-w-[60%]">
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-[10px]">
              <div className="text-[11px] font-bold text-[#6b8097] uppercase tracking-wider px-1">
                Required Forms
              </div>
              {sponsorshipResult?.forms?.map((f: any, i: number) => {
                const visaId =
                  f.id ||
                  f.name
                    .match(/(?:Form\s+)?([A-Z]+-\d+[A-Z]?)/i)?.[1]
                    ?.replace(/[^a-zA-Z0-9]/g, "")
                    .toLowerCase();

                return (
                  <div
                    key={i}
                    onClick={() =>
                      window.open(f.url, "_blank", "noopener,noreferrer")
                    }
                    className="group flex items-center justify-between p-4 bg-white border border-[#d0e4f7] rounded-xl hover:border-[#3b7dd8] transition-all cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#e8f1fb] text-[#3b7dd8] flex items-center justify-center">
                        <Scale size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#0c1b33]">
                          {f.name}
                        </div>
                        <div className="text-xs text-[#6b8097]">
                          {f.description || f.sub}
                        </div>
                      </div>
                    </div>

                    {visaId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/visa-forms/${visaId}/wizard`, "_blank");
                        }}
                        className="inline-flex items-center justify-center gap-[6px] px-3.5 py-2 bg-primary text-white border-none rounded-[10px] text-xs font-bold cursor-pointer transition-all hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_12px_rgba(59,125,216,0.25)]"
                      >
                        Launch <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-5 text-[11.5px] text-[#6b8097] leading-[1.65] text-center pt-[8px]">
              Form actions are based on your calculator result.
              <strong
                className="text-[#3b7dd8] cursor-pointer"
                onClick={onOpenCalc}
              >
                {" "}
                Rerun calculator{" "}
              </strong>
              if the sponsorship structure changes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

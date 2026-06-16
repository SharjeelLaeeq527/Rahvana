"use client";

import React from "react";
import { X, CheckCircle2, ArrowRight } from "lucide-react";
import { useToast } from "@/app/components/shared/ToastProvider";
import { POLIO_CERTIFICATE_DATA } from "../PolioCertificateData";

interface PolioCertificateToolProps {
  state: any;
  actions: any;
  polioState: {
    polioLaunched: boolean;
    setPolioLaunched: (v: boolean) => void;
    isPolioGuideOpen: boolean;
    setIsPolioGuideOpen: (v: boolean) => void;
    polioGuideStep: number;
    setPolioGuideStep: (v: any) => void;
    polioChecks: boolean[];
    setPolioChecks: (v: boolean[]) => void;
  };
  guard?: () => boolean;
}

export const PolioCertificateTool: React.FC<PolioCertificateToolProps> = ({
  actions,
  polioState,
  guard,
}) => {
  const {
    polioLaunched,
    setPolioLaunched,
    isPolioGuideOpen,
    setIsPolioGuideOpen,
    polioGuideStep,
    setPolioGuideStep,
    polioChecks,
    setPolioChecks,
  } = polioState;
  const [isSaving, setIsSaving] = React.useState(false);
  const { showToast } = useToast();
  const data = POLIO_CERTIFICATE_DATA;

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380">
      <div className="flex gap-1.5 flex-wrap mb-8">
        {data.chips.map((chip: any, i: number) => (
          <span
            key={i}
            className={`text-[10px] font-bold uppercase tracking-[0.06em] px-3 py-1.5 rounded-full border ${chip.type === "med" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-amber-50 text-amber-700 border-amber-100"}`}
          >
            {chip.label}
          </span>
        ))}
      </div>

      <div className="relative bg-[#0e1e38] rounded-2xl border border-white/5 shadow-2xl p-8 mb-4">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-teal-500 via-amber-400 to-transparent opacity-75" />
        <div className="text-[10px] font-black tracking-widest uppercase text-white/30 mb-1">
          {data.launchModule.eyebrow}
        </div>
        <div className="text-xl text-white/95 font-bold mb-6">{data.launchModule.heading}</div>
        <button
          onClick={() => {
            if (guard && !guard()) return;
            setPolioGuideStep(0);
            setIsPolioGuideOpen(true);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          {polioLaunched
            ? data.launchModule.buttonLabels.completed
            : data.launchModule.buttonLabels.initial}
          {polioLaunched ? <CheckCircle2 size={18} /> : <ArrowRight size={18} />}
        </button>
      </div>

      <div className="bg-white border-[1.5px] border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="text-sm font-bold mb-4">{data.completionCard.title}</div>
        <div className="flex flex-col gap-3">
          {data.completionCard.items.map((item: string, i: number) => (
            <label
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${polioChecks[i] ? "bg-primary/10 border-primary/50" : "hover:bg-slate-50 border-transparent"}`}
            >
              <input
                type="checkbox"
                checked={polioChecks[i]}
                onChange={async () => {
                  if (guard && !guard()) return;
                  const next = [...polioChecks];
                  next[i] = !next[i];
                  setPolioChecks(next);
                  await actions.updateMetadata({ polio_checks: next });
                }}
                className="mt-1 accent-primary"
              />
              <span
                className={`text-xs leading-tight ${polioChecks[i] ? "text-primary font-bold" : "text-slate-600"}`}
              >
                {item}
              </span>
            </label>
          ))}
        </div>
      </div>

      {isPolioGuideOpen && (
        <div className="fixed inset-0 z-200 bg-white flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-6 border-b flex items-center gap-4">
            <button
              onClick={() => setIsPolioGuideOpen(false)}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <X size={20} className="text-slate-600" />
            </button>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{
                  width: `${((polioGuideStep + 1) / data.guideSteps.length) * 100}%`,
                }}
              />
            </div>
            <div className="text-xs font-bold text-slate-400">
              {polioGuideStep + 1} / {data.guideSteps.length}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center">
            <div className="w-full max-w-lg">
              <div className="text-[10px] font-bold text-primary uppercase mb-2">
                Step {polioGuideStep + 1} — {data.guideSteps[polioGuideStep].label}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {data.guideSteps[polioGuideStep].heading}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-8">
                {data.guideSteps[polioGuideStep].instruction}
              </p>

              <div className="flex gap-3">
                {polioGuideStep > 0 && (
                  <button
                    onClick={() => setPolioGuideStep((v: number) => v - 1)}
                    className="p-4 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (polioGuideStep < data.guideSteps.length - 1) {
                      setPolioGuideStep((v: number) => v + 1);
                    } else {
                      setIsSaving(true);
                      try {
                        setPolioLaunched(true);
                        await actions.updateMetadata({
                          polio_launched: "true",
                        });
                        setIsPolioGuideOpen(false);
                        showToast("Guide completed!", "success");
                      } finally {
                        setIsSaving(false);
                      }
                    }
                  }}
                  disabled={isSaving}
                  className="flex-1 bg-primary text-white p-4 rounded-xl font-bold hover:bg-primary/80 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving
                    ? "Saving..."
                    : polioGuideStep === data.guideSteps.length - 1
                      ? "Finish Guide"
                      : "Next →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

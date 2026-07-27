import React from "react";
import { X, Info, ChevronLeft, ArrowRight } from "lucide-react";

interface MedicalExamGuideOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  medicalGuideIdx: number;
  setMedicalGuideIdx: (idx: number) => void;
  currentStep: any;
}

export const MedicalExamGuideOverlay: React.FC<MedicalExamGuideOverlayProps> = ({
  isOpen,
  onClose,
  medicalGuideIdx,
  setMedicalGuideIdx,
  currentStep,
}) => {
  if (!isOpen || currentStep?.tool_data?.type !== "medical_exam_guide") return null;

  const s = (currentStep.tool_data as any).tutorial[medicalGuideIdx];
  const isFirst = medicalGuideIdx === 0;
  const isLast = medicalGuideIdx === (currentStep.tool_data as any).tutorial.length - 1;

  return (
    <div className="fixed inset-0 z-200 bg-white flex flex-col animate-in slide-in-from-bottom duration-280 font-sans">
      {/* Topbar */}
      <div className="flex items-center p-[18px_24px] border-b border-[#d0e4f7] gap-[16px] shrink-0">
        <button
          onClick={onClose}
          className="w-[36px] h-[36px] rounded-full bg-[#f4f7fb] flex items-center justify-center transition-colors hover:bg-sky-100 group"
        >
          <X size={16} strokeWidth={2} className="text-[#3a4f63] group-hover:text-[#1c2b3a]" />
        </button>
        <div className="flex-1 h-1.25 bg-[#d0e4f7] rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-primary to-primary/70 transition-all duration-400"
            style={{
              width: `${((medicalGuideIdx + 1) / (currentStep.tool_data as any).tutorial.length) * 100}%`,
            }}
          />
        </div>
        <div className="text-[12px] font-medium text-[#6b8097] shrink-0">
          {medicalGuideIdx + 1} / {(currentStep.tool_data as any).tutorial.length}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center p-[48px_24px_40px]">
        <div className="w-full max-w-[580px] flex flex-col">
          <div className="text-[11px] font-bold tracking-widest uppercase text-primary mb-[14px]">
            Medical Exam Guide · {s.label}
          </div>
          <h2 className="text-[clamp(20px,3.2vw,26px)] text-[#0c1b33] mb-[8px] leading-[1.3]">
            {s.heading}
          </h2>
          <p className="text-[14px] text-[#3a4f63] leading-[1.7] mb-[22px]">{s.instruction}</p>

          <div className="w-full border-[1.5px] border-[#d0e4f7] rounded-xl overflow-hidden mb-[18px] bg-[#f4f7fb] shadow-sm">
            <div className="bg-[#eef3fa] border-b border-[#d0e4f7] p-[10px_14px] flex items-center gap-[6px]">
              <div className="w-[9px] h-[9px] rounded-full bg-red-400" />
              <div className="w-[9px] h-[9px] rounded-full bg-amber-400" />
              <div className="w-[9px] h-[9px] rounded-full bg-emerald-400" />
              <div className="ml-auto text-[10px] font-bold uppercase tracking-[0.07em] text-[#6b8097]">
                {s.vlabel}
              </div>
            </div>
            <div
              className="p-[18px] medical-mock-visual"
              dangerouslySetInnerHTML={{ __html: s.visual }}
            />
          </div>

          {s.note && (
            <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-lg p-[11px_14px] flex gap-2.5 mb-[18px]">
              <Info size={16} className="text-[#8a6200] shrink-0 mt-[2px]" />
              <span className="text-[13px] text-[#8a6200] leading-[1.55]">{s.note}</span>
            </div>
          )}

          <div className="flex gap-[10px]">
            {!isFirst && (
              <button
                onClick={() => setMedicalGuideIdx(medicalGuideIdx - 1)}
                className="p-[12px_20px] bg-white border-[1.5px] border-[#d0e4f7] rounded-lg text-[14px] font-medium text-[#3a4f63] hover:border-[#3a4f63] transition-all flex items-center gap-2"
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) {
                  onClose();
                } else {
                  setMedicalGuideIdx(medicalGuideIdx + 1);
                }
              }}
              className={`flex-1 p-[12px_20px] text-white border-none rounded-lg text-[14px] font-bold transition-all flex items-center justify-center gap-2 ${
                isLast ? "bg-[#15744f] hover:bg-[#0e5c3c]" : "bg-primary hover:bg-primary/90"
              }`}
            >
              {isLast ? (
                "Done — return to step"
              ) : (
                <>
                  Next <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

"use client";
// Generic tutorial overlay for status guides (used for 'What does this status mean?')
export const GuideTutorialOverlay: React.FC<TutorialOverlayProps> = (props) => {
  const s = props.tutorial[props.index];
  return (
    <TutorialShell {...props} title={props.title || s.heading}>
      <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-3.5">{props.title || s.label}</div>
      <h2 className="text-[clamp(20px,3.2vw,26px)] text-[#0c1b33] leading-tight mb-2">{s.heading}</h2>
      <p className="text-[14px] text-[#3a4f63] leading-relaxed mb-[18px]" dangerouslySetInnerHTML={{ __html: s.instruction }} />
      <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[10px] overflow-hidden mb-[18px] shadow-[0_2px_12px_rgba(12,27,51,0.06)]">
        <div className="bg-[#eef3fa] border-b border-[#d0e4f7] p-[10px_14px] flex items-center gap-1.5">
          <div className="w-[9px] h-[9px] rounded-full bg-[#f87171]" /><div className="w-[9px] h-[9px] rounded-full bg-[#fbbf24]" /><div className="w-[9px] h-[9px] rounded-full bg-[#34d399]" />
          <div className="text-[10px] font-semibold tracking-[0.07em] uppercase text-[#6b8097] ml-auto">{s.url}</div>
        </div>
        <div className="p-[18px] leading-relaxed">
          <div className="text-[10px] font-bold uppercase text-[#2f6fd4] mb-1">{s.ssLabel || s.kicker}</div>
          <div className="text-[15px] font-bold text-[#0c1b33] mb-1">{s.ssHeadline || s.head}</div>
          <div className="text-[13px] text-[#3a4f63] mb-2">{s.ssDesc || s.copy}</div>
          {(s.ssHighlight || s.highlight) && <div className="text-[13px] font-semibold text-[#2f6fd4] px-3 py-2 bg-[#2f6fd4]/10 border border-[#2f6fd4]/20 rounded-lg mb-2">{s.ssHighlight || s.highlight}</div>}
          <div className="flex gap-2 flex-wrap mb-2">{s.pills && s.pills.map((p:string, i:number) => <span key={i} className="inline-block px-3 py-1 rounded-full bg-[#f4f7fb] border border-[#d0e4f7] text-[#6b8097] text-[11px] font-bold uppercase tracking-wide whitespace-nowrap">{p}</span>)}</div>
        </div>
      </div>
      {s.note && <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[11px_14px] text-[13px] text-[#8a6200] leading-relaxed mb-[24px]">{s.note}</div>}
    </TutorialShell>
  );
};

import React, { useEffect } from "react";
import { X, ChevronLeft, ArrowRight } from "lucide-react";

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  tutorial: any[];
  index: number;
  setIndex: (idx: number) => void;
  title?: string;
}

const TutorialShell: React.FC<TutorialOverlayProps & { children: React.ReactNode }> = ({
  isOpen,
  onClose,
  tutorial,
  index,
  setIndex,
  title,
  children,
}) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen || !tutorial) return null;

  const total = tutorial.length;
  const progress = ((index + 1) / total) * 100;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <div className="fixed inset-0 z-500 flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out font-sans">
      <div className="flex items-center px-4 sm:px-6 md:px-8 py-[18px] border-b border-[#d0e4f7] gap-4 shrink-0 bg-white">
        <button onClick={onClose} className="w-9 h-9 rounded-full border-none bg-[#f4f7fb] cursor-pointer flex items-center justify-center hover:bg-[#e8f1fb] transition-colors shrink-0">
          <X size={16} strokeWidth={2} className="text-[#3a4f63]" />
        </button>
        <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-400 ease-in-out" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
          {index + 1} / {total}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center px-4 sm:px-6 md:px-8 py-8 sm:py-12">
        <div className="w-full max-w-[95vw] sm:max-w-[600px] md:max-w-[650px] flex flex-col min-h-full">
          {children}
          <div className="mt-auto pt-6 flex flex-col sm:flex-row gap-2.5">
            {!isFirst && (
              <button onClick={() => setIndex(index - 1)} className="p-[12px_20px] bg-transparent border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] font-medium text-[#3a4f63] cursor-pointer transition-all hover:border-[#3a4f63]">
                ← Back
              </button>
            )}
            <button
              onClick={() => isLast ? onClose() : setIndex(index + 1)}
              className={`flex-1 p-[12px_20px] rounded-[10px] text-[14px] font-semibold cursor-pointer transition-all hover:-translate-y-px active:translate-y-0
                ${isLast ? "bg-[#15744f] text-white hover:bg-[#0e5c3c]" : "bg-primary text-white hover:bg-primary/80 shadow-[0_4px_12px_rgba(47,111,212,0.2)]"}
              `}
            >
              {isLast ? "Done — return to step" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MedicalTutOverlay: React.FC<TutorialOverlayProps> = (props) => {
  const s = props.tutorial[props.index];
  return (
    <TutorialShell {...props} title="Medical Exam Guide">
      <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-3.5">Medical Exam Guide · {s.label}</div>
      <h2 className="text-[clamp(20px,3.2vw,26px)] text-[#0c1b33] leading-tight mb-2">{s.heading}</h2>
      <p className="text-[14px] text-[#3a4f63] leading-relaxed mb-[18px]">{s.instruction}</p>
      <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[10px] overflow-hidden mb-[18px] shadow-[0_2px_12px_rgba(12,27,51,0.06)]">
        <div className="bg-[#eef3fa] border-b border-[#d0e4f7] p-[10px_14px] flex items-center gap-1.5">
          <div className="w-[9px] h-[9px] rounded-full bg-[#f87171]" /><div className="w-[9px] h-[9px] rounded-full bg-[#fbbf24]" /><div className="w-[9px] h-[9px] rounded-full bg-[#34d399]" />
          <div className="text-[10px] font-semibold tracking-[0.07em] uppercase text-[#6b8097] ml-auto">{s.vlabel}</div>
        </div>
        <div className="p-[18px] leading-relaxed" dangerouslySetInnerHTML={{ __html: s.visual }} />
      </div>
      {s.note && <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[11px_14px] text-[13px] text-[#8a6200] leading-relaxed mb-[24px]">{s.note}</div>}
    </TutorialShell>
  );
};

export const CourierTutOverlay: React.FC<TutorialOverlayProps> = (props) => {
  const s = props.tutorial[props.index];
  return (
    <TutorialShell {...props} title="Courier Registration Guide">
      <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-3.5">Courier Registration Guide · {s.label}</div>
      <h2 className="text-[clamp(20px,3.2vw,26px)] text-[#0c1b33] leading-tight mb-2">{s.heading}</h2>
      <p className="text-[14px] text-[#3a4f63] leading-relaxed mb-[18px]">{s.instruction}</p>
      <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[10px] overflow-hidden mb-[18px] shadow-[0_2px_12px_rgba(12,27,51,0.06)]">
        <div className="bg-[#eef3fa] border-b border-[#d0e4f7] p-[10px_14px] flex items-center gap-1.5">
          <div className="w-[9px] h-[9px] rounded-full bg-[#f87171]" /><div className="w-[9px] h-[9px] rounded-full bg-[#fbbf24]" /><div className="w-[9px] h-[9px] rounded-full bg-[#34d399]" />
          <div className="text-[10px] font-semibold tracking-[0.07em] uppercase text-[#6b8097] ml-auto">{s.vlabel}</div>
        </div>
        <div className="p-[18px] leading-relaxed courier-mock-visual" dangerouslySetInnerHTML={{ __html: s.visual }} />
      </div>
      {s.note && <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[11px_14px] text-[13px] text-[#8a6200] leading-relaxed mb-[24px]">{s.note}</div>}
    </TutorialShell>
  );
};

export const InterviewDayTutOverlay: React.FC<TutorialOverlayProps> = (props) => {
  const s = props.tutorial[props.index];
  return (
    <TutorialShell {...props} title="Interview Day Guide">
      <div className="text-[11px] font-bold tracking-widest uppercase text-primary mb-3.5">Interview Day Guide · {s.label}</div>
      <h2 className="text-[clamp(20px,3.2vw,26px)] text-[#0c1b33] leading-tight mb-2">{s.heading}</h2>
      <p className="text-[14px] text-[#3a4f63] leading-relaxed mb-[18px]">{s.instruction}</p>
      <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[10px] overflow-hidden mb-[18px] shadow-[0_2px_12px_rgba(12,27,51,0.06)]">
        <div className="bg-[#eef3fa] border-b border-[#d0e4f7] p-[10px_14px] flex items-center gap-1.5">
          <div className="w-[9px] h-[9px] rounded-full bg-[#f87171]" /><div className="w-[9px] h-[9px] rounded-full bg-[#fbbf24]" /><div className="w-[9px] h-[9px] rounded-full bg-[#34d399]" />
          <div className="text-[10px] font-semibold tracking-[0.07em] uppercase text-[#6b8097] ml-auto">{s.vlabel}</div>
        </div>
        <div className="p-[18px] leading-relaxed courier-mock-visual" dangerouslySetInnerHTML={{ __html: s.visual }} />
      </div>
      {s.note && <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[11px_14px] text-[13px] text-[#8a6200] leading-relaxed mb-[24px]">{s.note}</div>}
    </TutorialShell>
  );
};

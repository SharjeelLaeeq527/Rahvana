import React from "react";
import { X, Check, ChevronLeft } from "lucide-react";
import { useToast } from "@/app/components/shared/ToastProvider";

interface GatheringGuideOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGatheringItem: any;
  gatheringStatus: Record<string, string>;
  setGatheringStatus: (val: any) => void;
  actions: {
    updateMetadata: (data: Record<string, unknown>) => void;
  };
}

export const GatheringGuideOverlay: React.FC<GatheringGuideOverlayProps> = ({
  isOpen,
  onClose,
  selectedGatheringItem,
  gatheringStatus,
  setGatheringStatus,
  actions,
}) => {
  const { showToast } = useToast();

  if (!isOpen || !selectedGatheringItem) return null;

  return (
    <div className="fixed inset-0 z-100 flex flex-col animate-in slide-in-from-bottom duration-260 ease-[cubic-bezier(0.4,0,0.2,1)] font-sans bg-white">
      {/* Guide Topbar */}
      <div className="flex items-center px-2 sm:px-4 md:px-8 py-[18px] border-b border-[#d0e4f7] gap-[16px] shrink-0">
        <button
          onClick={onClose}
          className="w-[36px] h-[36px] rounded-full bg-[#f4f7fb] flex items-center justify-center transition-colors hover:bg-[#d0e4f7] group"
        >
          <X size={16} strokeWidth={2} className="text-[#3a4f63] group-hover:text-[#1c2b3a]" />
        </button>
        <div className="flex-1 h-1.25 bg-[#d0e4f7] rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-primary to-primary/70 rounded-full"
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* Guide Body */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center px-2 sm:px-4 md:px-8 py-8 sm:py-12">
        <div className="w-full max-w-[600px]">
          <div className="text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase text-[#2f6fd4] mb-[16px]">
            Step 4 · Original Documents Checklist
          </div>
          <h2 className="text-[clamp(18px,4vw,26px)] sm:text-[clamp(20px,3vw,26px)] text-[#0c1b33] mb-[8px] leading-[1.25] break-words">
            {selectedGatheringItem.title}
          </h2>
          <p className="text-[13px] sm:text-[14px] text-[#3a4f63] mb-[22px] leading-[1.6] break-words">
            {selectedGatheringItem.sub}
          </p>

          {/* Document Sections */}
          <div className="flex flex-col gap-[12px] mb-[24px]">
            {selectedGatheringItem.sections.map((sec: any, i: number) => (
              <div
                key={i}
                className="bg-[#f4f7fb] border border-[#d0e4f7] rounded-[16px] p-4 sm:p-[18px_20px]"
              >
                <div className="text-[11px] sm:text-[12px] font-[700] tracking-[0.06em] uppercase text-[#6b8097] mb-[8px]">
                  {sec.t}
                </div>
                <div
                  className="text-[13px] sm:text-[14px] text-[#3a4f63] leading-[1.7] prose-sm break-words"
                  dangerouslySetInnerHTML={{ __html: sec.c }}
                />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-[10px] mt-[24px]">
            <button
              onClick={() => {
                const isRev = gatheringStatus[selectedGatheringItem.id] === "reviewed";
                if (isRev) return;
                const next = {
                  ...gatheringStatus,
                  [selectedGatheringItem.id]: "reviewed",
                };
                setGatheringStatus(next as any);
                actions.updateMetadata({
                  gathering_status: JSON.stringify(next),
                });
                onClose();
                showToast("Document marked as packed!", "success");
              }}
              disabled={gatheringStatus[selectedGatheringItem.id] === "reviewed"}
              className="p-[14px_24px] bg-[#15744f] text-white border-none rounded-[16px] text-[14px] sm:text-[15px] font-semibold transition-all hover:bg-[#0e5c3c] hover:-translate-y-[1px] active:translate-y-0 disabled:bg-[#d0e4f7] disabled:text-[#6b8097] disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {gatheringStatus[selectedGatheringItem.id] === "reviewed" ? (
                <>
                  <Check size={18} strokeWidth={2.5} /> Marked as packed
                </>
              ) : (
                "Mark as packed"
              )}
            </button>
            <button
              onClick={onClose}
              className="p-[13px_24px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[16px] text-[13px] sm:text-[14px] font-[500] transition-all hover:border-[#3a4f63] hover:text-[#1c2b3a] flex items-center justify-center gap-2"
            >
              <ChevronLeft size={16} /> Back to checklist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

"use client";

import React from "react";
import NextImage from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Clock,
  Download,
  Trash2,
  X,
  CheckCircle,
  Camera,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { PassportPhotoItem } from "@/types/passport-photo";

interface PassportPhotoHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: PassportPhotoItem[];
  activePhotoId?: string | null;
  onSelectPhoto: (photo: PassportPhotoItem) => void;
  onDownloadPhoto: (photo: PassportPhotoItem) => void;
  onRequestDeletePhoto: (photo: PassportPhotoItem) => void;
  onRequestClearAll: () => void;
  isJourney?: boolean;
}

export function PassportPhotoHistoryModal({
  open,
  onOpenChange,
  history,
  activePhotoId,
  onSelectPhoto,
  onDownloadPhoto,
  onRequestDeletePhoto,
  onRequestClearAll,
  isJourney = false,
}: PassportPhotoHistoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95%] bg-background overflow-hidden rounded-2xl sm:rounded-3xl p-0 border border-slate-200/80 shadow-2xl">
      <div className="relative w-full min-w-0 overflow-hidden p-3 sm:p-6">
        
{/* Header */}
<div className="flex items-start justify-between gap-2 pb-4 border-b border-slate-100">
  {/* Title */}
  <div className="flex min-w-0 flex-1 items-start gap-2">
    <div className="shrink-0 rounded-xl bg-[#0d7377]/10 p-2 text-[#0d7377]">
      <Clock className="h-5 w-5" />
    </div>

    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <DialogTitle className="text-base font-bold text-slate-900 sm:text-xl">
          My Photo Album
        </DialogTitle>

        <span className="shrink-0 rounded-full border border-[#0d7377]/20 bg-[#0d7377]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0d7377] sm:px-2.5 sm:text-xs">
          {history.length} {history.length === 1 ? "photo" : "photos"}
        </span>
      </div>

      <DialogDescription className="mt-1 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
        {isJourney
          ? "Photos generated in this candidate journey are saved here."
          : "Your generated passport photos are saved here for quick preview and re-download."}
      </DialogDescription>
    </div>
  </div>

  {/* Actions - Always stay on the same row */}
  <div className="flex shrink-0 items-center gap-1.5">
    {history.length > 0 && (
      <button
        type="button"
        onClick={onRequestClearAll}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-rose-200 px-2 py-1.5 text-[10px] font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 sm:px-3 sm:text-xs"
        title="Clear all saved history"
      >
        <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        <span>Clear All</span>
      </button>
    )}

    <button
      type="button"
      onClick={() => onOpenChange(false)}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      title="Close modal"
      aria-label="Close modal"
    >
      <X className="h-5 w-5" />
    </button>
  </div>
</div>


          {/* Body */}
          <div className="mt-4">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
                  <Camera className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h4 className="text-base font-semibold text-slate-800">No saved photos yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  When you generate photos, they will be preserved here so you can download and reuse them at any time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[60vh] overflow-y-auto pr-1 py-1">
                {history.map((photo) => {
                  const isSelected = activePhotoId === photo.id;
                  const dateLabel = new Date(photo.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const timeLabel = new Date(photo.createdAt).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={photo.id}
                      className={`group relative flex flex-col rounded-xl border p-3 transition-all ${
                        isSelected
                          ? "border-[#0d7377] bg-teal-50/40 shadow-md ring-2 ring-[#0d7377]/20"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      {/* Photo Thumbnail */}
                      <div
                        onClick={() => {
                          onSelectPhoto(photo);
                          onOpenChange(false);
                        }}
                        className="relative aspect-square w-full cursor-pointer overflow-hidden rounded-lg bg-slate-100"
                        title="Click to preview this photo in main view"
                      >
                        <NextImage
                          src={photo.dataUrl}
                          alt={photo.presetName}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          unoptimized
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 rounded-full bg-[#0d7377] p-1 text-white shadow-md">
                            <CheckCircle className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Photo Details */}
                      <div className="mt-2.5 flex flex-col gap-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 truncate" title={photo.presetName}>
                            {photo.presetName}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium shrink-0">
                            {photo.width}×{photo.height}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {dateLabel} · {timeLabel}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => onDownloadPhoto(photo)}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#0d7377]/10 hover:bg-[#0d7377] hover:text-white py-1.5 text-xs font-semibold text-[#0d7377] transition-colors cursor-pointer"
                          title="Download photo"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDeletePhoto(photo)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete photo"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

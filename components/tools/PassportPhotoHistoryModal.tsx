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
        <div className="relative w-full overflow-hidden p-5 sm:p-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#0d7377]/10 text-[#0d7377]">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span>My Photo Album</span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#0d7377]/10 text-[#0d7377] border border-[#0d7377]/20">
                      {history.length} {history.length === 1 ? "photo" : "photos"}
                    </span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 mt-0.5">
                    {isJourney
                      ? "Photos generated in this candidate journey are saved here."
                      : "Your generated passport photos are saved here for quick preview and re-download."}
                  </DialogDescription>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={onRequestClearAll}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                  title="Clear all saved history"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Clear All</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                title="Close modal"
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
                  When you generate photos using your credits, they will be preserved here so you can download and reuse them at any time.
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

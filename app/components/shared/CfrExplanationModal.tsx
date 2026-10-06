"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  BookOpen,
  ExternalLink,
  Globe,
  UserX,
  ShieldCheck,
  FileText,
  X,
  AlertTriangle,
  Scale,
  ShieldAlert
} from "lucide-react";

interface CfrExplanationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CFR_208_CITATION_URL =
  "https://www.govinfo.gov/content/pkg/CFR-2025-title31-vol2/pdf/CFR-2025-title31-vol2-sec208-1.pdf";

export function CfrExplanationModal({ open, onOpenChange }: CfrExplanationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] w-[95%] max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-xl"
        aria-describedby="cfr-explanation-description"
      >
        {/* Header */}
        <div className="relative shrink-0 border-b border-slate-100 bg-white px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-base font-bold text-[#0f1f38] leading-snug">
                When can you skip online payment?
              </DialogTitle>
              <DialogDescription
                id="cfr-explanation-description"
                className="mt-1 text-xs text-slate-500 leading-relaxed"
              >
                Federal law allows USCIS to accept paper checks when online payment isn&apos;t
                genuinely possible for you.
              </DialogDescription>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="shrink-0 cursor-pointer rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-3">
          {/* Intro */}
          <p className="text-[13px] leading-relaxed text-slate-700">
            U.S. law normally requires federal agencies to collect fees electronically. But if
            paying online creates a genuine hardship for you, you may qualify to pay by paper check
            instead — and use <strong>Form G-1651</strong> to certify that.
          </p>

          {/* Two reason cards */}
          <div className="text-[12.5px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
            You may qualify if…
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {/* Location / Access */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Globe className="h-3.5 w-3.5" />
                </div>
                <span className="text-[13px] font-bold text-slate-800">Limited bank access</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                You live in a remote area or abroad where U.S. online payment systems aren&apos;t
                available to you.
              </p>
            </div>

            {/* Personal hardship */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <UserX className="h-3.5 w-3.5" />
                </div>
                <span className="text-[13px] font-bold text-slate-800">Personal hardship</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                A financial, physical, or technical situation makes it impossible for you to open
                or use an online bank account.
              </p>
            </div>

            {/* Security / other */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:col-span-2">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
                  <ShieldAlert className="h-3.5 w-3.5" />
                </div>
                <span className="text-[13px] font-bold text-slate-800">Special circumstances</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                National security or law enforcement needs, or other situations officially
                recognized by the U.S. Treasury.
              </p>
            </div>
          </div>

          {/* Source link */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">Source: 31 C.F.R. Part 208 (Treasury)</span>
            <a
              href={CFR_208_CITATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800"
            >
              View official regulation
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end border-t border-slate-100 bg-white px-5 py-3">
          <button
            onClick={() => onOpenChange(false)}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Got it
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

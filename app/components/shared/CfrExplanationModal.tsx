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
        className="flex max-h-[90vh] w-[95%] max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl"
        aria-describedby="cfr-explanation-description"
      >
        {/* Modal Header */}
        <div className="relative shrink-0 border-b border-slate-100 bg-white p-5 sm:px-6 sm:pt-6 sm:pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <div className="border-primary/20 bg-primary/10 text-primary mb-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase">
                  <BookOpen className="h-3 w-3" /> Federal Legal Citation
                </div>
                <DialogTitle className="text-lg leading-tight font-bold tracking-tight text-[#0f1f38] sm:text-xl">
                  31 C.F.R. Part 208 Explanation
                </DialogTitle>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="cursor-pointer rounded-full p-2 text-[#6b8097] transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <DialogDescription
            id="cfr-explanation-description"
            className="mt-2 text-xs leading-relaxed text-[#6b8097] sm:text-sm"
          >
            Department of the Treasury Regulation &bull; Management of Federal Agency Disbursements
            &amp; Fee Exemption
          </DialogDescription>
        </div>

        {/* Modal Body */}
        <div className="space-y-5 overflow-y-auto p-5 text-sm leading-relaxed text-slate-700 sm:px-7 sm:py-2">
          {/* Overview Callout */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 sm:p-4.5">
            <h4 className="mb-1.5 text-xs font-bold tracking-wider text-slate-500 uppercase">
              What is 31 C.F.R. Part 208?
            </h4>
            <p className="text-[13.5px] leading-relaxed text-slate-800">
              Under federal law (31 U.S.C. &sect; 3332 and <strong>31 C.F.R. Part 208</strong>), the
              U.S. government mandates that federal agencies collect fees electronically. However,
              under <strong>&sect; 208.4</strong>, the regulation provides statutory waivers when
              electronic payment creates an <strong>undue hardship</strong>.
            </p>
            <p className="mt-2 text-xs text-slate-600">
              USCIS uses <strong>Form G-1651</strong> (Exemption for Paper Fee Payment) to certify
              that you legally qualify for this exemption.
            </p>
          </div>

          {/* Undue Hardship Breakdown */}
          <div>
            <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-900 uppercase">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              What Qualifies as Undue Hardship under &sect; 208.4?
            </h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Infrastructure Barriers */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 transition-colors hover:bg-blue-50 sm:p-4">
                <div className="mb-1.5 flex items-center gap-2 text-sm font-bold text-blue-950">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <Globe className="h-3.5 w-3.5" />
                  </div>
                  Infrastructure Barriers
                </div>
                <p className="text-xs leading-relaxed text-blue-900/80">
                  Living in a remote region or a foreign country where local banking networks do not
                  support standard U.S. electronic payment methods.
                </p>
              </div>

              {/* Personal Barriers */}
              <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3.5 transition-colors hover:bg-purple-50 sm:p-4">
                <div className="mb-1.5 flex items-center gap-2 text-sm font-bold text-purple-950">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                    <UserX className="h-3.5 w-3.5" />
                  </div>
                  Personal Barriers
                </div>
                <p className="text-xs leading-relaxed text-purple-900/80">
                  Experiencing extreme financial, physical, or technical limitations that make it
                  impossible to open or manage an online bank account.
                </p>
              </div>
            </div>
          </div>

          {/* Other Permitted Exceptions */}
          {/* <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <h5 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Other Recognized Criteria on Form G-1651:
            </h5>
            <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
              <li>You do not have access to an account with a financial institution or electronic payment systems.</li>
              <li>Non-electronic transactions are necessary or desirable for national security or law enforcement reasons.</li>
              <li>Other special circumstances designated by the Secretary of the Treasury.</li>
            </ul>
          </div> */}

          {/* Packet Assembly Note */}
          {/* <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/60 text-xs text-teal-900 flex items-start gap-2.5">
            <FileText className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-teal-950">Important Packet Instructions:</strong> If you qualify and claim this fee exemption, place your completed and signed <strong>Form G-1651</strong> at the very top of your paper filing envelope before any petition forms.
            </div>
          </div> */}

          {/* Official GovInfo Citation Box */}
          <div className="border-t border-slate-100 pt-2">
            <div className="flex flex-col justify-between gap-3 rounded-xl bg-slate-900 p-3.5 text-white sm:flex-row sm:items-center">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-teal-400 uppercase">
                  <Scale className="h-3 w-3" /> Official Government Citation
                </div>
                <div className="text-xs text-slate-300">
                  U.S. Government Publishing Office (GovInfo) &bull; Title 31 CFR &sect; 208.1 /
                  Part 208
                </div>
              </div>
              <a
                href={CFR_208_CITATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-center text-xs font-bold text-white shadow-sm transition-all hover:bg-teal-500"
              >
                <span>Open GovInfo PDF</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-slate-50 p-4">
          <button
            onClick={() => onOpenChange(false)}
            className="cursor-pointer rounded-xl border border-slate-300 bg-white px-5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ShieldCheck, Check, Loader2, KeyRound } from "lucide-react";

interface ImportUscisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  sourceJourneyType?: string;
  onConfirm: () => Promise<void> | void;
  onDecline: () => void;
  loading?: boolean;
}

export function ImportUscisModal({
  open,
  onOpenChange,
  username,
  sourceJourneyType,
  onConfirm,
  onDecline,
  loading = false,
}: ImportUscisModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92%] max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-xl">
        {/* Subtle decorative top bar */}
        {/* <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-primary to-indigo-500" /> */}

        <div className="p-6">
          {/* Header Icon + Titles */}
          <div className="mb-4 flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-teal-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Use Existing USCIS Account?
                </DialogTitle>
              </div>
              <DialogDescription className="mt-1 text-xs leading-relaxed text-slate-500">
                USCIS accounts belong to the petitioner and can be shared across all your family
                visa petitions.
              </DialogDescription>
            </div>
          </div>

          {/* Account Details Card */}
          <div className="mb-5 rounded-xl border border-teal-200/80 bg-teal-50/50 p-4">
            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold tracking-wider text-teal-800 uppercase">
              <span>Saved USCIS Account</span>
              {sourceJourneyType && (
                <span className="rounded-md bg-teal-100/70 px-2 py-0.5 text-[10px] font-medium text-teal-600">
                  From {sourceJourneyType}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Username / Email</span>
                <span className="font-mono font-bold text-slate-800">{username}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Password & Questions</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <Check className="h-3 w-3 text-emerald-600" />
                  Ready to link
                </span>
              </div>
            </div>
          </div>

          <p className="mb-5 text-xs leading-normal text-slate-600">
            Would you like to load these credentials into this journey, or would you prefer to store
            new credentials?
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={onDecline}
              className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
            >
              No, Store New Credentials
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60 sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Yes, Use Saved Credentials</span>
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export default ImportUscisModal;

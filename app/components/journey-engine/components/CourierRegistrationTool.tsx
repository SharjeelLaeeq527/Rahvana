"use client";

import React, { useState } from "react";
import { Truck, ArrowRight, ExternalLink, Monitor, Lock, Upload, X } from "lucide-react";

interface CourierRegistrationToolProps {
  tool: any;
  courierCredentials: any;
  setCourierGuideIdx: (idx: number) => void;
  setIsCourierGuideOpen: (open: boolean) => void;
  setWalletPortalType: (type: "USCIS" | "NVC" | "COURIER") => void;
  setIsWalletViewOpen: (open: boolean) => void;
  setWalletMode: (mode: "add" | "edit") => void;
  setIsWalletFormOpen: (open: boolean) => void;
  guard?: () => boolean;
}

export const CourierRegistrationTool: React.FC<CourierRegistrationToolProps> = ({
  tool,
  courierCredentials,
  setCourierGuideIdx,
  setIsCourierGuideOpen,
  setWalletPortalType,
  setIsWalletViewOpen,
  setWalletMode,
  setIsWalletFormOpen,
  guard,
}) => {
  const [showPassportDeliveryModal, setShowPassportDeliveryModal] = useState(false);
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col font-sans duration-380">
      {/* Header Chips */}
      <div className="mb-8 flex flex-wrap items-center gap-[7px]">
        {["Courier Service", "Account Setup", "Portal Wallet"].map((label, i) => (
          <span
            key={i}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase ${
              i === 0
                ? "border-[#d0e4f7] bg-[#e8f1fb] text-[#2d4a6e]"
                : i === 1
                  ? "border-[#c9bef2] bg-[#f3f0fb] text-[#4a2d8a]"
                  : "border-[#a8d9be] bg-[#e8f5ef] text-[#15744f]"
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Launch Module */}
      <div className="relative mb-[16px] overflow-hidden rounded-[16px] border border-white/7 bg-[#0e1e38] shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)]">
        <div className="absolute top-0 right-0 left-0 h-[2px] bg-linear-to-r from-[#2f6fd4] via-[#6aa8f0] to-transparent opacity-70" />
        <div className="p-[30px_32px_26px]">
          <div className="mb-5 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/6 text-white/75">
              <Truck size={21} strokeWidth={1.6} />
            </div>
            <div>
              <div className="mb-1 text-[10px] font-bold tracking-[0.12em] text-white/35 uppercase">
                USVisaScheduling · Courier Registration
              </div>
              <h2 className="text-[clamp(18px,2.6vw,22px)] leading-[1.25] text-white/90">
                Create your courier delivery account
              </h2>
            </div>
          </div>
          <div className="mb-[18px] h-px bg-white/9" />
          <div className="mb-[22px] grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              "Register at usvisascheduling.com",
              "How would you like to receive your passport?",
              "Save your login credentials securely",
              "Save confirmation page to Document Vault",
            ].map((cue, i) => (
              <div
                key={i}
                onClick={i === 1 ? () => setShowPassportDeliveryModal(true) : undefined}
                className={`flex items-start gap-2 rounded-lg border border-white/10 bg-white/6 p-[10px_12px] ${
                  i === 1 ? "cursor-pointer transition-colors hover:bg-white/10" : ""
                }`}
              >
                <div className="mt-[5.5px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#6aa8f0]/70" />

                <span className="text-[13px] leading-[1.4] text-white/55">{cue}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              if (guard && !guard()) return;
              window.open("https://www.usvisascheduling.com/", "_blank", "noopener,noreferrer");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3b7dd8] p-4 font-bold text-white shadow-[0_4px_20px_rgba(47,111,212,0.35)] transition-all hover:-translate-y-0.5 hover:bg-[#3b7dd8] active:translate-y-0"
          >
            <span>Open Courier Registration</span>
            <ArrowRight size={16} />
          </button>
          <div
            className={`mt-3 flex items-center justify-center gap-[5px] text-center text-[12px] leading-[1.4] text-white/35 transition-colors duration-200`}
          >
            <ExternalLink size={11} strokeWidth={1.8} />
            <span>Opens the courier registration portal in a new tab</span>
          </div>
        </div>
      </div>

      {/* Secondary cards row */}
      <div className="mb-[18px] grid grid-cols-1 gap-[12px] sm:grid-cols-2">
        <button
          onClick={() => {
            if (guard && !guard()) return;
            setCourierGuideIdx(0);
            setIsCourierGuideOpen(true);
          }}
          className="hover:border-primary group flex cursor-pointer flex-col rounded-[16px] border-[1.5px] border-[#d0e4f7] bg-white p-5 text-left transition-all hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)]"
        >
          <div className="mb-3">
            <div className="flex h-[36px] w-[36px] items-center justify-center rounded-[9px] border border-[#c9bef2] bg-[#f3f0fb] text-[#4a2d8a]">
              <Monitor size={17} />
            </div>
          </div>
          <div className="mb-1 text-[14px] font-bold text-[#0c1b33]">
            Step-by-Step Sign-Up Guide
          </div>
          <div className="mb-3 text-[12px] leading-[1.5] text-[#6b8097]">
            Walkthrough of the courier registration sign-up process, account creation, selection,
            and confirmation.
          </div>
          <div className="text-primary mt-auto flex items-center gap-1 text-[12px] font-bold transition-all group-hover:gap-2">
            <span>View guide</span>
            <ArrowRight size={11} strokeWidth={2.5} />
          </div>
        </button>

        <button
          onClick={() => {
            if (guard && !guard()) return;
            if (courierCredentials) {
              setWalletPortalType("COURIER");
              setIsWalletViewOpen(true);
            } else {
              setWalletPortalType("COURIER");
              setWalletMode("add");
              setIsWalletFormOpen(true);
            }
          }}
          className={`hover:border-primary group flex cursor-pointer flex-col rounded-[16px] border-[1.5px] border-[#d0e4f7] bg-white p-5 text-left transition-all hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)] ${courierCredentials ? "border-[#a8d9be] bg-[#e8f5ef]/30" : ""}`}
        >
          <div className="mb-3">
            <div
              className={`h-[36px] w-[36px] rounded-[9px] ${courierCredentials ? "border-[#a8d9be] bg-[#e8f5ef] text-[#15744f]" : "border-[#a8d9be] bg-[#e8f5ef] text-[#15744f]"} flex items-center justify-center`}
            >
              <Lock size={17} />
            </div>
          </div>
          <div
            className={`text-[14px] font-bold ${courierCredentials ? "text-[#15744f]" : "text-[#0c1b33]"} mb-1`}
          >
            {courierCredentials ? "✓ Credentials Saved" : "Save Courier Credentials"}
          </div>
          <div className="mb-3 text-[12px] leading-[1.5] text-[#6b8097]">
            {courierCredentials
              ? "Courier account details stored in Portal Wallet."
              : "Store your courier account login securely in Rahvana's Portal Wallet."}
          </div>
          <div
            className={`mt-auto text-[12px] font-bold ${courierCredentials ? "text-[#15744f]" : "text-primary"} flex items-center gap-1 transition-all group-hover:gap-2`}
          >
            <span>{courierCredentials ? "View saved credentials" : "Open credential vault"}</span>
            <ArrowRight size={11} strokeWidth={2.5} />
          </div>
        </button>
      </div>

      {/* Saved Credentials View (Specific) */}
      {courierCredentials && (
        <div className="animate-in fade-in slide-in-from-top-1 mb-5 rounded-[10px] border-[1.5px] border-[#a8d9be] bg-[#e8f5ef] p-[16px_18px]">
          <div className="mb-[10px] text-[10px] font-bold tracking-[0.08em] text-[#15744f] uppercase">
            ✓ Credentials Saved, Courier Account
          </div>
          <div className="flex items-center justify-between border-b border-[#a8d9be]/50 py-1.5">
            <span className="text-[12px] font-medium text-[#3a4f63]">Email</span>
            <span className="font-mono text-[12px] font-bold text-[#0c1b33]">
              {courierCredentials.username}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-[#a8d9be]/50 py-1.5 last:border-none">
            <span className="text-[12px] font-medium text-[#3a4f63]">Password</span>
            <span className="font-mono text-[12px] font-bold text-[#0c1b33]">••••••••</span>
          </div>
          <div className="mt-3 flex flex-col gap-2.5">
            <button
              onClick={() => {
                if (guard && !guard()) return;
                setWalletPortalType("COURIER");
                setWalletMode("edit");
                setIsWalletFormOpen(true);
              }}
              className="text-primary inline-flex items-center gap-1 text-[12px] font-bold hover:underline"
            >
              Edit or update in Portal Wallet <ExternalLink size={11} strokeWidth={2.5} />
            </button>
            <a
              href="/document-vault"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#15744f] hover:underline"
            >
              <Upload size={12} strokeWidth={2.5} />
              Save confirmation page to Document Vault →
            </a>
          </div>
        </div>
      )}

      {showPassportDeliveryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={() => setShowPassportDeliveryModal(false)}
        >
          <div
            className="animate-in fade-in zoom-in-95 relative w-full max-w-[660px] rounded-[20px] border border-[#d0e4f7] bg-[#fafcff] p-5 shadow-xl duration-200 sm:p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={() => setShowPassportDeliveryModal(false)}
              className="absolute top-4 right-4 rounded-full p-1.5 text-[#6b8097] transition-colors hover:bg-[#eef5fb] hover:text-[#3a4f63]"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>

            {/* Header */}
            <div className="pr-8">
              <h3 className="text-[18px] font-bold text-[#263b4d] sm:text-[20px]">
                How would you like to receive your passport?
              </h3>

              <p className="mt-2 text-[13px] leading-relaxed text-[#6b8097]">
                Choose the passport delivery option that best suits you when registering through the
                visa scheduling portal.
              </p>
            </div>

            {/* Options */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-[16px] border border-[#d0e4f7] bg-white p-4">
                <h4 className="text-[14px] font-bold text-[#3a4f63]">Avari Tower</h4>

                <p className="mt-1.5 text-[12px] leading-relaxed text-[#6b8097]">
                  Pick up your passport from the designated collection location at Avari Tower.
                </p>
              </div>

              <div className="rounded-[16px] border border-[#d0e4f7] bg-white p-4">
                <h4 className="text-[14px] font-bold text-[#3a4f63]">Delivered at your home</h4>

                <p className="mt-1.5 text-[12px] leading-relaxed text-[#6b8097]">
                  Have your passport delivered directly to your home address.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tool.disclaimer && (
        <p className="mt-1 pt-[4px] text-center text-[11.5px] leading-[1.65] text-[#6b8097]">
          {tool.disclaimer}
        </p>
      )}
    </div>
  );
};

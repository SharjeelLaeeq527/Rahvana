"use client";

import React from "react";
import { Truck, ArrowRight, ExternalLink, Monitor, Lock, Upload } from "lucide-react";

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
  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380 font-sans">
      {/* Header Chips */}
      <div className="flex items-center gap-[7px] flex-wrap mb-8">
        {["Courier Service", "Account Setup", "Portal Wallet"].map((label, i) => (
          <span
            key={i}
            className={`text-[11px] font-semibold tracking-[0.06em] uppercase px-3 py-1.5 rounded-full border ${
              i === 0
                ? "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]"
                : i === 1
                  ? "bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]"
                  : "bg-[#e8f5ef] text-[#15744f] border-[#a8d9be]"
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Launch Module */}
      <div className="relative bg-[#0e1e38] rounded-[16px] border border-white/7 overflow-hidden mb-[16px] shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)]">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-[#2f6fd4] via-[#6aa8f0] to-transparent opacity-70" />
        <div className="p-[30px_32px_26px]">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-11 h-11 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center shrink-0 text-white/75">
              <Truck size={21} strokeWidth={1.6} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 mb-1">
                USVisaScheduling · Courier Registration
              </div>
              <h2 className="text-[clamp(18px,2.6vw,22px)]  text-white/90 leading-[1.25]">
                Create your courier delivery account
              </h2>
            </div>
          </div>
          <div className="h-px bg-white/9 mb-[18px]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-[22px]">
            {[
              "Register at usvisascheduling.com",
              "Select courier delivery for Pakistan",
              "Save your login credentials securely",
              "Save confirmation page to Document Vault",
            ].map((cue, i) => (
              <div
                key={i}
                className="bg-white/6 border border-white/10 rounded-lg p-[10px_12px] flex items-start gap-2"
              >
                <div className="w-[5px] h-[5px] rounded-full bg-[#6aa8f0]/70 shrink-0 mt-[5.5px]" />
                <span className="text-[13px] text-white/55 leading-[1.4]">
                  {cue}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              if (guard && !guard()) return;
              window.open(
                "https://www.usvisascheduling.com/",
                "_blank",
                "noopener,noreferrer",
              );
            }}
            className="w-full p-4 bg-[#3b7dd8] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#3b7dd8] transition-all shadow-[0_4px_20px_rgba(47,111,212,0.35)] hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Open Courier Registration</span>
            <ArrowRight size={16} />
          </button>
          <div
            className={`flex items-center justify-center gap-[5px] mt-3 text-[12px] text-center leading-[1.4] transition-colors duration-200 text-white/35`}
          >
            <ExternalLink size={11} strokeWidth={1.8} />
            <span>Opens the courier registration portal in a new tab</span>
          </div>
        </div>
      </div>

      {/* Secondary cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] mb-[18px]">
        <button
          onClick={() => {
            if (guard && !guard()) return;
            setCourierGuideIdx(0);
            setIsCourierGuideOpen(true);
          }}
          className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-5 cursor-pointer transition-all hover:border-primary hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)] hover:-translate-y-px text-left flex flex-col group"
        >
          <div className="mb-3">
            <div className="w-[36px] h-[36px] rounded-[9px] bg-[#f3f0fb] border border-[#c9bef2] flex items-center justify-center text-[#4a2d8a]">
              <Monitor size={17} />
            </div>
          </div>
          <div className="text-[14px] font-bold text-[#0c1b33] mb-1">
            Step-by-Step Sign-Up Guide
          </div>
          <div className="text-[12px] text-[#6b8097] leading-[1.5] mb-3">
            Walkthrough of the courier registration sign-up process — account
            creation, selection, and confirmation.
          </div>
          <div className="mt-auto text-[12px] font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
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
          className={`bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-5 cursor-pointer transition-all hover:border-primary hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)] hover:-translate-y-px text-left flex flex-col group ${courierCredentials ? "border-[#a8d9be] bg-[#e8f5ef]/30" : ""}`}
        >
          <div className="mb-3">
            <div
              className={`w-[36px] h-[36px] rounded-[9px] ${courierCredentials ? "bg-[#e8f5ef] border-[#a8d9be] text-[#15744f]" : "bg-[#e8f5ef] border-[#a8d9be] text-[#15744f]"} flex items-center justify-center`}
            >
              <Lock size={17} />
            </div>
          </div>
          <div
            className={`text-[14px] font-bold ${courierCredentials ? "text-[#15744f]" : "text-[#0c1b33]"} mb-1`}
          >
            {courierCredentials ? "✓ Credentials Saved" : "Save Courier Credentials"}
          </div>
          <div className="text-[12px] text-[#6b8097] leading-[1.5] mb-3">
            {courierCredentials
              ? "Courier account details stored in Portal Wallet."
              : "Store your courier account login securely in Rahvana's Portal Wallet."}
          </div>
          <div
            className={`mt-auto text-[12px] font-bold ${courierCredentials ? "text-[#15744f]" : "text-primary"} flex items-center gap-1 group-hover:gap-2 transition-all`}
          >
            <span>
              {courierCredentials ? "View saved credentials" : "Open credential vault"}
            </span>
            <ArrowRight size={11} strokeWidth={2.5} />
          </div>
        </button>
      </div>

      {/* Saved Credentials View (Specific) */}
      {courierCredentials && (
        <div className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[10px] p-[16px_18px] mb-5 animate-in fade-in slide-in-from-top-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#15744f] mb-[10px]">
            ✓ Credentials Saved — Courier Account
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-[#a8d9be]/50">
            <span className="text-[12px] text-[#3a4f63] font-medium">Email</span>
            <span className="text-[12px] text-[#0c1b33] font-bold font-mono">
              {courierCredentials.username}
            </span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-[#a8d9be]/50 last:border-none">
            <span className="text-[12px] text-[#3a4f63] font-medium">Password</span>
            <span className="text-[12px] text-[#0c1b33] font-bold font-mono">
              ••••••••
            </span>
          </div>
          <div className="flex flex-col gap-2.5 mt-3">
            <button
              onClick={() => {
                if (guard && !guard()) return;
                setWalletPortalType("COURIER");
                setWalletMode("edit");
                setIsWalletFormOpen(true);
              }}
              className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"
            >
              Edit or update in Portal Wallet{" "}
              <ExternalLink size={11} strokeWidth={2.5} />
            </button>
            <a
              href="https://www.rahvana.com/document-vault"
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

      {tool.disclaimer && (
        <p className="text-[11.5px] text-[#6b8097] leading-[1.65] text-center pt-[4px] mt-[8px]">
          {tool.disclaimer}
        </p>
      )}
    </div>
  );
};

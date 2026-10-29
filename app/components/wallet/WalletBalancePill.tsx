"use client";

import React from "react";
import { Coins, Plus } from "lucide-react";
import { useWallet } from "@/app/context/WalletContext";

/** Header badge: "[coin] 25 credits | +". Opens the top-up modal. */
export function WalletBalancePill({ tone = "default" }: { tone?: "default" | "hero" }) {
  const { balance, isLoading, error, openTopup } = useWallet();

  const label =
    balance !== null ? `${balance}` : isLoading ? "..." : error ? "--" : "0";
  const toneCls =
    tone === "hero"
      ? "border-white/40 bg-white/70 text-[#0d7377] hover:bg-white/90"
      : "border-[#0d7377]/20 bg-[#0d7377]/5 text-[#0d7377] hover:bg-[#0d7377]/10";

  return (
    <button
      type="button"
      onClick={() => openTopup()}
      title={balance !== null ? `Rahvana Wallet: ${balance} credits. Click to top up.` : "Rahvana Wallet"}
      aria-label={balance !== null ? `Wallet balance ${balance} credits. Top up` : "Open Rahvana Wallet"}
      className={`flex h-9 items-center gap-1.5 rounded-full border pr-1 pl-2.5 text-[13px] font-bold transition-colors ${toneCls}`}
    >
      <Coins className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="tabular-nums">{label}</span>
      <span className="hidden sm:inline font-medium opacity-80">credits</span>
      <span className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#0d7377] text-white">
        <Plus className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
      </span>
    </button>
  );
}

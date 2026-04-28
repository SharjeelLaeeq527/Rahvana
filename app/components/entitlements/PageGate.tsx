"use client";

import React, { useState } from "react";
import { Lock, Crown, ArrowRight } from "lucide-react";
import { usePlan } from "@/app/context/PlanContext";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import Link from "next/link";

interface PageGateProps {
  feature: string;
  children: React.ReactNode;
  /** Optional override for the title text on the lock screen */
  title?: string;
  /** Optional override for the description text on the lock screen */
  description?: string;
}

export function PageGate({ feature, children, title, description }: PageGateProps) {
  const plan = usePlan();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // If user has access or the feature is fully open, render normally
  if (plan.canUse(feature)) {
    return <>{children}</>;
  }

  // Otherwise, render the premium lock screen
  const cta = plan.upgradeCTA(feature) || "Upgrade Now";
  const hint = plan.lockHint(feature) || "Requires a higher plan";
  const targetTier = plan.entitlement(feature)?.upgradeTarget;

  const IconEl = targetTier === "executive" ? Crown : Lock;
  const iconColor = targetTier === "executive" ? "text-amber-500" : "text-primary";
  const bgColor = targetTier === "executive" ? "bg-amber-500/10 border-amber-500/20" : "bg-primary/10 border-primary/20";

  return (
    <div className="min-h-screen bg-[#fafcff] flex items-center justify-center p-6 relative overflow-hidden">
      {showUpgradeModal && (
        <UpgradeModal feature={feature} onClose={() => setShowUpgradeModal(false)} />
      )}

      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/3" />

      <div className="w-full max-w-md bg-white border border-[#d0e4f7] rounded-[24px] shadow-[0_20px_40px_rgba(12,27,51,0.05)] p-8 text-center relative z-10 animate-in zoom-in-95 duration-500">
        <div className="flex justify-center mb-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${bgColor}`}>
            <IconEl size={32} strokeWidth={2} className={iconColor} />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border mb-4 shadow-sm bg-slate-50 text-slate-500 border-slate-200">
          <Lock size={12} strokeWidth={2.5} />
          <span>Access Restricted</span>
        </div>

        <h1 className="text-2xl font-black text-[#0c1b33] mb-3 leading-tight">
          {title || "Upgrade Required"}
        </h1>

        <p className="text-[14px] text-[#6b8097] leading-relaxed mb-6">
          {description || "To access this feature, you need to upgrade your plan. This tool is not included in your current subscription."}
        </p>

        <p className="text-[12px] text-[#9aa5b1] mb-6">
          {hint}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowUpgradeModal(true)}
            className={`w-full py-3.5 rounded-xl text-[14px] font-bold shadow-md transition-all flex items-center justify-center gap-2 group ${
              targetTier === "executive" 
                ? "bg-[#0c1b33] text-white hover:bg-[#1a2b4a]" 
                : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            {cta}
            <ArrowRight size={16} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <Link 
            href="/dashboard"
            className="w-full py-3.5 rounded-xl text-[14px] font-bold text-[#6b8097] hover:bg-[#f4f7fb] hover:text-[#0c1b33] transition-colors border border-transparent hover:border-[#d0e4f7]"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

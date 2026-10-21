"use client";

import React, { useState } from "react";
import { Coins, Lock, ArrowRight } from "lucide-react";
import { usePlan } from "@/app/context/PlanContext";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/ui/spinner";

interface PageGateProps {
  feature: string;
  children: React.ReactNode;
  /** Optional override for the title text on the lock screen */
  title?: string;
  /** Optional override for the description text on the lock screen */
  description?: string;
  /** Force-unlock bypass — e.g. a standalone wallet unlock row grants access without a plan. */
  allow?: boolean;
  /** When set, the lock screen gains a primary "Unlock with N Credits" CTA and the upgrade CTA becomes secondary. */
  creditUnlock?: { credits: number; onUnlock: () => void };
}

export function PageGate({ feature, children, title, description, allow, creditUnlock }: PageGateProps) {
  const router = useRouter();
  const plan = usePlan();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // If plan is loading, show loading spinner instead of the restriction card
  // We wrap the loader in a solid bg-[#fafcff] screen with z-[9999] to completely mask
  // the header/footer during access verification for a cleaner, premium user experience.
  if (plan.isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#fafcff]">
        {/* Decorative background elements matching the restricted card screen */}
        <div className="bg-primary/5 pointer-events-none absolute top-0 right-0 h-96 w-96 translate-x-1/3 -translate-y-1/2 rounded-full blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 -translate-x-1/3 translate-y-1/2 rounded-full bg-purple-500/5 blur-[80px]" />

        <Loader size="lg" text="Loading..." subText="" />
      </div>
    );
  }

  // If user has access or the feature is fully open, render normally
  if (allow || plan.canUse(feature)) {
    return <>{children}</>;
  }

  // Otherwise, render the premium lock screen
  const cta = plan.upgradeCTA(feature) || "Upgrade Now";
  const hint = plan.lockHint(feature) || "Requires a higher plan";
  const ent = plan.entitlement(feature);
  const targetTier = ent?.upgradeTarget;
  // Only promise a one-time add-on when the feature actually has one.
  const canBuyAddon = (ent?.state === "locked_buy" || ent?.state === "limited") && !!ent?.addon;

  const tierIconClass =
    targetTier === "executive"
      ? "plan-icon--executive"
      : targetTier === "premium"
        ? "plan-icon--premium"
        : targetTier === "basic"
          ? "plan-icon--basic"
          : null;
  const tierColors =
    targetTier === "executive"
      ? {
          icon: "text-[#9a6f00]",
          bg: "bg-[#fdf6e3] border-[#e8c96a]", // warm gold
        }
      : targetTier === "premium"
        ? {
            icon: "text-[#5a5a6e]",
            bg: "bg-[#f0f0f0] border-[#c0c0cc]", // cool grey/silver
          }
        : targetTier === "basic"
          ? {
              icon: "text-[#2d7a7a]",
              bg: "bg-[#e8f4f4] border-[#a8d4d4]", // teal
            }
          : {
              icon: "text-[#6b8097]",
              bg: "bg-[#f4f7fb] border-[#d0e4f7]",
            };
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fafcff] p-6">
      {showUpgradeModal && (
        <UpgradeModal feature={feature} onClose={() => setShowUpgradeModal(false)} />
      )}

      {/* Decorative background elements */}
      <div className="bg-primary/5 pointer-events-none absolute top-0 right-0 h-96 w-96 translate-x-1/3 -translate-y-1/2 rounded-full blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 -translate-x-1/3 translate-y-1/2 rounded-full bg-purple-500/5 blur-[80px]" />

      <div className="animate-in zoom-in-95 relative z-10 w-full max-w-md rounded-[24px] border border-[#d0e4f7] bg-white p-8 text-center shadow-[0_20px_40px_rgba(12,27,51,0.05)] duration-500">
        <div className="mb-6 flex justify-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${tierColors.bg}`}
          >
            {tierIconClass ? (
              <span className={`plan-icon ${tierIconClass}`} style={{ width: 44, height: 44 }} />
            ) : (
              <Lock size={32} strokeWidth={2} className={tierColors.icon} />
            )}
          </div>
        </div>

        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold tracking-widest text-slate-500 uppercase shadow-sm">
          <Lock size={12} strokeWidth={2.5} />
          <span>Premium Feature</span>
        </div>

        <h1 className="mb-3 text-2xl leading-tight font-black text-[#0c1b33]">
          {title || "Included With Your Plan Upgrade"}
        </h1>

        <p className="mb-6 text-[14px] leading-relaxed text-[#6b8097]">
          {description ||
            (canBuyAddon
              ? "Upgrading your plan is the recommended way to unlock this tool — along with your full journey toolkit. Prefer just this one? A one-time add-on is also available."
              : "Upgrading your plan unlocks this tool along with your full journey toolkit — the recommended way to get more from Rahvana.")}
        </p>

        {creditUnlock && (
          <p className="-mt-2 mb-6 text-center text-[12px] text-[#9aa5b1]">
            Just need this guide? Pay once with wallet credits — or unlock it
            plus your full toolkit by upgrading.
          </p>
        )}

        <p className="mb-6 text-[12px] text-[#9aa5b1]">{hint}</p>

        <div className="flex flex-col gap-3">
          {creditUnlock ? (
            <>
              <button
                onClick={creditUnlock.onUnlock}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d7377] py-3.5 text-[14px] font-bold text-white shadow-md transition-all hover:bg-[#0a5c5f]"
              >
                Unlock with {creditUnlock.credits} Credits
                <Coins size={16} strokeWidth={2.5} className="transition-transform group-hover:scale-110" />
              </button>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="w-full rounded-xl border border-[#d0e4f7] bg-white py-3.5 text-[14px] font-bold text-[#0c1b33] transition-colors hover:bg-[#f4f7fb]"
              >
                Or upgrade your plan
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className={`group flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-bold text-white shadow-md transition-all ${
                targetTier === "executive"
                  ? "bg-[#0c1b33] text-white hover:bg-[#1a2b4a]"
                  : "bg-primary hover:bg-primary/90 text-white"
              }`}
            >
              {cta}
              <ArrowRight
                size={16}
                strokeWidth={2.5}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          )}

          <button
            onClick={() => router.back()}
            className="w-full rounded-xl border border-transparent py-3.5 text-[14px] font-bold text-[#6b8097] transition-colors hover:border-[#d0e4f7] hover:bg-[#f4f7fb] hover:text-[#0c1b33]"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}

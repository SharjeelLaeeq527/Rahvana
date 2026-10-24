"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Coins, Loader2, X } from "lucide-react";
import { WALLET_MAX_TOPUP, WALLET_MIN_TOPUP, WALLET_TOPUP_PACKS } from "@/lib/wallet/topup";
import { createTopupCheckout, currentReturnPath, parseCustomTopup } from "@/lib/wallet/client";

/**
 * Wallet top-up: preset packs or a custom whole-dollar amount ($1 = 1 credit).
 * Sends only the amount to /api/stripe/checkout; credits are added after Stripe
 * confirms the payment (webhook + verify-session).
 */

type Props = {
  balance: number | null;
  /** Pre-selected amount (e.g. the exact deficit). Lifted to the minimum. */
  initialAmount?: number;
  returnUrl?: string;
  onClose: () => void;
};

const PACKS: readonly number[] = WALLET_TOPUP_PACKS;

function normalizeInitial(amount?: number): number | null {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return null;
  return Math.min(WALLET_MAX_TOPUP, Math.max(WALLET_MIN_TOPUP, Math.ceil(amount)));
}

export function WalletTopupModal({ balance, initialAmount, returnUrl, onClose }: Props) {
  const initial = normalizeInitial(initialAmount);
  const startsCustom = initial !== null && !PACKS.includes(initial);

  const [selected, setSelected] = useState<number | "custom">(
    startsCustom ? "custom" : (initial ?? 25)
  );
  const [customValue, setCustomValue] = useState(startsCustom ? String(initial) : "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  // Back from Stripe via the browser back button: re-enable the form.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setSubmitting(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const custom = selected === "custom" ? parseCustomTopup(customValue) : null;
  const amount = selected === "custom" ? (custom?.ok ? custom.credits : null) : selected;

  const handlePay = async () => {
    if (amount === null || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const url = await createTopupCheckout(amount, returnUrl ?? currentReturnPath());
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the payment. Please try again.");
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4"
      style={{ zIndex: 2147483000 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-topup-title"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !submitting && onClose()}
      />

      <div className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Close"
          className="absolute top-3.5 right-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10 disabled:opacity-40"
        >
          <X size={14} strokeWidth={2.5} className="text-slate-600" />
        </button>

        <div className="shrink-0 border-b border-[#0d7377]/15 bg-gradient-to-br from-[#0d7377]/10 to-[#0d7377]/5 px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0d7377] text-white">
              <Coins size={18} />
            </div>
            <div>
              <h2 id="wallet-topup-title" className="text-[18px] font-extrabold tracking-tight text-[#0d7377]">
                Top up your Rahvana Wallet
              </h2>
              <p className="text-[12px] font-medium text-slate-600">
                {balance === null ? "$1 = 1 credit" : `Current balance: ${balance} credits. $1 = 1 credit.`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-2 gap-2.5">
            {PACKS.map((pack) => {
              const active = selected === pack;
              return (
                <button
                  key={pack}
                  type="button"
                  onClick={() => setSelected(pack)}
                  disabled={submitting}
                  aria-pressed={active}
                  className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                    active
                      ? "border-[#0d7377] bg-[#0d7377]/5 ring-2 ring-[#0d7377]/30"
                      : "border-slate-200 hover:border-[#0d7377]/50"
                  }`}
                >
                  <span className="block text-[17px] font-extrabold text-slate-900">${pack}</span>
                  <span className="block text-[12px] font-medium text-slate-500">{pack} credits</span>
                </button>
              );
            })}
          </div>

          <div
            className={`rounded-2xl border px-4 py-3 transition-all ${
              selected === "custom"
                ? "border-[#0d7377] bg-[#0d7377]/5 ring-2 ring-[#0d7377]/30"
                : "border-slate-200"
            }`}
          >
            <label htmlFor="wallet-custom-amount" className="mb-1.5 block text-[12px] font-bold text-slate-700">
              Custom amount
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-bold text-slate-500">$</span>
              <input
                id="wallet-custom-amount"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder={`${WALLET_MIN_TOPUP} to ${WALLET_MAX_TOPUP}`}
                value={customValue}
                disabled={submitting}
                onFocus={() => setSelected("custom")}
                onChange={(e) => {
                  setSelected("custom");
                  setCustomValue(e.target.value.replace(/[^\d]/g, "").slice(0, 4));
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[15px] font-semibold text-slate-900 outline-none focus:border-[#0d7377]"
              />
            </div>
            {selected === "custom" && customValue !== "" && custom && !custom.ok && (
              <p className="mt-1.5 text-[12px] font-medium text-red-600">{custom.error}</p>
            )}
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-700">{error}</p>
          )}

          <p className="text-[11.5px] leading-relaxed text-slate-500">
            Credits are used for standalone tools and guides. Tools inside your journey are covered
            by your journey plan and never use credits.
          </p>
        </div>

        <div className="shrink-0 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={handlePay}
            disabled={amount === null || submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0d7377] px-4 py-3 text-[14px] font-bold text-white transition-colors hover:bg-[#0a5c5f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Opening secure payment
              </>
            ) : amount === null ? (
              "Choose an amount"
            ) : (
              `Pay $${amount} for ${amount} credits`
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

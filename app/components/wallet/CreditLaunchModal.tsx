"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Coins, Loader2, LogIn, X } from "lucide-react";
import type { WalletCatalogItem } from "@/lib/wallet/catalog";
import { WALLET_MAX_TOPUP, WALLET_MIN_TOPUP, WALLET_TOPUP_PACKS } from "@/lib/wallet/topup";
import { createTopupCheckout, currentReturnPath } from "@/lib/wallet/client";
import { useWallet } from "@/app/context/WalletContext";
import { useAuth } from "@/app/context/AuthContext";

/**
 * Modal for confirming a standalone tool or guide launch.
 * Which state it shows is derived from the wallet balance up front:
 * sufficient -> cost breakdown + confirm; insufficient -> top-up options that go
 * straight to Stripe checkout (no intermediate top-up modal). The server stays
 * the source of truth: a 402 on confirm (balance changed while the modal was
 * open) flips the modal to the top-up state with the authoritative numbers.
 * Prices come from the wallet catalog, top-up amounts from the launch API.
 */
type Props = {
  item: WalletCatalogItem;
  /** URL to open after the resource launches successfully. */
  href: string;
  onClose: () => void;
};

type Insufficient = {
  required: number;
  available: number;
  deficit: number;
  topupAmount: number;
};

export function CreditLaunchModal({ item, href, onClose }: Props) {
  const router = useRouter();
  const { balance, isLoading, launchResource } = useWallet();
  const { isAuthenticated } = useAuth();

  const [charging, setCharging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Server-declared shortfall (402 on confirm). Only overrides the derived state.
  const [serverShortfall, setServerShortfall] = useState<Insufficient | null>(null);
  const [topupBusy, setTopupBusy] = useState(false);

  const kind = item.resourceType === "guide" ? "Guide" : "Tool";
  const balanceAfter = balance !== null ? balance - item.credits : null;

  // Decide the state from the balance up front instead of round-tripping the
  // launch API. Mirrors lib/wallet/launch.ts topupAmountForDeficit (kept inline
  // so no server module lands in the client bundle). Both branches only apply
  // while the live balance is short, so a background refresh (or a top-up done
  // in another tab) flips the modal back to the confirm state by itself.
  const shortfall: Insufficient | null =
    balance !== null && balance < item.credits
      ? (serverShortfall ?? {
          required: item.credits,
          available: balance,
          deficit: item.credits - balance,
          topupAmount: Math.min(
            WALLET_MAX_TOPUP,
            Math.max(WALLET_MIN_TOPUP, Math.ceil(item.credits - balance - 1e-9))
          ),
        })
      : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !charging && !topupBusy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, charging, topupBusy]);

  const handleConfirm = async () => {
    if (charging) return;
    setCharging(true);
    setError(null);
    const result = await launchResource(item.resourceType, item.resourceId);
    const body = result.body;

    if (body.success) {
      onClose();
      router.push(href);
      return;
    }
    if (result.status === 402) {
      setServerShortfall({
        required: Number(body.required ?? item.credits),
        available: Number(body.available ?? 0),
        deficit: Number(body.deficit ?? item.credits),
        topupAmount: Number(body.topupAmount ?? item.credits),
      });
      setCharging(false);
      return;
    }
    if (result.status === 401) {
      onClose();
      router.push(`/login?redirect=${encodeURIComponent(currentReturnPath())}`);
      return;
    }
    setError(
      body.error === "NETWORK_ERROR"
        ? "Could not reach Rahvana. Check your connection and try again."
        : "Something went wrong while launching. Please try again."
    );
    setCharging(false);
  };

  // Exact amount or bundle, straight to Stripe checkout - no intermediate
  // top-up modal. Same helper WalletTopupModal uses; credits land via the
  // webhook and the user returns to this page (returnUrl).
  const startTopup = async (amount: number) => {
    if (topupBusy || charging) return;
    setTopupBusy(true);
    setError(null);
    try {
      const url = await createTopupCheckout(amount, currentReturnPath());
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the payment. Please try again.");
      setTopupBusy(false);
    }
  };

  // Show larger bundles that cover the shortfall, but skip the exact amount.
  const bundles = shortfall
    ? WALLET_TOPUP_PACKS.filter(
        (pack) => pack >= shortfall.topupAmount && pack !== shortfall.topupAmount
      )
    : [];

  return createPortal(
    <div
      className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4"
      style={{ zIndex: 2147483000 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="credit-launch-title"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !charging && !topupBusy && onClose()}
      />

      <div className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          disabled={charging || topupBusy}
          aria-label="Close"
          className="absolute top-3.5 right-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10 disabled:opacity-40"
        >
          <X size={14} strokeWidth={2.5} className="text-slate-600" />
        </button>

        {/* Header */}
        <div className="shrink-0 border-b border-[#0d7377]/15 bg-gradient-to-br from-[#0d7377]/10 to-[#0d7377]/5 px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0d7377] text-white">
              <Coins size={18} />
            </div>
            <div>
              <h2
                id="credit-launch-title"
                className="text-[18px] font-extrabold tracking-tight text-[#0d7377]"
              >
                {shortfall ? "Insufficient Credits" : `Launch ${item.name}`}
              </h2>
              <p className="text-[12px] font-medium text-slate-600">
                {shortfall
                  ? "Top up to finish launching this standalone resource."
                  : `Standalone ${kind} - one-time unlock`}
              </p>
            </div>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="px-5 py-8 text-center">
            <p className="text-[14px] font-semibold text-slate-800">Please sign in to launch</p>
            <p className="mt-1 text-[12.5px] text-slate-500">
              Your Rahvana Wallet is tied to your account.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(`/login?redirect=${encodeURIComponent(currentReturnPath())}`);
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#0d7377] px-5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-[#0a5c5f]"
            >
              <LogIn size={16} /> Sign in
            </button>
          </div>
        ) : !shortfall ? (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
            {!isAuthenticated ? null : balance === null ? (
              <p className="flex items-center gap-2 text-[13.5px] font-medium text-slate-500">
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Checking your wallet…
                  </>
                ) : (
                  "Could not load your wallet balance. Close and try again."
                )}
              </p>
            ) : (
              <>
                <p className="text-[13.5px] leading-relaxed text-slate-700">
                  This standalone {kind.toLowerCase()} requires{" "}
                  <strong>{item.credits} Rahvana Credits</strong>. Launching will permanently unlock
                  full access for your account.
                </p>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                  <div className="flex items-center justify-between py-1.5 text-[13px]">
                    <span className="font-medium text-slate-500">Your Wallet Balance</span>
                    <span className="font-bold text-slate-900 tabular-nums">{balance} Credits</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 py-1.5 text-[13px]">
                    <span className="font-medium text-slate-500">{kind} Cost</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {item.credits} Credits
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 py-1.5 text-[13px]">
                    <span className="font-medium text-slate-500">Balance After Launch</span>
                    <span className="font-extrabold text-[#0d7377] tabular-nums">
                      {balanceAfter} Credits
                    </span>
                  </div>
                </div>
              </>
            )}

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-700">
                {error}
              </p>
            )}

            <p className="text-[11.5px] leading-relaxed text-slate-500">
              $1 = 1 credit. One launch = unlimited standalone use - you will not be charged again.
              Tools inside your journey never use credits.
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
            <p className="text-[13.5px] leading-relaxed text-slate-700">
              This {kind.toLowerCase()} requires <strong>{shortfall.required} Credits</strong>, but
              you only have <strong>{shortfall.available} Credits</strong>. You need{" "}
              <strong>{Math.ceil(shortfall.deficit)} more credits</strong> to launch it.
            </p>

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-700">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => startTopup(shortfall.topupAmount)}
              disabled={topupBusy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0d7377] px-4 py-3 text-[14px] font-bold text-white transition-colors hover:bg-[#0a5c5f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {topupBusy ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Opening secure payment…
                </>
              ) : (
                `Top Up Exact Amount: $${shortfall.topupAmount} (${shortfall.topupAmount} Credits)`
              )}
            </button>

            {bundles.length > 0 && (
              <>
                <p className="text-[12px] font-bold text-slate-700">Or choose a credit bundle:</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {bundles.map((pack) => (
                    <button
                      key={pack}
                      type="button"
                      onClick={() => startTopup(pack)}
                      disabled={topupBusy}
                      className="rounded-2xl border border-slate-200 px-3 py-2.5 text-center transition-all hover:border-[#0d7377]/50 hover:bg-[#0d7377]/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="block text-[15px] font-extrabold text-slate-900">
                        ${pack}
                      </span>
                      <span className="block text-[11px] font-medium text-slate-500">
                        {pack} credits
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        {isAuthenticated && (
          <div className="shrink-0 border-t border-slate-100 px-5 py-4">
            {!shortfall ? (
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={charging}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={charging || balance === null || shortfall !== null}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0d7377] px-4 py-3 text-[14px] font-bold text-white transition-colors hover:bg-[#0a5c5f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {charging ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Deducting credits
                    </>
                  ) : (
                    <>Confirm &amp; Deduct {item.credits} Credits</>
                  )}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={topupBusy}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

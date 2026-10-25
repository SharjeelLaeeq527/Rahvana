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
  href?: string;
  /**
   * Called instead of navigating when the launch succeeds. Used by an in-tool
   * lock card: the tool is already open, so it should unlock in place and keep
   * whatever the user has entered.
   */
  onLaunched?: () => void;
  onClose: () => void;
};

type Insufficient = {
  required: number;
  available: number;
  deficit: number;
  topupAmount: number;
};

export function CreditLaunchModal({ item, href, onLaunched, onClose }: Props) {
  const router = useRouter();
  const { balance, isLoading, launchResource } = useWallet();
  const { isAuthenticated } = useAuth();

  const [charging, setCharging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Server-declared shortfall (402 on confirm). Only overrides the derived state.
  const [serverShortfall, setServerShortfall] = useState<Insufficient | null>(null);
  const [topupBusy, setTopupBusy] = useState(false);
  // Top-up option picked in the shortfall state; null = the exact amount.
  const [pickedTopup, setPickedTopup] = useState<number | null>(null);

  const kind =
    item.resourceType === "guide"
      ? "Guide"
      : item.resourceType === "service"
        ? "Service"
        : "Tool";
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
    // Services are charged per booking, by the booking form itself (with the
    // booking id). Charging here would take credits for no booking, then again.
    if (item.resourceType === "service") {
      onClose();
      if (href) router.push(href);
      return;
    }
    setCharging(true);
    setError(null);
    const result = await launchResource(item.resourceType, item.resourceId);
    const body = result.body;

    if (body.success) {
      if (onLaunched) {
        onLaunched();
        return;
      }
      onClose();
      if (href) router.push(href);
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

  // Exact amount first, then up to two larger packs that also cover the shortfall.
  const topupOptions = shortfall
    ? [
        shortfall.topupAmount,
        ...WALLET_TOPUP_PACKS.filter((pack) => pack > shortfall.topupAmount).slice(0, 2),
      ]
    : [];
  const selectedTopup =
    pickedTopup !== null && topupOptions.includes(pickedTopup)
      ? pickedTopup
      : (topupOptions[0] ?? 0);

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
                {item.resourceType === "service" ? `Book ${item.name}` : `Launch ${item.name}`}
              </h2>
              <p className="text-[12px] font-medium text-slate-600">
                {shortfall
                  ? "Add credits to continue"
                  : item.resourceType === "service"
                    ? "Book this service using your Rahvana credits"
                    : "Pay once, use it as often as you like"}
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
                    <Loader2 size={15} className="animate-spin" /> Checking your wallet...
                  </>
                ) : (
                  "Could not load your wallet balance. Close and try again."
                )}
              </p>
            ) : (
              <>
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
                    <span className="font-medium text-slate-500">
                      Balance After {item.resourceType === "service" ? "Booking" : "Launch"}
                    </span>
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
              $1 = 1 credit. {item.resourceType === "service" ? "Services inside your journey never use credits." : "Tools inside your journey never use credits."}
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <div className="flex items-center justify-between py-1.5 text-[13px]">
                <span className="font-medium text-slate-500">Your Wallet Balance</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {shortfall.available} Credits
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 py-1.5 text-[13px]">
                <span className="font-medium text-slate-500">{kind} Cost</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {shortfall.required} Credits
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 py-1.5 text-[13px]">
                <span className="font-medium text-slate-500">Credits Needed</span>
                <span className="font-extrabold text-amber-600 tabular-nums">
                  {Math.ceil(shortfall.deficit)} Credits
                </span>
              </div>
            </div>

            <div role="radiogroup" aria-label="Top-up amount" className="flex flex-col gap-2">
              <p className="text-[12px] font-bold text-slate-700">Choose a top-up</p>
              {topupOptions.map((amount) => {
                const active = amount === selectedTopup;
                const leftAfter = amount + shortfall.available - shortfall.required;
                return (
                  <button
                    key={amount}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPickedTopup(amount)}
                    disabled={topupBusy}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      active
                        ? "border-[#0d7377] bg-[#0d7377]/5 ring-1 ring-[#0d7377]"
                        : "border-slate-200 hover:border-[#0d7377]/40"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                          active ? "border-[#0d7377]" : "border-slate-300"
                        }`}
                      >
                        {active && <span className="h-2 w-2 rounded-full bg-[#0d7377]" />}
                      </span>
                      <span>
                        <span className="block text-[14px] font-bold text-slate-900 tabular-nums">
                          {amount} credits
                        </span>
                        <span className="block text-[11.5px] font-medium text-slate-500">
                          {/* Spell out the math (balance + top-up - cost) so the
                              leftover is not read as "top-up minus needed". */}
                          {leftAfter <= 0
                            ? `Balance becomes ${shortfall.available + amount}, exactly the ${shortfall.required} you need`
                            : `Balance becomes ${shortfall.available + amount}, ${leftAfter} left after the ${shortfall.required}-credit unlock`}
                        </span>
                      </span>
                    </span>
                    <span className="text-[14px] font-bold text-slate-900 tabular-nums">
                      ${amount}
                    </span>
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-700">
                {error}
              </p>
            )}

            <p className="text-[11.5px] leading-relaxed text-slate-500">
              $1 = 1 credit. Secure payment by Stripe. You come back here after paying and can
              launch right away.
            </p>
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
                  aria-busy={charging}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0d7377] px-4 py-3 text-[14px] font-bold text-white transition-colors hover:bg-[#0a5c5f] disabled:cursor-not-allowed ${
                    charging ? "" : "disabled:opacity-50"
                  }`}
                >
                  {charging ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />{" "}
                      {item.resourceType === "service" ? "Booking..." : "Unlocking..."}
                    </>
                  ) : item.resourceType === "service" ? (
                    `Book for ${item.credits} credits`
                  ) : (
                    `Unlock for ${item.credits} credits`
                  )}
                </button>
              </div>
            ) : (
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={topupBusy}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => startTopup(selectedTopup)}
                  disabled={topupBusy || selectedTopup <= 0}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0d7377] px-4 py-3 text-[14px] font-bold text-white transition-colors hover:bg-[#0a5c5f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {topupBusy ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Opening secure payment...
                    </>
                  ) : (
                    `Pay $${selectedTopup} for ${selectedTopup} credits`
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

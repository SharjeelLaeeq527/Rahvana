"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Coins, Copy, X } from "lucide-react";
import { getCatalogItem } from "@/lib/wallet/catalog";
import {
  categoryFor,
  formatCredits,
  formatFullDateTime,
  formatSignedCredits,
  formatUsd,
  paymentMethodFor,
  statusFor,
  toNumber,
  type LedgerTransaction,
} from "@/lib/wallet/transactions";
import { useToast } from "@/app/components/shared/ToastProvider";

/**
 * Full-record view for one ledger row. The history table shows the compact
 * essentials; everything else the ledger carries for the user (balance chain,
 * payment method, invoice reference, who acted) lives here.
 */
type Props = {
  transaction: LedgerTransaction;
  onClose: () => void;
};

/** Human label for the resource a spend unlocked, from the wallet catalog. */
function resourceLabel(t: LedgerTransaction): string | null {
  const item = getCatalogItem(t.resource_type, t.resource_id);
  if (item) return `${item.name} (${item.resourceType})`;
  if (t.resource_id) return t.resource_id.replace(/[-_]/g, " ");
  return null;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-b-0">
      <dt className="shrink-0 text-[12.5px] font-medium text-slate-500">{label}</dt>
      <dd className="min-w-0 text-right text-[13px] font-semibold text-slate-800">{children}</dd>
    </div>
  );
}

export function TransactionDetailModal({ transaction: t, onClose }: Props) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const category = categoryFor(t.transaction_type);
  const status = statusFor(t.status);
  const amount = toNumber(t.amount);
  const resource = resourceLabel(t);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(t.id);
      setCopied(true);
      showToast("Reference copied.", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Could not copy the reference.", "error");
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4"
      style={{ zIndex: 2147483000 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="txn-detail-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3.5 right-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10"
        >
          <X size={14} strokeWidth={2.5} className="text-slate-600" />
        </button>

        {/* Header */}
        <div className="shrink-0 border-b border-[#0d7377]/15 bg-gradient-to-br from-[#0d7377]/10 to-[#0d7377]/5 px-5 pt-6 pb-5">
          <div className="flex items-center gap-3 pr-8">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${category.tile}`}
            >
              <Coins size={18} />
            </div>
            <div className="min-w-0">
              <h2
                id="txn-detail-title"
                className="truncate text-[16px] font-extrabold tracking-tight text-[#0d7377]"
              >
                Transaction Details
              </h2>
              <p className="text-[12px] font-medium text-slate-600">{category.label}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-bold ${status.pill}`}
            >
              {status.label}
            </span>
            <span
              className={`text-[17px] font-extrabold tabular-nums ${amount >= 0 ? "text-emerald-600" : "text-slate-900"}`}
            >
              {formatSignedCredits(t.amount)}
            </span>
          </div>
        </div>

        {/* Body */}
        <dl className="flex-1 overflow-y-auto px-5 py-3">
          <Row label="Description">
            <span className="block max-h-16 overflow-y-auto text-left whitespace-normal">
              {t.description}
            </span>
          </Row>
          {resource && <Row label="Resource">{resource}</Row>}
          <Row label="Date & Time">{formatFullDateTime(t.created_at)}</Row>
          <Row label="Reference ID">
            <button
              type="button"
              onClick={copyReference}
              title="Copy full reference"
              className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 font-mono text-[11.5px] font-medium text-slate-600 transition-colors hover:bg-slate-100"
            >
              <span className="truncate">{t.id}</span>
              {copied ? (
                <Check size={12} className="shrink-0 text-emerald-600" />
              ) : (
                <Copy size={12} className="shrink-0" />
              )}
            </button>
          </Row>
          <Row label="Amount">
            <span className="tabular-nums">{formatSignedCredits(t.amount)}</span>
            {formatUsd(t.amount_usd) && (
              <span className="ml-1.5 text-[12px] font-medium text-slate-400">
                ({formatUsd(t.amount_usd)})
              </span>
            )}
          </Row>
          <Row label="Balance Before">
            <span className="tabular-nums">{formatCredits(t.balance_before)} Credits</span>
          </Row>
          <Row label="Balance After">
            <span className="text-[#0d7377] tabular-nums">
              {formatCredits(t.balance_after)} Credits
            </span>
          </Row>
          <Row label="Payment Method">{paymentMethodFor(t)}</Row>
          {t.stripe_invoice_id && (
            <Row label="Invoice Reference">
              <span className="font-mono text-[12px]">{t.stripe_invoice_id}</span>
            </Row>
          )}
          {(t.actor_type === "admin" || t.actor_type === "system") && (
            <Row label="Initiated By">
              {t.actor_type === "admin" ? "Rahvana support" : "Rahvana system"}
            </Row>
          )}
        </dl>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100 px-5 py-4">
          <p className="mb-3 text-[11.5px] leading-relaxed text-slate-500">
            $1 USD = 1 Rahvana Credit. Balances are recalculated server-side on every transaction;
            this record is part of your official statement.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

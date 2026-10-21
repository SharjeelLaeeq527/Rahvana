"use client";

import React from "react";
import Link from "next/link";
import { Clock, Download } from "lucide-react";
import { JourneyServiceModule } from "./JourneyServiceModule";
import { POLICE_CLEARANCE_DATA } from "@/app/components/journey-spouse/PoliceClearanceData";
import {
  pccExpiryDate,
  pccRenewalDate,
  type JourneyServiceRecord,
} from "@/lib/journey/toolModeGuards";

interface PccFilingModuleProps {
  /** Roadmap tool_data (accepted for prop-compatibility; content is data-driven). */
  tool?: unknown;
  record: JourneyServiceRecord | null;
  locked: boolean;
  onOpen: () => void;
  /** Marks the certificate as received (updates the journey record status). */
  onMarkReceived?: () => void;
}

const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export const PccFilingModule: React.FC<PccFilingModuleProps> = ({
  record,
  locked,
  onOpen,
  onMarkReceived,
}) => {
  const d = POLICE_CLEARANCE_DATA;
  const isReceived = record?.status === "received";
  const validUntil = pccExpiryDate(record);
  const renewalDate = pccRenewalDate(record);

  // Disabled-tile hint: the certificate is legally valid for six months, but we unlock a
  // renewal after four (a two-month safety margin). Written as a full sentence so the amber
  // lock banner explains *why* a second filing is blocked, not just the state label.
  const lockedHint = isReceived
    ? renewalDate
      ? `Your certificate is valid until ${validUntil}. You can file your next request from ${renewalDate} — we open renewals two months early so there is no gap.`
      : "Certificate received — you can file a new request after the lock period ends."
    : record
      ? "Your PCC application is still in progress. You can file another once you receive it and the lock period ends."
      : undefined;

  // Post-submit lifecycle: pending banner → "mark as received" → document-vault card.
  const lifecycle = record ? (
    isReceived ? (
      <div className="mt-4 rounded-[10px] border-[1.5px] border-emerald-200 bg-emerald-50/70 p-[20px]">
        <div className="flex items-center gap-2 text-[13px] font-bold text-emerald-800">
          <Download size={16} className="shrink-0" />
          {d.receivedCard.title}
        </div>
        <p className="mt-2 text-[12.5px] leading-[1.65] whitespace-pre-line text-emerald-900/80">
          {d.receivedCard.body}
        </p>
        {validUntil && (
          <p className="mt-2 text-[11.5px] font-medium text-emerald-700">
            Valid until {validUntil}
            {renewalDate ? ` — you can file your next request from ${renewalDate}.` : "."}
          </p>
        )}
        <Link
          href={d.receivedCard.vaultUrl || "/document-vault"}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-emerald-700"
        >
          {d.receivedCard.buttonLabel}
        </Link>
      </div>
    ) : (
      <div className="mt-4 rounded-[10px] border-[1.5px] border-amber-200 bg-amber-50/70 p-[20px]">
        <div className="flex items-center gap-2 text-[13px] font-bold text-amber-800">
          <Clock size={16} className="shrink-0" />
          {d.pendingCard.title}
        </div>
        <p className="mt-2 text-[12.5px] leading-[1.65] whitespace-pre-line text-amber-900/80">
          {d.pendingCard.body}
        </p>
        <button
          type="button"
          onClick={onMarkReceived}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-amber-700"
        >
          {d.pendingCard.buttonLabel}
        </button>
      </div>
    )
  ) : null;

  return (
    <JourneyServiceModule
      chips={d.chips}
      decision={d.decisionModule}
      guideSteps={d.guideSteps}
      guideEyebrow="Self-service guide"
      disclaimer={d.disclaimer}
      record={record}
      locked={locked}
      onOpen={onOpen}
      summaryTitle="Your PCC Application"
      summaryRows={[
        ["Status", cap(record?.status)],
        ["Receipt number", record?.referenceId],
        ["District", record?.location],
        ["Application date", record?.referenceDate],
      ]}
      summaryEmptyText="No application filed yet. Use Rahvana's filing service above to submit your Sindh Police Character Certificate application, or follow the self-service guide."
      lockedHint={lockedHint}
      hideActiveUntilNote
      afterSummary={lifecycle}
    />
  );
};

export default PccFilingModule;

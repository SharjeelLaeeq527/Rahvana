import React, { useState, useCallback } from "react";
import { Info, Check, Calendar, Upload } from "lucide-react";
import { ApUpdateModal } from "../PortalWalletManager";

interface ApDetails {
  received: boolean | null;
  interviewDate: string;
  ceacStatus: string;
  lastCheck: string;
  docsRequested: string;
  notes: string;
}

interface AdministrativeProcessingToolProps {
  tool: any;
  state: any;
  actions: any;
  guard: () => boolean;
}

const CEAC_STATUS_MAP: Record<string, string> = {
  "Administrative Processing": "ap",
  Ready: "ready",
  Issued: "issued",
  Refused: "refused",
  "In Transit": "in_transit",
};

export const AdministrativeProcessingTool: React.FC<AdministrativeProcessingToolProps> = ({
  tool,
  state,
  actions,
  guard,
}) => {
  const [apDetails, setApDetails] = useState<ApDetails>(
    state.metadata.apDetails || {
      received: null,
      interviewDate: "",
      ceacStatus: "",
      lastCheck: "",
      docsRequested: "no",
      notes: "",
    }
  );
  const [isApSaved, setIsApSaved] = useState(state.metadata.apSaved === "true");
  const [refusedPromptOpen, setRefusedPromptOpen] = useState(false);
  const [isApUpdateModalOpen, setIsApUpdateModalOpen] = useState(false);
  const [ceacApiLoading, setCeacApiLoading] = useState(false);

  const apUpdateLog = state.metadata.apUpdateLog || [];

  const triggerCeacStatusUpdate = async (
    ceacStatusLabel: string,
    refusedSubType?: "refusal_221g" | "refusal_final",
  ) => {
    const journeyId = state.backendId;
    if (!journeyId) return;

    const newStatus = CEAC_STATUS_MAP[ceacStatusLabel];
    if (!newStatus) return;

    setCeacApiLoading(true);
    try {
      await fetch("/api/ceac/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journeyId, newStatus, refusedSubType }),
      });
    } catch {
      // Fail silently
    } finally {
      setCeacApiLoading(false);
    }
  };

  const clarifyRefusedSubType = async (
    refusedSubType: "refusal_221g" | "refusal_final",
  ) => {
    const journeyId = state.backendId;
    if (!journeyId) return;
    try {
      await fetch("/api/ceac/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journeyId,
          action: "clarify_refused",
          refusedSubType,
        }),
      });
    } catch {
      /* silent */
    }
    setRefusedPromptOpen(false);
    actions.updateMetadata({ refusedSubType });
  };

  const handleSaveApUpdate = (entry: any) => {
    const nextLog = [entry, ...apUpdateLog];
    actions.updateMetadata({ apUpdateLog: nextLog });
  };

  return (
    <div className="flex flex-col mt-4">
      {/* Explainer Banner */}
      <div className="relative bg-[#0e1e38] rounded-[16px] p-6 mb-4 overflow-hidden border border-white/10 shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-[#8a6200] via-[#f0d98a] to-transparent opacity-85" />
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-2">
          {tool.explainer.eyebrow}
        </div>
        <div className="text-[20px] text-white/95 mb-2.5 leading-tight">
          {tool.explainer.title}
        </div>
        <div className="text-[13px] text-white/55 leading-relaxed max-w-[560px]">
          {tool.explainer.body}
        </div>
      </div>

      {/* AP Status Recorder Card */}
      {!isApSaved ? (
        <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-6 mb-4 shadow-[0_4px_24px_rgba(12,27,51,0.08)] transition-all">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#fef8e8] border border-[#f0d98a] flex items-center justify-center shrink-0">
              <Calendar
                size={18}
                className="text-[#8a6200]"
                strokeWidth={1.8}
              />
            </div>
            <div>
              <div className="text-[14px] font-bold text-[#0c1b33]">
                {tool.recorder.title}
              </div>
              <div className="text-[12px] text-[#6b8097]">
                {tool.recorder.subtitle}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-[#6b8097]">
                Did you receive a 221(g) or AP notice?
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setApDetails({ ...apDetails, received: true })
                  }
                  className={`flex-1 p-2.5 rounded-lg border-[1.5px] text-[13px] font-bold transition-all ${
                    apDetails.received === true
                      ? "bg-[#fef8e8] border-[#8a6200] text-[#8a6200]"
                      : "bg-white border-[#d0e4f7] text-[#3a4f63] hover:border-[#3a4f63]"
                  }`}
                >
                  Yes — AP received
                </button>
                <button
                  onClick={() =>
                    setApDetails({ ...apDetails, received: false })
                  }
                  className={`flex-1 p-2.5 rounded-lg border-[1.5px] text-[13px] font-bold transition-all ${
                    apDetails.received === false
                      ? "bg-[#e8f5ef] border-[#a8d9be] text-[#15744f]"
                      : "bg-white border-[#d0e4f7] text-[#3a4f63] hover:border-[#3a4f63]"
                  }`}
                >
                  No — awaiting outcome
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wide text-[#6b8097]">
                  Date of Interview (when AP was placed)
                </label>
                <input
                  type="date"
                  value={apDetails.interviewDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    setApDetails({
                      ...apDetails,
                      interviewDate: e.target.value,
                    })
                  }
                  className="p-2.5 border-[1.5px] border-[#d0e4f7] rounded-lg text-[14px] outline-none focus:border-primary transition-all"
                />
              </div>
              {/* Live status tracking card */}
              {(() => {
                const liveStatus = state.metadata?.admin_case_status as string | undefined;
                const lastChecked = state.metadata?.admin_last_check_date as string | undefined;
                const statusDotColor =
                  liveStatus === "Issued" || liveStatus === "Approved" ? "#15744f" :
                  liveStatus === "Refused" ? "#dc2626" :
                  liveStatus === "Administrative Processing" || liveStatus === "221(g)" ? "#d97706" :
                  liveStatus === "Ready" ? "#2563eb" :
                  "#6b8097";
                return (
                  <div className="rounded-xl border border-[#d0e4f7] bg-[#f8fafc] overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-[#e8f1fb] bg-white">
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: liveStatus ? statusDotColor : "#d0e4f7" }} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#6b8097]">
                        Live CEAC Status
                      </span>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-[#e8f1fb]">
                      <div className="px-4 py-3">
                        <div className="text-[10px] font-semibold text-[#6b8097] mb-1">Current Status</div>
                        <div className="text-[14px] font-bold text-[#0c1b33]">
                          {liveStatus || <span className="text-[#9ab0c8] font-normal italic text-[13px]">Awaiting update</span>}
                        </div>
                      </div>
                      <div className="px-4 py-3">
                        <div className="text-[10px] font-semibold text-[#6b8097] mb-1">Last Checked</div>
                        <div className="text-[14px] font-bold text-[#0c1b33]">
                          {lastChecked
                            ? new Date(lastChecked).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                            : <span className="text-[#9ab0c8] font-normal italic text-[13px]">—</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wide text-[#6b8097]">
                  Additional Docs Requested?
                </label>
                <select
                  value={apDetails.docsRequested}
                  onChange={(e) =>
                    setApDetails({
                      ...apDetails,
                      docsRequested: e.target.value,
                    })
                  }
                  className="p-2.5 border-[1.5px] border-[#d0e4f7] rounded-lg text-[14px] outline-none focus:border-primary transition-all"
                >
                  {tool.recorder.docs_requested_options.map(
                    (opt: any) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-[#6b8097]">
                Notes (optional)
              </label>
              <textarea
                value={apDetails.notes}
                onChange={(e) =>
                  setApDetails({ ...apDetails, notes: e.target.value })
                }
                placeholder="e.g. 221(g) sheet received..."
                className="p-2.5 border-[1.5px] border-[#d0e4f7] rounded-lg text-[14px] outline-none focus:border-primary transition-all min-h-[80px]"
              />
            </div>

            <button
              onClick={() => {
                setIsApSaved(true);
                actions.updateMetadata({
                  apDetails: apDetails,
                  apSaved: "true",
                  ...(apDetails.ceacStatus === "Issued" &&
                  !state.metadata?.ceacIssuedAt
                    ? { ceacIssuedAt: new Date().toISOString() }
                    : {}),
                });
                if (apDetails.ceacStatus === "Refused") {
                  triggerCeacStatusUpdate("Refused");
                  setRefusedPromptOpen(true);
                } else {
                  triggerCeacStatusUpdate(apDetails.ceacStatus);
                }
              }}
              disabled={!apDetails.interviewDate || ceacApiLoading}
              className="w-full p-4 bg-primary text-white rounded-xl font-bold transition-all shadow-[0_4px_16px_rgba(47,111,212,0.3)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
            >
              {ceacApiLoading
                ? "Saving..."
                : "Save AP Status & Activate Tracking"}
            </button>

            {refusedPromptOpen && (
              <div className="mt-4 bg-[#fff7ed] border border-[#f0d98a] rounded-xl p-5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="text-[12px] font-bold uppercase tracking-wide text-[#8a6200] mb-2">
                  One more question
                </div>
                <p className="text-[13.5px] text-[#3a4f63] leading-relaxed mb-4">
                  Your CEAC status is <strong>Refused</strong>. This can
                  mean two very different things. Which one applies to
                  your case?
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() =>
                      clarifyRefusedSubType("refusal_221g")
                    }
                    className="w-full p-3.5 rounded-lg border-[1.5px] border-[#f0d98a] bg-white text-[13px] font-semibold text-[#8a6200] text-left hover:bg-[#fef8e8] transition-all"
                  >
                    <span className="font-black">221(g)</span> — Officer
                    requested more documents or info. Case is still
                    active.
                  </button>
                  <button
                    onClick={() =>
                      clarifyRefusedSubType("refusal_final")
                    }
                    className="w-full p-3.5 rounded-lg border-[1.5px] border-[#fecdd3] bg-white text-[13px] font-semibold text-[#9f1239] text-left hover:bg-[#fff1f2] transition-all"
                  >
                    <span className="font-black">Final Denial</span> —
                    Officer denied under a specific ground (INA §212
                    etc.)
                  </button>
                  <button
                    onClick={() => setRefusedPromptOpen(false)}
                    className="text-[12px] text-[#6b8097] hover:text-[#1c2b3a] mt-1 text-center"
                  >
                    Not sure yet — I&apos;ll check my notice
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border-[1.5px] border-[#f0d98a] rounded-[16px] p-6 mb-4 shadow-[0_4px_24px_rgba(12,27,51,0.08)] animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#8a6200]">
              AP Details Recorded — Tracking Active
            </div>
            <button
              onClick={() => setIsApSaved(false)}
              className="text-[12px] font-bold text-primary hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-y-4 gap-x-6">
            <div>
              <div className="text-[11px] text-[#6b8097] font-medium mb-0.5">
                Interview Date
              </div>
              <div className="text-[13px] font-bold text-[#0c1b33]">
                {apDetails.interviewDate
                  ? new Date(
                      apDetails.interviewDate + "T00:00:00",
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#6b8097] font-medium mb-0.5">
                221(g) / AP Received
              </div>
              <div className="text-[13px] font-bold text-[#0c1b33]">
                {apDetails.received === true
                  ? "Yes — 221(g) received"
                  : apDetails.received === false
                    ? "No — awaiting outcome"
                    : "—"}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#6b8097] font-medium mb-0.5">
                CEAC Status
              </div>
              <div className="text-[13px] font-bold text-[#0c1b33]">
                {state.metadata?.admin_case_status || apDetails.ceacStatus || "—"}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#6b8097] font-medium mb-0.5">
                Last Checked
              </div>
              <div className="text-[13px] font-bold text-[#0c1b33]">
                {state.metadata?.admin_last_check_date
                  ? new Date(state.metadata.admin_last_check_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : apDetails.lastCheck
                    ? new Date(apDetails.lastCheck + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "—"}
              </div>
            </div>
          </div>
          {apDetails.notes && (
            <div className="mt-4 pt-4 border-t border-[#f0d98a]">
              <div className="text-[11px] text-[#6b8097] font-medium mb-1">
                Notes
              </div>
              <div className="text-[13px] text-[#3a4f63] leading-relaxed">
                {apDetails.notes}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Docs Requested Alert */}
      {apDetails.docsRequested === "yes" && isApSaved && (
        <div className="bg-[#fef8e8] border-[1.5px] border-[#f0d98a] rounded-[16px] p-5 mb-4 shadow-[0_4px_12px_rgba(12,27,51,0.04)] animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[18px]">📎</span>
            <div className="text-[14px] font-bold text-[#8a6200]">
              Additional documents were requested
            </div>
          </div>
          <div className="text-[13px] text-[#8a6200] leading-relaxed mb-4">
            The consulate has requested additional documents as part of
            your 221(g) or AP process. Review the request carefully,
            provide exactly what was asked, and submit via the method
            specified.
          </div>
          <button
            onClick={() => window.open("https://www.rahvana.com/document-vault", "_blank")}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#8a6200] text-white rounded-lg text-[13px] font-bold transition-all hover:opacity-90"
          >
            <Upload size={14} />
            <span>Save documents to Document Vault</span>
          </button>
        </div>
      )}

      {/* Update Log Card */}
      <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-6 mb-4 shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[14px] font-bold text-[#0c1b33]">
            Case Update Log
          </div>
          <button
            onClick={() => setIsApUpdateModalOpen(true)}
            className="text-[12px] font-bold text-primary hover:underline cursor-pointer"
          >
            + Add update
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {apUpdateLog.length === 0 ? (
            <div className="text-[13px] text-[#6b8097] italic py-2">
              No updates logged yet. Add updates each time you check
              CEAC or receive new information.
            </div>
          ) : (
            apUpdateLog.map((entry: any, i: number) => (
              <div
                key={i}
                className="bg-[#f4f7fb] border border-[#d0e4f7] rounded-xl p-3"
              >
                <div className="text-[11px] font-bold text-[#6b8097] mb-1">
                  {new Date(
                    entry.date + "T00:00:00",
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  {entry.ceac && ` · CEAC: ${entry.ceac}`}
                </div>
                <div className="text-[13px] text-[#3a4f63] leading-relaxed">
                  {entry.note || "Status checked — no change noted."}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ApUpdateModal
        isOpen={isApUpdateModalOpen}
        onClose={() => setIsApUpdateModalOpen(false)}
        onSave={handleSaveApUpdate}
        ceacOptions={tool.recorder.ceac_options}
      />

      {/* Info Sections */}
      <div className="flex flex-col gap-3.5 mb-2">
        {tool.info_sections.map((section: any, idx: number) => (
          <div
            key={idx}
            className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-5 shadow-[0_4px_20px_rgba(12,27,51,0.06)]"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                  section.type === "sky"
                    ? "bg-[#e8f1fb] border-[#d0e4f7]"
                    : "bg-[#e8f6f6] border-[#9fd6d6]"
                }`}
              >
                {section.icon === "info" ? (
                  <Info
                    size={16}
                    className="text-[#2f6fd4]"
                    strokeWidth={2}
                  />
                ) : (
                  <Check
                    size={16}
                    className="text-[#0d6b6b]"
                    strokeWidth={2.5}
                  />
                )}
              </div>
              <div className="text-[14px] font-bold text-[#0c1b33]">
                {section.title}
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              {section.items.map((item: string, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-[#d0e4f7] mt-[7.5px] shrink-0" />
                  <span className="text-[13px] text-[#3a4f63] leading-relaxed">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

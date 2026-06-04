"use client";

import React from "react";
import { Search, X, CheckCircle2, Upload, Lock } from "lucide-react";
import { toast } from "sonner";
import { POLICE_CLEARANCE_DATA } from "../PoliceClearanceData";
import { usePlan } from "@/app/context/PlanContext";
import { E, msg } from "@/lib/errors";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";

interface PoliceClearanceToolProps {
  state: any;
  actions: any;
  pccState: {
    pccSaved: boolean;
    setPccSaved: (v: boolean) => void;
    pccReceived: boolean;
    setPccReceived: (v: boolean) => void;
    pccData: {
      receipt: string;
      track: string;
      date: string;
    };
    setPccData: (v: any) => void;
    isPccOverlayOpen: boolean;
    setIsPccOverlayOpen: (v: boolean) => void;
    pccOverlayStep: number;
    setPccOverlayStep: (v: any) => void;
    pccOverlayMode: "service" | "guide" | "";
    setPccOverlayMode: (v: "service" | "guide" | "") => void;
  };
  guard?: () => boolean;
  openUploadModal?: (defId: string) => void;
  setActiveUploadId?: (id: string | null) => void;
  setActiveUploadType?: (type: "doc" | "hh" | "financial" | null) => void;
  uploadedDocuments?: any[];
}

export const PoliceClearanceTool: React.FC<PoliceClearanceToolProps> = ({
  actions,
  pccState,
  openUploadModal,
  setActiveUploadId,
  setActiveUploadType,
  uploadedDocuments,
  guard,
}) => {
  const {
    pccSaved,
    setPccSaved,
    pccReceived,
    setPccReceived,
    pccData,
    setPccData,
    isPccOverlayOpen,
    setIsPccOverlayOpen,
    pccOverlayStep,
    setPccOverlayStep,
    pccOverlayMode,
    setPccOverlayMode,
  } = pccState;
  const [isSaving, setIsSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const { tier } = usePlan();
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  const validatePccField = (id: string, value: string) => {
    if (!value) return "";

    // Allow alphanumeric, spaces, dashes, slashes
    const regex = /^[a-zA-Z0-9\s\-\/]+$/;
    if (!regex.test(value)) {
      return msg(E.PCC_FIELD_FORMAT_INVALID);
    }
    if (value.length < 3) {
      return msg(E.PCC_FIELD_TOO_SHORT);
    }
    return "";
  };

  const data = POLICE_CLEARANCE_DATA;
  const isPccUploaded = uploadedDocuments?.some(
    (doc: any) => doc.documentDefId === "police-certificate-pakistan"
  );

  const currentSteps = pccOverlayMode === "service" ? data.serviceSteps : data.guideSteps;

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380 shadow-xs border p-6 rounded-2xl bg-white">
      <div className="flex items-center gap-1.5 flex-wrap mb-8">
        {data.chips.map((chip: any, i: number) => (
          <span
            key={i}
            className={`text-[10px] font-bold uppercase tracking-[0.06em] px-3 py-1.5 rounded-full border ${chip.type === "pcc" ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-purple-50 text-purple-700 border-purple-100"}`}
          >
            {chip.label}
          </span>
        ))}
      </div>

      <div className="relative bg-[#0e1e38] rounded-2xl border border-white/5 shadow-2xl p-8 mb-6 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-blue-500 to-transparent opacity-75" />
        <div className="text-[10px] font-black tracking-widest uppercase text-white/30 mb-1">
          {data.decisionModule.eyebrow}
        </div>
        <div className="text-xl text-white/95 font-bold mb-6">{data.decisionModule.heading}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.decisionModule.paths.map((p: any) => (
            <button
              key={p.id}
              onClick={() => {
                if (guard && !guard()) return;
                setPccOverlayMode(p.id);
                setPccOverlayStep(0);
                setIsPccOverlayOpen(true);
              }}
              className="p-5 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 transition-all group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                {p.icon}
              </div>
              <div className="text-sm font-bold text-white mb-1">{p.title}</div>
              <div className="text-[10px] text-white/50 leading-tight">{p.sub}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 border rounded-2xl p-6 mb-6">
        <div className="text-sm font-bold flex items-center gap-2 mb-4">
          <Search size={16} /> {data.trackingCard.title}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {data.trackingCard.fields.map((f: any) => {
            const isDate = f.id === "date";
            const todayStr = new Date().toISOString().split("T")[0];
            const currentVal = (pccData as any)[f.id] || "";
            const MAX_LEN = 20;
            return (
              <div key={f.id} className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    {f.label}
                  </label>
                  {!isDate && (
                    <span
                      className={`text-[9px] font-medium ${currentVal.length >= MAX_LEN ? "text-red-500" : "text-slate-400"}`}
                    >
                      {currentVal.length}/{MAX_LEN}
                    </span>
                  )}
                </div>
                <input
                  type={isDate ? "date" : "text"}
                  value={currentVal}
                  max={isDate ? todayStr : undefined}
                  maxLength={!isDate ? MAX_LEN : undefined}
                  placeholder={
                    !isDate ? (f.id === "receipt" ? "e.g. PCC-2024-001234" : "Optional") : undefined
                  }
                  onChange={(e) => {
                    let val = e.target.value;
                    if (!isDate) {
                      val = val.replace(/[^a-zA-Z0-9\-\/\s]/g, "").toUpperCase();
                      if (val.length > MAX_LEN) val = val.slice(0, MAX_LEN);
                      const err = validatePccField(f.id, val);
                      setErrors((prev) => ({ ...prev, [f.id]: err }));
                    }
                    setPccData({ ...pccData, [f.id]: val });
                  }}
                  className={`p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-sm ${
                    errors[f.id] ? "border-red-500 bg-red-50/30" : "border-slate-200"
                  }`}
                />
                {errors[f.id] && (
                  <span className="text-[9px] font-bold text-red-500 uppercase px-1">
                    {errors[f.id]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={async () => {
            if (guard && !guard()) return;
            // Final validation check
            const receiptErr = validatePccField("receipt", pccData.receipt);
            const trackErr = validatePccField("track", pccData.track);

            if (receiptErr || trackErr) {
              setErrors({ receipt: receiptErr, track: trackErr });
              toast.error(msg(E.PCC_FIELD_FORMAT_INVALID));
              return;
            }

            if (!pccData.date) {
              toast.error(msg(E.POLICE_STEP1_INCOMPLETE));
              return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (new Date(pccData.date) > today) {
              toast.error(msg(E.POLICE_APPLICATION_DATE_FUTURE));
              return;
            }

            setIsSaving(true);
            try {
              setPccSaved(true);
              await actions.updateMetadata({
                pcc_saved: "true",
                pcc_receipt: pccData.receipt,
                pcc_track: pccData.track,
                pcc_date: pccData.date,
              });
              toast.success(msg(E.PCC_TRACKING_SAVED));
            } finally {
              setIsSaving(false);
            }
          }}
          disabled={isSaving}
          className="w-full bg-primary text-white py-3.5 rounded-xl font-bold disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSaving ? "Saving..." : data.trackingCard.buttonLabel}
        </button>
      </div>

      {pccSaved && !pccReceived && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex flex-col gap-4">
          <div>
            <div className="text-sm font-bold text-amber-900 mb-1">📌 {data.pendingCard.title}</div>
            <div className="text-xs text-amber-800 leading-relaxed">{data.pendingCard.body}</div>
          </div>
          <button
            onClick={async () => {
              if (guard && !guard()) return;
              setIsSaving(true);
              try {
                setPccReceived(true);
                await actions.updateMetadata({ pcc_received: "true" });
                toast.success(msg(E.PCC_MARKED_RECEIVED));
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={isSaving}
            className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : data.pendingCard.buttonLabel}
          </button>
        </div>
      )}

      {pccReceived && (
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex flex-col gap-4">
          <div>
            <div className="text-sm font-bold text-emerald-900 mb-1 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" /> {data.receivedCard.title}
            </div>
            <div className="text-xs text-emerald-800 leading-relaxed">{data.receivedCard.body}</div>
          </div>
          {isPccUploaded ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-[13px] bg-emerald-100/50 py-3 px-4 rounded-xl border border-emerald-200">
                <CheckCircle2 size={16} strokeWidth={2.5} />
                Saved successfully to Vault
              </div>
              <button
                onClick={() => {
                  if (guard && !guard()) return;
                  if (openUploadModal && setActiveUploadId && setActiveUploadType) {
                    setActiveUploadId("pcc_upload");
                    setActiveUploadType("doc");
                    openUploadModal("police-certificate-pakistan");
                    } else {
                    toast.error(msg(E.VAULT_NOT_CONFIGURED));
                  }
                }}
                className="w-full bg-emerald-600/10 text-emerald-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-emerald-200 transition-all hover:bg-emerald-600/20 active:scale-[0.98]"
              >
                <Upload size={16} /> Replace Document
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (guard && !guard()) return;
                if (openUploadModal && setActiveUploadId && setActiveUploadType) {
                  setActiveUploadId("pcc_upload");
                  setActiveUploadType("doc");
                  openUploadModal("police-certificate-pakistan");
                } else {
                  toast.error(msg(E.VAULT_NOT_CONFIGURED));
                }
              }}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-emerald-700 active:scale-[0.98]"
            >
              <Upload size={16} /> {data.receivedCard.buttonLabel}
            </button>
          )}
        </div>
      )}

      {isPccOverlayOpen && (
        <div className="fixed inset-0 z-200 bg-white flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-6 border-b flex items-center gap-4">
            <button
              onClick={() => setIsPccOverlayOpen(false)}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <X size={20} className="text-slate-600" />
            </button>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{
                  width: `${((pccOverlayStep + 1) / currentSteps.length) * 100}%`,
                }}
              />
            </div>
            <div className="text-xs font-bold text-slate-400">
              {pccOverlayStep + 1} / {currentSteps.length}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center">
            <div className="w-full max-w-lg">
              <div className="text-[10px] font-bold text-primary uppercase mb-2">
                {currentSteps[pccOverlayStep].label}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {currentSteps[pccOverlayStep].heading}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-8">
                {currentSteps[pccOverlayStep].instruction}
              </p>

              {pccOverlayStep === 0 && pccOverlayMode === "service" && (
                <div className="flex justify-center items-center">
                  <button
                    onClick={() => {
                      if (tier !== "executive") {
                        setShowUpgradeModal(true);
                      } else {
                        window.open("/police-verification/apply?province=Sindh", "_blank");
                      }
                    }}
                    className="relative w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-colors mb-4"
                  >
                    {tier !== "executive" && (
                      <div className="absolute top-2 left-2 bg-white/20 p-1 rounded-md">
                        <Lock size={12} className="text-white" />
                      </div>
                    )}
                    Apply for PCC
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                {pccOverlayStep > 0 && (
                  <button
                    onClick={() => setPccOverlayStep((v: number) => v - 1)}
                    className="p-4 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={() => {
                    if (pccOverlayStep < currentSteps.length - 1) {
                      setPccOverlayStep((v: number) => v + 1);
                    } else {
                      setIsPccOverlayOpen(false);
                    }
                  }}
                  className="flex-1 bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                >
                  {pccOverlayStep === currentSteps.length - 1 ? "Finish Guide" : "Next →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showUpgradeModal && (
        <UpgradeModal feature="Executive PCC Filing" onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
};

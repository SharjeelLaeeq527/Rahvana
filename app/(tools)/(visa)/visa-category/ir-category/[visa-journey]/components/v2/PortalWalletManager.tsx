"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, X } from "lucide-react";

interface PortalCredential {
  id: string;
  portal_type: string;
  username: string;
  password: string | null;
  nvc_case_number?: string | null;
  nvc_invoice_id?: string | null;
  security_questions: { id: string; question: string; answer: string | null }[];
}

interface CeacCredsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData: PortalCredential | null;
  isSubmitting: boolean;
}

export const CeacCredsModal: React.FC<CeacCredsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSubmitting,
}) => {
  const [caseNumber, setCaseNumber] = useState(initialData?.nvc_case_number || "");
  const [invoiceId, setInvoiceId] = useState(initialData?.nvc_invoice_id || "");
  const [email, setEmail] = useState(initialData?.username || "");
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const handleSave = async () => {
    const newErrors: Record<string, boolean> = {};
    if (!caseNumber.trim()) newErrors.caseNumber = true;
    if (!invoiceId.trim()) newErrors.invoiceId = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSave({
      portalType: "NVC",
      nvcCaseNumber: caseNumber.trim(),
      nvcInvoiceId: invoiceId.trim(),
      username: email.trim(),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-5 font-sans animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-[#0c1b33]/55 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[460px] max-h-[88vh] bg-[#fafcff] rounded-[16px] shadow-[0_24px_80px_rgba(12,27,51,0.32),0_4px_20px_rgba(12,27,51,0.16)] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-3 duration-240">
        <div className="p-6 pb-4 flex items-start justify-between">
          <div>
            <h2 className=" text-[22px] text-[#0c1b33] leading-tight font-black">
              CEAC Access Details
            </h2>
            <p className="text-[13px] text-[#6b8097] mt-1">
              Stored in your Rahvana Portal Wallet
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f4f7fb] border-none flex items-center justify-center text-[#3a4f63] hover:bg-[#d0e4f7] transition-all cursor-pointer"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="h-px bg-[#d0e4f7] mb-5" />

          <div className="flex flex-col gap-3.5 mb-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#6b8097] uppercase tracking-[0.04em]">
                NVC Case Number
              </label>
              <input
                type="text"
                value={caseNumber}
                onChange={(e) => {
                  setCaseNumber(e.target.value);
                  if (errors.caseNumber)
                    setErrors({ ...errors, caseNumber: false });
                }}
                placeholder="e.g. ISL2026XXXXXX"
                className={`p-[11px_14px] border-[1.5px] rounded-[10px] text-[14px] bg-white outline-none transition-all
                  ${errors.caseNumber ? "border-[#f87171] bg-[#fff5f5]" : "border-[#d0e4f7] focus:border-[#3b7dd8] focus:shadow-[0_0_0_3px_rgba(59,125,216,0.12)]"}
                `}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#6b8097] uppercase tracking-[0.04em]">
                Invoice ID Number
              </label>
              <input
                type="text"
                value={invoiceId}
                onChange={(e) => {
                  setInvoiceId(e.target.value);
                  if (errors.invoiceId)
                    setErrors({ ...errors, invoiceId: false });
                }}
                placeholder="Enter your Invoice ID"
                className={`p-[11px_14px] border-[1.5px] rounded-[10px] text-[14px] bg-white outline-none transition-all
                  ${errors.invoiceId ? "border-[#f87171] bg-[#fff5f5]" : "border-[#d0e4f7] focus:border-[#3b7dd8] focus:shadow-[0_0_0_3px_rgba(59,125,216,0.12)]"}
                `}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#6b8097] uppercase tracking-[0.04em]">
                Notification Email{" "}
                <span className="lowercase font-normal tracking-normal text-[11px] text-[#6b8097]">
                  (optional)
                </span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="p-[11px_14px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] bg-white outline-none focus:border-[#3b7dd8] focus:shadow-[0_0_0_3px_rgba(59,125,216,0.12)] transition-all"
              />
            </div>
          </div>

          <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-3 mb-[18px] flex gap-2.5">
            <ShieldCheck
              size={14}
              className="text-[#8a6200] shrink-0 mt-0.5"
              strokeWidth={2}
            />
            <p className="text-[12px] text-[#8a6200] leading-normal font-sans">
              Your details are stored locally on your device for this session.
              To manage or update them permanently, use your full Portal Wallet.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full p-[14px_24px] bg-[#3b7dd8] text-white border-none rounded-[10px] text-[15px] font-semibold hover:bg-[#3b7dd8]/70 hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? "Saving..." : "Save Details"}
          </button>
        </div>
      </div>
    </div>
  );
};

interface NvcFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  onSave: (newData: any) => void;
}

export const NvcFeeModal: React.FC<NvcFeeModalProps> = ({
  isOpen,
  onClose,
  data,
  onSave,
}) => {
  const [localData, setLocalData] = useState(data);

  useEffect(() => {
    if (isOpen) {
      setLocalData({
        ...data,
        aos:
          data.aos === "Not Started"
            ? "Not paid"
            : data.aos === "Pending"
              ? "In process"
              : data.aos,
        iv:
          data.iv === "Not Started"
            ? "Not paid"
            : data.iv === "Pending"
              ? "In process"
              : data.iv,
      });
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-5">
      <div
        className="absolute inset-0 bg-[#0c1b33]/55 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative bg-white w-full max-w-[460px] rounded-[16px] shadow-[0_24px_80px_rgba(12,27,51,0.32),0_4px_20px_rgba(12,27,51,0.16)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-3 duration-240 ease-out">
        <div className="max-h-[88vh] overflow-y-auto">
          <div className="flex items-start justify-between p-[24px_24px_0] mb-[18px]">
            <div>
              <h3 className=" font-black text-[22px] text-[#0c1b33] leading-tight">
                NVC Fee Payment Status
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#eef3fa] flex items-center justify-center text-[#3a4f63] hover:bg-[#d0e4f7] transition-colors"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>

          <div className="p-[0_24px_24px]">
            <div className="h-px bg-[#d0e4f7] mb-[20px]" />
            <div className="flex flex-col gap-[14px]">
              <div className="flex flex-col gap-[5px]">
                <label className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6b8097]">
                  Affidavit of Support Fee
                </label>
                <select
                  value={localData.aos}
                  onChange={(e) =>
                    setLocalData({ ...localData, aos: e.target.value })
                  }
                  className="p-[11px_14px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#1c2b3a] bg-white outline-none focus:border-[#3b7dd8] focus:ring-4 focus:ring-[#3b7dd8]/12 transition-all appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b8097%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_12px_center]"
                >
                  <option value="">Select status…</option>
                  <option value="Not paid">Not paid</option>
                  <option value="In process">In process</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <div className="flex flex-col gap-[5px]">
                <label className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6b8097]">
                  Immigrant Visa Fee
                </label>
                <select
                  value={localData.iv}
                  onChange={(e) =>
                    setLocalData({ ...localData, iv: e.target.value })
                  }
                  className="p-[11px_14px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#1c2b3a] bg-white outline-none focus:border-[#3b7dd8] focus:ring-4 focus:ring-[#3b7dd8]/12 transition-all appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b8097%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_12px_center]"
                >
                  <option value="">Select status…</option>
                  <option value="Not paid">Not paid</option>
                  <option value="In process">In process</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <div className="flex flex-col gap-[5px]">
                <label className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6b8097]">
                  Date Payment Submitted
                </label>
                <input
                  type="date"
                  value={localData.date}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    setLocalData({ ...localData, date: e.target.value })
                  }
                  className="p-[11px_14px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#1c2b3a] bg-white outline-none focus:border-[#3b7dd8] focus:ring-4 focus:ring-[#3b7dd8]/12 transition-all"
                />
              </div>

              <div className="flex flex-col gap-[5px]">
                <label className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6b8097]">
                  Payment Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid via credit card"
                  value={localData.note}
                  onChange={(e) =>
                    setLocalData({ ...localData, note: e.target.value })
                  }
                  className="p-[11px_14px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#1c2b3a] bg-white outline-none focus:border-[#3b7dd8] focus:ring-4 focus:ring-[#3b7dd8]/12 transition-all"
                />
              </div>
            </div>

            <div className="flex items-start gap-[13px] bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[11px_13px] mt-[18px] mb-[18px]">
              <ShieldCheck size={13} className="text-[#8a6200] mt-1 shrink-0" />
              <span className="text-[12px] text-[#8a6200] leading-normal">
                Details are stored locally for this session. Manage or update
                them in your Portal Wallet.
              </span>
            </div>

            <button
              onClick={() => onSave(localData)}
              className="w-full p-[14px_24px] bg-[#3b7dd8] text-white rounded-[10px] font-semibold text-[15px] hover:bg-[#3b7dd8]/70 hover:-translate-y-px transition-all active:translate-y-0 shadow-[0_4px_20px_rgba(47,111,212,0.35)]"
            >
              Save Payment Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ApUpdateModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: any) => void;
  ceacOptions: string[];
}> = ({ isOpen, onClose, onSave, ceacOptions }) => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [ceac, setCeac] = useState("");
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-300 bg-black/40 backdrop-blur-xs flex items-center justify-center p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-[16px] shadow-[0_24px_80px_rgba(12,27,51,0.32),0_4px_20px_rgba(12,27,51,0.16)] w-full max-w-[440px] animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-start justify-between p-6 pb-0 mb-4">
          <h2 className="text-[20px] text-[#0c1b33]">Log a Case Update</h2>
          <button
            onClick={onClose}
            className="w-[30px] h-[30px] rounded-full bg-[#f4f7fb] flex items-center justify-center hover:bg-[#d0e4f7] transition-all"
          >
            <X size={13} className="text-[#3a4f63]" />
          </button>
        </div>

        <div className="p-6 pt-0">
          <div className="h-px bg-[#d0e4f7] mb-4" />
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-[#6b8097]">
                Update Date
              </label>
              <input
                type="date"
                value={date}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="p-2.5 border-[1.5px] border-[#d0e4f7] rounded-lg text-[14px] outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-[#6b8097]">
                CEAC Status Observed
              </label>
              <select
                value={ceac}
                onChange={(e) => setCeac(e.target.value)}
                className="p-2.5 border-[1.5px] border-[#d0e4f7] rounded-lg text-[14px] outline-none focus:border-primary transition-all"
              >
                <option value="">Select...</option>
                {ceacOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-[#6b8097]">
                Notes
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. CEAC still shows AP..."
                className="p-2.5 border-[1.5px] border-[#d0e4f7] rounded-lg text-[14px] outline-none focus:border-primary transition-all min-h-[70px]"
              />
            </div>

            <button
              onClick={() => {
                onSave({ date, ceac, note, id: Date.now().toString() });
                onClose();
              }}
              className="w-full p-3.5 bg-primary text-white rounded-lg font-bold transition-all hover:bg-primary/90"
            >
              Save Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

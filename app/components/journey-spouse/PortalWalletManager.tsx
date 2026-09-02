"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, X } from "lucide-react";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setCaseNumber(initialData?.nvc_case_number || "");
      setInvoiceId(initialData?.nvc_invoice_id || "");
      setEmail(initialData?.username || "");
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    const cleanCase = caseNumber.trim().toUpperCase();
    const cleanInvoice = invoiceId.trim().toUpperCase();

    if (!cleanCase) {
      newErrors.caseNumber = "Case Number is required.";
    } else if (!/^[A-Z]{3}[0-9]{10}$/.test(cleanCase)) {
      newErrors.caseNumber =
        "Must be exactly 3 letters followed by 10 digits (e.g. ISL2024123456).";
    }

    if (!cleanInvoice) {
      newErrors.invoiceId = "Invoice ID is required.";
    } else if (!/^[A-Z0-9]{8,15}$/.test(cleanInvoice)) {
      newErrors.invoiceId = "Must be 8-15 alphanumeric characters.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSave({
      portalType: "NVC",
      nvcCaseNumber: cleanCase,
      nvcInvoiceId: cleanInvoice,
      username: email.trim(),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-300 flex items-center justify-center p-5 font-sans duration-200">
      <div className="absolute inset-0 bg-[#0c1b33]/55 backdrop-blur-xs" onClick={onClose} />

      <div className="animate-in zoom-in-95 slide-in-from-bottom-3 relative max-h-[88vh] w-full max-w-[460px] overflow-y-auto rounded-[16px] bg-[#fafcff] shadow-[0_24px_80px_rgba(12,27,51,0.32),0_4px_20px_rgba(12,27,51,0.16)] duration-240">
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h2 className="text-[22px] leading-tight font-black text-[#0c1b33]">
              CEAC Access Details
            </h2>
            <p className="mt-1 text-[13px] text-[#6b8097]">Stored in your Rahvana Portal Wallet</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-[#f4f7fb] text-[#3a4f63] transition-all hover:bg-[#d0e4f7]"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="mb-5 h-px bg-[#d0e4f7]" />

          <div className="mb-5 flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold tracking-[0.04em] text-[#6b8097] uppercase">
                NVC Case Number
              </label>
              <input
                type="text"
                value={caseNumber}
                onChange={(e) => {
                  setCaseNumber(e.target.value.toUpperCase());
                  if (errors.caseNumber) setErrors({ ...errors, caseNumber: "" });
                }}
                placeholder="e.g. ISL2026XXXXXX"
                className={`rounded-[10px] border-[1.5px] bg-white p-[11px_14px] text-[14px] transition-all outline-none ${errors.caseNumber ? "border-[#f87171] bg-[#fff5f5]" : "border-[#d0e4f7] focus:border-[#3b7dd8] focus:shadow-[0_0_0_3px_rgba(59,125,216,0.12)]"} `}
              />
              {errors.caseNumber && (
                <p className="mt-0.5 text-xs font-medium text-red-500">{errors.caseNumber}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold tracking-[0.04em] text-[#6b8097] uppercase">
                Invoice ID Number
              </label>
              <input
                type="text"
                value={invoiceId}
                onChange={(e) => {
                  setInvoiceId(e.target.value.toUpperCase());
                  if (errors.invoiceId) setErrors({ ...errors, invoiceId: "" });
                }}
                placeholder="Enter your Invoice ID"
                className={`rounded-[10px] border-[1.5px] bg-white p-[11px_14px] text-[14px] transition-all outline-none ${errors.invoiceId ? "border-[#f87171] bg-[#fff5f5]" : "border-[#d0e4f7] focus:border-[#3b7dd8] focus:shadow-[0_0_0_3px_rgba(59,125,216,0.12)]"} `}
              />
              {errors.invoiceId && (
                <p className="mt-0.5 text-xs font-medium text-red-500">{errors.invoiceId}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold tracking-[0.04em] text-[#6b8097] uppercase">
                Notification Email{" "}
                <span className="text-[11px] font-normal tracking-normal text-[#6b8097] lowercase">
                  (optional)
                </span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="rounded-[10px] border-[1.5px] border-[#d0e4f7] bg-white p-[11px_14px] text-[14px] transition-all outline-none focus:border-[#3b7dd8] focus:shadow-[0_0_0_3px_rgba(59,125,216,0.12)]"
              />
            </div>
          </div>

          {/* <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-3 mb-[18px] flex gap-2.5">
            <ShieldCheck
              size={14}
              className="text-[#8a6200] shrink-0 mt-0.5"
              strokeWidth={2}
            />
            <p className="text-[12px] text-[#8a6200] leading-normal font-sans">
              Your details are stored locally on your device for this session.
              To manage or update them permanently, use your full Portal Wallet.
            </p>
          </div> */}

          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 w-full rounded-[10px] border-none p-[14px_24px] text-[15px] font-semibold text-white transition-all hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
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

export const NvcFeeModal: React.FC<NvcFeeModalProps> = ({ isOpen, onClose, data, onSave }) => {
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
        iv: data.iv === "Not Started" ? "Not paid" : data.iv === "Pending" ? "In process" : data.iv,
      });
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-5">
      <div
        className="animate-in fade-in absolute inset-0 bg-[#0c1b33]/55 backdrop-blur-xs duration-200"
        onClick={onClose}
      />
      <div className="animate-in zoom-in-95 slide-in-from-bottom-3 relative w-full max-w-[460px] overflow-hidden rounded-[16px] bg-white shadow-[0_24px_80px_rgba(12,27,51,0.32),0_4px_20px_rgba(12,27,51,0.16)] duration-240 ease-out">
        <div className="max-h-[88vh] overflow-y-auto">
          <div className="mb-[18px] flex items-start justify-between p-[24px_24px_0]">
            <div>
              <h3 className="text-[22px] leading-tight font-black text-[#0c1b33]">
                NVC Fee Payment Status
              </h3>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef3fa] text-[#3a4f63] transition-colors hover:bg-[#d0e4f7]"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>

          <div className="p-[0_24px_24px]">
            <div className="mb-[20px] h-px bg-[#d0e4f7]" />
            <div className="flex flex-col gap-[14px]">
              <div className="flex flex-col gap-[5px]">
                <label className="text-[12px] font-semibold tracking-[0.04em] text-[#6b8097] uppercase">
                  Affidavit of Support Fee
                </label>
                <CustomDropdown
                  value={localData.aos}
                  onChange={(value) => setLocalData({ ...localData, aos: value })}
                  options={[
                    { value: "", label: "Select status..." },
                    { value: "Not paid", label: "Not paid" },
                    { value: "In process", label: "In process" },
                    { value: "Paid", label: "Paid" },
                  ]}
                  placeholder="Select status..."
                  className="w-full [&_button]:w-full [&_button]:min-w-0"
                />
              </div>

              <div className="flex flex-col gap-[5px]">
                <label className="text-[12px] font-semibold tracking-[0.04em] text-[#6b8097] uppercase">
                  Immigrant Visa Fee
                </label>
                <CustomDropdown
                  value={localData.iv}
                  onChange={(value) => setLocalData({ ...localData, iv: value })}
                  options={[
                    { value: "", label: "Select status..." },
                    { value: "Not paid", label: "Not paid" },
                    { value: "In process", label: "In process" },
                    { value: "Paid", label: "Paid" },
                  ]}
                  placeholder="Select status..."
                  className="w-full [&_button]:w-full [&_button]:min-w-0"
                />
              </div>

              <div className="flex flex-col gap-[5px]">
                <label className="text-[12px] font-semibold tracking-[0.04em] text-[#6b8097] uppercase">
                  Date Payment Submitted
                </label>
                <input
                  type="date"
                  value={localData.date || ""}
                  onChange={(e) => setLocalData({ ...localData, date: e.target.value })}
                  max={new Date().toISOString().split("T")[0]}
                  className="rounded-[10px] border-[1.5px] border-[#d0e4f7] bg-white p-[11px_14px] text-[14px] text-[#1c2b3a] transition-all outline-none focus:border-[#3b7dd8] focus:ring-4 focus:ring-[#3b7dd8]/12"
                />
              </div>

              <div className="flex flex-col gap-[5px]">
                <label className="text-[12px] font-semibold tracking-[0.04em] text-[#6b8097] uppercase">
                  Payment Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid via credit card"
                  value={localData.note}
                  onChange={(e) => setLocalData({ ...localData, note: e.target.value })}
                  className="rounded-[10px] border-[1.5px] border-[#d0e4f7] bg-white p-[11px_14px] text-[14px] text-[#1c2b3a] transition-all outline-none focus:border-[#3b7dd8] focus:ring-4 focus:ring-[#3b7dd8]/12"
                />
              </div>
            </div>

            <button
              onClick={() => onSave(localData)}
              className="mt-6 w-full rounded-[10px] bg-[#0d7377] p-[14px_24px] text-[15px] font-semibold text-white shadow-[0_4px_20px_rgba(47,111,212,0.35)] transition-all hover:-translate-y-px hover:bg-[#0d7377]/90 active:translate-y-0"
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
  ceacOptions: { label: string; value: string }[];
}> = ({ isOpen, onClose, onSave, ceacOptions }) => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [ceac, setCeac] = useState("");
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-300 flex items-center justify-center bg-black/40 p-5 backdrop-blur-xs duration-200">
      <div className="animate-in slide-in-from-bottom-4 w-full max-w-[440px] rounded-[16px] bg-white shadow-[0_24px_80px_rgba(12,27,51,0.32),0_4px_20px_rgba(12,27,51,0.16)] duration-300">
        <div className="mb-4 flex items-start justify-between p-6 pb-0">
          <h2 className="text-[20px] text-[#0c1b33]">Log a Case Update</h2>
          <button
            onClick={onClose}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#f4f7fb] transition-all hover:bg-[#d0e4f7]"
          >
            <X size={13} className="text-[#3a4f63]" />
          </button>
        </div>

        <div className="p-6 pt-0">
          <div className="mb-4 h-px bg-[#d0e4f7]" />
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold tracking-wide text-[#6b8097] uppercase">
                Update Date
              </label>
              <input
                type="date"
                value={date}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="focus:border-primary rounded-lg border-[1.5px] border-[#d0e4f7] p-2.5 text-[14px] transition-all outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold tracking-wide text-[#6b8097] uppercase">
                CEAC Status Observed
              </label>
              <CustomDropdown
                value={ceac}
                onChange={setCeac}
                options={[{ value: "", label: "Select..." }, ...ceacOptions]}
                placeholder="Select..."
                className="w-full [&_button]:w-full [&_button]:min-w-0"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold tracking-wide text-[#6b8097] uppercase">
                Notes
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. CEAC still shows AP..."
                className="focus:border-primary min-h-[70px] rounded-lg border-[1.5px] border-[#d0e4f7] p-2.5 text-[14px] transition-all outline-none"
              />
            </div>

            <button
              onClick={() => {
                onSave({ date, ceac, note, id: Date.now().toString() });
                onClose();
              }}
              className="bg-primary hover:bg-primary/90 w-full rounded-lg p-3.5 font-bold text-white transition-all"
            >
              Save Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useToast } from "@/app/components/shared/ToastProvider";
import { motion } from "framer-motion";
import { X, Eye, Download } from "lucide-react";
import { E, msg } from "@/lib/errors";

interface AuthorityFormData {
  fullName: string;
  relationType: string;
  relationName: string;
  cnic: string;
  authFullName: string;
  authRelationType: string;
  authRelationName: string;
  authCnic: string;
  authRelationship: string;
  authAddress: string;
  passportNo: string;
  abroadAddress: string;
  officeLocation: string;
  stayFrom: string;
  stayTo: string;
}

interface AuthorityLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPreview: () => void;
  formData: AuthorityFormData;
  setFormData: React.Dispatch<React.SetStateAction<AuthorityFormData>>;
  province: string;
}

export function AuthorityLetterModal({
  isOpen,
  onClose,
  onOpenPreview,
  formData,
  setFormData,
  province,
}: AuthorityLetterModalProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  const formatCNIC = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    let formatted = cleaned;
    if (cleaned.length > 5 && cleaned.length <= 12) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    } else if (cleaned.length > 12) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
    }
    return formatted;
  };

  const validatePhone = (phone: string) => {
    return /^\+?[0-9]*$/.test(phone);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let newValue = value;
    let error = "";

    if (name === "cnic" || name === "authCnic") {
      newValue = formatCNIC(value);
      if (newValue.replace(/-/g, "").length !== 13) {
        error = "CNIC must be 13 digits";
      }
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const downloadPDF = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

    try {
      const res = await fetch(`${apiUrl}/fill-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: "authority_letter",
          data: { ...formData, province },
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Authority_Letter_${formData.fullName.replace(/\s+/g, "_") || "unnamed"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert(msg(E.PDF_CONVERTER_FAILED));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm px-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-2xl my-auto rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 md:p-8 overflow-y-auto bg-white">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Generate Authority Letter</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-primary/30 rounded-full transition-colors bg-primary/10"
            >
              <X size={24} className="text-gray-500 " />
            </button>
          </div>

          <div className="pb-4">
            Note: The authority letter must be stamped by the relevant Embassy, otherwise it should
            be attested by two respectable persons who are known to the applicant.
          </div>

          <form className="space-y-6 text-left">
            {/* Applicant Abroad Section */}
            <div className="space-y-4">
              <h3 className="font-bold text-primary border-b border-primary/10 pb-2">
                Applicant (Currently Abroad)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">CNIC</label>
                  <input
                    type="text"
                    name="cnic"
                    value={formData.cnic}
                    onChange={handleChange}
                    maxLength={15}
                    placeholder="XXXXX-XXXXXXX-X"
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Relation Type</label>
                  <select
                    name="relationType"
                    value={formData.relationType}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  >
                    <option value="S/O">S/O</option>
                    <option value="D/O">D/O</option>
                    <option value="W/O">W/O</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">
                    Father/Guardian Name
                  </label>
                  <input
                    type="text"
                    name="relationName"
                    value={formData.relationName}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Passport No</label>
                  <input
                    type="text"
                    name="passportNo"
                    value={formData.passportNo}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Address Abroad</label>
                  <input
                    type="text"
                    name="abroadAddress"
                    value={formData.abroadAddress}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Stay Duration From</label>
                  <input
                    type="date"
                    name="stayFrom"
                    value={formData.stayFrom}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Stay Duration To</label>
                  <input
                    type="date"
                    name="stayTo"
                    value={formData.stayTo}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Authorized Person Section */}
            <div className="space-y-4">
              <h3 className="font-bold text-primary border-b border-primary/10 pb-2">
                Authorized Person (In Pakistan)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Full Name</label>
                  <input
                    type="text"
                    name="authFullName"
                    value={formData.authFullName}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">CNIC</label>
                  <input
                    type="text"
                    name="authCnic"
                    value={formData.authCnic}
                    onChange={handleChange}
                    maxLength={15}
                    placeholder="XXXXX-XXXXXXX-X"
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Relation Type</label>
                  <select
                    name="authRelationType"
                    value={formData.authRelationType}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  >
                    <option value="S/O">S/O</option>
                    <option value="D/O">D/O</option>
                    <option value="W/O">W/O</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">
                    Father/Guardian Name
                  </label>
                  <input
                    type="text"
                    name="authRelationName"
                    value={formData.authRelationName}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">
                    Relationship to Applicant
                  </label>
                  <select
                    name="authRelationship"
                    value={formData.authRelationship}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Brother">Brother</option>
                    <option value="Son">Son</option>
                    <option value="Cousin">Cousin</option>
                    <option value="Relative">Relative</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">
                    Office Location (City)
                  </label>
                  <input
                    type="text"
                    name="officeLocation"
                    value={formData.officeLocation}
                    onChange={handleChange}
                    placeholder="e.g. Quetta"
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600">
                  Residential Address (In Pakistan)
                </label>
                <textarea
                  name="authAddress"
                  value={formData.authAddress}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none min-h-[80px]"
                />
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={onOpenPreview}
                disabled={!formData.fullName || !formData.authFullName}
                className="flex-1 py-4 bg-gray-100 text-gray-800 font-bold rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Eye size={20} /> Preview
              </button>
              <button
                type="button"
                onClick={downloadPDF}
                disabled={!formData.fullName || !formData.authFullName}
                className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download size={20} /> Download PDF
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export function AuthorityLetterPreviewModal({
  isOpen,
  onClose,
  formData,
  province,
}: {
  isOpen: boolean;
  onClose: () => void;
  formData: AuthorityFormData;
  province: string;
}) {
  const downloadPDF = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

    try {
      const res = await fetch(`${apiUrl}/fill-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: "authority_letter",
          data: { ...formData, province },
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Authority_Letter_${formData.fullName.replace(/\s+/g, "_") || "unnamed"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert(msg(E.PDF_CONVERTER_FAILED));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800">Preview</h2>
            <button
              onClick={downloadPDF}
              className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg flex items-center gap-2 whitespace-nowrap"
            >
              <Download size={16} /> Download
            </button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 flex justify-center">
          <div className="shadow-lg w-full max-w-[210mm] bg-white p-20 min-h-[297mm] font-serif transition-all">
            <AuthorityLetterContent formData={formData} province={province} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function AuthorityLetterContent({
  formData,
  province,
}: {
  formData: AuthorityFormData;
  province: string;
}) {
  return (
    <div className="space-y-8 text-black" style={{ fontSize: "12pt", lineHeight: "1.8" }}>
      <div className="text-right italic underline text-sm">Specimen Authority Letter</div>

      <div className="text-center font-bold text-xl underline uppercase tracking-wider">
        Authority Letter
      </div>

      <div className="space-y-4 pt-10">
        <div>
          I, Mr./Mrs. <b>{formData.fullName || "________________________"}</b>
        </div>
        <div>
          {formData.relationType}, <b>{formData.relationName || "________________________"}</b>
        </div>
        <div>
          CNIC No. <b>{formData.cnic || "________________________"}</b>
        </div>

        <div className="">Hereby authorized my real {formData.authRelationship || "relative"}</div>

        <div>
          Mr./Mrs. <b>{formData.authFullName || "________________________"}</b>
        </div>
        <div>
          {formData.authRelationType || "S/O"},{" "}
          <b>{formData.authRelationName || "________________________"}</b>
        </div>
        <div>
          CNIC No. <b>{formData.authCnic || "________________________"}</b>
        </div>
        <div>
          Resident of <b>{formData.authAddress || "________________________"}</b>
        </div>

        <div className="">
          to process and signed my behalf and collect my Police Clearance Certificate from SSP
          Office, {formData.officeLocation || province || "Islamabad"}.
        </div>
      </div>

      <div className="pt-20 space-y-2 w-1/2 ml-auto">
        <div>Signature ___________________________</div>
        <div>
          Name: <b>{formData.fullName || "________________________"}</b>
        </div>
        <div>
          Fathers Name <b>{formData.relationName || "________________________"}</b>
        </div>
        <div>
          Passport No. <b>{formData.passportNo || "________________________"}</b>
        </div>
        <div>
          Address in Abroad <b>{formData.abroadAddress || "________________________"}</b>
        </div>
        <div>
          Stay Duration:{" "}
          <b>
            {formData.stayFrom && formData.stayTo
              ? `${formData.stayFrom} to ${formData.stayTo}`
              : "________________________"}
          </b>
        </div>
      </div>
    </div>
  );
}

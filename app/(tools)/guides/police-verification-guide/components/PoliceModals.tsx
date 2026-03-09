"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Eye,
  Download,
  AlertCircle,
  Navigation,
  Search,
  Building2,
  ExternalLink,
} from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

let scrollLockCount = 0;

function useScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      scrollLockCount++;
      document.body.style.overflow = "hidden";
      return () => {
        scrollLockCount--;
        if (scrollLockCount === 0) {
          document.body.style.overflow = "unset";
        }
      };
    }
  }, [isOpen]);
}

// External Imports for PKM Locator
import {
  PKMCenter,
  pkmCenters,
} from "../../../police-verification/(data)/punjab-pkm-centers";
import { balochistanCenters } from "../../../police-verification/(data)/balochistan-pkm-centers";
import { kpkCenters } from "../../../police-verification/(data)/kpk-centers";
import {
  findNearestCenters,
  geocodeAddress,
} from "../../../police-verification/location-utils";

export interface FormData {
  fullName: string;
  relation: string;
  guardianName: string;
  cnic: string;
  address: string;
  purpose: string;
  email: string;
  phone: string;
  district: string;
}

export interface AuthorityFormData {
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

// ==========================================
// 1. STANDARD LETTER MODALS
// ==========================================

export function LetterModal({
  isOpen,
  onClose,
  onOpenPreview,
  formData,
  setFormData,
  province,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenPreview: () => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  province: string;
}) {
  useScrollLock(isOpen);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^\+?[0-9]*$/.test(phone);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    let newValue = value;
    let error = "";

    if (name === "cnic") {
      newValue = formatCNIC(value);
      if (newValue.replace(/-/g, "").length !== 13)
        error = "CNIC must be 13 digits";
    } else if (name === "phone") {
      if (!validatePhone(value)) return;
      newValue = value;
    } else if (name === "email") {
      if (value && !validateEmail(value)) error = "Invalid email format";
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const downloadPDF = async () => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
    try {
      const res = await fetch(`${apiUrl}/fill-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: "police_verification",
          data: { ...formData, province },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Police_Verification_Letter_${formData.fullName.replace(/\s+/g, "_") || "unnamed"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm px-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-2xl my-auto rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 max-h-[90vh] md:max-h-[95vh]"
      >
        <div className="p-5 md:p-8 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Create Purpose Letter
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors bg-gray-100"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>

          <div className="pb-4 text-sm text-gray-600">
            This letter is required to explain the reason for requesting a
            Police Verification Certificate.
          </div>

          <form className="space-y-4 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-500">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-500">
                  Relation
                </label>
                <select
                  name="relation"
                  value={formData.relation}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none transition-all"
                >
                  <option value="S/O">S/O</option>
                  <option value="D/O">D/O</option>
                  <option value="W/O">W/O</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-500">
                Father/Guardian/Husband Name
              </label>
              <input
                type="text"
                name="guardianName"
                value={formData.guardianName}
                onChange={handleChange}
                placeholder="Enter guardian name"
                className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-500">
                CNIC Number{" "}
                {errors.cnic && (
                  <span className="text-red-500 text-xs ml-2">
                    ({errors.cnic})
                  </span>
                )}
              </label>
              <input
                type="text"
                name="cnic"
                value={formData.cnic}
                onChange={handleChange}
                placeholder="42101-1234567-1"
                maxLength={15}
                className={`w-full p-3 rounded-xl border outline-none transition-all ${errors.cnic ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-200 focus:border-primary"}`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-500">
                Full Residential Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your complete address"
                className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none transition-all min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-500">
                  Purpose
                </label>
                <select
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none transition-all"
                >
                  <option value="Study">Study</option>
                  <option value="Immigration">Immigration</option>
                  <option value="Foreign Employment">Foreign Employment</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-500">
                  District/Region
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="e.g. Karachi Central"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-500">
                  Email Address{" "}
                  {errors.email && (
                    <span className="text-red-500 text-xs ml-2">
                      (Invalid format)
                    </span>
                  )}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                  className={`w-full p-3 rounded-xl border outline-none transition-all ${errors.email ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-200 focus:border-primary"}`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-500">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-3 md:gap-4">
              <button
                type="button"
                onClick={onOpenPreview}
                disabled={
                  Object.values(errors).some((e) => e !== "") ||
                  !formData.fullName ||
                  !formData.cnic
                }
                className="flex-1 py-3 md:py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye size={20} /> Preview
              </button>
              <button
                type="button"
                onClick={downloadPDF}
                disabled={
                  Object.values(errors).some((e) => e !== "") ||
                  !formData.fullName ||
                  !formData.cnic
                }
                className="flex-1 py-3 md:py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

export function PreviewModal({
  isOpen,
  onClose,
  province,
  formData,
}: {
  isOpen: boolean;
  onClose: () => void;
  province: string;
  formData: FormData;
}) {
  useScrollLock(isOpen);

  const downloadPDF = async () => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
    try {
      const res = await fetch(`${apiUrl}/fill-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: "police_verification",
          data: { ...formData, province },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Police_Verification_Letter_${formData.fullName.replace(/\s+/g, "_") || "unnamed"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[95vh] border border-gray-200"
      >
        <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white sticky top-0 z-10 gap-4 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 flex-1 sm:flex-none">
              Letter Preview
            </h2>
            <button
              onClick={downloadPDF}
              className="px-3 md:px-4 py-1.5 md:py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
            >
              <Download size={16} />{" "}
              <span className="hidden xs:inline">Download</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:static p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-0 md:p-8 bg-gray-50 flex justify-center">
          <div className="shadow-none md:shadow-lg w-full max-w-[210mm] bg-white">
            <LetterContent formData={formData} province={province} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function LetterContent({
  formData,
  province,
}: {
  formData: FormData;
  province: string;
}) {
  return (
    <div
      className="bg-white text-black min-h-auto md:min-h-[297mm] p-6 md:p-12 lg:p-[20mm]"
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        lineHeight: "1.6",
        textAlign: "left",
        margin: "0 auto",
        fontSize: "12pt",
        boxSizing: "border-box",
      }}
    >
      <div className="mb-6 md:mb-10 text-lg md:text-xl font-bold underline text-center">
        Application for Issuance of Police Character Certificate
      </div>
      <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>To,</div>
      <div style={{ fontWeight: "bold" }}>
        The Senior Superintendent of Police (SSP)
      </div>
      <div style={{ marginBottom: "2rem" }}>
        {formData.district || "[District/Region]"}, {province}, Pakistan
      </div>
      <div style={{ fontWeight: "bold", marginBottom: "1rem" }}>
        Subject:{" "}
        <span style={{ textDecoration: "underline" }}>
          Application for Issuance of Police Character Certificate
        </span>
      </div>
      <div style={{ marginBottom: "1.5rem" }}>Respected Sir,</div>
      <div style={{ marginBottom: "1.5rem", textAlign: "justify" }}>
        I,{" "}
        <span style={{ fontWeight: "bold", textDecoration: "underline" }}>
          {formData.fullName || "[Full Name]"}
        </span>
        ,{" "}
        <span style={{ fontWeight: "bold", textDecoration: "underline" }}>
          {formData.relation}
        </span>{" "}
        <span style={{ fontWeight: "bold", textDecoration: "underline" }}>
          {formData.guardianName || "[Guardian Name]"}
        </span>
        , CNIC No.{" "}
        <span style={{ fontWeight: "bold", textDecoration: "underline" }}>
          {formData.cnic || "[CNIC Number]"}
        </span>
        , resident of{" "}
        <span style={{ fontWeight: "bold", textDecoration: "underline" }}>
          {formData.address || "[Full Residential Address]"}
        </span>
        , respectfully request the issuance of a Police Character Certificate in
        my favor.
      </div>
      <div style={{ marginBottom: "1.5rem", textAlign: "justify" }}>
        The certificate is required for{" "}
        <span style={{ fontWeight: "bold", textDecoration: "underline" }}>
          {formData.purpose}
        </span>{" "}
        purposes. I affirm that I have no criminal record, and the certificate
        is necessary for my overseas plans.
      </div>
      <div style={{ marginBottom: "2rem" }}>
        Kindly process my request at your earliest convenience. For any further
        information, you may contact me at:
      </div>
      <div style={{ marginBottom: "0.25rem" }}>
        <span style={{ fontWeight: "bold" }}>Email:</span>{" "}
        {formData.email || "[Email Address]"}
      </div>
      <div style={{ marginBottom: "2.5rem" }}>
        <span style={{ fontWeight: "bold" }}>Phone:</span>{" "}
        {formData.phone || "[Phone Number]"}
      </div>
      <div style={{ marginBottom: "2rem" }}>
        I shall remain grateful for your cooperation.
      </div>
      <div style={{ marginTop: "3rem" }}>
        <div style={{ fontWeight: "bold" }}>Sincerely,</div>
        <div style={{ marginTop: "1rem" }}>
          {formData.fullName || "[Full Name]"}
        </div>
        <div>CNIC: {formData.cnic || "[CNIC Number]"}</div>
        <div>Date: {new Date().toLocaleDateString()}</div>
      </div>
    </div>
  );
}

// ==========================================
// 2. AUTHORITY LETTER MODALS
// ==========================================

export function AuthorityLetterModal({
  isOpen,
  onClose,
  onOpenPreview,
  formData,
  setFormData,
  province,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenPreview: () => void;
  formData: AuthorityFormData;
  setFormData: React.Dispatch<React.SetStateAction<AuthorityFormData>>;
  province: string;
}) {
  useScrollLock(isOpen);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    let newValue = value;
    let error = "";
    if (name === "cnic" || name === "authCnic") {
      newValue = formatCNIC(value);
      if (newValue.replace(/-/g, "").length !== 13)
        error = "CNIC must be 13 digits";
    }
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const downloadPDF = async () => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
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
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm px-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-2xl my-auto rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[95vh]"
      >
        <div className="p-5 md:p-8 overflow-y-auto bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
              Create Authority Letter
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-primary/30 rounded-full transition-colors bg-gray-100"
            >
              <X size={24} className="text-gray-500 " />
            </button>
          </div>

          <div className="pb-4 text-sm text-gray-600">
            This letter is required when a blood relative applies on
            applicant&apos;s behalf(if applicant is abroad).
          </div>

          <div className="pb-4 text-sm text-gray-600">
            Note: The authority letter must be stamped by the relevant Embassy,
            otherwise it should be attested by two respectable persons who are
            known to the applicant.
          </div>

          <form className="space-y-6 text-left">
            <div className="space-y-4">
              <h3 className="font-bold text-primary border-b border-primary/10 pb-2">
                Applicant (Currently Abroad)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">
                    CNIC
                  </label>
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
                  <label className="text-sm font-semibold text-gray-600">
                    Relation Type
                  </label>
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
                  <label className="text-sm font-semibold text-gray-600">
                    Passport No
                  </label>
                  <input
                    type="text"
                    name="passportNo"
                    value={formData.passportNo}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">
                    Address Abroad
                  </label>
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
                  <label className="text-sm font-semibold text-gray-600">
                    Stay Duration From
                  </label>
                  <input
                    type="date"
                    name="stayFrom"
                    value={formData.stayFrom}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">
                    Stay Duration To
                  </label>
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

            <div className="space-y-4">
              <h3 className="font-bold text-primary border-b border-primary/10 pb-2">
                Authorized Person (In Pakistan)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="authFullName"
                    value={formData.authFullName}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">
                    CNIC
                  </label>
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
                  <label className="text-sm font-semibold text-gray-600">
                    Relation Type
                  </label>
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

            <div className="pt-6 flex flex-col sm:flex-row gap-3 md:gap-4">
              <button
                type="button"
                onClick={onOpenPreview}
                disabled={!formData.fullName || !formData.authFullName}
                className="flex-1 py-3 md:py-4 bg-gray-100 text-gray-800 font-bold rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Eye size={20} /> Preview
              </button>
              <button
                type="button"
                onClick={downloadPDF}
                disabled={!formData.fullName || !formData.authFullName}
                className="flex-1 py-3 md:py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
  useScrollLock(isOpen);

  const downloadPDF = async () => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
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
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[95vh]"
      >
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white sticky top-0 z-10 gap-4 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 flex-1 sm:flex-none">
              Preview
            </h2>
            <button
              onClick={downloadPDF}
              className="px-3 md:px-4 py-1.5 md:py-2 bg-primary text-white text-sm font-semibold rounded-lg flex items-center gap-2 whitespace-nowrap"
            >
              <Download size={16} />{" "}
              <span className="hidden xs:inline">Download</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:static p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-0 md:p-8 bg-gray-50 flex justify-center">
          <div className="shadow-none md:shadow-lg w-full max-w-[210mm] bg-white p-6 md:p-12 lg:p-20 min-h-auto md:min-h-[297mm] font-serif transition-all">
            <AuthorityLetterContent formData={formData} province={province} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AuthorityLetterContent({
  formData,
  province,
}: {
  formData: AuthorityFormData;
  province: string;
}) {
  return (
    <div
      className="space-y-6 md:space-y-8 text-black"
      style={{ fontSize: "12pt", lineHeight: "1.8" }}
    >
      <div className="text-right italic underline text-xs md:text-sm">
        Specimen Authority Letter
      </div>
      <div className="text-center font-bold text-lg md:text-xl underline uppercase tracking-wider">
        Authority Letter
      </div>
      <div className="space-y-3 md:space-y-4 pt-6 md:pt-10">
        <div>
          I, Mr./Mrs. <b>{formData.fullName || "________________________"}</b>
        </div>
        <div>
          {formData.relationType},{" "}
          <b>{formData.relationName || "________________________"}</b>
        </div>
        <div>
          CNIC No. <b>{formData.cnic || "________________________"}</b>
        </div>
        <div className="">
          Hereby authorized my real {formData.authRelationship || "relative"}
        </div>
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
          Resident of{" "}
          <b>{formData.authAddress || "________________________"}</b>
        </div>
        <div className="">
          to process and signed my behalf and collect my Police Clearance
          Certificate from SSP Office,{" "}
          {formData.officeLocation || province || "Islamabad"}.
        </div>
      </div>
      <div className="pt-12 md:pt-20 space-y-2 w-full sm:w-1/2 ml-auto">
        <div>Signature ___________________________</div>
        <div>
          Name: <b>{formData.fullName || "________________________"}</b>
        </div>
        <div>
          Fathers Name{" "}
          <b>{formData.relationName || "________________________"}</b>
        </div>
        <div>
          Passport No.{" "}
          <b>{formData.passportNo || "________________________"}</b>
        </div>
        <div>
          Address in Abroad{" "}
          <b>{formData.abroadAddress || "________________________"}</b>
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

// ==========================================
// 3. SINDH APPLY NOW MODAL
// ==========================================

export function SindhApplyModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  useScrollLock(isOpen);
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-lg my-auto rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col items-center text-center mx-4 max-h-[90vh] md:max-h-[95vh] overflow-y-auto"
      >
        <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 md:mb-6">
          <Building2 className="text-primary w-8 h-8 md:w-10 md:h-10" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
          Apply Online
        </h2>
        <p className="text-gray-500 mb-6 md:mb-8 text-sm md:text-base leading-relaxed">
          We are directly providing you with this official service. By clicking{" "}
          <b>Apply Now</b>, you will be redirected to the comprehensive Police
          Verification form. Provide accurate information to proceed.
        </p>

        <div className="flex flex-col sm:flex-row w-full gap-3 md:gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 md:py-4 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onClose();
              router.push(`/police-verification/apply?province=Sindh`);
            }}
            className="flex-1 py-3 md:py-4 bg-primary text-white font-semibold rounded-2xl shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
          >
            Apply Now <ExternalLink size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// 4. PKM LOCATOR MODAL
// ==========================================

export function PKMLocatorModal({
  isOpen,
  onClose,
  province,
}: {
  isOpen: boolean;
  onClose: () => void;
  province: string;
}) {
  useScrollLock(isOpen);

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [nearestCenters, setNearestCenters] = useState<
    (PKMCenter & { distance: number })[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const centersData =
    province === "Punjab"
      ? pkmCenters
      : province === "Balochistan"
        ? balochistanCenters
        : kpkCenters;

  const getBrowserLocation = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setNearestCenters(findNearestCenters(latitude, longitude, centersData));
        setLoading(false);
      },
      () => {
        setError(
          "Unable to retrieve your location. Please check permissions or enter manually.",
        );
        setLoading(false);
      },
    );
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    const location = await geocodeAddress(searchQuery, province);
    if (location) {
      setNearestCenters(
        findNearestCenters(location.lat, location.lng, centersData),
      );
    } else {
      const fallbackLocation = await geocodeAddress(searchQuery, "");
      if (fallbackLocation) {
        setNearestCenters(
          findNearestCenters(
            fallbackLocation.lat,
            fallbackLocation.lng,
            centersData,
          ),
        );
      } else {
        setError(
          `Could not find "${searchQuery}" in ${province}. Please try entering a city name like "Peshawar" or "Multan".`,
        );
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-0 relative my-auto max-h-[90vh] md:max-h-[95vh] flex flex-col overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
        >
          <X size={20} className="text-gray-500" />
        </button>

        <div className="flex-1 overflow-y-auto p-5 md:p-8">
          <div className="mb-6 md:mb-8 pr-10">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              Find Nearest PKM Center
            </h2>
            <p className="text-gray-500 text-sm md:text-base">
              Locate the closest Police Khidmat Markaz for your character
              certificate.
            </p>
          </div>

          <div className="space-y-5 md:space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <button
                onClick={getBrowserLocation}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 p-3 md:p-4 rounded-xl md:rounded-2xl bg-primary/5 text-primary text-sm md:text-base font-semibold hover:bg-primary/10 transition-all border border-primary/20"
              >
                {loading ? (
                  <Loader size="sm" />
                ) : (
                  <Navigation className="w-4 h-4 md:w-5 md:h-5" />
                )}{" "}
                Use My Location
              </button>
              <div className="flex-1">
                <form onSubmit={handleManualSearch} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Or enter city/area"
                    className="w-full p-3 md:p-4 pr-12 rounded-xl md:rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm md:text-base"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="absolute right-1.5 md:right-2 top-1.5 md:top-2 p-1.5 md:p-2 rounded-lg md:rounded-xl bg-primary text-white hover:bg-primary/90 transition-all"
                  >
                    {loading ? (
                      <Loader size="sm" />
                    ) : (
                      <Search className="w-4 h-4 md:w-5 md:h-5" />
                    )}
                  </button>
                </form>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <AnimatePresence>
              {nearestCenters.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-4 border-t border-gray-100 max-h-[40vh] pr-2"
                >
                  <div className="flex items-center justify-between top-0 bg-white py-2">
                    <h4 className="font-bold text-gray-800">Nearest Centers</h4>
                    <button
                      onClick={() => setNearestCenters([])}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="grid gap-3">
                    {nearestCenters.map((center, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-4 hover:border-primary/20 transition-all"
                      >
                        <div className="p-3 rounded-xl bg-white text-primary shadow-sm">
                          <Building2 size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-semibold text-gray-800 text-sm md:text-base pr-2">
                              {center.name}
                            </h5>
                            <span className="text-[10px] md:text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-full border border-primary/10 whitespace-nowrap">
                              ~{center.distance.toFixed(1)} km
                            </span>
                          </div>
                          <p className="text-xs md:text-sm text-gray-500 mt-1">
                            {center.address}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

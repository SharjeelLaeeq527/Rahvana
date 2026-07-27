"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import securityQuestionsData from "../../../../data/portal-wallet-security-questions-questionnaire.json";
import { useToast } from "@/app/components/shared/ToastProvider";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";

type PortalType = "USCIS" | "NVC" | "COURIER";

const portalQuestionLimit: Record<PortalType, number> = {
  USCIS: 5,
  NVC: 0,
  COURIER: 3,
};

interface SecurityQuestionField {
  question: string;
  answer: string;
}

interface CredentialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  portalType: PortalType;
  icon?: React.ReactNode;
  mode: "add" | "edit";
  initialData?: {
    username: string;
    password: string;
    nvcCaseNumber?: string;
    nvcInvoiceId?: string;
    securityQuestions: { id?: string; question: string; answer: string }[];
  };
  onSubmit: (data: {
    portalType: PortalType;
    username?: string;
    password?: string;
    nvcCaseNumber?: string;
    nvcInvoiceId?: string;
    securityQuestions?: { question: string; answer: string }[];
  }) => void;
  isSubmitting: boolean;
}

const CredentialFormModal: React.FC<CredentialFormModalProps> = ({
  isOpen,
  onClose,
  portalType,
  mode,
  initialData,
  onSubmit,
  isSubmitting,
  icon,
}) => {
  const questionLimit = portalQuestionLimit[portalType];

  const { showToast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [nvcCaseNumber, setNvcCaseNumber] = useState("");
  const [nvcInvoiceId, setNvcInvoiceId] = useState("");
  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestionField[]>(
    Array(questionLimit)
      .fill(null)
      .map(() => ({ question: "", answer: "" }))
  );

  const questionsKey = portalType === "COURIER" ? "COURIER" : portalType;
  const availableQuestions: string[] =
    (securityQuestionsData as Record<string, string[]>)[questionsKey] || [];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (mode === "edit" && initialData) {
        setUsername(initialData.username || "");
        setPassword("");
        setNvcCaseNumber(initialData.nvcCaseNumber || "");
        setNvcInvoiceId(initialData.nvcInvoiceId || "");
        const sq = initialData.securityQuestions || [];
        setSecurityQuestions(
          Array(questionLimit)
            .fill(null)
            .map((_, i) => ({
              question: sq[i]?.question || "",
              answer: sq[i]?.answer || "",
            }))
        );
      } else {
        setUsername("");
        setPassword("");
        setNvcCaseNumber("");
        setNvcInvoiceId("");
        setSecurityQuestions(
          Array(questionLimit)
            .fill(null)
            .map(() => ({ question: "", answer: "" }))
        );
      }
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, mode, initialData, questionLimit]);

  const handleQuestionChange = (index: number, question: string) => {
    setSecurityQuestions((prev) => prev.map((sq, i) => (i === index ? { ...sq, question } : sq)));
  };

  const handleAnswerChange = (index: number, answer: string) => {
    setSecurityQuestions((prev) => prev.map((sq, i) => (i === index ? { ...sq, answer } : sq)));
  };

  const getFilteredQuestions = (currentIndex: number) => {
    const selectedOthers = securityQuestions
      .filter((_, i) => i !== currentIndex)
      .map((sq) => sq.question)
      .filter(Boolean);
    return availableQuestions.filter((q) => !selectedOthers.includes(q));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (portalType === "NVC") {
      const casePrefix = nvcCaseNumber.slice(0, 3);
      const invoicePrefix = nvcInvoiceId.slice(0, 5);

      if (!/^[A-Z]{3}/.test(casePrefix)) {
        showToast("NVC Case Number must start with 3 capital letters.", "error");
        return;
      }

      if (invoicePrefix !== "IVSCA") {
        showToast("Invoice ID must start with IVSCA.", "error");
        return;
      }

      onSubmit({
        portalType,
        nvcCaseNumber,
        nvcInvoiceId,
      });

      return;
    }

    const filledQuestions = securityQuestions.filter((sq) => sq.question && sq.answer);

    onSubmit({
      portalType,
      username,
      password,
      securityQuestions: filledQuestions,
    });
  };

  const modalRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-3 pt-24 sm:items-start sm:px-0 sm:pt-20">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        // onClick={onClose}
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        // onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl w-full max-w-md max-h-[calc(100vh-9rem)] sm:max-h-[79vh] overflow-hidden mx-0 sm:mx-4 shadow-2xl flex flex-col z-[101]"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-[#e0f0f0] px-4 sm:px-5 py-3.5 flex items-start sm:items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#e8f6f6] flex items-center justify-center text-[#0d7377]">
              {icon}
            </div>
            <div className="min-w-0">
              <h2
                className="text-[14px] sm:text-[15px] font-bold text-[#0a1128] leading-tight"
                // style={{ fontFamily: "Inter, sans-serif" }}
              >
                {mode === "add" ? "Add" : "Edit"} {portalType} Credentials
              </h2>
              <p className="text-[11px] text-[#9ca3af]">
                Your data is encrypted and stored securely.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-lg hover:bg-[#f0f2f4] flex items-center justify-center text-[#9ca3af] hover:text-[#0a1128] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="px-4 sm:px-5 py-3.5 sm:py-4 space-y-3 sm:space-y-4 overflow-y-auto flex-1"
        >
          {portalType !== "NVC" && (
            <>
              {/* Username */}
              <div>
                <label className="block text-[11px] font-semibold text-[#0a1128] mb-1.5 uppercase tracking-wide">
                  Username / Email
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your portal username or email"
                  className="w-full h-10 px-3.5 rounded-xl border border-[#e0f0f0] bg-[#f8fafa] text-[13px] text-[#0a1128] placeholder:text-[#c0c7ce] focus:outline-none focus:border-[#0d7377] focus:ring-2 focus:ring-[#0d7377]/10 transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-semibold text-[#0a1128] mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required={mode === "add"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={"Enter your portal password"}
                    className="w-full h-10 px-3.5 pr-11 rounded-xl border border-[#e0f0f0] bg-[#f8fafa] text-[13px] text-[#0a1128] placeholder:text-[#c0c7ce] focus:outline-none focus:border-[#0d7377] focus:ring-2 focus:ring-[#0d7377]/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#0d7377] transition-colors"
                  >
                    {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {portalType === "NVC" && (
            <>
              {/* Case Number */}
              <div>
                <label className="block text-[11px] font-semibold text-[#0a1128] mb-1.5 uppercase tracking-wide">
                  NVC Case Number
                </label>
                <input
                  type="text"
                  required
                  value={nvcCaseNumber}
                  pattern="[A-Z]{3}.*"
                  title="Must start with 3 uppercase letters"
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setNvcCaseNumber(value);
                  }}
                  placeholder="Enter NVC case number"
                  className="w-full h-10 px-3.5 rounded-xl border border-[#e0f0f0] bg-[#f8fafa] text-[13px] text-[#0a1128] placeholder:text-[#c0c7ce] focus:outline-none focus:border-[#0d7377] focus:ring-2 focus:ring-[#0d7377]/10 transition-all"
                />
              </div>

              {/* Invoice ID */}
              <div>
                <label className="block text-[11px] font-semibold text-[#0a1128] mb-1.5 uppercase tracking-wide">
                  Invoice ID Number
                </label>
                <input
                  type="text"
                  required
                  value={nvcInvoiceId}
                  pattern="IVSCA.*"
                  title="Must start with IVSCA"
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setNvcInvoiceId(value);
                  }}
                  placeholder="Enter invoice ID number"
                  className="w-full h-10 px-3.5 rounded-xl border border-[#e0f0f0] bg-[#f8fafa] text-[13px] text-[#0a1128] placeholder:text-[#c0c7ce] focus:outline-none focus:border-[#0d7377] focus:ring-2 focus:ring-[#0d7377]/10 transition-all"
                />
              </div>
            </>
          )}

          {/* Divider */}
          {portalType !== "NVC" && (
            <div className="flex items-center gap-2.5">
              <div className="flex-1 h-px bg-[#e0f0f0]" />
              <span className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">
                Security Questions
              </span>
              <div className="flex-1 h-px bg-[#e0f0f0]" />
            </div>
          )}

          {/* Security Questions */}
          {portalType !== "NVC" && (
            <div className="space-y-2.5 sm:space-y-3">
              {securityQuestions.map((sq, index) => (
                <div
                  key={index}
                  className="space-y-2 p-2.5 sm:p-3 rounded-xl bg-[#f8fafa] border border-[#e0f0f0]"
                >
                  <label className="block text-[10px] font-semibold text-[#67737e] uppercase tracking-wide">
                    Question {index + 1}
                  </label>

                  <CustomDropdown
                    value={sq.question}
                    onChange={(val) => handleQuestionChange(index, val)}
                    options={getFilteredQuestions(index).map((q) => ({ value: q, label: q }))}
                    placeholder="Select a security question"
                    className="w-full [&_button]:h-9 [&_button]:min-h-9 [&_button]:w-full [&_button]:min-w-0 [&_button]:rounded-lg [&_button]:bg-white [&_button]:px-3 [&_button]:py-0 [&_button]:text-[12px]"
                  />

                  <input
                    type="text"
                    value={sq.answer}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder="Your answer"
                    className="w-full h-9 px-3 rounded-lg border border-[#e0f0f0] bg-white text-[12px] text-[#0a1128] placeholder:text-[#c0c7ce] focus:outline-none focus:border-[#0d7377] focus:ring-2 focus:ring-[#0d7377]/10 transition-all"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Submit */}
          <div className="pt-1.5 pb-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-[13px] font-semibold hover:bg-teal-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting
                ? "Saving..."
                : mode === "add"
                  ? "Save Credentials"
                  : "Update Credentials"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CredentialFormModal;

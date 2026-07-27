"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const normalizeSecurityAnswer = (answer: string) =>
  answer.trim().replace(/\s+/g, " ").toLowerCase();

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

    const hasIncompleteQuestions = securityQuestions.some((sq) => !sq.question || !sq.answer);

    if (hasIncompleteQuestions) {
      showToast(`Please complete all ${questionLimit} security questions.`, "error");
      return;
    }

    const filledQuestions = securityQuestions.map((sq) => ({
      question: sq.question,
      answer: sq.answer.trim(),
    }));

    const normalizedAnswers = filledQuestions.map((sq) => normalizeSecurityAnswer(sq.answer));
    const hasDuplicateAnswers = new Set(normalizedAnswers).size !== normalizedAnswers.length;

    if (hasDuplicateAnswers) {
      showToast("Each security question answer must be unique.", "error");
      return;
    }

    onSubmit({
      portalType,
      username,
      password,
      securityQuestions: filledQuestions,
    });
  };

  const modalRef = useRef<HTMLDivElement>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            ref={modalRef}
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 20 }}
            transition={{ duration: 0.22 }}
            className="relative w-full max-w-[600px] max-h-[80vh] bg-card rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col"
          >
            <button
              onClick={onClose}
              type="button"
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>

            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border bg-gradient-to-b from-[#0d7377]/5 to-transparent">
              <div className="flex items-center gap-3 pr-10">
                <div className="w-11 h-11 rounded-2xl bg-[#0d7377]/10 flex items-center justify-center text-[#0d7377] shrink-0">
                  {icon}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                    {mode === "add" ? "Add" : "Edit"} {portalType} Credentials
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your data is encrypted and stored securely.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3 sm:space-y-4">
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
                          Question {index + 1} <span className="text-red-500">*</span>
                        </label>

                        <CustomDropdown
                          value={sq.question}
                          onChange={(val) => handleQuestionChange(index, val)}
                          options={getFilteredQuestions(index).map((question) => ({
                            value: question,
                            label: question,
                          }))}
                          placeholder="Select a security question"
                          className="w-full [&_button]:h-9 [&_button]:w-full [&_button]:min-w-0 [&_button]:bg-white [&_button]:text-[12px]"
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
              </div>

              <div className="border-t border-border p-4 sm:p-5 bg-background">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-2xl bg-[#0d7377] hover:bg-[#0a5f62] text-white text-[13px] font-semibold transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting
                    ? "Saving..."
                    : mode === "add"
                      ? "Save Credentials"
                      : "Update Credentials"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CredentialFormModal;

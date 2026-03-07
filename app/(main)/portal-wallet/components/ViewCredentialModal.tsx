"use client";

import React, { useEffect, useState } from "react";
import { X, Eye, EyeOff, Shield, Copy, Check } from "lucide-react";

interface SecurityQuestion {
  id: string;
  question: string;
  answer: string | null;
}

interface ViewCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  portalType: string;
  credential: {
    id: string;

    username?: string | null;
    password?: string | null;

    nvc_case_number?: string | null;
    nvc_invoice_id?: string | null;
    security_questions: SecurityQuestion[];
  } | null;
  onRevealPassword: (credentialId: string) => Promise<string>;
  onRevealAnswer: (credentialId: string, questionId: string) => Promise<string>;
  onRevealCaseNumber: (credentialId: string) => Promise<string>;
  onRevealInvoiceId: (credentialId: string) => Promise<string>;
}

const ViewCredentialModal: React.FC<ViewCredentialModalProps> = ({
  isOpen,
  onClose,
  portalType,
  credential,
  onRevealPassword,
  onRevealAnswer,
  onRevealCaseNumber,
  onRevealInvoiceId,
}) => {
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<
    Record<string, string>
  >({});
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingAnswers, setLoadingAnswers] = useState<Record<string, boolean>>(
    {},
  );
  const [revealedCaseNumber, setRevealedCaseNumber] = useState<string | null>(
    null,
  );
  const [revealedInvoiceId, setRevealedInvoiceId] = useState<string | null>(
    null,
  );

  const [loadingCaseNumber, setLoadingCaseNumber] = useState(false);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRevealedPassword(null);
      setRevealedAnswers({});
    }
  }, [credential?.id, isOpen]); // reset on new credential or modal open

  useEffect(() => {
    if (revealedPassword) {
      const timer = setTimeout(() => setRevealedPassword(null), 20000);
      return () => clearTimeout(timer);
    }
  }, [revealedPassword]);

  useEffect(() => {
    if (revealedCaseNumber) {
      const timer = setTimeout(() => setRevealedCaseNumber(null), 20000);
      return () => clearTimeout(timer);
    }
  }, [revealedCaseNumber]);

  useEffect(() => {
    if (revealedInvoiceId) {
      const timer = setTimeout(() => setRevealedInvoiceId(null), 20000);
      return () => clearTimeout(timer);
    }
  }, [revealedInvoiceId]);

  useEffect(() => {
    const timers = Object.keys(revealedAnswers).map((qId) =>
      setTimeout(() => {
        setRevealedAnswers((prev) => {
          const copy = { ...prev };
          delete copy[qId];
          return copy;
        });
      }, 20000),
    );

    return () => timers.forEach(clearTimeout);
  }, [revealedAnswers]);

  const handleRevealPassword = async () => {
    if (!credential) return;

    setLoadingPassword(true);

    try {
      const pw = await onRevealPassword(credential.id);

      if (pw) {
        setRevealedPassword(pw);
      }
    } catch {
      console.error("Failed to reveal password");
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleRevealNVCCaseNumber = async () => {
    if (!credential) return;

    setLoadingCaseNumber(true);

    try {
      const pw = await onRevealCaseNumber(credential.id);

      if (pw) {
        setRevealedCaseNumber(pw);
      }
    } catch {
      console.error("Failed to reveal case number");
    } finally {
      setLoadingCaseNumber(false);
    }
  };

  const handleRevealNVCInvoiceID = async () => {
    if (!credential) return;

    setLoadingInvoiceId(true);

    try {
      const pw = await onRevealInvoiceId(credential.id);

      if (pw) {
        setRevealedInvoiceId(pw);
      }
    } catch {
      console.error("Failed to reveal invoice ID");
    } finally {
      setLoadingInvoiceId(false);
    }
  };

  const handleRevealAnswer = async (questionId: string) => {
    if (!credential) return;

    setLoadingAnswers((prev) => ({ ...prev, [questionId]: true }));

    try {
      const answer = await onRevealAnswer(credential.id, questionId);

      if (answer) {
        setRevealedAnswers((prev) => ({
          ...prev,
          [questionId]: answer,
        }));
      }
    } catch {
      console.error("Failed to reveal answer");
    } finally {
      setLoadingAnswers((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleClose = () => {
    setRevealedPassword(null);
    setRevealedAnswers({});
    onClose();
  };

  if (!isOpen || !credential) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-2xl w-full max-w-[520px] max-h-[85vh] overflow-y-auto mx-4 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-[#e0f0f0] px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e8f6f6] flex items-center justify-center text-[#0d7377]">
              <Shield size={18} />
            </div>
            <div>
              <h2
                className="text-[16px] font-bold text-[#0a1128]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {portalType} Credentials
              </h2>
              <p className="text-[11px] text-[#9ca3af]">
                Click eye icons to reveal sensitive data.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-[#f0f2f4] flex items-center justify-center text-[#9ca3af] hover:text-[#0a1128] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {portalType === "NVC" && (
            <>
              {/* Case Number */}
              <div className="p-4 rounded-xl bg-[#f8fafa] border border-[#e0f0f0]">
                <label className="block text-[11px] font-semibold text-[#67737e] uppercase tracking-wide mb-1">
                  NVC Case Number
                </label>

                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-[#0a1128] font-mono">
                    {loadingCaseNumber
                      ? "Decrypting..."
                      : revealedCaseNumber || "••••••••"}
                  </span>

                  <div className="flex items-center gap-2">
                    {revealedCaseNumber && (
                      <button
                        onClick={() =>
                          copyToClipboard(revealedCaseNumber, "case_number")
                        }
                        className="text-[#9ca3af] hover:text-[#0d7377]"
                      >
                        {copiedField === "case_number" ? (
                          <Check size={14} className="text-[#32e0c4]" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    )}

                    <button
                      onClick={handleRevealNVCCaseNumber}
                      disabled={loadingCaseNumber}
                      className="text-[#9ca3af] hover:text-[#0d7377]"
                    >
                      {revealedCaseNumber ? (
                        <Eye size={16} />
                      ) : (
                        <EyeOff size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Invoice ID */}
              <div className="p-4 rounded-xl bg-[#f8fafa] border border-[#e0f0f0]">
                <label className="block text-[11px] font-semibold text-[#67737e] uppercase tracking-wide mb-1">
                  Invoice ID Number
                </label>

                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-[#0a1128] font-mono">
                    {loadingInvoiceId
                      ? "Decrypting..."
                      : revealedInvoiceId || "••••••••"}
                  </span>

                  <div className="flex items-center gap-2">
                    {revealedInvoiceId && (
                      <button
                        onClick={() =>
                          copyToClipboard(revealedInvoiceId, "invoice_id")
                        }
                        className="text-[#9ca3af] hover:text-[#0d7377]"
                      >
                        {copiedField === "invoice_id" ? (
                          <Check size={14} className="text-[#32e0c4]" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    )}

                    <button
                      onClick={handleRevealNVCInvoiceID}
                      disabled={loadingInvoiceId}
                      className="text-[#9ca3af] hover:text-[#0d7377]"
                    >
                      {revealedInvoiceId ? (
                        <Eye size={16} />
                      ) : (
                        <EyeOff size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {portalType !== "NVC" && (
            <>
              {/* Username */}
              <div className="p-4 rounded-xl bg-[#f8fafa] border border-[#e0f0f0]">
                <label className="block text-[11px] font-semibold text-[#67737e] uppercase tracking-wide mb-1">
                  Username / Email
                </label>

                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-[#0a1128]">
                    {credential.username}
                  </span>

                  <button
                    onClick={() =>
                      copyToClipboard(credential.username ?? "", "username")
                    }
                    className="text-[#9ca3af] hover:text-[#0d7377] transition-colors"
                  >
                    {copiedField === "username" ? (
                      <Check size={14} className="text-[#32e0c4]" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="p-4 rounded-xl bg-[#f8fafa] border border-[#e0f0f0]">
                <label className="block text-[11px] font-semibold text-[#67737e] uppercase tracking-wide mb-1">
                  Password
                </label>

                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-[#0a1128] font-mono">
                    {loadingPassword
                      ? "Decrypting..."
                      : revealedPassword || "••••••••••"}
                  </span>

                  <div className="flex items-center gap-2">
                    {revealedPassword && (
                      <button
                        onClick={() =>
                          copyToClipboard(revealedPassword, "password")
                        }
                        className="text-[#9ca3af] hover:text-[#0d7377]"
                      >
                        {copiedField === "password" ? (
                          <Check size={14} className="text-[#32e0c4]" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    )}

                    <button
                      onClick={handleRevealPassword}
                      disabled={loadingPassword}
                      className="text-[#9ca3af] hover:text-[#0d7377] disabled:opacity-50"
                    >
                      {revealedPassword ? (
                        <Eye size={16} />
                      ) : (
                        <EyeOff size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Questions */}
              {credential.security_questions.length > 0 && (
                <>
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex-1 h-px bg-[#e0f0f0]" />
                    <span className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">
                      Security Questions
                    </span>
                    <div className="flex-1 h-px bg-[#e0f0f0]" />
                  </div>

                  {credential.security_questions.map((sq, index) => (
                    <div
                      key={sq.id}
                      className="p-4 rounded-xl bg-[#f8fafa] border border-[#e0f0f0]"
                    >
                      <label className="block text-[11px] font-semibold text-[#67737e] uppercase tracking-wide mb-0.5">
                        Question {index + 1}
                      </label>

                      <p className="text-[13px] text-[#0a1128] mb-2">
                        {sq.question}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-[#0d7377] font-mono">
                          {loadingAnswers[sq.id]
                            ? "Decrypting..."
                            : revealedAnswers[sq.id] || "••••••••"}
                        </span>

                        <div className="flex items-center gap-2">
                          {revealedAnswers[sq.id] && (
                            <button
                              onClick={() =>
                                copyToClipboard(revealedAnswers[sq.id], sq.id)
                              }
                              className="text-[#9ca3af] hover:text-[#0d7377]"
                            >
                              {copiedField === sq.id ? (
                                <Check size={14} className="text-[#32e0c4]" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          )}

                          <button
                            onClick={() => handleRevealAnswer(sq.id)}
                            disabled={loadingAnswers[sq.id]}
                            className="text-[#9ca3af] hover:text-[#0d7377] disabled:opacity-50"
                          >
                            {revealedAnswers[sq.id] ? (
                              <Eye size={14} />
                            ) : (
                              <EyeOff size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewCredentialModal;

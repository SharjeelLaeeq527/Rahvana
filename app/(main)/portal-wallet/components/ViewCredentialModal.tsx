"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, Copy, Check } from "lucide-react";

interface SecurityQuestion {
  id: string;
  question: string;
  answer: string | null;
}

interface ViewCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  portalType: string;
  icon?: React.ReactNode;
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
  onEdit?: () => void;
  onDelete?: () => void;
}

const ViewCredentialModal: React.FC<ViewCredentialModalProps> = ({
  isOpen,
  onClose,
  portalType,
  credential,
  icon,
  onRevealPassword,
  onRevealAnswer,
  onRevealCaseNumber,
  onRevealInvoiceId,
  onEdit,
  onDelete,
}) => {
  const autoHideTimersRef = useRef<Record<string, ReturnType<typeof window.setTimeout>>>({});
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, string>>({});
  const [revealedCaseNumber, setRevealedCaseNumber] = useState<string | null>(null);
  const [revealedInvoiceId, setRevealedInvoiceId] = useState<string | null>(null);

  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingCaseNumber, setLoadingCaseNumber] = useState(false);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState(false);
  const [loadingAnswers, setLoadingAnswers] = useState<Record<string, boolean>>({});

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const clearAutoHideTimer = useCallback((field: string) => {
    const timer = autoHideTimersRef.current[field];
    if (timer) {
      window.clearTimeout(timer);
      delete autoHideTimersRef.current[field];
    }
  }, []);

  const clearAllAutoHideTimers = useCallback(() => {
    Object.values(autoHideTimersRef.current).forEach((timer) => window.clearTimeout(timer));
    autoHideTimersRef.current = {};
  }, []);

  const scheduleAutoHide = useCallback(
    (field: string, hideValue: () => void) => {
      clearAutoHideTimer(field);
      autoHideTimersRef.current[field] = window.setTimeout(() => {
        hideValue();
        delete autoHideTimersRef.current[field];
      }, 30000);
    },
    [clearAutoHideTimer]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      clearAllAutoHideTimers();
      setRevealedPassword(null);
      setRevealedAnswers({});
      setRevealedCaseNumber(null);
      setRevealedInvoiceId(null);
    }
    return () => {
      clearAllAutoHideTimers();
      document.body.style.overflow = "unset";
    };
  }, [clearAllAutoHideTimers, credential?.id, isOpen]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleRevealPassword = async () => {
    if (!credential) return;
    if (revealedPassword) {
      clearAutoHideTimer("password");
      setRevealedPassword(null);
      return;
    }

    setLoadingPassword(true);
    try {
      const pw = await onRevealPassword(credential.id);
      setRevealedPassword(pw);
      scheduleAutoHide("password", () => setRevealedPassword(null));
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleRevealNVCCaseNumber = async () => {
    if (!credential) return;
    if (revealedCaseNumber) {
      clearAutoHideTimer("case_number");
      setRevealedCaseNumber(null);
      return;
    }

    setLoadingCaseNumber(true);
    try {
      const val = await onRevealCaseNumber(credential.id);
      setRevealedCaseNumber(val);
      scheduleAutoHide("case_number", () => setRevealedCaseNumber(null));
    } finally {
      setLoadingCaseNumber(false);
    }
  };

  const handleRevealNVCInvoiceID = async () => {
    if (!credential) return;
    if (revealedInvoiceId) {
      clearAutoHideTimer("invoice_id");
      setRevealedInvoiceId(null);
      return;
    }

    setLoadingInvoiceId(true);
    try {
      const val = await onRevealInvoiceId(credential.id);
      setRevealedInvoiceId(val);
      scheduleAutoHide("invoice_id", () => setRevealedInvoiceId(null));
    } finally {
      setLoadingInvoiceId(false);
    }
  };

  const handleRevealAnswer = async (qid: string) => {
    if (!credential) return;
    const field = `answer:${qid}`;
    if (revealedAnswers[qid]) {
      clearAutoHideTimer(field);
      setRevealedAnswers((p) => {
        const next = { ...p };
        delete next[qid];
        return next;
      });
      return;
    }

    setLoadingAnswers((p) => ({ ...p, [qid]: true }));
    try {
      const val = await onRevealAnswer(credential.id, qid);

      setRevealedAnswers((p) => ({
        ...p,
        [qid]: val,
      }));
      scheduleAutoHide(field, () =>
        setRevealedAnswers((p) => {
          const next = { ...p };
          delete next[qid];
          return next;
        })
      );
    } finally {
      setLoadingAnswers((p) => ({ ...p, [qid]: false }));
    }
  };

  const handleClose = () => {
    clearAllAutoHideTimers();
    setRevealedPassword(null);
    setRevealedAnswers({});
    setRevealedCaseNumber(null);
    setRevealedInvoiceId(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && credential && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 20 }}
            transition={{ duration: 0.22 }}
            className="relative w-full max-w-xl max-h-[80vh] bg-card rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col"
          >
            <button
              onClick={handleClose}
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
                    {portalType} Credentials
                  </h2>

                  <p className="text-xs text-muted-foreground mt-1">
                    Revealed sensitive data hides automatically after 30 seconds.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
              {portalType === "NVC" && (
                <>
              {/* Case Number */}
              <div className="p-4 rounded-xl bg-[#f8fafa] border border-[#e0f0f0]">
                <label className="block text-[11px] font-semibold text-[#67737e] uppercase tracking-wide mb-1">
                  NVC Case Number
                </label>

                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-[#0a1128] font-mono">
                    {loadingCaseNumber ? "Decrypting..." : revealedCaseNumber || "••••••••"}
                  </span>

                  <div className="flex items-center gap-2">
                    {revealedCaseNumber && (
                      <button
                        onClick={() => copyToClipboard(revealedCaseNumber, "case_number")}
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
                      {revealedCaseNumber ? <Eye size={16} /> : <EyeOff size={16} />}
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
                    {loadingInvoiceId ? "Decrypting..." : revealedInvoiceId || "••••••••"}
                  </span>

                  <div className="flex items-center gap-2">
                    {revealedInvoiceId && (
                      <button
                        onClick={() => copyToClipboard(revealedInvoiceId, "invoice_id")}
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
                      {revealedInvoiceId ? <Eye size={16} /> : <EyeOff size={16} />}
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
                    onClick={() => copyToClipboard(credential.username ?? "", "username")}
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
                    {loadingPassword ? "Decrypting..." : revealedPassword || "••••••••••"}
                  </span>

                  <div className="flex items-center gap-2">
                    {revealedPassword && (
                      <button
                        onClick={() => copyToClipboard(revealedPassword, "password")}
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
                      {revealedPassword ? <Eye size={16} /> : <EyeOff size={16} />}
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

                      <p className="text-[13px] text-[#0a1128] mb-2">{sq.question}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-[#0d7377] font-mono">
                          {loadingAnswers[sq.id]
                            ? "Decrypting..."
                            : revealedAnswers[sq.id] || "••••••••"}
                        </span>

                        <div className="flex items-center gap-2">
                          {revealedAnswers[sq.id] && (
                            <button
                              onClick={() => copyToClipboard(revealedAnswers[sq.id], sq.id)}
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
                            {revealedAnswers[sq.id] ? <Eye size={14} /> : <EyeOff size={14} />}
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

            <div className="flex justify-between gap-3 border-t border-border p-4 sm:p-5 bg-background">
              <button
                onClick={onDelete}
                className="text-sm px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
              >
                Delete
              </button>

              <button
                onClick={onEdit}
                className="text-sm px-4 py-2.5 rounded-xl bg-[#0d7377] text-white hover:bg-[#0a5f62] font-semibold transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
              >
                Edit Credentials
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ViewCredentialModal;

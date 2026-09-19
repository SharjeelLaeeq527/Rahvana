"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Shield, ChevronDown, Check } from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import { E, msg } from "@/lib/errors";
import PortalCard from "./components/PortalCard";
import CredentialFormModal from "./components/CredentialFormModal";
import ViewCredentialModal from "./components/ViewCredentialModal";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { useToast } from "@/app/components/shared/ToastProvider";
import { useCandidate } from "@/app/context/CandidateContext";

/**
 * Parses "Candidate 1 (Mother)" -> { name: "Candidate 1", role: "Mother" }
 */
const parseCandidateLabel = (label?: string, relation?: string) => {
  if (!label) return { name: relation || "Candidate", role: relation || "" };
  const match = label.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) return { name: match[1].trim(), role: match[2].trim() };
  return { name: label.trim(), role: relation || "" };
};

/**
 * Always returns the base label "Candidate 1", "Candidate 2", etc.
 * If they have a real personal name, that goes in the subtitle instead.
 */
const formatCandidateDisplayName = (c?: { fullName?: string; label?: string; relation?: string }) => {
  if (!c) return "Candidate";
  return parseCandidateLabel(c.label, c.relation).name;
};

/**
 * Returns the subtitle: the user's real name if entered, otherwise the relation role.
 */
const formatCandidateSubtitle = (c?: { fullName?: string; label?: string; relation?: string }) => {
  if (!c) return "";
  const { role } = parseCandidateLabel(c.label, c.relation);
  const full = c.fullName?.trim();
  // Use fullName only if it's a real personal name (not the auto-assigned relation word)
  if (full && full !== c.relation && full !== role) return full;
  return role;
};

type PortalType = "USCIS" | "NVC" | "COURIER";

interface SecurityQuestion {
  id: string;
  question: string;
  answer: string | null;
}

interface Credential {
  id: string;
  portal_type: string;

  username: string;
  password: string | null;

  nvc_case_number?: string | null;
  nvc_invoice_id?: string | null;

  security_questions: SecurityQuestion[];

  updated_at: string | number | Date;
}

const API_BASE = "/api/portal-wallet";

const portals: {
  type: PortalType;
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconHoverBgColor?: string;
}[] = [
  {
    type: "USCIS",
    title: "USCIS",
    description: "U.S. Citizenship and Immigration Services, track cases, forms, and account.",
    url: "https://myaccount.uscis.gov/sign-in",
    icon: <Image src="/uscis.png" alt="USCIS" width={64} height={64} className="object-contain" />,
    iconBgColor: "bg-[#e8f6f6]",
    iconHoverBgColor: "group-hover:bg-[#0d7377]",
  },
  {
    type: "NVC",
    title: "NVC (CEAC)",
    description: "National Visa Center, manage documents, affidavits, and case status.",
    url: "https://ceac.state.gov/iv/login.aspx",
    icon: <Image src="/ceac.png" alt="CEAC" width={64} height={64} className="object-contain" />,
    iconBgColor: "bg-[#fef3c7]",
    iconHoverBgColor: "group-hover:bg-[#f59e0b]",
  },
  {
    type: "COURIER",
    title: "Courier Service",
    description: "Track passport delivery, schedule pickups, and manage courier logistics.",
    url: "https://atlasauth.b2clogin.com/f50ebcfb-eadd-41d8-9099-a7049d073f5c/b2c_1a_atoproduction_atlas_susi/oauth2/v2.0/authorize?client_id=607d08d6-b63b-4735-ad82-05dfcff7efa4&redirect_uri=https%3A%2F%2Fwww.usvisascheduling.com%2Fsignin-aad-b2c_1&response_type=code%20id_token&scope=openid&state=OpenIdConnect.AuthenticationProperties%3D2K23hD4xKzVe12jbVwjyqaABq8BvO9XR4dhxyvhM7SW5r2pLF5Rw4GpLbGg1SrhKGKcppBq4KNWDndIYuM863mlKn1fzE2KBfWVp3CNydelGJjAMx8mKVWAGq8ejU1j_os42RN93Egg5pqqgb_DUyiyluHJiUekQEK3ejCf2cGnJox-DigSRszd4RuUOOihD0Y6c1Hpe6GOOk41Y0gIIquzA9zzqTcrjWjMwx0-VXDCqUcH2fmr6qPDD75ogQTvjDKt9bnqWuV4cvfGquOOyqo0gAVtBE3cfF2JUvI4eP60Ktla_mMBiyIaYOdRC6Nkw3gs-5mKXMz-0ZBpSs8plZLBPAXyRKtKkFntQdtGUjz3OpzjMFUQySSZYlg4KAqk9m6_QhSee5b0ZmVV7hf6r2ocvBlfdHQIJKpjRz6eLgJDzmfKbZWFYxce-gPpLxmcwxOC4za80kv0torvGvZAyDyeY_RONVFzmYFXyMQsGHtua9Ll6wHxDN4ZPF9lEPTsThtgrrfydnrVxWu-BWZVaGzwovnUp3hQzNoa3c8jtS11JAtMC780rjr2dNDAv9EpHWr6ISfsO-Syu-4IdVGizjsHkwqQRLNUZoqKW7YtlTUkWn80R4tDfH3WkcMLRS-4D&response_mode=form_post&nonce=639086504989774135.NDYwYmEzMGMtYjI4Yi00MDBiLTg5ZGItZmU0MTM1ZjVhYTMyNTM0YWI0ZDAtNzI5NC00OGMxLWIxYjctNjZlMzcxYjM3ODk5&ui_locales=en-US&x-client-SKU=ID_NET472&x-client-ver=6.35.0.0",
    icon: <Image src="/ceac.png" alt="CEAC" width={64} height={64} className="object-contain" />,
    iconBgColor: "bg-[#eef2ff]",
    iconHoverBgColor: "group-hover:bg-[#4f46e5]",
  },
];

const PortalWallet: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [formModal, setFormModal] = useState<{
    open: boolean;
    portalType: PortalType;
    mode: "add" | "edit";
  }>({ open: false, portalType: "USCIS", mode: "add" });
  const [viewModal, setViewModal] = useState<{
    open: boolean;
    portalType: PortalType;
  }>({ open: false, portalType: "USCIS" });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deletePortal, setDeletePortal] = useState<PortalType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingPortal, setProcessingPortal] = useState<PortalType | null>(null);

  const { showToast } = useToast();

  const fetchCredentials = useCallback(async () => {
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      if (data.credentials) setCredentials(data.credentials);
    } catch (err) {
      console.error("Failed to fetch credentials:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const getCredential = (portalType: string) =>
    credentials.find((c) => c.portal_type.toUpperCase() === portalType.toUpperCase());

  const handleAddOrEdit = async (data: any) => {
    setIsSubmitting(true);
    setProcessingPortal(data.portalType);

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      showToast("Credentials saved successfully!", "success");
      setFormModal((prev) => ({ ...prev, open: false }));
      await fetchCredentials();
    } catch {
      showToast(msg(E.VAULT_CREDENTIAL_SAVE_FAILED), "error");
    } finally {
      setProcessingPortal(null);
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async (portalType: PortalType) => {
    setIsSubmitting(true);
    setProcessingPortal(portalType);

    try {
      const res = await fetch(`${API_BASE}/${portalType}/delete`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      showToast("Credentials deleted successfully!", "success");

      setShowConfirmation(false);
      setViewModal({ open: false, portalType: "USCIS" });
      setDeletePortal(null);

      await fetchCredentials();
    } catch {
      showToast(msg(E.VAULT_CREDENTIAL_DELETE_FAILED), "error");
    } finally {
      setProcessingPortal(null);
      setIsSubmitting(false);
    }
  };

  const handleRevealPassword = async (credentialId: string): Promise<string> => {
    const cred = credentials.find((c) => c.id === credentialId);

    const res = await fetch(`${API_BASE}/reveal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credentialId,
        portalType: cred?.portal_type,
        type: "password",
      }),
    });

    const data = await res.json();

    if (data.value) {
      setCredentials((prev) =>
        prev.map((c) => (c.id === credentialId ? { ...c, password: data.value } : c))
      );
    }

    return data.value || "";
  };

  const handleRevealNVCCaseNumber = async (credentialId: string): Promise<string> => {
    const cred = credentials.find((c) => c.id === credentialId);

    const res = await fetch(`${API_BASE}/reveal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credentialId,
        portalType: cred?.portal_type,
        type: "nvc_case_number",
      }),
    });

    const data = await res.json();

    if (data.value) {
      setCredentials((prev) =>
        prev.map((c) => (c.id === credentialId ? { ...c, nvc_case_number: data.value } : c))
      );
    }

    return data.value || "";
  };

  const handleRevealNVCInvoiceID = async (credentialId: string): Promise<string> => {
    const cred = credentials.find((c) => c.id === credentialId);

    const res = await fetch(`${API_BASE}/reveal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credentialId,
        portalType: cred?.portal_type,
        type: "nvc_invoice_id",
      }),
    });

    const data = await res.json();

    if (data.value) {
      setCredentials((prev) =>
        prev.map((c) => (c.id === credentialId ? { ...c, nvc_invoice_id: data.value } : c))
      );
    }

    return data.value || "";
  };

  const handleRevealAnswer = async (credentialId: string, questionId: string): Promise<string> => {
    const cred = credentials.find((c) => c.id === credentialId);

    const res = await fetch(`${API_BASE}/reveal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credentialId,
        portalType: cred?.portal_type,
        type: "answer",
        questionId,
      }),
    });

    const data = await res.json();

    if (data.value) {
      setCredentials((prev) =>
        prev.map((c) => {
          if (c.id === credentialId) {
            return {
              ...c,
              security_questions: c.security_questions.map((q) =>
                q.id === questionId ? { ...q, answer: data.value } : q
              ),
            };
          }
          return c;
        })
      );
    }

    return data.value || "";
  };

  const [candidateDropdownOpen, setCandidateDropdownOpen] = useState(false);

  let candidateCtx;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    candidateCtx = useCandidate();
  } catch {
    candidateCtx = undefined;
  }
  const { candidates = [], activeCandidate, setActiveCandidateId } = candidateCtx || {};

  // Deterministic palette per candidate index
  const CANDIDATE_COLORS = [
    { bg: "#e6f7f4", text: "#0d7377", ring: "#b8dfe0", dot: "#0d7377" },
    { bg: "#eef2ff", text: "#4f46e5", ring: "#c7d2fe", dot: "#4f46e5" },
    { bg: "#fef3c7", text: "#b45309", ring: "#fde68a", dot: "#d97706" },
    { bg: "#fce7f3", text: "#be185d", ring: "#fbcfe8", dot: "#db2777" },
    { bg: "#f0fdf4", text: "#15803d", ring: "#bbf7d0", dot: "#16a34a" },
    { bg: "#fff7ed", text: "#c2410c", ring: "#fed7aa", dot: "#ea580c" },
  ];
  const getCandidateColor = (idx: number) => CANDIDATE_COLORS[idx % CANDIDATE_COLORS.length];

  const activeCredential = getCredential(viewModal.portalType);
  const formCredential = getCredential(formModal.portalType);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Loader size="lg" />
        <p className="mt-2 text-sm font-medium text-[#0d7377]">Loading your vault...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafa]">
      <div className="site-main-px site-main-py mt-14 w-full">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#0c1b33]/10 bg-white px-3.5 py-1 text-[11px] font-semibold tracking-wider text-[#0c1b33] uppercase shadow-xs">
            <Shield size={12} className="text-[#0d7377]" />
            Encrypted Credential Vault
          </div>

          <h1 className="mt-3 text-[30px] font-extrabold tracking-tight text-[#0c1b33] sm:text-[34px]">
            Portal Wallet
          </h1>
          <p className="mt-1.5 max-w-md text-[14px] leading-relaxed text-[#64748b]">
            Securely manage credentials and portal case access.
          </p>

          {/* Candidate Selector */}
          {activeCandidate && candidates.length > 0 && (() => {
            const activeIdx = candidates.findIndex((c) => c.id === activeCandidate.id);
            const activeColor = getCandidateColor(activeIdx);
            const activeDisplay = formatCandidateDisplayName(activeCandidate);
            const activeRole = formatCandidateSubtitle(activeCandidate);
            const showActiveRole = !!activeRole;

            const SilhouetteSVG = ({ color }: { color: typeof activeColor }) => (
              <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
                <circle cx="18" cy="13" r="6.5" fill={color.text} opacity="0.85" />
                <path d="M5 34c0-7.18 5.82-13 13-13s13 5.82 13 13" fill={color.text} opacity="0.85" />
              </svg>
            );

            return (
              <div className="relative mt-5" style={{ width: 260 }}>
                {/* ── Trigger ── */}
                <button
                  onClick={() => setCandidateDropdownOpen((o) => !o)}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200"
                  style={{
                    background: "#ffffff",
                    border: `1.5px solid ${activeColor.ring}`,
                    boxShadow: `0 4px 16px ${activeColor.dot}22, 0 1px 3px rgba(0,0,0,0.05)`,
                  }}
                >
                  {/* Avatar */}
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden"
                    style={{ background: activeColor.bg }}
                  >
                    <SilhouetteSVG color={activeColor} />
                  </span>

                  {/* Name + role */}
                  <span className="flex flex-1 flex-col items-start min-w-0">
                    <span className="text-[13px] font-bold leading-tight truncate w-full" style={{ color: "#0a1128" }}>
                      {activeDisplay}
                    </span>
                  {showActiveRole && (
                      <span className="text-[11px] font-medium leading-tight mt-0.5" style={{ color: activeColor.text }}>
                        {activeRole}
                      </span>
                    )}
                  </span>

                  <ChevronDown
                    size={15}
                    style={{
                      color: activeColor.text,
                      transform: candidateDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.22s ease",
                      flexShrink: 0,
                    }}
                  />
                </button>

                {/* ── Dropdown ── */}
                {candidateDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setCandidateDropdownOpen(false)} />
                    <div
                      className="absolute z-20 overflow-hidden rounded-2xl"
                      style={{
                        top: "calc(100% + 8px)",
                        left: 0,
                        width: 260,
                        background: "#ffffff",
                        border: "1px solid #e4eaf0",
                        boxShadow: "0 16px 48px rgba(10,17,40,0.14), 0 4px 12px rgba(10,17,40,0.06)",
                      }}
                    >
                      {/* Panel header */}
                      <div className="px-4 pt-3 pb-2" style={{ borderBottom: "1px solid #f0f4f8" }}>
                        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#a0aab8" }}>
                          Switch Candidate
                        </p>
                      </div>

                      <div className="py-1.5">
                        {candidates.map((c, idx) => {
                          const color = getCandidateColor(idx);
                          const name = formatCandidateDisplayName(c);
                          const role = formatCandidateSubtitle(c);
                          const showRole = !!role;
                          const isActive = activeCandidate.id === c.id;
                          return (
                            <button
                              key={c.id}
                              onClick={() => {
                                setActiveCandidateId?.(c.id);
                                setCandidateDropdownOpen(false);
                              }}
                              className="relative flex w-full items-center gap-3 px-4 py-2.5 text-left transition-all duration-150"
                              style={{ background: isActive ? color.bg : "transparent" }}
                              onMouseEnter={(e) => {
                                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "#f7f9fb";
                              }}
                              onMouseLeave={(e) => {
                                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                              }}
                            >
                              {/* Active left bar */}
                              {isActive && (
                                <span
                                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
                                  style={{ background: color.dot }}
                                />
                              )}

                              {/* Avatar */}
                              <span
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden"
                                style={{ background: color.bg, border: isActive ? `1.5px solid ${color.ring}` : "1.5px solid transparent" }}
                              >
                                <SilhouetteSVG color={color} />
                              </span>

                              {/* Name + role */}
                              <span className="flex flex-1 flex-col items-start min-w-0">
                                <span
                                  className="text-[13px] font-semibold leading-tight truncate w-full"
                                  style={{ color: isActive ? color.text : "#0a1128" }}
                                >
                                  {name}
                                </span>
                                {showRole && (
                                  <span className="text-[11px] leading-tight mt-0.5" style={{ color: isActive ? color.text : "#a0aab8" }}>
                                    {role}
                                  </span>
                                )}
                              </span>

                              {isActive && <Check size={13} style={{ color: color.dot, flexShrink: 0 }} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 items-center justify-center gap-6 md:grid-cols-2 md:items-stretch lg:grid-cols-3">
          {portals.map((portal) => {
            const cred = getCredential(portal.type);
            return (
              <PortalCard
                key={portal.type}
                title={portal.title}
                description={portal.description}
                icon={portal.icon}
                portalUrl={portal.url}
                hasCredentials={!!cred}
                lastUpdated={
                  cred
                    ? new Date(cred.updated_at).toLocaleString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : undefined
                }
                iconBgColor={portal.iconBgColor}
                loading={processingPortal === portal.type}
                onAction={() => {
                  if (cred) {
                    setViewModal({ open: true, portalType: portal.type });
                  } else {
                    setFormModal({
                      open: true,
                      portalType: portal.type,
                      mode: "add",
                    });
                  }
                }}
              />
            );
          })}
        </div>

        {/* Security note */}
        <div className="mt-6 text-center md:mt-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#0d7377]/10 bg-[#e8f6f6] px-4 py-2.5">
            <Shield size={12} className="text-[#0d7377]" />
            <span className="text-[9px] font-medium text-[#0d7377] md:text-[12px]">
              All credentials are encrypted end-to-end. We never store plaintext passwords.
            </span>
          </div>
        </div>
      </div>

      {/* Form Modal (Add/Edit) */}
      <CredentialFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal((prev) => ({ ...prev, open: false }))}
        portalType={formModal.portalType}
        mode={formModal.mode}
        icon={portals.find((p) => p.type === formModal.portalType)?.icon}
        initialData={
          formModal.mode === "edit" && formCredential
            ? {
                username: formCredential.username,
                password: formCredential.password || "",
                nvcCaseNumber: formCredential.nvc_case_number || "",
                nvcInvoiceId: formCredential.nvc_invoice_id || "",
                securityQuestions: formCredential.security_questions.map((sq) => ({
                  id: sq.id,
                  question: sq.question,
                  answer: sq.answer || "",
                })),
              }
            : undefined
        }
        onSubmit={handleAddOrEdit}
        isSubmitting={isSubmitting}
      />

      {/* View Modal */}
      <ViewCredentialModal
        isOpen={viewModal.open}
        onClose={() => setViewModal((prev) => ({ ...prev, open: false }))}
        portalType={viewModal.portalType}
        credential={activeCredential || null}
        icon={portals.find((p) => p.type === viewModal.portalType)?.icon}
        onRevealPassword={handleRevealPassword}
        onRevealAnswer={handleRevealAnswer}
        onRevealCaseNumber={handleRevealNVCCaseNumber}
        onRevealInvoiceId={handleRevealNVCInvoiceID}
        onEdit={() => {
          setViewModal({ open: false, portalType: viewModal.portalType });
          setFormModal({
            open: true,
            portalType: viewModal.portalType,
            mode: "edit",
          });
        }}
        onDelete={() => {
          setDeletePortal(viewModal.portalType);
          setShowConfirmation(true);
        }}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        title="Delete Credentials"
        description="Are you sure you want to delete these credentials? This action cannot be undone."
        cancelText="Cancel"
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={() => {
          if (deletePortal) {
            confirmDelete(deletePortal);
          }
        }}
        loading={isSubmitting}
      />
    </div>
  );
};

export default PortalWallet;

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Shield } from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import PortalCard from "./components/PortalCard";
import CredentialFormModal from "./components/CredentialFormModal";
import ViewCredentialModal from "./components/ViewCredentialModal";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { toast } from "sonner";

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
    description:
      "U.S. Citizenship and Immigration Services — track cases, forms, and account.",
    url: "https://myaccount.uscis.gov/sign-in",
    icon: (
      <Image
        src="/uscis.png"
        alt="USCIS"
        width={64}
        height={64}
        className="object-contain"
      />
    ),
    iconBgColor: "bg-[#e8f6f6]",
    iconHoverBgColor: "group-hover:bg-[#0d7377]"
  },
  {
    type: "NVC",
    title: "NVC (CEAC)",
    description:
      "National Visa Center — manage documents, affidavits, and case status.",
    url: "https://ceac.state.gov/iv/login.aspx",
    icon: (
      <Image
        src="/ceac.png"
        alt="CEAC"
        width={64}
        height={64}
        className="object-contain"
      />
    ),
    iconBgColor: "bg-[#fef3c7]",
    iconHoverBgColor: "group-hover:bg-[#f59e0b]"
  },
  {
    type: "COURIER",
    title: "Courier Service",
    description:
      "Track passport delivery, schedule pickups, and manage courier logistics.",
    url: "https://atlasauth.b2clogin.com/f50ebcfb-eadd-41d8-9099-a7049d073f5c/b2c_1a_atoproduction_atlas_susi/oauth2/v2.0/authorize?client_id=607d08d6-b63b-4735-ad82-05dfcff7efa4&redirect_uri=https%3A%2F%2Fwww.usvisascheduling.com%2Fsignin-aad-b2c_1&response_type=code%20id_token&scope=openid&state=OpenIdConnect.AuthenticationProperties%3D2K23hD4xKzVe12jbVwjyqaABq8BvO9XR4dhxyvhM7SW5r2pLF5Rw4GpLbGg1SrhKGKcppBq4KNWDndIYuM863mlKn1fzE2KBfWVp3CNydelGJjAMx8mKVWAGq8ejU1j_os42RN93Egg5pqqgb_DUyiyluHJiUekQEK3ejCf2cGnJox-DigSRszd4RuUOOihD0Y6c1Hpe6GOOk41Y0gIIquzA9zzqTcrjWjMwx0-VXDCqUcH2fmr6qPDD75ogQTvjDKt9bnqWuV4cvfGquOOyqo0gAVtBE3cfF2JUvI4eP60Ktla_mMBiyIaYOdRC6Nkw3gs-5mKXMz-0ZBpSs8plZLBPAXyRKtKkFntQdtGUjz3OpzjMFUQySSZYlg4KAqk9m6_QhSee5b0ZmVV7hf6r2ocvBlfdHQIJKpjRz6eLgJDzmfKbZWFYxce-gPpLxmcwxOC4za80kv0torvGvZAyDyeY_RONVFzmYFXyMQsGHtua9Ll6wHxDN4ZPF9lEPTsThtgrrfydnrVxWu-BWZVaGzwovnUp3hQzNoa3c8jtS11JAtMC780rjr2dNDAv9EpHWr6ISfsO-Syu-4IdVGizjsHkwqQRLNUZoqKW7YtlTUkWn80R4tDfH3WkcMLRS-4D&response_mode=form_post&nonce=639086504989774135.NDYwYmEzMGMtYjI4Yi00MDBiLTg5ZGItZmU0MTM1ZjVhYTMyNTM0YWI0ZDAtNzI5NC00OGMxLWIxYjctNjZlMzcxYjM3ODk5&ui_locales=en-US&x-client-SKU=ID_NET472&x-client-ver=6.35.0.0",
    icon: (
      <Image
        src="/ceac.png"
        alt="CEAC"
        width={64}
        height={64}
        className="object-contain"
      />
    ),
    iconBgColor: "bg-[#eef2ff]",
    iconHoverBgColor: "group-hover:bg-[#4f46e5]"
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
    credentials.find(
      (c) => c.portal_type.toUpperCase() === portalType.toUpperCase(),
    );

  const handleAddOrEdit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Credentials saved successfully!");
      setFormModal((prev) => ({ ...prev, open: false }));
      await fetchCredentials();
    } catch {
      toast.error("Failed to save credentials. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setShowConfirmation(true);
  };

  const confirmDelete = async (portalType: PortalType) => {
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/${portalType}/delete`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Credentials deleted successfully!");

      setShowConfirmation(false);
      setDeletePortal(null);

      await fetchCredentials();
    } catch {
      toast.error("Failed to delete credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevealPassword = async (
    credentialId: string,
  ): Promise<string> => {
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
        prev.map((c) =>
          c.id === credentialId ? { ...c, password: data.value } : c,
        ),
      );
    }

    return data.value || "";
  };

  const handleRevealNVCCaseNumber = async (
    credentialId: string,
  ): Promise<string> => {
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
        prev.map((c) =>
          c.id === credentialId ? { ...c, nvc_case_number: data.value } : c,
        ),
      );
    }

    return data.value || "";
  };

  const handleRevealNVCInvoiceID = async (
    credentialId: string,
  ): Promise<string> => {
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
        prev.map((c) =>
          c.id === credentialId ? { ...c, nvc_invoice_id: data.value } : c,
        ),
      );
    }

    return data.value || "";
  };

  const handleRevealAnswer = async (
    credentialId: string,
    questionId: string,
  ): Promise<string> => {
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
                q.id === questionId ? { ...q, answer: data.value } : q,
              ),
            };
          }
          return c;
        }),
      );
    }

    return data.value || "";
  };

  const activeCredential = getCredential(viewModal.portalType);
  const formCredential = getCredential(formModal.portalType);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader size="lg" />
        <p className="text-[#0d7377] text-sm font-medium mt-2">
          Loading your vault...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafa]">
      <div className="max-w-275 mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-bold text-[#0a1128] mb-2">
            Portal Wallet - Your Secure Credential Vault
          </h1>
          <p className="text-[15px] text-[#67737e] max-w-lg mx-auto">
            Store, manage, and quickly access your immigration portal logins —
            encrypted and protected.
          </p>
        </div>

        {/* Portal Cards */}
        <div className="flex flex-col md:flex-row items-stretch justify-center gap-6">
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
                iconBgColor={portal.iconBgColor}
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
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#e8f6f6] border border-[#0d7377]/10">
            <Shield size={14} className="text-[#0d7377]" />
            <span className="text-[12px] font-medium text-[#0d7377]">
              All credentials are encrypted end-to-end. We never store plaintext
              passwords.
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
                password: "",
                securityQuestions: formCredential.security_questions.map(
                  (sq) => ({
                    id: sq.id,
                    question: sq.question,
                    answer: "",
                  }),
                ),
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
          setViewModal({ open: false, portalType: viewModal.portalType });
        
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

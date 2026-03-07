"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, Shield, Globe, Truck } from "lucide-react";
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
  security_questions: SecurityQuestion[];
}

const API_BASE = "/api/portal-wallet";

const portals: {
  type: PortalType;
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
}[] = [
  {
    type: "USCIS",
    title: "USCIS",
    description:
      "U.S. Citizenship and Immigration Services — track cases, forms, and account.",
    url: "https://my.uscis.gov",
    icon: <Shield size={28} />,
  },
  {
    type: "NVC",
    title: "NVC (CEAC)",
    description:
      "National Visa Center — manage documents, affidavits, and case status.",
    url: "https://ceac.state.gov/ceac",
    icon: <Globe size={28} />,
  },
  {
    type: "COURIER",
    title: "Courier Service",
    description:
      "Track passport delivery, schedule pickups, and manage courier logistics.",
    url: "https://www.ustraveldocs.com",
    icon: <Truck size={28} />,
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

  const handleAddOrEdit = async (data: {
    portalType: string;
    username: string;
    password: string;
    securityQuestions: { question: string; answer: string }[];
  }) => {
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
      <div className="max-w-[1100px] mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles size={20} className="text-[#32e0c4]" />
            <span className="text-[13px] font-semibold text-[#0d7377] uppercase tracking-wider">
              Portal Wallet
            </span>
          </div>
          <h1
            className="text-[28px] font-bold text-[#0a1128] mb-2"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Your Secure Credential Vault
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
                onAdd={() =>
                  setFormModal({
                    open: true,
                    portalType: portal.type,
                    mode: "add",
                  })
                }
                onView={() =>
                  setViewModal({ open: true, portalType: portal.type })
                }
                onEdit={() =>
                  setFormModal({
                    open: true,
                    portalType: portal.type,
                    mode: "edit",
                  })
                }
                onDelete={() => {
                  setDeletePortal(portal.type);
                  setShowConfirmation(true);
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
        onRevealPassword={handleRevealPassword}
        onRevealAnswer={handleRevealAnswer}
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

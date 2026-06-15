import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/app/components/shared/ToastProvider";
import { E, msg } from "@/lib/errors";

export interface SecurityQuestion {
  id: string;
  question: string;
  answer: string | null;
}

export interface PortalCredential {
  id: string;
  portal_type: string;
  username: string;
  password: string | null;
  nvc_case_number?: string | null;
  nvc_invoice_id?: string | null;
  security_questions: SecurityQuestion[];
}

interface UsePortalWalletProps {
  sId: string;
  isCompleted: boolean;
  actions: {
    toggleComplete: (id: string) => void;
    updateMetadata: (data: Record<string, unknown>) => void;
  };
}

export const usePortalWallet = ({ sId, isCompleted, actions }: UsePortalWalletProps) => {
  const { showToast } = useToast();
  const [uscisCredentials, setUscisCredentials] = useState<PortalCredential | null>(null);
  const [ceacCredentials, setCeacCredentials] = useState<PortalCredential | null>(null);
  const [courierCredentials, setCourierCredentials] = useState<PortalCredential | null>(null);

  const [isWalletFormOpen, setIsWalletFormOpen] = useState(false);
  const [isWalletViewOpen, setIsWalletViewOpen] = useState(false);
  const [walletPortalType, setWalletPortalType] = useState<"USCIS" | "NVC" | "COURIER">("USCIS");
  const [walletMode, setWalletMode] = useState<"add" | "edit">("add");
  const [isSubmittingCreds, setIsSubmittingCreds] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isCeacModalOpen, setIsCeacModalOpen] = useState(false);

  const fetchCredentials = useCallback(async () => {
    try {
      const res = await fetch("/api/portal-wallet");
      const data = await res.json();
      if (data.credentials) {
        const uscis = data.credentials.find(
          (c: PortalCredential) => c.portal_type.toUpperCase() === "USCIS"
        );
        const ceac = data.credentials.find(
          (c: PortalCredential) => c.portal_type.toUpperCase() === "NVC"
        );
        const courier = data.credentials.find(
          (c: PortalCredential) => c.portal_type.toUpperCase() === "COURIER"
        );
        setUscisCredentials(uscis || null);
        setCeacCredentials(ceac || null);
        setCourierCredentials(courier || null);
      }
    } catch (err) {
      console.error("Failed to fetch credentials:", err);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials, sId]);

  const handleSaveCredentials = async (data: {
    portalType: "USCIS" | "NVC" | "COURIER";
    username?: string;
    password?: string;
    nvcCaseNumber?: string;
    nvcInvoiceId?: string;
    securityQuestions?: { question: string; answer: string }[];
  }) => {
    setIsSubmittingCreds(true);
    try {
      const res = await fetch("/api/portal-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      showToast(msg(E.CREDENTIAL_SAVE_SUCCESS), "success");
      setIsWalletFormOpen(false);
      await fetchCredentials();

      if (data.portalType === "NVC") {
        try {
          const res = await fetch("/api/portal-wallet");
          const wallet = await res.json();
          const nvcCreds = wallet.credentials?.find(
            (c: any) => c.portal_type?.toUpperCase() === "NVC"
          );
          if (nvcCreds) {
            if (nvcCreds.nvc_case_number) {
              actions.updateMetadata({ nvcCaseNum: nvcCreds.nvc_case_number });
            }
            if (nvcCreds.nvc_invoice_id) {
              actions.updateMetadata({ nvcInvoice: nvcCreds.nvc_invoice_id });
            }
            actions.updateMetadata({ portalType: "NVC" });
            window.location.reload();
          }
        } catch (err) {
          console.error("Failed to sync NVC credentials to metadata", err);
        }
        if (sId === "step_2_1" && !isCompleted) actions.toggleComplete("step_2_1");
      }
      if (data.portalType === "USCIS" && sId === "step_1_6") {
        if (!isCompleted) actions.toggleComplete("step_1_6");
      }
    } catch {
      showToast(msg(E.VAULT_CREDENTIAL_SAVE_FAILED), "error");
    } finally {
      setIsSubmittingCreds(false);
    }
  };

  const handleRevealPassword = async (credentialId: string): Promise<string> => {
    const res = await fetch("/api/portal-wallet/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credentialId,
        portalType: walletPortalType,
        type: "password",
      }),
    });
    const data = await res.json();
    return data.value || "";
  };

  const handleRevealAnswer = async (credentialId: string, questionId: string): Promise<string> => {
    const res = await fetch("/api/portal-wallet/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credentialId,
        portalType: walletPortalType,
        type: "answer",
        questionId,
      }),
    });
    const data = await res.json();
    return data.value || "";
  };

  const handleDeleteCredentials = async (portalType: string) => {
    setIsSubmittingCreds(true);
    try {
      const res = await fetch(`/api/portal-wallet/${portalType}/delete`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      showToast(msg(E.CREDENTIAL_DELETE_SUCCESS), "success");
      if (portalType === "USCIS") setUscisCredentials(null);
      if (portalType === "NVC") setCeacCredentials(null);
      if (portalType === "COURIER") setCourierCredentials(null);
      setIsWalletViewOpen(false);
    } catch {
      showToast(msg(E.VAULT_CREDENTIAL_DELETE_FAILED), "error");
    } finally {
      setIsSubmittingCreds(false);
    }
  };

  return {
    uscisCredentials,
    ceacCredentials,
    courierCredentials,
    setUscisCredentials,
    setCeacCredentials,
    setCourierCredentials,
    isWalletFormOpen,
    setIsWalletFormOpen,
    isWalletViewOpen,
    setIsWalletViewOpen,
    walletPortalType,
    setWalletPortalType,
    walletMode,
    setWalletMode,
    isSubmittingCreds,
    showDeleteConfirmation,
    setShowDeleteConfirmation,
    isCeacModalOpen,
    setIsCeacModalOpen,
    fetchCredentials,
    handleSaveCredentials,
    handleRevealPassword,
    handleRevealAnswer,
    handleDeleteCredentials,
  };
};

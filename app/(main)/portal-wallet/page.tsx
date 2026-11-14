"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { Shield, Wallet } from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import { E, msg } from "@/lib/errors";
import PortalCard from "./components/PortalCard";
import CredentialFormModal from "./components/CredentialFormModal";
import ViewCredentialModal from "./components/ViewCredentialModal";
import WalletSwitcher, {
  WalletCase,
  PortalStatus,
  Journey,
  buildToneMap,
  toneGradient,
} from "./components/Walletswitcher";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { useToast } from "@/app/components/shared/ToastProvider";
import { useCandidate } from "@/app/context/CandidateContext";
import { usePlan } from "@/app/context/PlanContext";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { canonicalJourneyKey, getJourneyKeyForCandidate } from "@/lib/candidate/candidateKeys";

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

interface WalletCandidate {
  id: string;
  relation?: string;
  visaCategory?: string;
  categorySlot?: number;
  label?: string;
  fullName?: string;
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
  let candidateCtx: any;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    candidateCtx = useCandidate();
  } catch {
    candidateCtx = undefined;
  }
  let planCtx: any;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    planCtx = usePlan();
  } catch {
    planCtx = undefined;
  }
  let profileCtx: any;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    profileCtx = useUserProfile();
  } catch {
    profileCtx = undefined;
  }

  const { profile } = profileCtx || {};
  const {
    candidates = [],
    activeCandidate,
    activeJourneyKey,
    setActiveCandidateId,
  }: {
    candidates?: WalletCandidate[];
    activeCandidate?: WalletCandidate;
    activeJourneyKey?: string;
    setActiveCandidateId?: (id: string) => void;
  } = candidateCtx || {};

  // Fetch journeys to detect active IR-1 / IR-5 journeys
  // Flattened journey rows ({ id, journey_type, ... }); /api/journeys wraps each in { journey }.
  const [userJourneys, setUserJourneys] = useState<any[]>([]);
  const [journeysLoaded, setJourneysLoaded] = useState(false);
  useEffect(() => {
    fetch("/api/journeys?limit=100")
      .then((res) => res.json())
      .then((data) => {
        if (data?.data && Array.isArray(data.data)) {
          setUserJourneys(data.data.map((item: any) => item.journey || item));
        }
      })
      .catch(() => {})
      .finally(() => setJourneysLoaded(true));
  }, []);

  const hasIr1Journey = useMemo(() => {
    const fromJourneys = userJourneys.some(
      (j) =>
        j.journey_type?.toUpperCase().includes("IR1") ||
        j.journey_type?.toUpperCase().includes("IR-1") ||
        j.journey_type?.toUpperCase().includes("CR1") ||
        j.journey_type?.toUpperCase().includes("CR-1")
    );
    const fromPlan = Boolean(
      planCtx?.journeyTiers?.["IR-1"] ||
      planCtx?.journeyTiers?.["IR1"] ||
      planCtx?.journeyTiers?.["ir1"] ||
      planCtx?.journeyTiers?.["CR-1"]
    );
    const fromProfile =
      profile?.visaCategory?.toUpperCase().includes("IR-1") ||
      profile?.visaType?.toUpperCase().includes("IR-1") ||
      profile?.visaCategory?.toUpperCase().includes("CR-1") ||
      profile?.visaType?.toUpperCase().includes("CR-1");
    return fromJourneys || fromPlan || fromProfile;
  }, [userJourneys, planCtx?.journeyTiers, profile?.visaCategory, profile?.visaType]);

  const walletCases: WalletCase[] = useMemo(() => {
    const cases: WalletCase[] = [];

    // IR-1 has no candidate concept since there can only be one spouse.
    // If the user has IR-1 activated, always provide the IR-1 Spouse card.
    const hasSpouseInCandidates = candidates.some(
      (c) =>
        c.relation === "Spouse" ||
        c.visaCategory?.toUpperCase().includes("IR-1") ||
        c.visaCategory?.toUpperCase().includes("CR-1")
    );

    if (hasIr1Journey || hasSpouseInCandidates) {
      cases.push({
        id: "ir1",
        journey: "IR-1",
        journeyLabel: "Spouse",
        name: "Spouse",
        role: "Spouse",
      });
    }

    // Add candidate beneficiaries (e.g. IR-5 parents)
    candidates.forEach((c, index) => {
      const isSpouse =
        c.relation === "Spouse" ||
        c.visaCategory?.toUpperCase().includes("IR-1") ||
        c.visaCategory?.toUpperCase().includes("CR-1");
      if (isSpouse) return; // Handled by the IR-1 case above

      const isParent =
        ["Mother", "Father", "Stepparent", "AdoptiveParent"].includes(c.relation) ||
        c.visaCategory?.toUpperCase().includes("IR-5");
      const isChild =
        c.relation === "Child" ||
        c.visaCategory?.toUpperCase().includes("IR-2") ||
        c.visaCategory?.toUpperCase().includes("CR-2");

      // The candidate's own category (an IR-2 / CR-2 child is not an IR-5 case).
      const journey: Journey = isChild && !isParent ? "IR-2" : "IR-5";
      let journeyLabel = "Beneficiary";
      if (isParent) journeyLabel = "Parent";
      else if (isChild) journeyLabel = "Child";
      else if (c.relation) journeyLabel = c.relation;

      const name = c.label || `Candidate ${index + 1}`;
      const role =
        c.fullName && c.fullName.trim() && c.fullName !== c.relation
          ? c.fullName.trim()
          : c.relation && c.relation !== "Other"
            ? c.relation
            : undefined;

      cases.push({
        id: c.id,
        journey,
        journeyLabel,
        name,
        role,
      });
    });

    if (cases.length === 0) {
      cases.push({
        id: "ir1",
        journey: "IR-1",
        journeyLabel: "Spouse",
        name: "Spouse",
        role: "Spouse",
      });
    }

    return cases;
  }, [candidates, hasIr1Journey]);

  // Selected card in the wallet (defaults to IR-1 if active, or first case)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("ir1");

  useEffect(() => {
    if (walletCases.length > 0) {
      const stillValid = walletCases.some((c) => c.id === selectedCandidateId);
      if (!stillValid) {
        const defaultId = walletCases.find((c) => c.journey === "IR-1")?.id || walletCases[0].id;
        setSelectedCandidateId(defaultId);
      }
    }
  }, [walletCases, selectedCandidateId]);

  const activeId = selectedCandidateId || (walletCases[0]?.id ?? "ir1");
  const activeJourneyKeyForWallet = useMemo(() => {
    if (activeId === "ir1") return "ir1";
    const candidate = candidates.find((c) => c.id === activeId);
    // The candidate's category-slot key ("ir2" for the first IR-2 child, even when
    // its id is candidate-3), never a key derived from the id.
    return candidate
      ? getJourneyKeyForCandidate({ ...candidate, visaCategory: candidate.visaCategory || "IR-5" })
      : activeJourneyKey;
  }, [activeId, activeJourneyKey, candidates]);
  const activeJourneyId: string | undefined = useMemo(() => {
    const wanted = canonicalJourneyKey(activeJourneyKeyForWallet);
    if (!wanted) return undefined;
    // userJourneys holds flattened rows, so match on journey_type / id directly
    // ("item.journey" is always undefined here). Canonical keys make "IR1" /
    // "ir1-journey" / "ir1" the same journey.
    return userJourneys.find((j) => canonicalJourneyKey(j?.journey_type) === wanted)?.id;
  }, [activeJourneyKeyForWallet, userJourneys]);

  const [walletSwitcherOpen, setWalletSwitcherOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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
    if (!activeId) return;
    if (!activeJourneyId) {
      // No journey row for this case: nothing to load. Stop the spinner once the
      // journey list has arrived instead of waiting forever.
      if (journeysLoaded) {
        setCredentials([]);
        setLoading(false);
      }
      return;
    }
    // A request that never answers would leave the page on "Loading your vault..."
    // forever. Give up after 20s and show an error with a retry instead.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const qs = `?journeyId=${encodeURIComponent(activeJourneyId)}&candidateId=${encodeURIComponent(activeId)}`;
      const res = await fetch(`${API_BASE}${qs}`, { signal: controller.signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Failed to fetch credentials:", res.status, data);
        setLoadError(
          res.status === 401
            ? "Your session has expired. Please sign in again."
            : "We could not load your saved credentials. Please try again."
        );
        setCredentials([]);
        return;
      }
      setLoadError(null);
      setCredentials(Array.isArray(data.credentials) ? data.credentials : []);
    } catch (err) {
      console.error("Failed to fetch credentials:", err);
      setLoadError("We could not load your saved credentials. Please try again.");
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }, [activeId, activeJourneyId, journeysLoaded]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const [allCredentials, setAllCredentials] = useState<any[]>([]);

  const fetchAllCredentials = useCallback(async () => {
    if (!activeJourneyId) return;
    try {
      const res = await fetch(
        `${API_BASE}?journeyId=${encodeURIComponent(activeJourneyId)}&candidateId=${encodeURIComponent(activeId)}`
      );
      const data = await res.json();
      if (data?.credentials) setAllCredentials(data.credentials);
    } catch (err) {
      console.error("Failed to fetch all credentials:", err);
    }
  }, [activeJourneyId, activeId]);

  useEffect(() => {
    fetchAllCredentials();
  }, [fetchAllCredentials]);

  const statusByCase: Record<string, PortalStatus> = useMemo(() => {
    const map: Record<string, PortalStatus> = {};
    walletCases.forEach((c) => {
      const creds = allCredentials.filter((cred) => {
        if (c.id === "ir1") {
          return cred.candidate_id === "ir1" || !cred.candidate_id;
        }
        return cred.candidate_id === c.id;
      });
      map[c.id] = {
        USCIS: creds.some((cr) => cr.portal_type?.toUpperCase() === "USCIS"),
        NVC: creds.some((cr) => cr.portal_type?.toUpperCase() === "NVC"),
        COURIER: creds.some((cr) => cr.portal_type?.toUpperCase() === "COURIER"),
      };
    });
    return map;
  }, [walletCases, allCredentials]);

  const portalStatus: PortalStatus = useMemo(
    () => ({
      USCIS: credentials.some((c) => c.portal_type.toUpperCase() === "USCIS"),
      NVC: credentials.some((c) => c.portal_type.toUpperCase() === "NVC"),
      COURIER: credentials.some((c) => c.portal_type.toUpperCase() === "COURIER"),
    }),
    [credentials]
  );

  const toneMap = useMemo(() => buildToneMap(walletCases), [walletCases]);
  const activeTone = useMemo(() => {
    if (activeId && toneMap[activeId]) {
      return toneGradient(toneMap[activeId]);
    }
    return "linear-gradient(140deg, #0f5a60, #0a3a3f)";
  }, [activeId, toneMap]);

  const configuredCount = useMemo(() => {
    let count = 0;
    if (portalStatus.USCIS) count++;
    if (portalStatus.NVC) count++;
    if (portalStatus.COURIER) count++;
    return count;
  }, [portalStatus]);

  const activeCase = useMemo(() => {
    return walletCases.find((c) => c.id === activeId) || walletCases[0];
  }, [walletCases, activeId]);

  const getCredential = (portalType: string) =>
    credentials.find((c) => c.portal_type.toUpperCase() === portalType.toUpperCase());

  const handleAddOrEdit = async (data: any) => {
    setIsSubmitting(true);
    setProcessingPortal(data.portalType);

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, journeyId: activeJourneyId, candidateId: activeId }),
      });
      if (!res.ok) throw new Error("Failed to save");
      showToast("Credentials saved successfully!", "success");
      setFormModal((prev) => ({ ...prev, open: false }));
      await Promise.all([fetchCredentials(), fetchAllCredentials()]);
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
      const qs = `?journeyId=${encodeURIComponent(activeJourneyId ?? "")}&candidateId=${encodeURIComponent(activeId)}`;
      const res = await fetch(`${API_BASE}/${portalType}/delete${qs}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      showToast("Credentials deleted successfully!", "success");

      setShowConfirmation(false);
      setViewModal({ open: false, portalType: "USCIS" });
      setDeletePortal(null);

      await Promise.all([fetchCredentials(), fetchAllCredentials()]);
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
        journeyId: activeJourneyId,
        candidateId: activeId,
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
        journeyId: activeJourneyId,
        candidateId: activeId,
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
        journeyId: activeJourneyId,
        candidateId: activeId,
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
        journeyId: activeJourneyId,
        candidateId: activeId,
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

  if (loadError && credentials.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm font-medium text-[#0c1b33]">{loadError}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            fetchCredentials();
            fetchAllCredentials();
          }}
          className="rounded-lg bg-[#0d7377] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a5c5f]"
        >
          Try again
        </button>
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

          {/* Candidate switcher trigger — clean pill that clearly signals "click to switch" */}
          <div className="mt-7 flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => setWalletSwitcherOpen(true)}
              className="group relative inline-flex items-center gap-3 rounded-2xl border border-[#0d7377]/20 bg-white py-2.5 pr-4 pl-3 shadow-sm transition-all duration-200 hover:border-[#0d7377]/50 hover:shadow-[0_4px_20px_rgba(13,115,119,0.1)] active:scale-[0.98]"
            >
              {/* Teal avatar dot */}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e6f7f4] text-[#0d7377] transition-colors duration-200 group-hover:bg-[#0d7377] group-hover:text-white">
                <Wallet size={16} strokeWidth={2} />
              </span>

              {/* Labels */}
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[10px] font-semibold tracking-widest text-[#94a3b8] uppercase">
                  Viewing credentials for
                </span>
                <span className="text-[14px] font-bold text-[#0f172a]">
                  {activeCase?.name ?? "Spouse"}{" "}
                  <span className="font-normal text-[#64748b]">
                    ({activeCase?.journey ?? "IR-1"})
                  </span>
                </span>
              </div>

              {/* Divider */}
              <span className="h-6 w-px bg-slate-200" />

              {/* "Switch" cue */}
              <div className="flex items-center gap-1 text-[12px] font-semibold text-[#0d7377]">
                <span>Switch</span>
                {/* Animated chevron right */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </button>

            {/* Subtle hint text below */}
            <p className="text-[11px] text-[#94a3b8]">
              {walletCases.length > 1
                ? `${walletCases.length} candidates · click to switch`
                : "click to manage your wallet"}
            </p>
          </div>
        </div>

        {/* No journey row for this case yet: credentials are saved per journey, so
            show a notice instead of cards whose save would fail. The switcher above
            stays usable. */}
        {!activeJourneyId ? (
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-semibold text-[#0c1b33]">No journey started for this case yet</p>
            <p className="mt-1 text-sm text-[#64748b]">
              Portal credentials are saved per journey. Start this journey first, or switch to
              another candidate above.
            </p>
          </div>
        ) : (
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
        )}

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
        journeyId={activeJourneyId || ""}
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

      {/* Wallet Switcher Modal */}
      <WalletSwitcher
        open={walletSwitcherOpen}
        onClose={() => setWalletSwitcherOpen(false)}
        cases={walletCases}
        activeId={activeId}
        onSelect={(id) => {
          setSelectedCandidateId(id);
          if (setActiveCandidateId && id !== "ir1") {
            setActiveCandidateId(id);
          }
        }}
        portalStatus={loading ? null : portalStatus}
        statusByCase={statusByCase}
      />
    </div>
  );
};

export default PortalWallet;

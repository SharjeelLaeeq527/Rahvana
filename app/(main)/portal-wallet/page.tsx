"use client";

import React, { useState, useEffect, useCallback, useMemo, useLayoutEffect, useRef } from "react";
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
import { PageGate } from "@/app/components/entitlements/PageGate";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { canonicalJourneyKey, getJourneyKeyForCandidate } from "@/lib/candidate/candidateKeys";
import { getBaseVisaCategory } from "@/lib/candidate/candidateSyncService";

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
  customName?: string;
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
    iconHoverBgColor: "group-hover:bg-primary",
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
    const seenCaseIds = new Set<string>();

    // 1. Process each journey from userJourneys (Database Journeys Table is primary)
    userJourneys.forEach((j, index) => {
      const jType = j.journey_type || "";
      const baseCategory = getBaseVisaCategory(jType);
      const isMulti = baseCategory === "IR-5" || baseCategory === "IR-2" || baseCategory === "CR-2";

      if (baseCategory === "IR-1" || baseCategory === "CR-1") {
        const caseId = "ir1";
        if (!seenCaseIds.has(caseId)) {
          seenCaseIds.add(caseId);
          const customName = profile?.journeyCustomizations?.[j.id]?.name;
          cases.push({
            id: caseId,
            journey: "IR-1",
            journeyLabel: "Spouse",
            name: customName || "Spouse",
            role: "Spouse",
            candidateId: "ir1",
            journeyDbId: j.id,
            journeyType: jType,
          });
        }
      } else if (isMulti) {
        // Extract candidate number if present, e.g. "ir5_candidate3" -> "candidate-3"
        const candIdMatch = jType.match(/candidate[-_]?(\d+)/i);
        const candNum = candIdMatch ? parseInt(candIdMatch[1], 10) : index + 1;
        const candidateId = candIdMatch ? `candidate-${candIdMatch[1]}` : `candidate-${candNum}`;
        const caseId = j.id ? `case_${j.id}` : `case_${baseCategory.toLowerCase()}_${candidateId}`;

        if (!seenCaseIds.has(caseId)) {
          seenCaseIds.add(caseId);

          // Look up matching candidate in profile/candidates
          const cand = candidates.find(
            (c) =>
              c.id === candidateId ||
              (c.visaCategory && getBaseVisaCategory(c.visaCategory) === baseCategory)
          );

          const isParent = baseCategory === "IR-5";
          const journey: Journey = isParent ? "IR-5" : "IR-2";
          let journeyLabel = isParent ? "Parent" : "Child";
          if (cand?.relation && cand.relation !== "Other") {
            journeyLabel = cand.relation === "AdoptiveParent" ? "Adoptive Parent" : cand.relation;
          }

          const customName = profile?.journeyCustomizations?.[j.id]?.name;
          const name =
            customName ||
            cand?.customName ||
            cand?.fullName ||
            cand?.label ||
            `Candidate ${candNum}`;

          const role =
            cand?.relation && cand.relation !== "Other"
              ? cand.relation === "AdoptiveParent"
                ? "Adoptive Parent"
                : cand.relation
              : isParent
                ? "Parent"
                : "Child";

          cases.push({
            id: caseId,
            journey,
            journeyLabel,
            name,
            role,
            candidateId,
            journeyDbId: j.id,
            journeyType: jType,
          });
        }
      } else {
        // Any other category (e.g. F-1, B1/B2, etc.)
        const caseId = j.id ? `case_${j.id}` : `case_${jType}`;
        if (!seenCaseIds.has(caseId)) {
          seenCaseIds.add(caseId);
          const customName = profile?.journeyCustomizations?.[j.id]?.name;
          cases.push({
            id: caseId,
            journey: baseCategory || jType.toUpperCase(),
            journeyLabel: "Beneficiary",
            name: customName || jType.toUpperCase(),
            role: "Applicant",
            candidateId: "candidate-1",
            journeyDbId: j.id,
            journeyType: jType,
          });
        }
      }
    });

    // 2. Add any candidate profiles from candidates roster that don't have a DB journey row yet
    candidates.forEach((c, index) => {
      const isSpouse =
        c.relation === "Spouse" ||
        c.visaCategory?.toUpperCase().includes("IR-1") ||
        c.visaCategory?.toUpperCase().includes("CR-1");

      if (isSpouse) {
        if (!seenCaseIds.has("ir1")) {
          seenCaseIds.add("ir1");
          cases.push({
            id: "ir1",
            journey: "IR-1",
            journeyLabel: "Spouse",
            name: "Spouse",
            role: "Spouse",
            candidateId: "ir1",
          });
        }
        return;
      }

      const isParent =
        ["Mother", "Father", "Stepparent", "AdoptiveParent"].includes(c.relation) ||
        c.visaCategory?.toUpperCase().includes("IR-5");
      const isChild =
        c.relation === "Child" ||
        c.visaCategory?.toUpperCase().includes("IR-2") ||
        c.visaCategory?.toUpperCase().includes("CR-2");

      const journey: Journey = isChild && !isParent ? "IR-2" : "IR-5";
      const caseId = `cand_${c.id}`;

      // Check if already covered by a journey card with matching journey and candidateId
      const alreadyCovered = cases.some(
        (existing) => existing.journey === journey && existing.candidateId === c.id
      );

      if (!alreadyCovered && !seenCaseIds.has(caseId)) {
        seenCaseIds.add(caseId);
        let journeyLabel = isParent ? "Parent" : isChild ? "Child" : c.relation || "Beneficiary";
        const name = c.label || c.customName || c.fullName || `Candidate ${index + 1}`;
        const role =
          c.fullName && c.fullName.trim() && c.fullName !== c.relation
            ? c.fullName.trim()
            : c.relation && c.relation !== "Other"
              ? c.relation
              : undefined;

        cases.push({
          id: caseId,
          journey,
          journeyLabel,
          name,
          role,
          candidateId: c.id,
        });
      }
    });

    // 3. Fallback if no cases
    if (cases.length === 0) {
      cases.push({
        id: "ir1",
        journey: "IR-1",
        journeyLabel: "Spouse",
        name: "Spouse",
        role: "Spouse",
        candidateId: "ir1",
      });
    }

    // 4. Sort deterministically: IR-1 first, then IR-5, then IR-2
    const ORDER: Record<string, number> = {
      "IR-1": 1,
      "CR-1": 1,
      "IR-5": 2,
      "IR-2": 3,
      "CR-2": 3,
    };
    cases.sort((a, b) => {
      const orderA = ORDER[a.journey] ?? 10;
      const orderB = ORDER[b.journey] ?? 10;
      if (orderA !== orderB) return orderA - orderB;
      const numA = parseInt(a.candidateId?.replace(/\D/g, "") || "0", 10);
      const numB = parseInt(b.candidateId?.replace(/\D/g, "") || "0", 10);
      if (numA !== numB) return numA - numB;
      return a.id.localeCompare(b.id);
    });

    return cases;
  }, [userJourneys, candidates, profile?.journeyCustomizations]);

  // Selected card in the wallet (defaults to IR-1 if active, or first case)
  const [selectedCaseId, setSelectedCaseId] = useState<string>("ir1");

  useEffect(() => {
    if (walletCases.length > 0) {
      const stillValid = walletCases.some(
        (c) =>
          c.id === selectedCaseId ||
          c.candidateId === selectedCaseId ||
          c.journeyDbId === selectedCaseId
      );
      if (!stillValid) {
        const defaultCase = walletCases.find((c) => c.journey === "IR-1") || walletCases[0];
        setSelectedCaseId(defaultCase.id);
      }
    }
  }, [walletCases, selectedCaseId]);

  const activeCase = useMemo(() => {
    return (
      walletCases.find(
        (c) =>
          c.id === selectedCaseId ||
          c.candidateId === selectedCaseId ||
          c.journeyDbId === selectedCaseId
      ) || walletCases[0]
    );
  }, [walletCases, selectedCaseId]);

  const activeId = activeCase?.candidateId || activeCase?.id || "candidate-1";
  const activeJourneyId = activeCase?.journeyDbId;

  const [walletSwitcherOpen, setWalletSwitcherOpen] = useState(true);

  // Opened from a journey dashboard (?candidate=ir1 | <candidate id> | ?journeyId=<id>): show that
  // candidate's portals directly instead of the wallet switcher.
  const urlCandidateRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cand = params.get("candidate");
    const jId = params.get("journeyId");
    const target = cand || jId;
    if (target) {
      urlCandidateRef.current = target;
      setWalletSwitcherOpen(false);
    }
  }, []);

  useEffect(() => {
    const target = urlCandidateRef.current;
    if (!target) return;
    const match = walletCases.find(
      (c) =>
        c.id === target ||
        c.candidateId === target ||
        c.journeyDbId === target ||
        (target === "ir1" && (c.journey === "IR-1" || c.candidateId === "ir1"))
    );
    if (!match) return;
    urlCandidateRef.current = null;
    setSelectedCaseId(match.id);
  }, [walletCases]);

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

  const [credentialsSummary, setCredentialsSummary] = useState<
    Array<{ journey_id: string; candidate_id: string; portal_type: string }>
  >([]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}?summary=true`);
      const data = await res.json();
      if (Array.isArray(data?.summary)) {
        setCredentialsSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch credentials summary:", err);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const statusByCase: Record<string, PortalStatus> = useMemo(() => {
    const map: Record<string, PortalStatus> = {};
    walletCases.forEach((c) => {
      const matches = credentialsSummary.filter((cred) => {
        if (c.journeyDbId && cred.journey_id === c.journeyDbId) return true;
        if (c.id === "ir1") {
          return cred.candidate_id === "ir1" || !cred.candidate_id;
        }
        return c.candidateId && cred.candidate_id === c.candidateId;
      });
      map[c.id] = {
        USCIS: matches.some((cr) => cr.portal_type?.toUpperCase() === "USCIS"),
        NVC: matches.some((cr) => cr.portal_type?.toUpperCase() === "NVC"),
        COURIER: matches.some((cr) => cr.portal_type?.toUpperCase() === "COURIER"),
      };
    });
    return map;
  }, [walletCases, credentialsSummary]);

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
    if (activeCase?.id && toneMap[activeCase.id]) {
      return toneGradient(toneMap[activeCase.id]);
    }
    return "linear-gradient(140deg, #0f5a60, #0a3a3f)";
  }, [activeCase, toneMap]);

  const configuredCount = useMemo(() => {
    let count = 0;
    if (portalStatus.USCIS) count++;
    if (portalStatus.NVC) count++;
    if (portalStatus.COURIER) count++;
    return count;
  }, [portalStatus]);

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
      await Promise.all([fetchCredentials(), fetchSummary()]);
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

      await Promise.all([fetchCredentials(), fetchSummary()]);
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
        <p className="mt-2 text-sm font-medium text-primary">Loading your vault...</p>
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
            fetchSummary();
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a5c5f]"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafa]">
      {/* HTML-matched hero header */}
      <header className="site-main-px relative mt-12 overflow-hidden bg-[linear-gradient(135deg,#0A4F49_0%,#073b37_100%)] py-[42px] pb-[76px] text-white">
      <svg
  className="pointer-events-none absolute hidden md:block md:right-[300px] lg:right-[450px] bottom-14 h-[160px] w-[150px] opacity-[.14]"
  viewBox="160 70 840 850"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  {/* Protective Vault Shield Crest */}
  <path
    d="M 590 100 L 920 225 V 485 C 920 695 775 845 590 905 C 405 845 260 695 260 485 V 225 L 590 100 Z"
    fill="none"
    stroke="currentColor"
    strokeWidth="10"
    strokeLinejoin="round"
  />
  <path
    d="M 590 135 L 885 248 V 480 C 885 670 755 808 590 865 C 425 808 295 670 295 480 V 248 L 590 135 Z"
    fill="none"
    stroke="currentColor"
    strokeWidth="4"
    strokeDasharray="16 12"
    opacity="0.75"
  />

  {/* Digital Credential Card */}
  <g transform="translate(715, 225) rotate(8)">
    <rect x="0" y="0" width="165" height="108" rx="16" fill="none" stroke="currentColor" strokeWidth="8" />
    <line x1="22" y1="36" x2="82" y2="36" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
    <line x1="22" y1="62" x2="132" y2="62" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    <line x1="22" y1="82" x2="105" y2="82" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    <circle cx="132" cy="34" r="12" fill="currentColor" />
  </g>

  {/* Security Vault Padlock */}
  <g transform="translate(755, 655)">
    <path
      d="M 32 55 V 36 C 32 16 48 0 68 0 C 88 0 104 16 104 36 V 55"
      fill="none"
      stroke="currentColor"
      strokeWidth="12"
      strokeLinecap="round"
    />
    <rect x="12" y="52" width="112" height="92" rx="18" fill="currentColor" />
    <circle cx="68" cy="88" r="12" fill="#0f172a" />
    <path d="M 63 94 L 60 118 H 76 L 73 94 Z" fill="#0f172a" />
  </g>

  {/* Rahvana Bird */}
  <path
    fill="currentColor"
    fillRule="evenodd"
    d="M236,880C228,876 222,867 222,860C222,854 229,840 237,832C244,824 270,806 281,801C284,800 296,794 300,792C307,789 328,781 348,774C352,772 358,770 360,770C361,769 364,768 366,768C367,768 370,767 371,766C372,766 376,764 380,763C383,762 387,761 390,760C392,760 397,758 401,757C405,756 413,754 418,753C424,751 429,750 430,750C432,750 448,740 452,735C454,734 458,730 462,728C482,713 509,687 523,667C529,659 529,657 523,657C518,657 500,652 492,648C487,646 474,640 469,637C449,626 418,594 404,570C400,564 399,562 389,556C359,535 336,510 321,479C307,452 300,426 300,400C300,383 301,378 306,374C311,370 319,373 326,381C327,383 330,386 331,387C332,389 333,390 333,390C333,391 335,394 338,398C340,403 342,406 342,407C342,407 344,411 346,416C348,421 352,429 354,434C356,440 358,445 359,446C359,448 361,452 363,457C365,462 367,469 369,472C371,476 372,480 372,481C372,481 373,484 374,486C377,493 378,496 379,500C380,502 383,507 384,511C386,514 387,517 387,518C387,518 388,521 390,525C392,529 394,533 395,535C397,540 397,541 402,550C421,585 441,608 468,626C475,631 496,642 498,642C498,642 500,643 502,643C509,646 526,650 532,650C535,650 535,650 541,639C544,632 546,626 546,626C546,625 546,624 547,623C548,622 552,609 557,591C563,564 561,527 551,502C540,474 522,455 487,434C485,433 465,423 462,421C454,418 432,409 421,405C417,403 412,401 410,400C409,400 405,398 403,397C398,396 393,393 382,388C368,382 366,381 361,378C358,376 356,375 355,375C355,375 352,374 350,372C347,371 345,369 344,368C308,347 280,314 266,276C263,267 258,251 257,245C256,242 254,236 254,233C249,216 247,184 248,161C249,142 252,136 259,132C269,127 278,135 293,159C311,187 325,207 337,220C339,223 344,229 347,232C366,254 396,279 416,290C419,291 422,293 424,294C428,297 442,303 451,308C462,313 471,317 476,319C490,325 493,326 502,331C507,333 516,338 520,340C525,343 531,346 533,347C540,351 550,358 560,365C566,369 572,374 573,375C580,380 602,402 609,412C620,427 622,430 630,446C635,457 637,462 643,480C646,488 649,504 653,525C659,563 660,567 668,567C671,567 673,566 675,566C676,565 677,564 678,564C680,564 710,541 728,525C732,522 744,511 754,501C779,477 785,472 798,464C816,454 834,449 854,452C869,454 879,458 892,469C898,474 902,476 913,477C935,480 943,482 943,485C942,487 935,491 930,492C921,494 907,500 894,507C880,515 866,529 858,544C852,555 846,567 846,569C846,570 846,571 845,572C845,572 843,576 842,581C839,589 838,592 835,600C835,602 833,606 832,610C831,615 826,630 822,640C810,675 776,713 739,732C735,734 731,737 730,737C729,738 721,742 714,744C678,758 649,762 609,760C585,759 577,758 568,757C521,751 463,751 439,757C434,758 402,783 383,800C377,805 370,810 368,813C359,820 353,825 340,836C312,859 289,874 269,880C261,883 242,883 236,880ZM259,873C275,872 299,859 323,840C328,836 334,831 337,829C339,826 348,819 355,813C366,803 377,794 395,780C396,778 398,777 399,776C400,775 403,773 406,770C415,763 417,761 409,763C406,764 398,767 391,769C373,773 378,772 340,785C336,786 332,787 331,788C330,788 328,789 326,790C308,797 285,807 276,812C248,829 231,848 231,861C231,866 237,873 243,874C245,874 247,874 248,875C248,875 250,875 251,874C252,874 256,874 259,873ZM652,751C666,749 677,747 683,745C697,741 700,740 711,736C717,734 723,731 725,730C726,730 727,729 728,729C728,729 731,728 733,726C736,724 738,723 739,723C740,723 759,710 766,704C774,697 788,683 791,678C798,669 804,659 804,659C804,658 805,657 805,656C807,654 816,632 820,622C821,617 823,612 823,611C824,610 826,603 828,596C830,589 833,579 835,574C837,568 839,562 840,561C840,560 841,557 842,556C842,555 843,553 844,552C856,529 871,512 888,502C897,497 911,490 914,489C923,488 921,485 911,485C900,484 895,481 884,473C874,466 870,463 860,461C848,458 829,459 816,464C797,472 785,481 746,520C739,527 730,535 726,538C722,541 715,546 710,551C679,575 669,579 661,574C652,568 650,562 643,521C635,473 625,446 601,414C593,404 573,384 561,375C548,365 523,350 510,344C508,343 505,341 504,341C489,333 476,327 475,327C474,327 471,326 468,324C464,323 459,320 455,318C411,299 383,280 352,248C325,221 316,208 282,157C266,133 260,132 257,154C255,168 257,210 260,222C260,224 262,229 262,234C265,245 268,257 273,269C274,272 276,276 276,277C279,287 291,309 301,321C309,332 337,357 340,357C341,357 344,359 347,361C350,363 357,367 362,369C376,376 392,384 392,384C393,384 396,385 399,387C405,390 424,398 432,401C435,402 441,404 446,407C452,409 456,411 457,411C457,411 459,412 461,412C462,413 468,416 474,419C489,426 491,427 498,431C536,456 554,479 565,519C567,526 567,529 567,554C567,581 567,589 563,600C562,601 562,604 561,606C561,609 559,615 557,620C555,626 552,632 552,633C552,635 549,639 547,643C545,647 544,650 544,651C545,651 552,651 559,651C594,651 625,641 668,615C673,612 678,609 679,609C680,608 683,607 686,605C691,602 694,602 694,604C694,605 678,617 667,624C654,633 636,642 627,646C596,656 584,659 556,660L538,660L534,666C530,672 530,673 522,682C518,686 513,692 511,695C507,699 488,718 481,723C474,729 462,738 460,740C457,742 454,745 455,745C455,746 463,745 472,745C492,743 529,745 557,748C576,750 595,752 602,752C612,753 645,752 652,751ZM390,545C390,544 390,543 389,542C386,537 378,518 371,501C369,495 365,486 363,482C362,477 359,470 357,466C356,462 353,455 351,450C349,445 347,440 347,438C335,406 319,380 312,381C310,381 309,382 309,388C308,395 309,420 310,424C311,425 312,429 312,431C312,433 314,438 314,440C315,442 317,447 318,449C324,472 342,502 359,520C374,536 390,549 390,545Z"
  />
</svg>

        <div className="relative z-10 mx-auto flex max-w-[1320px] flex-col justify-between gap-7 sm:flex-row sm:items-center">
          <div className="max-w-[580px]">
            <div className="mb-3 inline-flex items-center gap-[7px] rounded-full border border-[#E1F2EE]/22 bg-[#E1F2EE]/14 px-3 py-[5px] text-[11.5px] font-semibold tracking-[0.04em] text-[#E1F2EE] uppercase backdrop-blur-sm">
              <Shield size={13} strokeWidth={2.5} />
              <span>Encrypted Credential Vault</span>
            </div>
            <h1 className="mb-2 text-[clamp(32px,4.5vw,44px)] leading-[1.15] font-semibold tracking-[-0.015em] text-white">
              Portal Wallet
            </h1>
            <p className="m-0 text-[15.5px] leading-[1.55] text-white/88">
              Securely manage credentials and portal case access with zero-knowledge encryption.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setWalletSwitcherOpen(true)}
            className="group inline-flex w-full items-center gap-4 rounded-[20px] border border-white/85 bg-white py-3 pr-[18px] pl-[14px] text-[#16302C] shadow-[0_14px_34px_-10px_rgba(7,40,36,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0F8F80] hover:shadow-[0_18px_40px_-8px_rgba(7,40,36,0.38)] active:scale-[0.985] sm:w-auto"
            aria-label="Switch candidate credentials"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#E1F2EE] text-[#0A4F49]">
              <Wallet size={22} strokeWidth={2} />
            </span>
            <span className="flex min-w-0 flex-col items-start leading-tight">
              <span className="text-[10px] font-semibold tracking-[0.08em] text-[#66787A] uppercase">
                Viewing Credentials For
              </span>
              <span className="mt-1 max-w-[240px] truncate text-[14px] font-bold text-[#16302C]">
                {activeCase?.name ?? "Candidate"}
                {activeCase?.journey ? ` (${activeCase.journey})` : ""}
              </span>
              <span className="mt-1 text-[11px] text-[#66787A]">
                {walletCases.length > 1
                  ? `${walletCases.length} candidates · click to switch`
                  : "click to manage your wallet"}
              </span>
            </span>
            <span className="h-8 w-px shrink-0 bg-[#E2E5E8]" />
            <span className="flex items-center gap-1 text-[12px] font-semibold text-[#0F8F80]">
              <span>Switch</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
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
            </span>
          </button>
        </div>
      </header>

      <div className="site-main-px relative z-20 -mt-8 pb-12 w-full sm:-mt-12 sm:pb-20">

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
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-[#e8f6f6] px-4 py-2.5">
            <Shield size={12} className="text-primary" />
            <span className="text-[9px] font-medium text-primary md:text-[12px]">
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
        activeId={activeCase?.id || selectedCaseId}
        onSelect={(id) => {
          setSelectedCaseId(id);
          const match = walletCases.find((c) => c.id === id);
          if (setActiveCandidateId && match?.candidateId && match.candidateId !== "ir1") {
            setActiveCandidateId(match.candidateId);
          }
        }}
        portalStatus={loading ? null : portalStatus}
        statusByCase={statusByCase}
      />
    </div>
  );
};

/**
 * Portal wallet is part of the journey plans (Basic and up, `portal_wallet`).
 * The gate wraps the whole page so nothing (credentials included) loads when locked.
 */
const PortalWalletPage: React.FC = () => (
  <PageGate
    feature="portal_wallet"
    title="Portal Wallet Locked"
    description="Upgrade your journey plan to keep your NVC, CEAC and courier logins safe in one place."
  >
    <PortalWallet />
  </PageGate>
);

export default PortalWalletPage;

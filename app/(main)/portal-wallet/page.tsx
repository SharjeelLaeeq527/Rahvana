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
            fetchSummary();
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

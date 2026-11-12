"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { useRouter } from "next/navigation";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import {
  getCategoryDisplayName,
  DYNAMIC_CATEGORIES,
  CATEGORY_SUGGESTIONS,
  getDocumentsByCategory,
} from "@/lib/document-vault/personalization-engine";
import { ALL_DOCUMENTS } from "@/lib/document-vault/document-definitions";
import type { UploadedDocument, VisaCategory, ScenarioFlags } from "@/lib/document-vault/types";
import { VISA_FLAG_REGISTRY } from "@/lib/document-vault/flag-registry";
import { DocumentCard } from "@/app/components/document-vault/DocumentCard";
import { DocumentTableView } from "@/app/components/document-vault/DocumentTableView";
import { DocumentPreviewModal } from "@/app/components/document-vault/DocumentPreviewModal";
import { DocumentUploadModal } from "@/app/components/document-vault/DocumentUploadModal";
import { MultipleDocumentUploadModal } from "@/app/components/document-vault/MultipleDocumentUploadModal";
import { DocumentWizard } from "@/app/components/document-vault/DocumentWizard";
// import { ConfigurationWizard } from "@/app/components/document-vault/ConfigurationWizard";
import { NotificationBell } from "@/app/components/document-vault/NotificationCenter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Search,
  X as CloseIcon,
  ShieldCheck,
  ChevronDown,
  Zap,
  CheckCircle,
  AlertCircle,
  List,
  LayoutGrid,
  Compass,
  Route,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { useToast } from "@/app/components/shared/ToastProvider";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Info, LayoutTemplate } from "lucide-react";
import { useWizard } from "@/app/(main)/dashboard/hooks/useWizard";
import { useCandidate } from "@/app/context/CandidateContext";
import { getJourneyKeyForCandidate, getBaseVisaCategory } from "@/lib/candidate/candidateSyncService";
import Link from "next/link";
import Image from "next/image";
import { PageGate } from "@/app/components/entitlements/PageGate";
import { ir1journeyHref, ir5journeyHref } from "@/lib/constants/routes";
import type { Journey } from "@/lib/journey/types";
import {
  getFriendlyJourneyName,
  journeyTypeToVisaCategory,
  setCachedUserJourneys,
  syncQuestionnaireAnswersToFlags,
  mapDocumentNameToId,
  dedupeJourneysByType,
  getCandidateDisplayNameForJourney,
  getCandidateForJourneyType,
} from "@/lib/document-vault/journey-mapping";

// Session-storage key for persisted journey choice (Case 3)
const SESSION_KEY = "doc_vault_active_journey";

export default function DocumentVaultPage() {
  const { showToast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const {
    config,
    uploadedDocuments,
    requiredDocuments,
    selectedDocumentDefId,
    wizardOpen,
    uploadModalOpen,
    initialize,
    openUploadModal,
    closeUploadModal,
    openWizard,
    closeWizard,
    refreshDocumentStatuses,
    refreshNotifications,
    reloadDocuments,
    deleteDocument,
    addDynamicSlot,
    renameDynamicSlot,
    deleteDynamicSlot,
    isReloadingDocs,
  } = useDocumentVaultStore();

  const [showConfigWizard, setShowConfigWizard] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null);

  const previewDocRelatedFiles = useMemo(() => {
    if (!previewDoc) return [];

    const defId = previewDoc.documentDefId;
    const parentDef = ALL_DOCUMENTS.find(
      (d) =>
        d.isDynamicCategory &&
        (d.id === defId || d.suggestions?.some((opt) => mapDocumentNameToId(opt) === defId))
    );

    let filtered: UploadedDocument[] = [];
    if (parentDef) {
      const parentCategory = (parentDef as any).category as string;
      const suggestionsIds = (parentDef.suggestions || []).map((opt) => mapDocumentNameToId(opt));

      filtered = uploadedDocuments.filter((d) => {
        if (d.documentDefId === parentDef.id) return true;
        if (suggestionsIds.includes(d.documentDefId)) return true;
        if (parentCategory && d.documentDefId.startsWith(`dynamic-${parentCategory}-`)) return true;
        return false;
      });
    } else {
      filtered = uploadedDocuments.filter((d) => d.documentDefId === defId);
    }

    // Deduplicate by storagePath
    const seen = new Set<string>();
    return filtered.filter((d) => {
      const key = d.storagePath || d.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [previewDoc, uploadedDocuments]);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [activeTab, setActiveTab] = useState<string>("required");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSlotModalOpen, setDeleteSlotModalOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<{ category: string; id: string } | null>(null);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  // ── Journey gate state ────────────────────────────────────────────────────
  const [userJourneys, setUserJourneys] = useState<Journey[]>([]);
  const [journeysLoading, setJourneysLoading] = useState(true);
  const [noJourneyModalOpen, setNoJourneyModalOpen] = useState(false);
  /** Case 3 — the currently active journey id selected by the user */
  const [activeJourneyId, setActiveJourneyId] = useState<string | null>(null);
  /** Whether journey gate evaluation is complete */
  const [journeyGateReady, setJourneyGateReady] = useState(false);
  /**
   * Ref guard — ensures evaluateJourneyGate() runs exactly once per mount,
   * regardless of how many times useAuth() re-creates the `user` object reference.
   */
  const journeyGateEvaluated = useRef(false);

  /**
   * Tracks the last candidate we auto-resolved to a journey. The candidate->journey sync
   * effect must only run when the CANDIDATE changes, otherwise "Back to Journeys"
   * (which sets activeJourneyId to null) is instantly undone by the effect re-selecting the
   * candidate's journey.
   */
  const lastResolvedCandidateRef = useRef<string | null>(null);

  const { activeCandidate, activeCandidateId, isMultiCandidate, candidates, setActiveCandidateId } =
    useCandidate();

  // Derive active candidate journey key
  const activeCandidateJourneyKey = useMemo(() => {
    if (!activeCandidate) return undefined;
    return getJourneyKeyForCandidate(activeCandidate.visaCategory || "IR-5", activeCandidate.id);
  }, [activeCandidate]);

  // Derive active journey for labelling and wizard loading
  const activeJourney = useMemo(() => {
    return userJourneys.find((j) => j.id === activeJourneyId) ?? null;
  }, [userJourneys, activeJourneyId]);

  // Deduplicates exact duplicate journey rows while preserving distinct candidate journeys
  // (e.g. multiple beneficiaries under IR-5), then filters out orphaned journey rows that
  // have no matching candidate in the roster. This ensures the vault card count always
  // matches the actual number of candidate profiles (Issue 2 fix).
  const dedupedUserJourneys = useMemo(() => {
    const deduped = dedupeJourneysByType(userJourneys);

    // When there are candidates, filter journeys to only those with a matching candidate
    // profile. This prevents orphaned DB journey rows from showing extra vault cards.
    if (candidates && candidates.length > 0) {
      return deduped.filter((j) => {
        // Always keep journeys that have a candidate match
        const matchedCandidate = getCandidateForJourneyType(j.journey_type, candidates);
        if (matchedCandidate) return true;

        // For single-candidate accounts, keep the primary journey (it maps to candidate-1
        // implicitly even if getCandidateForJourneyType can't resolve it via key matching)
        if (candidates.length === 1) {
          const journeyBase = getBaseVisaCategory(j.journey_type);
          const candidateBase = getBaseVisaCategory(candidates[0].visaCategory);
          return journeyBase === candidateBase;
        }

        return false;
      });
    }

    return deduped;
  }, [userJourneys, candidates]);

  // Candidate switching is category-AGNOSTIC now (decision 2): any account can have multiple
  // candidates/journeys, including IR-1. This flag just means "the active journey is a
  // recognized candidate-capable journey"; the "whose vault" chip below is still additionally
  // gated on isMultiCandidate, so it only appears once there are genuinely 2+ candidates.
  const isCandidateJourney = useMemo(() => {
    if (!activeJourney?.journey_type) return false;
    const base = getBaseVisaCategory(activeJourney.journey_type);
    return ["IR-5", "IR-2", "IR-1", "CR-1"].includes(base);
  }, [activeJourney]);

  const journeyRoadmapHref = useMemo(() => {
    const type = activeJourney?.journey_type?.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (type === "ir5") {
      return ir5journeyHref;
    }
    return ir1journeyHref;
  }, [activeJourney]);

  const wizard = useWizard({
    userId: journeysLoading || !activeJourneyId ? null : user?.id,
    journeyId: activeJourney?.journey_type || undefined,
    candidateId: activeCandidateId,
  });

  // Filter documents based on search query
  const filteredDocumentsByCategory = useMemo(() => {
    if (!config) return {};
    const baseDocs = getDocumentsByCategory(config, true, uploadedDocuments);
    if (!searchQuery.trim()) return baseDocs;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, typeof ALL_DOCUMENTS> = {};

    Object.entries(baseDocs).forEach(([category, docs]) => {
      const filteredDocs = docs.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query) || doc.description?.toLowerCase().includes(query)
      );
      if (filteredDocs.length > 0) {
        filtered[category] = filteredDocs;
      }
    });

    return filtered;
  }, [config, searchQuery, uploadedDocuments]);

  // Calculate stats - must be before any conditional returns
  const stats = useMemo(() => {
    // Only count mandatory documents for progress percentage
    const mandatoryDocs = requiredDocuments.filter((doc) => doc.required);
    const total = mandatoryDocs.length;

    // Uploaded count should include 'NEEDS_ATTENTION' (as they are still valid)
    const uploaded = mandatoryDocs.filter((rd) =>
      uploadedDocuments.some(
        (ud) =>
          ud.documentDefId === rd.id &&
          (ud.status === "UPLOADED" || ud.status === "NEEDS_ATTENTION")
      )
    ).length;

    // A document is missing only if no version exists at all
    const missing = mandatoryDocs.filter(
      (rd) => !uploadedDocuments.some((ud) => ud.documentDefId === rd.id)
    ).length;

    const expiring = uploadedDocuments.filter((d) => d.status === "NEEDS_ATTENTION").length;

    const expired = uploadedDocuments.filter((d) => d.status === "EXPIRED").length;

    return {
      total,
      uploaded,
      missing,
      expiring,
      expired,
      percentComplete: total > 0 ? Math.round((uploaded / total) * 100) : 0,
    };
  }, [uploadedDocuments, requiredDocuments]);
  const documentsByCategory = useMemo(() => {
    return config ? getDocumentsByCategory(config, true, uploadedDocuments) : {};
  }, [config, uploadedDocuments]);

  // Get documents for special filters (required/optional)
  const getFilteredDocumentsForSpecialFilter = useMemo(() => {
    const allDocs = Object.values(documentsByCategory).flat();
    return {
      required: allDocs.filter((doc) => doc.required),
      optional: allDocs.filter((doc) => !doc.required),
    };
  }, [documentsByCategory]);

  const flatFilteredDocuments = useMemo(() => {
    return Object.values(filteredDocumentsByCategory).flat();
  }, [filteredDocumentsByCategory]);

  const selectedDoc = useMemo(() => {
    if (!selectedDocumentDefId) return undefined;

    // First check master static list
    const staticDoc = ALL_DOCUMENTS.find((d) => d.id === selectedDocumentDefId);
    if (staticDoc) return staticDoc;

    // Then check dynamic required documents from store
    return requiredDocuments.find((d) => d.id === selectedDocumentDefId);
  }, [selectedDocumentDefId, requiredDocuments]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(
        `/login?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`
      );
      return;
    }

    if (user && !initialized) {
      setIsInitializing(true);
      initialize(user.id, t)
        .then(() => {
          setInitialized(true);
          setIsInitializing(false);
        })
        .catch(() => {
          setIsInitializing(false);
          // If vault init fails, release the journey loading lock too
          setJourneysLoading(false);
          setJourneyGateReady(true);
        });
    }
  }, [user, authLoading, router, initialized, initialize, t]);

  // ── Fetch user journeys & evaluate gate cases ─────────────────────────────
  useEffect(() => {
    // Guard: only run once per mount. Prevents re-firing when useAuth() creates
    // a new `user` object reference, which would set journeysLoading=true again.
    if (!user?.id || !initialized) return;
    if (journeyGateEvaluated.current) return;
    journeyGateEvaluated.current = true;

    async function evaluateJourneyGate() {
      setJourneysLoading(true);
      try {
        const res = await fetch("/api/journeys");
        if (!res.ok) throw new Error("Failed to fetch journeys");
        const data = await res.json();
        // data.data is an array of { journey, ... } objects from journeyService.getAllJourneysWithProgress()
        const journeys: Journey[] = (data.data ?? []).map((item: any) => item.journey ?? item);
        setUserJourneys(journeys);
        setCachedUserJourneys(journeys);

        // Deduplicate exact duplicate journey rows while keeping distinct candidate journeys
        // so multiple beneficiaries under the same category each get their own vault card.
        const distinctJourneys = dedupeJourneysByType(journeys);

        if (journeys.length === 0) {
          // ── Case 1: No journey at all ──────────────────────────────────
          setNoJourneyModalOpen(true);
          setActiveJourneyId(null);
          setJourneyGateReady(true);
        } else if (distinctJourneys.length === 1) {
          // ── Case 2: Exactly one journey — auto-select it ───────────────
          setActiveJourneyId(distinctJourneys[0].id);
          setJourneyGateReady(true);
        } else {
          // ── Case 3: Multiple journeys (different categories or candidates) ──
          const saved = typeof window !== "undefined" ? sessionStorage.getItem(SESSION_KEY) : null;
          if (saved && journeys.some((j) => j.id === saved)) {
            setActiveJourneyId(saved);
          }
          setJourneyGateReady(true);
        }
      } catch (err) {
        console.error("[DocumentVault] Journey gate error:", err);
        // Strict journey dependency: if loading fails, block access
        setNoJourneyModalOpen(true);
        setActiveJourneyId(null);
        setJourneyGateReady(true);
      } finally {
        setJourneysLoading(false);
      }
    }

    evaluateJourneyGate();
  }, [user?.id, initialized]); // use user?.id (primitive) not user object to avoid ref-instability re-runs

  // ── Auto-configure vault based on active journey ──────────────────────────
  const { setConfig: setVaultConfig } = useDocumentVaultStore();
  useEffect(() => {
    if (!activeJourneyId || !journeyGateReady || !user) return;
    const activeJourney = userJourneys.find((j) => j.id === activeJourneyId);
    // Canonicalize the category to the exact form the document engine matches on ("IR-1",
    // "IR-5", ...). A raw candidate value like "IR1"/"ir-1" would fail the engine's exact
    // `applicableVisas.includes(...)` check and collapse the required list to zero docs, so
    // both the journey type AND the candidate fallback go through journeyTypeToVisaCategory.
    const visaCategory =
      (activeJourney ? journeyTypeToVisaCategory(activeJourney.journey_type) : null) ||
      (activeCandidate?.visaCategory
        ? journeyTypeToVisaCategory(activeCandidate.visaCategory)
        : null) ||
      "IR-5";

    // Retrieve questionnaire answers from journey metadata if available
    const metadata = (wizard.state?.backendId === activeJourneyId ? wizard.state?.metadata : {}) || {};
    const hasQuestionnaire = metadata.docQuestionnaireCompleted === true;
    const questionnaireAnswers = (metadata.docQuestionnaireAnswers as Record<string, string>) || {};

    // Map questionnaire answers to vault scenario flags
    const mappedFlags: ScenarioFlags = {
      ...config?.scenarioFlags,
      ...(hasQuestionnaire ? syncQuestionnaireAnswersToFlags(questionnaireAnswers) : {}),
    };

    // Integrate Step 2.6 (Financial Checklist) and Step 2.7 (Household builder/calculator) data
    let jsCount = Number(metadata.jsCount || 0);
    let hhCount = Number(metadata.hhCount || 0);
    const sponsorshipResult = metadata.sponsorshipResult as any;
    const journeyScenario = metadata.selectedScenario as string;

    // Derive counts from selectedScenario if not set by Household Builder
    if (journeyScenario === "pet-js1") {
      jsCount = Math.max(jsCount, 1);
    } else if (journeyScenario === "pet-js2") {
      jsCount = Math.max(jsCount, 2);
    } else if (journeyScenario === "pet-hm") {
      hhCount = Math.max(hhCount, 1);
    } else if (journeyScenario === "pet-hm-js") {
      jsCount = Math.max(jsCount, 1);
      hhCount = Math.max(hhCount, 1);
    } else if (sponsorshipResult) {
      if (sponsorshipResult.jointSponsorCount) {
        jsCount = Math.max(jsCount, sponsorshipResult.jointSponsorCount);
      }
      if (sponsorshipResult.needsHouseholdMember) {
        hhCount = Math.max(hhCount, 1);
      }
    }

    const hasJointSponsorFromJourney =
      jsCount > 0 ||
      sponsorshipResult?.jointSponsorCount > 0 ||
      sponsorshipResult?.needsJointSponsor === true ||
      ["pet-js1", "pet-js2", "pet-hm-js"].includes(journeyScenario);

    mappedFlags.joint_sponsor_used =
      hasJointSponsorFromJourney ||
      questionnaireAnswers.joint_sponsor === "yes" ||
      questionnaireAnswers.joint_sponsor === "unsure";

    const hasHouseholdMemberFromJourney =
      hhCount > 0 ||
      sponsorshipResult?.needsHouseholdMember === true ||
      ["pet-hm", "pet-hm-js"].includes(journeyScenario);

    mappedFlags.household_member_used = hasHouseholdMemberFromJourney;
    mappedFlags.jsCount = jsCount;
    mappedFlags.hhCount = hhCount;
    mappedFlags.hhRelationships = metadata.hhRelationships || {};

    const beneficiaryDisplayName =
      activeCandidate?.fullName ||
      (metadata.beneficiaryName as string) ||
      activeCandidate?.label ||
      "Beneficiary";

    if (!config) {
      // No vault config saved yet for this user — create a minimal one immediately
      // from the journey's visa category so the document checklist renders immediately.
      setVaultConfig({
        userId: user.id,
        journeyId: activeJourneyId,
        beneficiaryName: beneficiaryDisplayName,
        visaCategory,
        scenarioFlags: mappedFlags,
      });
    } else if (
      config.visaCategory !== visaCategory ||
      config.journeyId !== activeJourneyId ||
      config.beneficiaryName !== beneficiaryDisplayName ||
      JSON.stringify(config.scenarioFlags) !== JSON.stringify(mappedFlags)
    ) {
      // Config exists but points to a different visa category, journey, or flags have changed — update it.
      setVaultConfig({
        ...config,
        journeyId: activeJourneyId,
        beneficiaryName: beneficiaryDisplayName,
        visaCategory,
        scenarioFlags: {
          ...config.scenarioFlags,
          ...mappedFlags,
        },
      });
    }
  }, [
    activeJourneyId,
    journeyGateReady,
    userJourneys,
    config,
    setVaultConfig,
    user,
    wizard.isLoaded,
    wizard.state?.metadata,
    wizard.state?.backendId,
    activeCandidate,
  ]);

  // ── Synchronize active journey with active candidate profile ─────────────
  useEffect(() => {
    if (!userJourneys || userJourneys.length === 0 || !activeCandidate) return;

    // Only react to an actual CANDIDATE change. Without this guard, clicking
    // "Back to Journeys" (which sets activeJourneyId to null) would be instantly
    // reverted here, and picking a different journey folder would bounce back.
    if (activeCandidateId === lastResolvedCandidateRef.current) return;

    const visaCategory = activeCandidate.visaCategory || "IR-5";
    const candidateJourneyKey = getJourneyKeyForCandidate(visaCategory, activeCandidate.id);
    const normCandidateKey = candidateJourneyKey.toLowerCase().replace(/[-:_]/g, "");
    const normBaseKey = visaCategory.toLowerCase().replace(/[-:_]/g, "");

    const matched = userJourneys.find((j) => {
      // Never match a journey from a different visa category. Without this, the primary
      // candidate's loose fallback below would wrongly grab an unrelated journey (e.g. an
      // IR-1 journey), making Mother's IR-5 vault show "IR-1". Normalize both sides so
      // "IR-5" / "IR5" / "ir-5" all compare equal.
      if (getBaseVisaCategory(j.journey_type) !== getBaseVisaCategory(visaCategory)) return false;

      const normJ = j.journey_type.toLowerCase().replace(/[-:_]/g, "");
      if (activeCandidate.isPrimary) {
        // The primary candidate owns the base journey (e.g. "ir5"), which is never
        // candidate-scoped. Any journey_type containing "candidate" belongs to a sibling
        // (candidate-2, candidate-3, ... candidate-N), so exclude all of them regardless of
        // number - hardcoding candidate2/3/4 leaked a 5th+ candidate's journey to the primary.
        return (
          normJ === normBaseKey ||
          normJ === normCandidateKey ||
          !normJ.includes("candidate")
        );
      }
      return normJ === normCandidateKey || (normJ.includes(normCandidateKey) && !normJ.includes("candidate1"));
    });

    // Only mark this candidate resolved once we actually found a journey for it, so a
    // late-arriving journey (e.g. a freshly created 2nd-parent journey) is still picked up.
    if (matched) {
      lastResolvedCandidateRef.current = activeCandidateId;
      if (matched.id !== activeJourneyId) {
        setActiveJourneyId(matched.id);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(SESSION_KEY, matched.id);
        }
      }
    } else if (wizard.state.backendId) {
      // No journey for this candidate is in userJourneys yet (e.g. a freshly added parent
      // whose journey row is still being created). Fall back to the candidate-scoped
      // wizard's backendId, but do NOT pin lastResolvedCandidateRef here: pinning froze the
      // candidate on whatever backendId existed at switch time (often the PREVIOUS
      // candidate's journey), permanently blocking the correct journey from being adopted
      // once it appears. Leaving it unpinned lets this effect re-run as wizard.state.backendId
      // converges to this candidate's journey and, later, as userJourneys gains the real row.
      if (wizard.state.backendId !== activeJourneyId) {
        setActiveJourneyId(wizard.state.backendId);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(SESSION_KEY, wizard.state.backendId);
        }
      }
    }
  }, [activeCandidateId, activeCandidate, userJourneys, activeJourneyId, wizard.state.backendId]);

  // ── Case 3 picker confirmation handler ────────────────────────────────────
  const handlePickJourney = useCallback((journeyId: string) => {
    setActiveJourneyId(journeyId);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, journeyId);
    }
    setJourneyGateReady(true);
  }, []);

  // Reset tab and search query when active journey changes
  useEffect(() => {
    setActiveTab("required");
    setSearchQuery("");
    if (initialized && activeJourneyId) {
      reloadDocuments(activeJourneyId);
    }
  }, [activeJourneyId, initialized, reloadDocuments]);

  const isEligibilityDone = wizard.state?.completedSteps?.has("step_1_1");
  const isPersonalizationDone = wizard.state?.metadata?.docQuestionnaireCompleted === true;

  useEffect(() => {
    if (
      initialized &&
      wizard.isLoaded &&
      !hasShownWelcome &&
      journeyGateReady &&
      !noJourneyModalOpen
    ) {
      // Safety check: ensure wizard has loaded the active journey
      if (wizard.state.backendId !== activeJourneyId) return;

      if (!isEligibilityDone || !isPersonalizationDone) {
        setWelcomeModalOpen(true);
        setHasShownWelcome(true);
      }
    }
  }, [
    initialized,
    wizard.isLoaded,
    isEligibilityDone,
    isPersonalizationDone,
    wizard.state?.backendId,
    activeJourneyId,
    hasShownWelcome,
    journeyGateReady,
    noJourneyModalOpen,
  ]);

  useEffect(() => {
    // Check if config exists after initialization
    if (initialized && !config) {
      setShowConfigWizard(true);
    }
  }, [initialized, config]);

  useEffect(() => {
    // Initial data refresh on mount/config change
    if (config) {
      refreshDocumentStatuses();
      refreshNotifications(t);
    }
  }, [config, t, refreshDocumentStatuses, refreshNotifications]);

  useEffect(() => {
    // Periodic refresh (stable interval)
    if (config) {
      const interval = setInterval(() => {
        refreshDocumentStatuses();
        refreshNotifications(t);
      }, 60000); // Every minute

      return () => clearInterval(interval);
    }
  }, [config, t, refreshDocumentStatuses, refreshNotifications]);

  // Categories for tabs
  const categories = useMemo(() => {
    const cats = Object.keys(filteredDocumentsByCategory).sort();
    return ["all", "required", "optional", ...cats];
  }, [filteredDocumentsByCategory]);

  if (authLoading || isInitializing || journeysLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader size="md" />
      </div>
    );
  }

  if (!user) return null;

  // activeJourney is already derived at the top

  // if ((!config && initialized) || showConfigWizard) {
  //   return (
  //     <ConfigurationWizard
  //       userId={user.id}
  //       onComplete={() => {
  //         setShowConfigWizard(false);
  //         setInitialized(false); // Reset to trigger re-initialization
  //       }}
  //     />
  //   );
  // }

  const handleDownload = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`);
      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        response.headers.get("content-disposition")?.split("filename=")[1]?.replace(/"/g, "") ||
        "document";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast(t("documentVaultPage.page.messages.downloaded"), "success");
    } catch (error) {
      console.error("Download error:", error);
      showToast(t("documentVaultPage.page.messages.downloadFailed"), "error");
    }
  };

  const handleExportSingle = async (documentId: string, hasCompressed: boolean) => {
    try {
      showToast(
        hasCompressed
          ? t("documentVaultPage.page.messages.preparingZip")
          : t("documentVaultPage.page.messages.preparingExport"),
        "info"
      );
      const response = await fetch(`/api/documents/${documentId}/export`);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Get filename from Content-Disposition header
      const disposition = response.headers.get("content-disposition");
      const filenameMatch = disposition?.match(/filename="(.+?)"/);
      a.download = filenameMatch ? filenameMatch[1] : "document-export";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast(
        hasCompressed
          ? t("documentVaultPage.page.messages.zipExported")
          : t("documentVaultPage.page.messages.documentExported"),
        "success"
      );
    } catch (error) {
      console.error("Export error:", error);
      showToast(t("documentVaultPage.page.messages.exportFailed"), "error");
    }
  };

  const handleDelete = (documentId: string) => {
    setSelectedDeleteId(documentId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDeleteId) return;

    try {
      setDeleteLoading(true);

      showToast(t("documentVaultPage.page.messages.deleting"), "loading", {
        id: "delete-doc",
      });

      // Optimistic store delete: removes the row from state and refreshes statuses/
      // notifications in place. Avoids the old full initialize(user.id) re-fetch, which
      // reset the whole vault and felt like a page refresh.
      await deleteDocument(selectedDeleteId);

      showToast(t("documentVaultPage.page.messages.deleted"), "success", {
        id: "delete-doc",
      });

      setDeleteModalOpen(false);
      setSelectedDeleteId(null);
    } catch (error) {
      console.error("Delete error:", error);
      showToast(t("documentVaultPage.page.messages.deleteFailed"), "error", {
        id: "delete-doc",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteSlot = (category: string, slotId: string) => {
    setSlotToDelete({ category, id: slotId });
    setDeleteSlotModalOpen(true);
  };

  const confirmDeleteSlot = async () => {
    if (!slotToDelete) return;
    try {
      setDeleteLoading(true);
      showToast("Deleting document slot...", "loading", {
        id: "delete-slot",
      });
      await deleteDynamicSlot(slotToDelete.category, slotToDelete.id);
      showToast("Document slot deleted successfully", "success", {
        id: "delete-slot",
      });
      setDeleteSlotModalOpen(false);
      setSlotToDelete(null);
    } catch (error) {
      console.error("Delete slot error:", error);
      showToast("Failed to delete document slot", "error", {
        id: "delete-slot",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePreview = (uploadedDoc: UploadedDocument) => {
    setPreviewDoc(uploadedDoc);
    setPreviewOpen(true);
  };

  // const handleExport = async () => {
  //   try {
  //     showToast(t("documentVaultPage.page.messages.preparingExport"), "info");
  //     const response = await fetch("/api/documents/export?structureByCategory=true");

  //     if (!response.ok) {
  //       throw new Error("Export failed");
  //     }

  //     const blob = await response.blob();
  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = `document-vault-export-${new Date().toISOString().split("T")[0]}.zip`;
  //     document.body.appendChild(a);
  //     a.click();
  //     window.URL.revokeObjectURL(url);
  //     document.body.removeChild(a);

  //     showToast(t("documentVaultPage.page.messages.exportCompleted"), "success");
  //   } catch (error) {
  //     console.error("Export error:", error);
  //     showToast(t("documentVaultPage.page.messages.exportAllFailed"), "error");
  //   }
  // };

  // const handleDeleteAll = async () => {
  //   if (!confirm(t("documentVaultPage.page.messages.deleteAllConfirmWarning"))) {
  //     return;
  //   }

  //   if (!confirm(t("documentVaultPage.page.messages.deleteAllFinalConfirm"))) {
  //     return;
  //   }

  //   try {
  //     showToast(t("documentVaultPage.page.messages.deletingAll"), "loading", {
  //       id: "delete-all",
  //     });

  //     // Get all uploaded document IDs
  //     const documentIds = uploadedDocuments.map((doc) => doc.id);

  //     // Delete each document
  //     let deleted = 0;
  //     for (const docId of documentIds) {
  //       const response = await fetch(`/api/documents/${docId}`, {
  //         method: "DELETE",
  //       });

  //       if (response.ok) {
  //         deleted++;
  //       }
  //     }

  //     showToast(
  //       t("documentVaultPage.page.messages.deletedAllSuccess").replace(
  //         "{{count}}",
  //         deleted.toString()
  //       ),
  //       "success",
  //       {
  //         id: "delete-all",
  //       }
  //     );

  //     // Reload data
  //     if (user) {
  //       await initialize(user.id, t);
  //     }
  //   } catch (error) {
  //     console.error("Delete all error:", error);
  //     showToast(t("documentVaultPage.page.messages.deleteAllFailed"), "error", {
  //       id: "delete-all",
  //     });
  //   }
  // };

  if (journeysLoading || !journeyGateReady) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-55px)] bg-slate-50/50 dark:bg-slate-950/50 mt-[55px]">
        <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
          <Loader size="lg" className="text-primary mb-4" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Loading Document Vault...
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Verifying your active immigration journey
          </p>
        </div>
      </div>
    );
  }

  if (noJourneyModalOpen || (journeyGateReady && userJourneys.length === 0)) {
    return (
      <div
        className="relative mt-13.75 flex min-h-[calc(100vh-55px)] items-center justify-center overflow-hidden p-6 transition-all duration-500 selection:bg-amber-500/20"
        style={{
          backgroundImage: "url('/assets/images/vault-bg-v6.png')",
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Subtle dark/light overlay for optimal background contrast & readability */}
        <div className="pointer-events-none absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] dark:bg-slate-950/40" />

        {/* Main Journey Required Card */}
        <Card className="relative z-10 w-[95%] max-w-md overflow-hidden rounded-3xl border border-slate-200/50 bg-white/95 p-0 shadow-2xl backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/95">
          <div className="relative flex flex-col items-center p-8 text-center">
            {/* Decorative blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
              <div className="bg-primary/10 absolute -bottom-20 -left-20 h-56 w-56 rounded-full blur-3xl" />
            </div>

            {/* Icon */}
            <div className="relative z-10 mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100 shadow-inner dark:bg-amber-900/40">
              <Compass className="h-10 w-10 text-amber-600 dark:text-amber-400" />
            </div>

            {/* Text */}
            <h3 className="relative z-10 mb-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Journey Required
            </h3>
            <p className="relative z-10 mb-2 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
              The{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200">Document Vault</span>{" "}
              is strictly associated with an active immigration journey. Users cannot purchase or access the Document Vault independently as a standalone feature.
            </p>
            <p className="relative z-10 mb-8 text-sm leading-relaxed text-slate-500 dark:text-slate-500">
              You don&apos;t have an active immigration journey yet. Please start a journey first,
              then your Document Vault will be automatically set up for you.
            </p>

            {/* Actions */}
            <div className="relative z-10 w-full space-y-3">
              <Link href="/visa-category/ir1-journey">
                {/* <Link href="/visa-category"> */}
                <Button className="bg-primary hover:bg-primary/90 shadow-primary/20 h-14 w-full rounded-2xl text-base font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95">
                  <Route className="mr-2 h-5 w-5" />
                  Browse Visa Journey
                </Button>
              </Link>
              <p className="pt-3 text-xs text-slate-400 dark:text-slate-500">
                Once you start a journey, come back here to access your personalized Document Vault.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (dedupedUserJourneys.length > 1 && !activeJourneyId) {
    return (
      <div className="mt-[55px] min-h-[calc(100vh-55px)] bg-slate-50/50 px-6 py-12 dark:bg-slate-950/50">
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h1 className="mb-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Your Document Vaults
            </h1>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              You have multiple immigration journeys. Select a journey below to open its
              personalized document vault and manage your checklist.
            </p>
          </div>

          {/* Grid of Folders / Journey Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {userJourneys.map((journey) => {
              const visaCategory = journeyTypeToVisaCategory(journey.journey_type);
              const isActive = journey.status === "in_progress";
              const candidateName = getCandidateDisplayNameForJourney(journey.journey_type, candidates);

              // Determine card image and description for better visualization
              let cardImage = "";
              let cardDesc = "Manage your visa application documents, checklist, and requirements.";

              if (visaCategory) {
                const cleanCategory = visaCategory.toUpperCase().replace(/[^A-Z0-9]/g, "");
                if (cleanCategory === "IR1") {
                  cardImage = "/assets/images/ir1-doc-vault-image.jpg";
                  cardDesc =
                    "Spouse of a U.S. Citizen Visa Document Vault. Keep track of marriage certificates, petitioner details, and sponsorship documents.";
                } else if (cleanCategory === "IR5") {
                  cardImage = "/assets/images/ir5-doc-vault-image.png";
                  cardDesc =
                    "Parent of a U.S. Citizen Visa Document Vault. Keep track of birth certificates, proof of relationship, and financial sponsor files.";
                }
              }

              return (
                <button
                  key={journey.id}
                  onClick={() => handlePickJourney(journey.id)}
                  className="hover:border-primary/40 group focus:ring-primary/20 flex w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:ring-2 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                >
                  {/* Card Image Banner */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
                    <Image
                      src={cardImage}
                      alt={journey.journey_name || journey.journey_type}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent" />

                    {/* Floating Badges */}
                    <div className="pointer-events-none absolute top-4 right-4 left-4 flex items-center justify-between">
                      {visaCategory ? (
                        <Badge
                          variant="secondary"
                          className="pointer-events-auto border-white/10 bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-900 shadow-sm backdrop-blur-sm"
                        >
                          {visaCategory}
                        </Badge>
                      ) : (
                        <div />
                      )}
                      {isActive && (
                        <Badge className="pointer-events-auto border-none bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      {/* Journey Details */}
                      <h3 className="group-hover:text-primary mb-2 line-clamp-1 text-lg font-bold text-slate-900 transition-colors dark:text-white">
                        {getFriendlyJourneyName(journey.journey_type, journey.journey_name)}
                      </h3>
                      <p className="mb-6 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {cardDesc}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="flex w-full items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800/60">
                      <span className="text-xs font-medium text-slate-400 capitalize dark:text-slate-500">
                        Status: {journey.status.replace("_", " ")}
                      </span>
                      <div className="text-primary group-hover:text-primary/80 inline-flex items-center text-xs font-bold transition-colors">
                        <span>Open Vault</span>
                        <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="mt-[55px] flex min-h-[calc(100vh-55px)] flex-col bg-slate-50/50 dark:bg-slate-950/50">
        {isReloadingDocs ? (
          <div className="flex min-h-[400px] flex-1 flex-col items-center justify-center px-4 py-20">
            <div className="animate-in fade-in flex flex-col items-center justify-center px-8 py-20 duration-300 dark:bg-slate-900">
              <Loader size="md" className="text-primary mb-4" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Loading Documents...
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Securing database connection
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Top Professional Header */}
            <div className="sticky top-0 z-30 border-b bg-white shadow-sm dark:bg-slate-900">
              <div className="site-main-px py-4">
                <div className="flex flex-row items-start justify-between gap-4 md:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    {userJourneys.length > 1 && activeJourneyId ? (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setActiveJourneyId(null);
                          sessionStorage.removeItem(SESSION_KEY);
                        }}
                        className="animate-in fade-in slide-in-from-left-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 p-0 text-slate-600 transition-all duration-200 duration-300 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        title="Back to Journeys"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                    ) : (
                      <div className="bg-primary/10 text-primary hidden h-12 w-12 items-center justify-center rounded-2xl shadow-inner sm:flex">
                        <ShieldCheck className="h-7 w-7" />
                      </div>
                    )}
                    <div>
                      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {t("documentVaultPage.page.title")}
                      </h1>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-primary/5 hover:bg-primary/5 text-primary border-primary/20 px-2.5 py-0.5 font-bold"
                        >
                          {config?.visaCategory
                            ? `${config.visaCategory} Journey`
                            : activeJourney
                              ? getFriendlyJourneyName(
                                  activeJourney.journey_type,
                                  activeJourney.journey_name
                                )
                              : `${activeCandidate?.visaCategory || "IR-5"} Journey`}
                        </Badge>
                        <span className="text-xs font-medium text-slate-500">
                          {t("documentVaultPage.page.subtitle")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <NotificationBell />
                  </div>
                </div>
              </div>
            </div>

            <div className="container mx-auto max-w-450 p-6">
              {/* Main Grid Layout */}
              <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                {/* Left Side: Stats & Configuration */}
                <div className="space-y-6 lg:sticky lg:top-24 lg:col-span-3">
                  {/* Professional Stats Card */}
                  <Card className="from-primary via-primary/95 to-primary/90 overflow-hidden border-none bg-linear-to-br p-0 text-white shadow-xl">
                    <div className="p-6">
                      <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                            <Zap className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-bold tracking-tight uppercase opacity-80">
                            {t("documentVaultPage.page.syncProgress")}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-white/30 bg-white/10 font-bold text-white backdrop-blur-sm"
                        >
                          {stats.percentComplete}%
                        </Badge>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="mb-1 flex justify-between text-2xl font-black">
                            <span>
                              {stats.uploaded} / {stats.total}
                            </span>
                            <span className="mb-1 self-end text-sm font-medium text-white/60">
                              {t("documentVaultPage.page.itemsReady")}
                            </span>
                          </div>
                          <Progress
                            value={stats.percentComplete}
                            className="h-3 bg-white/20"
                            indicatorClassName="bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                            <p className="mb-1 text-[10px] font-bold tracking-widest text-white/60 uppercase">
                              {t("documentVaultPage.page.criticalMissing")}
                            </p>
                            <p
                              className={`text-xl font-black ${stats.missing > 0 ? "text-white" : "text-emerald-300"}`}
                            >
                              {stats.missing}
                            </p>
                          </div>
                          <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                            <p className="mb-1 text-[10px] font-bold tracking-widest text-white/60 uppercase">
                              {t("documentVaultPage.page.alertsExpiring")}
                            </p>
                            <p
                              className={`text-xl font-black ${stats.expiring > 0 ? "text-amber-300" : "text-white"}`}
                            >
                              {stats.expiring + stats.expired}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-black/10 px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-300" />
                        <span className="text-[11px] font-semibold opacity-90">
                          {t("documentVaultPage.page.bankGradeEncryption")}
                        </span>
                      </div>
                      <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></div>
                    </div>
                  </Card>

                  {/* Config Panel */}
                  {/* <div className="mb-4">
              <LiveConfigPanel />
            </div> */}

                  {/* Mini Tips Card */}
                  <Card className="border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-900 dark:bg-amber-950/30">
                    <div className="flex gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <div>
                        <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100">
                          {t("documentVaultPage.page.nvcTipTitle")}
                        </h4>
                        <p className="mt-1 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                          {t("documentVaultPage.page.nvcTipDesc")}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Right Side: Document Management Tabs */}
                <div className="lg:col-span-9">
                  <Tabs defaultValue="required" className="w-full" onValueChange={setActiveTab}>
                    <div className="mb-6 flex flex-col justify-between gap-4 xl:mb-8 xl:flex-row xl:items-center xl:gap-6">
                      <div className="flex w-full flex-col gap-4 overflow-hidden sm:flex-row sm:items-center xl:w-auto">
                        <div className="no-scrollbar -mb-2 w-full overflow-x-auto pb-2 sm:mb-0 sm:w-auto sm:pb-0">
                          <TabsList className="inline-flex h-11 min-w-max shrink-0 rounded-xl border bg-white p-1 shadow-sm dark:bg-slate-900">
                            {categories.slice(0, 5).map((cat) => (
                              <TabsTrigger
                                key={cat}
                                value={cat}
                                className="data-[state=active]:bg-primary rounded-lg px-4 text-xs font-bold transition-all duration-300 data-[state=active]:text-white sm:px-6"
                              >
                                {cat === "all"
                                  ? t("documentVaultPage.page.allMasterChecklist")
                                  : cat === "required"
                                    ? "Required"
                                    : cat === "optional"
                                      ? "Optional"
                                      : getCategoryDisplayName(cat, t)}
                              </TabsTrigger>
                            ))}
                            {categories.length > 5 && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 gap-1 rounded-lg px-3 text-xs font-bold"
                                  >
                                    {t("documentVaultPage.page.more")}{" "}
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {categories.slice(5).map((cat) => (
                                    <DropdownMenuItem key={cat} onClick={() => setActiveTab(cat)}>
                                      {cat === "optional"
                                        ? "Optional"
                                        : getCategoryDisplayName(cat, t)}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TabsList>
                        </div>

                        {/* Move View Switcher here next to tabs */}
                        <div className="flex h-11 shrink-0 self-start rounded-xl border bg-white p-1 shadow-sm sm:self-auto dark:bg-slate-900">
                          <Button
                            variant={viewMode === "table" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("table")}
                            className={`h-9 rounded-lg px-3 ${viewMode === "table" ? "bg-slate-100 shadow-inner dark:bg-slate-800" : ""}`}
                          >
                            <List className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={viewMode === "grid" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className={`h-9 rounded-lg px-3 ${viewMode === "grid" ? "bg-slate-100 shadow-inner dark:bg-slate-800" : ""}`}
                          >
                            <LayoutGrid className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="ml-0 flex w-full xl:ml-auto xl:max-w-md">
                        <div className="relative flex-1">
                          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            placeholder={t("documentVaultPage.page.searchPlaceholder")}
                            className="focus:ring-primary/20 h-11 w-full rounded-xl border-slate-200 bg-white pl-10 dark:border-slate-800 dark:bg-slate-900"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery("")}
                              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <CloseIcon className="h-3 w-3 text-slate-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mb-6 xl:mb-8">
                      <h2 className="flex flex-wrap items-center gap-2 text-xl font-black tracking-tight text-slate-900 sm:gap-3 sm:text-2xl dark:text-white">
                        {activeTab === "all"
                          ? t("documentVaultPage.page.comprehensiveMasterChecklist")
                          : activeTab === "required"
                            ? "Required Documents"
                            : activeTab === "optional"
                              ? "Optional Documents"
                              : getCategoryDisplayName(activeTab, t)}
                        {searchQuery && (
                          <Badge
                            variant="outline"
                            className="text-primary border-primary/20 bg-primary/5 font-bold"
                          >
                            {t("documentVaultPage.page.foundPrefix")} {flatFilteredDocuments.length}{" "}
                            {t("documentVaultPage.page.matchingDocuments")}
                          </Badge>
                        )}
                        {DYNAMIC_CATEGORIES.includes(activeTab) && (
                          <div className="flex items-center gap-2">
                            {CATEGORY_SUGGESTIONS[activeTab] &&
                              CATEGORY_SUGGESTIONS[activeTab].length > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="hover:text-primary h-8 w-8 p-0 text-slate-400"
                                    >
                                      <Info className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-xs p-3">
                                    <p className="mb-2 font-bold">Suggested Documents:</p>
                                    <ul className="list-disc space-y-1 pl-4 text-xs">
                                      {CATEGORY_SUGGESTIONS[activeTab]?.map((suggestion, i) => (
                                        <li key={i}>{suggestion}</li>
                                      ))}
                                    </ul>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => addDynamicSlot(activeTab)}
                              className="text-primary hover:bg-primary/10 h-8 gap-1 px-2 font-bold"
                            >
                              <Plus className="h-4 w-4" />
                              Add New
                            </Button>
                          </div>
                        )}
                      </h2>
                    </div>

                    <TabsContent
                      value={activeTab}
                      className="mt-0 ring-offset-0 focus-visible:ring-0"
                    >
                      <PageGate
                        feature="document_vault"
                        planTier={activeJourney?.subscription_tier ?? null}
                        title="Document Vault Locked"
                        description="Upgrade your plan to organize, track, and securely store your required immigration documents."
                      >
                        <div className="space-y-6 sm:space-y-10">
                          {searchQuery ? (
                            // Show flat list of search results when searching
                            <div className="space-y-6">
                              <div className="flex items-center gap-3">
                                <div className="bg-primary h-1 w-8 shrink-0 rounded-full sm:w-12"></div>
                                <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase sm:text-sm">
                                  {t("documentVaultPage.page.foundPrefix")}{" "}
                                  {flatFilteredDocuments.length}{" "}
                                  {t("documentVaultPage.page.matchingDocuments")}
                                </h3>
                              </div>

                              {flatFilteredDocuments.length > 0 ? (
                                viewMode === "grid" ? (
                                  <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                                    {flatFilteredDocuments.map((doc) => {
                                      const docUploads = uploadedDocuments.filter(
                                        (ud) => ud.documentDefId === doc.id
                                      );
                                      const uploadedDoc =
                                        docUploads.length > 0
                                          ? [...docUploads].sort(
                                              (a, b) =>
                                                new Date(b.uploadedAt).getTime() -
                                                new Date(a.uploadedAt).getTime()
                                            )[0]
                                          : undefined;
                                      return (
                                        <DocumentCard
                                          key={doc.id}
                                          documentDef={doc}
                                          uploadedDoc={uploadedDoc}
                                          onUpload={(replaceId) =>
                                            openUploadModal(doc.id, replaceId)
                                          }
                                          onPreview={
                                            uploadedDoc
                                              ? () => handlePreview(uploadedDoc)
                                              : undefined
                                          }
                                          onDownload={
                                            uploadedDoc
                                              ? () => handleDownload(uploadedDoc.id)
                                              : undefined
                                          }
                                          onDelete={
                                            uploadedDoc
                                              ? () => handleDelete(uploadedDoc.id)
                                              : undefined
                                          }
                                          onExport={
                                            uploadedDoc
                                              ? () =>
                                                  handleExportSingle(
                                                    uploadedDoc.id,
                                                    uploadedDoc.hasCompressedVersion || false
                                                  )
                                              : undefined
                                          }
                                          onOpenWizard={() => openWizard(doc.id)}
                                          onRename={(newName) =>
                                            renameDynamicSlot(doc.category, doc.id, newName)
                                          }
                                          onDeleteSlot={() =>
                                            handleDeleteSlot(doc.category, doc.id)
                                          }
                                        />
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <DocumentTableView
                                    documents={flatFilteredDocuments}
                                    uploadedDocuments={uploadedDocuments}
                                    onUpload={openUploadModal}
                                    onPreview={handlePreview}
                                    onDownload={handleDownload}
                                    onDelete={handleDelete}
                                    onExport={handleExportSingle}
                                    onOpenWizard={openWizard}
                                    onRename={renameDynamicSlot}
                                    onDeleteSlot={handleDeleteSlot}
                                  />
                                )
                              ) : (
                                <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white px-4 py-12 text-center sm:py-20 dark:border-slate-800 dark:bg-slate-900">
                                  <Search className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {t("documentVaultPage.page.noDocumentsFound")}
                                  </h3>
                                  <p className="mx-auto mt-2 max-w-xs text-slate-500">
                                    {t("documentVaultPage.page.noDocumentsDescPrefix")}
                                    {searchQuery}
                                    {t("documentVaultPage.page.noDocumentsDescSuffix")}
                                  </p>
                                  <Button
                                    variant="link"
                                    className="text-primary mt-4 font-bold"
                                    onClick={() => setSearchQuery("")}
                                  >
                                    {t("documentVaultPage.page.clearSearch")}
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : activeTab === "all" ? (
                            // Show all categories in 'all' tab when NOT searching
                            Object.entries(documentsByCategory).map(([category, docs]) => (
                              <div key={category} className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className="bg-primary h-1 w-8 shrink-0 rounded-full sm:w-12"></div>
                                  <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase sm:text-sm">
                                    {getCategoryDisplayName(category, t)}
                                  </h3>
                                  {DYNAMIC_CATEGORIES.includes(category) && (
                                    <div className="flex items-center gap-2">
                                      {CATEGORY_SUGGESTIONS[category] &&
                                        CATEGORY_SUGGESTIONS[category].length > 0 && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="hover:text-primary h-6 w-6 p-0 text-slate-400"
                                              >
                                                <Info className="h-3.5 w-3.5" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="right" className="max-w-xs p-3">
                                              <p className="mb-2 text-[11px] font-bold">
                                                Suggested Documents:
                                              </p>
                                              <ul className="list-disc space-y-1 pl-4 text-[10px]">
                                                {CATEGORY_SUGGESTIONS[category]?.map(
                                                  (suggestion, i) => (
                                                    <li key={i}>{suggestion}</li>
                                                  )
                                                )}
                                              </ul>
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => addDynamicSlot(category)}
                                        className="text-primary hover:bg-primary/10 h-7 gap-1 px-2 text-[10px] font-bold"
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                        Add
                                      </Button>
                                    </div>
                                  )}
                                </div>

                                {viewMode === "grid" ? (
                                  <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                                    {docs.map((doc) => {
                                      const docUploads = uploadedDocuments.filter(
                                        (ud) => ud.documentDefId === doc.id
                                      );
                                      const uploadedDoc =
                                        docUploads.length > 0
                                          ? [...docUploads].sort(
                                              (a, b) =>
                                                new Date(b.uploadedAt).getTime() -
                                                new Date(a.uploadedAt).getTime()
                                            )[0]
                                          : undefined;
                                      return (
                                        <DocumentCard
                                          key={doc.id}
                                          documentDef={doc}
                                          uploadedDoc={uploadedDoc}
                                          onUpload={(replaceId) =>
                                            openUploadModal(doc.id, replaceId)
                                          }
                                          onPreview={
                                            uploadedDoc
                                              ? () => handlePreview(uploadedDoc)
                                              : undefined
                                          }
                                          onDownload={
                                            uploadedDoc
                                              ? () => handleDownload(uploadedDoc.id)
                                              : undefined
                                          }
                                          onDelete={
                                            uploadedDoc
                                              ? () => handleDelete(uploadedDoc.id)
                                              : undefined
                                          }
                                          onExport={
                                            uploadedDoc
                                              ? () =>
                                                  handleExportSingle(
                                                    uploadedDoc.id,
                                                    uploadedDoc.hasCompressedVersion || false
                                                  )
                                              : undefined
                                          }
                                          onOpenWizard={() => openWizard(doc.id)}
                                          onRename={(newName) =>
                                            renameDynamicSlot(doc.category, doc.id, newName)
                                          }
                                          onDeleteSlot={() =>
                                            handleDeleteSlot(doc.category, doc.id)
                                          }
                                        />
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <DocumentTableView
                                    documents={docs}
                                    uploadedDocuments={uploadedDocuments}
                                    onUpload={openUploadModal}
                                    onPreview={handlePreview}
                                    onDownload={handleDownload}
                                    onDelete={handleDelete}
                                    onExport={handleExportSingle}
                                    onOpenWizard={openWizard}
                                    onRename={renameDynamicSlot}
                                    onDeleteSlot={handleDeleteSlot}
                                  />
                                )}
                              </div>
                            ))
                          ) : activeTab === "required" || activeTab === "optional" ? (
                            // Show required or optional documents when NOT searching
                            <div className="space-y-4">
                              {viewMode === "grid" ? (
                                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                                  {getFilteredDocumentsForSpecialFilter[
                                    activeTab as "required" | "optional"
                                  ]?.map((doc) => {
                                    const docUploads = uploadedDocuments.filter(
                                      (ud) => ud.documentDefId === doc.id
                                    );
                                    const uploadedDoc =
                                      docUploads.length > 0
                                        ? [...docUploads].sort(
                                            (a, b) =>
                                              new Date(b.uploadedAt).getTime() -
                                              new Date(a.uploadedAt).getTime()
                                          )[0]
                                        : undefined;
                                    return (
                                      <DocumentCard
                                        key={doc.id}
                                        documentDef={doc}
                                        uploadedDoc={uploadedDoc}
                                        onUpload={(replaceId) => openUploadModal(doc.id, replaceId)}
                                        onPreview={
                                          uploadedDoc ? () => handlePreview(uploadedDoc) : undefined
                                        }
                                        onDownload={
                                          uploadedDoc
                                            ? () => handleDownload(uploadedDoc.id)
                                            : undefined
                                        }
                                        onDelete={
                                          uploadedDoc
                                            ? () => handleDelete(uploadedDoc.id)
                                            : undefined
                                        }
                                        onExport={
                                          uploadedDoc
                                            ? () =>
                                                handleExportSingle(
                                                  uploadedDoc.id,
                                                  uploadedDoc.hasCompressedVersion || false
                                                )
                                            : undefined
                                        }
                                        onOpenWizard={() => openWizard(doc.id)}
                                        onRename={(newName) =>
                                          renameDynamicSlot(doc.category, doc.id, newName)
                                        }
                                        onDeleteSlot={() => handleDeleteSlot(doc.category, doc.id)}
                                      />
                                    );
                                  })}
                                </div>
                              ) : (
                                <DocumentTableView
                                  documents={
                                    getFilteredDocumentsForSpecialFilter[
                                      activeTab as "required" | "optional"
                                    ] || []
                                  }
                                  uploadedDocuments={uploadedDocuments}
                                  onUpload={openUploadModal}
                                  onPreview={handlePreview}
                                  onDownload={handleDownload}
                                  onDelete={handleDelete}
                                  onExport={handleExportSingle}
                                  onOpenWizard={openWizard}
                                  onRename={renameDynamicSlot}
                                  onDeleteSlot={handleDeleteSlot}
                                />
                              )}
                            </div>
                          ) : (
                            // Show specific category when NOT searching
                            <div className="space-y-4">
                              {viewMode === "grid" ? (
                                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                                  {documentsByCategory[activeTab]?.map((doc) => {
                                    const docUploads = uploadedDocuments.filter(
                                      (ud) => ud.documentDefId === doc.id
                                    );
                                    const uploadedDoc =
                                      docUploads.length > 0
                                        ? [...docUploads].sort(
                                            (a, b) =>
                                              new Date(b.uploadedAt).getTime() -
                                              new Date(a.uploadedAt).getTime()
                                          )[0]
                                        : undefined;
                                    return (
                                      <DocumentCard
                                        key={doc.id}
                                        documentDef={doc}
                                        uploadedDoc={uploadedDoc}
                                        onUpload={() => openUploadModal(doc.id)}
                                        onPreview={
                                          uploadedDoc ? () => handlePreview(uploadedDoc) : undefined
                                        }
                                        onDownload={
                                          uploadedDoc
                                            ? () => handleDownload(uploadedDoc.id)
                                            : undefined
                                        }
                                        onDelete={
                                          uploadedDoc
                                            ? () => handleDelete(uploadedDoc.id)
                                            : undefined
                                        }
                                        onExport={
                                          uploadedDoc
                                            ? () =>
                                                handleExportSingle(
                                                  uploadedDoc.id,
                                                  uploadedDoc.hasCompressedVersion || false
                                                )
                                            : undefined
                                        }
                                        onOpenWizard={() => openWizard(doc.id)}
                                        onRename={(newName) =>
                                          renameDynamicSlot(doc.category, doc.id, newName)
                                        }
                                      />
                                    );
                                  })}
                                </div>
                              ) : (
                                <DocumentTableView
                                  documents={documentsByCategory[activeTab] || []}
                                  uploadedDocuments={uploadedDocuments}
                                  onUpload={openUploadModal}
                                  onPreview={handlePreview}
                                  onDownload={handleDownload}
                                  onDelete={handleDelete}
                                  onExport={handleExportSingle}
                                  onOpenWizard={openWizard}
                                  onRename={renameDynamicSlot}
                                  onDeleteSlot={handleDeleteSlot}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </PageGate>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {selectedDoc && (
        <>
          {selectedDoc.multipleFilesAllowed && !selectedDoc.id.startsWith("dynamic-") ? (
            <MultipleDocumentUploadModal
              open={uploadModalOpen}
              onClose={closeUploadModal}
              categoryId={selectedDoc.id}
              documentName={selectedDoc.name}
              options={selectedDoc.suggestions || []}
              userJourneys={userJourneys}
              activeJourneyId={activeJourneyId}
              onUploadComplete={async () => {
                // Reload documents in the store instantly — no full re-init needed
                await reloadDocuments(activeJourneyId || undefined);
                refreshNotifications(t);
              }}
            />
          ) : (
            <DocumentUploadModal
              open={uploadModalOpen}
              onClose={closeUploadModal}
              documentDef={selectedDoc}
              userJourneys={userJourneys}
              activeJourneyId={activeJourneyId}
              onUploadComplete={async () => {
                // Reload documents in the store instantly — no full re-init needed
                await reloadDocuments(activeJourneyId || undefined);
                refreshNotifications(t);
              }}
            />
          )}

          <DocumentWizard open={wizardOpen} onClose={closeWizard} documentDef={selectedDoc} />

          {/* Testing Panel - only shows in development */}
          {/* <NotificationTestPanel /> */}
        </>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          open={previewOpen}
          onClose={() => {
            setPreviewOpen(false);
            setPreviewDoc(null);
          }}
          documentDef={
            selectedDoc ||
            ALL_DOCUMENTS.find((d) => d.id === previewDoc.documentDefId) ||
            requiredDocuments.find((d) => d.id === previewDoc.documentDefId)!
          }
          uploadedDoc={previewDoc}
          allUploadedDocs={previewDocRelatedFiles}
        />
      )}

      <Dialog open={welcomeModalOpen} onOpenChange={setWelcomeModalOpen}>
        <DialogContent className="w-[95%] max-w-md overflow-hidden rounded-3xl border-none bg-white p-0 shadow-2xl dark:bg-slate-900">
          <div className="relative flex flex-col items-center p-8">
            {/* Decorative Background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="bg-primary/5 absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl" />
              <div className="bg-primary/5 absolute -bottom-24 -left-24 h-64 w-64 rounded-full blur-3xl" />
            </div>

            {/* Icon */}
            <div className="bg-primary/10 relative z-10 mb-6 flex h-20 w-20 -rotate-3 transform items-center justify-center rounded-3xl shadow-inner transition-transform duration-500 hover:rotate-0">
              <LayoutTemplate className="text-primary h-10 w-10" />
            </div>

            {/* Text */}
            <h3 className="relative z-10 mb-3 text-center text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Personalize Your Vault
            </h3>
            <p className="relative z-10 text-left text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
              Your document checklist is currently showing a standard list of documents. To view the
              exact documents required for your specific situation, please complete these steps in
              your Journey roadmap:{" "}
            </p>

            <ul className="text-primary mb-8 text-left font-bold">
              <li> Chapter 1: Step 1 (Eligibility Check)</li>
              <li> Chapter 1: Step 2 (Checklist Personalization)</li>
            </ul>
            {/* Actions */}
            <div className="relative z-10 w-full space-y-3">
              <Link href={journeyRoadmapHref}>
                {" "}
                <Button
                  // onClick={() => router.push("/visa-category/ir-1")}
                  className="bg-primary hover:bg-primary/90 shadow-primary/20 h-14 w-full rounded-2xl text-base font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                >
                  Go to Journey Roadmap
                </Button>
              </Link>
              <button
                onClick={() => setWelcomeModalOpen(false)}
                className="h-12 w-full cursor-pointer rounded-2xl text-sm font-bold text-slate-500 transition-colors hover:text-slate-800 dark:hover:text-slate-200"
              >
                Continue with Generic List
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete Document?"
        description={"Are you sure you want to delete this document? This cannot be undone."}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={confirmDelete}
      />

      {/* Delete Slot Confirmation Modal */}
      <ConfirmationModal
        open={deleteSlotModalOpen}
        onOpenChange={setDeleteSlotModalOpen}
        title="Delete Document Slot?"
        description="Are you sure you want to delete this document slot? This will permanently delete any uploaded files associated with this slot. This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={confirmDeleteSlot}
      />
      {/* </div> */}
    </TooltipProvider>
  );
}

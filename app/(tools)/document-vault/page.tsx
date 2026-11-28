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
  ChevronsUpDown,
  ChevronUp,
} from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { useToast } from "@/app/components/shared/ToastProvider";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Info, LayoutTemplate } from "lucide-react";
import { useWizard } from "@/app/(main)/dashboard/hooks/useWizard";
import { useCandidate } from "@/app/context/CandidateContext";
import { getBaseVisaCategory } from "@/lib/candidate/candidateSyncService";
import {
  canonicalJourneyKey,
  getJourneyKeyForCandidate,
  parseJourneyKey,
} from "@/lib/candidate/candidateKeys";
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
  resolveCandidateCardTag,
  isMultiCandidateCategory,
} from "@/lib/document-vault/journey-mapping";
import { createClient } from "@/lib/supabase/client";
import { listUserJourneys, type JourneyProgressRecord } from "@/lib/journey/journeyProgressService";

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

  /**
   * Journey id passed by the journey dashboard (?journey=<journeys.id>). Opens that
   * journey's vault directly instead of the journey picker, and stops the
   * candidate sync below from swapping it for another journey on first load.
   */
  const urlJourneyRef = useRef<string | null>(
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("journey")
      : null
  );

  const { activeCandidate, activeCandidateId, isMultiCandidate, candidates, setActiveCandidateId } =
    useCandidate();

  // Derive active candidate journey key
  const activeCandidateJourneyKey = useMemo(() => {
    if (!activeCandidate) return undefined;
    return getJourneyKeyForCandidate({
      ...activeCandidate,
      visaCategory: activeCandidate.visaCategory || "IR-5",
    });
  }, [activeCandidate]);

  // Derive active journey for labelling and wizard loading
  const activeJourney = useMemo(() => {
    return userJourneys.find((j) => j.id === activeJourneyId) ?? null;
  }, [userJourneys, activeJourneyId]);

  // ── Resolves each DB-backed journey row to a distinct vault card with dedicated candidate identity ──
  // Mirrored from app/(main)/my-journeys/page.tsx (lines 555-608):
  // 1 card per DB record, with sequential candidate assignment for multi-candidate visas (IR-5, IR-2).
  const vaultJourneyCards = useMemo(() => {
    // 1. Exact-duplicate protection: ensure every journey in userJourneys has a unique ID
    const uniqueJourneys: Journey[] = [];
    const seenIds = new Set<string>();
    for (const j of userJourneys) {
      if (!j.id || seenIds.has(j.id)) continue;
      seenIds.add(j.id);
      uniqueJourneys.push(j);
    }

    const assignedCandidateIds = new Set<string>();

    return uniqueJourneys.map((journey) => {
      const baseCategory = getBaseVisaCategory(journey.journey_type);
      const visaCategory = journeyTypeToVisaCategory(journey.journey_type);
      const isMulti = isMultiCandidateCategory(journey.journey_type);
      const status = journey.status as string;
      const isActive = status === "in_progress" || status === "active";

      let candidateId: string | undefined;
      let candidateName: string | undefined;
      let candidateTag: string | null = null;

      if (isMulti) {
        // Multi-candidate (IR-5, IR-2, CR-2) resolution:
        // 1. The journey key carries the candidate's CATEGORY SLOT ("ir2_candidate2" = the
        //    second IR-2 child), not its account-wide id, so the owner is found by slot.
        const journeySlot = parseJourneyKey(journey.journey_type).slot;

        // 2. Filter valid candidates for this category
        const validCandidates = (candidates || []).filter((c) => {
          const cat = getBaseVisaCategory(c.visaCategory);
          if (baseCategory === "IR-5") {
            return (
              cat === "IR-5" ||
              c.relation === "Mother" ||
              c.relation === "Father" ||
              c.relation === "Stepparent" ||
              c.relation === "AdoptiveParent" ||
              (!c.visaCategory && c.relation !== "Spouse")
            );
          }
          if (baseCategory === "IR-2" || baseCategory === "CR-2") {
            return cat === "IR-2" || cat === "CR-2" || c.relation === "Child";
          }
          return cat === baseCategory;
        });

        // 3. Match candidate profile: the slot owner first, then first unassigned
        type VaultCardCandidate = {
          id: string;
          label?: string;
          relation?: string;
          fullName?: string;
        };
        const owner = getCandidateForJourneyType(journey.journey_type, candidates || []);
        let cand: VaultCardCandidate | undefined = owner
          ? (candidates || []).find((c) => c.id === owner.id)
          : undefined;

        if (!cand) {
          cand = validCandidates.find((c) => !assignedCandidateIds.has(c.id));
        }

        // 4. Fallback synthesis if more DB journeys than candidate profiles in roster
        const candIndex = assignedCandidateIds.size + 1;
        if (!cand) {
          cand = {
            id: `unassigned-${journey.id}`,
            label: `Candidate ${journeySlot}`,
            relation:
              baseCategory === "IR-5"
                ? journeySlot === 1
                  ? "Mother"
                  : journeySlot === 2
                    ? "Father"
                    : "Other"
                : "Child",
            fullName: "",
          };
        }

        assignedCandidateIds.add(cand.id);
        candidateId = cand.id;

        // Candidate display name (e.g. "Mother", "Father", "Muhammad Nadeem", "Child", or "Candidate 1")
        const formatRelation = (rel?: string) => {
          if (!rel) return "";
          if (rel === "AdoptiveParent") return "Adoptive Parent";
          if (rel === "Stepparent") return "Stepparent";
          if (rel === "Other") return "Parent";
          return rel;
        };
        const rel = formatRelation(cand.relation);
        candidateName =
          cand.fullName ||
          (rel && rel !== "Other" ? rel : null) ||
          cand.label ||
          `Candidate ${candIndex}`;

        // Candidate card tag (in brackets): e.g. "Candidate 1", "Candidate 2", "Candidate 3"
        candidateTag = cand.label || `Candidate ${candIndex}`;
      } else {
        // Single-candidate journey (IR-1, CR-1, etc.)
        // A Spouse relation only stands in for an IR-1 / CR-1 journey; an F-1 or other
        // card must not switch the active candidate to the spouse.
        const isSpouseCategory = baseCategory === "IR-1" || baseCategory === "CR-1";
        const spouseCand = (candidates || []).find(
          (c) =>
            getBaseVisaCategory(c.visaCategory) === baseCategory ||
            (isSpouseCategory && c.relation === "Spouse")
        );
        if (spouseCand) {
          candidateId = spouseCand.id;
          candidateName = spouseCand.fullName || spouseCand.customName || "Spouse";
        }
        candidateTag = null; // NEVER show candidate tag for single-candidate journeys!
      }

      // Card image & description
      let cardImage = "";
      let cardDesc = "Manage your visa application documents, checklist, and requirements.";
      if (visaCategory) {
        const cleanCategory = visaCategory.toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (cleanCategory === "IR1" || cleanCategory === "CR1") {
          cardImage = "/assets/images/ir1-doc-vault-image.jpg";
          cardDesc =
            "Spouse of a U.S. Citizen Visa Document Vault. Keep track of marriage certificates, petitioner details, and sponsorship documents.";
        } else if (cleanCategory === "IR5") {
          cardImage = "/assets/images/ir5-doc-vault-image.png";
          cardDesc =
            "Parent of a U.S. Citizen Visa Document Vault. Keep track of birth certificates, proof of relationship, and financial sponsor files.";
        } else if (cleanCategory === "IR2" || cleanCategory === "CR2") {
          cardImage = "/assets/images/ir2-doc-vault-image.jpg";
          cardDesc =
            "Child of a U.S. Citizen Visa Document Vault. Keep track of birth certificates, NADRA CRC, custody records, and relationship evidence.";
        }
      }
      if (!cardImage) {
        cardImage = "/assets/images/hero-journey.jpg";
      }

      return {
        journey,
        journeyId: journey.id,
        visaCategory,
        isMulti,
        candidateId,
        candidateName,
        candidateTag,
        cardImage,
        cardDesc,
        isActive,
        friendlyName: getFriendlyJourneyName(journey.journey_type, journey.journey_name),
      };
    });
  }, [userJourneys, candidates]);

  const dedupedUserJourneys = useMemo(() => {
    return vaultJourneyCards.map((c) => c.journey);
  }, [vaultJourneyCards]);

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
    if (type?.startsWith("ir5")) {
      return ir5journeyHref;
    }
    if (type?.startsWith("ir2") || type?.startsWith("cr2")) {
      return "/visa-category/ir2-journey";
    }
    return ir1journeyHref;
  }, [activeJourney]);

  // The card for the open journey, and its owner when that owner is a real roster
  // candidate. The wizard and the beneficiary name follow the JOURNEY that is open, not
  // whichever candidate happened to be active before (that showed IR-1 data on an IR-2
  // vault when the IR-2 journey had no roster owner).
  const activeCard = useMemo(
    () => vaultJourneyCards.find((c) => c.journeyId === activeJourneyId) ?? null,
    [vaultJourneyCards, activeJourneyId]
  );
  const activeCardCandidate = useMemo(
    () =>
      activeCard?.candidateId
        ? ((candidates || []).find((c) => c.id === activeCard.candidateId) ?? null)
        : null,
    [activeCard, candidates]
  );

  const wizard = useWizard({
    userId: journeysLoading || !activeJourneyId ? null : user?.id,
    journeyId: activeJourney?.journey_type || undefined,
    candidateId: activeCardCandidate?.id ?? undefined,
    journeyDbId: activeJourneyId,
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

  const activeCategoryGroups = useMemo(() => {
    if (searchQuery.trim()) {
      const grouped: Record<string, typeof ALL_DOCUMENTS> = {};
      for (const doc of flatFilteredDocuments) {
        const cat = doc.category || "OTHER";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(doc);
      }
      return grouped;
    }

    if (activeTab === "all") {
      return documentsByCategory;
    }

    if (activeTab === "required") {
      const grouped: Record<string, typeof ALL_DOCUMENTS> = {};
      for (const [cat, docs] of Object.entries(documentsByCategory)) {
        const filtered = docs.filter((d) => d.required);
        if (filtered.length > 0) {
          grouped[cat] = filtered;
        }
      }
      return grouped;
    }

    if (activeTab === "optional") {
      const grouped: Record<string, typeof ALL_DOCUMENTS> = {};
      for (const [cat, docs] of Object.entries(documentsByCategory)) {
        const filtered = docs.filter((d) => !d.required);
        if (filtered.length > 0) {
          grouped[cat] = filtered;
        }
      }
      return grouped;
    }

    // Specific category tab
    if (documentsByCategory[activeTab]) {
      return {
        [activeTab]: documentsByCategory[activeTab],
      };
    }

    return {};
  }, [searchQuery, flatFilteredDocuments, activeTab, documentsByCategory]);

  const categoryKeys = useMemo(() => Object.keys(activeCategoryGroups), [activeCategoryGroups]);

  const totalVisibleDocsCount = useMemo(() => {
    return Object.values(activeCategoryGroups).reduce((acc, docs) => acc + docs.length, 0);
  }, [activeCategoryGroups]);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // First category is expanded by default, rest collapsed
  useEffect(() => {
    if (categoryKeys.length > 0) {
      setExpandedCategories(new Set([categoryKeys[0]]));
    } else {
      setExpandedCategories(new Set());
    }
  }, [activeTab, searchQuery, categoryKeys.length]);

  // Opening one category closes the other
  const handleToggleCategory = useCallback((categoryKey: string) => {
    setExpandedCategories((prev) => {
      if (prev.has(categoryKey)) {
        const next = new Set(prev);
        next.delete(categoryKey);
        return next;
      }
      return new Set([categoryKey]);
    });
  }, []);

  const handleExpandAllCategories = useCallback(() => {
    setExpandedCategories(new Set(categoryKeys));
  }, [categoryKeys]);

  const handleCollapseAllCategories = useCallback(() => {
    setExpandedCategories(new Set());
  }, []);

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
    if (!user?.id) return;
    if (journeyGateEvaluated.current) return;
    journeyGateEvaluated.current = true;

    const userId = user.id;

    async function evaluateJourneyGate() {
      setJourneysLoading(true);
      try {
        const supabase = createClient();

        // 1. Primary: Direct Supabase query matching my-journeys/page.tsx exactly
        // and in parallel listUserJourneys fallback
        const [journeysQueryRes, progressData] = await Promise.all([
          supabase
            .from("journeys")
            .select(
              "id, journey_type, subscription_tier, completed_steps_count, total_steps_count, updated_at, filing_method, status"
            )
            .eq("user_id", userId)
            .order("updated_at", { ascending: false }),
          listUserJourneys(userId).catch((err) => {
            console.warn("[DocumentVault] listUserJourneys fallback:", err);
            return [] as JourneyProgressRecord[];
          }),
        ]);

        const rawDbJourneys = journeysQueryRes.data || [];
        const progressMap = new Map((progressData || []).map((p) => [p.id, p]));

        // Merge DB journeys with progress calculations while preserving journeys table as primary source
        let journeys: Journey[] = rawDbJourneys.map((raw: any) => {
          const enriched = progressMap.get(raw.id);
          return {
            id: raw.id,
            user_id: userId,
            journey_type: raw.journey_type,
            subscription_tier: raw.subscription_tier || enriched?.subscription_tier || "free",
            status: raw.status || enriched?.status || "not_started",
            filing_method: (raw.filing_method || enriched?.filing_type || "online") as any,
            sponsor_structure: "individual",
            total_steps_count: enriched?.total_steps_count || raw.total_steps_count || 0,
            completed_steps_count:
              enriched?.completed_steps_count || raw.completed_steps_count || 0,
            completion_percentage: 0,
            created_at: enriched?.started_at || raw.updated_at || new Date().toISOString(),
            updated_at: raw.updated_at || enriched?.last_updated_at || new Date().toISOString(),
          } as Journey;
        });

        // If progressData contained journeys not returned by direct query (edge cases), include them
        if (progressData && progressData.length > 0) {
          const existingIds = new Set(journeys.map((j) => j.id));
          for (const p of progressData) {
            if (!existingIds.has(p.id)) {
              journeys.push({
                id: p.id,
                user_id: userId,
                journey_type: p.journey_id,
                subscription_tier: p.subscription_tier || "free",
                status: (p.status as any) || "not_started",
                filing_method: (p.filing_type || "online") as any,
                sponsor_structure: "individual",
                total_steps_count: p.total_steps_count || 0,
                completed_steps_count: p.completed_steps_count || 0,
                completion_percentage: 0,
                created_at: p.started_at || new Date().toISOString(),
                updated_at: p.last_updated_at || new Date().toISOString(),
              } as Journey);
            }
          }
        }

        // Supplementary: Also query /api/journeys if available to get any server-side computed journeys
        try {
          const res = await fetch("/api/journeys?limit=100");
          if (res.ok) {
            const data = await res.json();
            const apiJourneys: any[] = (data.data ?? []).map((item: any) => item.journey ?? item);
            const existingIds = new Set(journeys.map((j) => j.id));
            for (const apiJ of apiJourneys) {
              if (apiJ && apiJ.id && !existingIds.has(apiJ.id)) {
                journeys.push(apiJ as Journey);
              }
            }
          }
        } catch (apiErr) {
          console.warn("[DocumentVault] /api/journeys supplementary check:", apiErr);
        }

        setUserJourneys(journeys);
        setCachedUserJourneys(journeys);

        // 1 Card per DB Journey record: ensure unique IDs
        const uniqueIds = new Set(journeys.map((j) => j.id));

        const fromUrl = urlJourneyRef.current
          ? journeys.find((j) => j.id === urlJourneyRef.current)
          : undefined;

        if (fromUrl) {
          // ── Opened from a journey dashboard: go straight to that vault ──
          setActiveJourneyId(fromUrl.id);
          sessionStorage.setItem(SESSION_KEY, fromUrl.id);
          setJourneyGateReady(true);
        } else if (journeys.length === 0) {
          // ── Case 1: No journey at all ──────────────────────────────────
          setNoJourneyModalOpen(true);
          setActiveJourneyId(null);
          setJourneyGateReady(true);
        } else if (uniqueIds.size === 1) {
          // ── Case 2: Exactly one journey — auto-select it ───────────────
          setActiveJourneyId(journeys[0].id);
          setJourneyGateReady(true);
        } else {
          // ── Case 3: Multiple journeys (different categories or candidates) ──
          // Always present the card selection grid when multiple journeys exist!
          setActiveJourneyId(null);
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
  }, [user?.id]); // use user?.id (primitive) not user object to avoid ref-instability re-runs

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
    const metadata =
      (wizard.state?.backendId === activeJourneyId ? wizard.state?.metadata : {}) || {};
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
      activeCardCandidate?.fullName ||
      (metadata.beneficiaryName as string) ||
      activeCard?.candidateName ||
      activeCardCandidate?.label ||
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
    activeCard,
    activeCardCandidate,
  ]);

  // ── Synchronize active journey with active candidate profile ─────────────
  useEffect(() => {
    if (!userJourneys || userJourneys.length === 0 || !activeCandidate) return;

    // Do NOT auto-select a journey when the user is on the multiple-journeys card picker screen!
    if (!activeJourneyId && vaultJourneyCards.length > 1) {
      lastResolvedCandidateRef.current = activeCandidateId;
      return;
    }

    // Only react to an actual CANDIDATE change. Without this guard, clicking
    // "Back to Journeys" (which sets activeJourneyId to null) would be instantly
    // reverted here, and picking a different journey folder would bounce back.
    if (activeCandidateId === lastResolvedCandidateRef.current) return;

    // Opened for a specific journey: keep it for the current candidate. A later
    // candidate switch still re-resolves as usual.
    if (urlJourneyRef.current) {
      lastResolvedCandidateRef.current = activeCandidateId;
      urlJourneyRef.current = null;
      return;
    }

    const visaCategory = activeCandidate.visaCategory || "IR-5";
    // Exact journey key of the candidate's category slot ("ir2" for the first child,
    // "ir2_candidate2" for the second). Variant rows of the same journey ("ir5" /
    // "ir5-journey") share the canonical key; another candidate's or another
    // category's journey never matches.
    const candidateJourneyKey = getJourneyKeyForCandidate({ ...activeCandidate, visaCategory });
    const matched = userJourneys.find(
      (j) => canonicalJourneyKey(j.journey_type) === candidateJourneyKey
    );

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
  const handlePickJourney = useCallback(
    (journeyId: string, candidateId?: string) => {
      setActiveJourneyId(journeyId);
      // The card the user clicked wins. Switch the active candidate only to a REAL roster
      // candidate; a card whose journey has no roster owner carries a synthesized id that
      // CandidateContext ignores. Either way, pin the ref to the candidate that will be
      // active, so the candidate->journey sync effect does not "correct" this pick back to
      // the previous candidate's journey (that bounced every card to the IR-1 vault).
      const isRosterCandidate = Boolean(
        candidateId && (candidates || []).some((c) => c.id === candidateId)
      );
      if (isRosterCandidate && candidateId) {
        setActiveCandidateId(candidateId, { silent: true });
        lastResolvedCandidateRef.current = candidateId;
      } else {
        lastResolvedCandidateRef.current = activeCandidateId ?? null;
      }
      if (typeof window !== "undefined") {
        sessionStorage.setItem(SESSION_KEY, journeyId);
      }
      setJourneyGateReady(true);
    },
    [setActiveCandidateId, candidates, activeCandidateId]
  );

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
      <div className="mt-[55px] flex min-h-[calc(100vh-55px)] items-center justify-center bg-slate-50/50 dark:bg-slate-950/50">
        <div className="animate-in fade-in flex flex-col items-center justify-center p-8 text-center duration-300">
          <Loader size="lg" className="text-primary mb-4" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Loading Document Vault...
          </h3>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
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
              is strictly associated with an active immigration journey. Users cannot purchase or
              access the Document Vault independently as a standalone feature.
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

  if (vaultJourneyCards.length > 1 && !activeJourneyId) {
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
            {vaultJourneyCards.map((card) => {
              const {
                journey,
                journeyId,
                visaCategory,
                isMulti,
                candidateId,
                candidateName,
                candidateTag,
                cardImage,
                cardDesc,
                isActive,
                friendlyName,
              } = card;

              return (
                <button
                  key={journeyId}
                  onClick={() => handlePickJourney(journeyId, candidateId)}
                  className="hover:border-primary/40 group focus:ring-primary/20 flex w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:ring-2 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                >
                  {/* Card Image Banner */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
                    <Image
                      src={cardImage}
                      alt={friendlyName}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent" />

                    {/* Floating Badges */}
                    {/* <div className="pointer-events-none absolute top-4 right-4 left-4 flex items-center justify-between">
                      <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
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
                        {candidateName && (
                          <Badge
                            variant="outline"
                            className="border-white/20 bg-slate-900/80 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm"
                          >
                            {candidateName}
                          </Badge>
                        )}
                      </div>
                      {isActive && (
                        <Badge className="pointer-events-auto border-none bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                          Active
                        </Badge>
                      )}
                    </div> */}
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      {/* Journey Details */}
                      <h3
                        title={candidateTag ? `${friendlyName} (${candidateTag})` : friendlyName}
                        className="group-hover:text-primary mb-2 line-clamp-1 text-[15px] font-bold text-slate-900 transition-colors dark:text-white"
                      >
                        {friendlyName}
                        {isMulti && candidateTag && (
                          <span className="ml-1.5 font-normal text-slate-500 dark:text-slate-400">
                            ({candidateTag})
                          </span>
                        )}
                      </h3>
                      <p
                        className="mb-6 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400"
                        title={cardDesc}
                      >
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
            {/* Hero Header Deck */}
            <header className="relative overflow-hidden bg-[#0A4F49] px-4 py-10 pb-20 text-white sm:px-6 lg:px-10">
              <svg
                className="pointer-events-none absolute bottom-14 hidden h-[160px] w-[150px] opacity-[.14] md:right-[200px] md:block lg:right-[300px]"
                viewBox="160 70 840 850"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Secure Vault Folder Perimeter */}
                <path
                  d="M 225 220 H 435 L 495 275 H 920 C 942 275 960 293 960 315 V 835 C 960 857 942 875 920 875 H 225 C 203 875 185 857 185 835 V 260 C 185 238 203 220 225 220 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeLinejoin="round"
                />
                <line
                  x1="185"
                  y1="335"
                  x2="960"
                  y2="335"
                  stroke="currentColor"
                  strokeWidth="5"
                  opacity="0.65"
                />

                {/* Stacked Document Sheets */}
                <g transform="translate(655, 115)">
                  <rect
                    x="28"
                    y="0"
                    width="190"
                    height="245"
                    rx="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="7"
                    opacity="0.65"
                  />
                  <rect
                    x="0"
                    y="26"
                    width="190"
                    height="245"
                    rx="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="9"
                  />
                  <line
                    x1="30"
                    y1="74"
                    x2="115"
                    y2="74"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <line
                    x1="30"
                    y1="112"
                    x2="155"
                    y2="112"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <line
                    x1="30"
                    y1="142"
                    x2="155"
                    y2="142"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <line
                    x1="30"
                    y1="172"
                    x2="120"
                    y2="172"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                </g>

                {/* Verified Checkmark Seal */}
                <g transform="translate(755, 650)">
                  <circle
                    cx="75"
                    cy="75"
                    r="68"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                  />
                  <circle
                    cx="75"
                    cy="75"
                    r="50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray="10 8"
                  />
                  <path
                    d="M 48 76 L 67 95 L 105 55"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>

                {/* Rahvana Bird */}
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M236,880C228,876 222,867 222,860C222,854 229,840 237,832C244,824 270,806 281,801C284,800 296,794 300,792C307,789 328,781 348,774C352,772 358,770 360,770C361,769 364,768 366,768C367,768 370,767 371,766C372,766 376,764 380,763C383,762 387,761 390,760C392,760 397,758 401,757C405,756 413,754 418,753C424,751 429,750 430,750C432,750 448,740 452,735C454,734 458,730 462,728C482,713 509,687 523,667C529,659 529,657 523,657C518,657 500,652 492,648C487,646 474,640 469,637C449,626 418,594 404,570C400,564 399,562 389,556C359,535 336,510 321,479C307,452 300,426 300,400C300,383 301,378 306,374C311,370 319,373 326,381C327,383 330,386 331,387C332,389 333,390 333,390C333,391 335,394 338,398C340,403 342,406 342,407C342,407 344,411 346,416C348,421 352,429 354,434C356,440 358,445 359,446C359,448 361,452 363,457C365,462 367,469 369,472C371,476 372,480 372,481C372,481 373,484 374,486C377,493 378,496 379,500C380,502 383,507 384,511C386,514 387,517 387,518C387,518 388,521 390,525C392,529 394,533 395,535C397,540 397,541 402,550C421,585 441,608 468,626C475,631 496,642 498,642C498,642 500,643 502,643C509,646 526,650 532,650C535,650 535,650 541,639C544,632 546,626 546,626C546,625 546,624 547,623C548,622 552,609 557,591C563,564 561,527 551,502C540,474 522,455 487,434C485,433 465,423 462,421C454,418 432,409 421,405C417,403 412,401 410,400C409,400 405,398 403,397C398,396 393,393 382,388C368,382 366,381 361,378C358,376 356,375 355,375C355,375 352,374 350,372C347,371 345,369 344,368C308,347 280,314 266,276C263,267 258,251 257,245C256,242 254,236 254,233C249,216 247,184 248,161C249,142 252,136 259,132C269,127 278,135 293,159C311,187 325,207 337,220C339,223 344,229 347,232C366,254 396,279 416,290C419,291 422,293 424,294C428,297 442,303 451,308C462,313 471,317 476,319C490,325 493,326 502,331C507,333 516,338 520,340C525,343 531,346 533,347C540,351 550,358 560,365C566,369 572,374 573,375C580,380 602,402 609,412C620,427 622,430 630,446C635,457 637,462 643,480C646,488 649,504 653,525C659,563 660,567 668,567C671,567 673,566 675,566C676,565 677,564 678,564C680,564 710,541 728,525C732,522 744,511 754,501C779,477 785,472 798,464C816,454 834,449 854,452C869,454 879,458 892,469C898,474 902,476 913,477C935,480 943,482 943,485C942,487 935,491 930,492C921,494 907,500 894,507C880,515 866,529 858,544C852,555 846,567 846,569C846,570 846,571 845,572C845,572 843,576 842,581C839,589 838,592 835,600C835,602 833,606 832,610C831,615 826,630 822,640C810,675 776,713 739,732C735,734 731,737 730,737C729,738 721,742 714,744C678,758 649,762 609,760C585,759 577,758 568,757C521,751 463,751 439,757C434,758 402,783 383,800C377,805 370,810 368,813C359,820 353,825 340,836C312,859 289,874 269,880C261,883 242,883 236,880ZM259,873C275,872 299,859 323,840C328,836 334,831 337,829C339,826 348,819 355,813C366,803 377,794 395,780C396,778 398,777 399,776C400,775 403,773 406,770C415,763 417,761 409,763C406,764 398,767 391,769C373,773 378,772 340,785C336,786 332,787 331,788C330,788 328,789 326,790C308,797 285,807 276,812C248,829 231,848 231,861C231,866 237,873 243,874C245,874 247,874 248,875C248,875 250,875 251,874C252,874 256,874 259,873ZM652,751C666,749 677,747 683,745C697,741 700,740 711,736C717,734 723,731 725,730C726,730 727,729 728,729C728,729 731,728 733,726C736,724 738,723 739,723C740,723 759,710 766,704C774,697 788,683 791,678C798,669 804,659 804,659C804,658 805,657 805,656C807,654 816,632 820,622C821,617 823,612 823,611C824,610 826,603 828,596C830,589 833,579 835,574C837,568 839,562 840,561C840,560 841,557 842,556C842,555 843,553 844,552C856,529 871,512 888,502C897,497 911,490 914,489C923,488 921,485 911,485C900,484 895,481 884,473C874,466 870,463 860,461C848,458 829,459 816,464C797,472 785,481 746,520C739,527 730,535 726,538C722,541 715,546 710,551C679,575 669,579 661,574C652,568 650,562 643,521C635,473 625,446 601,414C593,404 573,384 561,375C548,365 523,350 510,344C508,343 505,341 504,341C489,333 476,327 475,327C474,327 471,326 468,324C464,323 459,320 455,318C411,299 383,280 352,248C325,221 316,208 282,157C266,133 260,132 257,154C255,168 257,210 260,222C260,224 262,229 262,234C265,245 268,257 273,269C274,272 276,276 276,277C279,287 291,309 301,321C309,332 337,357 340,357C341,357 344,359 347,361C350,363 357,367 362,369C376,376 392,384 392,384C393,384 396,385 399,387C405,390 424,398 432,401C435,402 441,404 446,407C452,409 456,411 457,411C457,411 459,412 461,412C462,413 468,416 474,419C489,426 491,427 498,431C536,456 554,479 565,519C567,526 567,529 567,554C567,581 567,589 563,600C562,601 562,604 561,606C561,609 559,615 557,620C555,626 552,632 552,633C552,635 549,639 547,643C545,647 544,650 544,651C545,651 552,651 559,651C594,651 625,641 668,615C673,612 678,609 679,609C680,608 683,607 686,605C691,602 694,602 694,604C694,605 678,617 667,624C654,633 636,642 627,646C596,656 584,659 556,660L538,660L534,666C530,672 530,673 522,682C518,686 513,692 511,695C507,699 488,718 481,723C474,729 462,738 460,740C457,742 454,745 455,745C455,746 463,745 472,745C492,743 529,745 557,748C576,750 595,752 602,752C612,753 645,752 652,751ZM390,545C390,544 390,543 389,542C386,537 378,518 371,501C369,495 365,486 363,482C362,477 359,470 357,466C356,462 353,455 351,450C349,445 347,440 347,438C335,406 319,380 312,381C310,381 309,382 309,388C308,395 309,420 310,424C311,425 312,429 312,431C312,433 314,438 314,440C315,442 317,447 318,449C324,472 342,502 359,520C374,536 390,549 390,545Z"
                />
              </svg>
              <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-7">
                <div className="flex min-w-0 items-center gap-4">
                  {userJourneys.length > 1 && activeJourneyId ? (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setActiveJourneyId(null);
                        sessionStorage.removeItem(SESSION_KEY);
                      }}
                      className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[14px] border border-white/20 bg-white/[0.12] p-0 text-white hover:bg-white/[0.22] hover:text-white"
                      title="Back to Journeys"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  ) : (
                    <div className="hidden h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[14px] border border-white/20 bg-white/[0.12] sm:flex">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <h1 className="flex flex-wrap items-center gap-3 text-[30px] leading-tight font-bold tracking-tight sm:text-[38px] lg:text-[42px]">
                      <span>{t("documentVaultPage.page.title")}</span>
                      <span className="rounded-full border border-[#E1F2EE]/30 bg-[#E1F2EE]/20 px-3 py-1 text-[11.5px] font-bold tracking-[0.05em] text-[#E1F2EE] uppercase">
                        {config?.visaCategory
                          ? `${config.visaCategory} Journey`
                          : activeJourney
                            ? getFriendlyJourneyName(
                                activeJourney.journey_type,
                                activeJourney.journey_name
                              )
                            : `${activeCandidate?.visaCategory || "IR-5"} Journey`}
                      </span>
                    </h1>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-white/88">
                      {t("documentVaultPage.page.subtitle")}
                    </p>
                  </div>
                </div>
                <NotificationBell variant="header" />
              </div>
            </header>

            <div className="relative z-10 mx-auto -mt-11 w-full max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-8">
              {/* Main Grid Layout */}
              <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
                {/* Left Side: Stats & Configuration */}
                <div className="space-y-6 lg:sticky lg:top-24 lg:col-span-3">
                  {/* Professional Stats Card */}
                  <Card className="overflow-hidden rounded-[24px] border border-[#0F8F80]/28 bg-gradient-to-br from-[#E8F6F3] to-[#D8EFEA] p-0 text-[#16302C] shadow-[0_10px_30px_-10px_rgba(10,79,73,0.1)] transition-all hover:-translate-y-0.5 hover:border-[#0F8F80]/45 hover:shadow-[0_14px_36px_-10px_rgba(10,79,73,0.16)]">
                    <div className="flex flex-col gap-[18px] p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11.5px] font-bold tracking-[0.06em] text-[#0A4F49] uppercase">
                            Progress Update
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="rounded-full border-0 bg-[#0A4F49]/12 px-2.5 py-1 text-[11.5px] font-extrabold text-[#0A4F49]"
                        >
                          {stats.percentComplete}%
                        </Badge>
                      </div>

                      <div className="flex items-baseline justify-between">
                        <div className="font-serif text-[34px] leading-none font-bold text-[#0A4F49]">
                          {stats.uploaded}{" "}
                          <span className="text-[18px] font-medium text-[#526360]">
                            / {stats.total}
                          </span>
                        </div>
                        <span className="text-[12.5px] font-semibold text-[#0F8F80]">
                          {t("documentVaultPage.page.itemsReady")}
                        </span>
                      </div>

                      <Progress
                        value={stats.percentComplete}
                        className="h-2 bg-[#0A4F49]/12"
                        indicatorClassName="bg-gradient-to-r from-[#0F8F80] to-[#0A4F49]"
                      />

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex flex-col rounded-[14px] border border-[#0F8F80]/20 bg-white/70 p-3 backdrop-blur-sm">
                          <p className="text-[10px] font-bold tracking-[0.05em] text-[#526360] uppercase">
                            {t("documentVaultPage.page.criticalMissing")}
                          </p>
                          <p
                            className={`mt-1 text-[20px] font-extrabold ${stats.missing > 0 ? "text-[#E11D48]" : "text-[#16302C]"}`}
                          >
                            {stats.missing}
                          </p>
                        </div>
                        <div className="flex flex-col rounded-[14px] border border-[#0F8F80]/20 bg-white/70 p-3 backdrop-blur-sm">
                          <p className="text-[10px] font-bold tracking-[0.05em] text-[#526360] uppercase">
                            {t("documentVaultPage.page.alertsExpiring")}
                          </p>
                          <p className="mt-1 text-[20px] font-extrabold text-[#16302C]">
                            {stats.expiring + stats.expired}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#0A4F49]/14 px-6 py-4 text-[12px] font-semibold text-[#0A4F49]">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        <span>{t("documentVaultPage.page.bankGradeEncryption")}</span>
                      </div>
                    </div>
                  </Card>

                  {/* Config Panel */}
                  {/* <div className="mb-4">
              <LiveConfigPanel />
            </div> */}

                  {/* Mini Tips Card */}
                  <Card className="rounded-[24px] border border-[#E2E5E8] bg-white p-5 shadow-[0_2px_6px_rgba(22,48,44,0.04)]">
                    <div className="flex gap-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border border-[#F3DDB0] bg-[#FFF7E6] text-[#D97706]">
                        <AlertCircle className="h-[18px] w-[18px]" />
                      </div>
                      <div>
                        <h4 className="text-[14.5px] font-bold text-[#16302C]">
                          {t("documentVaultPage.page.nvcTipTitle")}
                        </h4>
                        <p className="mt-1 text-[13px] leading-[1.5] text-[#526360]">
                          {t("documentVaultPage.page.nvcTipDesc")}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Right Side: Document Management Tabs */}
                <div className="lg:col-span-9">
                  <Tabs defaultValue="required" className="w-full" onValueChange={setActiveTab}>
                    <div className="mb-6 flex flex-col justify-between gap-3 rounded-[24px] border border-[#E2E5E8] bg-white p-3 shadow-[0_2px_6px_rgba(22,48,44,0.04)] xl:mb-8 xl:flex-row xl:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
                        <div className="no-scrollbar w-full overflow-x-auto">
                          <TabsList className="inline-flex h-auto min-w-max shrink-0 bg-transparent p-0">
                            {categories.slice(0, 5).map((cat) => (
                              <TabsTrigger
                                key={cat}
                                value={cat}
                                className="rounded-full border border-transparent px-4 py-2 text-[13px] font-semibold whitespace-nowrap text-[#526360] transition-all data-[state=active]:border-0 data-[state=active]:bg-[#0A4F49] data-[state=active]:font-bold data-[state=active]:text-white data-[state=active]:shadow-[0_2px_8px_rgba(10,79,73,0.20)]"
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
                        <div className="flex shrink-0 gap-0.5 self-start rounded-[14px] border border-[#E2E5E8] bg-[#F8F9FA] p-[3px] sm:self-auto">
                          <Button
                            variant={viewMode === "table" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("table")}
                            className={`h-8 w-8 rounded-[10px] p-0 text-[#8A9995] ${viewMode === "table" ? "bg-white text-[#0A4F49] shadow-[0_1px_4px_rgba(0,0,0,0.08)]" : ""}`}
                          >
                            <List className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={viewMode === "grid" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className={`h-8 w-8 rounded-[10px] p-0 text-[#8A9995] ${viewMode === "grid" ? "bg-white text-[#0A4F49] shadow-[0_1px_4px_rgba(0,0,0,0.08)]" : ""}`}
                          >
                            <LayoutGrid className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex w-full shrink-0 xl:w-[220px]">
                        <div className="relative w-full">
                          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8A9995]" />
                          <Input
                            placeholder={t("documentVaultPage.page.searchPlaceholder")}
                            className="h-[38px] w-full rounded-[14px] border-[#E2E5E8] bg-[#F8F9FA] pl-9 text-[13px] text-[#16302C] outline-none focus:border-[#0F8F80] focus:bg-white focus:ring-[3px] focus:ring-[#0F8F80]/12"
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

                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between xl:mb-8">
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

                      {/* Expand All & Collapse All buttons on right */}
                      {categoryKeys.length > 0 && (
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleExpandAllCategories}
                            className="h-8 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:border-[#0A4F49]/30 hover:bg-[#e8f6f6] hover:text-[#0A4F49] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          >
                            <ChevronsUpDown className="h-3.5 w-3.5 text-[#0A4F49]" />
                            <span>Expand All</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCollapseAllCategories}
                            className="h-8 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:border-[#0A4F49]/30 hover:bg-[#e8f6f6] hover:text-[#0A4F49] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          >
                            <ChevronUp className="h-3.5 w-3.5 text-[#0A4F49]" />
                            <span>Collapse All</span>
                          </Button>
                        </div>
                      )}
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
                        <div className="space-y-4">
                          {totalVisibleDocsCount === 0 ? (
                            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white px-4 py-12 text-center sm:py-20 dark:border-slate-800 dark:bg-slate-900">
                              <Search className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {t("documentVaultPage.page.noDocumentsFound")}
                              </h3>
                              <p className="mx-auto mt-2 max-w-xs text-slate-500">
                                {searchQuery
                                  ? `${t("documentVaultPage.page.noDocumentsDescPrefix")}${searchQuery}${t("documentVaultPage.page.noDocumentsDescSuffix")}`
                                  : "No documents available in this section."}
                              </p>
                              {searchQuery && (
                                <Button
                                  variant="link"
                                  className="text-primary mt-4 font-bold"
                                  onClick={() => setSearchQuery("")}
                                >
                                  {t("documentVaultPage.page.clearSearch")}
                                </Button>
                              )}
                            </div>
                          ) : (
                            Object.entries(activeCategoryGroups).map(([category, docs]) => {
                              const isExpanded = expandedCategories.has(category);
                              const uploadedCount = docs.filter((d) =>
                                uploadedDocuments.some((ud) => ud.documentDefId === d.id)
                              ).length;

                              return (
                                <div
                                  key={category}
                                  className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all dark:border-slate-800 dark:bg-slate-900"
                                >
                                  {/* Category Accordion Header */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCategory(category)}
                                    className="flex w-full cursor-pointer items-center justify-between gap-4 p-4 text-left transition hover:bg-slate-50/80 sm:px-6 sm:py-4.5 dark:hover:bg-slate-800/60"
                                    aria-expanded={isExpanded}
                                  >
                                    <div className="flex min-w-0 items-center gap-3">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e8f6f6] text-[#0A4F49] dark:bg-teal-900/40 dark:text-teal-300">
                                        <ChevronDown
                                          className={`h-4 w-4 transition-transform duration-200 ${
                                            isExpanded
                                              ? "rotate-0 text-[#0A4F49]"
                                              : "-rotate-90 text-slate-400"
                                          }`}
                                        />
                                      </div>
                                      <div className="min-w-0">
                                        <h3 className="truncate text-sm font-bold text-slate-900 sm:text-base dark:text-white">
                                          {getCategoryDisplayName(category, t)}
                                        </h3>
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className="shrink-0 border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                      >
                                        {uploadedCount}/{docs.length} Uploaded
                                      </Badge>
                                    </div>

                                    {/* Dynamic Category Suggestions & Add Button */}
                                    <div
                                      className="flex shrink-0 items-center gap-2"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {DYNAMIC_CATEGORIES.includes(category) && (
                                        <div className="flex items-center gap-2">
                                          {CATEGORY_SUGGESTIONS[category] &&
                                            CATEGORY_SUGGESTIONS[category].length > 0 && (
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="hover:text-primary h-7 w-7 p-0 text-slate-400"
                                                  >
                                                    <Info className="h-3.5 w-3.5" />
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent
                                                  side="right"
                                                  className="max-w-xs p-3"
                                                >
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
                                            className="text-primary hover:bg-primary/10 h-7 gap-1 px-2 text-[11px] font-bold"
                                          >
                                            <Plus className="h-3.5 w-3.5" />
                                            Add
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </button>

                                  {/* Collapsible List of Documents */}
                                  {isExpanded && (
                                    <div className="border-t border-slate-100 bg-[#fbfdfd] p-4 max-[425px]:p-2 sm:p-5 dark:border-slate-800 dark:bg-slate-950/40">
                                      {viewMode === "grid" ? (
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                                  )}
                                </div>
                              );
                            })
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

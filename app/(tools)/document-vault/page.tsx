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
  ArrowLeftRight,
  Compass,
  MapPin,
  Route,
  ArrowLeft,
  Folder,
  ChevronRight,
} from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { useToast } from "@/app/components/shared/ToastProvider";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Info, LayoutTemplate } from "lucide-react";
import { useWizard } from "@/app/(main)/dashboard/hooks/useWizard";
import Link from "next/link";
import { ResultGate } from "@/app/components/entitlements/ResultGate";
import { ir1journeyHref, ir5journeyHref } from "@/lib/constants/routes";
import type { Journey } from "@/lib/journey/types";

// ── Journey → Visa Category mapping ──────────────────────────────────────────
const JOURNEY_TYPE_TO_VISA: Record<string, VisaCategory> = {
  IR1: "IR-1",
  "IR-1": "IR-1",
  ir1: "IR-1",
  "ir-1": "IR-1",
  IR5: "IR-5",
  "IR-5": "IR-5",
  ir5: "IR-5",
  "ir-5": "IR-5",
};

function journeyTypeToVisaCategory(journeyType: string): VisaCategory | null {
  if (!journeyType) return null;
  const clean = journeyType.toUpperCase().replace(/[^A-Z0-9]/g, ""); // e.g., "ir-5" -> "IR5"
  if (clean === "IR1") return "IR-1";
  if (clean === "IR5") return "IR-5";
  return JOURNEY_TYPE_TO_VISA[journeyType] ?? null;
}

// Human-friendly label for a journey
function journeyLabel(j: Journey): string {
  if (j.journey_name) return j.journey_name;
  const visa = journeyTypeToVisaCategory(j.journey_type);
  return visa ? `${visa.toUpperCase()} Journey` : `${j.journey_type} Journey`;
}

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
    addDynamicSlot,
    renameDynamicSlot,
  } = useDocumentVaultStore();

  const [showConfigWizard, setShowConfigWizard] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [activeTab, setActiveTab] = useState<string>("required");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
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

  // Derive active journey for labelling and wizard loading
  const activeJourney = useMemo(() => {
    return userJourneys.find((j) => j.id === activeJourneyId) ?? null;
  }, [userJourneys, activeJourneyId]);

  const journeyRoadmapHref = useMemo(() => {
    const type = activeJourney?.journey_type?.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (type === "ir5") {
      return ir5journeyHref;
    }
    return ir1journeyHref;
  }, [activeJourney]);

  const wizard = useWizard({
    userId: journeysLoading ? null : user?.id,
    journeyId: activeJourney?.journey_type || undefined,
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

        if (journeys.length === 0) {
          // ── Case 1: No journey at all ──────────────────────────────────
          setNoJourneyModalOpen(true);
          setJourneyGateReady(true);
        } else if (journeys.length === 1) {
          // ── Case 2: Exactly one journey — auto-configure ───────────────
          setActiveJourneyId(journeys[0].id);
          setJourneyGateReady(true);
        } else {
          // ── Case 3: Multiple journeys — check session storage ──────────
          const saved = typeof window !== "undefined" ? sessionStorage.getItem(SESSION_KEY) : null;
          if (saved && journeys.some((j) => j.id === saved)) {
            setActiveJourneyId(saved);
            setJourneyGateReady(true);
          } else {
            setJourneyGateReady(true);
          }
        }
      } catch (err) {
        console.error("[DocumentVault] Journey gate error:", err);
        // On error, allow access with generic config
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
    if (!activeJourneyId || !journeyGateReady || !user || !wizard.isLoaded) return;
    // Safety check: ensure wizard has loaded the active journey
    if (wizard.state.backendId !== activeJourneyId) return;
    const activeJourney = userJourneys.find((j) => j.id === activeJourneyId);
    if (!activeJourney) return;
    const visaCategory = journeyTypeToVisaCategory(activeJourney.journey_type);
    if (!visaCategory) return;

    // Retrieve questionnaire answers from journey metadata if available
    const metadata = wizard.state?.metadata || {};
    const hasQuestionnaire = metadata.docQuestionnaireCompleted === true;
    const questionnaireAnswers = (metadata.docQuestionnaireAnswers as Record<string, string>) || {};

    // Map questionnaire answers to vault scenario flags
    const mappedFlags: ScenarioFlags = { ...config?.scenarioFlags };
    if (hasQuestionnaire) {
      const flagGroups = VISA_FLAG_REGISTRY[visaCategory] || [];
      const registeredKeys = new Set(flagGroups.flatMap((group) => group.fields.map((f) => f.key)));

      // Register general background/financial keys that are universally mapped
      registeredKeys.add("military_service");
      registeredKeys.add("criminal_history");
      registeredKeys.add("joint_sponsor_used");

      Object.entries(questionnaireAnswers).forEach(([key, value]) => {
        // If the key is registered for this category, synchronize it automatically
        if (registeredKeys.has(key)) {
          if (value === "yes") {
            mappedFlags[key] = true;
          } else if (value === "no") {
            mappedFlags[key] = false;
          } else {
            mappedFlags[key] = value;
          }
        }
      });

      // Handle minor key name variations between questionnaire and scenario flags
      if (
        questionnaireAnswers.name_change !== undefined &&
        registeredKeys.has("name_change_any_party")
      ) {
        mappedFlags.name_change_any_party = questionnaireAnswers.name_change === "yes";
      }
      if (
        questionnaireAnswers.joint_sponsor !== undefined &&
        registeredKeys.has("joint_sponsor_used")
      ) {
        mappedFlags.joint_sponsor_used = questionnaireAnswers.joint_sponsor === "yes";
      }
    }

    if (!config) {
      // No vault config saved yet for this user — create a minimal one from the
      // journey's visa category so the document list can populate immediately.
      setVaultConfig({ userId: user.id, visaCategory, scenarioFlags: mappedFlags });
    } else if (
      config.visaCategory !== visaCategory ||
      (hasQuestionnaire && JSON.stringify(config.scenarioFlags) !== JSON.stringify(mappedFlags))
    ) {
      // Config exists but points to a different visa category or flags have changed — update it.
      setVaultConfig({
        ...config,
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
  ]);

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
      const isEligibilityDone = wizard.state.completedSteps.has("step_1_1");
      const isPersonalizationDone = wizard.state.metadata?.docQuestionnaireCompleted === true;

      if (!isEligibilityDone || !isPersonalizationDone) {
        setWelcomeModalOpen(true);
        setHasShownWelcome(true);
      }
    }
  }, [
    initialized,
    wizard.isLoaded,
    wizard.state.completedSteps,
    wizard.state.metadata,
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
      <div className="flex items-center justify-center min-h-screen">
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

      const response = await fetch(`/api/documents/${selectedDeleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      if (user) {
        await initialize(user.id, t);
      }

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

  if (noJourneyModalOpen) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-55px)] bg-slate-50/50 dark:bg-slate-950/50 mt-[55px] p-6">
        <Card className="max-w-md w-[95%] bg-white dark:bg-slate-900 border-none shadow-2xl rounded-3xl p-0 overflow-hidden relative">
          <div className="relative p-8 flex flex-col items-center text-center">
            {/* Decorative blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-primary/10 blur-3xl" />
            </div>

            {/* Icon */}
            <div className="relative z-10 w-20 h-20 rounded-3xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-6 shadow-inner">
              <Compass className="w-10 h-10 text-amber-600 dark:text-amber-400" />
            </div>

            {/* Text */}
            <h3 className="relative z-10 text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
              Journey Required
            </h3>
            <p className="relative z-10 text-slate-600 dark:text-slate-400 leading-relaxed text-[15px] mb-2">
              The{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200">Document Vault</span>{" "}
              is a journey-specific tool. It organizes and tracks the exact documents you need based
              on your immigration journey.
            </p>
            <p className="relative z-10 text-slate-500 dark:text-slate-500 text-sm leading-relaxed mb-8">
              You don&apos;t have an active immigration journey yet. Please start a journey first,
              then your Document Vault will be automatically set up for you.
            </p>

            {/* Actions */}
            <div className="relative z-10 w-full space-y-3">
              <Link href="/visa-category/ir-category">
                <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
                  <Route className="w-5 h-5 mr-2" />
                  Browse Available Journeys
                </Button>
              </Link>
              <p className="text-xs text-slate-400 dark:text-slate-500 pt-3">
                Once you start a journey, come back here to access your personalized Document Vault.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (userJourneys.length > 1 && !activeJourneyId) {
    return (
      <div className="bg-slate-50/50 dark:bg-slate-950/50 mt-[55px] min-h-[calc(100vh-55px)] py-12 px-6">
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
              Your Document Vaults
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
              You have multiple immigration journeys. Select a journey below to open its
              personalized document vault and manage your checklist.
            </p>
          </div>

          {/* Grid of Folders / Journey Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userJourneys.map((journey) => {
              const visaCategory = journeyTypeToVisaCategory(journey.journey_type);
              const isActive = journey.status === "in_progress";
              const progress = journey.completion_percentage || 0;

              return (
                <button
                  key={journey.id}
                  onClick={() => handlePickJourney(journey.id)}
                  className="flex flex-col text-left bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {/* Folder Accent Bar */}
                  <div className="h-2 w-full bg-linear-to-r from-primary/80 to-primary" />

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Folder / Compass Icon */}
                      <div className="flex items-center justify-between mb-5">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          <Folder className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-2">
                          {visaCategory && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-primary/5 text-primary border-primary/10 font-bold px-2 py-0.5"
                            >
                              {visaCategory}
                            </Badge>
                          )}
                          {isActive && (
                            <Badge className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50 font-semibold px-2 py-0.5">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Journey Details */}
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors line-clamp-1">
                        {journeyLabel(journey)}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mb-6">
                        Status: {journey.status.replace("_", " ")}
                      </p>
                    </div>

                    {/* Progress Bar & Footer */}
                    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <span>Checklist Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2 animate-pulse" />
                      <div className="flex items-center justify-end text-xs font-bold text-primary group-hover:translate-x-1 transition-transform pt-2">
                        <span>Open Vault</span>
                        <ChevronRight className="w-4 h-4 ml-1" />
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
      <div className="bg-slate-50/50 dark:bg-slate-950/50 mt-[55px]">
        {/* Top Professional Header */}
        <div className="bg-white dark:bg-slate-900 border-b shadow-sm sticky top-0 z-30">
          <div className="site-main-px py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {userJourneys.length > 1 && activeJourneyId ? (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setActiveJourneyId(null);
                      sessionStorage.removeItem(SESSION_KEY);
                    }}
                    className="h-12 w-12 p-0 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 shrink-0 flex items-center justify-center animate-in fade-in slide-in-from-left-2 duration-300"
                    title="Back to Journeys"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                ) : (
                  <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {t("documentVaultPage.page.title")}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge
                      variant="secondary"
                      className="bg-primary/5 hover:bg-primary/5 text-primary border-primary/20 font-bold px-2.5 py-0.5"
                    >
                      {config?.visaCategory
                        ? config.visaCategory
                        : activeJourney
                          ? journeyLabel(activeJourney)
                          : ""}
                    </Badge>
                    <span className="text-xs text-slate-500 font-medium">
                      {t("documentVaultPage.page.subtitle")}
                    </span>
                    {/* Case 3 Journey Switcher */}
                    {/* {userJourneys.length > 1 && (
                      <button
                        onClick={() => {
                          setActiveJourneyId(null);
                          sessionStorage.removeItem(SESSION_KEY);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/5 px-2 py-0.5 rounded-full border border-primary/20 transition-all duration-200 hover:scale-105 active:scale-95"
                        title="Switch to a different journey"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        Switch Journey
                      </button>
                    )} */}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* <Link href="/document-vault/guide" className="hidden sm:flex">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-semibold gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  {t("documentVaultPage.page.guide")}
                </Button>
              </Link> */}

                <NotificationBell />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto p-6 max-w-450">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Side: Stats & Configuration */}
            <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-24">
              {/* Professional Stats Card */}
              <Card className="overflow-hidden border-none shadow-xl bg-linear-to-br from-primary via-primary/95 to-primary/90 text-white p-0">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </div>
                      <span className="font-bold tracking-tight uppercase text-xs opacity-80">
                        {t("documentVaultPage.page.syncProgress")}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-white border-white/30 font-bold bg-white/10 backdrop-blur-sm"
                    >
                      {stats.percentComplete}%
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-2xl font-black mb-1">
                        <span>
                          {stats.uploaded} / {stats.total}
                        </span>
                        <span className="text-white/60 text-sm font-medium self-end mb-1">
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
                      <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                        <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mb-1">
                          {t("documentVaultPage.page.criticalMissing")}
                        </p>
                        <p
                          className={`text-xl font-black ${stats.missing > 0 ? "text-white" : "text-emerald-300"}`}
                        >
                          {stats.missing}
                        </p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                        <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mb-1">
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

                <div className="bg-black/10 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-300" />
                    <span className="text-[11px] font-semibold opacity-90">
                      {t("documentVaultPage.page.bankGradeEncryption")}
                    </span>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
                </div>
              </Card>

              {/* Config Panel */}
              {/* <div className="mb-4">
              <LiveConfigPanel />
            </div> */}

              {/* Mini Tips Card */}
              <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 shadow-sm">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-amber-900 dark:text-amber-100">
                      {t("documentVaultPage.page.nvcTipTitle")}
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-200 mt-1 leading-relaxed">
                      {t("documentVaultPage.page.nvcTipDesc")}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Side: Document Management Tabs */}
            <div className="lg:col-span-9">
              <Tabs defaultValue="required" className="w-full" onValueChange={setActiveTab}>
                <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 xl:mb-8 gap-4 xl:gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full xl:w-auto overflow-hidden">
                    <div className="w-full sm:w-auto overflow-x-auto no-scrollbar pb-2 sm:pb-0 -mb-2 sm:mb-0">
                      <TabsList className="bg-white dark:bg-slate-900 border shadow-sm h-11 p-1 rounded-xl shrink-0 inline-flex min-w-max">
                        {categories.slice(0, 5).map((cat) => (
                          <TabsTrigger
                            key={cat}
                            value={cat}
                            className="px-4 sm:px-6 rounded-lg font-bold text-xs data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
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
                                className="h-9 px-3 rounded-lg font-bold text-xs gap-1"
                              >
                                {t("documentVaultPage.page.more")}{" "}
                                <ChevronDown className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {categories.slice(5).map((cat) => (
                                <DropdownMenuItem key={cat} onClick={() => setActiveTab(cat)}>
                                  {cat === "optional" ? "Optional" : getCategoryDisplayName(cat, t)}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TabsList>
                    </div>

                    {/* Move View Switcher here next to tabs */}
                    <div className="flex bg-white dark:bg-slate-900 border shadow-sm p-1 rounded-xl h-11 shrink-0 self-start sm:self-auto">
                      <Button
                        variant={viewMode === "table" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("table")}
                        className={`h-9 px-3 rounded-lg ${viewMode === "table" ? "bg-slate-100 dark:bg-slate-800 shadow-inner" : ""}`}
                      >
                        <List className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className={`h-9 px-3 rounded-lg ${viewMode === "grid" ? "bg-slate-100 dark:bg-slate-800 shadow-inner" : ""}`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex w-full xl:max-w-md ml-0 xl:ml-auto">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder={t("documentVaultPage.page.searchPlaceholder")}
                        className="pl-10 h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-primary/20 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                          <CloseIcon className="w-3 h-3 text-slate-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6 xl:mb-8">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex flex-wrap items-center gap-2 sm:gap-3">
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
                        className="font-bold text-primary border-primary/20 bg-primary/5"
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
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-primary"
                                >
                                  <Info className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs p-3">
                                <p className="font-bold mb-2">Suggested Documents:</p>
                                <ul className="list-disc pl-4 space-y-1 text-xs">
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
                          className="h-8 px-2 gap-1 text-primary hover:bg-primary/10 font-bold"
                        >
                          <Plus className="w-4 h-4" />
                          Add New
                        </Button>
                      </div>
                    )}
                  </h2>
                </div>

                <TabsContent value={activeTab} className="mt-0 ring-offset-0 focus-visible:ring-0">
                  <ResultGate feature="document_vault">
                    <div className="space-y-6 sm:space-y-10">
                      {searchQuery ? (
                        // Show flat list of search results when searching
                        <div className="space-y-6">
                          <div className="flex items-center gap-3">
                            <div className="h-1 w-8 sm:w-12 bg-primary rounded-full shrink-0"></div>
                            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-400">
                              {t("documentVaultPage.page.foundPrefix")}{" "}
                              {flatFilteredDocuments.length}{" "}
                              {t("documentVaultPage.page.matchingDocuments")}
                            </h3>
                          </div>

                          {flatFilteredDocuments.length > 0 ? (
                            viewMode === "grid" ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                                {flatFilteredDocuments.map((doc) => {
                                  const uploadedDoc = uploadedDocuments.find(
                                    (ud) => ud.documentDefId === doc.id
                                  );
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
                                        uploadedDoc ? () => handleDelete(uploadedDoc.id) : undefined
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
                                documents={flatFilteredDocuments}
                                uploadedDocuments={uploadedDocuments}
                                onUpload={openUploadModal}
                                onPreview={handlePreview}
                                onDownload={handleDownload}
                                onDelete={handleDelete}
                                onExport={handleExportSingle}
                                onOpenWizard={openWizard}
                                onRename={renameDynamicSlot}
                              />
                            )
                          ) : (
                            <div className="text-center py-12 sm:py-20 px-4 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                              <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {t("documentVaultPage.page.noDocumentsFound")}
                              </h3>
                              <p className="text-slate-500 max-w-xs mx-auto mt-2">
                                {t("documentVaultPage.page.noDocumentsDescPrefix")}
                                {searchQuery}
                                {t("documentVaultPage.page.noDocumentsDescSuffix")}
                              </p>
                              <Button
                                variant="link"
                                className="mt-4 text-primary font-bold"
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
                              <div className="h-1 w-8 sm:w-12 bg-primary rounded-full shrink-0"></div>
                              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-400">
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
                                            className="h-6 w-6 p-0 text-slate-400 hover:text-primary"
                                          >
                                            <Info className="w-3.5 h-3.5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="max-w-xs p-3">
                                          <p className="font-bold mb-2 text-[11px]">
                                            Suggested Documents:
                                          </p>
                                          <ul className="list-disc pl-4 space-y-1 text-[10px]">
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
                                    className="h-7 px-2 gap-1 text-primary hover:bg-primary/10 font-bold text-[10px]"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add
                                  </Button>
                                </div>
                              )}
                            </div>

                            {viewMode === "grid" ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                                {docs.map((doc) => {
                                  const uploadedDoc = uploadedDocuments.find(
                                    (ud) => ud.documentDefId === doc.id
                                  );
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
                                        uploadedDoc ? () => handleDelete(uploadedDoc.id) : undefined
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
                                documents={docs}
                                uploadedDocuments={uploadedDocuments}
                                onUpload={openUploadModal}
                                onPreview={handlePreview}
                                onDownload={handleDownload}
                                onDelete={handleDelete}
                                onExport={handleExportSingle}
                                onOpenWizard={openWizard}
                                onRename={renameDynamicSlot}
                              />
                            )}
                          </div>
                        ))
                      ) : activeTab === "required" || activeTab === "optional" ? (
                        // Show required or optional documents when NOT searching
                        <div className="space-y-4">
                          {viewMode === "grid" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                              {getFilteredDocumentsForSpecialFilter[
                                activeTab as "required" | "optional"
                              ]?.map((doc) => {
                                const uploadedDoc = uploadedDocuments.find(
                                  (ud) => ud.documentDefId === doc.id
                                );
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
                                      uploadedDoc ? () => handleDownload(uploadedDoc.id) : undefined
                                    }
                                    onDelete={
                                      uploadedDoc ? () => handleDelete(uploadedDoc.id) : undefined
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
                            />
                          )}
                        </div>
                      ) : (
                        // Show specific category when NOT searching
                        <div className="space-y-4">
                          {viewMode === "grid" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                              {documentsByCategory[activeTab]?.map((doc) => {
                                const uploadedDoc = uploadedDocuments.find(
                                  (ud) => ud.documentDefId === doc.id
                                );
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
                                      uploadedDoc ? () => handleDownload(uploadedDoc.id) : undefined
                                    }
                                    onDelete={
                                      uploadedDoc ? () => handleDelete(uploadedDoc.id) : undefined
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
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </ResultGate>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Modals */}
        {selectedDoc && (
          <>
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
          />
        )}

        <Dialog open={welcomeModalOpen} onOpenChange={setWelcomeModalOpen}>
          <DialogContent className="max-w-md w-[95%] bg-white dark:bg-slate-900 border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
            <div className="relative p-8 flex flex-col items-center">
              {/* Decorative Background */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
              </div>

              {/* Icon */}
              <div className="relative z-10 w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 shadow-inner transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                <LayoutTemplate className="w-10 h-10 text-primary" />
              </div>

              {/* Text */}
              <h3 className="relative z-10 text-2xl text-center font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                Personalize Your Vault
              </h3>
              <p className="relative z-10 text-left text-slate-600 dark:text-slate-400 leading-relaxed text-[15px]">
                Your document checklist is currently showing a standard list of documents. To view
                the exact documents required for your specific situation, please complete these
                steps in your Journey roadmap:{" "}
              </p>

              <ul className="font-bold text-primary mb-8 text-left">
                <li> Chapter 1: Step 1 (Eligibility Check)</li>
                <li> Chapter 1: Step 2 (Checklist Personalization)</li>
              </ul>
              {/* Actions */}
              <div className="relative z-10 w-full space-y-3">
                <Link href={journeyRoadmapHref}>
                  {" "}
                  <Button
                    // onClick={() => router.push("/visa-category/ir-category/ir-1")}
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    Go to Journey Roadmap
                  </Button>
                </Link>
                <button
                  onClick={() => setWelcomeModalOpen(false)}
                  className="w-full h-12 rounded-2xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold text-sm transition-colors cursor-pointer"
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
      </div>
    </TooltipProvider>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { useRouter } from "next/navigation";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import {
  getDocumentsByCategory,
  getCategoryDisplayName,
} from "@/lib/document-vault/personalization-engine";
import { ALL_DOCUMENTS } from "@/lib/document-vault/document-definitions";
import type { UploadedDocument } from "@/lib/document-vault/types";
import { DocumentCard } from "@/app/components/document-vault/DocumentCard";
import { DocumentTableView } from "@/app/components/document-vault/DocumentTableView";
import { DocumentPreviewModal } from "@/app/components/document-vault/DocumentPreviewModal";
import { DocumentUploadModal } from "@/app/components/document-vault/DocumentUploadModal";
import { DocumentWizard } from "@/app/components/document-vault/DocumentWizard";
import { ConfigurationWizard } from "@/app/components/document-vault/ConfigurationWizard";
import { LiveConfigPanel } from "@/app/components/document-vault/LiveConfigPanel";
import { NotificationBell } from "@/app/components/document-vault/NotificationCenter";
import { NotificationTestPanel } from "@/app/components/document-vault/NotificationTestPanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import {
  Search,
  X as CloseIcon,
  ShieldCheck,
  BookOpen,
  ChevronDown,
  Download,
  Clock,
  Trash2,
  Zap,
  CheckCircle,
  AlertCircle,
  List,
  LayoutGrid,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function DocumentVaultPage() {
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
    notifications,
  } = useDocumentVaultStore();

  const [showConfigWizard, setShowConfigWizard] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter documents based on search query
  const filteredDocumentsByCategory = useMemo(() => {
    if (!config) return {};
    const baseDocs = getDocumentsByCategory(config, true);
    if (!searchQuery.trim()) return baseDocs;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, typeof ALL_DOCUMENTS> = {};

    Object.entries(baseDocs).forEach(([category, docs]) => {
      const filteredDocs = docs.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query) ||
          doc.description?.toLowerCase().includes(query),
      );
      if (filteredDocs.length > 0) {
        filtered[category] = filteredDocs;
      }
    });

    return filtered;
  }, [config, searchQuery]);

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
          (ud.status === "UPLOADED" || ud.status === "NEEDS_ATTENTION"),
      ),
    ).length;

    // A document is missing only if no version exists at all
    const missing = mandatoryDocs.filter(
      (rd) => !uploadedDocuments.some((ud) => ud.documentDefId === rd.id),
    ).length;

    const expiring = uploadedDocuments.filter(
      (d) => d.status === "NEEDS_ATTENTION",
    ).length;

    const expired = uploadedDocuments.filter(
      (d) => d.status === "EXPIRED",
    ).length;

    return {
      total,
      uploaded,
      missing,
      expiring,
      expired,
      percentComplete: total > 0 ? Math.round((uploaded / total) * 100) : 0,
    };
  }, [uploadedDocuments, requiredDocuments]);
  const documentsByCategory = useMemo(
    () => (config ? getDocumentsByCategory(config, true) : {}),
    [config],
  );

  const flatFilteredDocuments = useMemo(() => {
    return Object.values(filteredDocumentsByCategory).flat();
  }, [filteredDocumentsByCategory]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
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
        });
    }
  }, [user, authLoading, router, initialized, initialize, t]);

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
    return ["all", ...cats];
  }, [filteredDocumentsByCategory]);

  if (authLoading || isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="md" />
      </div>
    );
  }

  if (!user) return null;

  if ((!config && initialized) || showConfigWizard) {
    return (
      <ConfigurationWizard
        userId={user.id}
        onComplete={() => {
          setShowConfigWizard(false);
          setInitialized(false); // Reset to trigger re-initialization
        }}
      />
    );
  }

  const selectedDoc = selectedDocumentDefId
    ? ALL_DOCUMENTS.find((d) => d.id === selectedDocumentDefId)
    : undefined;

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
        response.headers
          .get("content-disposition")
          ?.split("filename=")[1]
          ?.replace(/"/g, "") || "document";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(t("documentVaultPage.page.messages.downloaded"));
    } catch (error) {
      console.error("Download error:", error);
      toast.error(t("documentVaultPage.page.messages.downloadFailed"));
    }
  };

  const handleExportSingle = async (
    documentId: string,
    hasCompressed: boolean,
  ) => {
    try {
      toast.info(
        hasCompressed
          ? t("documentVaultPage.page.messages.preparingZip")
          : t("documentVaultPage.page.messages.preparingExport"),
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

      toast.success(
        hasCompressed
          ? t("documentVaultPage.page.messages.zipExported")
          : t("documentVaultPage.page.messages.documentExported"),
      );
    } catch (error) {
      console.error("Export error:", error);
      toast.error(t("documentVaultPage.page.messages.exportFailed"));
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm(t("documentVaultPage.page.messages.deleteConfirm"))) return;

    try {
      toast.loading(t("documentVaultPage.page.messages.deleting"), {
        id: "delete-doc",
      });
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      // Reload all data from database to ensure store is in sync
      if (user) {
        await initialize(user.id, t);
      }

      toast.success(t("documentVaultPage.page.messages.deleted"), {
        id: "delete-doc",
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(t("documentVaultPage.page.messages.deleteFailed"), {
        id: "delete-doc",
      });
    }
  };

  const handlePreview = (uploadedDoc: UploadedDocument) => {
    setPreviewDoc(uploadedDoc);
    setPreviewOpen(true);
  };

  const handleExport = async () => {
    try {
      toast.info(t("documentVaultPage.page.messages.preparingExport"));
      const response = await fetch(
        "/api/documents/export?structureByCategory=true",
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `document-vault-export-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(t("documentVaultPage.page.messages.exportCompleted"));
    } catch (error) {
      console.error("Export error:", error);
      toast.error(t("documentVaultPage.page.messages.exportAllFailed"));
    }
  };

  const handleDeleteAll = async () => {
    if (
      !confirm(t("documentVaultPage.page.messages.deleteAllConfirmWarning"))
    ) {
      return;
    }

    if (!confirm(t("documentVaultPage.page.messages.deleteAllFinalConfirm"))) {
      return;
    }

    try {
      toast.loading(t("documentVaultPage.page.messages.deletingAll"), {
        id: "delete-all",
      });

      // Get all uploaded document IDs
      const documentIds = uploadedDocuments.map((doc) => doc.id);

      // Delete each document
      let deleted = 0;
      for (const docId of documentIds) {
        const response = await fetch(`/api/documents/${docId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          deleted++;
        }
      }

      toast.success(
        t("documentVaultPage.page.messages.deletedAllSuccess").replace(
          "{{count}}",
          deleted.toString(),
        ),
        {
          id: "delete-all",
        },
      );

      // Reload data
      if (user) {
        await initialize(user.id, t);
      }
    } catch (error) {
      console.error("Delete all error:", error);
      toast.error(t("documentVaultPage.page.messages.deleteAllFailed"), {
        id: "delete-all",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 pb-20">
      {/* Top Professional Header */}
      <div className="bg-white dark:bg-slate-900 border-b shadow-sm sticky top-0 z-30">
        <div className="container mx-auto px-6 py-4 max-w-[1800px]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {t("documentVaultPage.page.title")}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className="bg-primary/5 hover:bg-primary/5 text-primary border-primary/20 font-bold px-2.5 py-0.5"
                  >
                    {config?.visaCategory &&
                      t(
                        `documentVaultPage.visaCategories.${config.visaCategory}`,
                      )}
                  </Badge>
                  <span className="text-xs text-slate-500 font-medium">
                    {t("documentVaultPage.page.subtitle")}
                  </span>
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
            <div className="mb-4">
              <LiveConfigPanel />
            </div>

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
            <Tabs
              defaultValue="all"
              className="w-full"
              onValueChange={setActiveTab}
            >
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
                            : t(`documentVaultPage.categories.${cat}`).split(
                                " ",
                              )[0]}
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
                              <DropdownMenuItem
                                key={cat}
                                onClick={() => setActiveTab(cat)}
                              >
                                {t(`documentVaultPage.categories.${cat}`)}
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
                      placeholder={t(
                        "documentVaultPage.page.searchPlaceholder",
                      )}
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
                    : t(`documentVaultPage.categories.${activeTab}`)}
                  {searchQuery && (
                    <Badge
                      variant="outline"
                      className="font-bold text-primary border-primary/20 bg-primary/5"
                    >
                      {t("documentVaultPage.page.searchPrefix")}
                      {searchQuery}
                    </Badge>
                  )}
                </h2>
              </div>

              <TabsContent
                value={activeTab}
                className="mt-0 ring-offset-0 focus-visible:ring-0"
              >
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
                                (ud) => ud.documentDefId === doc.id,
                              );
                              return (
                                <DocumentCard
                                  key={doc.id}
                                  documentDef={doc}
                                  uploadedDoc={uploadedDoc}
                                  onUpload={() => openUploadModal(doc.id)}
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
                                            uploadedDoc.hasCompressedVersion ||
                                              false,
                                          )
                                      : undefined
                                  }
                                  onOpenWizard={() => openWizard(doc.id)}
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
                    Object.entries(documentsByCategory).map(
                      ([category, docs]) => (
                        <div key={category} className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="h-1 w-8 sm:w-12 bg-primary rounded-full shrink-0"></div>
                            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-400">
                              {getCategoryDisplayName(category, t)}
                            </h3>
                          </div>

                          {viewMode === "grid" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                              {docs.map((doc) => {
                                const uploadedDoc = uploadedDocuments.find(
                                  (ud) => ud.documentDefId === doc.id,
                                );
                                return (
                                  <DocumentCard
                                    key={doc.id}
                                    documentDef={doc}
                                    uploadedDoc={uploadedDoc}
                                    onUpload={() => openUploadModal(doc.id)}
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
                                              uploadedDoc.hasCompressedVersion ||
                                                false,
                                            )
                                        : undefined
                                    }
                                    onOpenWizard={() => openWizard(doc.id)}
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
                            />
                          )}
                        </div>
                      ),
                    )
                  ) : (
                    // Show specific category when NOT searching
                    <div className="space-y-4">
                      {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                          {documentsByCategory[activeTab]?.map((doc) => {
                            const uploadedDoc = uploadedDocuments.find(
                              (ud) => ud.documentDefId === doc.id,
                            );
                            return (
                              <DocumentCard
                                key={doc.id}
                                documentDef={doc}
                                uploadedDoc={uploadedDoc}
                                onUpload={() => openUploadModal(doc.id)}
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
                                          uploadedDoc.hasCompressedVersion ||
                                            false,
                                        )
                                    : undefined
                                }
                                onOpenWizard={() => openWizard(doc.id)}
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
                        />
                      )}
                    </div>
                  )}
                </div>
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
            onUploadComplete={async () => {
              // Reload all data from database
              if (user) {
                await initialize(user.id, t);
              }
            }}
          />

          <DocumentWizard
            open={wizardOpen}
            onClose={closeWizard}
            documentDef={selectedDoc}
          />

          {/* Testing Panel - only shows in development */}
          <NotificationTestPanel />
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
            ALL_DOCUMENTS.find((d) => d.id === previewDoc.documentDefId)!
          }
          uploadedDoc={previewDoc}
        />
      )}
    </div>
  );
}

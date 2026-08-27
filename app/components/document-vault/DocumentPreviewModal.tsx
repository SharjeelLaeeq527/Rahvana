"use client";

import { DocumentDefinition, UploadedDocument } from "@/lib/document-vault/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useLanguage } from "@/app/context/LanguageContext";
import { ALL_DOCUMENTS } from "@/lib/document-vault/document-definitions";

interface DocumentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  documentDef: DocumentDefinition;
  uploadedDoc: UploadedDocument;
  allUploadedDocs?: UploadedDocument[];
}

export function DocumentPreviewModal({
  open,
  onClose,
  documentDef,
  uploadedDoc,
  allUploadedDocs = [],
}: DocumentPreviewModalProps) {
  const [zoom, setZoom] = useState(100);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const [activeDoc, setActiveDoc] = useState<UploadedDocument>(uploadedDoc);

  // Sync activeDoc if prop changes
  useEffect(() => {
    if (open && uploadedDoc) {
      setActiveDoc(uploadedDoc);
    }
  }, [open, uploadedDoc]);

  // Deduplicate allUploadedDocs by storagePath (or id as fallback) to prevent any double-rendering/duplication bugs
  const uniqueUploadedDocs = useMemo(() => {
    if (!allUploadedDocs) return [];
    const seen = new Set<string>();
    return allUploadedDocs.filter((d) => {
      if (!d) return false;
      const key = d.storagePath || d.id;
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [allUploadedDocs]);

  // Find the index of activeDoc in uniqueUploadedDocs
  const activeIndex = useMemo(() => {
    if (!uniqueUploadedDocs || uniqueUploadedDocs.length === 0) return -1;
    return uniqueUploadedDocs.findIndex((d) => d.id === activeDoc.id);
  }, [uniqueUploadedDocs, activeDoc]);

  const currentDef = useMemo(() => {
    if (activeDoc && activeDoc.documentDefId !== documentDef.id) {
      const found = ALL_DOCUMENTS.find((d) => d.id === activeDoc.documentDefId);
      if (found) return found;
    }
    return documentDef;
  }, [documentDef, activeDoc]);

  const displayTitle = useMemo(() => {
    const categoryName =
      t(`documentVaultPage.documents.${currentDef.id}.name`) !==
      `documentVaultPage.documents.${currentDef.id}.name`
        ? t(`documentVaultPage.documents.${currentDef.id}.name`)
        : currentDef.name;

    let baseTitle = categoryName;

    // If it's a multi-upload document, the specific type is stored in notes
    if (activeDoc?.notes?.startsWith("Type: ")) {
      const specificType = activeDoc.notes.split("\n")[0].replace("Type: ", "").trim();
      baseTitle = `${specificType} / ${categoryName}`;
    }

    if (uniqueUploadedDocs && uniqueUploadedDocs.length > 1 && activeIndex !== -1) {
      baseTitle = `${baseTitle} (${activeIndex + 1} of ${uniqueUploadedDocs.length})`;
    }

    return baseTitle;
  }, [currentDef, activeDoc, t, uniqueUploadedDocs, activeIndex]);

  // Load document when activeDoc changes
  useEffect(() => {
    if (open && activeDoc) {
      loadDocument();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeDoc]);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setPreviewUrl((prev) => {
        if (prev && prev.startsWith("blob:")) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });
      setZoom(100);
      setIsLoading(false);
    }
  }, [open]);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const loadDocument = async () => {
    if (!activeDoc) return;
    setIsLoading(true);
    try {
      if (activeDoc.storagePath.startsWith("http")) {
        setPreviewUrl(activeDoc.storagePath);
        setIsLoading(false);
        return;
      }

      // Direct URL is required for PDFs because browsers block blob: URLs in iframes due to security sandboxing
      const isPdfDoc = activeDoc.mimeType?.toLowerCase() === "application/pdf";
      if (isPdfDoc) {
        setPreviewUrl((prev) => {
          if (prev && prev.startsWith("blob:")) {
            URL.revokeObjectURL(prev);
          }
          return `/api/documents/${activeDoc.id}/preview`;
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/documents/${activeDoc.id}/preview`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl((prev) => {
        if (prev && prev.startsWith("blob:")) {
          URL.revokeObjectURL(prev);
        }
        return url;
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to load document:", error);
      setIsLoading(false);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));

  const handlePrev = () => {
    if (uniqueUploadedDocs && activeIndex > 0) {
      setActiveDoc(uniqueUploadedDocs[activeIndex - 1]);
    }
  };

  const handleNext = () => {
    if (uniqueUploadedDocs && activeIndex < uniqueUploadedDocs.length - 1) {
      setActiveDoc(uniqueUploadedDocs[activeIndex + 1]);
    }
  };

  const isPdf = activeDoc?.mimeType === "application/pdf";
  const isImage = activeDoc?.mimeType?.startsWith("image/");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] sm:h-[85vh] p-0 overflow-hidden sm:rounded-xl flex flex-col gap-0">
        {/* Screen reader accessible title */}
        <DialogTitle className="sr-only">{displayTitle}</DialogTitle>

        {/* Header with Title */}
        <div className="relative z-20 p-4 sm:p-6 border-b bg-slate-50 dark:bg-slate-900 flex justify-between items-center gap-4 shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold line-clamp-1">{displayTitle}</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full shrink-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">{t("documentVaultPage.components.previewModal.close")}</span>
          </Button>
        </div>

        {/* Preview Content */}
        <div className="relative flex-1 overflow-auto bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
          {isLoading && (
            <div className="text-center">
              <Loader size="md" text={t("documentVaultPage.components.previewModal.loading")} />
            </div>
          )}

          {!isLoading && previewUrl && (
            <>
              {isPdf && (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0 bg-white animate-in fade-in duration-300"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "center center",
                  }}
                  title={displayTitle}
                />
              )}

              {isImage && (
                <Image
                  src={previewUrl}
                  alt={displayTitle}
                  width={800}
                  height={600}
                  className="max-w-full max-h-full object-contain shadow-lg transition-transform duration-200 animate-in fade-in duration-300"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "center center",
                  }}
                  unoptimized
                />
              )}

              {!isPdf && !isImage && (
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-muted-foreground text-lg mb-2">{displayTitle}</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("documentVaultPage.components.previewModal.fileType")}
                    {activeDoc.mimeType || t("documentVaultPage.components.previewModal.unknown")}
                  </p>
                  <Button
                    onClick={() => window.open(`/api/documents/${activeDoc.id}/download`, "_blank")}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t("documentVaultPage.components.previewModal.downloadToView")}
                  </Button>
                </div>
              )}

              {/* Navigation controls */}
              {uniqueUploadedDocs.length > 1 && activeIndex !== -1 && (
                <>
                  <button
                    disabled={activeIndex === 0}
                    onClick={handlePrev}
                    className="absolute left-4 z-30 p-2 sm:p-3 rounded-full bg-black/45 hover:bg-black/60 text-white disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 shadow-md backdrop-blur-xs flex items-center justify-center border border-white/10 hover:scale-105 active:scale-95"
                    title="Previous document"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
                  </button>

                  <button
                    disabled={activeIndex === uniqueUploadedDocs.length - 1}
                    onClick={handleNext}
                    className="absolute right-4 z-30 p-2 sm:p-3 rounded-full bg-black/45 hover:bg-black/60 text-white disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 shadow-md backdrop-blur-xs flex items-center justify-center border border-white/10 hover:scale-105 active:scale-95"
                    title="Next document"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer with Zoom controls */}
        {!isLoading && previewUrl && (isPdf || isImage) && (
          <div className="flex items-center justify-center gap-2 p-4 border-t bg-slate-50 dark:bg-slate-900 shrink-0">
            <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">{zoom}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

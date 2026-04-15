"use client";

import {
  DocumentDefinition,
  UploadedDocument,
} from "@/lib/document-vault/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut, X } from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useLanguage } from "@/app/context/LanguageContext";

interface DocumentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  documentDef: DocumentDefinition;
  uploadedDoc: UploadedDocument;
}

export function DocumentPreviewModal({
  open,
  onClose,
  documentDef,
  uploadedDoc,
}: DocumentPreviewModalProps) {
  const [zoom, setZoom] = useState(100);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const displayTitle = useMemo(() => {
    const categoryName =
      t(`documentVaultPage.documents.${documentDef.id}.name`) !==
      `documentVaultPage.documents.${documentDef.id}.name`
        ? t(`documentVaultPage.documents.${documentDef.id}.name`)
        : documentDef.name;

    // If it's a multi-upload document, the specific type is stored in notes
    if (uploadedDoc?.notes?.startsWith("Type: ")) {
      const specificType = uploadedDoc.notes
        .split("\n")[0]
        .replace("Type: ", "")
        .trim();
      return `${specificType} / ${categoryName}`;
    }

    return categoryName;
  }, [documentDef, uploadedDoc, t]);

  // Load document when modal opens
  useEffect(() => {
    if (open && uploadedDoc) {
      loadDocument();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setPreviewUrl(null);
      setZoom(100);
      setIsLoading(false);
    }
  }, [open]);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const loadDocument = async () => {
    setIsLoading(true);
    try {
      if (uploadedDoc.storagePath.startsWith("http")) {
        setPreviewUrl(uploadedDoc.storagePath);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/documents/${uploadedDoc.id}/preview`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to load document:", error);
      setIsLoading(false);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));

  const isPdf = uploadedDoc.mimeType === "application/pdf";
  const isImage = uploadedDoc.mimeType?.startsWith("image/");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] sm:h-[85vh] p-0 overflow-hidden sm:rounded-xl flex flex-col gap-0">
        {/* Screen reader accessible title */}
        <DialogTitle className="sr-only">{displayTitle}</DialogTitle>

        {/* Header with Title */}
        <div className="relative z-20 p-4 sm:p-6 border-b bg-slate-50 dark:bg-slate-900 flex justify-between items-center gap-4 shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold line-clamp-1">
            {displayTitle}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full shrink-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">
              {t("documentVaultPage.components.previewModal.close")}
            </span>
          </Button>
        </div>

        {/* Preview Content */}
        <div className="relative flex-1 overflow-auto bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
          {isLoading && (
            <div className="text-center">
              <Loader
                size="md"
                text={t("documentVaultPage.components.previewModal.loading")}
              />
            </div>
          )}

          {!isLoading && previewUrl && (
            <>
              {isPdf && (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0 bg-white"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "center center",
                  }}
                  title={displayTitle}
                />
              )}

              {isImage && (
                <div
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "center center",
                  }}
                >
                  <Image
                    src={previewUrl}
                    alt={displayTitle}
                    width={800}
                    height={600}
                    className="max-w-full max-h-full object-contain shadow-lg"
                    unoptimized
                  />
                </div>
              )}

              {!isPdf && !isImage && (
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-muted-foreground text-lg mb-2">
                    {displayTitle}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("documentVaultPage.components.previewModal.fileType")}
                    {uploadedDoc.mimeType ||
                      t("documentVaultPage.components.previewModal.unknown")}
                  </p>
                  <Button
                    onClick={() =>
                      window.open(
                        `/api/documents/${uploadedDoc.id}/download`,
                        "_blank",
                      )
                    }
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t(
                      "documentVaultPage.components.previewModal.downloadToView",
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with Zoom controls (only for PDF) */}
        {!isLoading && previewUrl && isPdf && (
          <div className="flex items-center justify-center gap-2 p-4 border-t bg-slate-50 dark:bg-slate-900 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">
              {zoom}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

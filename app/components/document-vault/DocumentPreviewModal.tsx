"use client";

import {
  DocumentDefinition,
  UploadedDocument,
} from "@/lib/document-vault/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut, Loader2, X } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

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
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full p-0 overflow-hidden sm:rounded-xl">
        {/* Screen reader accessible title */}
        <DialogTitle className="sr-only">{documentDef.name}</DialogTitle>

        {/* Header with Title */}
        <div className="p-4 sm:p-6 border-b bg-slate-50 dark:bg-slate-900 flex justify-between items-center gap-4">
          <h2 className="text-lg sm:text-xl font-semibold line-clamp-1">
            {documentDef.name}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full shrink-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Preview Content */}
        <div className="relative overflow-auto bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 min-h-[50vh] h-[60vh] sm:h-[600px]">
          {isLoading && (
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Loading preview...
              </p>
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
                  title={documentDef.name}
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
                    alt={documentDef.name}
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
                    {documentDef.name}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    File type: {uploadedDoc.mimeType || "Unknown"}
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
                    Download to View
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with Zoom controls (only for PDF) */}
        {!isLoading && previewUrl && isPdf && (
          <div className="flex items-center justify-center gap-2 p-4 border-t bg-slate-50 dark:bg-slate-900">
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

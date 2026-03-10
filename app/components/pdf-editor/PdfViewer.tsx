"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePDFStore, type ShapeType } from "@/lib/store";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DraggableTextPro from "./text/DraggableTextPro";
import DraggableShape from "./shapes/DraggableShape";
import DraggableSignature from "./signature/DraggableSignature";
import ShapeFormattingToolbar from "./shapes/ShapeFormattingToolbar";
import { useLanguage } from "@/app/context/LanguageContext";

import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import type { TextFormat } from "./text/TextFormattingToolbar";

let pdfjsLib: typeof import("pdfjs-dist") | null = null;

async function initPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  pdfjsLib = pdfjs;
  return pdfjs;
}

export function PDFViewer({
  activeTool,
  signature,
  isSignatureFloating,
  setIsSignatureFloating,
  textFormat,
  selectedShape,
  isShapeFloating,
  setIsShapeFloating,
  onExitAddText,
  selectedAnnotationId,
  onSelectAnnotation,
}: {
  activeTool: "text" | "signature" | "shapes" | null;
  inputText: string;
  setInputText: (text: string) => void;
  signature: string | null;
  isSignatureFloating: boolean;
  setIsSignatureFloating: (v: boolean) => void;
  textFormat?: TextFormat;
  selectedShape?: ShapeType | null;
  isShapeFloating?: boolean;
  setIsShapeFloating?: (v: boolean) => void;
  onExitAddText?: () => void;
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string | null) => void;
}) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState(1.5);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const [fitMode, setFitMode] = useState<"width" | "height">("width");

  const {
    currentPage,
    setCurrentPage,
    pdfFile,
    totalPages,
    annotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    signatureAnnotations,
    addSignatureAnnotation,
    updateSignatureAnnotation,
    deleteSignatureAnnotation,
    shapeAnnotations,
    addShapeAnnotation,
    updateShapeAnnotation,
    deleteShapeAnnotation,
    pageModifications,
    setTotalPages,
  } = usePDFStore();

  const actualTotalPages = pageModifications.length > 0
    ? pageModifications.filter((mod) => !mod.deleted).length
    : totalPages;

  const getCurrentPageInfo = () => {
    if (pageModifications.length === 0) return { originalIndex: currentPage, rotation: 0 };
    const activePages = pageModifications.filter((mod) => !mod.deleted);
    if (currentPage >= activePages.length) return { originalIndex: 0, rotation: 0 };
    const pageMod = activePages[currentPage];
    return { originalIndex: pageMod.originalIndex, rotation: pageMod.rotation };
  };

  // Load PDF
  useEffect(() => {
    if (!pdfFile) return;
    const loadPdf = async () => {
      try {
        const pdfjs = await initPdfJs();
        const loadedPdf = await pdfjs.getDocument(await pdfFile.arrayBuffer()).promise;
        setPdfDoc(loadedPdf);
        setTotalPages(loadedPdf.numPages);
      } catch (error: unknown) {
        // Handle RenderingCancelledException gracefully
        if (error instanceof Error && error.name !== "RenderingCancelledException") {
          console.error("Error loading PDF:", error);
        }
      }
    };
    loadPdf();
  }, [pdfFile, setTotalPages]);

  // Render Page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let renderTask: RenderTask | null = null;
    let cancelled = false;

    const renderPage = async () => {
      try {
        setIsLoading(true);
        const pageInfo = getCurrentPageInfo();
        const page = await pdfDoc.getPage(pageInfo.originalIndex + 1);
        if (cancelled) return;

        const viewport = page.getViewport({ scale, rotation: pageInfo.rotation });
        
        // Store original page dimensions
        const originalViewport = page.getViewport({ scale: 1, rotation: pageInfo.rotation });
        setPageWidth(originalViewport.width);
        setPageHeight(originalViewport.height);

        const canvas = canvasRef.current!;
        const context = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (renderTask) {
          try {
            renderTask.cancel();
          } catch {
            // Ignore cancellation errors
          }
        }
        
        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;

        if (!cancelled) setIsLoading(false);
      } catch (error: unknown) {
        // Handle RenderingCancelledException gracefully
        if (error instanceof Error && error.name === "RenderingCancelledException") {
          console.warn("Page rendering was cancelled");
        } else {
          console.error("Error rendering page:", error);
        }
        if (!cancelled) setIsLoading(false);
      }
    };

    renderPage();
    return () => {
      cancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // Ignore cancellation errors on cleanup
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, currentPage, scale, pageModifications]);

  // Move floating signature/shape
  useEffect(() => {
    if ((!isSignatureFloating && !isShapeFloating) || !overlayRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCursorPos({ x, y });
    };

    const overlay = overlayRef.current;
    overlay.addEventListener("mousemove", handleMouseMove);
    return () => overlay.removeEventListener("mousemove", handleMouseMove);
  }, [isSignatureFloating, isShapeFloating]);

  // Zoom with CTRL + scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale((prev) => Math.max(0.08, Math.min(6, prev + delta)));
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  // Click to place text/signature/shape
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;

    if (!activeTool) {
      onSelectAnnotation(null);
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    if (activeTool === "text") {
      const id = Date.now().toString();
      addAnnotation({
        id,
        text: t("pdfProcessing.editor.viewer.insertText"),
        x,
        y,
        fontSize: textFormat?.size || 14,
        pageIndex: currentPage,
        color: textFormat?.color || "#000000",
        font: textFormat?.font || "Arial",
        bold: textFormat?.bold || false,
        italic: textFormat?.italic || false,
        underline: textFormat?.underline || false,
        align: textFormat?.align || "left",
        bgColor: textFormat?.bgColor || "transparent",
        opacity: textFormat?.opacity || 100,
        rotation: 0,
        width: 150,
        height: 50,
      });
      onExitAddText?.();
      onSelectAnnotation(id);

    } else if (activeTool === "signature" && signature && isSignatureFloating) {
      addSignatureAnnotation({
        id: Date.now().toString(),
        image: signature,
        x,
        y,
        width: 150,
        height: 60,
        pageIndex: currentPage,
        rotation: 0,
      });
      setIsSignatureFloating(false);
      onExitAddText?.();

    } else if (activeTool === "shapes" && selectedShape && isShapeFloating) {
      const id = Date.now().toString();
      addShapeAnnotation({
        id,
        type: selectedShape,
        x,
        y,
        size: 12,
        color: "#000000",
        pageIndex: currentPage,
        rotation: 0,
      });
      setIsShapeFloating?.(false);
      onExitAddText?.();
      onSelectAnnotation(id);
    }
  };

  // Get selected shape (for toolbar)
  const selectedShapeObj = shapeAnnotations.find((s) => s.id === selectedAnnotationId) || null;

  return (
    <div className="flex flex-col h-full">

      {/* Top Toolbar */}
      <div className="flex items-center justify-between bg-white border-b px-4 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <Button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{currentPage + 1} / {actualTotalPages}</span>
          <Button onClick={() => setCurrentPage(Math.min(actualTotalPages - 1, currentPage + 1))} disabled={currentPage === actualTotalPages - 1} variant="ghost" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setScale((p) => Math.max(0.08, p - 0.2))} variant="ghost" size="sm">
            <ZoomOut className="h-4 w-4" />
          </Button>

          <Button 
            onClick={() => {
              if (containerRef.current) {
                if (fitMode === "width" && pageWidth) {
                  const containerWidth = containerRef.current.clientWidth - 32;
                  setScale(containerWidth / pageWidth);
                  setFitMode("height");
                } else if (fitMode === "height" && pageHeight) {
                  const containerHeight = containerRef.current.clientHeight - 32;
                  setScale(containerHeight / pageHeight);
                  setFitMode("width");
                }
              }
            }}
            variant="outline" 
            size="sm"
            title={fitMode === "width" ? t("pdfProcessing.editor.viewer.fitWidthOpt") : t("pdfProcessing.editor.viewer.fitHeightOpt")}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>

          <Button onClick={() => setScale((p) => Math.min(6, p + 0.2))} variant="ghost" size="sm">
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Zoom Dropdown */}
          <select
            value={scale}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "fitWidth" && containerRef.current && pageWidth) {
                const containerWidth = containerRef.current.clientWidth - 32;
                setScale(containerWidth / pageWidth);
              } else if (val === "fitHeight" && containerRef.current && pageHeight) {
                const containerHeight = containerRef.current.clientHeight - 32;
                setScale(containerHeight / pageHeight);
              } else {
                setScale(Number(val));
              }
            }}
            className="text-sm border rounded px-2 py-1 bg-white"
          >
            <option value={0.5}>50%</option>
            <option value={0.75}>75%</option>
            <option value={1}>{t("pdfProcessing.editor.viewer.actual")}</option>
            <option value={1.25}>125%</option>
            <option value={1.5}>150%</option>
            <option value={2}>200%</option>
            <option value={3}>300%</option>
            <option value="fitWidth">{t("pdfProcessing.editor.viewer.fitWidth")}</option>
            <option value="fitHeight">{t("pdfProcessing.editor.viewer.fitHeight")}</option>
          </select>
        </div>
      </div>

      {/* PDF Viewer */}
      <div ref={containerRef} className="flex-1 flex justify-center items-start overflow-auto bg-gray-100 p-4">
        
        {isLoading && (
          <div className="absolute top-1/2 left-1/2 text-gray-500 -translate-x-1/2 -translate-y-1/2 z-50">
            {t("pdfProcessing.editor.viewer.loading")}
          </div>
        )}

        <div className="relative inline-block" ref={overlayRef}>
          <canvas ref={canvasRef} className="shadow-lg bg-white z-0" />

          <div
            className="absolute inset-0 z-10"
            style={{
              cursor:
                activeTool === "text"
                  ? "crosshair"
                  : activeTool === "signature" && isSignatureFloating
                  ? "crosshair"
                  : activeTool === "shapes" && isShapeFloating
                  ? "crosshair"
                  : "default",
            }}
            onClick={handleOverlayClick}
          >
            {/* Text Annots */}
            {annotations
              .filter((ann) => ann.pageIndex === currentPage)
              .map((ann) => (
                <DraggableTextPro
                  key={ann.id}
                  data={ann}
                  onUpdate={updateAnnotation}
                  onDelete={deleteAnnotation}
                  scale={scale}
                  onSelect={onSelectAnnotation}
                  isSelected={selectedAnnotationId === ann.id}
                />
              ))}

            {/* Signature Annots */}
            {signatureAnnotations
              .filter((sig) => sig.pageIndex === currentPage)
              .map((sig) => (
                <DraggableSignature
                  key={sig.id}
                  data={sig}
                  onUpdate={updateSignatureAnnotation}
                  onDelete={deleteSignatureAnnotation}
                  onSelect={onSelectAnnotation}
                  scale={scale}
                  isSelected={selectedAnnotationId === sig.id}
                />
              ))}

            {/* Shape Annots */}
            {shapeAnnotations
              .filter((shape) => shape.pageIndex === currentPage)
              .map((shape) => (
                <DraggableShape
                  key={shape.id}
                  data={shape}
                  onUpdate={updateShapeAnnotation}
                  onDelete={deleteShapeAnnotation}
                  scale={scale}
                  isSelected={selectedAnnotationId === shape.id}
                  onSelect={onSelectAnnotation}
                />
              ))}

            {/* Floating Signature */}
            {isSignatureFloating && signature && cursorPos && (
              <div
                className="absolute pointer-events-none opacity-70"
                style={{
                  left: `${cursorPos.x - 75 * scale}px`,
                  top: `${cursorPos.y - 30 * scale}px`,
                  width: `${150 * scale}px`,
                  height: `${60 * scale}px`,
                }}
              >
                <Image src={signature} alt="sig" fill className="object-contain" unoptimized />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shape Toolbar */}
      {selectedShapeObj && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-9999">
          <ShapeFormattingToolbar
            shape={selectedShapeObj}
            onUpdate={updateShapeAnnotation}
          />
        </div>
      )}
    </div>
  );
}

export default PDFViewer;
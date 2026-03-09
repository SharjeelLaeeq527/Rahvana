"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import {
  usePDFStore,
  type ShapeAnnotation,
  type TextAnnotation,
  type ShapeType,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Download, LayoutGrid, Type, Stamp, Check } from "lucide-react";
import ShapeFormattingToolbar from "./shapes/ShapeFormattingToolbar";
import SignatureTool from "./signature/SignatureTool";
import { useLanguage } from "@/app/context/LanguageContext";
import { OrganizePagesModal } from "./pages/OrganizePagesModal";
import { EditTextModal } from "./text/EditTextModal";
import { createEditedPDF, downloadPDF } from "@/lib/pdf-utils";
import {
  TextFormattingToolbar,
  TextFormat,
} from "./text/TextFormattingToolbar";
import { Square, X } from "lucide-react";
// Dynamic Components
const PDFViewer = dynamic(
  () => import("./PdfViewer").then((m) => m.PDFViewer),
  { ssr: false },
);
const PDFThumbnails = dynamic(
  () => import("./PdfThumbnails").then((m) => m.PDFThumbnails),
  { ssr: false },
);

export function PDFEditor() {
  const { t } = useLanguage();
  const [activeTool, setActiveTool] = useState<
    "text" | "signature" | "shapes" | null
  >(null);
  const [inputText, setInputText] = useState("");
  const [signature, setSignature] = useState<string | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isSignatureFloating, setIsSignatureFloating] = useState(false);

  const [showOrganizeModal, setShowOrganizeModal] = useState(false);
  const [showEditTextModal, setShowEditTextModal] = useState(false);

  const [showShapesDropdown, setShowShapesDropdown] = useState(false);

  const [selectedShape, setSelectedShape] = useState<ShapeType | null>(null);
  const [isShapeFloating, setIsShapeFloating] = useState(false);

  // === SELECTION STATE ===
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<
    string | null
  >(null);

  // === UI STATE ===
  const [showSidebar, setShowSidebar] = useState(true);

  // === DEFAULT FORMAT (For New Text) ===
  const [defaultTextFormat, setDefaultTextFormat] = useState<TextFormat>({
    font: "Arial",
    size: 18,
    color: "#000000",
    bgColor: "transparent",
    opacity: 100,
    bold: false,
    italic: false,
    underline: false,
    align: "left",
  });

  const {
    pdfFile,
    annotations,
    updateAnnotation,
    signatureAnnotations,
    shapeAnnotations,
    updateShapeAnnotation,
    addShapeAnnotation,
    pageModifications,
    reset,
  } = usePDFStore();

  // === COMPUTED FORMAT (For Toolbar) ===
  // If text is selected, show its format. Otherwise, show default.
  const getActiveFormat = (): TextFormat => {
    if (selectedAnnotationId) {
      const ann = annotations.find((a) => a.id === selectedAnnotationId);
      if (ann) {
        return {
          font: ann.font || "Arial",
          size: ann.fontSize || 18,
          color: ann.color || "#000000",
          bgColor: ann.bgColor || "transparent",
          opacity: ann.opacity || 100,
          bold: ann.bold || false,
          italic: ann.italic || false,
          underline: ann.underline || false,
          align: ann.align || "left",
        };
      }
    }
    return defaultTextFormat;
  };

  const currentToolbarFormat = getActiveFormat();

  // === GET SELECTED SHAPE ===
  const getSelectedShape = () => {
    if (selectedAnnotationId) {
      return shapeAnnotations.find((s) => s.id === selectedAnnotationId);
    }
    return null;
  };

  const selectedShapeAnnotation = getSelectedShape();

  // === DUPLICATE SHAPE ===
  const handleDuplicateShape = (shape: ShapeAnnotation) => {
    const newShape = {
      ...shape,
      id: Date.now().toString(),
      x: shape.x + 20, // Offset slightly
      y: shape.y + 20,
    };
    addShapeAnnotation(newShape);
    setSelectedAnnotationId(newShape.id); // Select the new duplicate
  };

  // === HANDLE FORMAT CHANGE ===
  const handleFormatChange = (newFormat: Partial<TextFormat>) => {
    // 1. If an annotation is selected, update IT immediately (Real-time editing)
    if (selectedAnnotationId) {
      const updates: Partial<TextAnnotation> = {};
      if (newFormat.font !== undefined) updates.font = newFormat.font;
      if (newFormat.size !== undefined) updates.fontSize = newFormat.size; // Note: size -> fontSize
      if (newFormat.color !== undefined) updates.color = newFormat.color;
      if (newFormat.bgColor !== undefined) updates.bgColor = newFormat.bgColor;
      if (newFormat.opacity !== undefined) updates.opacity = newFormat.opacity;
      if (newFormat.bold !== undefined) updates.bold = newFormat.bold;
      if (newFormat.italic !== undefined) updates.italic = newFormat.italic;
      if (newFormat.underline !== undefined)
        updates.underline = newFormat.underline;
      if (newFormat.align !== undefined) updates.align = newFormat.align;

      updateAnnotation(selectedAnnotationId, updates);
    }

    // 2. Always update the default for the NEXT text box to match current style
    setDefaultTextFormat((prev) => ({ ...prev, ...newFormat }));
  };

  const handleSignature = (sig: string) => {
    setSignature(sig);
    setActiveTool("signature");
    setIsSignatureFloating(true);
  };

  const handleShapeSelect = (shapeType: ShapeType) => {
    setSelectedShape(shapeType);
    setActiveTool("shapes");
    setIsShapeFloating(true);
    setShowShapesDropdown(false);
  };

  const handleDownload = async () => {
    if (!pdfFile) return alert(t("pdfProcessing.editor.noPdf"));
    setIsDownloading(true);
    try {
      const editedPdf = await createEditedPDF(
        pdfFile,
        pageModifications,
        annotations,
        signatureAnnotations,
      );
      await downloadPDF(editedPdf, "edited-document.pdf");
      alert(t("pdfProcessing.editor.downloadSuccess"));
    } catch (error) {
      alert(t("pdfProcessing.editor.downloadFail"));
      console.error(error);
    }
    setIsDownloading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between max-w-full gap-2">
          <div className="flex items-center gap-2">
            {/* Mobile Sidebar Toggle */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden p-2 rounded hover:bg-gray-100"
            >
              <LayoutGrid className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 hidden sm:block">
              {t("pdfProcessing.editor.title")}
            </h1>
          </div>

          {/* CENTER TOOLBAR */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 mx-auto overflow-x-auto max-w-[calc(100vw-140px)] md:max-w-none scrollbar-hide">
            <button
              onClick={() => setShowOrganizeModal(true)}
              className="p-2 hover:bg-gray-100 rounded transition-colors hidden md:block"
              title={t("pdfProcessing.editor.organize")}
            >
              <LayoutGrid className="w-5 h-5 text-gray-700" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-0.5 hidden md:block" />

            {/* TEXT TOOL */}
            <button
              onClick={() => {
                // Toggle tool. If turning on, deselect any current annotation to start fresh
                if (activeTool !== "text") setSelectedAnnotationId(null);
                setActiveTool(activeTool === "text" ? null : "text");
                setShowShapesDropdown(false);
              }}
              className={`p-2 rounded transition-colors ${activeTool === "text" ? "bg-blue-100" : "hover:bg-gray-100"}`}
              title={t("pdfProcessing.editor.addText")}
            >
              <Type
                className={`w-5 h-5 ${activeTool === "text" ? "text-blue-600" : "text-gray-700"}`}
              />
            </button>

            {/* SHAPES DROPDOWN */}
            <div className="relative">
              {/* Signature Icon — NOT MODIFIED */}
              <button
                onClick={() => setShowShapesDropdown(!showShapesDropdown)}
                className={`p-2 rounded transition-colors ${
                  activeTool === "shapes" ? "bg-blue-100" : "hover:bg-gray-100"
                }`}
                title={t("pdfProcessing.editor.shapes.title")}
              >
                <Stamp
                  className={`w-5 h-5 ${
                    activeTool === "shapes" ? "text-blue-600" : "text-gray-700"
                  }`}
                />
              </button>

              {showShapesDropdown && (
                <div className="absolute top-full mt-1 left-0 bg-white border rounded shadow-lg z-50 w-44">
                  <button
                    onClick={() => handleShapeSelect("check")}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b flex items-center gap-2"
                  >
                    <Check size={18} />
                    <span>{t("pdfProcessing.editor.shapes.check")}</span>
                  </button>

                  <button
                    onClick={() => handleShapeSelect("cross")}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b flex items-center gap-2"
                  >
                    <X size={18} />
                    <span>{t("pdfProcessing.editor.shapes.cross")}</span>
                  </button>

                  {/* Rectangle instead of Arrow */}
                  <button
                    onClick={() => handleShapeSelect("rectangle")}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Square size={18} />
                    <span>{t("pdfProcessing.editor.shapes.rectangle")}</span>
                  </button>

                  {/* Arrow */}
                  <button
                    onClick={() => handleShapeSelect("arrow")}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span className="text-lg">↗</span>
                    <span>{t("pdfProcessing.editor.shapes.arrow")}</span>
                  </button>
                </div>
              )}
            </div>

            {/* SIGNATURE TOOL */}
            <div className="relative">
              <SignatureTool
                onSignature={(sig) => {
                  handleSignature(sig);
                }}
              />
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm px-3 md:px-4"
            >
              <Download className="h-4 w-4 mr-1 md:mr-2" />
              {isDownloading ? (
                "..."
              ) : (
                <span className="hidden md:inline">{t("pdfProcessing.editor.download")}</span>
              )}
              <span className="md:hidden">{t("pdfProcessing.editor.save")}</span>
            </Button>
            <Button
              onClick={reset}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 px-2 md:px-4"
              title={t("pdfProcessing.editor.reset")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ===== TEXT FORMATTING TOOLBAR ===== */}
      {/* SHOW IF: activeTool is "text" OR any text annotation is currently selected */}
      {(activeTool === "text" ||
        (selectedAnnotationId &&
          annotations.find((a) => a.id === selectedAnnotationId))) && (
        <div className="absolute top-[70px] left-1/2 -translate-x-1/2 z-50">
          <TextFormattingToolbar
            format={currentToolbarFormat}
            onFormatChange={handleFormatChange}
          />
        </div>
      )}

      {/* ===== SHAPE FORMATTING TOOLBAR ===== */}
      {/* SHOW IF: A shape annotation is currently selected */}
      {selectedShapeAnnotation && (
        <div className="absolute top-[70px] left-1/2 -translate-x-1/2 z-50">
          <ShapeFormattingToolbar
            shape={selectedShapeAnnotation}
            onUpdate={updateShapeAnnotation}
            onDuplicate={handleDuplicateShape}
          />
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden relative">
        <div
          className={`
            fixed inset-y-0 left-0 z-40 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0 w-28 border-r overflow-y-auto
            ${showSidebar ? "translate-x-0" : "-translate-x-full"}
            md:flex md:flex-col mt-[60px] md:mt-0 h-[calc(100%-60px)] md:h-full
          `}
        >
          <PDFThumbnails />
        </div>

        {/* Mobile Overlay for Sidebar */}
        {showSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        <div className="flex-1 overflow-hidden relative bg-gray-100 p-2 md:p-4">
          <PDFViewer
            activeTool={activeTool}
            inputText={inputText}
            setInputText={setInputText}
            signature={signature}
            textFormat={defaultTextFormat} // Use default for *creating* new ones
            isSignatureFloating={isSignatureFloating}
            setIsSignatureFloating={setIsSignatureFloating}
            selectedShape={selectedShape}
            isShapeFloating={isShapeFloating}
            setIsShapeFloating={setIsShapeFloating}
            onExitAddText={() => setActiveTool(null)}
            // SELECTION PROPS
            selectedAnnotationId={selectedAnnotationId}
            onSelectAnnotation={setSelectedAnnotationId}
          />
        </div>
      </div>

      <OrganizePagesModal
        isOpen={showOrganizeModal}
        onClose={() => setShowOrganizeModal(false)}
      />
      <EditTextModal
        isOpen={showEditTextModal}
        onClose={() => setShowEditTextModal(false)}
      />
    </div>
  );
}

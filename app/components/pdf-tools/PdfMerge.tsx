"use client";

import React, { useState, useRef, useEffect } from "react";
import NextImage from "next/image";
import {
  Upload,
  X,
  RotateCw,
  Download,
  Trash2,
  Copy,
  GripHorizontal,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
import { Loader } from "@/components/ui/spinner";

interface PDFPage {
  id: string;
  fileId: string;
  fileName: string;
  pageNumber: number;
  rotation: number;
  thumbnail: string;
  isEncrypted?: boolean; // Add flag to track encrypted pages
}

interface PDFFileInfo {
  id: string;
  file: File;
  name: string;
  pages: PDFPage[];
}

interface MergeResult {
  originalSize: number;
  mergedSize: number;
  filesCount: number;
}

export default function PDFMergeAdvanced() {
  const { t } = useLanguage();
  const [files, setFiles] = useState<PDFFileInfo[]>([]);
  const [allPages, setAllPages] = useState<PDFPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MergeResult | null>(null);

  const [draggedFileId, setDraggedFileId] = useState<string | null>(null); // For dragging files in main mode
  const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null); // For dragging pages in preview mode
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-merge with debounce when in preview mode
  useEffect(() => {
    if (!previewMode || allPages.length === 0 || loading) return;

    const timer = setTimeout(() => {
      handleMerge(true); // true = auto mode (no need to set previewMode again)
    }, 800); // 800ms delay — feels real-time but prevents too many merges

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPages, previewMode]);

  // --- File Conversion Logic ---
  const convertToPDF = async (file: File): Promise<File | null> => {
    try {
      if (file.type === "application/pdf") return file;

      const pdfLib = await import("pdf-lib");
      const pdfDoc = await pdfLib.PDFDocument.create();

      if (file.type.startsWith("image/")) {
        const arrayBuffer = await file.arrayBuffer();
        let image;

        if (file.type === "image/jpeg" || file.type === "image/jpg") {
          image = await pdfDoc.embedJpg(arrayBuffer);
        } else if (file.type === "image/png") {
          image = await pdfDoc.embedPng(arrayBuffer);
        } else {
          const img = new Image();
          const blob = new Blob([arrayBuffer], { type: file.type });
          const url = URL.createObjectURL(blob);

          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
          });

          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0);

          const pngBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), "image/png");
          });

          const pngBuffer = await pngBlob.arrayBuffer();
          image = await pdfDoc.embedPng(pngBuffer);
          URL.revokeObjectURL(url);
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }
      // Word & Excel conversion (same as before)
      else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const mammoth = await import("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const cleanText = result.value
          .replace(/[^\x00-\x7F]/g, "")
          .replace(/\r\n/g, "\n");

        const A4_WIDTH = 595,
          A4_HEIGHT = 842,
          MARGIN = 50,
          FONT_SIZE = 12;
        const lines = cleanText.split("\n");
        let currentPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
        let yPosition = A4_HEIGHT - MARGIN;

        for (const line of lines) {
          if (yPosition < MARGIN) {
            currentPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
            yPosition = A4_HEIGHT - MARGIN;
          }
          currentPage.drawText(line.substring(0, 90), {
            x: MARGIN,
            y: yPosition,
            size: FONT_SIZE,
          });
          yPosition -= 16;
        }
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        const XLSX = await import("xlsx");
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const A4_WIDTH = 595,
          A4_HEIGHT = 842,
          MARGIN = 50;

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const csv = XLSX.utils.sheet_to_csv(sheet);
          const lines = csv.split("\n").filter((l: string) => l.trim());

          let currentPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
          let yPosition = A4_HEIGHT - MARGIN;

          currentPage.drawText(`Sheet: ${sheetName}`, {
            x: MARGIN,
            y: yPosition,
            size: 14,
          });
          yPosition -= 30;

          for (const line of lines) {
            if (yPosition < MARGIN) {
              currentPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
              yPosition = A4_HEIGHT - MARGIN;
            }
            currentPage.drawText(line.substring(0, 80), {
              x: MARGIN,
              y: yPosition,
              size: 10,
            });
            yPosition -= 14;
          }
        }
      } else return null;

      const pdfBytes = await pdfDoc.save();
      return new File(
        [new Blob([new Uint8Array(pdfBytes)])],
        file.name.replace(/\.[^/.]+$/, "") + ".pdf",
        { type: "application/pdf" },
      );
    } catch (error) {
      console.error("Conversion Error:", error);
      return null;
    }
  };

  const loadPDFPages = async (
    file: File,
    fileId: string,
  ): Promise<PDFPage[]> => {
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();

      // First try to load without password
      let pdf;
      try {
        pdf = await pdfjs.getDocument({
          data: arrayBuffer,
          password: "", // Provide empty password for password-less encrypted docs
        }).promise;
      } catch (initialError) {
        // If it's an encryption error, mark as encrypted but don't fail
        if (
          initialError instanceof Error &&
          (initialError.name === "PasswordException" ||
            (initialError.message &&
              initialError.message.includes("requires a password")))
        ) {
          console.warn("Encrypted PDF detected:", file.name);
          // Return placeholder page for encrypted PDF
          return [
            {
              id: `${fileId}-encrypted`,
              fileId,
              fileName: file.name,
              pageNumber: 1, // Use 1 instead of 0 to indicate it's a valid file
              rotation: 0,
              thumbnail: "", // Empty thumbnail for encrypted
              isEncrypted: true,
            },
          ];
        }
        throw initialError; // Re-throw if it's not an encryption error
      }

      const pages: PDFPage[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.4 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (context) {
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: context, viewport }).promise;

            pages.push({
              id: `${fileId}-page-${i}-${Date.now()}`,
              fileId,
              fileName: file.name,
              pageNumber: i,
              rotation: 0,
              thumbnail: canvas.toDataURL(),
              isEncrypted: false,
            });
          }
        } catch (pageError) {
          console.error(
            `Error loading page ${i} from file ${file.name}:`,
            pageError,
          );
          // Skip this page and continue with others
          continue;
        }
      }
      return pages;
    } catch (error) {
      console.error("Error loading PDF:", error);
      // For any other errors, return empty array
      return [];
    }
  };

  const processFiles = async (incomingFiles: File[]) => {
    setLoading(true);
    for (const file of incomingFiles) {
      if (file.name.endsWith(".ppt") || file.name.endsWith(".pptx")) {
        alert(`Skipping ${file.name}: PowerPoint not supported.`);
        continue;
      }

      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setError("Please select PDF files only");
        setLoading(false);
        return;
      }

      if (file.size > 100 * 1024 * 1024) {
        setError("File is too large. Maximum size is 100MB");
        setLoading(false);
        return;
      }

      const pdfFile = await convertToPDF(file);
      if (pdfFile) {
        const fileId = Math.random().toString(36).substr(2, 9);
        const pages = await loadPDFPages(pdfFile, fileId);

        // Add file even if it's encrypted
        if (pages.length > 0) {
          setFiles((prev) => [
            ...prev,
            { id: fileId, file: pdfFile, name: pdfFile.name, pages },
          ]);
          setAllPages((prev) => [...prev, ...pages]);
        }
      }
    }
    setLoading(false);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setError("");
    setResult(null);
    await processFiles(Array.from(e.target.files));
    if (e.target.value) e.target.value = "";
  };

  const removePage = (pageId: string) =>
    setAllPages((prev) => prev.filter((p) => p.id !== pageId));

  // Function to rotate a single page (used in Preview Mode)
  const rotateSinglePage = (pageId: string) => {
    setAllPages((prev) =>
      prev.map((page) =>
        page.id === pageId
          ? { ...page, rotation: (page.rotation + 90) % 360 }
          : page,
      ),
    );
  };

  // Function to rotate all pages of a file (used in Main Mode)
  const rotateFilePages = (fileId: string) => {
    setAllPages((prev) =>
      prev.map((page) =>
        page.fileId === fileId
          ? { ...page, rotation: (page.rotation + 90) % 360 }
          : page,
      ),
    );
  };

  const duplicatePage = (pageId: string) => {
    const index = allPages.findIndex((p) => p.id === pageId);
    if (index !== -1) {
      const newPage = {
        ...allPages[index],
        id: `${allPages[index].id}-copy-${Date.now()}`,
      };
      setAllPages((prev) => {
        const newPages = [...prev];
        newPages.splice(index + 1, 0, newPage);
        return newPages;
      });
    }
  };

  // Main Mode: Drag/Drop Files
  const handleFileDragStart = (e: React.DragEvent, fileId: string) => {
    setDraggedFileId(fileId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleFileDragOver = (e: React.DragEvent, targetFileId: string) => {
    e.preventDefault();
    if (draggedFileId === targetFileId) return;
  };

  const handleFileDrop = (e: React.DragEvent, dropFileId: string) => {
    e.preventDefault();
    if (draggedFileId === null || draggedFileId === dropFileId) return;

    const draggedIndex = files.findIndex((f) => f.id === draggedFileId);
    const dropIndex = files.findIndex((f) => f.id === dropFileId);

    if (draggedIndex === -1 || dropIndex === -1) return;

    const newFiles = [...files];
    const [moved] = newFiles.splice(draggedIndex, 1);
    newFiles.splice(dropIndex, 0, moved);
    setFiles(newFiles);

    // Rebuild allPages in the new order
    const newAllPages: PDFPage[] = [];
    newFiles.forEach((file) => {
      newAllPages.push(...file.pages);
    });
    setAllPages(newAllPages);

    setDraggedFileId(null);
  };

  // Preview Mode: Drag/Drop Pages
  const handlePageDragStart = (e: React.DragEvent, index: number) => {
    setDraggedPageIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handlePageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedPageIndex === index) return;
    setDragOverIndex(index);
  };

  const handlePageDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedPageIndex === null || draggedPageIndex === dropIndex) return;

    const newPages = [...allPages];
    const [moved] = newPages.splice(draggedPageIndex, 1);
    newPages.splice(dropIndex, 0, moved);
    setAllPages(newPages);

    setDraggedPageIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedPageIndex(null);
    setDragOverIndex(null);
    setDraggedFileId(null);
  };

  const handleMerge = async (auto = false) => {
    if (allPages.length === 0) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const pdfLib = await import("pdf-lib");
      const mergedPdf = await pdfLib.PDFDocument.create();
      let successCount = 0;

      // Process each page
      for (const page of allPages) {
        const fileInfo = files.find((f) => f.id === page.fileId);
        if (!fileInfo) continue;

        try {
          const arrayBuffer = await fileInfo.file.arrayBuffer();

          // For encrypted PDFs, try to render using PDF.js and create new pages
          if (page.isEncrypted || page.thumbnail === "") {
            console.log(`Rendering encrypted page from ${fileInfo.name}`);

            try {
              const pdfjs = await import("pdfjs-dist");
              pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

              const loadingTask = pdfjs.getDocument({
                data: arrayBuffer,
                password: "", // Try with empty password
              });
              const pdfDoc = await loadingTask.promise;

              // Get the specific page
              const pdfPage = await pdfDoc.getPage(page.pageNumber);
              const viewport = pdfPage.getViewport({ scale: 2.0 }); // High quality

              // Create canvas and render
              const canvas = document.createElement("canvas");
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              const context = canvas.getContext("2d");

              if (context) {
                await pdfPage.render({
                  canvasContext: context,
                  viewport: viewport,
                }).promise;

                // Convert canvas to PNG and embed in new PDF
                const imageDataUrl = canvas.toDataURL("image/png", 1.0);
                const base64Data = imageDataUrl.split(",")[1];
                const imageBytes = Uint8Array.from(atob(base64Data), (c) =>
                  c.charCodeAt(0),
                );

                const image = await mergedPdf.embedPng(imageBytes);

                // Create page with same dimensions
                const newPage = mergedPdf.addPage([
                  viewport.width,
                  viewport.height,
                ]);

                // Apply rotation if needed
                if (page.rotation !== 0) {
                  newPage.setRotation(pdfLib.degrees(page.rotation));
                }

                newPage.drawImage(image, {
                  x: 0,
                  y: 0,
                  width: viewport.width,
                  height: viewport.height,
                });

                successCount++;
                console.log(
                  `✓ Successfully rendered encrypted page ${page.pageNumber} from ${fileInfo.name}`,
                );
              }
            } catch (renderError) {
              console.error(`Failed to render encrypted page:`, renderError);
            }
          } else {
            // For normal PDFs, use standard copying
            try {
              let sourcePdf;

              // Try to load with different strategies
              try {
                sourcePdf = await pdfLib.PDFDocument.load(arrayBuffer, {
                  ignoreEncryption: true,
                  updateMetadata: false,
                });
              } catch {
                try {
                  sourcePdf = await pdfLib.PDFDocument.load(arrayBuffer);
                } catch (e2) {
                  console.warn(`Could not load ${fileInfo.name}:`, e2);
                  continue;
                }
              }

              if (sourcePdf) {
                const pageIndex = page.pageNumber - 1;

                if (pageIndex >= 0 && pageIndex < sourcePdf.getPageCount()) {
                  const [copiedPage] = await mergedPdf.copyPages(sourcePdf, [
                    pageIndex,
                  ]);

                  // Apply rotation
                  if (page.rotation !== 0) {
                    const existingRotation = copiedPage.getRotation().angle;
                    copiedPage.setRotation(
                      pdfLib.degrees(existingRotation + page.rotation),
                    );
                  }

                  mergedPdf.addPage(copiedPage);
                  successCount++;
                  console.log(
                    `✓ Successfully copied page ${page.pageNumber} from ${fileInfo.name}`,
                  );
                }
              }
            } catch (copyError) {
              console.error(`Failed to copy page:`, copyError);
            }
          }
        } catch (pageError) {
          console.error(
            `Error processing page ${page.pageNumber} from ${fileInfo.name}:`,
            pageError,
          );
          continue;
        }
      }

      console.log(
        `Total pages successfully merged: ${successCount} out of ${allPages.length}`,
      );

      // Check if we successfully merged any pages
      if (mergedPdf.getPageCount() === 0 || successCount === 0) {
        setError(
          `Could not merge any pages (0/${allPages.length} successful). Check browser console for details. Encrypted PDFs with passwords are not supported.`,
        );
        setLoading(false);
        return;
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([new Uint8Array(mergedBytes)], {
        type: "application/pdf",
      });
      const newUrl = URL.createObjectURL(blob);

      if (mergedPdfUrl) URL.revokeObjectURL(mergedPdfUrl);
      setMergedPdfUrl(newUrl);

      // Calculate result stats
      const totalOriginalSize = files.reduce(
        (sum, file) => sum + file.file.size,
        0,
      );
      const mergedSize = blob.size;

      setResult({
        originalSize: totalOriginalSize,
        mergedSize,
        filesCount: files.length,
      });

      if (!auto) setPreviewMode(true);

      // Show warning if some pages failed
      if (successCount < allPages.length) {
        console.warn(
          `Warning: Only ${successCount} out of ${allPages.length} pages were merged successfully.`,
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t("pdfProcessing.errors.failed");
      setError(message);
      console.error("Merge error:", err);
    }
    setLoading(false);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const mb = bytes / 1024 / 1024;
    if (mb < 1) {
      const kb = bytes / 1024;
      return kb.toFixed(2) + " KB";
    }
    return mb.toFixed(2) + " MB";
  };

  // File Card Component (for Main Mode) - Now with working visual rotation
  const FileCard = ({ file }: { file: PDFFileInfo }) => {
    // Find the first page of this file from allPages (so we get updated rotation)
    const firstPage = allPages.find((page) => page.fileId === file.id);
    const isEncrypted = firstPage?.isEncrypted;

    return (
      <div
        draggable
        onDragStart={(e) => handleFileDragStart(e, file.id)}
        onDragOver={(e) => handleFileDragOver(e, file.id)}
        onDrop={(e) => handleFileDrop(e, file.id)}
        onDragEnd={handleDragEnd}
        className={`
          relative bg-white rounded-xl shadow-sm border transition-all duration-200 group select-none cursor-move
          ${draggedFileId === file.id ? "opacity-40 scale-95" : ""}
          hover:border-blue-300
        `}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between p-2 border-b bg-gray-50 rounded-t-xl">
          <span className="text-xs font-bold text-gray-500 bg-white px-2 py-0.5 rounded border">
            {isEncrypted ? t("pdfProcessing.merge.encrypted") : `${file.pages.length} ${t("pdfProcessing.merge.pages")}`}
          </span>
          <GripHorizontal
            className="text-gray-300 cursor-grab active:cursor-grabbing"
            size={16}
          />
        </div>

        {/* Thumbnail Section */}
        <div className="relative aspect-3/4 p-3 flex items-center justify-center overflow-hidden bg-white">
          {isEncrypted ? (
            <div className="flex flex-col items-center justify-center w-full h-full text-center p-4">
              <AlertCircle className="text-yellow-500 mb-2" size={32} />
              <p className="text-yellow-600 text-sm font-medium">
                {t("pdfProcessing.merge.encrypted")}
              </p>
              <p className="text-gray-500 text-xs mt-1">Can still be merged</p>
            </div>
          ) : firstPage?.thumbnail ? (
            <NextImage
              src={firstPage.thumbnail}
              alt=""
              fill
              style={{ transform: `rotate(${firstPage?.rotation || 0}deg)` }}
              className="object-contain pointer-events-none"
              unoptimized
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full text-center p-4">
              <AlertCircle className="text-red-500 mb-2" size={32} />
              <p className="text-red-500 text-sm font-medium">{t("pdfProcessing.merge.noPreview")}</p>
              <p className="text-gray-500 text-xs mt-1">
                Cannot display content
              </p>
            </div>
          )}
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[1px]">
            {!isEncrypted && (
              <>
                <button
                  onClick={() => rotateFilePages(file.id)}
                  className="bg-white p-2 rounded-full hover:bg-blue-500 hover:text-white shadow-lg"
                >
                  <RotateCw size={18} />
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Duplicate the entire file
                      const newFileId = Math.random().toString(36).substr(2, 9);
                      const newFileName = `${file.name.replace(/\.[^/.]+$/, "")}_copy.pdf`;
                      const newPages = file.pages.map((page) => ({
                        ...page,
                        id: `${newFileId}-page-${page.pageNumber}-${Date.now()}`,
                        fileId: newFileId,
                        fileName: newFileName,
                      }));

                      setFiles((prev) => [
                        ...prev,
                        {
                          id: newFileId,
                          file: file.file,
                          name: newFileName,
                          pages: newPages,
                        },
                      ]);
                      setAllPages((prev) => [...prev, ...newPages]);
                    }}
                    className="bg-white p-2 rounded-full hover:bg-blue-500 hover:text-white shadow-lg"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </>
            )}
            <button
              onClick={() => {
                // Remove the entire file and its pages
                setFiles((prev) => prev.filter((f) => f.id !== file.id));
                setAllPages((prev) => prev.filter((p) => p.fileId !== file.id));
              }}
              className="bg-white text-red-500 p-2 rounded-full hover:bg-red-500 hover:text-white shadow-lg"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className="p-2 border-t bg-gray-50 rounded-b-xl text-xs truncate"
          title={file.name}
        >
          {file.name}
        </div>
      </div>
    );
  };

  // Page Thumbnail Card Component (for Preview Mode)
  const ThumbnailCard = ({ page, index }: { page: PDFPage; index: number }) => (
    <div
      draggable
      onDragStart={(e) => handlePageDragStart(e, index)}
      onDragOver={(e) => handlePageDragOver(e, index)}
      onDrop={(e) => handlePageDrop(e, index)}
      onDragEnd={handleDragEnd}
      className={`
        relative bg-white rounded-xl shadow-sm border transition-all duration-200 group select-none
        ${draggedPageIndex === index ? "opacity-40 scale-95" : ""}
        ${dragOverIndex === index ? "border-blue-500 border-2 scale-105 shadow-xl" : "border-gray-200 hover:border-blue-300"}
      `}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between p-2 border-b bg-gray-50 rounded-t-xl">
        <span className="text-xs font-bold text-gray-500 bg-white px-2 py-0.5 rounded border">
          {index + 1}
        </span>
        <GripHorizontal
          className="text-gray-300 cursor-grab active:cursor-grabbing"
          size={16}
        />
      </div>

      {/* Thumbnail */}
      <div className="relative aspect-3/4 p-3 flex items-center justify-center overflow-hidden bg-white">
        {page.isEncrypted ? (
          <div className="flex flex-col items-center justify-center w-full h-full text-center p-4">
            <AlertCircle className="text-yellow-500 mb-2" size={32} />
            <p className="text-yellow-600 text-sm font-medium">Encrypted</p>
            <p className="text-gray-500 text-xs mt-1">Will be merged</p>
          </div>
        ) : page.thumbnail ? (
          <NextImage
            src={page.thumbnail}
            alt=""
            fill
            style={{ transform: `rotate(${page.rotation}deg)` }}
            className="object-contain pointer-events-none"
            unoptimized
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-center p-4">
            <AlertCircle className="text-red-500 mb-2" size={32} />
            <p className="text-red-500 text-sm font-medium">No Preview</p>
            <p className="text-gray-500 text-xs mt-1">Cannot display</p>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[1px]">
          {!page.isEncrypted && page.thumbnail ? (
            <>
              <button
                onClick={() => rotateSinglePage(page.id)}
                className="bg-white p-2 rounded-full hover:bg-blue-500 hover:text-white shadow-lg"
              >
                <RotateCw size={18} />
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => duplicatePage(page.id)}
                  className="bg-white p-2 rounded-full hover:bg-blue-500 hover:text-white shadow-lg"
                >
                  <Copy size={16} />
                </button>
              </div>
            </>
          ) : null}
          <button
            onClick={() => removePage(page.id)}
            className="bg-white text-red-500 p-2 rounded-full hover:bg-red-500 hover:text-white shadow-lg"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div
        className="p-2 border-t bg-gray-50 rounded-b-xl text-[10px] text-gray-500 truncate text-center"
        title={page.fileName}
      >
        {page.fileName}
      </div>
    </div>
  );

  // PREVIEW MODE - Real-time editing + auto update
  if (previewMode) {
    return (
      <div className="w-full">
        <div className="bg-white p-5 rounded-xl shadow-md mb-6 flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <h2 className="text-2xl font-bold">Live Edit & Preview</h2>
            {loading ? (
              <Loader size="sm" text="Updating preview..." />
            ) : (
              <span className="text-sm text-green-600">
                ✓ Real-time updates
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            {mergedPdfUrl && (
              <a
                href={mergedPdfUrl}
                download="merged.pdf"
                className="bg-primary hover:bg-primary/70 text-white px-4 py-3 sm:px-6 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base order-1 sm:order-0"
              >
                <Download size={20} /> Download
              </a>
            )}
            <button
              onClick={() => setPreviewMode(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 sm:px-6 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base order-2 sm:order-0"
            >
              <X size={20} /> Close
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Preview Area - Increased Width */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden h-[80vh]">
            {mergedPdfUrl ? (
              <iframe
                src={mergedPdfUrl}
                className="w-full h-full border-0"
                title="Live PDF Preview"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <p>{t("pdfProcessing.preview.organizePages")}</p>
              </div>
            )}
          </div>

          {/* Pages Sidebar - Increased Width */}
          <div className="bg-white rounded-xl shadow-md p-5 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {t("pdfProcessing.preview.pagesTitle", { count: allPages.length })}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
              {allPages.map((page, i) => (
                <ThumbnailCard key={page.id} page={page} index={i} />
              ))}
            </div>
          </div>
          </div>
        </div>
    );
  }

  // MAIN MODE: Show Files for Organization
  return (
    <div className="w-full">
      <div className="bg-primary/90 p-6 md:p-10 text-white rounded-t-2xl">
        <h1 className="text-3xl md:text-5xl font-bold text-center mb-2 md:mb-3">
          {t("pdfProcessing.merge.title")}
        </h1>
        <p className="text-center text-white/90 text-sm md:text-lg max-w-2xl mx-auto">
          {t("pdfProcessing.merge.subtitle")}
        </p>
      </div>

      <div className="p-6 md:p-12">
        {/* File Upload */}
        <div className="mb-6 md:mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            {t("pdfProcessing.merge.selectFiles")}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
            disabled={loading}
          />
          <label
            htmlFor="file-upload"
            className={`block border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              loading
                ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                : "border-primary/90 hover:border-primary hover:bg-primary/10 cursor-pointer"
            }`}
          >
            <Upload
              className={`mx-auto h-16 w-16 mb-3 ${files.length > 0 ? "text-primary/90" : "text-gray-400"}`}
            />
            {files.length > 0 ? (
              <div>
                <p className="text-primary/90 font-semibold text-lg mb-1">
                  {t("pdfProcessing.merge.filesSelected", { count: files.length })}
                </p>
                <p className="text-sm text-gray-500">
                  {files.reduce((total, file) => total + file.file.size, 0) > 0
                    ? formatBytes(
                        files.reduce(
                          (total, file) => total + file.file.size,
                          0,
                        ),
                      )
                    : "0 Bytes"}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {t("pdfProcessing.merge.clickToAddMore")}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-700 font-medium mb-1">
                  {t("pdfProcessing.merge.clickOrDrag")}
                </p>
                <p className="text-sm text-gray-500">
                  {t("pdfProcessing.merge.supportedFormats")}
                </p>
              </div>
            )}
          </label>
        </div>

        {/* Files Grid - Show uploaded files */}
        {files.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">
              {t("pdfProcessing.merge.uploadedFiles", { count: files.length })}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {files.map((file) => (
                <FileCard key={file.id} file={file} />
              ))}
            </div>
          </div>
        )}

        {/* Merge Button */}
        <button
          onClick={() => handleMerge()}
          disabled={files.length === 0 || loading}
          className="w-full bg-primary/90 text-white py-4 rounded-xl font-semibold text-lg hover:bg-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {loading ? (
            <>
              <Loader size="sm" text={t("pdfProcessing.merge.merging")} />
            </>
          ) : (
            <>
              <Download className="mr-2 h-6 w-6" />
              {t("pdfProcessing.merge.mergeBtn")}
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-5 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-red-800 font-semibold mb-1">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="mt-6 p-6 bg-linear-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg shadow-sm">
            <div className="flex items-center text-green-700 mb-4">
              <FileCheck className="h-6 w-6 mr-3" />
              <span className="font-bold text-lg">Merge Successful!</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-500 text-xs font-medium mb-1">
                  Files Merged
                </p>
                <p className="text-gray-800 font-bold text-xl">
                  {result.filesCount}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-500 text-xs font-medium mb-1">
                  Original Size
                </p>
                <p className="text-gray-800 font-bold text-xl">
                  {formatBytes(result.originalSize)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-500 text-xs font-medium mb-1">
                  Merged Size
                </p>
                <p className="text-gray-800 font-bold text-xl">
                  {formatBytes(result.mergedSize)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

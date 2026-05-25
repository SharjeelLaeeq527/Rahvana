/**
 * Consolidated PDF utility functions
 * Supports loading, modifying, and editing PDFs with text & image annotations
 */

import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

// ============================================================================
// HEX/RGB UTILITIES (Consolidated)
// ============================================================================

export function hex2rgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return [
      Number.parseInt(result[1], 16),
      Number.parseInt(result[2], 16),
      Number.parseInt(result[3], 16),
    ];
  }
  return [0, 0, 0];
}

export function hex2rgbNormalized(hex: string): { r: number; g: number; b: number } | null {
  const [r, g, b] = hex2rgb(hex);
  return { r: r / 255, g: g / 255, b: b / 255 };
}

export function rgb2hex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ============================================================================
// PDF LOADING & MODIFICATIONS
// ============================================================================

export async function loadPDF(file: File): Promise<PDFDocument> {
  const arrayBuffer = await file.arrayBuffer();
  try {
    return await PDFDocument.load(arrayBuffer);
  } catch {
    console.warn("PDF is encrypted, loading with ignoreEncryption option");
    return await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  }
}

export async function applyPageModifications(
  pdfDoc: PDFDocument,
  modifications: Array<{
    originalIndex: number;
    rotation: number;
    deleted: boolean;
  }>
): Promise<PDFDocument> {
  const newPdf = await PDFDocument.create();
  const pages = pdfDoc.getPages();

  for (const mod of modifications) {
    if (mod.deleted) continue;

    const originalPage = pages[mod.originalIndex];
    if (!originalPage) continue;

    const [copiedPage] = await newPdf.copyPages(pdfDoc, [mod.originalIndex]);

    if (mod.rotation !== 0) {
      const currentRotation = copiedPage.getRotation().angle;
      const newRotation = (currentRotation + mod.rotation) % 360;
      copiedPage.setRotation(degrees(newRotation));
    }

    newPdf.addPage(copiedPage);
  }

  return newPdf;
}

export async function reorderPdfPages(
  pdfBytes: ArrayBuffer,
  pageOrder: number[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const newPdfDoc = await PDFDocument.create();

  for (const pageNum of pageOrder) {
    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNum - 1]);
    newPdfDoc.addPage(copiedPage);
  }

  return new Uint8Array(await newPdfDoc.save());
}

export async function deletePdfPages(
  pdfBytes: ArrayBuffer,
  pagesToDelete: number[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const indices = pagesToDelete.map((p) => p - 1).sort((a, b) => b - a);

  for (const index of indices) {
    pdfDoc.removePage(index);
  }

  return new Uint8Array(await pdfDoc.save());
}

export async function rotatePdfPage(
  pdfBytes: ArrayBuffer,
  pageIndex: number,
  angle: number
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const page = pdfDoc.getPage(pageIndex);
  page.setRotation(degrees(page.getRotation().angle + angle));

  return new Uint8Array(await pdfDoc.save());
}

// ============================================================================
// TEXT ANNOTATIONS
// ============================================================================

export interface TextAnnotation {
  id?: string;
  text: string;
  pageIndex: number;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  font?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: "left" | "center" | "right";
  bgColor?: string;
  opacity?: number;
  rotation?: number;
  width?: number;
  height?: number;
}

export async function addTextAnnotationsToPdf(
  pdfBytes: ArrayBuffer,
  annotations: TextAnnotation[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);

  for (const ann of annotations) {
    const page = pdfDoc.getPage(ann.pageIndex);
    const rgbColor = hex2rgbNormalized(ann.color);

    if (!rgbColor) continue;

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText(ann.text, {
      x: ann.x,
      y: page.getHeight() - ann.y,
      size: ann.fontSize,
      font,
      color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
    });
  }

  return new Uint8Array(await pdfDoc.save());
}

// ============================================================================
// SIGNATURE/IMAGE ANNOTATIONS
// ============================================================================

export interface SignatureAnnotation {
  id?: string;
  image: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export async function addImageToPDF(
  pdfDoc: PDFDocument,
  pageIndex: number,
  imageData: string,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation = 0
): Promise<PDFDocument> {
  const pages = pdfDoc.getPages();

  if (pageIndex >= pages.length) {
    console.warn(`Page index ${pageIndex} out of bounds, using last page`);
    pageIndex = pages.length - 1;
  }

  const page = pages[pageIndex];
  const { height: pageHeight } = page.getSize();

  let embeddedImage;
  try {
    if (imageData.startsWith("data:image/png")) {
      embeddedImage = await pdfDoc.embedPng(imageData);
    } else if (imageData.startsWith("data:image/jpeg") || imageData.startsWith("data:image/jpg")) {
      embeddedImage = await pdfDoc.embedJpg(imageData);
    } else {
      throw new Error("Unsupported image format (only PNG or JPEG allowed)");
    }

    page.drawImage(embeddedImage, {
      x,
      y: pageHeight - y - height,
      width,
      height,
      rotate: degrees(rotation),
    });
  } catch (error) {
    console.error("Error embedding image:", error);
    throw error;
  }

  return pdfDoc;
}

export async function addSignaturesToPdf(
  pdfBytes: ArrayBuffer,
  signatures: SignatureAnnotation[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);

  for (const sig of signatures) {
    await addImageToPDF(
      pdfDoc,
      sig.pageIndex,
      sig.image,
      sig.x,
      sig.y,
      sig.width,
      sig.height,
      sig.rotation || 0
    );
  }

  return new Uint8Array(await pdfDoc.save());
}

// ============================================================================
// COMPLETE PDF EDITING
// ============================================================================

export async function createEditedPDF(
  originalFile: File,
  pageModifications: Array<{
    originalIndex: number;
    rotation: number;
    deleted: boolean;
  }>,
  textAnnotations: TextAnnotation[],
  signatureAnnotations: SignatureAnnotation[]
): Promise<PDFDocument> {
  let pdfDoc = await loadPDF(originalFile);
  pdfDoc = await applyPageModifications(pdfDoc, pageModifications);

  for (const annotation of textAnnotations) {
    const page = pdfDoc.getPage(annotation.pageIndex);
    const rgbColor = hex2rgbNormalized(annotation.color);

    if (!rgbColor) continue;

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText(annotation.text, {
      x: annotation.x,
      y: page.getHeight() - annotation.y,
      size: annotation.fontSize,
      font,
      color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
    });
  }

  for (const signature of signatureAnnotations) {
    await addImageToPDF(
      pdfDoc,
      signature.pageIndex,
      signature.image,
      signature.x,
      signature.y,
      signature.width,
      signature.height,
      signature.rotation || 0
    );
  }

  return pdfDoc;
}

// ============================================================================
// PDF EXPORT & DOWNLOAD
// ============================================================================

export async function savePDF(pdfDoc: PDFDocument): Promise<Uint8Array> {
  const pdfBytes = await pdfDoc.save();
  return new Uint8Array(pdfBytes);
}

export async function downloadPDF(pdfDoc: PDFDocument, filename = "edited.pdf"): Promise<void> {
  const pdfBytes = await pdfDoc.save();
  const safeBytes = new Uint8Array(pdfBytes);
  const blob = new Blob([safeBytes], { type: "application/pdf" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

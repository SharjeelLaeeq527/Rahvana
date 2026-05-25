// C:\Users\HP\Desktop\arachnie\Arachnie\app\lib\pdf-operations.ts
/**
 * Utility functions for PDF operations
 * To be used with pdf-lib library
 *
 * Install: npm install pdf-lib
 */

import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

// Helper function to convert hex to rgb
function hex2rgb(hex: string): [number, number, number] {
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

export async function reorderPdfPages(pdfBytes: ArrayBuffer, pageOrder: number[]) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const newPdfDoc = await PDFDocument.create();

  for (const pageNum of pageOrder) {
    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNum - 1]);
    newPdfDoc.addPage(copiedPage);
  }

  return newPdfDoc.save();
}

export async function deletePdfPages(pdfBytes: ArrayBuffer, pagesToDelete: number[]) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const indices = pagesToDelete.map((p) => p - 1).sort((a, b) => b - a);

  for (const index of indices) {
    pdfDoc.removePage(index);
  }

  return pdfDoc.save();
}

export async function rotatePdfPage(pdfBytes: ArrayBuffer, pageIndex: number, angle: number) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const page = pdfDoc.getPage(pageIndex);
  const currentRotation = page.getRotation().angle;
  page.setRotation(degrees(currentRotation + angle));

  return pdfDoc.save();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function extractPdfPages(_pdfBytes: ArrayBuffer) {
  // TODO: Implementation with pdfjs-dist
  // Convert each page to image/thumbnail
  // Return array of image data URLs
}

/**
 * Added comprehensive PDF annotation functions for text, shapes, and export
 */

export interface TextAnnotation {
  text: string;
  pageIndex: number;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  font: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: "left" | "center" | "right";
}

export interface ShapeAnnotation {
  type: "check" | "cross";
  pageIndex: number;
  x: number;
  y: number;
  size: number;
}

export interface SignatureAnnotation {
  image: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Map font names to StandardFonts
function getStandardFont(fontName: string): (typeof StandardFonts)[keyof typeof StandardFonts] {
  const fontMap: Record<string, (typeof StandardFonts)[keyof typeof StandardFonts]> = {
    Arial: StandardFonts.Helvetica,
    Helvetica: StandardFonts.Helvetica,
    "Times New Roman": StandardFonts.TimesRoman,
    "Courier New": StandardFonts.Courier,
    Georgia: StandardFonts.TimesRoman,
  };
  return fontMap[fontName] || StandardFonts.Helvetica;
}

export async function addTextAnnotationsToPdf(
  pdfBytes: ArrayBuffer | Uint8Array,
  annotations: TextAnnotation[]
) {
  const pdfDoc = await PDFDocument.load(pdfBytes);

  for (const ann of annotations) {
    const page = pdfDoc.getPage(ann.pageIndex);
    const [r, g, b] = hex2rgb(ann.color);

    // Embed the font
    const fontType = getStandardFont(ann.font);
    const font = await pdfDoc.embedFont(fontType);

    page.drawText(ann.text, {
      x: ann.x,
      y: page.getHeight() - ann.y,
      size: ann.fontSize,
      font: font,
      color: rgb(r / 255, g / 255, b / 255),
    });
  }

  return pdfDoc.save();
}

export async function addShapeAnnotationsToPdf(
  pdfBytes: ArrayBuffer | Uint8Array,
  shapes: ShapeAnnotation[]
) {
  const pdfDoc = await PDFDocument.load(pdfBytes);

  for (const shape of shapes) {
    const page = pdfDoc.getPage(shape.pageIndex);
    const shapeColor = shape.type === "check" ? rgb(0.13, 0.77, 0.31) : rgb(0.93, 0.27, 0.27);

    if (shape.type === "check") {
      // Draw checkmark using lines/path
      page.drawLine({
        start: { x: shape.x, y: page.getHeight() - shape.y - shape.size * 0.5 },
        end: { x: shape.x + shape.size * 0.3, y: page.getHeight() - shape.y - shape.size },
        thickness: 2,
        color: shapeColor,
      });
      page.drawLine({
        start: { x: shape.x + shape.size * 0.3, y: page.getHeight() - shape.y - shape.size },
        end: { x: shape.x + shape.size, y: page.getHeight() - shape.y },
        thickness: 2,
        color: shapeColor,
      });
    } else {
      // Draw cross using lines
      page.drawLine({
        start: { x: shape.x, y: page.getHeight() - shape.y },
        end: { x: shape.x + shape.size, y: page.getHeight() - shape.y - shape.size },
        thickness: 2,
        color: shapeColor,
      });
      page.drawLine({
        start: { x: shape.x + shape.size, y: page.getHeight() - shape.y },
        end: { x: shape.x, y: page.getHeight() - shape.y - shape.size },
        thickness: 2,
        color: shapeColor,
      });
    }
  }

  return pdfDoc.save();
}

export async function addSignatureToPdf(
  pdfBytes: ArrayBuffer | Uint8Array,
  signature: SignatureAnnotation[]
) {
  const pdfDoc = await PDFDocument.load(pdfBytes);

  for (const sig of signature) {
    const page = pdfDoc.getPage(sig.pageIndex);
    const image = await pdfDoc.embedPng(sig.image);
    page.drawImage(image, {
      x: sig.x,
      y: page.getHeight() - sig.y - sig.height,
      width: sig.width,
      height: sig.height,
    });
  }

  return pdfDoc.save();
}

export async function combinePdfAnnotations(
  pdfBytes: ArrayBuffer | Uint8Array,
  textAnnotations: TextAnnotation[],
  shapeAnnotations: ShapeAnnotation[],
  signatureAnnotations: SignatureAnnotation[]
) {
  let result: ArrayBuffer | Uint8Array = pdfBytes;

  if (textAnnotations.length > 0) {
    result = await addTextAnnotationsToPdf(result, textAnnotations);
  }

  if (shapeAnnotations.length > 0) {
    result = await addShapeAnnotationsToPdf(result, shapeAnnotations);
  }

  if (signatureAnnotations.length > 0) {
    result = await addSignatureToPdf(result, signatureAnnotations);
  }

  return result;
}

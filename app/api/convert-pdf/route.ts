// app/api/convert-pdf/route.ts
import { type NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import sharp from "sharp";
import mammoth from "mammoth";
import { E, msg } from "@/lib/errors";

type FileFormat = "text" | "html" | "markdown" | "image" | "docx";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const format = formData.get("format") as FileFormat | null;

    if (!file || !format) {
      if (!file) return NextResponse.json({ error: msg(E.UPLOAD_NO_FILE) }, { status: 400 });
      return NextResponse.json({ error: msg(E.ADMIN_INVALID_INPUT) }, { status: 400 });
    }

    if (!["text", "html", "markdown", "image", "docx"].includes(format)) {
      return NextResponse.json({ error: msg(E.ADMIN_INVALID_INPUT) }, { status: 400 });
    }

    const maxSize = format === "image" ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxMb = format === "image" ? 50 : 10;
      return NextResponse.json(
        { error: msg(E.UPLOAD_FILE_TOO_LARGE, { maxSize: maxMb }) },
        { status: 413 }
      );
      return NextResponse.json(
        { message: `File too large (max ${maxSize / (1024 * 1024)}MB)` },
        { status: 413 }
      );
    }

    const pdfBuffer = await convertToPDF(file, format);

    // Create user-friendly filename from original file name
    const originalName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    const safeName = originalName.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 50) || "document";
    const fileName = `${safeName}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error("Convert PDF error:", err);
    return NextResponse.json({ error: msg(E.PDF_CONVERTER_FAILED) }, { status: 500 });
  }
}

async function convertToPDF(file: File, format: FileFormat): Promise<ArrayBuffer> {
  switch (format) {
    case "text":
      return textToPDF(await file.text());
    case "html":
      return htmlToPDF(await file.text());
    case "markdown":
      return markdownToPDF(await file.text());
    case "image":
      return imageToPDF(await file.arrayBuffer());
    case "docx":
      return docxToPDF(await file.arrayBuffer());
    default:
      throw new Error("Invalid format");
  }
}

// Simple converters
function textToPDF(content: string): ArrayBuffer {
  const pdf = new jsPDF();
  pdf.text(pdf.splitTextToSize(content || "No content", 180), 15, 20);
  return pdf.output("arraybuffer");
}

function htmlToPDF(html: string): ArrayBuffer {
  const pdf = new jsPDF();
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  pdf.setFontSize(16);
  pdf.text("HTML Document", 15, 15);
  pdf.setFontSize(11);
  pdf.text(pdf.splitTextToSize(text || "No content", 180), 15, 25);
  return pdf.output("arraybuffer");
}

function markdownToPDF(md: string): ArrayBuffer {
  const pdf = new jsPDF();
  let y = 15;
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 5; // Compact line height like reference PDF

  const checkPageBreak = (neededSpace: number = 10) => {
    if (y + neededSpace > 282) {
      pdf.addPage();
      y = 15;
    }
  };

  const renderText = (
    text: string,
    x: number,
    fontSize: number,
    isBold: boolean = false,
    isItalic: boolean = false
  ) => {
    pdf.setFontSize(fontSize);
    const style =
      isBold && isItalic ? "bolditalic" : isBold ? "bold" : isItalic ? "italic" : "normal";
    pdf.setFont("helvetica", style);

    // Handle inline formatting
    const processedText = text
      .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/_(.+?)_/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    const lines = pdf.splitTextToSize(processedText, contentWidth - (x - margin));
    lines.forEach((line: string) => {
      checkPageBreak();
      pdf.text(line, x, y);
      y += lineHeight;
    });
    pdf.setFont("helvetica", "normal");
  };

  const lines = md.split("\n");
  let i = 0;
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code block handling
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        checkPageBreak(codeBlockContent.length * 4 + 4);
        pdf.setFillColor(245, 245, 245);
        const codeHeight = Math.max(codeBlockContent.length * 4 + 4, 8);
        pdf.rect(margin, y - 3, contentWidth, codeHeight, "F");
        pdf.setFontSize(9);
        pdf.setFont("courier", "normal");
        codeBlockContent.forEach((codeLine) => {
          pdf.text(codeLine.substring(0, 85), margin + 2, y);
          y += 4;
        });
        y += 2;
        pdf.setFont("helvetica", "normal");
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      i++;
      continue;
    }

    // Empty line - minimal spacing
    if (!trimmed) {
      y += 2;
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      checkPageBreak();
      pdf.setDrawColor(180);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 4;
      i++;
      continue;
    }

    // Headings (H1-H6)
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2]
        .replace(/`/g, "")
        .replace(/[""'']/g, "")
        .replace(/["']/g, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .trim();

      const sizes = [18, 15, 13, 12, 11, 10];
      const spacingBefore = [4, 3, 2, 2, 1, 1];
      const spacingAfter = [6, 5, 4, 4, 3, 3];

      checkPageBreak(spacingAfter[level - 1] + 5);
      y += spacingBefore[level - 1];
      pdf.setFontSize(sizes[level - 1]);
      pdf.setFont("helvetica", "bold");
      pdf.text(headingText, margin, y);
      y += spacingAfter[level - 1];
      pdf.setFont("helvetica", "normal");
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      checkPageBreak();
      pdf.setDrawColor(150);
      pdf.setLineWidth(0.5);
      pdf.line(margin + 2, y - 2, margin + 2, y + 3);
      pdf.setFontSize(10);
      pdf.setTextColor(80);
      const quoteText = trimmed.replace(/^>\s*/, "");
      renderText(quoteText, margin + 6, 10, false, true);
      pdf.setTextColor(0);
      i++;
      continue;
    }

    // Table detection
    if (trimmed.includes("|") && trimmed.startsWith("|")) {
      const tableRows: string[][] = [];
      let hasHeader = false;

      while (i < lines.length && lines[i].trim().includes("|")) {
        const row = lines[i].trim();
        if (/^\|[\s\-:|]+\|$/.test(row)) {
          hasHeader = true;
          i++;
          continue;
        }
        const cells = row
          .split("|")
          .filter((c) => c.trim() !== "")
          .map((c) => c.trim());
        if (cells.length > 0) {
          tableRows.push(cells);
        }
        i++;
      }

      if (tableRows.length > 0) {
        const colCount = Math.max(...tableRows.map((r) => r.length));
        const cellPadding = 2;
        const colWidth = contentWidth / colCount;
        const cellContentWidth = colWidth - cellPadding * 2;

        // Calculate row heights based on content wrapping
        pdf.setFontSize(9);
        const rowHeights: number[] = tableRows.map((row) => {
          let maxLines = 1;
          row.forEach((cell) => {
            const cleanCell = cell
              .replace(/`/g, "")
              .replace(/\*\*(.+?)\*\*/g, "$1")
              .replace(/\*(.+?)\*/g, "$1");
            const wrappedLines = pdf.splitTextToSize(cleanCell, cellContentWidth);
            if (wrappedLines.length > maxLines) maxLines = wrappedLines.length;
          });
          return Math.max(maxLines * 4 + 2, 6); // 4mm per line + 2mm padding
        });

        const tableHeight = rowHeights.reduce((a, b) => a + b, 0);
        checkPageBreak(tableHeight + 6);
        const tableStartY = y;

        pdf.setDrawColor(60, 60, 60);

        // Draw cells content
        let currentY = tableStartY;
        tableRows.forEach((row, rowIndex) => {
          const isHeaderRow = hasHeader && rowIndex === 0;
          const rowHeight = rowHeights[rowIndex];

          // Draw header background
          if (isHeaderRow) {
            pdf.setFillColor(230, 230, 230);
            pdf.rect(margin, currentY, contentWidth, rowHeight, "F");
          }

          // Draw cell text
          row.forEach((cell, colIndex) => {
            const cellX = margin + colIndex * colWidth;
            pdf.setFontSize(9);
            pdf.setFont("helvetica", isHeaderRow ? "bold" : "normal");
            const cleanCell = cell
              .replace(/`/g, "")
              .replace(/\*\*(.+?)\*\*/g, "$1")
              .replace(/\*(.+?)\*/g, "$1");
            const wrappedLines = pdf.splitTextToSize(cleanCell, cellContentWidth);

            wrappedLines.forEach((textLine: string, lineIndex: number) => {
              pdf.text(textLine, cellX + cellPadding, currentY + 3.5 + lineIndex * 4);
            });
          });

          currentY += rowHeight;
        });

        // Draw outer border
        pdf.setLineWidth(0.4);
        pdf.rect(margin, tableStartY, contentWidth, tableHeight);

        // Draw horizontal lines
        pdf.setLineWidth(0.2);
        let lineY = tableStartY;
        rowHeights.forEach((rowHeight, rowIndex) => {
          lineY += rowHeight;
          if (rowIndex < tableRows.length - 1) {
            if (hasHeader && rowIndex === 0) {
              pdf.setLineWidth(0.4);
              pdf.line(margin, lineY, margin + contentWidth, lineY);
              pdf.setLineWidth(0.2);
            } else {
              pdf.line(margin, lineY, margin + contentWidth, lineY);
            }
          }
        });

        // Draw vertical lines
        pdf.setLineWidth(0.2);
        for (let c = 1; c < colCount; c++) {
          const lineX = margin + c * colWidth;
          pdf.line(lineX, tableStartY, lineX, tableStartY + tableHeight);
        }

        y = tableStartY + tableHeight + 4;
        pdf.setFont("helvetica", "normal");
      }
      continue;
    }

    // Numbered list
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      checkPageBreak();
      pdf.setFontSize(10);
      pdf.text(`${numberedMatch[1]}.`, margin + 2, y);
      renderText(numberedMatch[2], margin + 8, 10);
      i++;
      continue;
    }

    // Bullet list
    if (/^[-*+]\s+/.test(trimmed)) {
      checkPageBreak();
      pdf.setFontSize(10);
      pdf.text("•", margin + 3, y);
      renderText(trimmed.slice(2), margin + 8, 10);
      i++;
      continue;
    }

    // Checkbox list
    const checkboxMatch = trimmed.match(/^[-*+]\s+\[([ xX])\]\s+(.+)$/);
    if (checkboxMatch) {
      checkPageBreak();
      const checked = checkboxMatch[1].toLowerCase() === "x";
      pdf.setFontSize(10);
      pdf.text(checked ? "☑" : "☐", margin + 3, y);
      renderText(checkboxMatch[2], margin + 10, 10);
      i++;
      continue;
    }

    // Regular paragraph
    checkPageBreak();
    renderText(trimmed, margin, 10);
    i++;
  }

  return pdf.output("arraybuffer");
}

// IMAGE → PDF (Yeh wala 100% fix hai!)
async function imageToPDF(arrayBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  const pdf = new jsPDF();

  // Yeh line thi problem — ab bilkul perfect fix
  const nodeBuffer = Buffer.from(arrayBuffer as ArrayBuffer);

  let finalBuffer: Buffer = nodeBuffer;
  try {
    finalBuffer = await sharp(arrayBuffer).jpeg({ quality: 90 }).toBuffer();
  } catch {
    // agar sharp fail ho to original use karo
  }

  const base64 = finalBuffer.toString("base64");
  const imgData = `data:image/jpeg;base64,${base64}`;

  try {
    pdf.addImage(imgData, "JPEG", 10, 10, 190, 0);
  } catch {
    pdf.setFontSize(14);
    pdf.text("Could not load image", 15, 20);
  }

  return pdf.output("arraybuffer");
}

// DOCX → PDF (bilkul safe)
async function docxToPDF(arrayBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  const pdf = new jsPDF();
  let y = 30;
  pdf.setFontSize(16);
  pdf.text("Word Document", 15, 15);

  try {
    const result = await mammoth.convertToHtml({
      buffer: Buffer.from(arrayBuffer as ArrayBuffer), // ← yeh fix 100% kaam karta hai
    });

    const text = result.value
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) throw new Error("Empty");

    pdf.setFontSize(11);
    pdf.splitTextToSize(text, 180).forEach((line: string) => {
      if (y > 280) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(line, 15, y);
      y += 7;
    });
  } catch {
    pdf.setFontSize(12);
    pdf.setTextColor(150, 0, 0);
    pdf.text("Failed to read DOCX file", 15, y);
    y += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text("May be password-protected or corrupted", 15, y);
  }

  return pdf.output("arraybuffer");
}

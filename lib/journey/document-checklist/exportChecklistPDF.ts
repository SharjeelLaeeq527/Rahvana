import jsPDF from "jspdf";

import type { DocumentChecklistItem } from "@/lib/journey/document-checklist/types";

interface ExportChecklistPdfParams {
  journeyType: string;
  sectionTitle: string;
  sectionDescription: string;
  documents: DocumentChecklistItem[];
}

const formatJourneyType = (journeyType: string): string => {
  const normalized = journeyType.trim().toUpperCase();

  switch (normalized) {
    case "IR1":
    case "IR-1":
      return "IR-1";

    case "IR2":
    case "IR-2":
      return "IR-2";

    case "IR5":
    case "IR-5":
      return "IR-5";

    default:
      return journeyType;
  }
};

const formatStatus = (item: DocumentChecklistItem): string => {
  return item.is_uploaded ? "Uploaded" : "Not uploaded";
};

const formatExpiration = (item: DocumentChecklistItem): string => {
  if (!item.is_expirable || !item.expiry_date) {
    return "";
  }

  if (item.expiration_status === "expired") {
    return "Expired";
  }

  if (item.expiration_status === "expiring_soon" && item.days_until_expiry !== undefined) {
    if (item.days_until_expiry === 0) {
      return "Expires today";
    }

    if (item.days_until_expiry === 1) {
      return "Expires tomorrow";
    }

    return `${item.days_until_expiry} days left`;
  }

  return "Valid";
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const loadImageAsDataUrl = async (src: string): Promise<string> => {
  const response = await fetch(src);

  if (!response.ok) {
    throw new Error(`Failed to load image: ${src}`);
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert image to data URL"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read image"));
    };

    reader.readAsDataURL(blob);
  });
};

const addWrappedText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 5
): number => {
  const lines = doc.splitTextToSize(text, maxWidth);

  doc.text(lines, x, y);

  return y + lines.length * lineHeight;
};

// Header
const addPageHeader = (doc: jsPDF, logoDataUrl: string, sectionTitle: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  const safeInset = 4;
  const headerHeight = 20;

  // Header background with print-safe inset.
  doc.setFillColor(4, 58, 62);
  doc.rect(safeInset, safeInset, pageWidth - safeInset * 2, headerHeight, "F");

  // Rahvana logo.
  doc.addImage(logoDataUrl, "PNG", safeInset + 10, safeInset + 4.5, 30, 10);

  // Right-side title.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);

  doc.text(sectionTitle || "Document Checklist", pageWidth - safeInset - 10, safeInset + 8, {
    align: "right",
  });

  // Website.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(180, 219, 219);

  doc.text("rahvana.com", pageWidth - safeInset - 10, safeInset + 12.5, {
    align: "right",
  });
};

// Footer
const addPageFooter = (doc: jsPDF, logoDataUrl: string, pageNumber: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const safeInset = 4;
  const margin = 20;

  // Footer divider.
  doc.setDrawColor(230, 236, 241);
  doc.setLineWidth(0.25);

  doc.line(margin, pageHeight - 18 - safeInset, pageWidth - margin, pageHeight - 18 - safeInset);

  // Rahvana logo.
  doc.addImage(logoDataUrl, "PNG", margin, pageHeight - 14.5 - safeInset, 22, 7);

  // Page number.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(110, 126, 141);

  doc.text(String(pageNumber), pageWidth - margin, pageHeight - 10.5 - safeInset, {
    align: "right",
  });
};

export const exportChecklistToPdf = async ({
  journeyType,
  sectionTitle,
  sectionDescription,
  documents,
}: ExportChecklistPdfParams): Promise<void> => {
  if (!documents.length) {
    return;
  }

  const headerLogo = await loadImageAsDataUrl("/assets/images/RahvanaLogo.png");

  const footerLogo = await loadImageAsDataUrl("/assets/images/RahvanaLogo.png");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const normalizedJourneyType = formatJourneyType(journeyType);

  addPageHeader(doc, headerLogo, "Document Checklist");

  // Main heading
  let currentY = 32;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(13, 115, 119);

  currentY = addWrappedText(
    doc,
    `${normalizedJourneyType} Visa Journey`,
    margin,
    currentY,
    contentWidth,
    5
  );

  currentY += 3;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(16, 35, 60);

  currentY = addWrappedText(doc, sectionTitle, margin, currentY, contentWidth, 5);

  // Section description.
  if (sectionDescription) {
    currentY += 2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(82, 101, 121);

    currentY = addWrappedText(doc, sectionDescription, margin, currentY, contentWidth, 4);
  }

  // Generated date.
  currentY += 2;

  doc.setFontSize(7.5);
  doc.setTextColor(96, 116, 135);

  doc.text(`Generated: ${formatDate(new Date())}`, margin, currentY);

  // Summary - Moved closer to the heading so there isn't a large empty gap.
  currentY += 7;

  const uploadedCount = documents.filter((item) => item.is_uploaded).length;

  const remainingCount = documents.length - uploadedCount;

  const attentionCount = documents.filter((item) => item.needs_attention).length;

  const summaryHeight = attentionCount > 0 ? 21 : 17;

  doc.setFillColor(247, 250, 252);
  doc.setDrawColor(225, 234, 241);

  doc.roundedRect(margin, currentY, contentWidth, summaryHeight, 2.5, 2.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(16, 35, 60);

  doc.text("Checklist Summary", margin + 5, currentY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(82, 101, 121);

  doc.text(`${documents.length} total`, margin + 5, currentY + 12);

  doc.text(`${uploadedCount} uploaded`, margin + 48, currentY + 12);

  doc.text(`${remainingCount} remaining`, margin + 90, currentY + 12);

  if (attentionCount > 0) {
    doc.text(`${attentionCount} requiring attention`, margin + 135, currentY + 12);
  }

  if (attentionCount > 0) {
    doc.setTextColor(180, 91, 104);

    doc.text("Please review items requiring attention.", margin + 5, currentY + 18);
  }

  currentY += summaryHeight + 7;

  // Checklist
  documents.forEach((item, index) => {
    const title = item.title || "Untitled document";
    const status = formatStatus(item);
    const expiration = formatExpiration(item);

    /*
     * Compact two-line checklist item:
     *
     * [✓] Document Name
     *     Status: Uploaded    Expiration: Valid
     */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);

    const titleLines = doc.splitTextToSize(title, contentWidth - 18);

    const titleLineHeight = 4.2;

    const titleHeight = titleLines.length * titleLineHeight;

    const statusLineHeight = 3.8;

    const itemHeight = Math.max(titleHeight, 4.5) + statusLineHeight + 3;

    if (currentY + itemHeight > pageHeight - 27) {
      doc.addPage();

      addPageHeader(doc, headerLogo, "Document Checklist");

      currentY = 32;
    }

    // Checkbox
    const checkboxX = margin;
    const checkboxY = currentY + 0.5;
    const checkboxSize = 4;

    if (item.is_uploaded) {
      doc.setFillColor(13, 115, 119);
      doc.setDrawColor(13, 115, 119);

      doc.roundedRect(checkboxX, checkboxY, checkboxSize, checkboxSize, 0.8, 0.8, "FD");

      // Check mark.
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.7);

      doc.line(checkboxX + 0.9, checkboxY + 2.1, checkboxX + 1.8, checkboxY + 3);

      doc.line(checkboxX + 1.8, checkboxY + 3, checkboxX + 3.3, checkboxY + 1);
    } else {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(180, 194, 204);
      doc.setLineWidth(0.5);

      doc.roundedRect(checkboxX, checkboxY, checkboxSize, checkboxSize, 0.8, 0.8, "FD");
    }

    // Document name.
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(16, 35, 60);

    doc.text(titleLines, margin + 8, currentY + 4, {
      lineHeightFactor: 1.15,
    });

    // Status + optional expiration.
    const statusY = currentY + Math.max(titleHeight, 4.5) + 2.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(96, 116, 135);

    doc.text(`Status: ${status}`, margin + 8, statusY);

    if (expiration) {
      doc.text(`Expiration: ${expiration}`, margin + 65, statusY);
    }

    // Small divider between checklist items.
    // This keeps the checklist visually structured without wasting vertical space with large cards.
    if (index < documents.length - 1) {
      doc.setDrawColor(232, 238, 243);
      doc.setLineWidth(0.2);

      doc.line(
        margin + 8,
        currentY + itemHeight - 1,
        margin + contentWidth,
        currentY + itemHeight - 1
      );
    }

    currentY += itemHeight;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);

    addPageFooter(doc, footerLogo, page);
  }

  // Filename
  const safeJourneyType = normalizedJourneyType.replace(/[^a-zA-Z0-9-]/g, "");

  const safeSectionName = sectionTitle
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  doc.save(`Rahvana-${safeJourneyType}-${safeSectionName}.pdf`);
};

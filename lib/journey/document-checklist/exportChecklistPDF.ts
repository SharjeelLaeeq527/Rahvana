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
  if (item.is_uploaded) {
    return "Uploaded";
  }

  return "Not uploaded";
};

const formatExpiration = (item: DocumentChecklistItem): string => {
  if (!item.is_expirable || !item.expiry_date) {
    return "—";
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

const addPageHeader = (doc: jsPDF, logoDataUrl: string, sectionTitle: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(4, 58, 62);
  doc.rect(0, 0, pageWidth, 20, "F");

  // Rahvana logo
  doc.addImage(logoDataUrl, "PNG", 14, 4.5, 30, 10);

  // Right-side title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);

  doc.text(sectionTitle || "Document Checklist", pageWidth - 14, 8, {
    align: "right",
  });

  // Website
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(180, 219, 219);

  doc.text("rahvana.com", pageWidth - 14, 12.5, {
    align: "right",
  });
};

const addPageFooter = (doc: jsPDF, logoDataUrl: string, pageNumber: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Footer divider
  doc.setDrawColor(230, 236, 241);
  doc.setLineWidth(0.25);

  doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

  // Rahvana logo
  doc.addImage(logoDataUrl, "PNG", margin, pageHeight - 14.5, 22, 7);

  // Page number
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(110, 126, 141);

  doc.text(String(pageNumber), pageWidth - margin, pageHeight - 10.5, {
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

  let currentY = 38;

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

  currentY += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(16, 35, 60);

  currentY = addWrappedText(doc, sectionTitle, margin, currentY, contentWidth, 5);

  currentY += 3;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(82, 101, 121);

  currentY = addWrappedText(doc, sectionDescription, margin, currentY, contentWidth, 5);

  currentY += 5;

  doc.setFontSize(8.5);
  doc.setTextColor(96, 116, 135);

  doc.text(`Generated: ${formatDate(new Date())}`, margin, currentY);

  // Summary
  currentY += 14;

  const uploadedCount = documents.filter((item) => item.is_uploaded).length;

  const remainingCount = documents.length - uploadedCount;

  const attentionCount = documents.filter((item) => item.needs_attention).length;

  doc.setFillColor(247, 250, 252);
  doc.setDrawColor(225, 234, 241);

  doc.roundedRect(margin, currentY, contentWidth, 25, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(16, 35, 60);

  doc.text("Checklist Summary", margin + 6, currentY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(82, 101, 121);

  doc.text(`${documents.length} total documents`, margin + 6, currentY + 14);

  doc.text(`${uploadedCount} uploaded`, margin + 65, currentY + 14);

  doc.text(`${remainingCount} remaining`, margin + 110, currentY + 14);

  if (attentionCount > 0) {
    doc.text(`${attentionCount} requiring attention`, margin + 6, currentY + 20);
  }

  currentY += 35;

  // Documents

  documents.forEach((item, index) => {
    const title = item.title || "Untitled document";
    const subtitle = item.subtitle || "";
    const notes = item.notes || "";

    const status = formatStatus(item);
    const expiration = formatExpiration(item);

    // Estimate card height.
    const titleLines = doc.splitTextToSize(title, contentWidth - 12);

    const subtitleLines = subtitle ? doc.splitTextToSize(subtitle, contentWidth - 12) : [];

    const notesLines = notes ? doc.splitTextToSize(notes, contentWidth - 12) : [];

    const cardHeight =
      17 +
      titleLines.length * 5 +
      (subtitleLines.length ? subtitleLines.length * 4 + 4 : 0) +
      13 +
      (notesLines.length ? notesLines.length * 4 + 5 : 0);

    // Page break.
    if (currentY + cardHeight > pageHeight - 25) {
      doc.addPage();

      addPageHeader(doc, headerLogo, "Document Checklist");

      currentY = 38;
    }

    // Card
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 231, 239);

    doc.roundedRect(margin, currentY, contentWidth, cardHeight, 3, 3, "FD");

    // Document number.
    doc.setFillColor(231, 242, 247);

    doc.circle(margin + 7, currentY + 8, 3.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(13, 115, 119);

    doc.text(String(index + 1), margin + 7, currentY + 10, {
      align: "center",
    });

    // Title.
    let itemY = currentY + 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(16, 35, 60);

    itemY = addWrappedText(doc, title, margin + 14, itemY, contentWidth - 14, 5);

    // Subtitle.
    if (subtitle) {
      itemY += 1;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(83, 103, 121);

      itemY = addWrappedText(doc, subtitle, margin + 14, itemY, contentWidth - 14, 4);
    }

    // Status line.
    itemY += 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(82, 101, 121);

    doc.text(`Status: ${status}`, margin + 14, itemY);

    doc.text(`Required: ${item.is_required ? "Yes" : "No"}`, margin + 70, itemY);

    doc.text(`Expiration: ${expiration}`, margin + 120, itemY);

    // Guidance.
    if (notes) {
      itemY += 7;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(13, 115, 119);

      doc.text("Guidance", margin + 14, itemY);

      itemY += 4;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(82, 101, 121);

      addWrappedText(doc, notes, margin + 14, itemY, contentWidth - 14, 4);
    }

    currentY += cardHeight + 5;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);

    addPageFooter(doc, footerLogo, page);
  }

  // Download
  const safeJourneyType = normalizedJourneyType.replace(/[^a-zA-Z0-9-]/g, "");

  const safeSectionName = sectionTitle
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  doc.save(`Rahvana-${safeJourneyType}-${safeSectionName}.pdf`);
};

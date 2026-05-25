import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFName,
  PDFString,
  PDFPage,
  PDFFont,
  PDFRef,
} from "pdf-lib";
import { generateRequiredDocumentsList, DocumentItem } from "./documentDefinitions";
import { FormSelections } from "../types/221g";

interface PDFGeneratorOptions {
  coverLetterData: {
    applicantName: string;
    caseNumber: string;
    interviewDate: string;
    embassy: string;
    additionalNotes: string;
  };
  selectedItems: FormSelections;
  uploadedDocs: Record<
    string,
    Array<{
      file: File;
      uploadDate: Date;
      quality: "excellent" | "good" | "needs-review";
    }>
  >;
}

const drawWrappedText = (
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  maxWidth: number,
  lineHeight: number
) => {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  words.forEach((word) => {
    const testLine = line + (line ? " " : "") + word;
    const width = font.widthOfTextAtSize(testLine, size);
    if (width > maxWidth) {
      page.drawText(line, { x, y: currentY, size, font });
      currentY -= lineHeight;
      line = word;
    } else {
      line = testLine;
    }
  });
  if (line) {
    page.drawText(line, { x, y: currentY, size, font });
    currentY -= lineHeight;
  }
  return currentY;
};

const generateCoverLetter = (
  coverLetterData: PDFGeneratorOptions["coverLetterData"],
  documents: DocumentItem[]
) => {
  const docsList = documents.map((doc, i) => `${i + 1}. ${doc.name}`).join("\n");

  return `
U.S. Embassy ${coverLetterData.embassy.charAt(0).toUpperCase() + coverLetterData.embassy.slice(1)}
Immigrant Visa Unit

RE: Additional Documents for Case ${coverLetterData.caseNumber}
Applicant: ${coverLetterData.applicantName}
Interview Date: ${coverLetterData.interviewDate}

Dear Consular Officer,

I am respectfully submitting the additional documents as requested in my 221(g) letter received after my immigrant visa interview on ${coverLetterData.interviewDate}.

DOCUMENTS SUBMITTED:
${docsList}

I have carefully reviewed each document to ensure completeness, proper certification, and translation where required. All documents are originals or certified copies as specified in your 221(g) letter.

${
  coverLetterData.embassy.toLowerCase() === "islamabad"
    ? `For submission in Islamabad: I am using the designated courier service as specified in the 221(g) letter and have retained the tracking receipt for my records.`
    : ""
}

${coverLetterData.additionalNotes ? `\nADDITIONAL INFORMATION:\n${coverLetterData.additionalNotes}\n` : ""}

I appreciate your time and consideration of my case. Please contact me at the email or phone number provided in my original application if you require any additional information.

Thank you for your attention to this matter.

Respectfully submitted,
${coverLetterData.applicantName}
Case Number: ${coverLetterData.caseNumber}
Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
  `.trim();
};

const generateDocumentIndex = (
  docs: DocumentItem[],
  coverLetterData: PDFGeneratorOptions["coverLetterData"]
) => {
  let indexText = "";
  indexText += "The following documents are included in this submission:\n\n";

  docs.forEach((doc, i) => {
    indexText += `${i + 1}. ${doc.name}\n`;
  });

  indexText += `\nTotal Documents: ${docs.length}\nSubmitted by: ${coverLetterData.applicantName}\nCase Number: ${coverLetterData.caseNumber}\nDate: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;

  return indexText;
};

export const generatePDFPacket = async (options: PDFGeneratorOptions): Promise<void> => {
  try {
    const { coverLetterData, selectedItems, uploadedDocs } = options;

    // Generate the list of required documents using the shared utility
    // This ensures IDs match what's in uploadedDocs
    const docs = generateRequiredDocumentsList(selectedItems);

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Cover Letter Page
    let coverPage = pdfDoc.addPage([595, 842]); // A4 size
    let y = 780;
    const coverText = generateCoverLetter(coverLetterData, docs);
    const paragraphs = coverText.split("\n\n"); // Split into paragraphs for better handling
    for (const para of paragraphs) {
      const lines = para.split("\n");
      for (const line of lines) {
        const isBold =
          line.startsWith("U.S. Embassy") ||
          line.startsWith("RE:") ||
          line.startsWith("Dear") ||
          line.startsWith("Respectfully") ||
          line.startsWith("DOCUMENTS SUBMITTED:") ||
          line.startsWith("ADDITIONAL INFORMATION:");
        const f = isBold ? boldFont : font;
        const size = isBold ? 12 : 11;
        y = drawWrappedText(coverPage, line, 50, y, size, f, 495, 15);
      }
      y -= 10; // Space between paragraphs
      if (y < 50) {
        coverPage = pdfDoc.addPage([595, 842]);
        y = 780;
      }
    }

    // Document Index Page
    const indexPage = pdfDoc.addPage([595, 842]);
    y = 780;
    const indexText = generateDocumentIndex(docs, coverLetterData);
    const indexLines = indexText.split("\n");
    const docStartPages: number[] = []; // To store 0-indexed start pages for each doc
    const lineHeights: { line: string; y: number; pageIndex: number }[] = []; // To track y positions for links

    indexPage.drawText("Document Index", { x: 50, y, size: 16, font: boldFont });
    y -= 30;

    let currentIndexPage = indexPage;
    let currentIndexPageIndex = pdfDoc.getPageCount() - 1;

    for (const line of indexLines) {
      if (line.trim()) {
        y = drawWrappedText(currentIndexPage, line, 50, y, 12, font, 495, 15);
        lineHeights.push({ line, y: y + 15, pageIndex: currentIndexPageIndex }); // Approximate for link rect
      }
      y -= 5;
      if (y < 50) {
        currentIndexPage = pdfDoc.addPage([595, 842]);
        currentIndexPageIndex = pdfDoc.getPageCount() - 1;
        y = 780;
      }
    }

    // Merge uploaded documents and track start pages
    let docIndex = 0;
    for (const doc of docs) {
      const docId = doc.id;
      if (uploadedDocs[docId] && uploadedDocs[docId].length > 0) {
        docStartPages[docIndex] = pdfDoc.getPageCount();

        // Separator page removed as per user request
        // const sepPage = pdfDoc.addPage([595, 842]);
        // sepPage.drawText(doc.name, { x: 50, y: 421, size: 24, font: boldFont });

        for (const { file } of uploadedDocs[docId]) {
          try {
            const fileBuffer = await file.arrayBuffer();
            if (file.type === "application/pdf") {
              const uploadedPdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
              const copiedPages = await pdfDoc.copyPages(uploadedPdf, uploadedPdf.getPageIndices());
              copiedPages.forEach((page) => pdfDoc.addPage(page));
            } else {
              // Image
              const img = file.type.includes("png")
                ? await pdfDoc.embedPng(fileBuffer)
                : await pdfDoc.embedJpg(fileBuffer);
              const page = pdfDoc.addPage();
              const scale = Math.min(page.getWidth() / img.width, page.getHeight() / img.height, 1);
              const { width, height } = img.scale(scale);
              page.drawImage(img, {
                x: (page.getWidth() - width) / 2,
                y: (page.getHeight() - height) / 2,
                width,
                height,
              });
            }
          } catch (error) {
            console.error("Error processing file:", error);
            continue;
          }
        }
      } else {
        // If no upload, point to index page (or maybe just don't link)
        docStartPages[docIndex] = currentIndexPageIndex;
      }
      docIndex++;
    }

    // Add clickable links to index page
    const pages = pdfDoc.getPages();
    lineHeights.forEach(({ line, y: lineY, pageIndex }) => {
      if (/^\d+\./.test(line)) {
        // Only for numbered doc lines
        const docIdx = parseInt(line.split(".")[0]) - 1;
        const targetPageIdx = docStartPages[docIdx];

        // Only create link if we have a valid target page (and it's not the index page itself, unless we want that)
        if (targetPageIdx !== undefined && targetPageIdx !== pageIndex) {
          const linkPage = pages[pageIndex];
          const targetPage = pages[targetPageIdx];

          const link = pdfDoc.context.register(
            pdfDoc.context.obj({
              Type: "Annot",
              Subtype: "Link",
              Rect: [50, lineY - 12, 500, lineY + 2],
              Border: [0, 0, 0],
              C: [0, 0, 1],
              A: {
                Type: "Action",
                S: "GoTo",
                D: [targetPage.ref, "Fit"],
              },
            })
          );

          let annots = linkPage.node.Annots();
          if (!annots) {
            annots = pdfDoc.context.obj([]);
            linkPage.node.set(PDFName.of("Annots"), annots);
          }
          annots.push(link);
        }
      }
    });

    // --- Generate PDF Outlines (Bookmarks) ---
    // This creates the sidebar table of contents

    // 1. Create the Outline Dictionary references
    const outlinesDictRef = pdfDoc.context.nextRef();
    const outlineItemRefs: PDFRef[] = [];

    // Filter docs that have actual pages (not just pointing to index)
    // Or we can bookmark all of them. Let's bookmark all that have a distinct start page.
    const validBookmarks: { title: string; pageIdx: number }[] = [];

    // Add Cover Letter bookmark
    validBookmarks.push({ title: "Cover Letter", pageIdx: 0 });

    // Add Document Index bookmark
    // We know the index page is added right after the cover letter loop.
    // We can capture its index when we create it, but since we are here, we can just look at the page structure.
    // The cover letter starts at 0. The index page starts at 'currentIndexPageIndex' which was set when creating indexPage.
    // Wait, 'currentIndexPageIndex' is updated in the loop.
    // Let's find the index of the first index page.
    // We can assume it's the page after the cover letter pages.
    // But we don't track cover letter page count explicitly.
    // However, we can just use the page index of the first page of the index section.
    // We can capture it earlier.
    // Let's modify the code above to capture it.
    // Or, simpler: we know docStartPages[0] is the start of the first doc.
    // The index page is before that.
    // Actually, we can just find the page index of the 'indexPage' variable.
    // But 'indexPage' is a PDFPage object, it doesn't know its index directly in pdf-lib without searching.
    // Let's search for it in 'pages' array.
    const indexPageIdx = pages.indexOf(indexPage);
    if (indexPageIdx !== -1) {
      validBookmarks.push({ title: "Document Index", pageIdx: indexPageIdx });
    }

    // Actually, let's just stick to the documents for now as requested, plus maybe Cover Letter.

    docs.forEach((doc, i) => {
      const targetPageIdx = docStartPages[i];
      // Only bookmark if it points to a page that is NOT the index page (meaning it has its own separator page)
      // We stored 'currentIndexPageIndex' in docStartPages if it was missing.
      // So if targetPageIdx > currentIndexPageIndex, it's a real doc.
      // Or we can just check if uploadedDocs[doc.id] exists.
      if (uploadedDocs[doc.id] && uploadedDocs[doc.id].length > 0) {
        validBookmarks.push({ title: doc.name, pageIdx: targetPageIdx });
      }
    });

    if (validBookmarks.length > 0) {
      // Create refs for all items
      validBookmarks.forEach(() => outlineItemRefs.push(pdfDoc.context.nextRef()));

      // 2. Create the Outlines Dictionary
      const outlinesDict = pdfDoc.context.obj({
        Type: "Outlines",
        First: outlineItemRefs[0],
        Last: outlineItemRefs[outlineItemRefs.length - 1],
        Count: validBookmarks.length,
      });
      pdfDoc.context.assign(outlinesDictRef, outlinesDict);

      // 3. Create each Outline Item
      validBookmarks.forEach((bookmark, i) => {
        const itemRef = outlineItemRefs[i];
        const prevRef = i > 0 ? outlineItemRefs[i - 1] : null;
        const nextRef = i < validBookmarks.length - 1 ? outlineItemRefs[i + 1] : null;

        const targetPage = pages[bookmark.pageIdx];

        const item = pdfDoc.context.obj({
          Title: PDFString.of(bookmark.title),
          Parent: outlinesDictRef,
          ...(prevRef ? { Prev: prevRef } : {}),
          ...(nextRef ? { Next: nextRef } : {}),
          Dest: [targetPage.ref, "Fit"],
        });

        pdfDoc.context.assign(itemRef, item);
      });

      // 4. Attach Outlines to Catalog
      pdfDoc.catalog.set(PDFName.of("Outlines"), outlinesDictRef);
      // Optional: Open outlines by default? No, usually better closed or user preference.
      // To force open: pdfDoc.catalog.set(PDFName.of('PageMode'), PDFName.of('UseOutlines'));
      pdfDoc.catalog.set(PDFName.of("PageMode"), PDFName.of("UseOutlines"));
    }

    // Footer on all pages
    const pageCount = pdfDoc.getPageCount();
    pages.forEach((page, i) => {
      page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
        x: 50,
        y: 30,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
      page.drawText(`Page ${i + 1} of ${pageCount}`, {
        x: 450,
        y: 30,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
    });

    const pdfBytes = await pdfDoc.save();
    const uint8Array = new Uint8Array(pdfBytes);
    const blob = new Blob([uint8Array], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `221g_Packet_${coverLetterData.caseNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);

    localStorage.removeItem("221gActionPlanProgress");
  } catch (error) {
    console.error("Error generating PDF packet:", error);
    throw new Error("Failed to generate PDF packet");
  }
};

export { generateCoverLetter };

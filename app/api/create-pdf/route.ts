import PDFDocument from "pdfkit";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Type definition for the request body
 */
interface CreatePDFRequest {
  text: string;
}

/**
 * POST /api/create-pdf
 *
 * Generates a PDF from plain text input.
 * This is a server-side API route that uses PDFKit for PDF generation.
 *
 * @param request - NextRequaest containing the text to convert
 * @returns PDF as a blob with appropriate headers for download
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate request body
    const body = (await request.json()) as CreatePDFRequest;

    if (!body.text || typeof body.text !== "string") {
      return NextResponse.json(
        { error: "Text field is required and must be a string" },
        { status: 400 }
      );
    }

    const text = body.text.trim();

    if (text.length === 0) {
      return NextResponse.json({ error: "Text cannot be empty" }, { status: 400 });
    }

    if (text.length > 50000) {
      return NextResponse.json(
        { error: "Text exceeds maximum length of 50,000 characters" },
        { status: 413 }
      );
    }

    // Generate PDF using PDFKit
    const pdf = await generatePDFBuffer(text);

    // Return PDF with proper headers for download
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="document-${Date.now()}.pdf"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("[PDF Generation Error]", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate PDF",
      },
      { status: 500 }
    );
  }
}

/**
 * Generates a PDF buffer from text content
 * Uses PDFKit library for professional PDF generation
 *
 * @param text - The text content to convert to PDF
 * @returns Promise<Buffer> - The PDF as a buffer
 */
async function generatePDFBuffer(text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({
        bufferPages: true,
        margin: 50,
      });

      // Add document metadata
      doc.info["Title"] = "Converted Document";
      doc.info["Author"] = "PDF Converter";

      // Collect PDF chunks
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on("end", () => {
        // Combine all chunks into a single buffer
        resolve(Buffer.concat(chunks));
      });

      doc.on("error", (err: Error) => {
        reject(err);
      });

      // Add title
      doc.fontSize(24).font("Helvetica-Bold").text("Document", {
        align: "center",
      });

      // Add date
      doc.fontSize(10).font("Helvetica").text(`Generated on ${new Date().toLocaleDateString()}`, {
        align: "center",
      });

      // Add separator
      doc
        .moveTo(50, doc.y + 10)
        .lineTo(550, doc.y + 10)
        .stroke();
      doc.y += 20;

      // Add content text with word wrapping and proper formatting
      doc.fontSize(12).font("Helvetica").text(text, {
        align: "left",
        width: 500,
        lineGap: 5,
      });

      // Add footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(9)
          .font("Helvetica")
          .text(`Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 50, {
            align: "center",
          });
      }

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

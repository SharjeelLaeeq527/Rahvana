import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getServiceRoleClient } from "@/lib/api/authGuards";
import {
  buildSearchOrClause,
  isLedgerFilter,
  sanitizeSearch,
  typesForFilter,
  toNumber,
  type LedgerTransaction,
} from "@/lib/wallet/transactions";

/**
 * GET /api/wallet/transactions/statement?type=all&days=0&q=
 * Server-side PDF of the caller's credit ledger ("Download Statement").
 * Same filters as the list route; renders at most MAX_ROWS line items and
 * says so when the window was larger. Design mirrors the Document Checklist
 * PDF (dark teal header band, Rahvana logo, summary panel, zebra table,
 * per-page footer) but is generated with PDFKit like /api/create-pdf.
 */

const MAX_ROWS = 1000;
const LEDGER_COLUMNS =
  "id, transaction_type, amount, amount_usd, balance_before, balance_after, description, resource_type, resource_id, status, created_at";

// Palette (matches lib/journey/document-checklist/exportChecklistPDF.ts).
// pdfkit silently ignores "r,g,b" comma strings (no color operator is emitted,
// so shapes inherit the previous state) — hex strings are the safe form.
const TEAL_DARK = "#043A3E"; // header band
const TEAL = "#0D7377"; // brand accents
const INK = "#10233C"; // primary text
const MUTED = "#607487"; // secondary text
const FAINT = "#788898";
const GREEN = "#057A55";
const LINE = "#E1EAF1";
const ZEBRA = "#F8FAFB";

const PAGE_MARGIN = 42;
const HEADER_BAND_H = 64;
const BOTTOM_LIMIT_OFFSET = 60;

const creditsFmt = (n: number) => Math.abs(n).toLocaleString("en-US");
const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
const timeFmt = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

function loadLogoBytes(): Buffer | null {
  try {
    const file = path.join(process.cwd(), "public", "assets", "images", "RahvanaLogo.png");
    return fs.existsSync(file) ? fs.readFileSync(file) : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const rawType = params.get("type") ?? "all";
  if (!isLedgerFilter(rawType)) {
    return NextResponse.json({ success: false, error: "INVALID_TYPE" }, { status: 400 });
  }
  const rawDays = params.get("days");
  let days = 0;
  if (rawDays !== null && (!/^\d+$/.test(rawDays) || Number(rawDays) > 3650)) {
    return NextResponse.json({ success: false, error: "INVALID_RANGE" }, { status: 400 });
  }
  days = rawDays === null ? 0 : Number(rawDays);
  const search = sanitizeSearch(params.get("q") ?? "");

  const supabase = getServiceRoleClient();
  const periodStart = days > 0 ? new Date(Date.now() - days * 86_400_000) : null;

  const baseFilter = () => {
    let query = supabase.from("credit_transactions").select(LEDGER_COLUMNS).eq("user_id", user.id);
    const types = typesForFilter(rawType);
    if (types.length > 0) query = query.in("transaction_type", types);
    if (periodStart) query = query.gte("created_at", periodStart.toISOString());
    if (search) query = query.or(buildSearchOrClause(search));
    return query;
  };

  try {
    const [{ data, error }, openingRes, profileRes] = await Promise.all([
      baseFilter().order("created_at", { ascending: false }).limit(MAX_ROWS),
      periodStart
        ? supabase
            .from("credit_transactions")
            .select("balance_after")
            .eq("user_id", user.id)
            .eq("status", "completed")
            .lt("created_at", periodStart.toISOString())
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    ]);

    // Supabase's failure arm of the response union is normalized away here:
    // a missing opening/profile row simply reads as "no data".
    const openingData = (
      openingRes as unknown as { data?: { balance_after?: string | number } | null }
    ).data;
    const fullName = (profileRes as unknown as { data?: { full_name?: string } | null }).data
      ?.full_name;

    if (error) {
      console.error("[wallet] statement failed:", error);
      return NextResponse.json(
        { success: false, error: "Could not build the statement" },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as LedgerTransaction[];
    // Rows are newest-first; the opening balance is the balance before the
    // oldest listed row (or the last completed row before the window start).
    let openingBalance = toNumber(openingData?.balance_after);
    if (!periodStart && rows.length > 0) {
      openingBalance = toNumber(rows[rows.length - 1].balance_before);
    }
    const closingBalance = rows.length > 0 ? toNumber(rows[0].balance_after) : openingBalance;
    const totalAdded = rows.reduce(
      (s, r) => (r.status === "completed" && Number(r.amount) > 0 ? s + Number(r.amount) : s),
      0
    );
    const totalSpent = rows.reduce(
      (s, r) => (r.status === "completed" && Number(r.amount) < 0 ? s - Number(r.amount) : s),
      0
    );
    const completedCount = rows.filter((r) => r.status === "completed").length;
    const pendingCount = rows.filter((r) => r.status === "pending").length;

    const pdf = await renderStatement({
      accountName: fullName || user.email?.split("@")[0] || "Rahvana Account",
      email: user.email || "",
      periodLabel: periodStart
        ? `${dateFmt(periodStart.toISOString())} - ${dateFmt(new Date().toISOString())}`
        : "All time",
      rows,
      truncated: rows.length === MAX_ROWS,
      openingBalance,
      closingBalance,
      totalAdded,
      totalSpent,
      completedCount,
      pendingCount,
    });

    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Rahvana-Wallet-Statement-${stamp}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[wallet] statement generation failed:", err);
    return NextResponse.json(
      { success: false, error: "Could not generate the statement" },
      { status: 500 }
    );
  }
}

export type StatementInput = {
  accountName: string;
  email: string;
  periodLabel: string;
  rows: LedgerTransaction[];
  truncated: boolean;
  openingBalance: number;
  closingBalance: number;
  totalAdded: number;
  totalSpent: number;
  completedCount: number;
  pendingCount: number;
};

// Table columns (widths in pt, sum = 511 = A4 width - 2 * margin)
const COLS = [
  { key: "date", label: "DATE", width: 72 },
  { key: "description", label: "DESCRIPTION", width: 165 },
  { key: "category", label: "CATEGORY", width: 78 },
  { key: "status", label: "STATUS", width: 65 },
  { key: "credits", label: "CREDITS", width: 65 },
  { key: "balance", label: "BALANCE", width: 58 },
] as const;

function wrapDescription(
  doc: PDFKit.PDFDocument,
  text: string,
  width: number,
  maxLines = 2
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (doc.widthOfString(candidate) <= width) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;

    if (lines.length === maxLines) {
      break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  const consumedAllWords = lines.join(" ").trim() === words.join(" ").trim();

  if (!consumedAllWords && lines.length > 0) {
    const lastIndex = lines.length - 1;
    let lastLine = lines[lastIndex].replace(/\.{3}$/, "").trim();

    while (lastLine && doc.widthOfString(`${lastLine}...`) > width) {
      lastLine = lastLine.slice(0, -1).trimEnd();
    }

    lines[lastIndex] = `${lastLine}...`;
  }

  return lines.length > 0 ? lines : ["Wallet transaction"];
}

// Exported for tests: renders the full multi-page statement PDF buffer.
export function renderStatement(input: StatementInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      // Everything is positioned with explicit coordinates and rows paginate
      // via the manual BOTTOM_LIMIT_OFFSET check. A nonzero bottom margin
      // would make pdfkit's auto-pagination inject phantom pages (the footer
      // sits below the content area by design).
      margin: { top: PAGE_MARGIN, bottom: 0, left: PAGE_MARGIN, right: PAGE_MARGIN },
      bufferPages: true,
      info: { Title: "Rahvana Wallet Statement", Author: "Rahvana" },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const contentW = pageW - PAGE_MARGIN * 2;
    const logo = loadLogoBytes();

    const drawHeaderBand = () => {
      doc.rect(0, 0, pageW, HEADER_BAND_H).fill(TEAL_DARK);
      if (logo) {
        try {
          doc.image(logo, PAGE_MARGIN, (HEADER_BAND_H - 26) / 2, { height: 26 });
        } catch {
          /* logo is decorative - never fail the statement over it */
        }
      }
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#FFFFFF")
        .text("RAHVANA WALLET STATEMENT", PAGE_MARGIN, 22, { align: "right", width: contentW });
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor("#B4DBDB")
        .text("rahvana.com", PAGE_MARGIN, 38, { align: "right", width: contentW });
    };

    const drawTableHeader = (y: number): number => {
      doc.rect(PAGE_MARGIN, y, contentW, 18).fill(TEAL);
      let x = PAGE_MARGIN + 6;
      doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFFFFF");
      for (const col of COLS) {
        const alignRight = col.key === "credits" || col.key === "balance";
        doc.text(col.label, x, y + 6, {
          width: col.width - 8,
          align: alignRight ? "right" : "left",
        });
        x += col.width;
      }
      return y + 18;
    };

    // ---- First page -------------------------------------------------------
    drawHeaderBand();
    let y = HEADER_BAND_H + 28;

    doc
      .font("Helvetica-Bold")
      .fontSize(19)
      .fillColor(TEAL)
      .text("Credit Wallet Statement", PAGE_MARGIN, y);
    const statementNo = `RW-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(INK)
      .text(statementNo, PAGE_MARGIN, y + 3, { align: "right", width: contentW });
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(MUTED)
      .text("Statement reference", PAGE_MARGIN, y + 15, { align: "right", width: contentW });
    y += 30;

    doc.font("Helvetica-Bold").fontSize(10).fillColor(INK).text(input.accountName, PAGE_MARGIN, y);
    y += 13;
    doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text(input.email, PAGE_MARGIN, y);
    y += 12;
    doc
      .fontSize(8)
      .fillColor(FAINT)
      .text(
        `Period: ${input.periodLabel}   |   Generated: ${new Date().toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        })}   |   $1 USD = 1 Rahvana Credit`,
        PAGE_MARGIN,
        y
      );
    y += 20;

    // ---- Summary panel ----------------------------------------------------
    const panelH = 58;
    doc
      .roundedRect(PAGE_MARGIN, y, contentW, panelH, 5)
      .fillOpacity(1)
      .fill("#F7FAFC")
      .strokeColor(LINE)
      .lineWidth(0.75)
      .stroke();
    const stats: Array<{ label: string; value: string; color: string }> = [
      {
        label: "OPENING BALANCE",
        value: `${creditsFmt(input.openingBalance)} Credits`,
        color: INK,
      },
      { label: "CREDITS ADDED", value: `+${creditsFmt(input.totalAdded)}`, color: GREEN },
      { label: "CREDITS SPENT", value: `-${creditsFmt(input.totalSpent)}`, color: INK },
      {
        label: "CLOSING BALANCE",
        value: `${creditsFmt(input.closingBalance)} Credits`,
        color: TEAL,
      },
    ];
    const colW = contentW / stats.length;
    stats.forEach((s, i) => {
      const x = PAGE_MARGIN + 14 + i * colW;
      doc
        .font("Helvetica")
        .fontSize(6.5)
        .fillColor(MUTED)
        .text(s.label, x, y + 12, { width: colW - 20 });
      doc
        .font("Helvetica-Bold")
        .fontSize(12.5)
        .fillColor(s.color)
        .text(s.value, x, y + 24, { width: colW - 20 });
    });
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(FAINT)
      .text(
        `${input.rows.length} transactions listed  |  ${input.completedCount} completed${
          input.pendingCount > 0 ? `  |  ${input.pendingCount} pending` : ""
        }`,
        PAGE_MARGIN + 14,
        y + 44
      );
    y += panelH + 16;

    if (input.truncated) {
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(MUTED)
        .text(
          "Note: this statement covers the most recent 1,000 transactions matching the selected filters.",
          PAGE_MARGIN,
          y
        );
      y += 14;
    }

    // ---- Ledger table -----------------------------------------------------
    y = drawTableHeader(y);
    let rowIndex = 0;

    for (const r of input.rows) {
      const amount = toNumber(r.amount);
      const descW = COLS[1].width - 10;

      doc.font("Helvetica").fontSize(7.8);

      const descLines = wrapDescription(doc, r.description || "Wallet transaction", descW, 2);

      const rowH = Math.max(26, descLines.length * 10 + 12);

      if (y + rowH > pageH - BOTTOM_LIMIT_OFFSET) {
        doc.addPage();
        drawHeaderBand();
        y = drawTableHeader(HEADER_BAND_H + 24);
      }

      if (rowIndex % 2 === 1) {
        doc.rect(PAGE_MARGIN, y, contentW, rowH).fill(ZEBRA);
      }
      doc.rect(PAGE_MARGIN, y + rowH, contentW, 0.5).fill(LINE);

      let x = PAGE_MARGIN + 6;
      const baseline = y + 7;

      doc
        .font("Helvetica-Bold")
        .fontSize(7.6)
        .fillColor(INK)
        .text(dateFmt(r.created_at), x, baseline, { width: COLS[0].width - 8 });
      doc
        .font("Helvetica")
        .fontSize(6.6)
        .fillColor(FAINT)
        .text(timeFmt(r.created_at), x, baseline + 10, { width: COLS[0].width - 8 });
      x += COLS[0].width;

      // pdfkit renders string[] at runtime; its types only declare string.
      doc.font("Helvetica").fontSize(7.8).fillColor(INK);

      descLines.forEach((line, index) => {
        doc.text(line, x, baseline + index * 10, {
          width: descW,
          lineGap: 1.5,
        });
      });

      x += COLS[1].width;

doc
  .font("Helvetica")
  .fontSize(7)
  .fillColor(MUTED)
  .text(categoryLabel(r).toUpperCase(), x, baseline, {
    width: COLS[2].width - 8,
  });
x += COLS[2].width;

doc
  .font("Helvetica")
  .fontSize(7.2)
  .fillColor(r.status === "completed" ? GREEN : MUTED)
  .text(r.status.toUpperCase(), x, baseline, {
    width: COLS[3].width - 8,
  });
x += COLS[3].width;

doc
  .font("Helvetica-Bold")
  .fontSize(8)
  .fillColor(amount >= 0 ? GREEN : INK)
  .text(`${amount >= 0 ? "+" : "-"}${creditsFmt(amount)}`, x, baseline, {
    width: COLS[4].width - 8,
    align: "right",
  });

x += COLS[4].width;

doc
  .font("Helvetica")
  .fontSize(7.6)
  .fillColor(INK)
  .text(creditsFmt(toNumber(r.balance_after)), x, baseline, {
    width: COLS[5].width - 8,
    align: "right",
  });

      y += rowH + 0.5;
      rowIndex += 1;
    }

    if (input.rows.length === 0) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(MUTED)
        .text("No transactions were found for the selected filters.", PAGE_MARGIN, y + 14);
    }

    // ---- Footers on every page ---------------------------------------------
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      doc.rect(PAGE_MARGIN, pageH - 40, contentW, 0.5).fill(LINE);
      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor(FAINT)
        .text("Rahvana Wallet - official credit statement - rahvana.com", PAGE_MARGIN, pageH - 30);
      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor(FAINT)
        .text(`Page ${i + 1} of ${range.count}`, PAGE_MARGIN, pageH - 30, {
          align: "right",
          width: contentW,
        });
    }

    doc.end();
  });
}

/** Compact category label for the PDF (mirrors lib/wallet/transactions.ts). */
function categoryLabel(r: LedgerTransaction): string {
  switch (r.transaction_type) {
    case "top_up":
      return "Top-Up";
    case "bonus":
      return "Bonus";
    case "tool_launch":
      return "Tool Unlock";
    case "guide_unlock":
      return "Guide Unlock";
    case "service_booking":
      return "Service";
    case "refund":
      return "Refund";
    default:
      return "Adjustment";
  }
}

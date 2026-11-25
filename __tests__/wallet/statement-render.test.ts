/**
 * Statement PDF rendering regression test.
*/

import zlib from "zlib";
import {
  renderStatement,
  type StatementInput,
} from "@/app/api/wallet/transactions/statement/route";
import type { LedgerTransaction } from "@/lib/wallet/transactions";

function tx(over: Partial<LedgerTransaction>): LedgerTransaction {
  return {
    id: "e9797fc5-0e6b-42a9-bd9f-185a8d5e00a8",
    transaction_type: "top_up",
    amount: "500.00",
    amount_usd: "500.00",
    balance_before: "0.00",
    balance_after: "500.00",
    description: "Wallet top-up",
    resource_type: "wallet",
    resource_id: null,
    status: "completed",
    created_at: "2026-10-20T14:45:00.000Z",
    ...over,
  };
}

/** All FlateDecoded content streams, plus their hex-decoded TJ/Tj text. */
function decodePdf(buffer: Buffer): { streams: string[]; text: string } {
  const raw = buffer.toString("latin1");
  const streams: string[] = [];
  const re = /stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const start = m.index + m[0].length;
    const end = raw.indexOf("endstream", start);
    if (end === -1) continue;
    try {
      const infl = zlib
        .inflateSync(Buffer.from(raw.slice(start, end), "latin1"))
        .toString("latin1");
      if (/TJ|Tj/.test(infl)) streams.push(infl);
    } catch {
      /* non-deflate stream */
    }
  }
  // pdfkit splits TJ strings into kerned fragments (single-byte hex chunks
  // too), so compare whitespace-collapsed text.
  const text = streams
    .map((s) =>
      [...s.matchAll(/<([0-9a-fA-F]{2,})>/g)]
        .map((h) =>
          (h[1].match(/.{2}/g) ?? []).map((b) => String.fromCharCode(parseInt(b, 16))).join("")
        )
        .join("")
    )
    .join(" ");
  return { streams, text };
}

const collapse = (s: string) => s.replace(/\s+/g, "");

/** Physical page count from the (uncompressed) page-object dictionaries. */
function pageCount(pdf: Buffer): number {
  return (pdf.toString("latin1").match(/\/Type\s*\/Page(?![s])/g) ?? []).length;
}

describe("wallet statement PDF", () => {
  const input: StatementInput = {
    accountName: "Test Account",
    email: "test@rahvana.com",
    periodLabel: "All time",
    rows: [
      tx({}),
      tx({
        id: "884be03c-7b4a-4527-9954-abfc8603d867",
        transaction_type: "tool_launch",
        amount: "-250.00",
        amount_usd: "-250.00",
        balance_before: "500.00",
        balance_after: "250.00",
        description: "Passport Photo Checker analysis",
        resource_type: "tool",
        status: "completed",
      }),
    ],
    truncated: false,
    openingBalance: 0,
    closingBalance: 250,
    totalAdded: 500,
    totalSpent: 250,
    completedCount: 2,
    pendingCount: 0,
  };

  it("renders text runs with explicit color operators (not inherited white)", async () => {
    const pdf = await renderStatement(input);
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");

    const { streams, text } = decodePdf(pdf);
    expect(streams.length).toBeGreaterThanOrEqual(1);

    // Visible content: title, summary panel, account block, and row data
    // all made it onto the page (the original bug produced headers only).
    const flat = collapse(text);
    expect(flat).toContain("CreditWalletStatement");
    expect(flat).toContain("TestAccount");
    expect(flat).toContain("OPENINGBALANCE");
    expect(flat).toContain("Wallettop-up");
    expect(flat).toContain("PassportPhotoCheckeranalysis");
    expect(flat).toContain("Page1of1");

    // Every color must emit an scn operator; "#0D7377" (TEAL) is
    // 0.050980... 0.450980... 0.466666... in DeviceRGB. A comma-string
    // regression would silently drop these.
    const coloredOps = streams.join("").match(/\b[\d.]+ [\d.]+ [\d.]+ scn\b/g) ?? [];
    expect(coloredOps.length).toBeGreaterThanOrEqual(8);
    expect(coloredOps.some((op) => op.startsWith("0.05098039215686274"))).toBe(true);

    // No phantom pages: footers sit below the content area by design, and
    // pdfkit's auto-pagination used to inject two extra pages for them.
    expect(pageCount(pdf)).toBe(1);
  });

  it("paginates long ledgers without extra trailing pages", async () => {
    const many = Array.from({ length: 45 }, (_, i) =>
      tx({
        id: `11111111-0000-4000-8000-00000000${String(i).padStart(2, "0")}`,
        amount: "-10.00",
        amount_usd: "-10.00",
        balance_before: String(500 - i * 10),
        balance_after: String(490 - i * 10),
        description: `Tool credit deduction number ${i + 1}`,
        transaction_type: "tool_launch" as const,
      })
    );
    const pdf = await renderStatement({ ...input, rows: many, closingBalance: 50 });

    // 45 wrapped rows overflow onto multiple pages, but every page must
    // carry real content - never a blank trailing page.
    const pages = pageCount(pdf);
    expect(pages).toBeGreaterThanOrEqual(2);

    const { streams, text } = decodePdf(pdf);
    expect(streams.length).toBe(pages);
    streams.forEach((stream) => {
      expect(collapse(stream).length).toBeGreaterThan(100);
    });

    const flat = collapse(text);
    expect(flat).toContain(`Page1of${pages}`);
    expect(flat).toContain(`Page${pages}of${pages}`);
    expect(flat).toContain("Toolcreditdeductionnumber45");
    // Summary panel lives on page 1, right under the statement title.
    expect(flat).toContain("OPENINGBALANCE");
  });

  it("never emits bare color-less fill after white text was the last state", async () => {
    const pdf = await renderStatement(input);
    const body = decodePdf(pdf).streams.join("\n");
    // The palette strings must all parse: no leftover "r,g,b" text leaking
    // into the content stream as a PDFName (the broken form).
    expect(body).not.toMatch(/\/(?:16,35,60|13,115,119|4,58,62)\b/);
  });
});

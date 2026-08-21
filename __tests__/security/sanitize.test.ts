/** @jest-environment jsdom */

import { sanitizeHtml, escapeHtml } from "@/lib/security/sanitize";

describe("sanitizeHtml", () => {
  it("removes script tags", () => {
    const result = sanitizeHtml('<script>alert("XSS")</script>Hello');
    expect(result).not.toMatch(/<script/i);
    expect(result).toContain("Hello");
  });

  it("removes event handlers", () => {
    expect(sanitizeHtml('<img src="x" onerror="alert(1)">')).not.toMatch(/onerror/i);
  });

  it("removes javascript: URLs", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">Click</a>')).not.toMatch(/javascript:/i);
  });

  it("removes iframes", () => {
    expect(sanitizeHtml('<iframe src="javascript:alert(1)"></iframe>')).not.toMatch(/iframe/i);
  });

  it("removes svg onload payloads", () => {
    expect(sanitizeHtml('<svg onload="alert(1)"></svg>')).not.toMatch(/onload/i);
  });

  it("handles parser breakout payloads", () => {
    expect(sanitizeHtml("</xmp><img src=x onerror=alert(1)>")).not.toMatch(/onerror/i);
  });

  it("does not use IN_PLACE mutation of attacker nodes", () => {
    const source = fsReadSanitizeSource();
    expect(source).not.toMatch(/IN_PLACE\s*:\s*true/);
  });

  it("preserves safe formatting", () => {
    expect(sanitizeHtml("<p>Hello <strong>World</strong></p>")).toBe(
      "<p>Hello <strong>World</strong></p>"
    );
  });

  it("preserves journey tutorial images with relative src", () => {
    const html =
      '<img src="/assets/images/ir1-journey/c1_step11/1-click-button.png" alt="Step" style="width:100%;" />';
    expect(sanitizeHtml(html)).toContain(
      'src="/assets/images/ir1-journey/c1_step11/1-click-button.png"'
    );
  });

  it("returns empty string for null/undefined", () => {
    expect(sanitizeHtml(null)).toBe("");
    expect(sanitizeHtml(undefined)).toBe("");
    expect(sanitizeHtml("")).toBe("");
  });
});

describe("escapeHtml", () => {
  it("escapes angle brackets and quotes", () => {
    expect(escapeHtml('<b class="x">')).toBe("&lt;b class=&quot;x&quot;&gt;");
  });

  it("does not treat escaped text as HTML", () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).not.toContain("<img");
  });
});

function fsReadSanitizeSource() {
  const { readFileSync } = require("node:fs");
  const { join } = require("node:path");
  return readFileSync(join(process.cwd(), "lib/security/sanitize.ts"), "utf8");
}
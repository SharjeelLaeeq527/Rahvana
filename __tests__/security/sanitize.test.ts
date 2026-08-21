import { sanitizeHtml, escapeHtml } from "@/lib/security/sanitize";

describe("sanitizeHtml", () => {
  it("removes script tags", () => {
    expect(sanitizeHtml('<script>alert("XSS")</script>')).not.toMatch(/script/i);
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

  it("preserves safe formatting", () => {
    expect(sanitizeHtml("<p>Hello <strong>World</strong></p>")).toBe(
      "<p>Hello <strong>World</strong></p>"
    );
  });

  it("handles parser breakout payloads", () => {
    expect(sanitizeHtml("</xmp><img src=x onerror=alert(1)>")).not.toMatch(/onerror/i);
  });

  it("preserves journey tutorial images", () => {
    const html =
      '<img src="/assets/images/ir1-journey/c1_step11/1-click-button.png" alt="Step" style="width:100%;" />';
    expect(sanitizeHtml(html)).toContain(
      'src="/assets/images/ir1-journey/c1_step11/1-click-button.png"'
    );
  });
});

describe("escapeHtml", () => {
  it("escapes angle brackets", () => {
    expect(escapeHtml("<b>")).toBe("&lt;b&gt;");
  });
});

import { safeRedirectPath } from "@/lib/security/safeRedirect";

describe("safeRedirectPath", () => {
  it("allows same-origin relative paths", () => {
    expect(safeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("/visa-category/ir-1?x=1")).toBe("/visa-category/ir-1?x=1");
  });

  it("rejects absolute URLs", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/");
    expect(safeRedirectPath("http://evil.com/phish")).toBe("/");
  });

  it("rejects protocol-relative URLs", () => {
    expect(safeRedirectPath("//evil.com")).toBe("/");
  });

  it("rejects missing / non-string values", () => {
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath(undefined)).toBe("/");
    expect(safeRedirectPath("")).toBe("/");
  });

  it("uses a custom fallback", () => {
    expect(safeRedirectPath("https://evil.com", "/login")).toBe("/login");
  });
});
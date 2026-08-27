import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("pdfjs-dist pin", () => {
  it("pins pdfjs-dist to the patched release in package.json", () => {
    const pkg = JSON.parse(read("package.json"));
    expect(pkg.dependencies["pdfjs-dist"]).toBe("6.2.108");
    expect(pkg.overrides["pdfjs-dist"]).toBe("6.2.108");
  });

  it("does not load the worker from cdnjs (supply-chain / version skew)", () => {
    const client = read("lib/pdfjs/client.ts");
    expect(client).not.toMatch(/cdnjs\.cloudflare\.com/);
    expect(client).toMatch(/pdf\.worker\.min\.mjs/);
  });

  it("disables PDF JavaScript execution (CVE-2026-16633)", () => {
    const client = read("lib/pdfjs/client.ts");
    expect(client).toMatch(/enableScripting:\s*false/);
    expect(client).toMatch(/isEvalSupported:\s*false/);
  });
});

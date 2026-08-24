import { NextRequest } from "next/server";
import { assertRequestBodySize, assertMiddlewareBodySize } from "@/lib/security/request-body";
import { GLOBAL_API_BODY_LIMIT_BYTES } from "@/lib/security/upload-limits";

function req(method: string, contentLength?: string) {
  const headers: Record<string, string> = {};
  if (contentLength !== undefined) headers["content-length"] = contentLength;
  return new NextRequest("http://localhost:3000/api/documents/upload", { method, headers });
}

describe("assertRequestBodySize", () => {
  it("allows requests under the cap", () => {
    expect(assertRequestBodySize(req("POST", String(1024)))).toBeNull();
  });

  it("returns 413 when Content-Length exceeds the cap", () => {
    const res = assertRequestBodySize(req("POST", String(GLOBAL_API_BODY_LIMIT_BYTES + 1)));
    expect(res).not.toBeNull();
    expect(res?.status).toBe(413);
  });

  it("does not block when Content-Length is missing", () => {
    expect(assertRequestBodySize(req("POST"))).toBeNull();
  });
});

describe("assertMiddlewareBodySize", () => {
  it("ignores GET", () => {
    expect(
      assertMiddlewareBodySize(req("GET", String(GLOBAL_API_BODY_LIMIT_BYTES + 1)))
    ).toBeNull();
  });

  it("blocks oversized POST", () => {
    const res = assertMiddlewareBodySize(req("POST", String(GLOBAL_API_BODY_LIMIT_BYTES + 1)));
    expect(res?.status).toBe(413);
  });
});

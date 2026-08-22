import { NextRequest, NextResponse } from "next/server";
import { GLOBAL_API_BODY_LIMIT_BYTES } from "@/lib/security/upload-limits";

function parseContentLength(request: NextRequest | Request): number | null {
  const raw = request.headers.get("content-length");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Reject oversized bodies using Content-Length before buffering.
 * Call this at the top of every upload route (and in middleware for /api).
 */
export function assertRequestBodySize(
  request: NextRequest | Request,
  maxBytes: number = GLOBAL_API_BODY_LIMIT_BYTES
): NextResponse | null {
  const contentLength = parseContentLength(request);
  if (contentLength !== null && contentLength > maxBytes) {
    return NextResponse.json(
      { error: `Request body too large (max ${Math.floor(maxBytes / (1024 * 1024))}MB)` },
      { status: 413 }
    );
  }
  return null;
}

/** Middleware helper — returns a Response when blocked, else null. */
export function assertMiddlewareBodySize(
  request: NextRequest,
  maxBytes: number = GLOBAL_API_BODY_LIMIT_BYTES
): NextResponse | null {
  const method = request.method.toUpperCase();
  if (!["POST", "PUT", "PATCH"].includes(method)) {
    return null;
  }

  const contentLength = parseContentLength(request);
  if (contentLength !== null && contentLength > maxBytes) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }
  return null;
}

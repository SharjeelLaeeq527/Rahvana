import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "./lib/supabase/middleware";
import { assertMiddlewareBodySize } from "@/lib/security/request-body";

/**
 * Paid/private route prefixes.
 *
 * Any request whose pathname starts with one of these receives:
 *   X-Robots-Tag: noindex, nofollow
 *
 * This is Layer 3 of the 3-layer crawler guard:
 *   1. app/robots.ts         — Disallow directives for crawlers
 *   2. <meta noindex>        — Per-page metadata on paid pages
 *   3. X-Robots-Tag header   — THIS LAYER — server-enforced, always runs
 *                              before any HTML is delivered to the crawler.
 */
const PRIVATE_PREFIXES = [
  // Auth / personal
  "/dashboard",
  "/user-dashboard",
  "/my-journeys",
  "/profile",
  "/settings",
  // Premium tools
  "/portal-wallet",
  "/ir-1-roadmap",
  "/document-vault",
  "/document-translation",
  "/police-verification",
  "/interview-prep",
  "/visa-case-strength-checker",
  "/visa-forms",
  "/affidavit-support-calculator",
  "/pdf-processing",
  "/passport",
  "/case-status",
  "/book-appointment",
  "/courier-registration",
  "/221g-action-planner",
  "/passport-ocr",
  // Transactions
  "/payment",
  // Admin / internal
  "/admin",
  "/tools",
  "/iv-tool",
  "/custom-requirements",
  // Paid guide sub-routes
  "/guides/my-guides",
  "/guides/visa-strength-guide",
  "/guides/asset-document-guide",
  "/guides/employment-certificate-guide",
  "/guides/bona-marriage-guide",
  "/guides/educational-certificates-us-visa",
  "/guides/step-parent-guide",
  "/guides/adoptive-parent-guide",
  // Result pages (paid output)
  "/visa-checker/result",
  "/interview-prep/result",
  "/interview-prep/my-sessions",
  "/visa-case-strength-checker/result",
  "/visa-case-strength-checker/my-cases",
  "/affidavit-support-calculator/guide",
  "/document-vault/guide",
  "/police-verification/apply",
  // Dev / test pages
  "/progress-tree-demo",
  "/test-option-a",
  "/test-option-b",
] as const;

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const blocked = assertMiddlewareBodySize(request);
    if (blocked) return blocked;
  }

  const { pathname } = request.nextUrl;

  // Run the Supabase session refresh first (existing behavior)
  const response = await updateSession(request);

  // Layer 3: inject X-Robots-Tag for all private/paid routes.
  // This is a server-enforced response header — crawlers see it before
  // reading any page HTML, making it impossible to accidentally index
  // paid content even if the page renders without JS.
  if (isPrivatePath(pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

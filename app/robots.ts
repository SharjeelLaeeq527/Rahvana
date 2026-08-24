import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rahvana.com";

/**
 * Dynamic robots.txt for Rahvana.
 *
 * Strategy:
 *   - Allow all crawlers on all public/marketing pages.
 *   - Disallow paid, auth-required, private, and dev/test routes.
 *   - Explicitly allow Google AI Overview bot (Googlebot-Extended) and
 *     Perplexity's crawler so they can cite Rahvana in AI search results (GEO).
 *
 * This is Layer 1 of a 3-layer crawler guard:
 *   1. robots.txt      — tells crawlers what to skip
 *   2. <meta noindex>  — belt-and-suspenders per paid page
 *   3. X-Robots-Tag    — server-enforced header (middleware.ts)
 */
export default function robots(): MetadataRoute.Robots {
  const privatePaths = [
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
    "/api",
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
    // Dev / test
    "/progress-tree-demo",
    "/test-option-a",
    "/test-option-b",
  ];

  return {
    rules: [
      // Default: allow everything, disallow private paths
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
      // Explicitly allow Google's AI Overview crawler (used for AI Overviews citations)
      {
        userAgent: "Googlebot-Extended",
        allow: "/",
        disallow: privatePaths,
      },
      // Explicitly allow Perplexity AI crawler for AI referral citations
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: privatePaths,
      },
      // Allow GPTBot (OpenAI / ChatGPT citations)
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: privatePaths,
      },
      // Allow Claude's crawler (Anthropic)
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: privatePaths,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

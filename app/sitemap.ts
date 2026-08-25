import type { MetadataRoute } from "next";
import { ARTICLES } from "@/data/articles";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rahvana.com";

/**
 * Dynamic sitemap.xml for Rahvana.
 *
 * Only includes publicly crawlable pages. Paid, auth-gated, and dev routes
 * are excluded — those pages carry `noindex` metadata + X-Robots-Tag headers
 * as belt-and-suspenders protection.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const blogPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    ...ARTICLES.map((art) => ({
      url: `${SITE_URL}/blog/${art.slug}`,
      lastModified: new Date(art.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  const staticPages: MetadataRoute.Sitemap = [
    // ── Primary ────────────────────────────────────────────────────────────────
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },

    // ── High-intent commercial ─────────────────────────────────────────────────
    {
      url: `${SITE_URL}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/services`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/visa-eligibility`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },

    // ── Per-visa journey pages ─────────────────────────────────────────────────
    // These are the most valuable long-tail SEO targets ("IR-1 visa steps", etc.)
    {
      url: `${SITE_URL}/visa-category/ir-1`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/visa-category/ir-5`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/visa-category/ir-2`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/visa-category/f-1`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/visa-category`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },

    // ── Brand / informational ──────────────────────────────────────────────────
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/resources`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // ── Public guides (teaser content — crawlable shells) ─────────────────────
    {
      url: `${SITE_URL}/guides`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/guides/passport-guide`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/guides/nikah-nama-guide`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/guides/birth-certificate-guide`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/guides/cnic-guide`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/guides/frc-guide`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/guides/police-certificate`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${SITE_URL}/guides/polio-vaccination-guide`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${SITE_URL}/guides/police-verification-guide`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    },

    // ── Legal ──────────────────────────────────────────────────────────────────
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/cookie-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/acceptable-use`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  return [...staticPages, ...blogPages];
}


/**
 * JsonLd — Reusable structured data injector for Schema.org JSON-LD.
 *
 * Usage:
 *   import { JsonLd } from "@/app/components/seo/JsonLd";
 *
 *   <JsonLd schema={{ "@context": "https://schema.org", "@type": "Organization", ... }} />
 *
 * Always render this as a Server Component (no "use client") so the
 * <script> tag is present in the initial HTML and visible to crawlers
 * before any JS executes.
 */

interface JsonLdProps {
  schema: Record<string, unknown> | Record<string, unknown>[];
}

export function JsonLd({ schema }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled JSON-LD schema
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
